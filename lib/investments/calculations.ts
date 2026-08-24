// =========================================
// ATHENA Portfolio Engine
// Calculations
// =========================================

import { Asset, Liability, PortfolioItem } from "./types";

export function getAssets(
  portfolio: PortfolioItem[]
): Asset[] {
  return portfolio.filter(
    (item): item is Asset => item.type === "Asset"
  );
}

export function getLiabilities(
  portfolio: PortfolioItem[]
): Liability[] {
  return portfolio.filter(
    (item): item is Liability => item.type === "Liability"
  );
}

export function getTotalAssets(
  portfolio: PortfolioItem[]
): number {
  return getAssets(portfolio).reduce(
    (sum, asset) => sum + asset.currentValue,
    0
  );
}

export function getTotalLiabilities(
  portfolio: PortfolioItem[]
): number {
  return getLiabilities(portfolio).reduce(
    (sum, loan) => sum + loan.outstandingAmount,
    0
  );
}

export function getNetWorth(
  portfolio: PortfolioItem[]
): number {
  return (
    getTotalAssets(portfolio) -
    getTotalLiabilities(portfolio)
  );
}

export function getMonthlyInvestment(
  portfolio: PortfolioItem[]
): number {
  return getAssets(portfolio).reduce(
    (sum, asset) =>
      sum + asset.monthlyContribution,
    0
  );
}

export function getMonthlyEMI(
  portfolio: PortfolioItem[]
): number {
  return getLiabilities(portfolio).reduce(
    (sum, loan) => sum + loan.emi,
    0
  );
}

export function getTotalInvested(
  portfolio: PortfolioItem[]
): number {
  return getAssets(portfolio).reduce(
    (sum, asset) =>
      sum + asset.investedAmount,
    0
  );
}

export function getTotalProfit(
  portfolio: PortfolioItem[]
): number {
  return (
    getTotalAssets(portfolio) -
    getTotalInvested(portfolio)
  );
}