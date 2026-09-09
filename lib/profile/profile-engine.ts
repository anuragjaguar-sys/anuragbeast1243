import type { FinancialProfile } from "./profile.types";
import {
  hasSavedFinancialProfile,
  loadFinancialProfile,
  saveFinancialProfile,
} from "./profile-storage";

export async function getFinancialProfile(): Promise<FinancialProfile> {
  const profile = await loadFinancialProfile();
  
  if (!profile.partner) {
    profile.partner = {
      name: "Partner",
      currentAge: 35,
      retirementAge: 54,
      monthlySalary: 0,
      monthlyInvestment: 0,
      monthlyPension: 0,
      mutualFunds: 0,
      ppf: 0,
      epf: 0,
      nps: 0,
    };
  }

  return profile;
}

export async function hasFinancialProfile(): Promise<boolean> {
  return hasSavedFinancialProfile();
}

export async function updateFinancialProfile(
  updates: Partial<FinancialProfile>
): Promise<FinancialProfile> {
  const current = await loadFinancialProfile();

  const defaultPartner = {
    name: "Partner",
    currentAge: 35,
    retirementAge: 54,
    monthlySalary: 0,
    monthlyInvestment: 0,
    monthlyPension: 0,
    mutualFunds: 0,
    ppf: 0,
    epf: 0,
    nps: 0,
  };

  const updated: FinancialProfile = {
    householdMode: updates.householdMode ?? current.householdMode ?? false,
    partner: updates.partner
      ? {
          ...(current.partner ?? defaultPartner),
          ...updates.partner,
        }
      : current.partner ?? defaultPartner,

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

  await saveFinancialProfile(updated);

  return updated;
}