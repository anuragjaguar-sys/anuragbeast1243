"use client";

import { useEffect, useState } from "react";
import { loadMonthlyReview } from "@/lib/storage";
import { getWealthAllocationData, type WealthAllocationData } from "@/lib/wealth-allocation-engine";
import WealthFlowVisualization from "@/components/wealth-allocation/WealthFlowVisualization";
import WealthAllocationChart from "@/components/wealth-allocation/WealthAllocationChart";
import LiquidityPositionCard from "@/components/wealth-allocation/LiquidityPositionCard";
import WealthAllocationBreakdown from "@/components/wealth-allocation/WealthAllocationBreakdown";
import MonthlyWealthSummaryCard from "@/components/wealth-allocation/MonthlyWealthSummaryCard";
import MonthlyWealthScore from "@/components/wealth-allocation/MonthlyWealthScore";
import LifetimeWealthSummaryCard from "@/components/wealth-allocation/LifetimeWealthSummaryCard";
import CFONotesCard from "@/components/wealth-allocation/CFONotesCard";
import AllocationStatusBanner from "@/components/wealth-allocation/AllocationStatusBanner";

export default function WealthAllocationPage() {
  const [data, setData] = useState<WealthAllocationData | null>(null);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const loadData = () => {
      const statement = loadMonthlyReview();
      if (statement) {
        const wealthData = getWealthAllocationData(statement);
        setData(wealthData);
        setHasData(true);
      } else {
        setHasData(false);
      }
    };

    loadData();

    // Listen for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "fire54_monthly_reviews") {
        loadData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  if (!hasData) {
    return (
      <div className="min-h-full bg-[#0a0a0c] font-sans text-zinc-100">
        {/* Ambient background */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
          <div className="absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-blue-500/[0.03] blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-[300px] w-[600px] rounded-full bg-violet-500/[0.03] blur-[100px]" />
        </div>

        <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {/* Header */}
          <header className="mb-10">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
                <span className="text-lg">💰</span>
              </div>
              <p className="font-mono text-xs tracking-[0.3em] text-emerald-500/80 uppercase">
                Wealth Allocation
              </p>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Wealth Allocation
            </h1>
            <p className="mt-1 text-base text-zinc-400">
              Where did every rupee of my salary go?
            </p>
          </header>

          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-12 backdrop-blur-sm text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/80 mx-auto">
              <span className="text-3xl">📊</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No financial data available yet</h2>
            <p className="text-zinc-400 mb-6">
              Complete your Monthly Financial Statement to see your wealth allocation analysis.
            </p>
            <a
              href="/financial-statement"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/30"
            >
              Go to Financial Statement
            </a>
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-full bg-[#0a0a0c] font-sans text-zinc-100">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
        <div className="absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-blue-500/[0.03] blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[600px] rounded-full bg-violet-500/[0.03] blur-[100px]" />
      </div>

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <header className="mb-10">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
              <span className="text-lg">💰</span>
            </div>
            <p className="font-mono text-xs tracking-[0.3em] text-emerald-500/80 uppercase">
              Wealth Allocation
            </p>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Wealth Allocation
          </h1>
          <p className="mt-1 text-base text-zinc-400">
            Where did every rupee of my salary go?
          </p>
        </header>

        {/* Allocation Status Banner */}
        <div className="mb-8">
          <AllocationStatusBanner allocation={data.wealthAllocation} />
        </div>

        {/* Top Row: Score, Chart, Flow */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <MonthlyWealthScore score={data.monthlyWealthScore} />
          <WealthAllocationChart buckets={data.wealthAllocation.buckets} />
          <WealthFlowVisualization allocation={data.wealthAllocation} />
        </div>

        {/* Middle Row: Monthly & Lifetime Summaries */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MonthlyWealthSummaryCard summary={data.monthlyWealthSummary} />
          <LifetimeWealthSummaryCard summary={data.lifetimeWealthSummary} />
        </div>

        {/* Bottom Row: Liquidity, Breakdown, CFO Notes */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <LiquidityPositionCard liquidity={data.liquidityPosition} />
          <WealthAllocationBreakdown breakdown={data.wealthAllocationBreakdown} />
          <CFONotesCard notes={data.cfoNotes} />
        </div>
      </main>
    </div>
  );
}
