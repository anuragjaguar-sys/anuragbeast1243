"use client";

import {
  getPortfolio,
  getPortfolioSummary,
  getPortfolioInsights,
} from "@/lib/investments";

export default function InvestmentPortfolioCard() {
  const portfolio = getPortfolio();
  const summary = getPortfolioSummary(portfolio);
  const insights = getPortfolioInsights(portfolio);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">📈 Investment Portfolio</h2>
        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-400">
          Active
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Metric label="Current Value" value={`₹${summary.totalAssets.toLocaleString("en-IN")}`} />
        <Metric label="Invested" value={`₹${summary.totalInvested.toLocaleString("en-IN")}`} />
        <Metric label="Profit" value={`₹${summary.totalProfit.toLocaleString("en-IN")}`} />
        <Metric label="Return" value={`${summary.overallReturn.toFixed(1)}%`} />
        <Metric label="Monthly Investment" value={`₹${summary.monthlyInvestment.toLocaleString("en-IN")}`} />
        <Metric label="Largest Holding" value={summary.largestHolding} />
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-800/40 p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Asset Allocation</h3>
        <ul className="space-y-2 text-sm text-zinc-300">
          <li className="flex justify-between gap-4"><span>Equity</span><span>₹{summary.allocation.equity.toLocaleString("en-IN")}</span></li>
          <li className="flex justify-between gap-4"><span>Debt</span><span>₹{summary.allocation.debt.toLocaleString("en-IN")}</span></li>
          <li className="flex justify-between gap-4"><span>Hybrid</span><span>₹{summary.allocation.hybrid.toLocaleString("en-IN")}</span></li>
          <li className="flex justify-between gap-4"><span>Alternative</span><span>₹{summary.allocation.alternative.toLocaleString("en-IN")}</span></li>
        </ul>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Insights</h3>
        <ul className="space-y-2 text-sm text-zinc-300">
          {insights.map((insight, index) => (
            <li key={index} className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-3">
              💡 {insight}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
    </div>
  );
}
