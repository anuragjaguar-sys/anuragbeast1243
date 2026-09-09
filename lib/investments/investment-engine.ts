// =========================================
// ATHENA Portfolio Engine
// =========================================

import { DEFAULT_PORTFOLIO } from "./assumptions";
import {
  loadPortfolio,
  savePortfolio,
} from "./portfolio-storage/storage";
import { runPortfolioMigration } from "./portfolio-migration";

import {
  getAssets,
  getLiabilities,
  getMonthlyEMI,
  getMonthlyInvestment,
  getNetWorth,
  getTotalAssets,
  getTotalInvested,
  getTotalLiabilities,
  getTotalProfit,
} from "./calculations";

import {
  AssetAllocation,
  PortfolioItem,
  PortfolioSummary,
} from "./types";

// -----------------------------------------
// Portfolio access
// -----------------------------------------

export function getPortfolio(): PortfolioItem[] {
  return loadPortfolio();
}

/**
 * Initializes the canonical Portfolio from the Financial Profile
 * for legacy users who do not yet have a Portfolio.
 *
 * This is asynchronous because the Financial Profile is stored
 * in Supabase and must be loaded asynchronously.
 */
export async function initializePortfolioFromProfile(): Promise<
  PortfolioItem[]
> {
  return await runPortfolioMigration();
}

export function saveCurrentPortfolio(
  portfolio: PortfolioItem[]
): void {
  savePortfolio(portfolio);
}

// -----------------------------------------
// Portfolio mutations
// -----------------------------------------

export function addPortfolioItem(
  item: PortfolioItem
): void {
  const portfolio = getPortfolio();

  portfolio.push(item);

  savePortfolio(portfolio);
}

export function updatePortfolioItem(
  updatedItem: PortfolioItem
): void {
  const portfolio = getPortfolio();

  const updated = portfolio.map((item) =>
    item.id === updatedItem.id
      ? updatedItem
      : item
  );

  savePortfolio(updated);
}

export function deletePortfolioItem(
  id: string
): void {
  const portfolio = getPortfolio();

  savePortfolio(
    portfolio.filter((item) => item.id !== id)
  );
}

// -----------------------------------------
// Asset allocation
// -----------------------------------------

export function getAssetAllocation(
  portfolio: PortfolioItem[] = DEFAULT_PORTFOLIO
): AssetAllocation {
  const allocation: AssetAllocation = {
    equity: 0,
    debt: 0,
    hybrid: 0,
    alternative: 0,
    cash: 0,
  };

  getAssets(portfolio).forEach((asset) => {
    switch (asset.assetClass) {
      case "Equity":
        allocation.equity += asset.currentValue;
        break;

      case "Debt":
        allocation.debt += asset.currentValue;
        break;

      case "Hybrid":
        allocation.hybrid += asset.currentValue;
        break;

      case "Alternative":
        allocation.alternative += asset.currentValue;
        break;

      case "Cash":
        allocation.cash += asset.currentValue;
        break;
    }
  });

  return allocation;
}

// -----------------------------------------
// Portfolio summary
// -----------------------------------------

export function getPortfolioSummary(
  portfolio: PortfolioItem[] = DEFAULT_PORTFOLIO
): PortfolioSummary {
  const totalAssets =
    getTotalAssets(portfolio);

  const totalLiabilities =
    getTotalLiabilities(portfolio);

  const totalInvested =
    getTotalInvested(portfolio);

  const totalProfit =
    getTotalProfit(portfolio);

  const monthlyInvestment =
    getMonthlyInvestment(portfolio);

  const monthlyEMI =
    getMonthlyEMI(portfolio);

  const netWorth =
    getNetWorth(portfolio);

  const allocation =
    getAssetAllocation(portfolio);

  const assets =
    getAssets(portfolio);

  const largestHolding =
    assets.length
      ? [...assets].sort(
          (a, b) =>
            b.currentValue - a.currentValue
        )[0].name
      : "-";

  const diversificationScore =
    Math.min(
      100,
      Math.round((assets.length / 8) * 100)
    );

  return {
    totalAssets,

    totalLiabilities,

    netWorth,

    monthlyInvestment,

    monthlyEMI,

    totalInvested,

    totalProfit,

    overallReturn:
      totalInvested === 0
        ? 0
        : (totalProfit / totalInvested) * 100,

    allocation,

    diversificationScore,

    largestHolding,

    assetCount: assets.length,

    liabilityCount:
      getLiabilities(portfolio).length,
  };
}

// -----------------------------------------
// Portfolio insights
// -----------------------------------------

export function getPortfolioInsights(
  portfolio: PortfolioItem[] = DEFAULT_PORTFOLIO
): string[] {
  const summary =
    getPortfolioSummary(portfolio);

  const insights: string[] = [];

  if (summary.monthlyInvestment < 50000) {
    insights.push(
      "Increasing monthly investments will accelerate long-term wealth creation."
    );
  }

  if (
    summary.totalLiabilities >
    summary.netWorth * 0.25
  ) {
    insights.push(
      "Liabilities are a significant portion of your net worth. Prioritise debt reduction."
    );
  }

  if (
    summary.allocation.equity <
    summary.allocation.debt
  ) {
    insights.push(
      "Your portfolio is debt-heavy. Review whether increasing equity exposure fits your long-term goals and risk tolerance."
    );
  }

  if (insights.length === 0) {
    insights.push(
      "Your portfolio appears balanced. Continue investing consistently."
    );
  }

  return insights;
}