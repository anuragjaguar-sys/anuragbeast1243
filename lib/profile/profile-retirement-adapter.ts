import { getFinancialProfile } from "./profile-engine";
import { RetirementAssumptions } from "@/lib/retirement/types";

export function getRetirementAssumptionsFromProfile(): RetirementAssumptions {
  const profile = getFinancialProfile();

  const currentCorpus =
    profile.assets.mutualFunds +
    profile.assets.ppf +
    profile.assets.epf +
    profile.assets.nps;
console.log("=== Financial Profile Values ===");
console.log({
  desiredMonthlyRetirementIncome:
    profile.goals.desiredMonthlyRetirementIncome,

  equityReturn: profile.assumptions.equityReturn,
  inflationRate: profile.assumptions.inflationRate,
  withdrawalRate: profile.assumptions.withdrawalRate,

  currentAge: profile.personal.currentAge,
  retirementAge: profile.personal.retirementAge,
});
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

// Current monthly investment
monthlyInvestment: profile.income.monthlyInvestment,

// Growth assumptions
annualSipIncrease: profile.assumptions.sipIncrease,
expectedAnnualIncrement: profile.assumptions.salaryIncrement,

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