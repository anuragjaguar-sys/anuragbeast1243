import { supabase } from "@/lib/supabase";
import type { FinancialProfile } from "./profile.types";
import { DEFAULT_FINANCIAL_PROFILE } from "./profile";
import { StorageManager } from "@/lib/core/storage-manager";
import { CloudSyncService } from "@/lib/core/sync-service";

const PROFILE_KEY = StorageManager.KEYS.PROFILE;
const PROFILE_SYNC_META_KEY = "profile_sync_meta";

type ProfileSyncMetadata = {
  updatedAt: number;
};

export async function hasSavedFinancialProfile(): Promise<boolean> {
  // 1. Check local cache first for instant response
  const cached = StorageManager.get<FinancialProfile | null>(PROFILE_KEY, null);
  if (cached) return true;

  // 2. Check remote database if authenticated
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .limit(1);

    if (error) {
      return false;
    }

    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

export async function loadFinancialProfile(): Promise<FinancialProfile> {
  // Read local cache as initial baseline
  const cachedProfile = StorageManager.get<FinancialProfile | null>(PROFILE_KEY, null);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If unauthenticated, return cached local profile or system default
    if (!user) {
      return cachedProfile ?? DEFAULT_FINANCIAL_PROFILE;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("data")
      .eq("user_id", user.id)
      .limit(1);

    if (error || !Array.isArray(data) || data.length === 0) {
      return cachedProfile ?? DEFAULT_FINANCIAL_PROFILE;
    }

    const saved = (data[0]?.data || {}) as Partial<FinancialProfile>;

    const merged: FinancialProfile = {
      householdMode: saved.householdMode ?? DEFAULT_FINANCIAL_PROFILE.householdMode,
      partner: saved.partner
        ? { ...DEFAULT_FINANCIAL_PROFILE.partner, ...saved.partner }
        : DEFAULT_FINANCIAL_PROFILE.partner,
      personal: { ...DEFAULT_FINANCIAL_PROFILE.personal, ...saved.personal },
      income: { ...DEFAULT_FINANCIAL_PROFILE.income, ...saved.income },
      assets: { ...DEFAULT_FINANCIAL_PROFILE.assets, ...saved.assets },
      liabilities: { ...DEFAULT_FINANCIAL_PROFILE.liabilities, ...saved.liabilities },
      assumptions: { ...DEFAULT_FINANCIAL_PROFILE.assumptions, ...saved.assumptions },
      goals: { ...DEFAULT_FINANCIAL_PROFILE.goals, ...saved.goals },
    };

    // Update local cache with latest server record
    StorageManager.set(PROFILE_KEY, merged);
    StorageManager.set<ProfileSyncMetadata>(PROFILE_SYNC_META_KEY, {
      updatedAt: Date.now(),
    });
    return merged;
  } catch (err) {
    console.warn("[ProfileStorage] Falling back to local cache:", err);
    return cachedProfile ?? DEFAULT_FINANCIAL_PROFILE;
  }
}

export async function saveFinancialProfile(profile: FinancialProfile): Promise<void> {
  // Always persist locally first
  StorageManager.set(PROFILE_KEY, profile);
  StorageManager.set<ProfileSyncMetadata>(PROFILE_SYNC_META_KEY, {
    updatedAt: Date.now(),
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return;
  }

  const payload = {
    user_id: user.id,
    data: profile,
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.warn("[ProfileStorage] profiles table upsert fallback to CloudSyncService:", error.message);
  }

  // Also push to unified user_sync_data store for cross-device sync
  void CloudSyncService.pushStore("profile", profile);
}

export async function resetFinancialProfile(): Promise<void> {
  StorageManager.remove(PROFILE_KEY);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.warn("Failed to reset remote financial profile:", error.message || error);
    }
  } catch (err) {
    console.warn("Error during profile reset:", err);
  }
}
