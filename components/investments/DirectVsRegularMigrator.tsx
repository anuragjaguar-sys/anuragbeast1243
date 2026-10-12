"use client";

import React, { useState, useEffect, useMemo } from "react";

export interface BucketFundItem {
  id: string;
  name: string;
  planType: "regular" | "direct";
  currentValue: number;
  investedAmount: number;
  startYear: number;
  cagr: number;
  regularTER: number;
  directTER: number;
  units?: number;
  sipMonthly?: number;
}

const DEFAULT_BUCKET: BucketFundItem[] = [
  {
    id: "mf-1",
    name: "Parag Parikh Flexi Cap Fund",
    planType: "regular",
    currentValue: 1085000,
    investedAmount: 396000,
    startYear: 2015,
    cagr: 16.2,
    regularTER: 1.70,
    directTER: 0.65,
    sipMonthly: 3000,
  },
];

export default function DirectVsRegularMigrator() {
  const currentYear = new Date().getFullYear();
  const yearsToRetire = 17; // FIRE54 horizon

  const [inputMode, setInputMode] = useState<"sip" | "lump_sum">("sip");
  const [funds, setFunds] = useState<BucketFundItem[]>(DEFAULT_BUCKET);

  // Live SIP Calculator State
  const [sipFundName, setSipFundName] = useState("Parag Parikh Flexi Cap Fund");
  const [sipAmount, setSipAmount] = useState<number>(3000);
  const [sipStartYear, setSipStartYear] = useState<number>(2015);
  const [sipCAGR, setSipCAGR] = useState<number>(15.5);
  const [sipRegTER, setSipRegTER] = useState<number>(1.70);
  const [sipDirTER, setSipDirTER] = useState<number>(0.65);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Search live schemes online via api.mfapi.in
  const handleSearchSchemes = async (text: string) => {
    setSipFundName(text);
    if (text.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/mf-audit?q=${encodeURIComponent(text)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.schemes || []);
        if (data.benchmarks) {
          setSipRegTER(data.benchmarks.regularTER);
          setSipDirTER(data.benchmarks.directTER);
          setSipCAGR(data.benchmarks.avgCAGR);
        }
      }
    } catch (e) {
    } finally {
      setIsSearching(false);
    }
  };

  // Local storage persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fire54_mf_audit_bucket");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFunds(parsed);
        }
      }
    } catch (e) {}
  }, []);

  const saveFunds = (newFunds: BucketFundItem[]) => {
    setFunds(newFunds);
    try {
      localStorage.setItem("fire54_mf_audit_bucket", JSON.stringify(newFunds));
    } catch (e) {}
  };

  // Monthly SIP Simulation Calculations
  const sipMetrics = useMemo(() => {
    const totalMonths = Math.max(1, (currentYear - sipStartYear) * 12);
    const totalInvested = totalMonths * sipAmount;

    // Monthly rates
    const directMonthlyRate = Math.pow(1 + sipCAGR / 100, 1 / 12) - 1;
    const terDiff = Math.max(0, sipRegTER - sipDirTER);
    const regularCAGR = Math.max(1, sipCAGR - terDiff);
    const regularMonthlyRate = Math.pow(1 + regularCAGR / 100, 1 / 12) - 1;

    // Future Value of monthly SIP: P * [((1 + r)^n - 1) / r] * (1 + r)
    const directFV =
      directMonthlyRate > 0
        ? sipAmount * ((Math.pow(1 + directMonthlyRate, totalMonths) - 1) / directMonthlyRate) * (1 + directMonthlyRate)
        : totalInvested;

    const regularFV =
      regularMonthlyRate > 0
        ? sipAmount * ((Math.pow(1 + regularMonthlyRate, totalMonths) - 1) / regularMonthlyRate) * (1 + regularMonthlyRate)
        : totalInvested;

    // Estimated Base NAV in 2015 was ~₹10 to ₹15
    const baseNav2015 = 15;
    const currentRegularNav = baseNav2015 * Math.pow(1 + regularCAGR / 100, currentYear - sipStartYear);
    const currentDirectNav = baseNav2015 * Math.pow(1 + sipCAGR / 100, currentYear - sipStartYear);

    const approxRegularUnits = currentRegularNav > 0 ? regularFV / currentRegularNav : 0;
    const approxDirectUnits = currentDirectNav > 0 ? directFV / currentDirectNav : 0;

    // Lost to commission since startYear
    const commissionLostSoFar = Math.max(0, directFV - regularFV);

    // Future savings if converted to direct today (compounding corpus + continuing SIP to Age 54)
    const directCorpusAt54 =
      regularFV * Math.pow(1 + sipCAGR / 100, yearsToRetire) +
      sipAmount * ((Math.pow(1 + directMonthlyRate, yearsToRetire * 12) - 1) / directMonthlyRate) * (1 + directMonthlyRate);

    const regularCorpusAt54 =
      regularFV * Math.pow(1 + regularCAGR / 100, yearsToRetire) +
      sipAmount * ((Math.pow(1 + regularMonthlyRate, yearsToRetire * 12) - 1) / regularMonthlyRate) * (1 + regularMonthlyRate);

    const futureSavingsAt54 = Math.max(0, directCorpusAt54 - regularCorpusAt54);

    return {
      totalMonths,
      totalInvested,
      regularFV: Math.round(regularFV),
      directFV: Math.round(directFV),
      approxRegularUnits: Math.round(approxRegularUnits),
      approxDirectUnits: Math.round(approxDirectUnits),
      commissionLostSoFar: Math.round(commissionLostSoFar),
      futureSavingsAt54: Math.round(futureSavingsAt54),
      terDiff,
      regularCAGR,
      currentRegularNav: Number(currentRegularNav.toFixed(2)),
      currentDirectNav: Number(currentDirectNav.toFixed(2)),
    };
  }, [sipAmount, sipStartYear, sipCAGR, sipRegTER, sipDirTER, currentYear, yearsToRetire]);

  const addSipFundToBucket = () => {
    const newFund: BucketFundItem = {
      id: `sip-${Date.now()}`,
      name: sipFundName,
      planType: "regular",
      currentValue: sipMetrics.regularFV,
      investedAmount: sipMetrics.totalInvested,
      startYear: sipStartYear,
      cagr: sipCAGR,
      regularTER: sipRegTER,
      directTER: sipDirTER,
      units: sipMetrics.approxRegularUnits,
      sipMonthly: sipAmount,
    };
    saveFunds([...funds, newFund]);
  };

  const handleDeleteFund = (id: string) => {
    saveFunds(funds.filter((f) => f.id !== id));
  };

  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.round(val));

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-semibold">
              Live SIP Historical Auditor & Direct Engine
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Monthly SIP Fee Bleed & Direct Conversion Suite
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Historical monthly NAV calculation, unit tracking, commission leakage, and conversion roadmap.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <button
            onClick={() => setInputMode("sip")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              inputMode === "sip"
                ? "bg-emerald-500 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            ⚡ Monthly SIP Mode (e.g. ₹3k/mo)
          </button>
          <button
            onClick={() => setInputMode("lump_sum")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              inputMode === "lump_sum"
                ? "bg-emerald-500 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            📋 Portfolio Bucket Table ({funds.length})
          </button>
        </div>
      </div>

      {/* SIP MODE INTERACTIVE AUDITOR */}
      {inputMode === "sip" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* SIP Inputs Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800">
            {/* Fund Name Search */}
            <div className="lg:col-span-2 relative">
              <label className="text-[11px] font-mono text-zinc-400 block mb-1 uppercase">
                Mutual Fund Scheme Name
              </label>
              <input
                type="text"
                value={sipFundName}
                onChange={(e) => handleSearchSchemes(e.target.value)}
                placeholder="Type fund name (e.g. Parag Parikh Flexi Cap)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto font-mono text-xs divide-y divide-zinc-800">
                  {searchResults.map((item) => (
                    <button
                      key={item.schemeCode}
                      type="button"
                      onClick={() => {
                        setSipFundName(item.schemeName);
                        setSearchResults([]);
                      }}
                      className="w-full text-left p-2.5 hover:bg-zinc-800 text-zinc-300 hover:text-white truncate block"
                    >
                      {item.schemeName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly SIP Amount */}
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1 uppercase">
                Monthly SIP Amount (₹)
              </label>
              <input
                type="number"
                step="500"
                value={sipAmount}
                onChange={(e) => setSipAmount(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Start Year */}
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1 uppercase">
                SIP Started Year
              </label>
              <select
                value={sipStartYear}
                onChange={(e) => setSipStartYear(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              >
                {[2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map(
                  (yr) => (
                    <option key={yr} value={yr}>
                      {yr} ({currentYear - yr} years ago)
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Annual Return CAGR */}
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1 uppercase">
                Historical CAGR (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={sipCAGR}
                onChange={(e) => setSipCAGR(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-cyan-400 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Regular vs Direct TER */}
            <div className="lg:col-span-2">
              <label className="text-[11px] font-mono text-zinc-400 block mb-1 uppercase">
                Regular TER vs Direct TER (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.05"
                  value={sipRegTER}
                  onChange={(e) => setSipRegTER(Number(e.target.value))}
                  title="Regular Plan Total Expense Ratio"
                  className="w-1/2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-rose-400 font-mono text-center"
                />
                <span className="text-xs text-zinc-500">vs</span>
                <input
                  type="number"
                  step="0.05"
                  value={sipDirTER}
                  onChange={(e) => setSipDirTER(Number(e.target.value))}
                  title="Direct Plan Total Expense Ratio"
                  className="w-1/2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono text-center"
                />
              </div>
            </div>

            {/* Add to bucket button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={addSipFundToBucket}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-md transition-all"
              >
                + Add to Bucket List
              </button>
            </div>
          </div>

          {/* SIMULATION RESULTS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Units & Current Value */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
              <span className="text-[11px] font-mono uppercase text-zinc-400 block font-bold">
                Your Regular Units & Value
              </span>
              <p className="text-2xl font-black text-white font-mono mt-1">
                {formatINR(sipMetrics.regularFV)}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                ~{sipMetrics.approxRegularUnits.toLocaleString("en-IN")} Units (Invested: {formatINR(sipMetrics.totalInvested)})
              </p>
            </div>

            {/* Direct Units & Value */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-emerald-500/30">
              <span className="text-[11px] font-mono uppercase text-emerald-400 block font-bold">
                If You Had Chosen Direct
              </span>
              <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {formatINR(sipMetrics.directFV)}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                ~{sipMetrics.approxDirectUnits.toLocaleString("en-IN")} Units (+{formatINR(sipMetrics.commissionLostSoFar)} more)
              </p>
            </div>

            {/* Lost to Commission */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-rose-500/40 shadow-lg">
              <span className="text-[11px] font-mono uppercase text-rose-400 block font-bold">
                Commission Lost Since {sipStartYear}
              </span>
              <p className="text-2xl font-black text-rose-400 font-mono mt-1">
                {formatINR(sipMetrics.commissionLostSoFar)}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Paid out to distributor from your monthly ₹{sipAmount.toLocaleString("en-IN")} installments.
              </p>
            </div>

            {/* Future Savings by Age 54 */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-cyan-500/40 shadow-inner">
              <span className="text-[11px] font-mono uppercase text-cyan-400 block font-bold">
                Saved by Age 54 If Converted
              </span>
              <p className="text-2xl font-black text-cyan-400 font-mono mt-1">
                +{formatINR(sipMetrics.futureSavingsAt54)}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Extra retirement corpus compounded over 17 years.
              </p>
            </div>
          </div>

          {/* TAX-OPTIMIZED CONVERSION ROADMAP FOR THIS SIP */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900/95 to-zinc-950 border border-emerald-500/40 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-emerald-400">
                ⚡ Step-by-Step Conversion Roadmap (Zero Tax Strategy)
              </h3>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                Section 112A Shield
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <p className="font-bold text-white text-sm">1. Halt Regular SIP</p>
                <p className="text-zinc-400">
                  Cancel the ₹{sipAmount.toLocaleString("en-IN")}/mo Regular SIP on your portal. Immediately start a fresh ₹{sipAmount.toLocaleString("en-IN")}/mo SIP under <strong>Direct - Growth</strong>.
                </p>
                <p className="text-[11px] text-emerald-400 font-bold">Tax Impact: ₹0</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <p className="font-bold text-white text-sm">2. Current FY Switch</p>
                <p className="text-zinc-400">
                  Redeem units representing up to <strong>₹1,25,000 in capital gain</strong> this financial year. This is 100% tax-free under Sec 112A. Reinvest into Direct Growth today.
                </p>
                <p className="text-[11px] text-emerald-400 font-bold">Tax Impact: ₹0</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <p className="font-bold text-white text-sm">3. April 1 Next FY Switch</p>
                <p className="text-zinc-400">
                  On April 1, your ₹1.25L exemption quota resets. Redeem the remaining balance into Direct with zero or negligible tax.
                </p>
                <p className="text-[11px] text-cyan-400 font-bold">Compounding Recovered: +{formatINR(sipMetrics.futureSavingsAt54)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BUCKET LIST TABULAR OVERVIEW */}
      {inputMode === "lump_sum" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white flex items-center gap-2">
              <span>📋</span> Mutual Fund Portfolio Master Table ({funds.length} Funds Tracked)
            </h3>
            <button
              onClick={() => setInputMode("sip")}
              className="text-xs font-mono text-emerald-400 hover:underline"
            >
              + Back to SIP Calculator
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-zinc-900/90 text-zinc-400 text-[10px] uppercase border-b border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4">Fund Scheme</th>
                  <th className="py-3.5 px-3">Plan</th>
                  <th className="py-3.5 px-3 text-right">Current Value</th>
                  <th className="py-3.5 px-3 text-right">Invested</th>
                  <th className="py-3.5 px-3 text-center">Started</th>
                  <th className="py-3.5 px-3 text-right">CAGR</th>
                  <th className="py-3.5 px-3 text-center">TER Drag</th>
                  <th className="py-3.5 px-3 text-right text-rose-400">Annual Loss</th>
                  <th className="py-3.5 px-3 text-right text-cyan-400">Saved @ 54</th>
                  <th className="py-3.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {funds.map((f) => {
                  const terDiff = Math.max(0, f.regularTER - f.directTER);
                  const annualLoss = f.planType === "regular" ? f.currentValue * (terDiff / 100) : 0;
                  const cagrDec = f.cagr / 100;
                  const fvDirect = f.currentValue * Math.pow(1 + cagrDec, yearsToRetire);
                  const fvReg = f.currentValue * Math.pow(1 + Math.max(0, cagrDec - terDiff / 100), yearsToRetire);
                  const savedAt54 = Math.max(0, fvDirect - fvReg);

                  return (
                    <tr key={f.id} className="hover:bg-zinc-900/50">
                      <td className="py-3 px-4 font-bold text-white max-w-[200px] truncate" title={f.name}>
                        {f.name}
                        {f.sipMonthly && (
                          <span className="block text-[10px] text-zinc-500 font-normal">
                            ₹{f.sipMonthly.toLocaleString("en-IN")}/mo SIP
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            f.planType === "direct"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {f.planType === "direct" ? "Direct" : "Regular"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white">{formatINR(f.currentValue)}</td>
                      <td className="py-3 px-3 text-right text-zinc-400">{formatINR(f.investedAmount)}</td>
                      <td className="py-3 px-3 text-center text-zinc-400">{f.startYear}</td>
                      <td className="py-3 px-3 text-right text-cyan-400 font-bold">{f.cagr.toFixed(1)}%</td>
                      <td className="py-3 px-3 text-center text-rose-400 font-bold">
                        {f.planType === "regular" ? `-${terDiff.toFixed(2)}%` : "0.00%"}
                      </td>
                      <td className="py-3 px-3 text-right text-rose-400 font-bold">{formatINR(annualLoss)}</td>
                      <td className="py-3 px-3 text-right text-cyan-400 font-bold">+{formatINR(savedAt54)}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleDeleteFund(f.id)}
                          className="text-zinc-500 hover:text-rose-400 px-1 py-0.5 rounded"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
