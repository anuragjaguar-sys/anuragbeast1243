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
}

const DEFAULT_BUCKET: BucketFundItem[] = [
  {
    id: "mf-1",
    name: "Parag Parikh Flexi Cap Fund",
    planType: "regular",
    currentValue: 2000000,
    investedAmount: 1200000,
    startYear: 2021,
    cagr: 14.5,
    regularTER: 1.70,
    directTER: 0.65,
  },
  {
    id: "mf-2",
    name: "Mirae Asset Large Cap Fund",
    planType: "regular",
    currentValue: 1200000,
    investedAmount: 850000,
    startYear: 2020,
    cagr: 12.8,
    regularTER: 1.65,
    directTER: 0.70,
  },
  {
    id: "mf-3",
    name: "UTI Nifty 50 Index Fund",
    planType: "direct",
    currentValue: 930000,
    investedAmount: 700000,
    startYear: 2022,
    cagr: 13.2,
    regularTER: 0.60,
    directTER: 0.15,
  },
];

export default function DirectVsRegularMigrator() {
  const currentYear = new Date().getFullYear();
  const yearsToRetire = 17; // FIRE54 timeline

  const [funds, setFunds] = useState<BucketFundItem[]>(DEFAULT_BUCKET);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for Adding / Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPlanType, setFormPlanType] = useState<"regular" | "direct">("regular");
  const [formCurrentVal, setFormCurrentVal] = useState<number>(500000);
  const [formInvestedVal, setFormInvestedVal] = useState<number>(350000);
  const [formStartYear, setFormStartYear] = useState<number>(2022);
  const [formCAGR, setFormCAGR] = useState<number>(14.0);
  const [formRegTER, setFormRegTER] = useState<number>(1.75);
  const [formDirTER, setFormDirTER] = useState<number>(0.65);

  // Load from localStorage on mount
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

  // Save to localStorage whenever funds change
  const saveFunds = (newFunds: BucketFundItem[]) => {
    setFunds(newFunds);
    try {
      localStorage.setItem("fire54_mf_audit_bucket", JSON.stringify(newFunds));
    } catch (e) {}
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormName("");
    setFormPlanType("regular");
    setFormCurrentVal(500000);
    setFormInvestedVal(350000);
    setFormStartYear(2022);
    setFormCAGR(14.0);
    setFormRegTER(1.75);
    setFormDirTER(0.65);
    setShowAddModal(true);
  };

  const openEditModal = (fund: BucketFundItem) => {
    setEditingId(fund.id);
    setFormName(fund.name);
    setFormPlanType(fund.planType);
    setFormCurrentVal(fund.currentValue);
    setFormInvestedVal(fund.investedAmount);
    setFormStartYear(fund.startYear);
    setFormCAGR(fund.cagr);
    setFormRegTER(fund.regularTER);
    setFormDirTER(fund.directTER);
    setShowAddModal(true);
  };

  const handleSaveFund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingId) {
      const updated = funds.map((f) =>
        f.id === editingId
          ? {
              ...f,
              name: formName,
              planType: formPlanType,
              currentValue: formCurrentVal,
              investedAmount: formInvestedVal,
              startYear: formStartYear,
              cagr: formCAGR,
              regularTER: formRegTER,
              directTER: formDirTER,
            }
          : f
      );
      saveFunds(updated);
    } else {
      const newFund: BucketFundItem = {
        id: `fund-${Date.now()}`,
        name: formName,
        planType: formPlanType,
        currentValue: formCurrentVal,
        investedAmount: formInvestedVal,
        startYear: formStartYear,
        cagr: formCAGR,
        regularTER: formRegTER,
        directTER: formDirTER,
      };
      saveFunds([...funds, newFund]);
    }
    setShowAddModal(false);
  };

  const handleDeleteFund = (id: string) => {
    const updated = funds.filter((f) => f.id !== id);
    saveFunds(updated);
  };

  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.round(val));

  // Compute Fund-by-Fund Analytics
  const computedList = useMemo(() => {
    return funds.map((f) => {
      const profit = Math.max(0, f.currentValue - f.investedAmount);
      const profitPct = f.investedAmount > 0 ? (profit / f.investedAmount) * 100 : 0;
      const yearsHeld = Math.max(1, currentYear - f.startYear);
      const terDiff = f.planType === "regular" ? Math.max(0, f.regularTER - f.directTER) : 0;
      const annualLoss = f.planType === "regular" ? f.currentValue * (terDiff / 100) : 0;

      // Historical fee lost
      let pastFees = 0;
      if (f.planType === "regular") {
        let running = f.investedAmount;
        const growth = 1 + f.cagr / 100;
        for (let i = 0; i < yearsHeld; i++) {
          pastFees += running * (terDiff / 100);
          running = running * growth;
        }
      }

      // Wealth lost by Age 54 (17 years)
      let wealthLost54 = 0;
      if (f.planType === "regular") {
        const cagrDec = f.cagr / 100;
        const fvDirect = f.currentValue * Math.pow(1 + cagrDec, yearsToRetire);
        const fvRegular = f.currentValue * Math.pow(1 + Math.max(0, cagrDec - terDiff / 100), yearsToRetire);
        wealthLost54 = Math.max(0, fvDirect - fvRegular);
      }

      return {
        ...f,
        profit,
        profitPct,
        yearsHeld,
        terDiff,
        annualLoss,
        pastFees: Math.round(pastFees),
        wealthLost54: Math.round(wealthLost54),
      };
    });
  }, [funds, currentYear, yearsToRetire]);

  // Aggregate Bucket Totals
  const totals = useMemo(() => {
    let totalVal = 0;
    let totalInvested = 0;
    let totalRegularVal = 0;
    let totalDirectVal = 0;
    let totalAnnualLoss = 0;
    let totalPastLoss = 0;
    let totalWealthLost54 = 0;
    let totalRegularProfit = 0;

    computedList.forEach((f) => {
      totalVal += f.currentValue;
      totalInvested += f.investedAmount;
      if (f.planType === "regular") {
        totalRegularVal += f.currentValue;
        totalAnnualLoss += f.annualLoss;
        totalPastLoss += f.pastFees;
        totalWealthLost54 += f.wealthLost54;
        totalRegularProfit += f.profit;
      } else {
        totalDirectVal += f.currentValue;
      }
    });

    const directPct = totalVal > 0 ? (totalDirectVal / totalVal) * 100 : 0;
    const regularPct = totalVal > 0 ? (totalRegularVal / totalVal) * 100 : 0;

    return {
      totalVal,
      totalInvested,
      totalRegularVal,
      totalDirectVal,
      directPct,
      regularPct,
      totalAnnualLoss,
      totalPastLoss,
      totalWealthLost54,
      totalRegularProfit,
    };
  }, [computedList]);

  // Combined Portfolio Staggered Zero-Tax Roadmap (Sec 112A ₹1.25L Exemption)
  const roadmap = useMemo(() => {
    const regularFunds = computedList.filter((f) => f.planType === "regular" && f.profit > 0);
    // Sort by highest fee bleed (TER difference) first to switch the worst bleeders first!
    regularFunds.sort((a, b) => b.terDiff - a.terDiff);

    const annualExemption = 125000;
    const totalProfit = totals.totalRegularProfit;

    const t1Gain = Math.min(totalProfit, annualExemption);
    const t1ValRatio = totalProfit > 0 ? totals.totalRegularVal / totalProfit : 1;
    const t1Redemption = t1Gain * t1ValRatio;

    const remainingProfitT1 = Math.max(0, totalProfit - t1Gain);
    const t2Gain = Math.min(remainingProfitT1, annualExemption);
    const t2Redemption = t2Gain * t1ValRatio;

    const remainingProfitT2 = Math.max(0, remainingProfitT1 - t2Gain);
    const remainingTax = remainingProfitT2 * 0.125; // 12.5% LTCG
    const breakEvenMonths = totals.totalAnnualLoss > 0 ? Math.round((remainingTax / totals.totalAnnualLoss) * 12) : 0;

    return {
      t1Gain,
      t1Redemption,
      t2Gain,
      t2Redemption,
      remainingProfitT2,
      remainingTax,
      breakEvenMonths,
    };
  }, [computedList, totals]);

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-semibold">
              Mutual Fund Bucket Audit & Conversion Suite
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Mutual Fund Portfolio: Direct vs. Indirect Bleed Engine
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Compiled analysis of all your mutual funds, fee leakage, and tax-sheltered Section 112A switch roadmap.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span>+ Add Mutual Fund</span>
        </button>
      </div>

      {/* AGGREGATED PORTFOLIO METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-[11px] font-mono uppercase text-zinc-400 block font-bold">Total MF Bucket Corpus</span>
          <p className="text-2xl font-black text-white font-mono mt-1">{formatINR(totals.totalVal)}</p>
          <p className="text-[10px] text-zinc-500 mt-1">
            {totals.directPct.toFixed(0)}% Direct ({formatINR(totals.totalDirectVal)}) | {totals.regularPct.toFixed(0)}% Regular
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-rose-500/30">
          <span className="text-[11px] font-mono uppercase text-rose-400 block font-bold">Annual Commission Loss</span>
          <p className="text-2xl font-black text-rose-400 font-mono mt-1">{formatINR(totals.totalAnnualLoss)} / yr</p>
          <p className="text-[10px] text-zinc-400 mt-1">
            Deducted silently by distributors from your regular plan NAVs every year.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-amber-500/30">
          <span className="text-[11px] font-mono uppercase text-amber-400 block font-bold">Historical Fees Paid</span>
          <p className="text-2xl font-black text-white font-mono mt-1">{formatINR(totals.totalPastLoss)}</p>
          <p className="text-[10px] text-zinc-400 mt-1">Cumulative commissions already lost across all holdings.</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-rose-500/40 shadow-inner">
          <span className="text-[11px] font-mono uppercase text-rose-400 block font-bold">Total Wealth Lost by Age 54</span>
          <p className="text-2xl font-black text-rose-400 font-mono mt-1">{formatINR(totals.totalWealthLost54)}</p>
          <p className="text-[10px] text-zinc-400 mt-1">Lost compounding wealth over remaining 17 years.</p>
        </div>
      </div>

      {/* MASTER TABULAR DATA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white flex items-center gap-2">
            <span>📋</span> Compiled Mutual Fund Bucket Table ({computedList.length} Funds Tracked)
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">Click any fund row to edit</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-zinc-900/90 text-zinc-400 text-[10px] uppercase border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4">Fund Name</th>
                <th className="py-3.5 px-3">Plan</th>
                <th className="py-3.5 px-3 text-right">Current Value</th>
                <th className="py-3.5 px-3 text-right">Invested</th>
                <th className="py-3.5 px-3 text-right">Gain / Profit</th>
                <th className="py-3.5 px-3 text-center">Start</th>
                <th className="py-3.5 px-3 text-right">CAGR</th>
                <th className="py-3.5 px-3 text-center">TER Drag</th>
                <th className="py-3.5 px-3 text-right text-rose-400">Annual Loss</th>
                <th className="py-3.5 px-3 text-right text-rose-400">Loss @ 54</th>
                <th className="py-3.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {computedList.map((fund) => (
                <tr key={fund.id} className="hover:bg-zinc-900/50 transition-colors group">
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
                  <td className="py-3 px-3 text-right font-bold text-white">{formatINR(fund.currentValue)}</td>
                  <td className="py-3 px-3 text-right text-zinc-400">{formatINR(fund.investedAmount)}</td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-semibold">
                    +{formatINR(fund.profit)} ({fund.profitPct.toFixed(0)}%)
                  </td>
                  <td className="py-3 px-3 text-center text-zinc-400">{fund.startYear}</td>
                  <td className="py-3 px-3 text-right text-cyan-400 font-bold">{fund.cagr.toFixed(1)}%</td>
                  <td className="py-3 px-3 text-center">
                    {fund.planType === "regular" ? (
                      <span className="text-rose-400 font-bold">-{fund.terDiff.toFixed(2)}%</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">0.00%</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-400 font-bold">
                    {fund.annualLoss > 0 ? formatINR(fund.annualLoss) : "₹0"}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-400 font-bold">
                    {fund.wealthLost54 > 0 ? formatINR(fund.wealthLost54) : "₹0"}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openEditModal(fund)}
                        className="text-zinc-500 hover:text-white px-1.5 py-0.5 rounded text-[11px]"
                        title="Edit Fund"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteFund(fund.id)}
                        className="text-zinc-500 hover:text-rose-400 px-1.5 py-0.5 rounded text-[11px]"
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
                <td className="py-3 px-4" colSpan={2}>
                  TOTALS ({computedList.length} Funds)
                </td>
                <td className="py-3 px-3 text-right text-emerald-400">{formatINR(totals.totalVal)}</td>
                <td className="py-3 px-3 text-right text-zinc-300">{formatINR(totals.totalInvested)}</td>
                <td className="py-3 px-3 text-right text-emerald-400">+{formatINR(totals.totalVal - totals.totalInvested)}</td>
                <td className="py-3 px-3 text-center" colSpan={3}>—</td>
                <td className="py-3 px-3 text-right text-rose-400">{formatINR(totals.totalAnnualLoss)}/yr</td>
                <td className="py-3 px-3 text-right text-rose-400">{formatINR(totals.totalWealthLost54)}</td>
                <td className="py-3 px-3 text-center">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* PORTFOLIO-WIDE ZERO-TAX STAGGERED ROADMAP */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900/95 to-zinc-950 border border-emerald-500/40 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-2">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              ⚡ Portfolio-Wide Zero-Tax Switch Roadmap
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">
              Compiled Execution Plan to Eliminate {formatINR(totals.totalAnnualLoss)}/yr Commission
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Section 112A Tax Harvesting
          </span>
        </div>

        <div className="space-y-4 text-xs text-zinc-300">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-emerald-400 text-sm">Phase 1: Immediate Active SIP Pivot (Today)</span>
              <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                ₹0 Tax
              </span>
            </div>
            <p className="text-zinc-400">
              Stop all current SIPs running under <strong>Regular Plans</strong> immediately. Create new SIPs under the exact same fund names under <strong>Direct - Growth</strong>.
            </p>
            <p className="text-[11px] text-emerald-400 font-mono">
              ✓ Instantly halts fee leakage on all new monthly cash flow without triggering any capital gains tax.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-cyan-400 text-sm">
                Phase 2: Tranche 1 Redemption in Current FY ({currentYear}–{(currentYear + 1).toString().slice(2)})
              </span>
              <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                100% Tax Free (₹0 Tax)
              </span>
            </div>
            <p className="text-zinc-400">
              Redeem <strong>{formatINR(roadmap.t1Redemption)}</strong> across your regular funds with the highest expense ratio difference. This realizes exactly <strong>{formatINR(roadmap.t1Gain)}</strong> in capital gains, which is completely exempt under Section 112A.
            </p>
            <p className="text-[11px] text-cyan-400 font-mono">
              Action: Reinvest the entire {formatINR(roadmap.t1Redemption)} directly into the Direct Growth variants.
            </p>
          </div>

          {roadmap.t2Gain > 0 && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-amber-400 text-sm">
                  Phase 3: Tranche 2 Redemption on April 1, {currentYear + 1}
                </span>
                <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  100% Tax Free (₹0 Tax)
                </span>
              </div>
              <p className="text-zinc-400">
                On April 1, {currentYear + 1}, your Section 112A ₹1.25 Lakh exemption resets for the new financial year. Redeem the next <strong>{formatINR(roadmap.t2Redemption)}</strong> (realizing {formatINR(roadmap.t2Gain)} in gains) and reinvest into Direct plans with ₹0 tax.
              </p>
            </div>
          )}

          {roadmap.remainingProfitT2 > 0 && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white text-sm">
                  Phase 4: Remaining Units & Break-Even Evaluation
                </span>
                <span className="font-mono text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">
                  Break-Even: {roadmap.breakEvenMonths} Months
                </span>
              </div>
              <p className="text-zinc-400">
                Remaining regular units carry {formatINR(roadmap.remainingProfitT2)} in capital gains. Paying 12.5% LTCG on this equals a one-time tax of <strong>{formatINR(roadmap.remainingTax)}</strong>.
              </p>
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
                <strong>Mathematical Decision:</strong> Paying {formatINR(roadmap.remainingTax)} in one-time tax eliminates your annual recurring fee loss of {formatINR(totals.totalAnnualLoss)}. 
                {roadmap.breakEvenMonths <= 18 ? (
                  <span className="text-emerald-400 font-bold ml-1">
                    You break even in only {roadmap.breakEvenMonths} months. It is mathematically profitable to switch immediately and reclaim {formatINR(totals.totalWealthLost54)} in compounding!
                  </span>
                ) : (
                  <span className="text-amber-400 ml-1">
                    You can stagger the remainder across FY {currentYear + 2} to eliminate all taxes completely.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT FUND MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingId ? "Edit Mutual Fund Details" : "Add Mutual Fund to Bucket"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
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
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Parag Parikh Flexi Cap Fund"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-sans text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Plan Type</label>
                  <select
                    value={formPlanType}
                    onChange={(e) => setFormPlanType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="regular">Regular (Indirect)</option>
                    <option value="direct">Direct Plan</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Start Year</label>
                  <select
                    value={formStartYear}
                    onChange={(e) => setFormStartYear(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Current Value (₹)</label>
                  <input
                    type="number"
                    required
                    value={formCurrentVal}
                    onChange={(e) => setFormCurrentVal(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Invested Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={formInvestedVal}
                    onChange={(e) => setFormInvestedVal(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[10px]">CAGR %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formCAGR}
                    onChange={(e) => setFormCAGR(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-white text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-rose-400 block mb-1 uppercase text-[10px]">Regular TER %</label>
                  <input
                    type="number"
                    step="0.05"
                    value={formRegTER}
                    onChange={(e) => setFormRegTER(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-rose-400 text-center focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-emerald-400 block mb-1 uppercase text-[10px]">Direct TER %</label>
                  <input
                    type="number"
                    step="0.05"
                    value={formDirTER}
                    onChange={(e) => setFormDirTER(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-emerald-400 text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 font-bold"
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
