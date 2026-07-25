import { FinancialProfile } from "./profile.types";

export const DEFAULT_FINANCIAL_PROFILE: FinancialProfile = {
  personal: {
    currentAge: 37,
    retirementAge: 54,
    lifeExpectancy: 90,
  },

  income: {
  monthlySalary: 150000,
  monthlyInvestment: 100000, // your current monthly investment
  annualIncrement: 0.05,
  monthlyPension: 100000,
},
  assets: {
    mutualFunds: 4100000,
    ppf: 8400000,
    epf: 0,
    nps: 0,
    emergencyFund: 0,
    cash: 0,
  },

  liabilities: {
    homeLoanOutstanding: 1300000,
    otherLoans: 0,
  },

  assumptions: {
  equityReturn: 0.12,
  debtReturn: 0.071,
  inflationRate: 0.06,
  withdrawalRate: 0.04,

  salaryIncrement: 0.05,
  sipIncrease: 0.05,
},

  goals: {
    desiredMonthlyRetirementIncome: 200000,
    annualTravelBudget: 300000,
    emergencyFundMonths: 12,
  },
};