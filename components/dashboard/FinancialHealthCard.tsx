"use client";

import { loadMonthlyReview } from "@/lib/storage";
import { calculateFinancialHealthScore, getFinancialMetrics, formatINR } from "@/lib/financial-engine";
import { getPortfolio } from "@/lib/investments";

export default function FinancialHealthCard() {
  const review = loadMonthlyReview();
  const metrics = getFinancialMetrics();

  // Ensure supporting displayed metrics are sourced from the canonical portfolio
  const portfolio = getPortfolio();
  const emergencyAsset = portfolio.find(
    (item) => item.type === "Asset" && item.name === "Emergency Fund"
  );
  const emergencyCurrent = emergencyAsset?.currentValue ?? 0;

  // Use the app's assumed ₹6,00,000 target where applicable (keeps parity with existing engines)
  const EMERGENCY_TARGET = 600000;
  const emergencyProgressFromPortfolio = Math.min(
    Math.round((emergencyCurrent / EMERGENCY_TARGET) * 100),
    100
  );

  let score: number | null = null;

  if (review) {
    try {
      score = calculateFinancialHealthScore(review);
    } catch {
      score = null;
    }
  }

  // Fallback: derive a rough score from current metrics if no monthly review exists
  if (score === null && metrics) {
    // Map net worth and emergency fund into a simple proxy using existing metrics
    const proxy = Math.round(
      (metrics.savingsRate * 1.5 + metrics.investmentRate * 1.2 + (emergencyProgressFromPortfolio || 0) * 1.0) / 3
    );
    score = Math.min(Math.max(proxy, 0), 100);
  }

  if (!metrics) return null;

  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-zinc-900/60 p-5 text-left transition-all duration-300 hover:border-zinc-700/80 hover:shadow-lg hover:shadow-black/20">
      <div className="absolute inset-0 bg-zinc-900/60" />
      <div className="relative">
        <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">Financial Health</p>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{score !== null ? `${score} / 100` : "N/A"}</p>
        </div>
        <p className="mt-2 text-xs text-emerald-400">Emergency Fund: {emergencyProgressFromPortfolio}% · FIRE Progress: {metrics.financialIndependenceProgress}%</p>
        <div className="mt-3 text-sm text-zinc-300">
          <div>Net Worth: {formatINR(metrics.netWorth)}</div>
          <div>Financial Assets: {formatINR(metrics.financialAssets)}</div>
        </div>
      </div>
    </div>
  );
}
