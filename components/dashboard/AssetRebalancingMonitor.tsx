"use client";

import React, { useState } from "react";
import Link from "next/link";

interface PortfolioItem {
  id?: string;
  name?: string;
  type?: string;
  category?: string;
  assetClass?: string;
  currentValue?: number | string;
  investedAmount?: number | string;
}

interface AssetRebalancingMonitorProps {
  portfolio?: PortfolioItem[];
}

export default function AssetRebalancingMonitor({ portfolio = [] }: AssetRebalancingMonitorProps) {
  // Target Liquid Allocation: 70% Equity / 25% Fixed Income & Debt / 5% Cash Buffer
  const [targetEquity, setTargetEquity] = useState(70);
  const [targetDebt, setTargetDebt] = useState(25);
  const targetCash = Math.max(0, 100 - targetEquity - targetDebt);

  const assets = (portfolio || []).filter((item) => item.type === "Asset");

  const parseVal = (val: any) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  // Bucket classifications
  let equityVal = 0;
  let debtVal = 0;
  let cashVal = 0;
  let realEstateVal = 0;
  let goldVal = 0;

  assets.forEach((item) => {
    const cat = (item.category || "").toLowerCase();
    const name = (item.name || "").toLowerCase();
    const cls = (item.assetClass || "").toLowerCase();
    const val = parseVal(item.currentValue ?? item.investedAmount ?? 0);

    if (cat.includes("real estate") || cat.includes("property") || cls.includes("real estate")) {
      realEstateVal += val;
    } else if (
      cat.includes("savings") ||
      cat.includes("emergency") ||
      cat.includes("cash") ||
      cls.includes("cash") ||
      name.includes("savings") ||
      name.includes("emergency")
    ) {
      cashVal += val;
    } else if (
      cat.includes("ppf") ||
      cat.includes("epf") ||
      cat.includes("nps") ||
      cat.includes("fixed deposit") ||
      cat.includes("fd") ||
      cat.includes("debt") ||
      cls.includes("debt")
    ) {
      debtVal += val;
    } else if (cat.includes("gold") || cls.includes("commodity")) {
      goldVal += val;
    } else {
      // Default liquid investment to equity (Mutual funds, Stocks)
      equityVal += val;
    }
  });

  const liquidTotal = equityVal + debtVal + cashVal + goldVal;
  const comprehensiveTotal = liquidTotal + realEstateVal;

  const currentEquityPct = liquidTotal > 0 ? (equityVal / liquidTotal) * 100 : 0;
  const currentDebtPct = liquidTotal > 0 ? (debtVal / liquidTotal) * 100 : 0;
  const currentCashPct = liquidTotal > 0 ? (cashVal / liquidTotal) * 100 : 0;

  // Drift calculation
  const equityDrift = currentEquityPct - targetEquity;
  const isBalanced = Math.abs(equityDrift) <= 3;

  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  // Cash-flow rebalancing amount
  const idealEquityAmount = (targetEquity / 100) * liquidTotal;
  const rebalanceGap = idealEquityAmount - equityVal;

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6 md:p-8 shadow-2xl backdrop-blur-md mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800/80 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-semibold">
              Asset Allocation & Rebalancing Engine
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1">
            Liquid Portfolio Asset Architecture
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Target: {targetEquity}% Equity | {targetDebt}% Debt & Sovereign | {targetCash}% Cash
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              isBalanced
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : equityDrift > 0
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
            }`}
          >
            {isBalanced
              ? "✓ Allocation Balanced"
              : equityDrift > 0
              ? `Equity Overweight (+${equityDrift.toFixed(1)}%)`
              : `Equity Underweight (${equityDrift.toFixed(1)}%)`}
          </span>
        </div>
      </div>

      {/* Allocation Progress Bar */}
      <div className="mt-6 space-y-2">
        <div className="h-3 w-full rounded-full bg-zinc-800 overflow-hidden flex">
          <div
            style={{ width: `${currentEquityPct}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Equity: ${currentEquityPct.toFixed(1)}%`}
          />
          <div
            style={{ width: `${currentDebtPct}%` }}
            className="bg-cyan-500 transition-all duration-500"
            title={`Debt: ${currentDebtPct.toFixed(1)}%`}
          />
          <div
            style={{ width: `${currentCashPct}%` }}
            className="bg-amber-500 transition-all duration-500"
            title={`Cash: ${currentCashPct.toFixed(1)}%`}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            Equity: {currentEquityPct.toFixed(1)}% ({formatINR(equityVal)})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-500 inline-block" />
            Debt/EPF/PPF: {currentDebtPct.toFixed(1)}% ({formatINR(debtVal)})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
            Liquid Cash: {currentCashPct.toFixed(1)}% ({formatINR(cashVal)})
          </span>
        </div>
      </div>

      {/* Grid Breakdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
          <p className="text-[11px] font-mono uppercase text-emerald-400 font-semibold">
            1. Equity Engine
          </p>
          <p className="text-xl font-black text-white font-mono mt-1">{formatINR(equityVal)}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Target: {targetEquity}% | Actual: {currentEquityPct.toFixed(1)}%</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
          <p className="text-[11px] font-mono uppercase text-cyan-400 font-semibold">
            2. Sovereign & Debt
          </p>
          <p className="text-xl font-black text-white font-mono mt-1">{formatINR(debtVal)}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Target: {targetDebt}% | Actual: {currentDebtPct.toFixed(1)}%</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
          <p className="text-[11px] font-mono uppercase text-amber-400 font-semibold">
            3. Liquid Reserve
          </p>
          <p className="text-xl font-black text-white font-mono mt-1">{formatINR(cashVal)}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Savings & Bank Buffer</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-purple-500/30">
          <p className="text-[11px] font-mono uppercase text-purple-400 font-semibold">
            4. Real Estate (Flat)
          </p>
          <p className="text-xl font-black text-white font-mono mt-1">{formatINR(realEstateVal)}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Illiquid Baseline</p>
        </div>
      </div>

      {/* Cash-Flow Rebalancing Directive */}
      <div className="mt-6 p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            ⚡ Tax-Free Cash-Flow Rebalancing Directive
          </span>
          <p className="text-xs text-zinc-300">
            {isBalanced ? (
              "Portfolio is balanced within target thresholds. Maintain your normal monthly SIP run rate."
            ) : equityDrift < 0 ? (
              <>
                Equity is underweight by {Math.abs(equityDrift).toFixed(1)}%. Tilt your next surplus
                deployments toward broad equity index funds without selling existing fixed debt.
              </>
            ) : (
              <>
                Equity is overweight by +{equityDrift.toFixed(1)}%. Direct incremental monthly savings into
                debt/liquid parking to rebalance naturally without triggering capital gains taxes.
              </>
            )}
          </p>
        </div>
        <Link
          href="/portfolio"
          className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors whitespace-nowrap"
        >
          Manage Holdings →
        </Link>
      </div>
    </div>
  );
}
