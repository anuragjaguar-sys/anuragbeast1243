import { RetirementAssumptions } from "./types";

export const DEFAULT_RETIREMENT_ASSUMPTIONS: RetirementAssumptions = {
  // Personal
  currentAge: 37,
  retirementAge: 54,

  // Current Financial Position
  currentCorpus: 12500000, // ₹1.25 Cr

  // Monthly Investment
  monthlyInvestment: 100000,

  // Expected Returns
  expectedReturn: 0.12, // 12%

  // Inflation
  inflationRate: 0.06, // 6%

  // Safe Withdrawal Rate
  withdrawalRate: 0.04, // 4%

  // Retirement Lifestyle
  desiredMonthlyIncome: 200000,

  // Government Pension
  monthlyPension: 100000,
};