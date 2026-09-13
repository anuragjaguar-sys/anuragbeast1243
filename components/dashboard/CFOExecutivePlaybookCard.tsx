"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useProfile } from "@/lib/profile/profile-context";
import { getRetirementAssumptionsFromProfile } from "@/lib/profile/profile-retirement-adapter";
import { generateExecutivePlaybook } from "@/lib/intelligence/cfo-playbook";
import { loadPortfolio } from "@/lib/investments/portfolio-storage/storage";
import { calculateDynamicRetirementCorpus } from "@/lib/retirement/retirement-engine";
import { extractActiveAssets } from "@/lib/retirement/retirement-engine";

function formatINR(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

export default function CFOExecutivePlaybookCard({ statement }: { statement?: any }) {
  const { profile, loading } = useProfile();

  // Baseline cash flow figures from statement/profile
  const baselineSalary = statement?.income?.salaryInHand
    ? Number(statement.income.salaryInHand)
    : (profile?.income?.monthlySalary || 150000);

  const baselineLiving = statement?.cashAllocation?.monthlyExpenses
    ? Number(statement.cashAllocation.monthlyExpenses)
    : 30000;

  const baselineSIP = profile?.income?.monthlyInvestment || 20000;
  const baselinePrepay = profile?.income?.monthlyLoanPrepayment || 50000;
  const baselineEmergency = profile?.income?.monthlyEmergencySavings || 50000;

  // Interactive controls
  const [isInteractiveMode, setIsInteractiveMode] = useState<boolean>(false);
  const [liveSIP, setLiveSIP] = useState<number>(baselineSIP);
  const [livePrepay, setLivePrepay] = useState<number>(baselinePrepay);
  const [liveEmergency, setLiveEmergency] = useState<number>(baselineEmergency);
  const [stepUpPercent, setStepUpPercent] = useState<number>(10);

  // Modals
  const [showStepUpModal, setShowStepUpModal] = useState<boolean>(false);
  const [showAssetVaultModal, setShowAssetVaultModal] = useState<boolean>(false);

  const activeSIP = isInteractiveMode ? liveSIP : baselineSIP;
  const activePrepay = isInteractiveMode ? livePrepay : baselinePrepay;
  const activeEmergency = isInteractiveMode ? liveEmergency : baselineEmergency;

  const liveTotalCommitted = baselineLiving + activeSIP + activePrepay + activeEmergency;
  const liveSurplus = baselineSalary - liveTotalCommitted;

  // Demographics from profile
  const currentAge = profile?.personal?.currentAge || 37;
  const retirementAge = profile?.personal?.retirementAge || 54;

  // Pure dynamic asset & liability extraction from active portfolio & profile
  const portfolio = typeof window !== "undefined" ? loadPortfolio() : [];
  const assets = useMemo(() => {
    return extractActiveAssets(profile, portfolio);
  }, [profile, portfolio]);

  // Dynamic simulation using actual extracted values
  const activeDynamicResult = useMemo(() => {
    return calculateDynamicRetirementCorpus({
      currentAge,
      retirementAge,
      currentMutualFunds: assets.mutualFunds,
      currentStocks: assets.stocks,
      currentPPF: assets.ppf,
      currentEPF: assets.epf,
      currentNPS: assets.nps,
      currentProperty: assets.property,
      activeMonthlySIP: activeSIP,
      stepUpPercent,
      loanPrincipal: assets.homeLoanPrincipal,
      actualMonthlyEMI: assets.monthlyEMI,
      loanInterestRate: assets.homeLoanInterestRate,
      loanTenureMonths: assets.homeLoanTenureMonths,
      monthlyPrepayment: activePrepay,
      equityReturnRate: 12.0,
      ppfReturnRate: 7.1,
      epfReturnRate: 8.15,
      npsReturnRate: 9.5,
      propertyReturnRate: 5.0,
    });
  }, [currentAge, retirementAge, assets, activeSIP, stepUpPercent, activePrepay]);

  const baselineDynamicResult = useMemo(() => {
    return calculateDynamicRetirementCorpus({
      currentAge,
      retirementAge,
      currentMutualFunds: assets.mutualFunds,
      currentStocks: assets.stocks,
      currentPPF: assets.ppf,
      currentEPF: assets.epf,
      currentNPS: assets.nps,
      currentProperty: assets.property,
      activeMonthlySIP: baselineSIP,
      stepUpPercent: 0,
      loanPrincipal: assets.homeLoanPrincipal,
      actualMonthlyEMI: assets.monthlyEMI,
      loanInterestRate: assets.homeLoanInterestRate,
      loanTenureMonths: assets.homeLoanTenureMonths,
      monthlyPrepayment: baselinePrepay,
      equityReturnRate: 12.0,
      ppfReturnRate: 7.1,
      epfReturnRate: 8.15,
      npsReturnRate: 9.5,
      propertyReturnRate: 5.0,
    });
  }, [currentAge, retirementAge, assets, baselineSIP, baselinePrepay]);

  const playbook = useMemo(() => {
    if (!profile) return null;
    const normalizedProfile = {
      ...profile,
      income: {
        ...profile.income,
        monthlySalary: baselineSalary,
        monthlyInvestment: activeSIP,
        monthlyLoanPrepayment: activePrepay,
        monthlyEmergencySavings: activeEmergency,
      },
    };
    const assumptions = getRetirementAssumptionsFromProfile(normalizedProfile);
    return generateExecutivePlaybook(assumptions, normalizedProfile, statement, portfolio);
  }, [profile, statement, activeSIP, activePrepay, activeEmergency, baselineSalary, portfolio]);

  if (loading || !playbook) {
    return (
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6">
        <p className="text-sm text-zinc-400">Athena CFO is evaluating your portfolio data...</p>
      </div>
    );
  }

  const projectedCorpusAt54 = activeDynamicResult.projectedCorpusAtRetirement;
  const baselineCorpus = baselineDynamicResult.projectedCorpusAtRetirement;
  const corpusDelta = projectedCorpusAt54 - baselineCorpus;
  const requiredTargetCorpus = 100000000; // ₹10.00 Cr
  const targetGap = projectedCorpusAt54 - requiredTargetCorpus;
  const isTargetAchieved = targetGap >= 0;
  const breakdown = activeDynamicResult.assetBreakdown;

  const handleReset = () => {
    setLiveSIP(baselineSIP);
    setLivePrepay(baselinePrepay);
    setLiveEmergency(baselineEmergency);
    setStepUpPercent(10);
    setIsInteractiveMode(false);
  };

  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-zinc-900/95 to-zinc-950 p-6 md:p-8 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-6 border-b border-zinc-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-semibold">
              Athena Strategic CFO Intelligence
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Retirement Cash Flow Command Center
          </h2>
          <p className="text-sm text-zinc-400">
            Monthly Inflow: <strong className="text-white">{formatINR(baselineSalary)}</strong> | Deployed: <strong className="text-emerald-400">{formatINR(liveTotalCommitted)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowStepUpModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-cyan-400 hover:border-cyan-500/50 hover:bg-zinc-800/80 transition-all flex items-center gap-1.5"
          >
            <span>📊</span> Step-Up Schedule
          </button>
          <button
            onClick={() => setIsInteractiveMode(!isInteractiveMode)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
              isInteractiveMode
                ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-lg shadow-emerald-500/20"
                : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            {isInteractiveMode ? "⚡ Tactical Lab Active" : "⚙️ Open Tactical Lab"}
          </button>
          {isInteractiveMode && (
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* CORE RETIREMENT TELEMETRY BAR */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setShowAssetVaultModal(true)}
          className="text-left p-5 rounded-2xl bg-zinc-950/90 border border-emerald-500/40 hover:border-emerald-400 hover:bg-zinc-900/90 transition-all group shadow-inner"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-mono tracking-wider text-emerald-400 block font-bold">
              Projected Liquid Corpus @ Age {retirementAge}
            </span>
            <span className="text-xs text-zinc-500 group-hover:text-emerald-400 transition-colors font-mono">
              View Asset Vault ↗
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-white font-mono tracking-tight group-hover:text-emerald-300">
              {formatINR(projectedCorpusAt54)}
            </span>
            {corpusDelta !== 0 && (
              <span className={`text-xs font-mono font-bold ${corpusDelta > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {corpusDelta > 0 ? `+${formatINR(corpusDelta)}` : formatINR(corpusDelta)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-400 block mt-1">
            Pure portfolio aggregation: MF, PPF, NPS ({formatINR(assets.nps)}) & Post-debt surge
          </span>
        </button>

        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800 flex flex-col justify-between">
          <div>
            <span className="text-[11px] uppercase font-mono tracking-wider text-zinc-400 block">
              Retirement Target Status
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black font-mono ${isTargetAchieved ? "text-emerald-400" : "text-amber-400"}`}>
                {isTargetAchieved ? `+${formatINR(targetGap)} Surplus` : `${formatINR(Math.abs(targetGap))} Deficit`}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-zinc-400 block mt-1">
            Target: ₹10.00 Cr for ₹2.00 Lakh/mo lifetime pension
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800 flex flex-col justify-between">
          <div>
            <span className="text-[11px] uppercase font-mono tracking-wider text-zinc-400 block">
              Debt Freedom Timeline
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-cyan-400 font-mono">
                {assets.homeLoanPrincipal > 0
                  ? `Age ${activeDynamicResult.debtFreeAge} (${(activeDynamicResult.debtFreeMonths / 12).toFixed(1)} Yrs)`
                  : "Debt Free"}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-zinc-400 block mt-1">
            Post-Payoff SIP: <strong className="text-emerald-400">{formatINR(activeSIP + activeDynamicResult.liberatedCashflowAtPayoff)}/mo</strong>
          </span>
        </div>
      </div>

      {/* Interactive Controls */}
      {isInteractiveMode && (
        <div className="my-6 p-5 rounded-2xl bg-zinc-900/90 border border-emerald-500/40 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div>
              <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">
                Live Scenario Moderation
              </span>
              <p className="text-xs text-zinc-400">
                Adjust sliders to model exact compounding effects on your Age 54 Retirement Corpus.
              </p>
            </div>
            <div className={`text-xs font-mono font-bold px-3 py-1 rounded-lg border ${
              liveSurplus >= 0 ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" : "bg-rose-500/10 text-rose-400 border-rose-500/30"
            }`}>
              {liveSurplus >= 0 ? `Surplus Cash: ${formatINR(liveSurplus)}` : `Budget Deficit: ${formatINR(Math.abs(liveSurplus))}`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono">
                <span className="text-zinc-400">Phase 1 SIP (Pre-Payoff)</span>
                <span className="font-bold text-emerald-400">{formatINR(liveSIP)}/mo</span>
              </div>
              <input
                type="range"
                min="10000"
                max="80000"
                step="5000"
                value={liveSIP}
                onChange={(e) => setLiveSIP(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-zinc-800"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Active until age {activeDynamicResult.debtFreeAge}</p>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-mono">
                <span className="text-zinc-400">Home Loan Prepayment</span>
                <span className="font-bold text-rose-400">{formatINR(livePrepay)}/mo</span>
              </div>
              <input
                type="range"
                min="0"
                max="100000"
                step="5000"
                value={livePrepay}
                onChange={(e) => setLivePrepay(Number(e.target.value))}
                className="w-full accent-rose-500 bg-zinc-800"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Clears debt in {(activeDynamicResult.debtFreeMonths / 12).toFixed(1)} yrs</p>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-mono">
                <span className="text-zinc-400">Emergency Remittance</span>
                <span className="font-bold text-amber-400">{formatINR(liveEmergency)}/mo</span>
              </div>
              <input
                type="range"
                min="0"
                max="70000"
                step="5000"
                value={liveEmergency}
                onChange={(e) => setLiveEmergency(Number(e.target.value))}
                className="w-full accent-amber-500 bg-zinc-800"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Sunsets once emergency fund full</p>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-mono">
                <span className="text-zinc-400">Annual SIP Step-Up</span>
                <span className="font-bold text-cyan-400">+{stepUpPercent}% / yr</span>
              </div>
              <select
                value={stepUpPercent}
                onChange={(e) => setStepUpPercent(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              >
                <option value={0}>0% (Flat SIP)</option>
                <option value={5}>+5% Annual Step-Up</option>
                <option value={10}>+10% Annual Step-Up</option>
                <option value={15}>+15% Annual Step-Up</option>
              </select>
              <p className="text-[10px] text-zinc-500 mt-1">Compounds investment velocity</p>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC SCENARIO REPORT */}
      <div className="mt-6 p-5 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
            Athena Tactical Intelligence Report
          </span>
          <span className="text-[10px] font-mono text-zinc-500">• Real-Time Simulation Verdict</span>
        </div>

        <p className="text-sm text-zinc-200 leading-relaxed font-medium">
          Under this allocation model (starting at <strong className="text-emerald-400">{formatINR(activeSIP)}/month</strong> with a <strong className="text-cyan-400">+{stepUpPercent}% annual step-up</strong>), your {formatINR(assets.homeLoanPrincipal)} home loan is extinguished in <strong className="text-white">{(activeDynamicResult.debtFreeMonths / 12).toFixed(1)} years</strong> (at Age <strong className="text-white">{activeDynamicResult.debtFreeAge}</strong>). 
          The exact moment debt reaches ₹0, your monthly commitment of <strong className="text-rose-400">{formatINR(activeDynamicResult.liberatedCashflowAtPayoff)}</strong> (₹{assets.monthlyEMI.toLocaleString("en-IN")} EMI + ₹{activePrepay.toLocaleString("en-IN")} prepay) is redirected into equity, driving monthly SIP to <strong className="text-emerald-400">{formatINR(activeSIP + activeDynamicResult.liberatedCashflowAtPayoff)}/month</strong>.
        </p>

        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-3">
          <span className={`text-base font-bold ${isTargetAchieved ? "text-emerald-400" : "text-amber-400"}`}>
            {isTargetAchieved ? "✓" : "!"}
          </span>
          <p className="text-xs text-zinc-300 leading-relaxed">
            <strong className="text-white">Bottom Line Retirement Feasibility: </strong> 
            This projects a terminal liquid corpus of <strong className="text-white font-mono">{formatINR(projectedCorpusAt54)}</strong> at Age 54. 
            {isTargetAchieved ? (
              <span>
                {" "}You achieve your retirement goal with a <strong className="text-emerald-400 font-mono">+{formatINR(targetGap)} surplus</strong> above your ₹10.00 Cr milestone, comfortably guaranteeing your ₹2.00 Lakh/month lifetime pension.
              </span>
            ) : (
              <span>
                {" "}You remain <strong className="text-amber-400 font-mono">{formatINR(Math.abs(targetGap))} short</strong> of your ₹10.00 Cr target. Increasing step-up or Phase 1 SIP closes this deficit.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 4-Pillar Cash Flow Ledger */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
        <div>
          <p className="text-[10px] uppercase font-mono tracking-wider text-emerald-400">Phase 1 SIP</p>
          <p className="text-lg font-bold text-white">{formatINR(activeSIP)}</p>
          <p className="text-[9px] text-zinc-500">Till age {activeDynamicResult.debtFreeAge}</p>
        </div>
        <div className="border-l border-zinc-800 pl-3">
          <p className="text-[10px] uppercase font-mono tracking-wider text-rose-400">Loan Prepay</p>
          <Link href="/home-loan" className="text-lg font-bold text-white hover:text-rose-400 transition-colors flex items-center gap-1">
            {formatINR(activePrepay)} <span className="text-[10px] text-zinc-500">↗</span>
          </Link>
          <p className="text-[9px] text-zinc-500">EMI: {formatINR(assets.monthlyEMI)}</p>
        </div>
        <div className="border-l border-zinc-800 pl-3">
          <p className="text-[10px] uppercase font-mono tracking-wider text-amber-400">Emergency</p>
          <p className="text-lg font-bold text-white">{formatINR(activeEmergency)}</p>
          <p className="text-[9px] text-zinc-500">Liquid buffer</p>
        </div>
        <div className="border-l border-zinc-800 pl-3">
          <p className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">Surplus Cash</p>
          <p className="text-lg font-bold text-cyan-400">{formatINR(liveSurplus)}</p>
          <p className="text-[9px] text-zinc-500">To deploy</p>
        </div>
      </div>

      {/* ASSET VAULT BREAKDOWN MODAL (Pure Dynamic Data Only) */}
      {showAssetVaultModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Age 54 Retirement Asset Composition</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Projections based strictly on your stored Portfolio items and Financial Profile.
                </p>
              </div>
              <button
                onClick={() => setShowAssetVaultModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Equity SIP & Mutual Funds */}
                {breakdown.equitySIPAndMF > 0 && (
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-500/30">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono uppercase text-emerald-400 font-bold">1. Equity SIP & MF</span>
                      <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">12.0% CAGR</span>
                    </div>
                    <p className="text-2xl font-black text-white font-mono mt-2">{formatINR(breakdown.equitySIPAndMF)}</p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Current {formatINR(assets.mutualFunds)} + Phase 1 SIP + Phase 2 Surge ({formatINR(activeSIP + activeDynamicResult.liberatedCashflowAtPayoff)}/mo)
                    </p>
                  </div>
                )}

                {/* 2. Direct Stocks */}
                {assets.stocks > 0 && (
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono uppercase text-zinc-300 font-bold">2. Direct Stocks</span>
                      <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">12.0% CAGR</span>
                    </div>
                    <p className="text-2xl font-black text-white font-mono mt-2">{formatINR(breakdown.directStocks)}</p>
                    <p className="text-[11px] text-zinc-400 mt-1">Current {formatINR(assets.stocks)} compounded over 17 years</p>
                  </div>
                )}

                {/* 3. PPF */}
                {assets.ppf > 0 && (
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono uppercase text-cyan-400 font-bold">PPF Balance</span>
                      <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded">7.1% Sovereign</span>
                    </div>
                    <p className="text-2xl font-black text-white font-mono mt-2">{formatINR(breakdown.ppfValue)}</p>
                    <p className="text-[11px] text-zinc-400 mt-1">Current {formatINR(assets.ppf)} compounded sovereign debt</p>
                  </div>
                )}

                {/* 4. EPF (Only rendered if actually present in portfolio/profile) */}
                {assets.epf > 0 && (
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono uppercase text-blue-400 font-bold">EPF Balance</span>
                      <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">8.15% Yield</span>
                    </div>
                    <p className="text-2xl font-black text-white font-mono mt-2">{formatINR(breakdown.epfValue)}</p>
                    <p className="text-[11px] text-zinc-400 mt-1">Current {formatINR(assets.epf)} compounded provident fund</p>
                  </div>
                )}

                {/* 5. NPS (Only rendered if actually present) */}
                {assets.nps > 0 && (
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono uppercase text-amber-400 font-bold">NPS Portfolio</span>
                      <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">9.5% Hybrid</span>
                    </div>
                    <p className="text-2xl font-black text-white font-mono mt-2">{formatINR(breakdown.npsValue)}</p>
                    <p className="text-[11px] text-zinc-400 mt-1">Current {formatINR(assets.nps)} compounded to age 54</p>
                  </div>
                )}

                {/* 6. Real Estate (Flat) */}
                {assets.property > 0 && (
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-purple-500/30">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono uppercase text-purple-400 font-bold">Real Estate (Flat)</span>
                      <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">5.0% Inflation</span>
                    </div>
                    <p className="text-2xl font-black text-white font-mono mt-2">{formatINR(breakdown.propertyValue)}</p>
                    <p className="text-[11px] text-zinc-400 mt-1">Base value {formatINR(assets.property)} flat compounded to age 54</p>
                  </div>
                )}
              </div>

              {/* Total Summary Footer */}
              <div className="mt-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400">Total Liquid Retirement Corpus (Excl. Real Estate):</span>
                  <span className="text-base font-black text-emerald-400">{formatINR(breakdown.liquidCorpus)}</span>
                </div>
                {assets.property > 0 && (
                  <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-zinc-800/80">
                    <span className="text-zinc-300 font-bold">Total Comprehensive Net Worth (Incl. Real Estate):</span>
                    <span className="text-lg font-black text-white">{formatINR(breakdown.totalNetWorth)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400">Target for ₹2L/mo lifetime pension:</span>
              <span className="text-sm font-mono font-bold text-white">₹10.00 Cr Liquid Corpus</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP-UP SCHEDULE MODAL */}
      {showStepUpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Annual Step-Up Outlay Breakdown</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Phase 1 starts at {formatINR(activeSIP)}/mo (+{stepUpPercent}%/yr). After Age {activeDynamicResult.debtFreeAge}, loan payoff liberates {formatINR(activeDynamicResult.liberatedCashflowAtPayoff)}/mo.
                </p>
              </div>
              <button
                onClick={() => setShowStepUpModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-3 font-mono text-xs">
              <table className="w-full text-left">
                <thead className="text-zinc-500 border-b border-zinc-800 text-[10px] uppercase">
                  <tr>
                    <th className="pb-2">Age</th>
                    <th className="pb-2">Year</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Monthly SIP</th>
                    <th className="pb-2 text-right">Annual Outlay</th>
                    <th className="pb-2 text-right">Corpus Milestone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {activeDynamicResult.yearlyBreakdown.map((row) => (
                    <tr key={row.year} className="hover:bg-zinc-800/40">
                      <td className="py-2.5 font-bold text-white">Age {row.age}</td>
                      <td className="py-2.5 text-zinc-400">Yr {row.year}</td>
                      <td className="py-2.5">
                        {row.isDebtFree ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                            Debt-Free Surge
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            Paying Loan
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 font-bold text-emerald-400">{formatINR(row.monthlySIP)}</td>
                      <td className="py-2.5 text-right text-zinc-300">{formatINR(row.monthlySIP * 12)}</td>
                      <td className="py-2.5 text-right font-bold text-white">{formatINR(row.totalCorpus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Terminal Liquid Corpus at Age {retirementAge}:</span>
              <span className="text-base font-black text-emerald-400 font-mono">{formatINR(projectedCorpusAt54)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
