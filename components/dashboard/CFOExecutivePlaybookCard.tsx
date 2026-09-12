"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useProfile } from "@/lib/profile/profile-context";
import { getRetirementAssumptionsFromProfile } from "@/lib/profile/profile-retirement-adapter";
import { generateExecutivePlaybook } from "@/lib/intelligence/cfo-playbook";
import { loadPortfolio } from "@/lib/investments/portfolio-storage/storage";

function formatINR(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

export default function CFOExecutivePlaybookCard({ statement }: { statement?: any }) {
  const { profile, loading } = useProfile();

  const playbook = useMemo(() => {
    if (!profile) return null;
    
    // Override outdated cached 100k SIP if present in browser localStorage
    const normalizedProfile = {
      ...profile,
      income: {
        ...profile.income,
        monthlyInvestment: (profile.income?.monthlyInvestment === 100000 || !profile.income?.monthlyInvestment)
          ? 20000 
          : profile.income.monthlyInvestment,
        monthlyLoanPrepayment: profile.income?.monthlyLoanPrepayment ?? 50000,
        monthlyEmergencySavings: profile.income?.monthlyEmergencySavings ?? 50000,
      }
    };

    const assumptions = getRetirementAssumptionsFromProfile(normalizedProfile);
    const portfolio = typeof window !== "undefined" ? loadPortfolio() : [];
    
    return generateExecutivePlaybook(assumptions, normalizedProfile, statement, portfolio);
  }, [profile, statement]);

  if (loading || !playbook) {
    return (
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6">
        <p className="text-sm text-zinc-400">Athena CFO is analyzing your monthly cash flow and liabilities...</p>
      </div>
    );
  }

  const { audit, liability } = playbook;

  const badgeStyles = {
    critical: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    important: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    optimisation: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  };

  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-zinc-900/95 to-zinc-950 p-6 md:p-8 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-6 border-b border-zinc-800/80 gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-semibold">
              Athena Strategic CFO Intelligence
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Monthly Cash Audit & Retirement Directives
          </h2>
          <p className="text-sm text-zinc-400">
            Net Monthly Inflow: <strong className="text-white">{formatINR(audit.salaryInHand)}</strong> | Committed Deployed: <strong className="text-emerald-400">{formatINR(audit.totalCommittedOutflow)}</strong>
          </p>
        </div>

        {/* 4-Pillar Monthly Cash Flow Ledger */}
        <div className="grid grid-cols-4 gap-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 px-4">
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-emerald-400">Active SIP</p>
            <p className="text-base font-bold text-white">{formatINR(audit.monthlySIP)}</p>
            <p className="text-[9px] text-zinc-500">Long-term wealth</p>
          </div>
          <div className="border-l border-zinc-800 pl-3">
            <p className="text-[10px] uppercase font-mono tracking-wider text-rose-400">Loan Prepay</p>
            <Link href="/home-loan" className="text-base font-bold text-white hover:text-rose-400 transition-colors flex items-center gap-1">{formatINR(audit.homeLoanPrepayment)} <span className="text-[10px] text-zinc-500">↗</span></Link>
            <p className="text-[9px] text-zinc-500">Tenure reduction</p>
          </div>
          <div className="border-l border-zinc-800 pl-3">
            <p className="text-[10px] uppercase font-mono tracking-wider text-amber-400">Emergency</p>
            <p className="text-base font-bold text-white">{formatINR(audit.emergencyRemittance)}</p>
            <p className="text-[9px] text-zinc-500">Liquid buffer</p>
          </div>
          <div className="border-l border-zinc-800 pl-3">
            <p className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">Surplus Cash</p>
            <p className="text-base font-bold text-cyan-400">{formatINR(audit.unallocatedSurplus)}</p>
            <p className="text-[9px] text-zinc-500">To deploy</p>
          </div>
        </div>
      </div>

      {/* Strategic Directives Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        {playbook.recommendations.map((rec) => (
          <div
            key={rec.id}
            className="flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 hover:border-zinc-700/80 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] uppercase font-mono tracking-wider px-2.5 py-0.5 rounded-full border ${badgeStyles[rec.urgency]}`}>
                  {rec.urgency}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">{rec.title}</h3>
              <p className="text-xs text-zinc-300 mb-4 leading-relaxed font-medium">{rec.verdict}</p>

              <div className="space-y-2 mb-4">
                {rec.actionItems.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-zinc-400">
                    <span className="text-emerald-400 font-bold mt-0.5">›</span>
                    <span className="leading-snug">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-2 pt-3 border-t border-zinc-800/60">
              <p className="text-[11px] text-zinc-400">
                <span className="font-semibold text-emerald-400">Impact: </span>
                {rec.impact}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 3-Phase Capital Evolution Roadmap */}
      <div className="mt-8 pt-6 border-t border-zinc-800/80">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold">
            Capital Evolution: How Your Cash Flow Morphs into Retirement Wealth
          </h4>
          <span className="text-[11px] text-emerald-400 font-mono">
            Terminal Run-Rate: {formatINR(audit.monthlySIP + audit.homeLoanPrepayment + audit.emergencyRemittance)}/mo
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {playbook.phases.map((p, idx) => (
            <div key={idx} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">{p.phase}</span>
                <span className="text-xs font-mono text-zinc-400">{p.timeline}</span>
              </div>
              <p className="text-lg font-bold text-white mt-1 font-mono">
                {formatINR(p.sipRunRate)} <span className="text-xs text-zinc-500 font-normal">/mo SIP Run-rate</span>
              </p>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{p.directive}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
