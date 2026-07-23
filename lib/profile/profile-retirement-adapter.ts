import { getFinancialProfile } from "./profile-engine";
import { RetirementAssumptions } from "@/lib/retirement/types";

export function getRetirementAssumptionsFromProfile(): RetirementAssumptions {
  const profile = getFinancialProfile();

  const currentCorpus =
    profile.assets.mutualFunds +
    profile.assets.ppf +
    profile.assets.epf +
    profile.assets.nps;

  return {
    currentAge: profile.personal.currentAge,
    retirementAge: profile.personal.retirementAge,

    // Assets
    mutualFunds: profile.assets.mutualFunds,
    ppf: profile.assets.ppf,
    epf: profile.assets.epf,
    emergencyFund: profile.assets.emergencyFund,
    cash: profile.assets.cash,

    // Legacy (kept for compatibility)
    currentCorpus,

    // Income
    monthlySalary: profile.income.monthlySalary,
    monthlyInvestment: 100000,
    annualSipIncrease: 0,
    expectedAnnualIncrement: profile.income.annualIncrement,

    // Returns
    equityReturn: profile.assumptions.equityReturn,
    debtReturn: profile.assumptions.debtReturn,
    inflationRate: profile.assumptions.inflationRate,
    withdrawalRate: profile.assumptions.withdrawalRate,

    // Retirement
    desiredMonthlyIncome:
      profile.goals.desiredMonthlyRetirementIncome,
    monthlyPension: profile.income.monthlyPension,
  };
}