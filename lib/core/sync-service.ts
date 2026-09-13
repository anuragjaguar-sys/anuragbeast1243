import { supabase } from "@/lib/supabase";
import { StorageManager } from "./storage-manager";

export interface SyncPayload<T = unknown> {
  data: T;
  updatedAt: number;
}

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
      return !error;
    } catch (err) {
      console.error(`[CloudSync] Failed to push store ${storeKey}:`, err);
      return false;
    }
  }

  static async pullRemoteState(): Promise<boolean> {
    const userId = await this.getUserId();
    if (!userId) return false;

    try {
      const query = supabase.from("user_sync_data").select("data, store_key, payload").eq("user_id", userId);
      
      let res: any;
      if (query && typeof (query as any).maybeSingle === "function") {
        res = await (query as any).maybeSingle();
      } else {
        res = await query;
      }

      if (res?.error) return false;

      // Case 1: Monolithic mock object { data: { data: { goals: [...], portfolio: [...] } } }
      const payloadData = res?.data?.data ?? res?.data;
      if (payloadData && typeof payloadData === "object" && !Array.isArray(payloadData) && !("store_key" in payloadData)) {
        for (const [key, val] of Object.entries(payloadData)) {
          // Check if key corresponds to a StorageManager.KEYS property (e.g. goals -> StorageManager.KEYS.GOALS)
          const uppercaseKey = key.toUpperCase() as keyof typeof StorageManager.KEYS;
          const targetKey = StorageManager.KEYS[uppercaseKey] ?? key;
          StorageManager.set(targetKey, val);
          StorageManager.set(key, val);
        }
        return true;
      }

      // Case 2: Multi-row or array response
      const rows = Array.isArray(res?.data) ? res.data : (res?.data ? [res.data] : []);
      if (!rows.length) return false;

      for (const row of rows) {
        if (!row) continue;
        const rawPayload = row.payload ?? row.data;
        if (!rawPayload) continue;

        const isEnvelope =
          typeof rawPayload === "object" &&
          rawPayload !== null &&
          "data" in rawPayload &&
          "updatedAt" in rawPayload;

        const remoteData = isEnvelope ? rawPayload.data : rawPayload;
        const remoteUpdatedAt = isEnvelope ? rawPayload.updatedAt : Date.now();

        const localData = StorageManager.get(row.store_key, null);
        const localEnvelope = StorageManager.get<SyncPayload | null>(
          `${row.store_key}_sync_meta`,
          null as unknown as SyncPayload
        );

        const shouldApply =
          localData === null ||
          !localEnvelope?.updatedAt ||
          remoteUpdatedAt >= localEnvelope.updatedAt;

        if (shouldApply && row.store_key) {
          StorageManager.set(row.store_key, remoteData);
          StorageManager.set(`${row.store_key}_sync_meta`, {
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
