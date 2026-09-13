"use client";

import React, { useMemo } from "react";
import { getAllMonthlyReviews } from "@/lib/storage";

interface CapitalDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileSalary?: number;
  profileSIP?: number;
  profilePrepay?: number;
  profileEmergency?: number;
}

function formatINR(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

export default function CapitalDeploymentModal({
  isOpen,
  onClose,
  profileSalary = 150000,
  profileSIP = 20000,
  profilePrepay = 50000,
  profileEmergency = 50000,
}: CapitalDeploymentModalProps) {
  const historyData = useMemo(() => {
    if (!isOpen) return [];

    const reviews = typeof window !== "undefined" ? getAllMonthlyReviews() : [];

    if (reviews && reviews.length > 0) {
      // Sort chronologically by monthKey (e.g. "2026-08", "2026-09")
      const sorted = [...reviews].sort((a, b) => (a.monthKey || "").localeCompare(b.monthKey || ""));

      return sorted.slice(-6).map((rev) => {
        const stmt = rev.data;
        const income = Number(stmt?.income?.salaryInHand) || profileSalary || 150000;
        
        // Exact schema keys from monthly-review.ts
        const mf = Number(stmt?.cashAllocation?.investments) || 0;
        const prepay = Number(stmt?.cashAllocation?.homeLoanPrepayment) || 0;
        const emergency = Number(stmt?.cashAllocation?.emergencyFund) || 0;
        const totalDeployed = mf + prepay + emergency;

        const mfPct = income > 0 ? (mf / income) * 100 : 0;
        const prepayPct = income > 0 ? (prepay / income) * 100 : 0;
        const emergencyPct = income > 0 ? (emergency / income) * 100 : 0;
        const totalPct = income > 0 ? (totalDeployed / income) * 100 : 0;

        return {
          label: rev.monthLabel || rev.monthKey,
          fullLabel: rev.monthLabel || rev.monthKey,
          income,
          mf,
          prepay,
          emergency,
          totalDeployed,
          mfPct,
          prepayPct,
          emergencyPct,
          totalPct,
        };
      });
    }

    // Default fallback to current month profile deployment
    const totalDeployed = profileSIP + profilePrepay + profileEmergency;
    const mfPct = profileSalary > 0 ? (profileSIP / profileSalary) * 100 : 0;
    const prepayPct = profileSalary > 0 ? (profilePrepay / profileSalary) * 100 : 0;
    const emergencyPct = profileSalary > 0 ? (profileEmergency / profileSalary) * 100 : 0;
    const totalPct = profileSalary > 0 ? (totalDeployed / profileSalary) * 100 : 0;

    return [
      {
        label: "Current Target",
        fullLabel: "Current Month Target",
        income: profileSalary,
        mf: profileSIP,
        prepay: profilePrepay,
        emergency: profileEmergency,
        totalDeployed,
        mfPct,
        prepayPct,
        emergencyPct,
        totalPct,
      },
    ];
  }, [isOpen, profileSalary, profileSIP, profilePrepay, profileEmergency]);

  if (!isOpen) return null;

  const latest = historyData[historyData.length - 1];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-semibold">
                Capital Deployment Intelligence
              </span>
            </div>
            <h3 className="text-xl font-black text-white mt-1">Monthly Capital Deployment Velocity</h3>
            <p className="text-xs text-zinc-400">
              Breakdown of total monthly inflow allocated towards investments and debt elimination.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          
          {/* Top KPI Callout */}
          {latest && (
            <div className="p-5 rounded-2xl bg-zinc-950 border border-blue-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono uppercase text-zinc-400">Current Velocity Verdict</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-white font-mono">{latest.totalPct.toFixed(1)}%</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">of net salary deployed</span>
                  </div>
                </div>
                <div className="text-right sm:border-l sm:border-zinc-800 sm:pl-6">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Total Monthly Capital Outflow</span>
                  <p className="text-xl font-bold font-mono text-blue-400">{formatINR(latest.totalDeployed)}</p>
                  <span className="text-[10px] text-zinc-500 font-mono">Inflow: {formatINR(latest.income)}</span>
                </div>
              </div>

              {/* Natural Text CFO Narrative */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 text-xs text-zinc-300 leading-relaxed font-sans">
                In <strong className="text-white">{latest.fullLabel}</strong>, you deployed{" "}
                <strong className="text-emerald-400">{latest.mfPct.toFixed(1)}%</strong> in Mutual Funds ({formatINR(latest.mf)}),{" "}
                <strong className="text-rose-400">{latest.prepayPct.toFixed(1)}%</strong> in Home Loan Prepayment ({formatINR(latest.prepay)}), and{" "}
                <strong className="text-amber-400">{latest.emergencyPct.toFixed(1)}%</strong> in Emergency Buffer ({formatINR(latest.emergency)}), achieving a comprehensive capital deployment rate of{" "}
                <strong className="text-cyan-400 font-mono font-bold">{latest.totalPct.toFixed(1)}%</strong>.
              </div>
            </div>
          )}

          {/* Stacked Percentage Visualizer Graph */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Deployment % Velocity Comparison
              </h4>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Mutual Funds
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500"></span> Home Loan Prepay
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Emergency Buffer
                </span>
              </div>
            </div>

            <div className="space-y-4 bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
              {historyData.map((row, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-bold text-white">{row.label}</span>
                    <span className="text-blue-400 font-bold">{row.totalPct.toFixed(1)}% Deployed</span>
                  </div>

                  {/* Horizontal Stacked Bar */}
                  <div className="w-full h-5 bg-zinc-800/80 rounded-lg overflow-hidden flex shadow-inner">
                    {row.mfPct > 0 && (
                      <div
                        style={{ width: `${row.mfPct}%` }}
                        className="bg-emerald-500 hover:bg-emerald-400 transition-all flex items-center justify-center text-[9px] font-mono text-zinc-950 font-bold"
                        title={`MF SIP: ${row.mfPct.toFixed(1)}% (${formatINR(row.mf)})`}
                      >
                        {row.mfPct >= 10 ? `${row.mfPct.toFixed(0)}%` : ""}
                      </div>
                    )}
                    {row.prepayPct > 0 && (
                      <div
                        style={{ width: `${row.prepayPct}%` }}
                        className="bg-rose-500 hover:bg-rose-400 transition-all flex items-center justify-center text-[9px] font-mono text-white font-bold"
                        title={`Prepayment: ${row.prepayPct.toFixed(1)}% (${formatINR(row.prepay)})`}
                      >
                        {row.prepayPct >= 10 ? `${row.prepayPct.toFixed(0)}%` : ""}
                      </div>
                    )}
                    {row.emergencyPct > 0 && (
                      <div
                        style={{ width: `${row.emergencyPct}%` }}
                        className="bg-amber-500 hover:bg-amber-400 transition-all flex items-center justify-center text-[9px] font-mono text-zinc-950 font-bold"
                        title={`Emergency: ${row.emergencyPct.toFixed(1)}% (${formatINR(row.emergency)})`}
                      >
                        {row.emergencyPct >= 10 ? `${row.emergencyPct.toFixed(0)}%` : ""}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabular Ledger Breakdown */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs">
            <table className="w-full text-left">
              <thead className="text-zinc-500 border-b border-zinc-800 text-[10px] uppercase">
                <tr>
                  <th className="pb-2">Period</th>
                  <th className="pb-2 text-right">MF SIP</th>
                  <th className="pb-2 text-right">Prepay</th>
                  <th className="pb-2 text-right">Emergency</th>
                  <th className="pb-2 text-right">Total Outflow</th>
                  <th className="pb-2 text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {historyData.map((row, i) => (
                  <tr key={i} className="hover:bg-zinc-800/30">
                    <td className="py-2 text-zinc-300 font-bold">{row.label}</td>
                    <td className="py-2 text-right text-emerald-400">{formatINR(row.mf)}</td>
                    <td className="py-2 text-right text-rose-400">{formatINR(row.prepay)}</td>
                    <td className="py-2 text-right text-amber-400">{formatINR(row.emergency)}</td>
                    <td className="py-2 text-right text-white font-bold">{formatINR(row.totalDeployed)}</td>
                    <td className="py-2 text-right font-bold text-cyan-400">{row.totalPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-500">Benchmark Target: &gt;50% Capital Deployment</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
