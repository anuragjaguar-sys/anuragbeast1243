// =========================================
// ATHENA Monthly Statement Processor
// =========================================

import type { MonthlyFinancialStatement } from "@/lib/monthly-review";

import {
  getPortfolio,
  saveCurrentPortfolio,
} from "./investment-engine";

import type { PortfolioItem, Liability } from "./types";

// -----------------------------------------
// Types
// -----------------------------------------

export type PortfolioUpdate = {
  item: string;
  previousValue: number;
  newValue: number;
  change: number;
};

export type MonthlyProcessingResult = {
  success: boolean;
  updates: PortfolioUpdate[];
};

// -----------------------------------------
// Helpers
// -----------------------------------------

function amount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// -----------------------------------------
// Update Asset
// -----------------------------------------

function updateAsset(
  portfolio: PortfolioItem[],
  name: string,
  change: number,
  updates: PortfolioUpdate[]
): void {
  if (change === 0) return;

  const asset = portfolio.find(
    (item) =>
      item.type === "Asset" &&
      item.name === name
  );

  if (!asset) return;

  const previous = asset.currentValue;

  asset.currentValue += change;

  updates.push({
    item: name,
    previousValue: previous,
    newValue: asset.currentValue,
    change,
  });
}

// -----------------------------------------
// Update Liability
// -----------------------------------------

function updateLiability(
  portfolio: PortfolioItem[],
  name: string,
  change: number,
  updates: PortfolioUpdate[]
): void {
  if (change === 0) return;

  const liability = portfolio.find(
    (item): item is Liability =>
      item.type === "Liability" &&
      item.name === name
  );

  if (!liability) return;

  const previous = liability.currentValue;

  liability.currentValue -= change;

  if (liability.currentValue < 0) {
    liability.currentValue = 0;
  }

  // Keep the outstanding loan balance
  // synchronized with the portfolio value.
  liability.outstandingAmount =
    liability.currentValue;

  updates.push({
    item: name,
    previousValue: previous,
    newValue: liability.currentValue,
    change: -change,
  });
}

// -----------------------------------------
// Apply Monthly Statement
// -----------------------------------------

export function applyMonthlyStatement(
  statement: MonthlyFinancialStatement,
  previousStatement: MonthlyFinancialStatement | null = null
): MonthlyProcessingResult {
  const portfolio = getPortfolio();

  const updates: PortfolioUpdate[] = [];

  // ---------------------------------------
  // Helper: calculate monthly difference
  // ---------------------------------------

  const difference = (
    current: string | undefined,
    previous: string | undefined
  ): number => {
    return (
      amount(current ?? "") -
      amount(previous ?? "")
    );
  };

  // ---------------------------------------
  // Mutual Funds
  // ---------------------------------------

  updateAsset(
    portfolio,
    "Mutual Funds",
    difference(
      statement.cashAllocation.investments,
      previousStatement?.cashAllocation.investments
    ),
    updates
  );

  // ---------------------------------------
  // PPF
  // ---------------------------------------

  updateAsset(
    portfolio,
    "PPF",
    difference(
      statement.assets.ppf,
      previousStatement?.assets.ppf
    ),
    updates
  );

  // ---------------------------------------
  // NPS
  // ---------------------------------------

  updateAsset(
    portfolio,
    "NPS",
    difference(
      statement.assets.nps,
      previousStatement?.assets.nps
    ),
    updates
  );

  // ---------------------------------------
  // Emergency Fund
  // ---------------------------------------

  updateAsset(
    portfolio,
    "Emergency Fund",
    difference(
      statement.cashAllocation.emergencyFund,
      previousStatement?.cashAllocation.emergencyFund
    ),
    updates
  );

  // ---------------------------------------
  // Savings Account
  // ---------------------------------------

  updateAsset(
    portfolio,
    "Savings Account",
    difference(
      statement.cashAllocation.savingsAccount,
      previousStatement?.cashAllocation.savingsAccount
    ),
    updates
  );

  // ---------------------------------------
  // Home Loan Prepayment
  // ---------------------------------------

  updateLiability(
    portfolio,
    "Home Loan",
    difference(
      statement.cashAllocation.homeLoanPrepayment,
      previousStatement?.cashAllocation.homeLoanPrepayment
    ),
    updates
  );

  // ---------------------------------------
  // Save Updated Portfolio
  // ---------------------------------------

  saveCurrentPortfolio(portfolio);

  return {
    success: true,
    updates,
  };
}