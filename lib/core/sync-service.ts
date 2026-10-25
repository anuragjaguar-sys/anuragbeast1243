import { supabase } from "@/lib/supabase";
import { StorageManager } from "./storage-manager";

export interface SyncPayload<T = unknown> {
  version: 1;
  data: T;
  updatedAt: number;
}

interface SyncMetadata<T = unknown> extends SyncPayload<T> {
  pending: boolean;
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
  private static metadataKey(storeKey: string): string {
    return `${storeKey}_sync_meta`;
  }

  private static hasSameData(left: unknown, right: unknown): boolean {
    try {
      return JSON.stringify(left) === JSON.stringify(right);
    } catch {
      return false;
    }
  }

  private static notifyRemoteDataUpdated(): void {
    if (
      typeof window !== "undefined" &&
      typeof window.dispatchEvent === "function"
    ) {
      window.dispatchEvent(new Event("fire54_remote_data_updated"));
    }
  }

  private static updatedAtFromPayload(
    payload: unknown,
    updatedAt: string | null | undefined
  ): number {
    if (
      typeof payload === "object" &&
      payload !== null &&
      "updatedAt" in payload &&
      typeof payload.updatedAt === "number" &&
      Number.isFinite(payload.updatedAt)
    ) {
      return payload.updatedAt;
    }

    const parsed = updatedAt ? Date.parse(updatedAt) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : 0;
  }

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

    const previous = StorageManager.get<SyncMetadata<T> | null>(
      this.metadataKey(storeKey),
      null
    );
    const updatedAt =
      previous?.pending && this.hasSameData(previous.data, data)
        ? previous.updatedAt
        : Date.now();
    const payload: SyncPayload<T> = {
      version: 1,
      data,
      updatedAt,
    };

    // Record local intent before the network request. If an older realtime
    // event arrives while this write is pending, pullRemoteState will not
    // overwrite the newer local edit.
    StorageManager.set<SyncMetadata<T>>(this.metadataKey(storeKey), {
      ...payload,
      pending: true,
    });

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
      StorageManager.set<SyncMetadata<T>>(this.metadataKey(storeKey), {
        ...payload,
        pending: false,
      });
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
      const results: boolean[] = [];
      const shouldPush = (storeKey: string, value: unknown): boolean => {
        const metadata = StorageManager.get<SyncMetadata | null>(
          this.metadataKey(storeKey),
          null
        );
        // No metadata means this is legacy/on-device data that has never been
        // uploaded. Pending metadata means a previous upload needs retrying.
        return value !== null && (!metadata || metadata.pending);
      };
      const portfolio = StorageManager.get(StorageManager.KEYS.PORTFOLIO, []);
      if (Array.isArray(portfolio) && portfolio.length > 0 && shouldPush("portfolio", portfolio)) {
        results.push(await this.pushStore("portfolio", portfolio));
      }

      const goals = StorageManager.get(StorageManager.KEYS.GOALS, []);
      if (Array.isArray(goals) && goals.length > 0 && shouldPush("goals", goals)) {
        results.push(await this.pushStore("goals", goals));
      }

      const monthlyReviews = StorageManager.get(StorageManager.KEYS.MONTHLY_REVIEWS, {});
      if (monthlyReviews && typeof monthlyReviews === "object" && Object.keys(monthlyReviews).length > 0 && shouldPush("monthlyReviews", monthlyReviews)) {
        results.push(await this.pushStore("monthlyReviews", monthlyReviews));
      }

      const behaviour = StorageManager.get(StorageManager.KEYS.BEHAVIOUR_PROFILE, null);
      if (behaviour && shouldPush("behaviourProfile", behaviour)) {
        results.push(await this.pushStore("behaviourProfile", behaviour));
      }

      const ledger = StorageManager.get(StorageManager.KEYS.GOAL_LEDGER, null);
      if (ledger && shouldPush("goalLedger", ledger)) {
        results.push(await this.pushStore("goalLedger", ledger));
      }

      return results.every(Boolean);
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
        const remoteUpdatedAt = this.updatedAtFromPayload(rawPayload, row.updated_at);

        const canonicalKey = STORE_KEY_MAP[row.store_key] || row.store_key;
        const localMetadata = StorageManager.get<SyncMetadata | null>(
          this.metadataKey(row.store_key),
          null
        );

        // Local edits win when they are newer. This handles delayed realtime
        // messages and makes the conflict policy explicit and deterministic.
        if (localMetadata && localMetadata.updatedAt > remoteUpdatedAt) {
          continue;
        }

        StorageManager.set(canonicalKey, remoteData);
        StorageManager.set(row.store_key, remoteData);
        StorageManager.set(this.metadataKey(row.store_key), {
          version: 1,
          data: remoteData,
          updatedAt: remoteUpdatedAt,
          pending: false,
        });
      }

      try {
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("data")
          .eq("user_id", userId)
          .limit(1);

        if (Array.isArray(profileRows) && profileRows.length > 0 && profileRows[0]?.data) {
          StorageManager.set(StorageManager.KEYS.PROFILE, profileRows[0].data);
          StorageManager.set("profile_sync_meta", {
            updatedAt: Date.now(),
          });
        }
      } catch (pErr) {
        console.warn("[CloudSync] Profile pull warning:", pErr);
      }

      // Notify all open pages to re-render immediately.
      this.notifyRemoteDataUpdated();
      return true;
    } catch (err) {
      console.error("[CloudSync] Failed to pull remote state:", err);
      return false;
    }
  }

  // Live real-time listener: triggers whenever a write happens on Supabase
  static subscribeToRealtime(): () => void {
    let disposed = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void this.getUserId().then((userId) => {
      if (!userId || disposed) return;

      try {
        channel = supabase
          .channel(`fire54_realtime_sync_${userId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "user_sync_data",
              filter: `user_id=eq.${userId}`,
            },
            () => {
              void this.pullRemoteState();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "profiles",
              filter: `user_id=eq.${userId}`,
            },
            () => {
              void this.pullRemoteState();
            }
          )
          .subscribe();
      } catch {
        channel = null;
      }
    });

    return () => {
      disposed = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }
}
