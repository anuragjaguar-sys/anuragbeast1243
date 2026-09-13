"use client";

import { useState, useMemo } from "react";
import { useProfile } from "@/lib/profile/profile-context";
import {
  getRetirementProjection,
  calculateSWPLTCGTax,
} from "@/lib/retirement/retirement-engine";
import { getRetirementAssumptionsFromProfile } from "@/lib/profile/profile-retirement-adapter";
import {
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Line,
  ComposedChart
} from "recharts";

type StrategyPreset = "defensive" | "moderate" | "optimistic";

const PRESETS: Record<StrategyPreset, { label: string; rate: number; badge: string }> = {
  defensive: { label: "Defensive", rate: 7.5, badge: "Low Volatility · 60:40 Debt/Eq" },
  moderate: { label: "Moderate", rate: 8.5, badge: "Recommended · 50:50 Balanced" },
  optimistic: { label: "Growth", rate: 9.5, badge: "Inflation Beater · 65:35 Eq/Debt" },
};

function formatINR(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

export default function After54Page() {
  const { profile, loading } = useProfile();

  // Core Interactive Inputs
  const [selectedPreset, setSelectedPreset] = useState<StrategyPreset>("moderate");
  const [returnRate, setReturnRate] = useState<number>(8.5);
  const [monthlySpendToday, setMonthlySpendToday] = useState<number>(175000); // ₹1.75L in today's ₹
  const [inflationRate, setInflationRate] = useState<number>(6.0);
  const [applyTaxDrag, setApplyTaxDrag] = useState<boolean>(true); // 12.5% Equity LTCG toggle
  const [showFullSchedule, setShowFullSchedule] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<number>(3); // Active execution tier

  const currentAge = Number(profile?.personal?.currentAge || 37);
  const retirementAge = Number(profile?.personal?.retirementAge || 54);

  const baselineAssumptions = getRetirementAssumptionsFromProfile(profile);
  const baseline = getRetirementProjection(baselineAssumptions);
  const startingCorpus = baseline.projectedCorpus || 120500000;

  // Approximate invested capital / cost basis at age 54 (accumulated principal invested)
  const initialCostBasis = Math.round(startingCorpus * 0.38); // ~38% principal, ~62% compound capital gain at age 54

  // Currency conversion helpers
  const discountToToday = (val: number, age: number) => {
    return val / Math.pow(1 + inflationRate / 100, Math.max(0, age - currentAge));
  };
  const compoundFromToday = (val: number, age: number) => {
    return val * Math.pow(1 + inflationRate / 100, Math.max(0, age - currentAge));
  };

  const initialMonthlyNominal = compoundFromToday(monthlySpendToday, retirementAge);
  const _initialSWR = Number(((initialMonthlyNominal * 12 * 100) / startingCorpus).toFixed(2));

  // Trajectory Simulation with 12.5% LTCG Tax Drag Engine
  const simulation = useMemo(() => {
    let balance = startingCorpus;
    let currentBasis = initialCostBasis;
    let depletionAge: number | null = null;
    let cumulativeTaxPaid = 0;
    const schedule = [];

    for (let yr = 0; yr <= 36; yr++) {
      const age = retirementAge + yr;
      // Spending contracts by 25% post-68
      const spendToday = age <= 68 ? monthlySpendToday : monthlySpendToday * 0.75;
      const nominalAnnualLiving = compoundFromToday(spendToday * 12, age);

      // Compute 12.5% Equity LTCG Tax Haircut
      const taxData = applyTaxDrag
        ? calculateSWPLTCGTax(nominalAnnualLiving, balance, currentBasis, 125000, 0.125)
        : {
            grossWithdrawal: nominalAnnualLiving,
            gainRatio: 0,
            embeddedGains: 0,
            exemptGains: 0,
            taxableGains: 0,
            ltcgTaxOutflow: 0,
            effectiveTaxRateOnDraw: 0,
            netLivingReceived: nominalAnnualLiving,
            remainingCostBasis: currentBasis,
          };

      const totalAnnualCashNeeded = nominalAnnualLiving + taxData.ltcgTaxOutflow;
      cumulativeTaxPaid += taxData.ltcgTaxOutflow;

      schedule.push({
        age,
        nominalBalance: Math.round(balance),
        realBalance: Math.round(discountToToday(balance, age)),
        nominalMonthly: Math.round(nominalAnnualLiving / 12),
        realMonthly: Math.round(spendToday),
        annualTaxPaid: taxData.ltcgTaxOutflow,
        effectiveTaxRate: Number(taxData.effectiveTaxRateOnDraw.toFixed(1)),
        cumulativeTaxPaid: Math.round(cumulativeTaxPaid),
        totalAnnualDraw: Math.round(totalAnnualCashNeeded),
      });

      if (balance <= 0 && depletionAge === null && yr > 0) {
        depletionAge = age;
      }

      // 1. Portfolio compounds at returnRate
      const annualGrowth = balance * (returnRate / 100);
      // 2. Portfolio pays for living expenses + statutory 12.5% LTCG tax
      balance = Math.max(0, balance + annualGrowth - totalAnnualCashNeeded);
      // 3. Update cost basis for next year
      currentBasis = taxData.remainingCostBasis;
    }
    return { schedule, depletionAge, cumulativeTaxPaid };
  }, [
    startingCorpus,
    initialCostBasis,
    monthlySpendToday,
    returnRate,
    inflationRate,
    applyTaxDrag,
    retirementAge,
    currentAge
  ]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0c] text-zinc-400 font-mono text-sm">
        Calibrating Life After 54 Decumulation Engine...
      </div>
    );
  }

  // Capital Deployment Allocations
  const tier1Emergency = Math.round(compoundFromToday(3000000, retirementAge)); // ₹30L instant
  const tier2Medical = Math.round(compoundFromToday(5000000, retirementAge)); // ₹50L medical
  const tier3SWP = Math.round(initialMonthlyNominal * 36); // 3-year buffer
  const tier4Growth = Math.max(0, startingCorpus - tier1Emergency - tier2Medical - tier3SWP);

  const tiers = [
    {
      id: 1,
      title: "1. Instant Emergency",
      amount: tier1Emergency,
      pct: Math.round((tier1Emergency / startingCorpus) * 100),
      color: "bg-rose-500",
      textColor: "text-rose-400",
      instruments: "Auto-Sweep Bank FDs & Liquid Funds",
      rule: "Withdrawable within 2 hours. Zero volatility. Refills via interest sweep.",
    },
    {
      id: 2,
      title: "2. Medical Escrow",
      amount: tier2Medical,
      pct: Math.round((tier2Medical / startingCorpus) * 100),
      color: "bg-amber-500",
      textColor: "text-amber-400",
      instruments: "Sovereign Arbitrage & Target Maturity SDLs",
      rule: "Dedicated health catastrophe pool, independent of base health insurance.",
    },
    {
      id: 3,
      title: "3. SWP Cash Engine",
      amount: tier3SWP,
      pct: Math.round((tier3SWP / startingCorpus) * 100),
      color: "bg-indigo-500",
      textColor: "text-indigo-400",
      instruments: "Equity Savings & Arbitrage Funds",
      rule: `Runs automated monthly transfer of ${formatINR(initialMonthlyNominal)}/mo. Gains taxed at 12.5% LTCG above ₹1.25L exemption.`,
    },
    {
      id: 4,
      title: "4. Growth Engine",
      amount: tier4Growth,
      pct: Math.round((tier4Growth / startingCorpus) * 100),
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
      instruments: "Flexi-Cap & Nifty Index Equities (11–12% CAGR)",
      rule: "Refills Tier 3 every 2 years. Compounds above inflation to ensure perpetual longevity.",
    },
  ];

  const firstYearTax = simulation.schedule[0]?.annualTaxPaid || 0;

  return (
    <div className="min-h-screen bg-[#0a0a0c] px-4 py-6 text-zinc-100 sm:px-8">
      {/* Header Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Life After 54 <span className="text-zinc-500 font-normal text-sm sm:text-base">| Decumulation & Tax-Adjusted SWP</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 font-mono text-xs">
          <span className="text-zinc-400">Target Corpus at 54:</span>
          <span className="font-bold text-emerald-400">{formatINR(startingCorpus)}</span>
          <span className="text-zinc-500 text-[11px]">({formatINR(discountToToday(startingCorpus, retirementAge))} today&apos;s ₹)</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. COMPACT INTERACTIVE COMMAND DOCK
         ───────────────────────────────────────────────────────────── */}
      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-md">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 items-center">
          {/* Preset Buttons */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
              1. Return Profile
            </label>
            <div className="flex rounded-xl border border-zinc-800 bg-zinc-950 p-1">
              {(Object.keys(PRESETS) as StrategyPreset[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedPreset(key);
                    setReturnRate(PRESETS[key].rate);
                  }}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${
                    selectedPreset === key
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {PRESETS[key].label} ({PRESETS[key].rate}%)
                </button>
              ))}
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">
              {PRESETS[selectedPreset].badge}
            </span>
          </div>

          {/* Monthly Spend Input */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                2. Monthly Spend (Today&apos;s ₹)
              </label>
              <span className="text-[11px] font-mono text-emerald-400">
                = {formatINR(initialMonthlyNominal)}/mo at 54
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 font-mono text-xs text-zinc-500">₹</span>
              <input
                type="number"
                step="5000"
                min="0"
                value={monthlySpendToday === 0 ? "" : monthlySpendToday}
                onChange={(e) => {
                  const val = e.target.value;
                  setMonthlySpendToday(val === "" ? 0 : Number(val));
                }}
                onBlur={() => {
                  if (monthlySpendToday < 10000) {
                    setMonthlySpendToday(175000);
                  }
                }}
                placeholder="175000"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-7 pr-3 py-1.5 font-mono text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Indexed for travel (54–68) & 25% lifestyle drop post-68
            </span>
          </div>

          {/* Tax Realism & Inflation Controls */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                3. Tax Realism & Inflation
              </label>
              <button
                onClick={() => setApplyTaxDrag(!applyTaxDrag)}
                className={`rounded px-2 py-0.5 text-[10px] font-mono font-semibold transition border ${
                  applyTaxDrag
                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                    : "border-zinc-700 bg-zinc-950 text-zinc-400"
                }`}
              >
                {applyTaxDrag ? "✓ 12.5% LTCG Active" : "No Tax Drag"}
              </button>
            </div>
            <input
              type="range"
              min="4.5"
              max="8.0"
              step="0.25"
              value={inflationRate}
              onChange={(e) => setInflationRate(Number(e.target.value))}
              className="w-full accent-indigo-500 mt-1"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>Inflation: {inflationRate}% / yr</span>
              <span className="text-indigo-400 font-mono">Real: +{(returnRate - inflationRate).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CORE RESULTS & PROJECTION CHART WITH TAX HAIR CUT
         ───────────────────────────────────────────────────────────── */}
      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md">
        {/* KPI Strip */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 border-b border-zinc-800/80 pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Monthly Inflow (Age 54)</span>
            <p className="mt-0.5 font-mono text-lg font-bold text-white sm:text-xl">
              {formatINR(initialMonthlyNominal)}
            </p>
            <span className="text-[11px] text-emerald-400 font-mono">
              {formatINR(monthlySpendToday)} today&apos;s ₹
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Year 1 LTCG Tax Drag</span>
            <p className="mt-0.5 font-mono text-lg font-bold text-amber-300 sm:text-xl">
              {formatINR(firstYearTax)} <span className="text-xs font-normal text-zinc-500">/ yr</span>
            </p>
            <span className="text-[11px] text-zinc-400">
              {applyTaxDrag ? "Section 112A (12.5% above ₹1.25L)" : "Tax drag disabled"}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Corpus Longevity</span>
            <p className={`mt-0.5 font-mono text-lg font-bold sm:text-xl ${simulation.depletionAge === null ? "text-emerald-400" : "text-amber-400"}`}>
              {simulation.depletionAge === null ? "Age 90+ (Surplus)" : `Age ${simulation.depletionAge}`}
            </p>
            <span className="text-[11px] text-zinc-400">
              {simulation.depletionAge === null ? "Perpetual Runway" : "Draw exceeds net returns"}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Surplus at Age 90</span>
            <p className="mt-0.5 font-mono text-lg font-bold text-emerald-400 sm:text-xl">
              {formatINR(simulation.schedule[simulation.schedule.length - 1]?.nominalBalance || 0)}
            </p>
            <span className="text-[11px] text-zinc-500">
              ({formatINR(simulation.schedule[simulation.schedule.length - 1]?.realBalance || 0)} today&apos;s ₹)
            </span>
          </div>
        </div>

        {/* Chart Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-zinc-300">
            Trajectory: Compounding at {returnRate}% vs. SWP with 12.5% LTCG Haircut
          </span>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="inline-block h-2 w-2 rounded-full bg-indigo-500"></span> Nominal Future ₹
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span> Real Today&apos;s Purchasing Power
            </span>
          </div>
        </div>

        {/* The Recharts Visual */}
        <div className="h-[280px] sm:h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={simulation.schedule} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="cleanNominal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="age" stroke="#71717a" fontSize={11} tickFormatter={(val) => `Age ${val}`} />
              <YAxis stroke="#71717a" fontSize={11} tickFormatter={(val) => formatINR(val)} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#09090b",
                  borderColor: "#27272a",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
                formatter={(val: any) => formatINR(Number(val))}
                labelFormatter={(label) => `Age ${label}`}
              />
              <Area
                type="monotone"
                dataKey="nominalBalance"
                name="Nominal Balance"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#cleanNominal)"
              />
              <Line
                type="monotone"
                dataKey="realBalance"
                name="Today's Real Value"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Collapsible Year-by-Year Schedule Toggle */}
        <div className="mt-4 border-t border-zinc-800/80 pt-3">
          <button
            onClick={() => setShowFullSchedule(!showFullSchedule)}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-mono transition"
          >
            <span>{showFullSchedule ? "▼ Hide" : "▶ View"} Milestone Schedule with 12.5% LTCG Tax Drag</span>
          </button>

          {showFullSchedule && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-mono">
                    <th className="pb-2">Age</th>
                    <th className="pb-2">Monthly Inflow (Nominal)</th>
                    <th className="pb-2">Annual 12.5% LTCG Tax</th>
                    <th className="pb-2">Effective Tax Rate</th>
                    <th className="pb-2 text-right">Remaining Balance (Nominal)</th>
                    <th className="pb-2 text-right">Real Balance (Today&apos;s ₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-mono">
                  {simulation.schedule
                    .filter((row) => [54, 58, 62, 65, 68, 72, 76, 80, 85, 90].includes(row.age))
                    .map((row) => (
                      <tr key={row.age} className="text-zinc-300 hover:bg-zinc-800/30">
                        <td className="py-2 font-bold text-white">Age {row.age}</td>
                        <td className="py-2 text-white">{formatINR(row.nominalMonthly)}/mo</td>
                        <td className="py-2 font-mono text-amber-400">{formatINR(row.annualTaxPaid)}</td>
                        <td className="py-2 text-zinc-400">{row.effectiveTaxRate}%</td>
                        <td className="py-2 text-right text-indigo-300">{formatINR(row.nominalBalance)}</td>
                        <td className="py-2 text-right text-emerald-400">{formatINR(row.realBalance)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. EXECUTION BLUEPRINT: VISUAL CAPITAL STACK & TIER SELECTOR
         ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white">
              Tactical Deployment Blueprint: Where Every Rupee is Parked
            </h3>
            <p className="text-xs text-zinc-400">
              Click any tier below to view where to invest and the monthly SWP refill mechanics.
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-emerald-400">
            Total Liquid Corpus: {formatINR(startingCorpus)}
          </span>
        </div>

        {/* Visual Allocation Stack Bar */}
        <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full bg-zinc-800">
          {tiers.map((t) => (
            <div
              key={t.id}
              style={{ width: `${t.pct}%` }}
              className={`${t.color} transition-all duration-300 hover:opacity-80 cursor-pointer`}
              title={`${t.title}: ${t.pct}%`}
              onClick={() => setSelectedTier(t.id)}
            />
          ))}
        </div>

        {/* Interactive Tier Buttons */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-4">
          {tiers.map((t) => {
            const isSelected = selectedTier === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTier(t.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-500/10 shadow-md ring-1 ring-indigo-500/40"
                    : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                }`}
              >
                <span className={`block text-[11px] font-semibold ${t.textColor}`}>
                  {t.title}
                </span>
                <span className="mt-1 block font-mono text-base font-bold text-white">
                  {formatINR(t.amount)}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {t.pct}% of corpus
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Tier Deep-Dive Details */}
        {(() => {
          const active = tiers.find((t) => t.id === selectedTier) || tiers[2];
          return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2 mb-2">
                <span className="font-bold text-white text-sm">
                  {active.title} — Tactical Execution Details
                </span>
                <span className="font-mono text-zinc-400">
                  Target Allocation: <strong className="text-white">{formatINR(active.amount)}</strong> ({active.pct}% of capital)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-300 pt-1">
                <div>
                  <span className="text-zinc-500 font-mono text-[10px] uppercase">Recommended Vehicles</span>
                  <p className="font-semibold text-white mt-0.5">{active.instruments}</p>
                </div>
                <div>
                  <span className="text-zinc-500 font-mono text-[10px] uppercase">Execution Mandate</span>
                  <p className="text-zinc-300 mt-0.5">{active.rule}</p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
