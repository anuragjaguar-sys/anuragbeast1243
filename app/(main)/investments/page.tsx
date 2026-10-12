"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DirectVsRegularMigrator from "@/components/investments/DirectVsRegularMigrator";
import { getPortfolio, type Asset } from "@/lib/investments";

function formatINR(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

export default function InvestmentsPage() {
  const [activeTab, setActiveTab] = useState<"direct_switch" | "overview">("direct_switch");
  const [portfolio, setPortfolio] = useState<any[]>([]);

  useEffect(() => {
    const raw = getPortfolio() || [];
    setPortfolio(raw);
  }, []);

  // Filter out Real Estate from liquid investment holdings
  const investmentAssets = portfolio.filter((item) => {
    if (item.type !== "Asset") return false;
    const name = (item.name || "").toLowerCase();
    const cat = (item.category || "").toLowerCase();
    return !(
      name.includes("flat") ||
      name.includes("dehradun") ||
      name.includes("property") ||
      cat.includes("real estate")
    );
  });

  // Calculate clean equity and debt totals
  let equityTotal = 0;
  let debtTotal = 0;
  let totalInvested = 0;
  let monthlySIP = 0;

  investmentAssets.forEach((item) => {
    const val = Number(item.currentValue ?? item.investedAmount ?? 0) || 0;
    const inv = Number(item.investedAmount) || 0;
    const sip = Number(item.monthlyContribution) || 0;
    const cat = (item.category || "").toLowerCase();
    const name = (item.name || "").toLowerCase();

    totalInvested += inv;
    monthlySIP += sip;

    if (cat.includes("ppf") || cat.includes("epf") || name.includes("dsop") || cat.includes("debt")) {
      debtTotal += val;
    } else {
      equityTotal += val;
    }
  });

  const totalPortfolioVal = equityTotal + debtTotal;
  const totalProfit = Math.max(0, totalPortfolioVal - totalInvested);
  const returnPct = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📈</span>
            <h1 className="text-3xl font-bold tracking-tight text-white">Investment Analytics</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Direct vs Indirect mutual fund audit, fee loss analytics, and portfolio growth tracking.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-zinc-900 border border-zinc-800">
          <button
            onClick={() => setActiveTab("direct_switch")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === "direct_switch"
                ? "bg-emerald-500 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            ⚡ Direct vs Indirect Converter
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === "overview"
                ? "bg-emerald-500 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            📊 Portfolio Analytics
          </button>
        </div>
      </div>

      {/* TAB 1: DIRECT VS INDIRECT OPTIMIZER (FUND SPECIFIC) */}
      {activeTab === "direct_switch" && <DirectVsRegularMigrator portfolio={portfolio} />}

      {/* TAB 2: PORTFOLIO OVERVIEW (CLEANED) */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Summary Card */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 space-y-5">
            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase">Liquid Investments</span>
              <h3 className="text-3xl font-black text-white font-mono mt-1">{formatINR(totalPortfolioVal)}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800 text-xs font-mono">
              <div>
                <p className="text-zinc-500 uppercase text-[10px]">Equity Funds</p>
                <p className="text-base font-bold text-emerald-400">{formatINR(equityTotal)}</p>
              </div>
              <div>
                <p className="text-zinc-500 uppercase text-[10px]">DSOP (Debt)</p>
                <p className="text-base font-bold text-cyan-400">{formatINR(debtTotal)}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 text-xs font-mono">
              <p className="text-zinc-500 uppercase text-[10px]">Monthly SIP Momentum</p>
              <p className="text-lg font-bold text-white">{formatINR(monthlySIP)} / mo</p>
            </div>
          </div>

          {/* Holdings Breakdown */}
          <div className="lg:col-span-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white">
                Liquid Investment Holdings ({investmentAssets.length} Tracked)
              </h3>
              <Link href="/portfolio" className="text-xs font-mono text-emerald-400 hover:underline">
                Edit in Portfolio →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="text-zinc-500 border-b border-zinc-800 text-[10px] uppercase">
                  <tr>
                    <th className="py-2">Asset Name</th>
                    <th className="py-2">Category</th>
                    <th className="py-2 text-right">Current Value</th>
                    <th className="py-2 text-right">Monthly SIP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {investmentAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-zinc-800/30">
                      <td className="py-3 font-bold text-white">{asset.name}</td>
                      <td className="py-3 text-zinc-400">{asset.category}</td>
                      <td className="py-3 text-right font-bold text-emerald-400">
                        {formatINR(Number(asset.currentValue || 0))}
                      </td>
                      <td className="py-3 text-right text-zinc-300">
                        {Number(asset.monthlyContribution) > 0 ? formatINR(Number(asset.monthlyContribution)) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
