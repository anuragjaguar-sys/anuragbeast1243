import { getAssets, getPortfolio, getPortfolioSummary } from "@/lib/investments";
import { WealthMetrics } from "./wealth-types";

export function getWealthMetrics(): WealthMetrics {
  const portfolio = getPortfolio();
  const summary = getPortfolioSummary(portfolio);
  const assets = getAssets(portfolio);

  const totalAssets = summary.totalAssets;
  const totalLiabilities = summary.totalLiabilities;
  const netWorth = summary.netWorth;

  const investedAssets = assets
    .filter((asset) =>
      ["Mutual Fund", "PPF", "EPF", "NPS"].includes(asset.category)
    )
    .reduce((sum, asset) => sum + asset.currentValue, 0);

  const liquidAssets = assets
    .filter((asset) =>
      ["Emergency Fund", "Savings Account", "Cash"].includes(asset.category)
    )
    .reduce((sum, asset) => sum + asset.currentValue, 0);

  const investmentRatio =
    totalAssets > 0 ? investedAssets / totalAssets : 0;

  const liquidityRatio =
    totalAssets > 0 ? liquidAssets / totalAssets : 0;

  const debtRatio =
    totalAssets > 0 ? totalLiabilities / totalAssets : 0;

  let wealthScore = 100;

  if (debtRatio > 0.30) wealthScore -= 20;
  if (liquidityRatio < 0.10) wealthScore -= 15;
  if (investmentRatio < 0.60) wealthScore -= 15;

  wealthScore = Math.max(0, wealthScore);

  let status: WealthMetrics["status"];

  if (wealthScore >= 90) status = "Excellent";
  else if (wealthScore >= 75) status = "Good";
  else if (wealthScore >= 60) status = "Average";
  else status = "Needs Attention";

  const recommendations: string[] = [];

  if (liquidityRatio < 0.10)
    recommendations.push("Increase emergency fund.");

  if (investmentRatio < 0.60)
    recommendations.push("Increase long-term investments.");

  if (debtRatio > 0.30)
    recommendations.push("Reduce outstanding debt.");

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
