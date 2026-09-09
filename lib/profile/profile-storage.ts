import { supabase } from "@/lib/supabase";
import type { FinancialProfile } from "./profile.types";
import { DEFAULT_FINANCIAL_PROFILE } from "./profile";
import { StorageManager } from "@/lib/core/storage-manager";

const PROFILE_KEY = StorageManager.KEYS.PROFILE;

export async function hasSavedFinancialProfile(): Promise<boolean> {
  // 1. Check local cache first for instant response
  const cached = StorageManager.get<FinancialProfile | null>(PROFILE_KEY, null);
  if (cached) return true;

  // 2. Check remote database if authenticated
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to check financial profile:", error.message || error);
      return false;
    }

    return data !== null;
  } catch {
    return false;
  }
}

export async function loadFinancialProfile(): Promise<FinancialProfile> {
  // Read local cache as initial baseline
  const cachedProfile = StorageManager.get<FinancialProfile | null>(PROFILE_KEY, null);

  try {
    const { data: { user } } = await supabase.auth.getUser();

    // If unauthenticated, return cached local profile or system default
    if (!user) {
      return cachedProfile ?? DEFAULT_FINANCIAL_PROFILE;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("data")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("Failed to load financial profile:", error.message || error);
      return cachedProfile ?? DEFAULT_FINANCIAL_PROFILE;
    }

    const saved = (data.data || {}) as Partial<FinancialProfile>;

    const merged: FinancialProfile = {
      householdMode: saved.householdMode ?? DEFAULT_FINANCIAL_PROFILE.householdMode,
      partner: saved.partner ? { ...DEFAULT_FINANCIAL_PROFILE.partner, ...saved.partner } : DEFAULT_FINANCIAL_PROFILE.partner,
      personal: { ...DEFAULT_FINANCIAL_PROFILE.personal, ...saved.personal },
      income: { ...DEFAULT_FINANCIAL_PROFILE.income, ...saved.income },
      assets: { ...DEFAULT_FINANCIAL_PROFILE.assets, ...saved.assets },
      liabilities: { ...DEFAULT_FINANCIAL_PROFILE.liabilities, ...saved.liabilities },
      assumptions: { ...DEFAULT_FINANCIAL_PROFILE.assumptions, ...saved.assumptions },
      goals: { ...DEFAULT_FINANCIAL_PROFILE.goals, ...saved.goals },
    };

    // Update local cache with latest server record
    StorageManager.set(PROFILE_KEY, merged);
    return merged;
  } catch (err) {
    console.warn("[ProfileStorage] Falling back to local cache:", err);
    return cachedProfile ?? DEFAULT_FINANCIAL_PROFILE;
  }
}

export async function saveFinancialProfile(profile: FinancialProfile): Promise<void> {
  // Always update local cache immediately for responsive UI
  StorageManager.set(PROFILE_KEY, profile);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // User is working in local/guest mode; local state is saved
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
    console.error("Failed to sync financial profile to cloud:", error.message || JSON.stringify(error));
    throw new Error(error.message || "Database upsert failed due to RLS policy");
  }
}

export async function resetFinancialProfile(): Promise<void> {
  StorageManager.remove(PROFILE_KEY);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to reset remote financial profile:", error.message || error);
    }
  } catch (err) {
    console.error("Error during profile reset:", err);
  }
}