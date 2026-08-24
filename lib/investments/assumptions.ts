// =========================================
// ATHENA Portfolio Engine
// Default Portfolio
// =========================================

import { PortfolioItem } from "./types";

export const DEFAULT_PORTFOLIO: PortfolioItem[] = [
  {
    id: "mf-1",

    type: "Asset",

    name: "Mutual Funds",

    category: "Mutual Fund",

    assetClass: "Equity",

    investedAmount: 4100000,

    currentValue: 4100000,

    monthlyContribution: 20000,

    expectedReturn: 0.12,

    goal: "Retirement",

    riskLevel: "Medium",
  },

  {
    id: "ppf",

    type: "Asset",

    name: "PPF",

    category: "PPF",

    assetClass: "Debt",

    investedAmount: 8400000,

    currentValue: 8400000,

    monthlyContribution: 12500,

    expectedReturn: 0.071,

    goal: "Retirement",

    riskLevel: "Low",
  },

  {
    id: "emergency",

    type: "Asset",

    name: "Emergency Fund",

    category: "Emergency Fund",

    assetClass: "Cash",

    investedAmount: 0,

    currentValue: 0,

    monthlyContribution: 0,

    expectedReturn: 0,

    goal: "Emergency Fund",

    riskLevel: "Low",
  },

  {
    id: "loan",

    type: "Liability",

    name: "Home Loan",

    category: "Home Loan",

    originalAmount: 2800000,

    outstandingAmount: 1300000,

    currentValue: 1300000,

    interestRate: 8.2,

    emi: 50000,

    tenureMonths: 240,

    remainingMonths: 30,
  },
];