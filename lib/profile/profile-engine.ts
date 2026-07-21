import { DEFAULT_FINANCIAL_PROFILE } from "./profile";
import { FinancialProfile } from "./profile.types";

export function getFinancialProfile(): FinancialProfile {
  return DEFAULT_FINANCIAL_PROFILE;
}

export function updateFinancialProfile(
  updates: Partial<FinancialProfile>
): FinancialProfile {
  return {
    ...DEFAULT_FINANCIAL_PROFILE,
    ...updates,
  };
}