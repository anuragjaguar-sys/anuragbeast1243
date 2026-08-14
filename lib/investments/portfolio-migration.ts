import { getFinancialProfile, hasFinancialProfile } from "@/lib/profile/profile-engine";
import { loadPortfolio, savePortfolio } from "./portfolio-storage/storage";
import type { PortfolioItem } from "./types";

// Legacy-user migration: if a Financial Profile already exists but the canonical
// Portfolio was never initialized, build the current portfolio snapshot from the
// profile asset/liability values exactly once. This is a migration, not a second
// source of truth.
export function runPortfolioMigration(): PortfolioItem[] {
  const existingPortfolio = loadPortfolio();

  if (existingPortfolio.length > 0) {
    return existingPortfolio;
  }

  if (!hasFinancialProfile()) {
    return [];
  }

  const profile = getFinancialProfile();

  const migratedPortfolio: PortfolioItem[] = [
    {
      id: "mf-1",
      type: "Asset",
      name: "Mutual Funds",
      category: "Mutual Fund",
      assetClass: "Equity",
      investedAmount: profile.assets.mutualFunds,
      currentValue: profile.assets.mutualFunds,
      monthlyContribution: profile.income.monthlyInvestment,
      expectedReturn: profile.assumptions.equityReturn,
      goal: "Retirement",
      riskLevel: "Medium",
    },
    {
      id: "ppf",
      type: "Asset",
      name: "PPF",
      category: "PPF",
      assetClass: "Debt",
      investedAmount: profile.assets.ppf,
      currentValue: profile.assets.ppf,
      monthlyContribution: 0,
      expectedReturn: profile.assumptions.debtReturn,
      goal: "Retirement",
      riskLevel: "Low",
    },
    {
      id: "nps",
      type: "Asset",
      name: "NPS",
      category: "NPS",
      assetClass: "Debt",
      investedAmount: profile.assets.nps,
      currentValue: profile.assets.nps,
      monthlyContribution: 0,
      expectedReturn: profile.assumptions.debtReturn,
      goal: "Retirement",
      riskLevel: "Low",
    },
    {
      id: "epf",
      type: "Asset",
      name: "EPF",
      category: "EPF",
      assetClass: "Debt",
      investedAmount: profile.assets.epf,
      currentValue: profile.assets.epf,
      monthlyContribution: 0,
      expectedReturn: profile.assumptions.debtReturn,
      goal: "Retirement",
      riskLevel: "Low",
    },
    {
      id: "emergency",
      type: "Asset",
      name: "Emergency Fund",
      category: "Emergency Fund",
      assetClass: "Cash",
      investedAmount: profile.assets.emergencyFund,
      currentValue: profile.assets.emergencyFund,
      monthlyContribution: 0,
      expectedReturn: 0,
      goal: "Emergency Fund",
      riskLevel: "Low",
    },
    {
      id: "cash",
      type: "Asset",
      name: "Savings Account",
      category: "Savings Account",
      assetClass: "Cash",
      investedAmount: profile.assets.cash,
      currentValue: profile.assets.cash,
      monthlyContribution: 0,
      expectedReturn: 0,
      goal: "Other",
      riskLevel: "Low",
    },
    {
      id: "stocks",
      type: "Asset",
      name: "Stocks",
      category: "Stocks",
      assetClass: "Equity",
      investedAmount: profile.assets.stocks,
      currentValue: profile.assets.stocks,
      monthlyContribution: 0,
      expectedReturn: profile.assumptions.equityReturn,
      goal: "Wealth Creation",
      riskLevel: "Medium",
    },
    {
      id: "fd",
      type: "Asset",
      name: "Fixed Deposits",
      category: "Fixed Deposit",
      assetClass: "Debt",
      investedAmount: profile.assets.fd,
      currentValue: profile.assets.fd,
      monthlyContribution: 0,
      expectedReturn: profile.assumptions.debtReturn,
      goal: "Wealth Creation",
      riskLevel: "Low",
    },
    {
      id: "gold",
      type: "Asset",
      name: "Gold",
      category: "Gold",
      assetClass: "Alternative",
      investedAmount: profile.assets.gold,
      currentValue: profile.assets.gold,
      monthlyContribution: 0,
      expectedReturn: profile.assumptions.equityReturn,
      goal: "Wealth Creation",
      riskLevel: "Medium",
    },
    {
      id: "property",
      type: "Asset",
      name: "Property",
      category: "Other",
      assetClass: "Alternative",
      investedAmount: profile.assets.property,
      currentValue: profile.assets.property,
      monthlyContribution: 0,
      expectedReturn: 0,
      goal: "House",
      riskLevel: "Medium",
    },
    {
      id: "home-loan",
      type: "Liability",
      name: "Home Loan",
      category: "Home Loan",
      originalAmount: profile.liabilities.homeLoanOutstanding,
      outstandingAmount: profile.liabilities.homeLoanOutstanding,
      currentValue: profile.liabilities.homeLoanOutstanding,
      interestRate: 0,
      emi: 0,
      tenureMonths: 0,
      remainingMonths: 0,
    },
    {
      id: "other-loans",
      type: "Liability",
      name: "Other Loans",
      category: "Other",
      originalAmount: profile.liabilities.otherLoans,
      outstandingAmount: profile.liabilities.otherLoans,
      currentValue: profile.liabilities.otherLoans,
      interestRate: 0,
      emi: 0,
      tenureMonths: 0,
      remainingMonths: 0,
    },
  ];

  savePortfolio(migratedPortfolio);
  return migratedPortfolio;
}
