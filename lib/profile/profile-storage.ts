import { FinancialProfile } from "./profile.types";
import { DEFAULT_FINANCIAL_PROFILE } from "./profile";

const PROFILE_STORAGE_KEY = "fire54-financial-profile";

export function hasSavedFinancialProfile(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(PROFILE_STORAGE_KEY) !== null;
}

export function loadFinancialProfile(): FinancialProfile {
  if (typeof window === "undefined") {
    return DEFAULT_FINANCIAL_PROFILE;
  }

  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);

    if (!stored) {
      return DEFAULT_FINANCIAL_PROFILE;
    }

    const saved = JSON.parse(stored) as Partial<FinancialProfile>;

    return {
      personal: {
        ...DEFAULT_FINANCIAL_PROFILE.personal,
        ...saved.personal,
      },

      income: {
        ...DEFAULT_FINANCIAL_PROFILE.income,
        ...saved.income,
      },

      assets: {
        ...DEFAULT_FINANCIAL_PROFILE.assets,
        ...saved.assets,
      },

      liabilities: {
        ...DEFAULT_FINANCIAL_PROFILE.liabilities,
        ...saved.liabilities,
      },

      assumptions: {
        ...DEFAULT_FINANCIAL_PROFILE.assumptions,
        ...saved.assumptions,
      },

      goals: {
        ...DEFAULT_FINANCIAL_PROFILE.goals,
        ...saved.goals,
      },
    };
  } catch (error) {
    console.error("Failed to load financial profile:", error);
    return DEFAULT_FINANCIAL_PROFILE;
  }
}

export function saveFinancialProfile(
  profile: FinancialProfile
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(profile)
    );
  } catch (error) {
    console.error("Failed to save financial profile:", error);
  }
}

export function resetFinancialProfile(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(PROFILE_STORAGE_KEY);
}
