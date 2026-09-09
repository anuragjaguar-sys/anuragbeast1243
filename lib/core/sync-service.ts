import { supabase } from "@/lib/supabase";
import { StorageManager } from "@/lib/core/storage-manager";

export type UserCloudPayload = {
  goals?: unknown;
  portfolio?: unknown;
  monthlyReviews?: unknown;
  behaviourProfile?: unknown;
  goalLedger?: unknown;
};

/**
 * Synchronizes local client stores with the authenticated user's remote profile record.
 */
export class CloudSyncService {
  /**
   * Pulls remote snapshot data from Supabase and hydrates local StorageManager keys.
   */
  public static async pullRemoteState(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from("profiles")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data || !data.data) {
        return false;
      }

      const remote = data.data as Record<string, unknown>;

      if (remote.goals) {
        StorageManager.set(StorageManager.KEYS.GOALS, remote.goals);
      }
      if (remote.portfolio) {
        StorageManager.set(StorageManager.KEYS.PORTFOLIO, remote.portfolio);
      }
      if (remote.monthlyReviews) {
        StorageManager.set(StorageManager.KEYS.MONTHLY_REVIEWS, remote.monthlyReviews);
      }
      if (remote.behaviourProfile) {
        StorageManager.set(StorageManager.KEYS.BEHAVIOUR_PROFILE, remote.behaviourProfile);
      }
      if (remote.goalLedger) {
        StorageManager.set(StorageManager.KEYS.GOAL_LEDGER, remote.goalLedger);
      }

      return true;
    } catch (err) {
      console.warn("[CloudSyncService] pullRemoteState failed, using local cache:", err);
      return false;
    }
  }

  /**
   * Pushes a snapshot of a specific domain store to Supabase remote profile record.
   */
  public static async pushStore(key: keyof UserCloudPayload, value: unknown): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from("profiles")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle();

      const existingData = (data?.data || {}) as Record<string, unknown>;
      existingData[key] = value;

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            data: existingData,
          },
          { onConflict: "user_id" }
        );

      if (error) {
        console.error(`[CloudSyncService] Failed to push store "${key}":`, error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.warn(`[CloudSyncService] pushStore failed for "${key}":`, err);
      return false;
    }
  }
}
