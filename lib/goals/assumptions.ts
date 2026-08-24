// =========================================
// ATHENA Goal Assumptions
// =========================================

export const GOAL_ASSUMPTIONS = {

  // Retirement
  retirement: {
    targetAge: 54,
    targetCorpus: 48000000,          // ₹4.8 Cr
    targetMonthlyIncome: 200000,     // ₹2 Lakh/month
  },

  // Emergency Fund
  emergencyFund: {
    targetMonths: 12,
  },

  // Investment
  investment: {
    targetMonthlyInvestment: 50000,
    expectedAnnualReturn: 12,
  },

  // Home Loan
  homeLoan: {
    targetOutstanding: 0,
  },

  // Net Worth
  netWorth: {
    targetNetWorth: 50000000,        // ₹5 Cr
  },

} as const;