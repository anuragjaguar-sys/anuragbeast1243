import { getFinancialProfile } from "./profile-engine";
import { RetirementAssumptions } from "@/lib/retirement/types";
import { getAssets, getPortfolio } from "@/lib/investments";
import { getGoals } from "@/lib/goals";

export function getRetirementAssumptionsFromProfile(): RetirementAssumptions {
  const profile = getFinancialProfile();
  const retirementGoal = getGoals().find(
    (goal) => goal.category === "Retirement" && goal.timeframe === "Long Term"
  );
  const assets = getAssets(getPortfolio());
  const valueForCategory = (category: string) =>
    assets
      .filter((asset) => asset.category === category)
      .reduce((sum, asset) => sum + asset.currentValue, 0);

  const currentCorpus =
    valueForCategory("Mutual Fund") +
    valueForCategory("PPF") +
    valueForCategory("EPF") +
    valueForCategory("NPS");

// Determine desired monthly income with correct precedence:
// 1. Long-term retirement goal's desiredMonthlyIncome (if present and not mistakenly set to monthly pension)
// 2. Financial profile's goals.desiredMonthlyRetirementIncome
const goalDesired = retirementGoal?.desiredMonthlyIncome ?? null;
const profileDesired = profile.goals.desiredMonthlyRetirementIncome;
const monthlyPension = profile.income.monthlyPension;

let desiredMonthlyIncome = profileDesired;

if (typeof goalDesired === "number" && goalDesired > 0) {
  // Avoid accidentally treating monthly pension as the desired retirement spending target
  if (goalDesired !== monthlyPension) {
    desiredMonthlyIncome = goalDesired;
  }
}

return {
  currentAge: profile.personal.currentAge,
  retirementAge: profile.personal.retirementAge,

  // Assets
  mutualFunds: valueForCategory("Mutual Fund"),
  ppf: valueForCategory("PPF"),
  epf: valueForCategory("EPF"),
  emergencyFund: valueForCategory("Emergency Fund"),
  cash: valueForCategory("Savings Account") + valueForCategory("Cash"),

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
  desiredMonthlyIncome: desiredMonthlyIncome,
  monthlyPension: monthlyPension,
};
}
