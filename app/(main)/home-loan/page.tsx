"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useProfile } from "@/lib/profile/profile-context";
import { simulateLoanSchedule, calculateArbitrage } from "@/lib/loans/loan-engine";

function formatINR(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

export default function HomeLoanPage() {
  const { profile } = useProfile();

  // Baseline defaults from profile with fallback
  const defaultPrincipal = profile?.liabilities?.homeLoanOutstanding || 4500000;
  const defaultPrepayment = profile?.income?.monthlyLoanPrepayment ?? 50000;

  const [principal, setPrincipal] = useState<number>(defaultPrincipal > 0 ? defaultPrincipal : 4500000);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(20);
  const [prepayment, setPrepayment] = useState<number>(defaultPrepayment);
  const [equityRate, setEquityRate] = useState<number>(12);

  const tenureMonths = tenureYears * 12;

  // Run Amortization Simulation
  const simulation = useMemo(() => {
    return simulateLoanSchedule(principal, interestRate, tenureMonths, prepayment);
  }, [principal, interestRate, tenureMonths, prepayment]);

  // Baseline scenario (0 prepayment) for comparison
  const baseline = useMemo(() => {
    return simulateLoanSchedule(principal, interestRate, tenureMonths, 0);
  }, [principal, interestRate, tenureMonths]);

  // Prepayment vs Equity Arbitrage
  const arbitrage = useMemo(() => {
    return calculateArbitrage(prepayment, simulation.totalMonths, interestRate, equityRate);
  }, [prepayment, simulation.totalMonths, interestRate, equityRate]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-rose-400 font-semibold">
              Liability Management & Prepayment
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Home Loan Command Center</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Simulate tenure compression, quantify guaranteed interest savings, and evaluate prepayment vs. equity arbitrage.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center self-start sm:self-center gap-1.5 px-4 py-2 text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Interactive Sliders & Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-5 backdrop-blur-md">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
            Loan Parameters
          </h2>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Principal Outstanding</span>
              <span className="font-mono font-bold text-white">{formatINR(principal)}</span>
            </div>
            <input
              type="range"
              min="500000"
              max="15000000"
              step="100000"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="w-full accent-rose-500 bg-zinc-800"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Interest Rate</span>
              <span className="font-mono font-bold text-rose-400">{interestRate}%</span>
            </div>
            <input
              type="range"
              min="7.0"
              max="12.0"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full accent-rose-500 bg-zinc-800"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Scheduled Tenure</span>
              <span className="font-mono font-bold text-white">{tenureYears} Years</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={tenureYears}
              onChange={(e) => setTenureYears(Number(e.target.value))}
              className="w-full accent-rose-500 bg-zinc-800"
            />
          </div>

          <div className="pt-3 border-t border-zinc-800">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Monthly Prepayment</span>
              <span className="font-mono font-bold text-emerald-400">{formatINR(prepayment)}/mo</span>
            </div>
            <input
              type="range"
              min="0"
              max="150000"
              step="5000"
              value={prepayment}
              onChange={(e) => setPrepayment(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-zinc-800"
            />
            <p className="text-[10px] text-zinc-500 mt-1">Athena Active Pace: ₹50,000/mo</p>
          </div>
        </div>

        {/* Executive Impact Metrics */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400">Base Monthly EMI</span>
            <div>
              <p className="text-3xl font-black text-white font-mono">{formatINR(simulation.baseEMI)}</p>
              <p className="text-xs text-zinc-500 mt-1">
                + {formatINR(prepayment)} prepayment = {formatINR(simulation.baseEMI + prepayment)}/mo total
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase text-emerald-400">Guaranteed Interest Saved</span>
            <div>
              <p className="text-3xl font-black text-emerald-400 font-mono">{formatINR(simulation.interestSaved)}</p>
              <p className="text-xs text-zinc-500 mt-1">
                Down from {formatINR(baseline.totalInterestPaid)} to {formatINR(simulation.totalInterestPaid)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase text-cyan-400">Tenure Compression</span>
            <div>
              <p className="text-3xl font-black text-cyan-400 font-mono">
                {(simulation.totalMonths / 12).toFixed(1)} <span className="text-sm font-normal text-zinc-400">Years</span>
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Reduced by {(simulation.tenureReducedMonths / 12).toFixed(1)} years ({simulation.tenureReducedMonths} months)
              </p>
            </div>
          </div>

          {/* Arbitrage Strategy Matrix */}
          <div className="sm:col-span-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-2">
              <div>
                <h3 className="text-base font-bold text-white">Prepayment vs. Equity SIP Arbitrage</h3>
                <p className="text-xs text-zinc-400">
                  Guaranteed 8.5% interest-cost reduction vs. long-term {equityRate}% compounding equity index funds.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Assumed Equity CAGR:</span>
                <span className="text-xs font-mono font-bold text-white">{equityRate}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/80">
                <p className="text-[11px] uppercase font-mono text-zinc-400">Total Prepayment Deployed</p>
                <p className="text-xl font-bold text-white font-mono mt-1">{formatINR(arbitrage.totalPrepaid)}</p>
                <p className="text-xs text-zinc-500 mt-1">Over {simulation.totalMonths} months</p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/80">
                <p className="text-[11px] uppercase font-mono text-emerald-400">Guaranteed Return (Savings)</p>
                <p className="text-xl font-bold text-emerald-400 font-mono mt-1">+{formatINR(simulation.interestSaved)}</p>
                <p className="text-xs text-zinc-500 mt-1">Risk-free interest avoided</p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/80">
                <p className="text-[11px] uppercase font-mono text-cyan-400">Opportunity Cost (Equity SIP)</p>
                <p className="text-xl font-bold text-cyan-400 font-mono mt-1">{formatINR(arbitrage.projectedEquityCorpus)}</p>
                <p className="text-xs text-zinc-500 mt-1">If invested at {equityRate}% CAGR instead</p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-start gap-3">
              <span className="text-base text-emerald-400 font-bold">›</span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                <strong className="text-white">Athena CFO Verdict:</strong> Prepaying ₹{prepayment.toLocaleString("en-IN")}/month saves you <strong className="text-emerald-400">{formatINR(simulation.interestSaved)}</strong> in guaranteed interest and clears your debt in just <strong className="text-white">{(simulation.totalMonths / 12).toFixed(1)} years</strong>. The psychological peace of mind and cash flow freedom unlocked in Phase 3 (reallocating your full ₹1.2L surplus to equity) outweighs the historical market delta.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Amortization Milestone Table (First 12 Months Preview) */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 overflow-hidden">
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-400 font-bold mb-4">
          Amortization Schedule (First 12 Months with Prepayments)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-800/60 font-mono uppercase text-zinc-400">
              <tr>
                <th className="py-2.5 px-4">Month</th>
                <th className="py-2.5 px-4">Opening Balance</th>
                <th className="py-2.5 px-4">Regular EMI</th>
                <th className="py-2.5 px-4">Interest Paid</th>
                <th className="py-2.5 px-4">Prepayment</th>
                <th className="py-2.5 px-4">Closing Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 font-mono">
              {simulation.schedule.slice(0, 12).map((row) => (
                <tr key={row.month} className="hover:bg-zinc-800/30">
                  <td className="py-2.5 px-4 font-bold text-white">Month {row.month}</td>
                  <td className="py-2.5 px-4">{formatINR(row.openingBalance)}</td>
                  <td className="py-2.5 px-4">{formatINR(row.emi)}</td>
                  <td className="py-2.5 px-4 text-rose-400">{formatINR(row.interestPaid)}</td>
                  <td className="py-2.5 px-4 text-emerald-400">+{formatINR(row.prepayment)}</td>
                  <td className="py-2.5 px-4 font-semibold text-white">{formatINR(row.closingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
