"use client";

import React, { useState, useEffect, useMemo } from "react";

export interface TrackedMutualFund {
  id: string;
  name: string;
  investmentType: "sip" | "lumpsum";
  planType: "regular" | "direct";
  monthlySIP?: number;
  lumpSumInvested?: number;
  startYear: number;
  cagr: number;
  regularTER: number;
  directTER: number;
}

const DEFAULT_FUNDS: TrackedMutualFund[] = [
  {
    id: "fund-1",
    name: "Core Equity / Flexi Cap Fund",
    investmentType: "sip",
    planType: "regular",
    monthlySIP: 3000,
    startYear: 2015,
    cagr: 15.0,
    regularTER: 1.70,
    directTER: 0.65,
  },
  {
    id: "fund-2",
    name: "Large Cap Bluechip Fund",
    investmentType: "sip",
    planType: "regular",
    monthlySIP: 17000,
    startYear: 2018,
    cagr: 13.5,
    regularTER: 1.65,
    directTER: 0.70,
  },
  {
    id: "fund-3",
    name: "Nifty 50 Index Fund",
    investmentType: "lumpsum",
    planType: "direct",
    lumpSumInvested: 500000,
    startYear: 2021,
    cagr: 13.0,
    regularTER: 0.60,
    directTER: 0.15,
  },
];

export default function DirectVsRegularMigrator() {
  const currentYear = new Date().getFullYear();
  const yearsToRetire = 17; // FIRE54 timeline

  const [funds, setFunds] = useState<TrackedMutualFund[]>(DEFAULT_FUNDS);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [fName, setFName] = useState("");
  const [fInvType, setFInvType] = useState<"sip" | "lumpsum">("sip");
  const [fPlanType, setFPlanType] = useState<"regular" | "direct">("regular");
  const [fMonthlySIP, setFMonthlySIP] = useState<number>(3000);
  const [fLumpSum, setFLumpSum] = useState<number>(200000);
  const [fStartYear, setFStartYear] = useState<number>(2015);
  const [fCAGR, setFCAGR] = useState<number>(14.5);
  const [fRegTER, setFRegTER] = useState<number>(1.70);
  const [fDirTER, setFDirTER] = useState<number>(0.65);

  // Load saved bucket from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fire54_mf_audit_bucket_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFunds(parsed);
        }
      }
    } catch (e) {}
  }, []);

  const saveFunds = (updated: TrackedMutualFund[]) => {
    setFunds(updated);
    try {
      localStorage.setItem("fire54_mf_audit_bucket_v2", JSON.stringify(updated));
    } catch (e) {}
  };

  const openAddModal = () => {
    setEditingId(null);
    setFName("");
    setFInvType("sip");
    setFPlanType("regular");
    setFMonthlySIP(3000);
    setFLumpSum(200000);
    setFStartYear(2015);
    setFCAGR(14.5);
    setFRegTER(1.70);
    setFDirTER(0.65);
    setShowModal(true);
  };

  const openEditModal = (fund: TrackedMutualFund) => {
    setEditingId(fund.id);
    setFName(fund.name);
    setFInvType(fund.investmentType);
    setFPlanType(fund.planType);
    setFMonthlySIP(fund.monthlySIP || 3000);
    setFLumpSum(fund.lumpSumInvested || 200000);
    setFStartYear(fund.startYear);
    setFCAGR(fund.cagr);
    setFRegTER(fund.regularTER);
    setFDirTER(fund.directTER);
    setShowModal(true);
  };

  const handleSaveFund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim()) return;

    const payload: TrackedMutualFund = {
      id: editingId || `fund-${Date.now()}`,
      name: fName,
      investmentType: fInvType,
      planType: fPlanType,
      monthlySIP: fInvType === "sip" ? fMonthlySIP : undefined,
      lumpSumInvested: fInvType === "lumpsum" ? fLumpSum : undefined,
      startYear: fStartYear,
      cagr: fCAGR,
      regularTER: fRegTER,
      directTER: fDirTER,
    };

    if (editingId) {
      saveFunds(funds.map((f) => (f.id === editingId ? payload : f)));
    } else {
      saveFunds([...funds, payload]);
    }
    setShowModal(false);
  };

  const handleDeleteFund = (id: string) => {
    saveFunds(funds.filter((f) => f.id !== id));
  };

  // MONTH-BY-MONTH SIP / LUMPSUM SIMULATION ENGINE
  const computedFunds = useMemo(() => {
    return funds.map((f) => {
      const yearsInvested = Math.max(1, currentYear - f.startYear);
      const totalMonths = yearsInvested * 12;
      const terDiff = f.planType === "regular" ? Math.max(0, f.regularTER - f.directTER) : 0;
      const directCAGR = f.cagr;
      const regularCAGR = Math.max(0.5, f.cagr - terDiff);

      let totalInvested = 0;
      let regularCurrentVal = 0;
      let directCurrentVal = 0;
      let approxRegularUnits = 0;
      let approxDirectUnits = 0;

      // Base NAV at start was ~₹10.00
      const baseNav = 10;
      const rDirectMonthly = Math.pow(1 + directCAGR / 100, 1 / 12) - 1;
      const rRegularMonthly = Math.pow(1 + regularCAGR / 100, 1 / 12) - 1;

      const navRegularToday = baseNav * Math.pow(1 + regularCAGR / 100, yearsInvested);
      const navDirectToday = baseNav * Math.pow(1 + directCAGR / 100, yearsInvested);

      if (f.investmentType === "sip") {
        const sipAmt = f.monthlySIP || 3000;
        totalInvested = sipAmt * totalMonths;

        // Month-by-month unit accumulation at the exact unit rate of each month
        let sumRegularUnits = 0;
        let sumDirectUnits = 0;

        for (let m = 0; m < totalMonths; m++) {
          const navRegMonth = baseNav * Math.pow(1 + rRegularMonthly, m);
          const navDirMonth = baseNav * Math.pow(1 + rDirectMonthly, m);
          sumRegularUnits += sipAmt / navRegMonth;
          sumDirectUnits += sipAmt / navDirMonth;
        }

        approxRegularUnits = Math.round(sumRegularUnits);
        approxDirectUnits = Math.round(sumDirectUnits);

        regularCurrentVal = Math.round(sumRegularUnits * navRegularToday);
        directCurrentVal = Math.round(sumDirectUnits * navDirectToday);
      } else {
        // Lump sum investment
        totalInvested = f.lumpSumInvested || 200000;
        approxRegularUnits = Math.round(totalInvested / baseNav);
        approxDirectUnits = approxRegularUnits;
        regularCurrentVal = Math.round(totalInvested * Math.pow(1 + regularCAGR / 100, yearsInvested));
        directCurrentVal = Math.round(totalInvested * Math.pow(1 + directCAGR / 100, yearsInvested));
      }

      // Actual current value based on user selected plan
      const currentVal = f.planType === "regular" ? regularCurrentVal : directCurrentVal;

      // 1. Loss incurred till now
      const lostTillNow = f.planType === "regular" ? Math.max(0, directCurrentVal - regularCurrentVal) : 0;

      // 2. Annual fee loss today
      const annualLossToday = f.planType === "regular" ? Math.round(currentVal * (terDiff / 100)) : 0;

      // 3. Compounded loss if continued to Age 54 (17 years)
      const monthsToRetire = yearsToRetire * 12;
      let fvDirectAt54 = 0;
      let fvRegularAt54 = 0;

      if (f.investmentType === "sip") {
        const sipAmt = f.monthlySIP || 3000;
        const fvCorpusDir = currentVal * Math.pow(1 + directCAGR / 100, yearsToRetire);
        const fvSipDir =
          rDirectMonthly > 0
            ? sipAmt * ((Math.pow(1 + rDirectMonthly, monthsToRetire) - 1) / rDirectMonthly) * (1 + rDirectMonthly)
            : 0;
        fvDirectAt54 = fvCorpusDir + fvSipDir;

        const fvCorpusReg = currentVal * Math.pow(1 + regularCAGR / 100, yearsToRetire);
        const fvSipReg =
          rRegularMonthly > 0
            ? sipAmt * ((Math.pow(1 + rRegularMonthly, monthsToRetire) - 1) / rRegularMonthly) * (1 + rRegularMonthly)
            : 0;
        fvRegularAt54 = fvCorpusReg + fvSipReg;
      } else {
        fvDirectAt54 = currentVal * Math.pow(1 + directCAGR / 100, yearsToRetire);
        fvRegularAt54 = currentVal * Math.pow(1 + regularCAGR / 100, yearsToRetire);
      }

      const futureLossAt54 = f.planType === "regular" ? Math.max(0, Math.round(fvDirectAt54 - fvRegularAt54)) : 0;

      // Accrued gain
      const profit = Math.max(0, currentVal - totalInvested);

      return {
        ...f,
        totalInvested,
        currentVal,
        approxRegularUnits,
        approxDirectUnits,
        lostTillNow,
        annualLossToday,
        futureLossAt54,
        profit,
        yearsInvested,
        terDiff,
        navRegularToday: Number(navRegularToday.toFixed(2)),
      };
    });
  }, [funds, currentYear, yearsToRetire]);

  // Consolidated Portfolio Aggregates
  const totals = useMemo(() => {
    let invested = 0;
    let current = 0;
    let regularVal = 0;
    let directVal = 0;
    let totalLostTillNow = 0;
    let totalAnnualLoss = 0;
    let totalFutureLoss54 = 0;
    let totalRegularProfit = 0;

    computedFunds.forEach((f) => {
      invested += f.totalInvested;
      current += f.currentVal;
      if (f.planType === "regular") {
        regularVal += f.currentVal;
        totalLostTillNow += f.lostTillNow;
        totalAnnualLoss += f.annualLossToday;
        totalFutureLoss54 += f.futureLossAt54;
        totalRegularProfit += f.profit;
      } else {
        directVal += f.currentVal;
      }
    });

    return {
      invested,
      current,
      regularVal,
      directVal,
      totalLostTillNow,
      totalAnnualLoss,
      totalFutureLoss54,
      totalRegularProfit,
    };
  }, [computedFunds]);

  // Staggered Zero-Tax Roadmap Calculations
  const roadmap = useMemo(() => {
    const regularFunds = computedFunds.filter((f) => f.planType === "regular" && f.profit > 0);
    regularFunds.sort((a, b) => b.terDiff - a.terDiff); // Highest fee bleeders first

    const annualLimit = 125000;
    const profit = totals.totalRegularProfit;
    const valRatio = profit > 0 ? totals.regularVal / profit : 1;

    const t1Gain = Math.min(profit, annualLimit);
    const t1Redeem = Math.round(t1Gain * valRatio);

    const remProfitT1 = Math.max(0, profit - t1Gain);
    const t2Gain = Math.min(remProfitT1, annualLimit);
    const t2Redeem = Math.round(t2Gain * valRatio);

    const remProfitT2 = Math.max(0, remProfitT1 - t2Gain);
    const remTax = Math.round(remProfitT2 * 0.125);
    const breakEvenMonths = totals.totalAnnualLoss > 0 ? Math.round((remTax / totals.totalAnnualLoss) * 12) : 0;

    return {
      t1Gain,
      t1Redeem,
      t2Gain,
      t2Redeem,
      remProfitT2,
      remTax,
      breakEvenMonths,
    };
  }, [computedFunds, totals]);

  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.round(val));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* KPI HERO BANNER: COMPILED PORTFOLIO TOTALS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio Corpus */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl">
          <span className="text-[11px] font-mono uppercase text-zinc-400 block font-bold">
            Total Mutual Fund Corpus
          </span>
          <p className="text-3xl font-black text-white font-mono mt-1">{formatINR(totals.current)}</p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Invested: {formatINR(totals.invested)} | Profit: +{formatINR(totals.current - totals.invested)}
          </p>
        </div>

        {/* 1. TOTAL LOSS INCURRED TILL NOW */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 to-zinc-950 border border-rose-500/40 shadow-xl">
          <span className="text-[11px] font-mono uppercase text-rose-400 block font-bold">
            1. Total Commission Lost Till Now
          </span>
          <p className="text-3xl font-black text-rose-400 font-mono mt-1">{formatINR(totals.totalLostTillNow)}</p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Actual cash siphoned by distributors from unit NAVs across all your funds.
          </p>
        </div>

        {/* 2. RECURRING ANNUAL LOSS TODAY */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-amber-500/30 shadow-xl">
          <span className="text-[11px] font-mono uppercase text-amber-400 block font-bold">
            2. Annual Fee Loss If Continued
          </span>
          <p className="text-3xl font-black text-amber-400 font-mono mt-1">{formatINR(totals.totalAnnualLoss)} / yr</p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Recurring fee drag bleeding your portfolio balance every single year.
          </p>
        </div>

        {/* 3. TOTAL MONEY SAVED BY AGE 54 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-zinc-950 border border-cyan-500/40 shadow-xl">
          <span className="text-[11px] font-mono uppercase text-cyan-400 block font-bold">
            3. Wealth Saved by Age 54 If Converted
          </span>
          <p className="text-3xl font-black text-cyan-400 font-mono mt-1">+{formatINR(totals.totalFutureLoss54)}</p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Extra compounding wealth added to your retirement by switching to Direct today.
          </p>
        </div>
      </div>

      {/* MASTER MUTUAL FUND BUCKET TABLE */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                Mutual Fund Portfolio Bucket Table
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              Active Holdings & Direct vs. Indirect Bleed Breakdown
            </h3>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <span>+ Add Mutual Fund</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-zinc-900/90 text-zinc-400 text-[10px] uppercase border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4">Fund Name</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-3">Plan</th>
                <th className="py-3.5 px-3 text-right">Invested</th>
                <th className="py-3.5 px-3 text-right">Current Value</th>
                <th className="py-3.5 px-3 text-right text-emerald-400">Gain</th>
                <th className="py-3.5 px-3 text-center">Started</th>
                <th className="py-3.5 px-3 text-center text-rose-400">TER Drag</th>
                <th className="py-3.5 px-3 text-right text-rose-400">Lost Till Now</th>
                <th className="py-3.5 px-3 text-right text-cyan-400">Saved @ 54</th>
                <th className="py-3.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-950">
              {computedFunds.map((fund) => (
                <tr key={fund.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-white max-w-[220px] truncate" title={fund.name}>
                    {fund.name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-bold uppercase">
                      {fund.investmentType === "sip" ? `SIP ₹${fund.monthlySIP?.toLocaleString("en-IN")}/mo` : "Lump Sum"}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        fund.planType === "direct"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {fund.planType === "direct" ? "Direct" : "Regular"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-zinc-400">{formatINR(fund.totalInvested)}</td>
                  <td className="py-3 px-3 text-right font-bold text-white">{formatINR(fund.currentVal)}</td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-semibold">+{formatINR(fund.profit)}</td>
                  <td className="py-3 px-3 text-center text-zinc-400">{fund.startYear}</td>
                  <td className="py-3 px-3 text-center text-rose-400 font-bold">
                    {fund.planType === "regular" ? `-${fund.terDiff.toFixed(2)}%` : "0.00%"}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-400 font-bold">
                    {fund.lostTillNow > 0 ? formatINR(fund.lostTillNow) : "₹0"}
                  </td>
                  <td className="py-3 px-3 text-right text-cyan-400 font-bold">
                    {fund.futureLossAt54 > 0 ? `+${formatINR(fund.futureLossAt54)}` : "₹0"}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(fund)}
                        className="text-zinc-500 hover:text-white text-xs"
                        title="Edit Fund"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteFund(fund.id)}
                        className="text-zinc-500 hover:text-rose-400 text-xs"
                        title="Delete Fund"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-900 text-white font-bold border-t border-zinc-800">
              <tr>
                <td className="py-3 px-4" colSpan={3}>
                  PORTFOLIO TOTALS ({computedFunds.length} Funds)
                </td>
                <td className="py-3 px-3 text-right text-zinc-300">{formatINR(totals.invested)}</td>
                <td className="py-3 px-3 text-right text-emerald-400">{formatINR(totals.current)}</td>
                <td className="py-3 px-3 text-right text-emerald-400">+{formatINR(totals.current - totals.invested)}</td>
                <td className="py-3 px-3 text-center" colSpan={2}>—</td>
                <td className="py-3 px-3 text-right text-rose-400">{formatINR(totals.totalLostTillNow)}</td>
                <td className="py-3 px-3 text-right text-cyan-400">+{formatINR(totals.totalFutureLoss54)}</td>
                <td className="py-3 px-3 text-center">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* FUND-SPECIFIC ZERO-TAX ROADMAP ACCORDION / DETAIL */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900/95 to-zinc-950 border border-emerald-500/40 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-2">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              ⚡ Section 112A Portfolio Switch Schedule
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">
              Fund-Specific Roadmap: Zero-Tax Conversion to Direct Growth
            </h3>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
            Total Regular Profit: {formatINR(totals.totalRegularProfit)}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-zinc-950 text-zinc-400 text-[10px] uppercase border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Tranche & Date</th>
                <th className="py-3 px-4">Execution Action</th>
                <th className="py-3 px-4 text-right">Redemption Value</th>
                <th className="py-3 px-4 text-right">Capital Gain</th>
                <th className="py-3 px-4 text-center text-emerald-400 font-bold">Tax Payable</th>
                <th className="py-3 px-4 text-center">Destination</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950/70">
              <tr className="hover:bg-zinc-900/50">
                <td className="py-3.5 px-4 font-bold text-white">Immediate (Today)</td>
                <td className="py-3.5 px-4 text-zinc-300">Stop active Regular SIPs</td>
                <td className="py-3.5 px-4 text-right text-zinc-400">—</td>
                <td className="py-3.5 px-4 text-right text-zinc-400">—</td>
                <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">₹0 Tax</td>
                <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">Direct SIPs Started</td>
              </tr>
              <tr className="hover:bg-zinc-900/50">
                <td className="py-3.5 px-4 font-bold text-white">Tranche 1 (Now – 31 Mar 2027)</td>
                <td className="py-3.5 px-4 text-zinc-300">Switch units held &gt; 365 days</td>
                <td className="py-3.5 px-4 text-right font-bold text-white">{formatINR(roadmap.t1Redeem)}</td>
                <td className="py-3.5 px-4 text-right text-zinc-400">{formatINR(roadmap.t1Gain)}</td>
                <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">₹0 (100% Exempt)</td>
                <td className="py-3.5 px-4 text-center text-cyan-400">Reinvest in Direct</td>
              </tr>
              {roadmap.t2Gain > 0 && (
                <tr className="hover:bg-zinc-900/50">
                  <td className="py-3.5 px-4 font-bold text-white">Tranche 2 (1 Apr 2027 – 31 Mar 2028)</td>
                  <td className="py-3.5 px-4 text-zinc-300">Switch next batch on FY quota reset</td>
                  <td className="py-3.5 px-4 text-right font-bold text-white">{formatINR(roadmap.t2Redeem)}</td>
                  <td className="py-3.5 px-4 text-right text-zinc-400">{formatINR(roadmap.t2Gain)}</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">₹0 (100% Exempt)</td>
                  <td className="py-3.5 px-4 text-center text-cyan-400">Reinvest in Direct</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Residual Break-Even Analysis */}
        {roadmap.remProfitT2 > 0 && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="font-bold text-white">Residual Balance Evaluation:</span>
              <span className="text-cyan-400 font-bold">Break-Even Horizon: {roadmap.breakEvenMonths} Months</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              After your tax-free tranches, remaining units have <strong>{formatINR(roadmap.remProfitT2)}</strong> in profit. 
              Paying 12.5% LTCG on this equals a one-time tax of <strong>{formatINR(roadmap.remTax)}</strong>. 
              Because switching saves you <strong>{formatINR(totals.totalAnnualLoss)} every single year</strong> in commission, 
              paying the one-time tax breaks even in <strong>{roadmap.breakEvenMonths} months</strong>, recovering <strong>{formatINR(totals.totalFutureLoss54)}</strong> in compounding by Age 54!
            </p>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL (SUPPORTS SIP & LUMPSUM) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingId ? "Edit Mutual Fund Holding" : "Add Mutual Fund to Bucket"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFund} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Fund Name</label>
                <input
                  type="text"
                  required
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="e.g. Parag Parikh Flexi Cap Fund"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Investment Mode Toggle: SIP vs Lump Sum */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Investment Mode</label>
                  <select
                    value={fInvType}
                    onChange={(e) => setFInvType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="sip">Monthly SIP</option>
                    <option value="lumpsum">Lump Sum</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Plan Type</label>
                  <select
                    value={fPlanType}
                    onChange={(e) => setFPlanType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="regular">Regular (Indirect)</option>
                    <option value="direct">Direct Plan</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Amount based on Mode */}
              <div className="grid grid-cols-2 gap-3">
                {fInvType === "sip" ? (
                  <div>
                    <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Monthly SIP Amount (₹)</label>
                    <input
                      type="number"
                      step="500"
                      required
                      value={fMonthlySIP}
                      onChange={(e) => setFMonthlySIP(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Lump Sum Invested (₹)</label>
                    <input
                      type="number"
                      step="25000"
                      required
                      value={fLumpSum}
                      onChange={(e) => setFLumpSum(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Started Year</label>
                  <select
                    value={fStartYear}
                    onChange={(e) => setFStartYear(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {[2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map(
                      (yr) => (
                        <option key={yr} value={yr}>
                          {yr} ({currentYear - yr} yrs ago)
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[10px]">CAGR %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={fCAGR}
                    onChange={(e) => setFCAGR(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-white text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-rose-400 block mb-1 uppercase text-[10px]">Regular TER %</label>
                  <input
                    type="number"
                    step="0.05"
                    value={fRegTER}
                    onChange={(e) => setFRegTER(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-rose-400 text-center focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-emerald-400 block mb-1 uppercase text-[10px]">Direct TER %</label>
                  <input
                    type="number"
                    step="0.05"
                    value={fDirTER}
                    onChange={(e) => setFDirTER(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-emerald-400 text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 shadow-md"
                >
                  {editingId ? "Save Changes" : "Add to Bucket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
