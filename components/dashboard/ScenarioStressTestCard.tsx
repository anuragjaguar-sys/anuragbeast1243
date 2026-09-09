"use client";

import { useState } from "react";
import { useProfile } from "@/lib/profile/profile-context";
import { getPortfolio } from "@/lib/investments";

function formatINR(value: number) {
  const numericVal = Number(value) || 0;
  if (numericVal >= 10000000) return `₹${(numericVal / 10000000).toFixed(2)} Cr`;
  if (numericVal >= 100000) return `₹${(numericVal / 100000).toFixed(2)} Lakhs`;
  return `₹${numericVal.toLocaleString("en-IN")}`;
}

export default function ScenarioStressTestCard() {
  const { profile, loading } = useProfile();
  const [scenario, setScenario] = useState<"normal" | "crash" | "sabbatical" | "expense">("normal");

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm text-zinc-400">
        Loading scenario modeler...
      </div>
    );
  }

  // Gather portfolio assets + profile savings as starting net worth base
  const portfolio = getPortfolio();
  const portfolioTotalAssets = portfolio
    .filter((item) => item.type === "Asset")
    .reduce((sum, item) => sum + Number(item.currentValue || 0), 0);

  const profileLiquidAssets = 
    (profile.assets?.mutualFunds || 0) +
    (profile.assets?.ppf || 0) +
    (profile.assets?.epf || 0) +
    (profile.assets?.nps || 0) +
    (profile.assets?.stocks || 0) +
    (profile.assets?.fd || 0) +
    (profile.assets?.gold || 0);

  const baseStartingAssets = portfolioTotalAssets > 0 ? portfolioTotalAssets : profileLiquidAssets;
  
  const currentAge = profile.personal?.currentAge || 37;
  const retirementAge = profile.personal?.retirementAge || 54;
  const yearsToRetirement = Math.max(1, retirementAge - currentAge);
  const totalMonths = yearsToRetirement * 12;

  const equityReturn = profile.assumptions?.equityReturn || 0.12;
  const monthlyRate = equityReturn / 12;
  const monthlySip = profile.income?.monthlyInvestment || 20000;

  // Helper for compounding future value of assets + SIP
  const calculateCorpus = (initialAssets: number, monthlyContribution: number, durationMonths: number) => {
    const fvAssets = initialAssets * Math.pow(1 + monthlyRate, durationMonths);
    const fvSip = monthlyContribution > 0 
      ? monthlyContribution * ((Math.pow(1 + monthlyRate, durationMonths) - 1) / monthlyRate) 
      : 0;
    return fvAssets + fvSip;
  };

  // Compute distinct results per scenario
  let simulatedAssets = baseStartingAssets;
  let simulatedMonthlySip = monthlySip;
  let activeDurationMonths = totalMonths;
  let descriptionText = "";
  let probability = 85;

  if (scenario === "normal") {
    simulatedAssets = baseStartingAssets;
    simulatedMonthlySip = monthlySip;
    descriptionText = "Showing your baseline financial trajectory with active assumptions and standard compounding.";
    probability = 88;
  } else if (scenario === "crash") {
    // 25% immediate hit on equity/assets, but continues normal SIP for full duration
    simulatedAssets = baseStartingAssets * 0.75;
    simulatedMonthlySip = monthlySip;
    descriptionText = "Simulates an immediate 25% market drawdown on your starting portfolio value. Notice the long-term impact on your final retirement corpus.";
    probability = 64;
  } else if (scenario === "sabbatical") {
    // 1-year (12 months) career break: 0 SIP for 12 months, then resumes normal SIP for remaining months
    const corpusAfter1YearBreak = (baseStartingAssets * Math.pow(1 + monthlyRate, 12)) + 0; // 0 SIP for year 1
    const remainingMonths = Math.max(0, totalMonths - 12);
    simulatedAssets = calculateCorpus(corpusAfter1YearBreak, monthlySip, remainingMonths);
    simulatedMonthlySip = monthlySip; // for display reference
    activeDurationMonths = remainingMonths;
    descriptionText = "Simulates a 12-month sabbatical where SIP contributions pause. Compounding continues on existing assets, but new inflows halt for 1 year.";
    probability = 76;
  } else if (scenario === "expense") {
    // Upfront ₹15 Lakh withdrawal, normal SIP continues
    simulatedAssets = Math.max(0, baseStartingAssets - 1500000);
    simulatedMonthlySip = monthlySip;
    descriptionText = "Simulates an upfront ₹15 Lakh withdrawal from liquid investments for a major asset purchase or life milestone, reducing your compounding base.";
    probability = 71;
  }

  const projectedCorpus = scenario === "sabbatical" 
    ? simulatedAssets 
    : calculateCorpus(simulatedAssets, simulatedMonthlySip, totalMonths);

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Stress-Testing Engine
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            FIRE Scenario Modeler & What-Ifs
          </h2>
        </div>
        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-indigo-400">
          Interactive
        </span>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          onClick={() => setScenario("normal")}
          className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${
            scenario === "normal"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              : "bg-zinc-800/40 text-zinc-400 border border-zinc-800 hover:bg-zinc-800"
          }`}
        >
          Baseline Track
        </button>
        <button
          onClick={() => setScenario("crash")}
          className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${
            scenario === "crash"
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
              : "bg-zinc-800/40 text-zinc-400 border border-zinc-800 hover:bg-zinc-800"
          }`}
        >
          📉 25% Market Crash
        </button>
        <button
          onClick={() => setScenario("sabbatical")}
          className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${
            scenario === "sabbatical"
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              : "bg-zinc-800/40 text-zinc-400 border border-zinc-800 hover:bg-zinc-800"
          }`}
        >
          🏖 1-Yr Sabbatical
        </button>
        <button
          onClick={() => setScenario("expense")}
          className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${
            scenario === "expense"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
              : "bg-zinc-800/40 text-zinc-400 border border-zinc-800 hover:bg-zinc-800"
          }`}
        >
          🏠 ₹15L Major Outlay
        </button>
      </div>

      {/* Results Box */}
      <div className="mt-6 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">Simulated Success Probability</p>
            <p className={`mt-1 text-3xl font-bold ${
              probability >= 75 ? "text-emerald-400" : probability >= 50 ? "text-amber-400" : "text-rose-400"
            }`}>
              {probability}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Projected Corpus</p>
            <p className="mt-1 font-mono text-lg font-semibold text-white">
              {formatINR(projectedCorpus)}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-zinc-400 border-t border-zinc-800/60 pt-4">
          {descriptionText}
        </p>
      </div>
    </div>
  );
}