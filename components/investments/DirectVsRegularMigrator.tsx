"use client";

import React, { useState, useMemo } from "react";

export default function DirectVsRegularMigrator() {
  const currentYear = new Date().getFullYear();

  const [fundName, setFundName] = useState("Parag Parikh Flexi Cap Fund");
  const [planType, setPlanType] = useState<"regular" | "direct">("regular");
  const [currentValue, setCurrentValue] = useState(2500000);
  const [investedAmount, setInvestedAmount] = useState(1500000);
  const [startYear, setStartYear] = useState(2021);
  const [cagrInput, setCagrInput] = useState<string>("");
  const [regularTER, setRegularTER] = useState(1.75);
  const [directTER, setDirectTER] = useState(0.65);

  const yearsInvested = Math.max(1, currentYear - startYear);
  const yearsToRetire = 17; // FIRE54 timeline

  const calculatedHistoricalCAGR = useMemo(() => {
    if (investedAmount > 0 && currentValue > 0 && yearsInvested > 0) {
      const growthRatio = currentValue / investedAmount;
      return (Math.pow(growthRatio, 1 / yearsInvested) - 1) * 100;
    }
    return 13.5;
  }, [currentValue, investedAmount, yearsInvested]);

  const effectiveCAGR = cagrInput !== "" ? Number(cagrInput) : calculatedHistoricalCAGR;
  const terDiff = Math.max(0, regularTER - directTER);

  const annualFeeLoss = planType === "regular" ? (currentValue * (terDiff / 100)) : 0;

  const pastFeesLost = useMemo(() => {
    if (planType === "direct") return 0;
    let totalPast = 0;
    let runningVal = investedAmount;
    const growthPerYear = 1 + effectiveCAGR / 100;
    for (let i = 0; i < yearsInvested; i++) {
      totalPast += runningVal * (terDiff / 100);
      runningVal = runningVal * growthPerYear;
    }
    return Math.round(totalPast);
  }, [planType, investedAmount, yearsInvested, effectiveCAGR, terDiff]);

  const wealthLostAt54 = useMemo(() => {
    if (planType === "direct") return 0;
    const cagrDecimal = effectiveCAGR / 100;
    const directFutureValue = currentValue * Math.pow(1 + cagrDecimal, yearsToRetire);
    const regularFutureValue = currentValue * Math.pow(1 + Math.max(0, cagrDecimal - terDiff / 100), yearsToRetire);
    return Math.max(0, directFutureValue - regularFutureValue);
  }, [planType, currentValue, effectiveCAGR, terDiff, yearsToRetire]);

  const accruedProfit = Math.max(0, currentValue - investedAmount);
  const profitPercentage = currentValue > 0 ? (accruedProfit / currentValue) * 100 : 0;

  const annualLTCGExemption = 125000;

  const tranche1Gain = Math.min(accruedProfit, annualLTCGExemption);
  const tranche1Redemption = profitPercentage > 0 ? (tranche1Gain / (profitPercentage / 100)) : 0;

  const remainingProfitAfterT1 = Math.max(0, accruedProfit - tranche1Gain);

  const tranche2Gain = Math.min(remainingProfitAfterT1, annualLTCGExemption);
  const tranche2Redemption = profitPercentage > 0 ? (tranche2Gain / (profitPercentage / 100)) : 0;

  const remainingProfitAfterT2 = Math.max(0, remainingProfitAfterT1 - tranche2Gain);
  const remainingRedemption = profitPercentage > 0 ? (remainingProfitAfterT2 / (profitPercentage / 100)) : 0;
  const remainingTax = remainingProfitAfterT2 * 0.125;

  const breakEvenMonths = annualFeeLoss > 0 ? Math.round((remainingTax / annualFeeLoss) * 12) : 0;

  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.round(val));

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-semibold">
              Mutual Fund Expense & Tax Optimizer
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Direct vs. Indirect (Regular) Converter & Roadmap
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Audit hidden distributor trail commissions and execute a zero-tax conversion schedule.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 font-bold">
            Section 112A Tax-Harvesting Engine
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="lg:col-span-2">
          <label className="text-[11px] font-mono text-zinc-400 block mb-1 uppercase">Mutual Fund Name</label>
          <input
            type="text"
            value={fundName}
            onChange={(e) => setFundName(e.target.value)}
            placeholder="e.g. Parag Parikh Flexi Cap Fund"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>

        <div>
          <label className="text-[11px] font-mono text-zinc-400 block mb-1 uppercase">Plan Type</label>
          <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setPlanType("regular")}
              className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                planType === "regular"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Regular (Indirect)
            </button>
            <button
              type="button"
              onClick={() => setPlanType("direct")}
              className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                planType === "direct"
                  ? "bg-emerald-500 text-zinc-950 shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Direct Plan
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-mono text-zinc-400 block mb-1 uppercase">Start Year</label>
          <select
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
          >
            {[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map((yr) => (
              <option key={yr} value={yr}>
                {yr} ({currentYear - yr} yrs ago)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-mono text-zinc-400 block mb-1 uppercase">Current Value (₹)</label>
          <input
            type="number"
            step="50000"
            value={currentValue}
            onChange={(e) => setCurrentValue(Number(e.target.value))}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-mono text-zinc-400 block mb-1 uppercase">Total Invested (₹)</label>
          <input
            type="number"
            step="50000"
            value={investedAmount}
            onChange={(e) => setInvestedAmount(Number(e.target.value))}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-mono text-zinc-400 block mb-1 uppercase">
            Historical Return (CAGR %)
          </label>
          <input
            type="number"
            step="0.5"
            placeholder={`${calculatedHistoricalCAGR.toFixed(1)}% (auto)`}
            value={cagrInput}
            onChange={(e) => setCagrInput(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
          />
          <span className="text-[10px] text-zinc-500 block mt-1">
            Auto-calculated: {calculatedHistoricalCAGR.toFixed(1)}% p.a.
          </span>
        </div>

        <div>
          <label className="text-[11px] font-mono text-zinc-400 block mb-1 uppercase">
            Regular vs Direct TER (%)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.05"
              value={regularTER}
              onChange={(e) => setRegularTER(Number(e.target.value))}
              title="Regular Plan Total Expense Ratio"
              className="w-1/2 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-rose-400 font-mono text-center"
            />
            <span className="text-xs text-zinc-600">vs</span>
            <input
              type="number"
              step="0.05"
              value={directTER}
              onChange={(e) => setDirectTER(Number(e.target.value))}
              title="Direct Plan Total Expense Ratio"
              className="w-1/2 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-emerald-400 font-mono text-center"
            />
          </div>
          <span className="text-[10px] text-rose-400 font-mono block mt-1">
            Difference: -{terDiff.toFixed(2)}% broker trail
          </span>
        </div>
      </div>

      {planType === "direct" ? (
        <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-sm flex items-start gap-3">
          <span className="text-xl">✓</span>
          <div>
            <strong className="text-emerald-400 block font-bold">This holding is already in a Direct Plan!</strong>
            <p className="text-xs text-zinc-300 mt-1">
              You are paying 0% broker commission. 100% of your returns compound directly into your wealth without third-party distributor drag.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-rose-500/30 shadow-lg">
              <span className="text-[11px] font-mono uppercase text-rose-400 block font-bold">
                1. Silent Annual Bleed Right Now
              </span>
              <p className="text-3xl font-black text-rose-400 font-mono mt-1">{formatINR(annualFeeLoss)} / yr</p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Deducted from your NAV annually to pay distributor trail commissions.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
              <span className="text-[11px] font-mono uppercase text-amber-400 block font-bold">
                2. Historical Fees Already Paid ({yearsInvested} yrs)
              </span>
              <p className="text-3xl font-black text-white font-mono mt-1">{formatINR(pastFeesLost)}</p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Total commission lost since {startYear} at {effectiveCAGR.toFixed(1)}% compounding.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-rose-500/40 shadow-inner">
              <span className="text-[11px] font-mono uppercase text-rose-400 block font-bold">
                3. Compounded Wealth Lost by Age 54
              </span>
              <p className="text-3xl font-black text-rose-400 font-mono mt-1">{formatINR(wealthLostAt54)}</p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Lost retirement corpus over 17 years due to the {terDiff.toFixed(2)}% fee difference.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900/95 to-zinc-950 border border-emerald-500/40 space-y-5 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-2">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                  ⚡ Actionable Zero/Minimal-Tax Conversion Roadmap
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  How to Convert to Direct Without Paying Unnecessary Tax
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Sec 112A Tax Harvesting
              </span>
            </div>

            <div className="space-y-4 text-xs text-zinc-300">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-400 text-sm">Step 1: Immediate SIP Redirect (Today)</span>
                  <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                    ₹0 Tax Impact
                  </span>
                </div>
                <p className="text-zinc-400">
                  Stop your existing monthly SIP in the <strong>Regular Plan</strong> immediately. Set up your new SIP in the exact same fund under its <strong>Direct - Growth</strong> plan today.
                </p>
                <p className="text-[11px] text-emerald-400/90 font-mono">
                  ✓ Halts commission bleeding on all fresh capital instantly.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-400 text-sm">
                    Step 2: Tranche 1 Switch in Current FY ({currentYear}–{(currentYear + 1).toString().slice(2)})
                  </span>
                  <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                    100% Tax Free (₹0 Tax)
                  </span>
                </div>
                <p className="text-zinc-400">
                  Redeem <strong>{formatINR(tranche1Redemption)}</strong> of units held for over 365 days. 
                  This realizes exactly <strong>{formatINR(tranche1Gain)}</strong> of capital gains, which is completely sheltered by your annual Section 112A ₹1.25 Lakh exemption.
                </p>
                <p className="text-[11px] text-cyan-400 font-mono">
                  Action: Immediately reinvest the redeemed {formatINR(tranche1Redemption)} into the Direct Growth plan.
                </p>
              </div>

              {remainingProfitAfterT1 > 0 && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      Step 3: Tranche 2 Switch on April 1, {currentYear + 1}
                    </span>
                    <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                      100% Tax Free (₹0 Tax)
                    </span>
                  </div>
                  <p className="text-zinc-400">
                    On April 1, {currentYear + 1}, your Section 112A ₹1.25 Lakh exemption resets. 
                    Redeem the next tranche of <strong>{formatINR(tranche2Redemption)}</strong> (realizing {formatINR(tranche2Gain)} in gains) and reinvest into Direct.
                  </p>
                </div>
              )}

              {remainingProfitAfterT2 > 0 && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white text-sm">
                      Step 4: Remaining Units & Break-Even Math
                    </span>
                    <span className="font-mono text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">
                      Break-Even: {breakEvenMonths} Months
                    </span>
                  </div>
                  <p className="text-zinc-400">
                    After the two tax-free tranches, remaining units have {formatINR(remainingProfitAfterT2)} in gains. 
                    Paying 12.5% LTCG on this equals <strong>{formatINR(remainingTax)}</strong>.
                  </p>
                  <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-300">
                    <strong>Mathematical Verdict:</strong> Paying {formatINR(remainingTax)} in one-time tax saves you {formatINR(annualFeeLoss)} every single year. 
                    {breakEvenMonths <= 18 ? (
                      <span className="text-emerald-400 font-bold ml-1">
                        You break even in just {breakEvenMonths} months. It is mathematically superior to pay the one-time tax and switch immediately rather than bleeding commission forever!
                      </span>
                    ) : (
                      <span className="text-amber-400 ml-1">
                        You can stagger this over FY {currentYear + 2} to eliminate all tax entirely.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
