import { supabase } from "@/lib/supabase";
import { StorageManager } from "./storage-manager";

export interface SyncPayload<T = unknown> {
  data: T;
  updatedAt: number;
}

const REMOTE_STORE_KEYS: Record<string, string> = {
  portfolio: StorageManager.KEYS.PORTFOLIO,
  goals: StorageManager.KEYS.GOALS,
  goalLedger: StorageManager.KEYS.GOAL_LEDGER,
  behaviourProfile: StorageManager.KEYS.BEHAVIOUR_PROFILE,
};

export class CloudSyncService {
  private static async getUserId(): Promise<string | null> {
    try {
      const res = await supabase.auth.getUser();
      const user = res?.data?.user;
      if (!user) return null;
      return user.id;
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
      const wasSaved = !error;

      if (wasSaved) {
        const localStoreKey = REMOTE_STORE_KEYS[storeKey] ?? storeKey;
        StorageManager.set(`${localStoreKey}_sync_meta`, payload);
      }

      return wasSaved;
    } catch (err) {
      console.error(`[CloudSync] Failed to push store ${storeKey}:`, err);
      return false;
    }
  }

  static async pullRemoteState(): Promise<boolean> {
    const userId = await this.getUserId();
    if (!userId) return false;

    try {
      const { data: rows, error } = await supabase
        .from("user_sync_data")
        .select("data, store_key, payload")
        .eq("user_id", userId);

      if (error || !Array.isArray(rows)) return false;

      for (const row of rows) {
        if (!row) continue;

        const localStoreKey = REMOTE_STORE_KEYS[row.store_key];
        if (!localStoreKey) continue;

        const rawPayload = row.payload ?? row.data;
        if (!rawPayload) continue;

        const isEnvelope =
          typeof rawPayload === "object" &&
          rawPayload !== null &&
          "data" in rawPayload &&
          "updatedAt" in rawPayload;

        const remoteData = isEnvelope ? rawPayload.data : rawPayload;
        const remoteUpdatedAt = isEnvelope ? rawPayload.updatedAt : Date.now();

        const localData = StorageManager.get(localStoreKey, null);
        const localEnvelope = StorageManager.get<SyncPayload | null>(
          `${localStoreKey}_sync_meta`,
          null as unknown as SyncPayload
        );

        const shouldApply =
          localData === null ||
          !localEnvelope?.updatedAt ||
          remoteUpdatedAt >= localEnvelope.updatedAt;

        if (shouldApply) {
          StorageManager.set(localStoreKey, remoteData);
          StorageManager.set(`${localStoreKey}_sync_meta`, {
            data: remoteData,
            updatedAt: remoteUpdatedAt,
          });
        }
      }
      return true;
    } catch (err) {
      console.error("[CloudSync] Failed to pull remote state:", err);
      return false;
    }
  }
}
