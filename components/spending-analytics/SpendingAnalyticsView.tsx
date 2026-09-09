"use client";

import { useEffect, useState } from "react";
import { loadMonthlyReview } from "@/lib/storage";
import { formatINR } from "@/lib/financial-engine";

export default function SpendingAnalyticsCard() {
  const [comparison, setComparison] = useState({
    currentMonth: "August 2026",
    previousMonth: "July 2026",
    currentInvested: 60000,
    previousInvested: 50000,
    investedDiff: 10000, // +₹10k more invested
    currentDiscretionary: 45000,
    previousDiscretionary: 55000,
    discretionaryDiff: -10000, // -₹10k less spent on lifestyle/shopping (shoes etc)
    currentFixed: 80000,
    previousFixed: 78000,
    fixedDiff: 20000,
    cannibalizationDetected: false,
  });

  useEffect(() => {
    try {
      const rawStorage = localStorage.getItem("fire54_monthly_reviews") || localStorage.getItem("fire54-monthly-reviews");
      if (rawStorage) {
        const parsed = JSON.parse(rawStorage);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          const curr = parsed[parsed.length - 1];
          const prev = parsed[parsed.length - 2];

          const cInv = Number(curr.cashAllocation?.investments || curr.investments || 60000);
          const pInv = Number(prev.cashAllocation?.investments || prev.investments || 50000);
          
          const cDisc = Number(curr.expenses?.discretionary || curr.discretionary || 45000);
          const pDisc = Number(prev.expenses?.discretionary || prev.discretionary || 55000);

          const cFix = Number(curr.expenses?.fixed || curr.fixed || 80000);
          const pFix = Number(prev.expenses?.fixed || prev.fixed || 78000);

          const invDiff = cInv - pInv;
          const discDiff = cDisc - pDisc;

          // Check if discretionary spike cannibalized mutual funds / investments
          const cannibalized = discDiff > 0 && invDiff < 0;

          setComparison({
            currentMonth: curr.month || "Current",
            previousMonth: prev.month || "Previous",
            currentInvested: cInv,
            previousInvested: pInv,
            investedDiff: invDiff,
            currentDiscretionary: cDisc,
            previousDiscretionary: pDisc,
            discretionaryDiff: discDiff,
            currentFixed: cFix,
            previousFixed: pFix,
            fixedDiff: cFix - pFix,
            cannibalizationDetected: cannibalized,
          });
        }
      }
    } catch {
      // fallback handled by default state
    }
  }, []);

  return (
    <div className="flex h-full flex-col rounded-3xl border border-zinc-800/60 bg-zinc-950/60 p-6 backdrop-blur-md shadow-xl justify-between">
      <div>
        {/* Header */}
        <div className="mb-4 flex items-start justify-between border-b border-zinc-800/60 pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-blue-400">
              Granular Outflow Intelligence
            </p>
            <h3 className="mt-1 text-xl font-bold text-white">
              Head-by-Head MoM Comparison
            </h3>
          </div>
          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 font-mono text-[10px] font-medium text-blue-400 uppercase">
            {comparison.currentMonth} vs {comparison.previousMonth}
          </span>
        </div>

        {/* Head-by-Head Rupee Breakdown */}
        <div className="space-y-3">
          {/* Investments Head */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-zinc-400">Investments (SIP / Equity)</span>
              <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-md ${
                comparison.investedDiff >= 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {comparison.investedDiff >= 0 ? `+${formatINR(comparison.investedDiff)} vs avg` : `${formatINR(comparison.investedDiff)} vs avg`}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-bold text-white font-mono">{formatINR(comparison.currentInvested)}</span>
              <span className="text-xs text-zinc-500">Prior: {formatINR(comparison.previousInvested)}</span>
            </div>
          </div>

          {/* Discretionary / Shopping (Shoes, etc.) Head */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-zinc-400">Discretionary (Shopping / Shoes)</span>
              <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-md ${
                comparison.discretionaryDiff <= 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {comparison.discretionaryDiff <= 0 ? `${formatINR(Math.abs(comparison.discretionaryDiff))} less spent` : `+${formatINR(comparison.discretionaryDiff)} more spent`}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-bold text-white font-mono">{formatINR(comparison.currentDiscretionary)}</span>
              <span className="text-xs text-zinc-500">Prior: {formatINR(comparison.previousDiscretionary)}</span>
            </div>
          </div>

          {/* Fixed Expenses Head */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-zinc-400">Fixed Expenses (Bills / EMI)</span>
              <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-md ${
                comparison.fixedDiff <= 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                {comparison.fixedDiff <= 0 ? `${formatINR(Math.abs(comparison.fixedDiff))} lower` : `+${formatINR(comparison.fixedDiff)} higher`}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-bold text-white font-mono">{formatINR(comparison.currentFixed)}</span>
              <span className="text-xs text-zinc-500">Prior: {formatINR(comparison.previousFixed)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Athena Behavioral Guardrail Directive */}
      <div className="mt-6 border-t border-zinc-800/60 pt-4">
        <h4 className="font-mono text-[10px] uppercase tracking-wider text-indigo-400 mb-1">
          Athena Behavioral Guardrail
        </h4>
        <p className="text-xs leading-relaxed text-zinc-300">
          {comparison.investedDiff >= 0 ? (
            <>
              <strong className="text-emerald-400">Capital Expansion:</strong> You invested <strong className="text-white">{formatINR(Math.abs(comparison.investedDiff))} more</strong> this month compared to your previous baseline. Your discretionary outlays (shopping, shoes, etc.) did <strong className="text-white">not</strong> compromise your mutual fund SIP liquidity.
            </>
          ) : (
            <>
              <strong className="text-rose-400">Capital Cannibalization Warning:</strong> Increased discretionary outlays (such as lifestyle or shopping expenses) resulted in you investing <strong className="text-white">{formatINR(Math.abs(comparison.investedDiff))} less</strong> in your mutual funds this month. Protect your baseline SIP allocation from lifestyle creep!
            </>
          )}
        </p>
      </div>
    </div>
  );
}