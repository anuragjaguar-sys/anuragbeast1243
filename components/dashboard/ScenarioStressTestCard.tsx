"use client";

import { useState } from "react";
import { useProfile } from "@/lib/profile/profile-context";
import { generateRetirementProjection } from "@/lib/retirement/retirement-engine";
import { getRetirementAssumptionsFromProfile } from "@/lib/profile/profile-retirement-adapter";

type ScenarioKey = "baseline" | "crash" | "stagflation" | "debtDelay" | "jobLoss";

interface ScenarioConfig {
  id: ScenarioKey;
  label: string;
  badge: string;
  badgeColor: string;
  headline: string;
  description: string;
  shockFactorText: string;
}

const SCENARIOS: Record<ScenarioKey, ScenarioConfig> = {
  baseline: {
    id: "baseline",
    label: "Status Quo",
    badge: "Baseline",
    badgeColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    headline: "Active Financial Trajectory",
    description: "Standard model: Debt cleared in ~1.9 years, after which ₹68,250/mo is redirected to equity with a 5% annual step-up.",
    shockFactorText: "12% Equity · 7.1% Debt · 6% Inflation",
  },
  crash: {
    id: "crash",
    label: "📉 30% Equity Crash",
    badge: "Market Crisis",
    badgeColor: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    headline: "Severe Equity Market Shock",
    description: "Simulates an immediate 30% collapse in equity assets (₹41L MF drops to ₹28.7L). Sovereign PPF (₹84L) remains fully protected.",
    shockFactorText: "-30% Equity Drop · PPF Unaffected",
  },
  stagflation: {
    id: "stagflation",
    label: "🔥 8% High Inflation",
    badge: "Macro Pressure",
    badgeColor: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    headline: "Persistent Sticky Inflation",
    description: "Lifestyle expenses compound at 8% instead of 6%, significantly elevating your terminal corpus threshold for retirement.",
    shockFactorText: "Inflation at 8% · Real Return Compressed",
  },
  debtDelay: {
    id: "debtDelay",
    label: "⏳ Debt Payoff Delayed (+2y)",
    badge: "Cashflow Drag",
    badgeColor: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
    headline: "Home Loan Extended to Year 4",
    description: "Unplanned expenses delay debt payoff to ~4 years. The monthly ₹68,250 equity surge is deferred by 24 months.",
    shockFactorText: "24-Month Investment Surge Deferral",
  },
  jobLoss: {
    id: "jobLoss",
    label: "🛡️ 18-Mo Income Freeze",
    badge: "Income Shock",
    badgeColor: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    headline: "Extended Career Disruption",
    description: "Zero investments for 18 months and ₹15L drawn from liquid mutual funds for living costs before normal contributions resume.",
    shockFactorText: "18m SIP Pause · ₹15L Capital Draw",
  },
};

function formatINR(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

export default function ScenarioStressTestCard() {
  const { profile, loading } = useProfile();
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>("baseline");

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-zinc-400">
        Loading stress test engine...
      </div>
    );
  }

  const baseAssumptions = getRetirementAssumptionsFromProfile(profile);
  const baselineProjection = generateRetirementProjection(baseAssumptions);
  const baseTarget = baselineProjection.yearlyProjection[baselineProjection.yearlyProjection.length - 1]?.targetCorpus || 131566367;

  // Build stressed assumptions based on selected scenario
  const stressedAssumptions = { ...baseAssumptions };

  if (activeScenario === "crash") {
    // Shocks ONLY equity (mutual funds), PPF remains intact
    stressedAssumptions.mutualFunds = baseAssumptions.mutualFunds * 0.70;
  } else if (activeScenario === "stagflation") {
    stressedAssumptions.inflationRate = 0.08;
  } else if (activeScenario === "debtDelay") {
    // Debt payoff delayed by 2 years
    stressedAssumptions.debtPayoffYears = (baseAssumptions.debtPayoffYears || 1.9) + 2.0;
  } else if (activeScenario === "jobLoss") {
    // 18 month pause + ₹15L withdrawal from equity
    stressedAssumptions.mutualFunds = Math.max(0, baseAssumptions.mutualFunds - 1500000);
    stressedAssumptions.monthlyInvestment = 0; // Paused initial run
    stressedAssumptions.debtPayoffYears = (baseAssumptions.debtPayoffYears || 1.9) + 1.5;
  }

  const stressedProjection = generateRetirementProjection(stressedAssumptions);
  const finalStressedYear = stressedProjection.yearlyProjection[stressedProjection.yearlyProjection.length - 1];

  const currentScenario = SCENARIOS[activeScenario];
  const deltaCorpus = finalStressedYear.corpus - baselineProjection.yearlyProjection[baselineProjection.yearlyProjection.length - 1].corpus;
  const targetCorpus = finalStressedYear.targetCorpus || baseTarget;

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-400">
            Resilience Stress-Testing Engine
          </span>
          <h2 className="mt-0.5 text-xl font-bold text-white">
            Macro & Personal Risk Modeler
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold ${currentScenario.badgeColor}`}>
            {currentScenario.badge}
          </span>
          <span className="rounded-lg bg-zinc-800/80 px-2.5 py-1 font-mono text-xs text-zinc-300">
            Age 54 Horizon
          </span>
        </div>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => {
          const item = SCENARIOS[key];
          const isSelected = activeScenario === key;
          return (
            <button
              key={key}
              onClick={() => setActiveScenario(key)}
              className={`rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                isSelected
                  ? "border border-indigo-500/50 bg-indigo-500/20 text-indigo-200 shadow-sm"
                  : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Scenario Insight Banner */}
      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-white">{currentScenario.headline}</h4>
          <span className="font-mono text-xs text-zinc-400">{currentScenario.shockFactorText}</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-zinc-300">{currentScenario.description}</p>
      </div>

      {/* Synchronized Metrics Display */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">Projected Corpus (Deterministic)</span>
          <p className="mt-1 font-mono text-xl font-bold text-white">
            {formatINR(finalStressedYear.corpus)}
          </p>
          <span className={`text-[11px] font-mono ${deltaCorpus >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {deltaCorpus === 0 ? "Baseline path" : `${deltaCorpus > 0 ? "+" : ""}${formatINR(deltaCorpus)} vs Baseline`}
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">Monte Carlo Median (50th %ile)</span>
          <p className="mt-1 font-mono text-xl font-bold text-indigo-300">
            {formatINR(finalStressedYear.corpus50 || 0)}
          </p>
          <span className="text-[11px] text-zinc-400">
            Range: {formatINR(finalStressedYear.corpus10 || 0)} – {formatINR(finalStressedYear.corpus90 || 0)}
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">Target Corpus Needed</span>
          <p className="mt-1 font-mono text-xl font-bold text-zinc-200">
            {formatINR(targetCorpus)}
          </p>
          <span className="text-[11px] text-zinc-400">
            {activeScenario === "stagflation" ? "Increased due to 8% inflation" : "Standard 6% inflation target"}
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">FIRE Success Probability</span>
          <p className={`mt-1 font-mono text-xl font-bold ${
            stressedProjection.probabilityOfSuccess >= 50
              ? "text-emerald-400"
              : stressedProjection.probabilityOfSuccess >= 30
              ? "text-amber-400"
              : "text-rose-400"
          }`}>
            {stressedProjection.probabilityOfSuccess}%
          </p>
          <span className="text-[11px] text-zinc-400">
            {stressedProjection.probabilityOfSuccess >= 40 ? "Stable buffer" : "Requires corrective SIP action"}
          </span>
        </div>
      </div>

      {/* Asset Class Protection Breakdown */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-950/30 p-3.5 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-zinc-400">Terminal Equity (MF): </span>
            <span className="font-mono font-semibold text-emerald-400">{formatINR(finalStressedYear.mutualFunds)}</span>
          </div>
          <div>
            <span className="text-zinc-400">Terminal Debt (PPF): </span>
            <span className="font-mono font-semibold text-blue-400">{formatINR(finalStressedYear.ppf)}</span>
          </div>
        </div>
        <div className="text-zinc-400">
          PPF Fixed Income Cushion: <span className="font-mono text-zinc-200 font-semibold">₹2.70 Cr Guaranteed</span>
        </div>
      </div>
    </div>
  );
}
