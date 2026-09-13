"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/lib/profile/profile-context";
import { getPortfolio } from "@/lib/investments";
import TaxOptimizationCard from "@/components/dashboard/TaxOptimizationCard";

function formatINR(value: number) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${value.toLocaleString("en-IN")}`;
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`h-5 w-5 text-zinc-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-emerald-400" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function UpArrow() {
  return (
    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
}

export default function HouseholdPage() {
  const profileContext: any = useProfile();
  const { profile, loading } = profileContext;
  const saveFn = profileContext.setProfile || profileContext.updateProfile || profileContext.saveProfile;

  // Partner Form State
  const [partnerName, setPartnerName] = useState("");
  const [partnerSalary, setPartnerSalary] = useState(0);
  const [partnerSip, setPartnerSip] = useState(0);
  const [partnerMf, setPartnerMf] = useState(0);
  const [saved, setSaved] = useState(false);
  const [isTaxOpen, setIsTaxOpen] = useState(false);

  useEffect(() => {
    if (profile?.partner) {
      const p = profile.partner;
      const t = setTimeout(() => {
        setPartnerName(p.name || "");
        setPartnerSalary(p.monthlySalary || 0);
        setPartnerSip(p.monthlyInvestment || 0);
        setPartnerMf(p.mutualFunds || 0);
      }, 0);
      return () => clearTimeout(t);
      setPartnerSalary(profile.partner.monthlySalary || 0);
      setPartnerSip(profile.partner.monthlyInvestment || 0); // NEW: Track partner SIP
      setPartnerMf(profile.partner.mutualFunds || 0);
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-full bg-[#0a0a0c] font-sans text-zinc-100 p-12 text-center">
        <p className="text-zinc-400">Loading household command center...</p>
      </div>
    );
  }

  // ==========================================
  // COMBINED HOUSEHOLD FINANCIAL ENGINE
  // ==========================================
  const portfolio = getPortfolio();
  
  // 1. Current Assets
  const userAssets = portfolio.filter((p: any) => p.type !== "Liability" && !p.liability).reduce((sum: number, p: any) => sum + (p.currentValue || 0), 0);
  const combinedAssets = userAssets + partnerMf;

  // 2. Incomes & Investments
  const userIncome = profile?.income?.monthlySalary || 0;
  const combinedIncome = userIncome + partnerSalary;
  
  const userSip = profile?.income?.monthlyInvestment || 0;
  const combinedSip = userSip + partnerSip;
  const combinedInvRate = combinedIncome > 0 ? ((combinedSip / combinedIncome) * 100).toFixed(1) : "0";

  // 3. FIRE Target Engine (Assuming family expenses = user input expenses)
  const monthlyExpenses = profile?.income?.monthlyExpenses || 50000;
  const annualExpenses = monthlyExpenses * 12;
  const targetCorpus = annualExpenses * 30; // 30x rule for Family FIRE

  // 4. 15-Year Monte Carlo Simulation (Deterministic approximation for dashboard)
  const rate = 0.12; // 12% equity CAGR
  const monthlyRate = rate / 12;
  const months = 15 * 12;
  const fvAssets = combinedAssets * Math.pow(1 + rate, 15);
  const fvSip = combinedSip * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  const projectedCorpus = fvAssets + fvSip;
  
  const successProb = Math.min(99, Math.round((projectedCorpus / targetCorpus) * 100));

  // Split calculations
  const userAssetPct = combinedAssets > 0 ? (userAssets / combinedAssets) * 100 : 50;
  const pAssetPct = combinedAssets > 0 ? (partnerMf / combinedAssets) * 100 : 50;

  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (saveFn) {
      saveFn({
        ...profile,
        partner: {
          name: partnerName,
          monthlySalary: Number(partnerSalary),
          monthlyInvestment: Number(partnerSip),
          mutualFunds: Number(partnerMf),
        },
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-full bg-[#0a0a0c] font-sans text-zinc-100">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10 space-y-8">
        
        {/* Header */}
        <header className="flex flex-col gap-2 border-b border-zinc-800/60 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
              HQ
            </div>
            <p className="font-mono text-xs tracking-[0.3em] text-emerald-500/80 uppercase">Household Command</p>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Family Wealth Dashboard
          </h1>
          <p className="text-sm text-zinc-400">Combined retirement planning, dual-income metrics, and unified household net worth.</p>
        </header>

        {/* TIER 1: COMBINED KPI COMMAND BAR */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-gradient-to-br from-emerald-500/20 to-transparent border-emerald-500/20 bg-zinc-950 p-5 shadow-lg">
            <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">Combined Net Worth</p>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-2xl font-bold text-white font-mono">{formatINR(combinedAssets)}</p>
              <UpArrow />
            </div>
            <p className="mt-2 text-xs text-emerald-400">Total family assets</p>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-blue-500/20 to-transparent border-blue-500/20 bg-zinc-950 p-5 shadow-lg">
            <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">Family Investment Rate</p>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-2xl font-bold text-white font-mono">{combinedInvRate}%</p>
            </div>
            <p className="mt-2 text-xs text-blue-400">{formatINR(combinedSip)} / mo total SIP</p>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-amber-500/20 to-transparent border-amber-500/20 bg-zinc-950 p-5 shadow-lg">
            <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">Household Target Corpus</p>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-2xl font-bold text-white font-mono">{formatINR(targetCorpus)}</p>
            </div>
            <p className="mt-2 text-xs text-amber-400">Based on family expenses</p>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-violet-500/20 to-transparent border-violet-500/20 bg-zinc-950 p-5 shadow-lg">
            <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">Combined FIRE Prob.</p>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-2xl font-bold text-white font-mono">{successProb}%</p>
            </div>
            <p className="mt-2 text-xs text-violet-400">15-Year joint trajectory</p>
          </div>
        </section>

        {/* TIER 2: COMBINED VISUALIZATIONS (The 3 Graphs) */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          
          {/* Graph 1: Household Retirement Status */}
          <div className="rounded-3xl border border-zinc-800/60 bg-zinc-950/60 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Graph 1: Status</p>
              <h3 className="text-lg font-semibold text-white mt-1">Household FIRE Status</h3>
              <p className="text-xs text-zinc-400 mt-2">Current trajectory vs Family Target</p>
            </div>
            <div className="mt-6 flex flex-col gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-zinc-400">Target</span>
                  <span className="text-white">{formatINR(targetCorpus)}</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-600 w-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-emerald-400">15-Yr Projected</span>
                  <span className="text-emerald-400">{formatINR(projectedCorpus)}</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${successProb}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Graph 2: Net Worth Split */}
          <div className="rounded-3xl border border-zinc-800/60 bg-zinc-950/60 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Graph 2: Allocation</p>
              <h3 className="text-lg font-semibold text-white mt-1">Combined Wealth Split</h3>
              <p className="text-xs text-zinc-400 mt-2">Distribution of family assets</p>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-300">You ({userAssetPct.toFixed(0)}%)</span>
                <span className="text-zinc-300">{partnerName || "Partner"} ({pAssetPct.toFixed(0)}%)</span>
              </div>
              <div className="flex h-4 w-full overflow-hidden rounded-full bg-zinc-800">
                <div style={{ width: `${userAssetPct}%` }} className="bg-blue-500" />
                <div style={{ width: `${pAssetPct}%` }} className="bg-purple-500" />
              </div>
              <div className="flex justify-between text-xs font-mono mt-2">
                <span className="text-blue-400">{formatINR(userAssets)}</span>
                <span className="text-purple-400">{formatINR(partnerMf)}</span>
              </div>
            </div>
          </div>

          {/* Graph 3: Household Growth Chart Simulator */}
          <div className="rounded-3xl border border-zinc-800/60 bg-zinc-950/60 p-6 shadow-xl flex flex-col justify-between">
             <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Graph 3: Projection</p>
              <h3 className="text-lg font-semibold text-white mt-1">15-Year Joint Growth</h3>
              <p className="text-xs text-zinc-400 mt-2">Compounding {formatINR(combinedSip)}/mo</p>
            </div>
            <div className="mt-6 flex h-24 items-end gap-1">
              {/* CSS pseudo-chart representing 15 years of compounding */}
              {Array.from({ length: 15 }).map((_, i) => {
                const heightPct = Math.min(100, ((i + 1) / 15) * 100);
                return (
                  <div key={i} className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/40 rounded-t-sm relative group transition-all" style={{ height: `${heightPct}%` }}>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[9px] font-mono text-emerald-400 bg-zinc-900 px-1 rounded transition-opacity">
                      Yr{i+1}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </section>

        {/* TIER 3: PARTNER FINANCIAL INPUTS */}
        <section className="rounded-3xl border border-zinc-800/60 bg-zinc-900/40 p-6 shadow-lg">
          <div className="mb-6 border-b border-zinc-800/60 pb-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Family Configuration</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Update Partner Financials</h2>
            <p className="text-xs text-zinc-400 mt-1">Updates here instantly recalculate the Household FIRE Engine above.</p>
          </div>

          <form onSubmit={handleSavePartner} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Partner Name</label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Monthly Salary (₹)</label>
              <input
                type="number"
                value={partnerSalary}
                onChange={(e) => setPartnerSalary(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-emerald-400 mb-1">Monthly SIP (₹) <span className="text-zinc-500">*New</span></label>
              <input
                type="number"
                value={partnerSip}
                onChange={(e) => setPartnerSip(Number(e.target.value))}
                className="w-full rounded-xl border border-emerald-500/50 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                placeholder="Partner's investment"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Total Assets (₹)</label>
              <input
                type="number"
                value={partnerMf}
                onChange={(e) => setPartnerMf(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-4 flex items-center justify-between pt-4">
              <button
                type="submit"
                className="rounded-xl bg-zinc-800 px-6 py-2.5 text-xs font-semibold text-white hover:bg-zinc-700 border border-zinc-700 transition"
              >
                Sync Combined Data
              </button>
              {saved && <span className="text-xs font-mono text-emerald-400">✓ Household aggregate updated!</span>}
            </div>
          </form>
        </section>

        {/* TIER 4: COLLAPSIBLE TAX ENGINE */}
        <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden transition-all">
          <button
            onClick={() => setIsTaxOpen(!isTaxOpen)}
            className="w-full flex items-center justify-between p-5 text-left bg-zinc-950/40 hover:bg-zinc-900/60 transition"
          >
            <div>
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Sandbox / Planning</span>
              <h3 className="text-base font-semibold text-white mt-1">Theoretical Tax Optimization Engine</h3>
            </div>
            <ChevronIcon isOpen={isTaxOpen} />
          </button>
          
          {isTaxOpen && (
            <div className="p-6 border-t border-zinc-800/60">
              <TaxOptimizationCard />
            </div>
          )}
        </section>

      </main>
    </div>
  );
}