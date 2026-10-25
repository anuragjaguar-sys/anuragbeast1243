"use client";

import React, { useState, useEffect, useMemo } from "react";

export interface TrackedMutualFund {
  id: string;
  name: string;
  investmentType: "corpus_sip" | "sip" | "lumpsum";
  planType: "regular" | "direct";
  currentCorpusInput?: number;
  investedCorpusInput?: number;
  monthlySIP?: number;
  sipStepUpPct?: number;
  lumpSumInvested?: number;
  startYear: number;
  cagr: number;
  regularTER: number;
  directTER: number;
}

const DEFAULT_FUNDS: TrackedMutualFund[] = [
  {
    id: "fund-main-2014",
    name: "Core Mutual Fund Portfolio (Since 2014)",
    investmentType: "corpus_sip",
    planType: "regular",
    currentCorpusInput: 4130000,
    investedCorpusInput: 1950000,
    monthlySIP: 20000,
    startYear: 2014,
    cagr: 14.8,
    regularTER: 1.75,
    directTER: 0.60,
  },
];

export default function DirectVsRegularMigrator() {
  const currentYear = new Date().getFullYear();
  const yearsToRetire = 17; // FIRE54 timeline

  const [funds, setFunds] = useState<TrackedMutualFund[]>(DEFAULT_FUNDS);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [fName, setFName] = useState("");
  const [fInvType, setFInvType] = useState<"corpus_sip" | "sip" | "lumpsum">("corpus_sip");
  const [fPlanType, setFPlanType] = useState<"regular" | "direct">("regular");
  const [fCurrentCorpus, setFCurrentCorpus] = useState<number>(4130000);
  const [fInvestedCorpus, setFInvestedCorpus] = useState<number>(1950000);
  const [fMonthlySIP, setFMonthlySIP] = useState<number>(20000);
  const [fStepUpPct, setFStepUpPct] = useState<number>(10);
  const [fLumpSum, setFLumpSum] = useState<number>(500000);
  const [fStartYear, setFStartYear] = useState<number>(2014);
  const [fCAGR, setFCAGR] = useState<number>(14.8);
  const [fRegTER, setFRegTER] = useState<number>(1.75);
  const [fDirTER, setFDirTER] = useState<number>(0.60);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fire54_mf_audit_bucket_v3");
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
      localStorage.setItem("fire54_mf_audit_bucket_v3", JSON.stringify(updated));
    } catch (e) {}
  };

  const resetToDefault = () => {
    saveFunds(DEFAULT_FUNDS);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFName("");
    setFInvType("corpus_sip");
    setFPlanType("regular");
    setFCurrentCorpus(1000000);
    setFInvestedCorpus(500000);
    setFMonthlySIP(10000);
    setFStepUpPct(10);
    setFLumpSum(300000);
    setFStartYear(2014);
    setFCAGR(14.5);
    setFRegTER(1.75);
    setFDirTER(0.60);
    setShowModal(true);
  };

  const openEditModal = (fund: TrackedMutualFund) => {
    setEditingId(fund.id);
    setFName(fund.name);
    setFInvType(fund.investmentType);
    setFPlanType(fund.planType);
    setFCurrentCorpus(fund.currentCorpusInput || 4130000);
    setFInvestedCorpus(fund.investedCorpusInput || 1950000);
    setFMonthlySIP(fund.monthlySIP || 3000);
    setFStepUpPct(fund.sipStepUpPct ?? 0);
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
      currentCorpusInput: fInvType === "corpus_sip" ? fCurrentCorpus : undefined,
      investedCorpusInput: fInvType === "corpus_sip" ? fInvestedCorpus : undefined,
      monthlySIP: fInvType !== "lumpsum" ? fMonthlySIP : undefined,
      sipStepUpPct: fInvType === "sip" ? fStepUpPct : undefined,
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

  // RIGOROUS HISTORICAL NAV & MULTIPLICATIVE FEE DRAG ENGINE
  const computedFunds = useMemo(() => {
    return funds.map((f) => {
      const yearsInvested = Math.max(1, currentYear - f.startYear);
      const totalMonths = yearsInvested * 12;
      const baseTerDiff = f.planType === "regular" ? Math.max(0, f.regularTER - f.directTER) : 0;

      // Account for pre-2019 SEBI higher TER slabs + B-30 city commission (extra ~0.35% drag in 2013-2019)
      const getEffectiveAnnualTerDiff = (yearIndex: number) => {
        if (f.planType === "direct") return 0;
        const calYear = f.startYear + yearIndex;
        return calYear < 2019 ? baseTerDiff + 0.35 : baseTerDiff;
      };

      const directCAGRDec = f.cagr / 100;
      const rDirectMonthly = Math.pow(1 + directCAGRDec, 1 / 12) - 1;

      // Multiplicative daily/monthly NAV drag: (1 + R_dir) * (1 - TER_diff)
      const getRegularMonthlyRate = (yearIndex: number) => {
        const effDiff = getEffectiveAnnualTerDiff(yearIndex) / 100;
        const annualReg = (1 + directCAGRDec) * (1 - effDiff) - 1;
        return Math.pow(Math.max(1.005, 1 + annualReg), 1 / 12) - 1;
      };

      let totalInvested = 0;
      let regularCurrentVal = 0;
      let directCurrentVal = 0;
      let rawBrokeragePaid = 0;
      let approxRegularUnits = 0;
      let approxDirectUnits = 0;

      const baseNav = 10;
      let navReg = baseNav;
      let navDir = baseNav;

      if (f.investmentType === "sip") {
        let currentSip = f.monthlySIP || 3000;
        const stepUp = (f.sipStepUpPct || 0) / 100;
        let regCorpus = 0;
        let dirCorpus = 0;
        let sumRegUnits = 0;
        let sumDirUnits = 0;

        for (let m = 0; m < totalMonths; m++) {
          const yrIdx = Math.floor(m / 12);
          if (m > 0 && m % 12 === 0 && stepUp > 0) {
            currentSip = currentSip * (1 + stepUp);
          }
          const rRegM = getRegularMonthlyRate(yrIdx);
          const mTerDrag = getEffectiveAnnualTerDiff(yrIdx) / 100 / 12;

          totalInvested += currentSip;
          sumRegUnits += currentSip / navReg;
          sumDirUnits += currentSip / navDir;

          // Raw brokerage siphoned this month on the running balance
          rawBrokeragePaid += (regCorpus + currentSip) * mTerDrag;

          regCorpus = (regCorpus + currentSip) * (1 + rRegM);
          dirCorpus = (dirCorpus + currentSip) * (1 + rDirectMonthly);

          navReg = navReg * (1 + rRegM);
          navDir = navDir * (1 + rDirectMonthly);
        }

        regularCurrentVal = Math.round(regCorpus);
        directCurrentVal = Math.round(dirCorpus);
        approxRegularUnits = Math.round(sumRegUnits);
        approxDirectUnits = Math.round(sumDirUnits);
      } else if (f.investmentType === "lumpsum") {
        totalInvested = f.lumpSumInvested || 200000;
        let regCorpus = totalInvested;
        let dirCorpus = totalInvested;

        for (let m = 0; m < totalMonths; m++) {
          const yrIdx = Math.floor(m / 12);
          const rRegM = getRegularMonthlyRate(yrIdx);
          const mTerDrag = getEffectiveAnnualTerDiff(yrIdx) / 100 / 12;

          rawBrokeragePaid += regCorpus * mTerDrag;
          regCorpus = regCorpus * (1 + rRegM);
          dirCorpus = dirCorpus * (1 + rDirectMonthly);
          navReg = navReg * (1 + rRegM);
          navDir = navDir * (1 + rDirectMonthly);
        }

        regularCurrentVal = Math.round(regCorpus);
        directCurrentVal = Math.round(dirCorpus);
        approxRegularUnits = Math.round(totalInvested / baseNav);
        approxDirectUnits = approxRegularUnits;
      } else {
        // MODE: Known Current Corpus + Start Year (Back-solves exact Direct equivalent from 2014 to today)
        regularCurrentVal = f.currentCorpusInput || 4130000;
        totalInvested = f.investedCorpusInput || Math.round(regularCurrentVal * 0.48);

        // Simulate a growing contribution curve from startYear to today to find exact Direct vs Regular ratio
        let simReg = 0;
        let simDir = 0;
        let simRawFee = 0;
        let baseContribution = 10000;

        for (let m = 0; m < totalMonths; m++) {
          const yrIdx = Math.floor(m / 12);
          if (m > 0 && m % 12 === 0) baseContribution *= 1.08;
          const rRegM = getRegularMonthlyRate(yrIdx);
          const mTerDrag = getEffectiveAnnualTerDiff(yrIdx) / 100 / 12;

          simRawFee += (simReg + baseContribution) * mTerDrag;
          simReg = (simReg + baseContribution) * (1 + rRegM);
          simDir = (simDir + baseContribution) * (1 + rDirectMonthly);
          navReg = navReg * (1 + rRegM);
          navDir = navDir * (1 + rDirectMonthly);
        }

        const scaleFactor = simReg > 0 ? regularCurrentVal / simReg : 1;
        directCurrentVal = f.planType === "regular" ? Math.round(simDir * scaleFactor) : regularCurrentVal;
        rawBrokeragePaid = f.planType === "regular" ? Math.round(simRawFee * scaleFactor) : 0;
        approxRegularUnits = Math.round(regularCurrentVal / navReg);
        approxDirectUnits = Math.round(directCurrentVal / navDir);
      }

      const currentVal = f.planType === "regular" ? regularCurrentVal : directCurrentVal;
      const lostTillNow = f.planType === "regular" ? Math.max(0, directCurrentVal - regularCurrentVal) : 0;
      const rawFeePaid = f.planType === "regular" ? Math.min(lostTillNow, Math.round(rawBrokeragePaid)) : 0;
      const lostCompoundingOnFees = Math.max(0, lostTillNow - rawFeePaid);

      // Annual recurring fee loss today (including multiplicative drag)
      const annualLossToday = f.planType === "regular" ? Math.round(currentVal * (baseTerDiff / 100)) : 0;

      // Future 17-Year Compounding to Age 54
      const monthsToRetire = yearsToRetire * 12;
      const post2019RegMonthly = getRegularMonthlyRate(yearsInvested);
      const sipAmt = f.investmentType !== "lumpsum" ? (f.monthlySIP || 0) : 0;

      const fvCorpusDir = currentVal * Math.pow(1 + rDirectMonthly, monthsToRetire);
      const fvSipDir =
        rDirectMonthly > 0 && sipAmt > 0
          ? sipAmt * ((Math.pow(1 + rDirectMonthly, monthsToRetire) - 1) / rDirectMonthly) * (1 + rDirectMonthly)
          : 0;
      const fvDirectAt54 = fvCorpusDir + fvSipDir;

      const fvCorpusReg = currentVal * Math.pow(1 + post2019RegMonthly, monthsToRetire);
      const fvSipReg =
        post2019RegMonthly > 0 && sipAmt > 0
          ? sipAmt * ((Math.pow(1 + post2019RegMonthly, monthsToRetire) - 1) / post2019RegMonthly) * (1 + post2019RegMonthly)
          : 0;
      const fvRegularAt54 = fvCorpusReg + fvSipReg;

      const futureLossAt54 = f.planType === "regular" ? Math.max(0, Math.round(fvDirectAt54 - fvRegularAt54)) : 0;
      const profit = Math.max(0, currentVal - totalInvested);

      return {
        ...f,
        totalInvested: Math.round(totalInvested),
        currentVal,
        directEquivalentVal: directCurrentVal,
        approxRegularUnits,
        approxDirectUnits,
        lostTillNow,
        rawFeePaid,
        lostCompoundingOnFees,
        annualLossToday,
        futureLossAt54,
        profit,
        yearsInvested,
        terDiff: baseTerDiff,
      };
    });
  }, [funds, currentYear, yearsToRetire]);

  // Consolidated Aggregates
  const totals = useMemo(() => {
    let invested = 0;
    let current = 0;
    let directEquivalent = 0;
    let regularVal = 0;
    let totalLostTillNow = 0;
    let totalRawFeePaid = 0;
    let totalLostCompounding = 0;
    let totalAnnualLoss = 0;
    let totalFutureLoss54 = 0;
    let totalRegularProfit = 0;

    computedFunds.forEach((f) => {
      invested += f.totalInvested;
      current += f.currentVal;
      directEquivalent += f.directEquivalentVal;
      if (f.planType === "regular") {
        regularVal += f.currentVal;
        totalLostTillNow += f.lostTillNow;
        totalRawFeePaid += f.rawFeePaid;
        totalLostCompounding += f.lostCompoundingOnFees;
        totalAnnualLoss += f.annualLossToday;
        totalFutureLoss54 += f.futureLossAt54;
        totalRegularProfit += f.profit;
      }
    });

    return {
      invested,
      current,
      directEquivalent,
      regularVal,
      totalLostTillNow,
      totalRawFeePaid,
      totalLostCompounding,
      totalAnnualLoss,
      totalFutureLoss54,
      totalRegularProfit,
    };
  }, [computedFunds]);

  // Section 112A Staggered Zero-Tax Switch Roadmap
  const roadmap = useMemo(() => {
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
  }, [totals]);

  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.round(val));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* TOP SUMMARY CARDS: REAL HISTORICAL LOSS SINCE 2014 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Current vs What It Should Be */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl">
          <span className="text-[11px] font-mono uppercase text-zinc-400 block font-bold">
            Actual Value vs. Direct Value
          </span>
          <p className="text-2xl font-black text-white font-mono mt-1">{formatINR(totals.current)}</p>
          <p className="text-[11px] text-emerald-400 font-mono mt-1">
            Should be: <strong>{formatINR(totals.directEquivalent)}</strong> in Direct
          </p>
        </div>

        {/* Card 2: Total Historical Loss (Raw Fees + Lost Compounding) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/50 to-zinc-950 border border-rose-500/40 shadow-xl">
          <span className="text-[11px] font-mono uppercase text-rose-400 block font-bold">
            1. Total Wealth Lost Till Today
          </span>
          <p className="text-3xl font-black text-rose-400 font-mono mt-1">{formatINR(totals.totalLostTillNow)}</p>
          <p className="text-[10px] text-zinc-300 font-mono mt-1">
            {formatINR(totals.totalRawFeePaid)} Raw Brokerage + {formatINR(totals.totalLostCompounding)} Lost Growth
          </p>
        </div>

        {/* Card 3: Annual Recurring Bleed */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-amber-500/30 shadow-xl">
          <span className="text-[11px] font-mono uppercase text-amber-400 block font-bold">
            2. Current Annual Brokerage Bleed
          </span>
          <p className="text-3xl font-black text-amber-400 font-mono mt-1">{formatINR(totals.totalAnnualLoss)} / yr</p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Silent trail commission deducted from your corpus every year right now.
          </p>
        </div>

        {/* Card 4: Future Wealth Saved by Age 54 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/50 to-zinc-950 border border-cyan-500/40 shadow-xl">
          <span className="text-[11px] font-mono uppercase text-cyan-400 block font-bold">
            3. Wealth Saved by Age 54 If Switched
          </span>
          <p className="text-3xl font-black text-cyan-400 font-mono mt-1">+{formatINR(totals.totalFutureLoss54)}</p>
          <p className="text-[11px] text-zinc-300 mt-1">
            Compounded corpus lost over next 17 yrs if you remain in Regular plans.
          </p>
        </div>
      </div>

      {/* MASTER BUCKET TABLE */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                Historical Commission & Compounding Audit (Pre-2019 SEBI Regimes Included)
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              Mutual Fund Bucket Breakdown
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefault}
              className="px-3 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white border border-zinc-800 bg-zinc-900"
            >
              Reset to ₹41.3L (2014)
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all"
            >
              + Add Mutual Fund
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-zinc-900/90 text-zinc-400 text-[10px] uppercase border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4">Fund Name</th>
                <th className="py-3.5 px-3">Mode & Plan</th>
                <th className="py-3.5 px-3 text-center">Since</th>
                <th className="py-3.5 px-3 text-right">Invested</th>
                <th className="py-3.5 px-3 text-right">Current Value</th>
                <th className="py-3.5 px-3 text-right text-emerald-400">Should Be (Direct)</th>
                <th className="py-3.5 px-3 text-right text-rose-400">Raw Fee Paid</th>
                <th className="py-3.5 px-3 text-right text-rose-400">Total Lost Till Now</th>
                <th className="py-3.5 px-3 text-right text-cyan-400">Saved @ 54</th>
                <th className="py-3.5 px-3 text-center">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-950">
              {computedFunds.map((fund) => (
                <tr key={fund.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-white max-w-[200px] truncate" title={fund.name}>
                    {fund.name}
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
                  <td className="py-3 px-3 text-center text-zinc-300">{fund.startYear} ({fund.yearsInvested}y)</td>
                  <td className="py-3 px-3 text-right text-zinc-400">{formatINR(fund.totalInvested)}</td>
                  <td className="py-3 px-3 text-right font-bold text-white">{formatINR(fund.currentVal)}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400">{formatINR(fund.directEquivalentVal)}</td>
                  <td className="py-3 px-3 text-right text-rose-300">{formatINR(fund.rawFeePaid)}</td>
                  <td className="py-3 px-3 text-right text-rose-400 font-black">{formatINR(fund.lostTillNow)}</td>
                  <td className="py-3 px-3 text-right text-cyan-400 font-bold">+{formatINR(fund.futureLossAt54)}</td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEditModal(fund)} className="text-zinc-400 hover:text-white" title="Edit">
                        ✏️
                      </button>
                      <button onClick={() => handleDeleteFund(fund.id)} className="text-zinc-500 hover:text-rose-400" title="Delete">
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-900 text-white font-bold border-t border-zinc-800">
              <tr>
                <td className="py-3 px-4" colSpan={3}>TOTALS ({computedFunds.length} Holdings)</td>
                <td className="py-3 px-3 text-right text-zinc-300">{formatINR(totals.invested)}</td>
                <td className="py-3 px-3 text-right text-white">{formatINR(totals.current)}</td>
                <td className="py-3 px-3 text-right text-emerald-400">{formatINR(totals.directEquivalent)}</td>
                <td className="py-3 px-3 text-right text-rose-300">{formatINR(totals.totalRawFeePaid)}</td>
                <td className="py-3 px-3 text-right text-rose-400">{formatINR(totals.totalLostTillNow)}</td>
                <td className="py-3 px-3 text-right text-cyan-400">+{formatINR(totals.totalFutureLoss54)}</td>
                <td className="py-3 px-3 text-center">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SECTION 112A TAX-SHELTERED SWITCH ROADMAP */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900/95 to-zinc-950 border border-emerald-500/40 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-2">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              ⚡ Section 112A Tax-Sheltered Conversion Schedule
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">
              Zero-Tax & Break-Even Roadmap to Stop the {formatINR(totals.totalAnnualLoss)}/yr Bleed
            </h3>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
            Accrued Gain: {formatINR(totals.totalRegularProfit)}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-zinc-950 text-zinc-400 text-[10px] uppercase border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Execution Window</th>
                <th className="py-3 px-4">Directive</th>
                <th className="py-3 px-4 text-right">Amount to Switch</th>
                <th className="py-3 px-4 text-right">Gain Realized</th>
                <th className="py-3 px-4 text-center text-emerald-400">Tax Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950/70">
              <tr>
                <td className="py-3 px-4 font-bold text-white">Step 1: Today</td>
                <td className="py-3 px-4 text-zinc-300">Cancel Regular SIP & start Direct Growth SIP</td>
                <td className="py-3 px-4 text-right text-zinc-400">Fresh Monthly SIPs</td>
                <td className="py-3 px-4 text-right text-zinc-400">₹0</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">₹0 Tax</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">Step 2: Now – 31 Mar 2027</td>
                <td className="py-3 px-4 text-zinc-300">Redeem &amp; Reinvest Tranche 1 (Sec 112A Free Quota)</td>
                <td className="py-3 px-4 text-right font-bold text-white">{formatINR(roadmap.t1Redeem)}</td>
                <td className="py-3 px-4 text-right text-zinc-300">{formatINR(roadmap.t1Gain)}</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">₹0 (100% Exempt)</td>
              </tr>
              {roadmap.t2Gain > 0 && (
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Step 3: 1 Apr 2027</td>
                  <td className="py-3 px-4 text-zinc-300">Redeem &amp; Reinvest Tranche 2 (New FY Quota Reset)</td>
                  <td className="py-3 px-4 text-right font-bold text-white">{formatINR(roadmap.t2Redeem)}</td>
                  <td className="py-3 px-4 text-right text-zinc-300">{formatINR(roadmap.t2Gain)}</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">₹0 (100% Exempt)</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingId ? "Edit Mutual Fund" : "Add Mutual Fund to Bucket"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveFund} className="space-y-4">
              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Fund Name</label>
                <input
                  type="text"
                  required
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-sans text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Calculation Mode</label>
                  <select
                    value={fInvType}
                    onChange={(e) => setFInvType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="corpus_sip">Known Current Corpus + SIP</option>
                    <option value="sip">Pure Monthly SIP Simulator</option>
                    <option value="lumpsum">One-Time Lump Sum</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Started Year</label>
                  <select
                    value={fStartYear}
                    onChange={(e) => setFStartYear(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    {[2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map(
                      (yr) => (
                        <option key={yr} value={yr}>{yr} ({currentYear - yr} yrs)</option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {fInvType === "corpus_sip" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Current Value Today (₹)</label>
                    <input
                      type="number"
                      value={fCurrentCorpus}
                      onChange={(e) => setFCurrentCorpus(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Total Invested Principal (₹)</label>
                    <input
                      type="number"
                      value={fInvestedCorpus}
                      onChange={(e) => setFInvestedCorpus(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              )}

              {fInvType === "sip" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Starting Monthly SIP (₹)</label>
                    <input
                      type="number"
                      value={fMonthlySIP}
                      onChange={(e) => setFMonthlySIP(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Annual SIP Step-Up (%)</label>
                    <input
                      type="number"
                      value={fStepUpPct}
                      onChange={(e) => setFStepUpPct(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              )}

              {fInvType === "lumpsum" && (
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Lump Sum Invested (₹)</label>
                  <input
                    type="number"
                    value={fLumpSum}
                    onChange={(e) => setFLumpSum(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[10px]">CAGR %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={fCAGR}
                    onChange={(e) => setFCAGR(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-white text-center"
                  />
                </div>
                <div>
                  <label className="text-rose-400 block mb-1 uppercase text-[10px]">Regular TER %</label>
                  <input
                    type="number"
                    step="0.05"
                    value={fRegTER}
                    onChange={(e) => setFRegTER(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-rose-400 text-center"
                  />
                </div>
                <div>
                  <label className="text-emerald-400 block mb-1 uppercase text-[10px]">Direct TER %</label>
                  <input
                    type="number"
                    step="0.05"
                    value={fDirTER}
                    onChange={(e) => setFDirTER(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-emerald-400 text-center"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold">
                  Save Fund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
