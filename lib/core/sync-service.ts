import { supabase } from "@/lib/supabase";
import { StorageManager } from "./storage-manager";

export interface SyncPayload<T = unknown> {
  data: T;
  updatedAt: number;
}

const STORE_KEY_MAP: Record<string, string> = {
  portfolio: StorageManager.KEYS.PORTFOLIO,
  goals: StorageManager.KEYS.GOALS,
  goalLedger: StorageManager.KEYS.GOAL_LEDGER,
  monthlyReviews: StorageManager.KEYS.MONTHLY_REVIEWS,
  behaviourProfile: StorageManager.KEYS.BEHAVIOUR_PROFILE,
  profile: StorageManager.KEYS.PROFILE,
};

export class CloudSyncService {
  public static async getUserEmail(): Promise<string | null> {
    try {
      const res = await supabase.auth.getUser();
      return res?.data?.user?.email ?? null;
    } catch {
      return null;
    }
  }

  public static async getUserId(): Promise<string | null> {
    try {
      const res = await supabase.auth.getUser();
      return res?.data?.user?.id ?? null;
    } catch {
      return null;
    }
  }

  static async pushStore<T>(storeKey: string, data: T): Promise<boolean> {
    const userId = await this.getUserId();
    if (!userId) return false;

    const payload: SyncPayload<T> = {
      data,
      updatedAt: Date.now(),
    };

    try {
      const { error } = await supabase.from("user_sync_data").upsert(
        {
          user_id: userId,
          store_key: storeKey,
          payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,store_key" }
      );
      if (error) {
        console.error(`[CloudSync] Upsert error on ${storeKey}:`, error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[CloudSync] Failed to push store ${storeKey}:`, err);
      return false;
    }
  }

  static async pushAllLocal(): Promise<boolean> {
    const userId = await this.getUserId();
    if (!userId) return false;

    try {
      const portfolio = StorageManager.get(StorageManager.KEYS.PORTFOLIO, []);
      if (Array.isArray(portfolio) && portfolio.length > 0) {
        await this.pushStore("portfolio", portfolio);
      }

      const goals = StorageManager.get(StorageManager.KEYS.GOALS, []);
      if (Array.isArray(goals) && goals.length > 0) {
        await this.pushStore("goals", goals);
      }

      const monthlyReviews = StorageManager.get(StorageManager.KEYS.MONTHLY_REVIEWS, {});
      if (monthlyReviews && typeof monthlyReviews === "object" && Object.keys(monthlyReviews).length > 0) {
        await this.pushStore("monthlyReviews", monthlyReviews);
      }

      const behaviour = StorageManager.get(StorageManager.KEYS.BEHAVIOUR_PROFILE, null);
      if (behaviour) {
        await this.pushStore("behaviourProfile", behaviour);
      }

      const ledger = StorageManager.get(StorageManager.KEYS.GOAL_LEDGER, null);
      if (ledger) {
        await this.pushStore("goalLedger", ledger);
      }

      return true;
    } catch (err) {
      console.error("[CloudSync] pushAllLocal failed:", err);
      return false;
    }
  }

  static async pullRemoteState(): Promise<boolean> {
    const userId = await this.getUserId();
    if (!userId) return false;

    try {
      const { data: rows, error } = await supabase
        .from("user_sync_data")
        .select("store_key, payload, updated_at")
        .eq("user_id", userId);

      if (error || !rows) {
        console.error("[CloudSync] Error fetching user_sync_data:", error?.message);
        return false;
      }

      for (const row of rows) {
        if (!row || !row.store_key) continue;
        const rawPayload = row.payload as any;
        if (!rawPayload) continue;

        const isEnvelope =
          typeof rawPayload === "object" &&
          rawPayload !== null &&
          "data" in rawPayload &&
          "updatedAt" in rawPayload;

        const remoteData = isEnvelope ? rawPayload.data : rawPayload;
        const remoteUpdatedAt = isEnvelope ? rawPayload.updatedAt : Date.now();

        const canonicalKey = STORE_KEY_MAP[row.store_key] || row.store_key;

        StorageManager.set(canonicalKey, remoteData);
        StorageManager.set(row.store_key, remoteData);
        StorageManager.set(`${row.store_key}_sync_meta`, {
          data: remoteData,
          updatedAt: remoteUpdatedAt,
        });
      }

      try {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("data")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileRow?.data) {
          StorageManager.set(StorageManager.KEYS.PROFILE, profileRow.data);
        }
      } catch (pErr) {
        console.warn("[CloudSync] Profile pull warning:", pErr);
      }

      // Notify all open pages to re-render immediately
      window.dispatchEvent(new Event("fire54_remote_data_updated"));
      return true;
    } catch (err) {
      console.error("[CloudSync] Failed to pull remote state:", err);
      return false;
    }
  }

  // Live real-time listener: triggers whenever a write happens on Supabase
  static subscribeToRealtime(): () => void {
    try {
      const channel = supabase
        .channel("fire54_realtime_sync")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_sync_data",
          },
          () => {
            void this.pullRemoteState();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      return () => {};
    }
  }
}
