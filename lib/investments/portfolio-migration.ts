import {
  getFinancialProfile,
  hasFinancialProfile,
} from "@/lib/profile/profile-engine";

import {
  loadPortfolio,
  savePortfolio,
} from "./portfolio-storage/storage";

import type { PortfolioItem } from "./types";

/**
 * Legacy-user migration.
 *
 * If a Financial Profile already exists but the canonical Portfolio
 * has never been initialized, create the Portfolio snapshot once
 * from the profile's historical asset/liability values.
 *
 * Important:
 * This is a migration only.
 *
 * After migration:
 *
 * Profile  → assumptions / personal / income data
 * Portfolio → current financial reality
 *
 * The Profile must NOT continue acting as a second portfolio source
 * of truth.
 */
export async function runPortfolioMigration(): Promise<PortfolioItem[]> {
  /**
   * If Portfolio already exists, it is canonical.
   * Never rebuild it from Profile.
   */
  const existingPortfolio = loadPortfolio();

  if (existingPortfolio.length > 0) {
    return existingPortfolio;
  }

  /**
   * hasFinancialProfile() is asynchronous because Profile is stored
   * in Supabase.
   */
  const profileExists = await hasFinancialProfile();

  if (!profileExists) {
    return [];
  }

  /**
   * Load the actual persisted Financial Profile.
   */
  const profile = await getFinancialProfile();

  /**
   * Build the initial canonical Portfolio snapshot.
   */
  const migratedPortfolio: PortfolioItem[] = [
    {
      id: "mf-1",
      type: "Asset",
      name: "Mutual Funds",
      category: "Mutual Fund",
      assetClass: "Equity",
      investedAmount: Number(profile.assets.mutualFunds || 0),
      currentValue: Number(profile.assets.mutualFunds || 0),
      monthlyContribution: Number(
        profile.income.monthlyInvestment || 0
      ),
      expectedReturn: Number(
        profile.assumptions.equityReturn || 0
      ),
      goal: "Retirement",
      riskLevel: "Medium",
    },

    {
      id: "ppf",
      type: "Asset",
      name: "PPF",
      category: "PPF",
      assetClass: "Debt",
      investedAmount: Number(profile.assets.ppf || 0),
      currentValue: Number(profile.assets.ppf || 0),
      monthlyContribution: 0,
      expectedReturn: Number(
        profile.assumptions.debtReturn || 0
      ),
      goal: "Retirement",
      riskLevel: "Low",
    },

    {
      id: "nps",
      type: "Asset",
      name: "NPS",
      category: "NPS",
      assetClass: "Debt",
      investedAmount: Number(profile.assets.nps || 0),
      currentValue: Number(profile.assets.nps || 0),
      monthlyContribution: 0,
      expectedReturn: Number(
        profile.assumptions.debtReturn || 0
      ),
      goal: "Retirement",
      riskLevel: "Low",
    },

    {
      id: "epf",
      type: "Asset",
      name: "EPF",
      category: "EPF",
      assetClass: "Debt",
      investedAmount: Number(profile.assets.epf || 0),
      currentValue: Number(profile.assets.epf || 0),
      monthlyContribution: 0,
      expectedReturn: Number(
        profile.assumptions.debtReturn || 0
      ),
      goal: "Retirement",
      riskLevel: "Low",
    },

    {
      id: "emergency",
      type: "Asset",
      name: "Emergency Fund",
      category: "Emergency Fund",
      assetClass: "Cash",
      investedAmount: Number(
        profile.assets.emergencyFund || 0
      ),
      currentValue: Number(
        profile.assets.emergencyFund || 0
      ),
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
      investedAmount: Number(profile.assets.cash || 0),
      currentValue: Number(profile.assets.cash || 0),
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
      investedAmount: Number(profile.assets.stocks || 0),
      currentValue: Number(profile.assets.stocks || 0),
      monthlyContribution: 0,
      expectedReturn: Number(
        profile.assumptions.equityReturn || 0
      ),
      goal: "Wealth Creation",
      riskLevel: "Medium",
    },

    {
      id: "fd",
      type: "Asset",
      name: "Fixed Deposits",
      category: "Fixed Deposit",
      assetClass: "Debt",
      investedAmount: Number(profile.assets.fd || 0),
      currentValue: Number(profile.assets.fd || 0),
      monthlyContribution: 0,
      expectedReturn: Number(
        profile.assumptions.debtReturn || 0
      ),
      goal: "Wealth Creation",
      riskLevel: "Low",
    },

    {
      id: "gold",
      type: "Asset",
      name: "Gold",
      category: "Gold",
      assetClass: "Alternative",
      investedAmount: Number(profile.assets.gold || 0),
      currentValue: Number(profile.assets.gold || 0),
      monthlyContribution: 0,
      expectedReturn: Number(
        profile.assumptions.equityReturn || 0
      ),
      goal: "Wealth Creation",
      riskLevel: "Medium",
    },

    {
      id: "property",
      type: "Asset",
      name: "Property",
      category: "Other",
      assetClass: "Alternative",
      investedAmount: Number(profile.assets.property || 0),
      currentValue: Number(profile.assets.property || 0),
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
      originalAmount: Number(
        profile.liabilities.homeLoanOutstanding || 0
      ),
      outstandingAmount: Number(
        profile.liabilities.homeLoanOutstanding || 0
      ),
      currentValue: Number(
        profile.liabilities.homeLoanOutstanding || 0
      ),
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
      originalAmount: Number(
        profile.liabilities.otherLoans || 0
      ),
      outstandingAmount: Number(
        profile.liabilities.otherLoans || 0
      ),
      currentValue: Number(
        profile.liabilities.otherLoans || 0
      ),
      interestRate: 0,
      emi: 0,
      tenureMonths: 0,
      remainingMonths: 0,
    },
  ];

  /**
   * Persist the migrated Portfolio.
   *
   * From this point onward Portfolio becomes the canonical
   * current-value source.
   */
  savePortfolio(migratedPortfolio);

  return migratedPortfolio;
}