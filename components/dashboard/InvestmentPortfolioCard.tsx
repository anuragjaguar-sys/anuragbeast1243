"use client";

// Tightly formatted without spaces to prevent awkward wrapping
function formatCompact(value: number) {
  if (value === 0) return "₹0";
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  return `₹${value.toLocaleString("en-IN")}`;
}

export interface InvestmentPortfolioCardProps {
  summary: {
    totalAssets: number;
    totalInvested: number;
    totalProfit: number;
    overallReturn: number;
    monthlyInvestment: number;
    largestHolding: string;
    allocation: {
      equity: number;
      debt: number;
      alternative: number;
    };
  };
  insights: string[];
}

export default function InvestmentPortfolioCard({ summary, insights }: InvestmentPortfolioCardProps) {
  if (!summary) return null;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Overview
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            Portfolio
          </h2>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-emerald-400">
          Active
        </span>
      </div>

      <div className="flex flex-col space-y-4">
        <Metric label="Current Value" value={formatCompact(summary.totalAssets)} />
        <Metric label="Invested" value={formatCompact(summary.totalInvested)} />
        <Metric label="Profit" value={formatCompact(summary.totalProfit)} valueColor="text-emerald-400" />
        <Metric label="Return" value={`${summary.overallReturn.toFixed(1)}%`} valueColor="text-emerald-400" />
        <Metric label="Monthly SIP" value={formatCompact(summary.monthlyInvestment)} />
        <Metric label="Top Holding" value={summary.largestHolding} />
      </div>

      <div className="mt-6 border-t border-zinc-800/60 pt-4">
        <h3 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          Asset Allocation
        </h3>
        <ul className="space-y-3 text-sm">
          <AllocationRow label="Equity" value={summary.allocation.equity} />
          <AllocationRow label="Debt" value={summary.allocation.debt} />
          <AllocationRow label="Alternative" value={summary.allocation.alternative} />
        </ul>
      </div>

      {insights && insights.length > 0 && (
        <div className="mt-auto border-t border-zinc-800/60 pt-5">
          <h3 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Insights
          </h3>
          <ul className="space-y-3">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start text-sm text-zinc-300">
                <span className="mr-2 text-indigo-400">💡</span>
                <span className="leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, valueColor = "text-white" }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${valueColor}`}>{value}</div>
    </div>
  );
}

function AllocationRow({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-zinc-400">{label}</span>
      <span className="font-medium text-white">{formatCompact(value)}</span>
    </li>
  );
}