import { FinancialProfile } from "./profile.types";
import {
  loadFinancialProfile,
  saveFinancialProfile,
} from "./profile-storage";

export function getFinancialProfile(): FinancialProfile {
  return loadFinancialProfile();
}

export function updateFinancialProfile(
  updates: Partial<FinancialProfile>
): FinancialProfile {
  const current = loadFinancialProfile();

  const updated: FinancialProfile = {
    personal: {
      ...current.personal,
      ...updates.personal,
    },

    income: {
      ...current.income,
      ...updates.income,
    },

    assets: {
      ...current.assets,
      ...updates.assets,
    },

    liabilities: {
      ...current.liabilities,
      ...updates.liabilities,
    },

    assumptions: {
      ...current.assumptions,
      ...updates.assumptions,
    },

    goals: {
      ...current.goals,
      ...updates.goals,
    },
  };

  saveFinancialProfile(updated);

  return updated;
}