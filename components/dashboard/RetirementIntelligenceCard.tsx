"use client";

import { useState } from "react";
import { useProfile } from "@/lib/profile/profile-context";
import { getPortfolio } from "@/lib/investments";
import { getRetirementProjection } from "@/lib/retirement/retirement-engine";
import { loadMonthlyReview } from "@/lib/storage";

function formatCompact(value: number) {
  if (value === 0) return "₹0";
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function RetirementCard() {
  const { profile, loading } = useProfile();
  const [scenario, setScenario] = useState<"hybrid" | "stepUp" | "aggressive" | "statusQuo">("hybrid");

  if (loading) {
    return (
      <div className="flex h-full flex-col rounded-3xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
        <p className="text-sm text-zinc-400">Loading retirement intelligence...</p>
      </div>
    );
  }

  const projection = getRetirementProjection(profile);
  const baseProjectedCorpus = projection.projectedCorpus ?? 0;
  const requiredCorpus = projection.requiredCorpus ?? 0;
  const yearsLeft = projection.yearsLeft ?? 1;
  const currentCorpus = projection.currentCorpus ?? 0;

  // Monthly base SIP from monthly review or profile
  let monthlyReviewSip = 20000;
  try {
    const latestReview = loadMonthlyReview();
    if (latestReview?.cashAllocation?.investments) {
      monthlyReviewSip = Number(latestReview.cashAllocation.investments);
    }
  } catch {}
  const baseSip = monthlyReviewSip > 0 ? monthlyReviewSip : (profile.income?.monthlyInvestment || 20000);

  const equityReturn = profile.assumptions?.equityReturn || 0.12;
  const monthlyRate = equityReturn / 12;
  const totalMonths = yearsLeft * 12;

  // Portfolio & Liabilities for Hybrid Scenario
  const portfolio = getPortfolio();
  const homeLoan = portfolio.find(item => item.type === "Liability" && item.category === "Home Loan") || portfolio.find(item => item.type === "Liability");
  const totalDebt = homeLoan ? Number(homeLoan.currentValue || 0) : 1300000;
  const interestRate = homeLoan && "interestRate" in homeLoan ? Number(homeLoan.interestRate) : 8.1;
  const emi = homeLoan && "emi" in homeLoan ? Number(homeLoan.emi || 0) : 18500;
  const monthlyInterest = interestRate / 100 / 12;

  // Scenario Math Modeling
  let projectedCorpus = baseProjectedCorpus;
  let scenarioTitle = "Baseline Track";
  let directiveText = "Your simulation is running on standard profile inputs.";

  if (scenario === "hybrid") {
    // Sequential Hybrid: Prepay loan fast + supercharge post-payoff SIP
    const extraSurplus = 50000;
    let tempBal = totalDebt;
    let loanMonths = 0;
    const totalPrepay = emi + extraSurplus;
    while (tempBal > 0 && loanMonths < totalMonths) {
      const intCharge = tempBal * monthlyInterest;
      tempBal -= (totalPrepay - intCharge);
      loanMonths++;
    }
    const phase1 = (currentCorpus * Math.pow(1 + monthlyRate, loanMonths)) + (baseSip * ((Math.pow(1 + monthlyRate, loanMonths) - 1) / monthlyRate));
    const superSip = baseSip + extraSurplus + emi;
    const remMonths = Math.max(0, totalMonths - loanMonths);
    const phase2 = superSip * ((Math.pow(1 + monthlyRate, remMonths) - 1) / monthlyRate);
    projectedCorpus = (phase1 * Math.pow(1 + monthlyRate, remMonths)) + phase2;
    scenarioTitle = "Sequential Hybrid Model";
    directiveText = "⭐ Recommended: Wiping your home loan first and rolling your EMI into SIPs maximizes your compounding velocity while eliminating debt risk.";
  } else if (scenario === "stepUp") {
    // 10% Annual Step-up SIP
    let stepUpCorpus = currentCorpus * Math.pow(1 + monthlyRate, totalMonths);
    let currentStepSip = baseSip;
    for (let yr = 0; yr < yearsLeft; yr++) {
      for (let m = 0; m < 12; m++) {
        const remMonths = totalMonths - (yr * 12 + m);
        stepUpCorpus += currentStepSip * Math.pow(1 + monthlyRate, remMonths - 1);
      }
      currentStepSip *= 1.10;
    }
    projectedCorpus = stepUpCorpus;
    scenarioTitle = "10% Annual Step-Up SIP";
    directiveText = "📈 Scaling your SIP contributions annually in tandem with career growth naturally closes lifestyle gaps without aggressive upfront cuts.";
  } else if (scenario === "aggressive") {
    // Aggressive Sprint: Base SIP + Extra Surplus (₹70k/mo)
    const aggressiveSip = baseSip + 50000;
    projectedCorpus = (currentCorpus * Math.pow(1 + monthlyRate, totalMonths)) + 
      (aggressiveSip * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate));
    scenarioTitle = "Aggressive Equity Sprint";
    directiveText = "🚀 Routing heavy surplus directly into equity achieves peak terminal valuation, though it leaves the home loan active.";
  } else if (scenario === "statusQuo") {
    // Flat Status Quo SIP
    projectedCorpus = (currentCorpus * Math.pow(1 + monthlyRate, totalMonths)) + 
      (baseSip * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate));
    scenarioTitle = "Status Quo (Flat SIP)";
    directiveText = "⚠️ Flat contributions fail to scale with inflation over 17 years. Consider shifting to a hybrid or step-up model.";
  }

  const fundingGap = requiredCorpus - projectedCorpus;
  const successProbability = Math.min(100, Math.max(10, Math.round((projectedCorpus / requiredCorpus) * 100)));

  return (
    <div className="flex h-full flex-col rounded-3xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm shadow-xl">
      {/* Header & Probability */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Retirement Intelligence OS
          </p>
          <h3 className="mt-1 text-xl font-bold text-white">
            Retirement Scenarios
          </h3>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Success Prob.
          </div>
          <div
            className={`text-2xl font-black ${
              successProbability >= 75
                ? "text-emerald-400"
                : successProbability >= 50
                ? "text-amber-400"
                : "text-rose-400"
            }`}
          >
            {successProbability}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full transition-all duration-500 ${
              successProbability >= 75 ? "bg-emerald-500" : successProbability >= 50 ? "bg-amber-500" : "bg-rose-500"
            }`}
            style={{ width: `${Math.min(100, successProbability)}%` }}
          />
        </div>
      </div>

      {/* Scenario Selection Tabs */}
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-1.5 sm:grid-cols-4">
        <button
          onClick={() => setScenario("hybrid")}
          className={`rounded-lg px-2.5 py-2 text-xs font-medium transition ${
            scenario === "hybrid" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold" : "text-zinc-400 hover:text-white"
          }`}
        >
          ⭐ Hybrid Model
        </button>
        <button
          onClick={() => setScenario("stepUp")}
          className={`rounded-lg px-2.5 py-2 text-xs font-medium transition ${
            scenario === "stepUp" ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 font-semibold" : "text-zinc-400 hover:text-white"
          }`}
        >
          📈 10% Step-Up
        </button>
        <button
          onClick={() => setScenario("aggressive")}
          className={`rounded-lg px-2.5 py-2 text-xs font-medium transition ${
            scenario === "aggressive" ? "bg-purple-500/20 text-purple-400 border border-purple-500/40 font-semibold" : "text-zinc-400 hover:text-white"
          }`}
        >
          🚀 Aggressive
        </button>
        <button
          onClick={() => setScenario("statusQuo")}
          className={`rounded-lg px-2.5 py-2 text-xs font-medium transition ${
            scenario === "statusQuo" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold" : "text-zinc-400 hover:text-white"
          }`}
        >
          ⚖️ Status Quo
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">Current Corpus</p>
          <p className="mt-1 text-xl font-bold text-white font-mono">
            {formatCompact(currentCorpus)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">Projected ({scenarioTitle})</p>
          <p className="mt-1 text-xl font-bold text-emerald-400 font-mono">
            {formatCompact(projectedCorpus)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">Target Corpus</p>
          <p className="mt-1 text-xl font-bold text-white font-mono">
            {formatCompact(requiredCorpus)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">Time Horizon</p>
          <p className="mt-1 text-xl font-bold text-white font-mono">
            {yearsLeft} Years
          </p>
        </div>
      </div>

      {/* Funding Status Banner */}
      <div className="mt-4 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Funding Status</p>
          <p className={`text-sm font-bold ${fundingGap > 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {fundingGap > 0 ? `Corpus Gap: ${formatCompact(fundingGap)}` : `Surplus: ${formatCompact(Math.abs(fundingGap))}`}
          </p>
        </div>
        <span className="font-mono text-xs text-zinc-400">
          {fundingGap > 0 ? "Action Required" : "Fully Funded"}
        </span>
      </div>

      {/* AI Directives / Verdict */}
      <div className="mt-auto border-t border-zinc-800/60 pt-4 mt-4">
        <h4 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-indigo-400">
          AI CFO Directives ({scenario.toUpperCase()})
        </h4>
        <p className="text-xs leading-relaxed text-zinc-300">
          {directiveText}
        </p>
      </div>
    </div>
  );
}