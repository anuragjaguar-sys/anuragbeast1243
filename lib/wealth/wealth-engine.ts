import { getAssets, getLiabilities, getPortfolio, getPortfolioSummary } from "@/lib/investments";
import type { Asset, Liability, PortfolioItem } from "@/lib/investments/types";
import { loadMonthlyReview } from "@/lib/storage";
import { StorageManager } from "@/lib/core/storage-manager";
import type { FinancialProfile } from "@/lib/profile/profile.types";
import { WealthMetrics } from "./wealth-types";

function isRealEstateItem(item: { name?: string; category?: string }): boolean {
  const name = (item.name || "").toLowerCase();
  const cat = (item.category || "").toLowerCase();
  return (
    cat === "real estate" ||
    cat === "property" ||
    name.includes("flat") ||
    name.includes("dehradun") ||
    name.includes("property") ||
    name.includes("real estate") ||
    name.includes("house") ||
    name.includes("apartment") ||
    name.includes("plot")
  );
}

function parseNum(val: unknown): number {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * Ensures Running Account (Savings Account) and Emergency Account (Emergency Fund)
 * are always present in the asset list and totals—even if originally entered in
 * Monthly Financial Statement or Financial Profile rather than as separate Portfolio rows.
 */
export function getReconciledPortfolio(rawPortfolio?: PortfolioItem[]): PortfolioItem[] {
  const base = rawPortfolio ?? getPortfolio();
  const review = typeof window !== "undefined" ? loadMonthlyReview() : null;
  const profile =
    typeof window !== "undefined"
      ? StorageManager.get<FinancialProfile | null>(StorageManager.KEYS.PROFILE, null)
      : null;

  // Normalize any miscategorized real estate (e.g. dehradun flat saved as Savings Account)
  const normalized: PortfolioItem[] = base.map((item) => {
    if (item.type === "Asset" && isRealEstateItem(item) && item.category === "Savings Account") {
      return {
        ...item,
        category: "Real Estate",
        assetClass: "Alternative",
      };
    }
    return item;
  });

  const hasRunningAccount = normalized.some(
    (item) =>
      item.type === "Asset" &&
      !isRealEstateItem(item) &&
      (item.category === "Savings Account" ||
        item.category === "Cash" ||
        item.name.toLowerCase().includes("running") ||
        item.name.toLowerCase().includes("savings"))
  );

  const hasEmergencyAccount = normalized.some(
    (item) =>
      item.type === "Asset" &&
      !isRealEstateItem(item) &&
      (item.category === "Emergency Fund" || item.name.toLowerCase().includes("emergency"))
  );

  const fallbackRunning =
    parseNum(review?.assets?.savingsAccount) ||
    parseNum(review?.cashAllocation?.savingsAccount) ||
    parseNum(profile?.assets?.cash) ||
    0;

  const fallbackEmergency =
    parseNum(review?.assets?.emergencyFund) ||
    parseNum(review?.cashAllocation?.emergencyFund) ||
    parseNum(profile?.assets?.emergencyFund) ||
    0;

  if (!hasRunningAccount && fallbackRunning > 0) {
    const runningAsset: Asset = {
      id: "reconciled-running-account",
      type: "Asset",
      name: "Running Account (Savings)",
      category: "Savings Account",
      assetClass: "Cash",
      currentValue: fallbackRunning,
      investedAmount: fallbackRunning,
      monthlyContribution: parseNum(review?.cashAllocation?.savingsAccount),
      expectedReturn: 3.5,
      goal: "Other",
      riskLevel: "Low",
    };
    normalized.push(runningAsset);
  }

  if (!hasEmergencyAccount && fallbackEmergency > 0) {
    const emergencyAsset: Asset = {
      id: "reconciled-emergency-account",
      type: "Asset",
      name: "Emergency Account",
      category: "Emergency Fund",
      assetClass: "Cash",
      currentValue: fallbackEmergency,
      investedAmount: fallbackEmergency,
      monthlyContribution: parseNum(review?.cashAllocation?.emergencyFund),
      expectedReturn: 6.0,
      goal: "Emergency Fund",
      riskLevel: "Low",
    };
    normalized.push(emergencyAsset);
  }

  return normalized;
}

export function getWealthMetrics(customPortfolio?: PortfolioItem[]): WealthMetrics {
  const portfolio = getReconciledPortfolio(customPortfolio);
  const summary = getPortfolioSummary(portfolio);
  const assets = getAssets(portfolio);

  const totalAssets = summary.totalAssets;
  const totalLiabilities = summary.totalLiabilities;
  const netWorth = summary.netWorth;

  const investedAssets = assets
    .filter((asset) =>
      [
        "Mutual Fund",
        "PPF",
        "EPF",
        "NPS",
        "Stocks",
        "ETF",
        "Fixed Deposit",
        "Gold",
        "Real Estate",
        "Property",
      ].includes(asset.category)
    )
    .reduce((sum, asset) => sum + (Number(asset.currentValue) || 0), 0);

  const liquidAssets = assets
    .filter(
      (asset) =>
        !isRealEstateItem(asset) &&
        ["Emergency Fund", "Savings Account", "Cash", "Fixed Deposit"].includes(asset.category)
    )
    .reduce((sum, asset) => sum + (Number(asset.currentValue) || 0), 0);

  const investmentRatio = totalAssets > 0 ? investedAssets / totalAssets : 0;
  const liquidityRatio = totalAssets > 0 ? liquidAssets / totalAssets : 0;
  const debtRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;

  let wealthScore = 100;

  if (debtRatio > 0.3) wealthScore -= 20;
  if (liquidityRatio < 0.05) wealthScore -= 15;
  if (investmentRatio < 0.6) wealthScore -= 15;

  wealthScore = Math.max(0, wealthScore);

  let status: WealthMetrics["status"];

  if (wealthScore >= 90) status = "Excellent";
  else if (wealthScore >= 75) status = "Good";
  else if (wealthScore >= 60) status = "Average";
  else status = "Needs Attention";

  const recommendations: string[] = [];

  if (liquidityRatio < 0.05) recommendations.push("Increase emergency & running liquid buffer.");
  if (investmentRatio < 0.6) recommendations.push("Increase long-term investments.");
  if (debtRatio > 0.3) recommendations.push("Reduce outstanding debt.");

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    investedAssets,
    liquidAssets,
    investmentRatio,
    liquidityRatio,
    debtRatio,
    wealthScore,
    status,
    recommendations,
  };
}
