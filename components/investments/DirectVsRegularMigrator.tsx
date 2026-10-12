"use client";

import React, { useState, useMemo } from "react";

interface PortfolioItem {
  id?: string;
  name?: string;
  type?: string;
  category?: string;
  currentValue?: number | string;
  investedAmount?: number | string;
  monthlyContribution?: number | string;
}

interface DirectVsRegularMigratorProps {
  portfolio?: PortfolioItem[];
}

export default function DirectVsRegularMigrator({ portfolio = [] }: DirectVsRegularMigratorProps) {
  const currentYear = new Date().getFullYear();
  const yearsToRetire = 17; // FIRE54 timeline

  // Detect mutual fund asset from portfolio if available (defaults to your ₹41.30L / ₹20k SIP)
  const detectedMF = portfolio.find(
    (item) => item.type === "Asset" && (item.category === "Mutual Fund" || (item.name || "").toLowerCase().includes("mutual"))
  );

  const initialVal = Number(detectedMF?.currentValue) || 4130000;
  const initialInvested = Number(detectedMF?.investedAmount) > 0 ? Number(detectedMF?.investedAmount) : 2200000;
  const initialSIP = Number(detectedMF?.monthlyContribution) || 20000;

  const [fundName, setFundName] = useState(detectedMF?.name && detectedMF.name !== "mutual fund" ? detectedMF.name : "Flexi Cap / Core Equity Fund");
  const [currentValue, setCurrentValue] = useState<number>(initialVal);
  const [investedAmount, setInvestedAmount] = useState<number>(initialInvested);
  const [sipAmount, setSipAmount] = useState<number>(initialSIP);
  const [startYear, setStartYear] = useState<number>(2018);
  const [cagrInput, setCagrInput] = useState<string>("");
  const [regularTER, setRegularTER] = useState<number>(1.75);
  const [directTER, setDirectTER] = useState<number>(0.65);

  const yearsInvested = Math.max(1, currentYear - startYear);
  const terDiff = Math.max(0, regularTER - directTER);

  // Auto-calculated historical CAGR: (currentValue / investedAmount)^(1/years) - 1
  const calculatedCAGR = useMemo(() => {
    if (investedAmount > 0 && currentValue > 0 && yearsInvested > 0) {
      return (Math.pow(currentValue / investedAmount, 1 / yearsInvested) - 1) * 100;
    }
    return 13.5;
  }, [currentValue, investedAmount, yearsInvested]);

  const effectiveCAGR = cagrInput !== "" ? Number(cagrInput) : calculatedCAGR;

  // 1. EXACT TOTAL COMMISSION LOST TILL TODAY
  const totalCommissionLostTillToday = useMemo(() => {
    let lost = 0;
    let runningVal = investedAmount;
    const growth = 1 + effectiveCAGR / 100;
    for (let yr = 0; yr < yearsInvested; yr++) {
      lost += runningVal * (terDiff / 100);
      runningVal = runningVal * growth;
    }
    return Math.round(lost);
  }, [investedAmount, effectiveCAGR, terDiff, yearsInvested]);

  // 2. ANNUAL RECURRING SAVINGS BY SWITCHING TO DIRECT
  const annualSavings = Math.round(currentValue * (terDiff / 100));

  // 3. TOTAL COMPOUNDED WEALTH SAVED BY AGE 54 (17 YEARS)
  const wealthSavedAtAge54 = useMemo(() => {
    const cagrDec = effectiveCAGR / 100;
    const directMonthlyRate = Math.pow(1 + cagrDec, 1 / 12) - 1;
    const regularCAGR = Math.max(0.01, cagrDec - terDiff / 100);
    const regularMonthlyRate = Math.pow(1 + regularCAGR, 1 / 12) - 1;
    const totalMonths = yearsToRetire * 12;

    // Direct future value (corpus + continuing SIP)
    const fvCorpusDirect = currentValue * Math.pow(1 + cagrDec, yearsToRetire);
    const fvSipDirect = directMonthlyRate > 0 ? sipAmount * ((Math.pow(1 + directMonthlyRate, totalMonths) - 1) / directMonthlyRate) * (1 + directMonthlyRate) : 0;
    const totalDirect = fvCorpusDirect + fvSipDirect;

    // Regular future value (corpus + continuing SIP with fee drag)
    const fvCorpusRegular = currentValue * Math.pow(1 + regularCAGR, yearsToRetire);
    const fvSipRegular = regularMonthlyRate > 0 ? sipAmount * ((Math.pow(1 + regularMonthlyRate, totalMonths) - 1) / regularMonthlyRate) * (1 + regularMonthlyRate) : 0;
    const totalRegular = fvCorpusRegular + fvSipRegular;

    return Math.max(0, Math.round(totalDirect - totalRegular));
  }, [currentValue, sipAmount, effectiveCAGR, terDiff, yearsToRetire]);

  // 4. FUND-SPECIFIC ZERO-TAX ROADMAP (Section 112A Annual ₹1.25L Exemption)
  const totalAccruedProfit = Math.max(0, currentValue - investedAmount);
  const profitRatio = currentValue > 0 ? totalAccruedProfit / currentValue : 0;

  const annualExemption = 125000;

  // Tranche 1: Current FY (FY 2026-27, before March 31, 2027)
  const t1Gain = Math.min(totalAccruedProfit, annualExemption);
  const t1Redemption = profitRatio > 0 ? Math.round(t1Gain / profitRatio) : 0;

  // Tranche 2: Next FY (FY 2027-28, from April 1, 2027)
  const remainingProfitT1 = Math.max(0, totalAccruedProfit - t1Gain);
  const t2Gain = Math.min(remainingProfitT1, annualExemption);
  const t2Redemption = profitRatio > 0 ? Math.round(t2Gain / profitRatio) : 0;

  // Tranche 3: FY 2028-29 (From April 1, 2028)
  const remainingProfitT2 = Math.max(0, remainingProfitT1 - t2Gain);
  const t3Gain = Math.min(remainingProfitT2, annualExemption);
  const t3Redemption = profitRatio > 0 ? Math.round(t3Gain / profitRatio) : 0;

  // Residual balance after 3 tax-free tranches
  const remainingResidualProfit = Math.max(0, remainingProfitT2 - t3Gain);
  const remainingResidualTax = Math.round(remainingResidualProfit * 0.125);
  const breakEvenMonths = annualSavings > 0 ? Math.round((remainingResidualTax / annualSavings) * 12) : 0;

  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.round(val));

  return (
    <div className="rounded-3xl border border-emerald-500/40 bg-zinc-950 p-6 md:p-8 shadow-2xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-semibold">
              Fund-Specific Direct Conversion & Tax Shield
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Mutual Fund Fee Bleed & Zero-Tax Switch Blueprint
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Exact rupee loss calculation and fund-specific Section 112A tax-harvesting roadmap for your {formatINR(currentValue)} portfolio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            Broker Drag: -{terDiff.toFixed(2)}% / yr
          </span>
        </div>
      </div>

      {/* INPUT AUDIT BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 font-mono text-xs">
        <div className="lg:col-span-2">
          <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Fund Name</label>
          <input
            type="text"
            value={fundName}
            onChange={(e) => setFundName(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Current Value (₹)</label>
          <input
            type="number"
            step="50000"
            value={currentValue}
            onChange={(e) => setCurrentValue(Number(e.target.value))}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Invested Principal (₹)</label>
          <input
            type="number"
            step="50000"
            value={investedAmount}
            onChange={(e) => setInvestedAmount(Number(e.target.value))}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Start Year</label>
          <select
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
          >
            {[2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map((yr) => (
              <option key={yr} value={yr}>
                {yr} ({currentYear - yr} yrs ago)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CORE INTELLIGENCE CARDS: LOSS INCURRED & MONEY SAVED */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Loss Incurred Till Now */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-950/40 to-zinc-950 border border-rose-500/40 shadow-xl">
          <span className="text-xs font-mono uppercase text-rose-400 font-bold block">
            Total Loss Incurred Till Now
          </span>
          <p className="text-3xl md:text-4xl font-black text-rose-400 font-mono mt-2">
            {formatINR(totalCommissionLostTillToday)}
          </p>
          <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
            Direct cash siphoned from your NAV in distributor trail commissions since <strong>{startYear}</strong> ({yearsInvested} years of compounding at {effectiveCAGR.toFixed(1)}% CAGR).
          </p>
        </div>

        {/* Immediate Annual Savings */}
        <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl">
          <span className="text-xs font-mono uppercase text-emerald-400 font-bold block">
            Immediate Annual Savings
          </span>
          <p className="text-3xl md:text-4xl font-black text-white font-mono mt-2">
            {formatINR(annualSavings)} / yr
          </p>
          <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
            Reclaimed every single year by eliminating the <strong>{terDiff.toFixed(2)}%</strong> distributor fee on your current {formatINR(currentValue)} corpus.
          </p>
        </div>

        {/* Total Money Saved by Age 54 */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-zinc-950 border border-cyan-500/40 shadow-xl">
          <span className="text-xs font-mono uppercase text-cyan-400 font-bold block">
            Total Wealth Saved by Age 54
          </span>
          <p className="text-3xl md:text-4xl font-black text-cyan-400 font-mono mt-2">
            +{formatINR(wealthSavedAtAge54)}
          </p>
          <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
            Extra liquid retirement corpus added to your FIRE54 target by letting the {terDiff.toFixed(2)}% fee compound in your favor over the next 17 years.
          </p>
        </div>
      </div>

      {/* FUND-SPECIFIC ZERO-TAX ROADMAP (STAGGERED TABLE) */}
      <div className="p-6 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-2">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              ⚡ Section 112A Tax-Sheltered Switch Schedule
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">
              Fund-Specific Roadmap: Zero-Tax Conversion to Direct Growth
            </h3>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
            Total Accrued Gain: {formatINR(totalAccruedProfit)}
          </span>
        </div>

        {/* Actionable Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-zinc-950 text-zinc-400 text-[10px] uppercase border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Tranche & Window</th>
                <th className="py-3 px-4">Action Directive</th>
                <th className="py-3 px-4 text-right">Redemption Value</th>
                <th className="py-3 px-4 text-right">Capital Gain</th>
                <th className="py-3 px-4 text-center text-emerald-400 font-bold">Tax Payable</th>
                <th className="py-3 px-4 text-center">Destination</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950/70">
              {/* Immediate Step */}
              <tr className="hover:bg-zinc-900/50">
                <td className="py-3.5 px-4 font-bold text-white">Immediate (Today)</td>
                <td className="py-3.5 px-4 text-zinc-300">Stop Regular SIP (₹{sipAmount.toLocaleString("en-IN")}/mo)</td>
                <td className="py-3.5 px-4 text-right text-zinc-400">—</td>
                <td className="py-3.5 px-4 text-right text-zinc-400">—</td>
                <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">₹0 Tax</td>
                <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">Direct SIP Started</td>
              </tr>

              {/* Tranche 1 */}
              <tr className="hover:bg-zinc-900/50">
                <td className="py-3.5 px-4 font-bold text-white">
                  Tranche 1 (Now – 31 Mar 2027)
                </td>
                <td className="py-3.5 px-4 text-zinc-300">Switch units held &gt; 365 days</td>
                <td className="py-3.5 px-4 text-right font-bold text-white">{formatINR(t1Redemption)}</td>
                <td className="py-3.5 px-4 text-right text-zinc-400">{formatINR(t1Gain)}</td>
                <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">₹0 (100% Exempt)</td>
                <td className="py-3.5 px-4 text-center text-cyan-400">Reinvest in Direct</td>
              </tr>

              {/* Tranche 2 */}
              {t2Gain > 0 && (
                <tr className="hover:bg-zinc-900/50">
                  <td className="py-3.5 px-4 font-bold text-white">
                    Tranche 2 (1 Apr 2027 – 31 Mar 2028)
                  </td>
                  <td className="py-3.5 px-4 text-zinc-300">Switch on new FY quota reset</td>
                  <td className="py-3.5 px-4 text-right font-bold text-white">{formatINR(t2Redemption)}</td>
                  <td className="py-3.5 px-4 text-right text-zinc-400">{formatINR(t2Gain)}</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">₹0 (100% Exempt)</td>
                  <td className="py-3.5 px-4 text-center text-cyan-400">Reinvest in Direct</td>
                </tr>
              )}

              {/* Tranche 3 */}
              {t3Gain > 0 && (
                <tr className="hover:bg-zinc-900/50">
                  <td className="py-3.5 px-4 font-bold text-white">
                    Tranche 3 (1 Apr 2028 – 31 Mar 2029)
                  </td>
                  <td className="py-3.5 px-4 text-zinc-300">Switch on third FY quota reset</td>
                  <td className="py-3.5 px-4 text-right font-bold text-white">{formatINR(t3Redemption)}</td>
                  <td className="py-3.5 px-4 text-right text-zinc-400">{formatINR(t3Gain)}</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">₹0 (100% Exempt)</td>
                  <td className="py-3.5 px-4 text-center text-cyan-400">Reinvest in Direct</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Residual Break-Even Analysis */}
        {remainingResidualProfit > 0 && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="font-bold text-white">Residual Balance Evaluation:</span>
              <span className="text-cyan-400 font-bold">Break-Even Horizon: {breakEvenMonths} Months</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              After 3 tax-free tranches, remaining units carry <strong>{formatINR(remainingResidualProfit)}</strong> in gain. 
              Paying 12.5% LTCG on this equals a one-time tax of <strong>{formatINR(remainingResidualTax)}</strong>. 
              Because you save <strong>{formatINR(annualSavings)} every single year</strong> in commission, paying the one-time tax breaks even in <strong>{breakEvenMonths} months</strong>. 
              Switching saves you <strong>{formatINR(wealthSavedAtAge54)}</strong> by Age 54!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
