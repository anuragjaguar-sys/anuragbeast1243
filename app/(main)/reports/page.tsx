"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RetirementGrowthChart from "@/components/dashboard/RetirementGrowthChart";
import NetWorthCard from "@/components/dashboard/NetWorthTrendCard";
import AthenaMonthlyReviewCard from "@/components/dashboard/AthenaMonthlyReviewCard";
import {
  getPortfolio,
  getAssets,
  getLiabilities,
  getTotalAssets,
  getTotalLiabilities,
  getNetWorth,
  type Asset,
  type Liability,
} from "@/lib/investments";
import { useProfile } from "@/lib/profile/profile-context";

export default function ReportsPage() {
  const { profile, loading } = useProfile();
  const [portfolioData, setPortfolioData] = useState<{
    metrics: {
      status: string;
      totalAssets: number;
      totalLiabilities: number;
      netWorth: number;
      wealthScore: number;
    };
    assets: { id: string; name: string; currentValue: number }[];
    liabilities: { id: string; name: string; outstandingAmount: number }[];
  } | null>(null);

  const [reviewData, setReviewData] = useState<{
    currentMonth: string;
    currentInvRate: number;
    currentInvested: number;
    prevMonth: string;
    prevInvRate: number;
    prevInvested: number;
    rateDelta: number;
    isPositiveDelta: boolean;
  } | null>(null);

  useEffect(() => {
    const portfolio = getPortfolio();
    const assetsList = getAssets(portfolio);
    const liabilitiesList = getLiabilities(portfolio);

    const totalAssets = getTotalAssets(portfolio);
    const totalLiabilities = getTotalLiabilities(portfolio);
    const netWorth = getNetWorth(portfolio);

    const wealthScore = totalAssets > 0 
      ? Math.min(100, Math.round(((totalAssets - totalLiabilities) / totalAssets) * 100))
      : 0;

    const status = wealthScore >= 80 ? "Excellent" : wealthScore >= 50 ? "Good" : "Needs Attention";

    setPortfolioData({
      metrics: {
        status,
        totalAssets,
        totalLiabilities,
        netWorth,
        wealthScore,
      },
      assets: assetsList.map((a: Asset) => ({
        id: a.id,
        name: a.name,
        currentValue: a.currentValue,
      })),
      liabilities: liabilitiesList.map((l: Liability) => ({
        id: l.id,
        name: l.name,
        outstandingAmount: l.outstandingAmount,
      })),
    });

    const monthlySalary = profile?.income?.monthlySalary || 150000;
    const monthlyInvestment = profile?.income?.monthlyInvestment || 20000;
    const investmentRate = Math.round((monthlyInvestment / (monthlySalary || 1)) * 100);

    setReviewData({
      currentMonth: "Current Cycle",
      currentInvRate: investmentRate,
      currentInvested: monthlyInvestment,
      prevMonth: "Previous Cycle",
      prevInvRate: Math.max(0, investmentRate - 2),
      prevInvested: Math.max(0, monthlyInvestment - 5000),
      rateDelta: 2,
      isPositiveDelta: true,
    });
  }, [profile]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-zinc-400">Loading Financial Reports & Models...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <h1 className="text-3xl font-bold tracking-tight text-white">Financial Intelligence Reports</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Multi-horizon trajectory forecasts, net worth solvency audits, and capital velocity tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/spending-analytics"
            className="rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-blue-500 hover:text-white"
          >
            Spending Analytics →
          </Link>
          <Link
            href="/financial-statement"
            className="rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-emerald-500 hover:text-white"
          >
            Monthly Statement →
          </Link>
        </div>
      </div>

      {/* Primary Row: Long-Term Projection */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-zinc-200">Retirement & Long-Term Growth Trajectory</h2>
        <RetirementGrowthChart />
      </div>

      {/* Secondary Row: Solvency and MoM Review */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {portfolioData && (
          <NetWorthCard
            metrics={portfolioData.metrics}
            assets={portfolioData.assets}
            liabilities={portfolioData.liabilities}
          />
        )}

        {reviewData && (
          <AthenaMonthlyReviewCard reviewData={reviewData} />
        )}
      </div>
    </main>
  );
}
