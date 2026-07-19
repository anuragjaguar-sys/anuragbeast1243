import type { LifetimeWealthSummary } from "@/lib/wealth-allocation-engine";
import { formatINR } from "@/lib/financial-engine";

interface LifetimeWealthSummaryCardProps {
  summary: LifetimeWealthSummary;
}

export default function LifetimeWealthSummaryCard({ summary }: LifetimeWealthSummaryCardProps) {
  const items = [
    { label: "Total Salary Received", amount: summary.totalSalaryReceived, color: "text-white" },
    { label: "Total Wealth Created", amount: summary.totalWealthCreated, color: "text-emerald-400" },
    { label: "Total Essential Spent", amount: summary.totalEssentialSpent, color: "text-blue-400" },
    { label: "Total Lifestyle Spent", amount: summary.totalLifestyleSpent, color: "text-violet-400" },
    { label: "Total Safety Allocated", amount: summary.totalSafetyAllocated, color: "text-amber-400" },
    { label: "Total Unallocated", amount: summary.totalUnallocated, color: "text-zinc-400" },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Lifetime Summary</h3>
        <p className="mt-0.5 font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
          {summary.monthsTracked} months tracked
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3">
            <span className="text-sm text-zinc-400">{item.label}</span>
            <span className={`font-mono text-sm ${item.color}`}>{formatINR(item.amount)}</span>
          </div>
        ))}

        <div className="h-px border-zinc-800" />

        <div className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
          <span className="text-sm text-blue-300">Average Wealth Score</span>
          <span className="font-mono text-lg font-semibold text-blue-400">
            {summary.averageWealthScore.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
