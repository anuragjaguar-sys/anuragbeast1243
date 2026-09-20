"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import InvestmentPortfolioCard from "@/components/dashboard/InvestmentPortfolioCard";
import {
  getPortfolio,
  getAssets,
  getTotalAssets,
  getTotalInvested,
  getTotalProfit,
  getMonthlyInvestment,
  getAssetAllocation,
  type Asset,
} from "@/lib/investments";

function formatINR(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

export default function InvestmentsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [summaryData, setSummaryData] = useState<{
    summary: {
      totalAssets: number;
      totalInvested: number;
      totalProfit: number;
      overallReturn: number;
      monthlyInvestment: number;
      largestHolding: string;
      allocation: { equity: number; debt: number; alternative: number };
    };
    insights: string[];
  } | null>(null);

  useEffect(() => {
    const portfolio = getPortfolio();
    const activeAssets = getAssets(portfolio);
    setAssets(activeAssets);

    const totalAssets = getTotalAssets(portfolio);
    const totalInvested = getTotalInvested(portfolio);
    const totalProfit = getTotalProfit(portfolio);
    const monthlyInvestment = getMonthlyInvestment(portfolio);
    const allocation = getAssetAllocation(portfolio);

    const overallReturn = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    let largestHolding = "None";
    if (activeAssets.length > 0) {
      const sorted = [...activeAssets].sort((a, b) => b.currentValue - a.currentValue);
      largestHolding = sorted[0].name || sorted[0].category;
    }

    const insights: string[] = [];
    if (monthlyInvestment > 0) {
      insights.push(`Active SIP momentum: ${formatINR(monthlyInvestment)} allocated each month towards compounding assets.`);
    }
    if (allocation.equity > 65) {
      insights.push(`Equity-heavy stance (${allocation.equity}%): Optimised for long-term growth leading up to FIRE54.`);
    } else if (allocation.equity < 40 && totalAssets > 0) {
      insights.push(`Conservative allocation: Consider raising equity exposure if your retirement horizon is greater than 10 years.`);
    }
    if (totalAssets > 0) {
      insights.push(`Portfolio contains ${activeAssets.length} tracked asset lines across equity, debt, and liquid reserves.`);
    }

    setSummaryData({
      summary: {
        totalAssets,
        totalInvested,
        totalProfit,
        overallReturn,
        monthlyInvestment,
        largestHolding,
        allocation: {
          equity: allocation.equity,
          debt: allocation.debt,
          alternative: allocation.hybrid + allocation.alternative,
        },
      },
      insights,
    });
  }, []);

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📈</span>
            <h1 className="text-3xl font-bold tracking-tight text-white">Investment Analytics</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Real-time asset performance, allocation distribution, and systematic growth tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/portfolio"
            className="rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-emerald-500 hover:text-white"
          >
            Manage Holdings →
          </Link>
        </div>
      </div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Summary Card */}
        <div className="lg:col-span-1">
          {summaryData ? (
            <InvestmentPortfolioCard
              summary={summaryData.summary}
              insights={summaryData.insights}
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-zinc-800/60 bg-zinc-900/40">
              <p className="text-sm text-zinc-500">Loading portfolio metrics...</p>
            </div>
          )}
        </div>

        {/* Right: Detailed Holdings List */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Active Holdings Breakdown</h2>
            <span className="text-xs text-zinc-400 font-mono">{assets.length} Assets Tracked</span>
          </div>

          {assets.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <p>No investment assets recorded yet.</p>
              <Link
                href="/portfolio"
                className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Add Your First Asset
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs text-zinc-400 uppercase font-mono">
                    <th className="pb-3">Asset</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3 text-right">Invested</th>
                    <th className="pb-3 text-right">Current Value</th>
                    <th className="pb-3 text-right">Monthly SIP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3.5 font-medium text-white">{asset.name}</td>
                      <td className="py-3.5 text-xs text-zinc-400">
                        <span className="rounded-md border border-zinc-700/60 bg-zinc-800/60 px-2 py-0.5">
                          {asset.category}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-mono">{formatINR(asset.investedAmount)}</td>
                      <td className="py-3.5 text-right font-mono font-semibold text-emerald-400">
                        {formatINR(asset.currentValue)}
                      </td>
                      <td className="py-3.5 text-right font-mono text-zinc-400">
                        {asset.monthlyContribution > 0 ? formatINR(asset.monthlyContribution) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
