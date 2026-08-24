import { RetirementAssumptions } from "./types";

export const DEFAULT_RETIREMENT_ASSUMPTIONS: RetirementAssumptions = {
  // Personal
  currentAge: 37,
  retirementAge: 54,

  // Assets
  mutualFunds: 4100000,      // ₹41 lakh
  ppf: 8400000,              // ₹84 lakh
  epf: 0,
  nps: 0,
  emergencyFund: 0,
  cash: 0,

  // Legacy (kept for compatibility)
  currentCorpus: 12500000,   // ₹1.25 Cr

  // Income
  monthlySalary: 160000,
  monthlyInvestment: 100000,
  annualSipIncrease: 0,
  expectedAnnualIncrement: 0.05, // 5%

  // Returns
  equityReturn: 0.12,        // 12%
  debtReturn: 0.071,         // 7.1%
  inflationRate: 0.06,       // 6%
  withdrawalRate: 0.04,      // 4%

  // Retirement
  desiredMonthlyIncome: 200000,
  monthlyPension: 100000,
};
