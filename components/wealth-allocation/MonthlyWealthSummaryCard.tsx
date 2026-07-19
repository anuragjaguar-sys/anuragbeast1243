import type { MonthlyWealthSummary } from "@/lib/wealth-allocation-engine";
import { formatINR } from "@/lib/financial-engine";

interface MonthlyWealthSummaryCardProps {
  summary: MonthlyWealthSummary;
}

export default function MonthlyWealthSummaryCard({ summary }: MonthlyWealthSummaryCardProps) {
  const items = [
    { label: "Salary Received", amount: summary.salaryReceived, color: "text-white" },
    { label: "Wealth Created", amount: summary.wealthCreated, color: "text-emerald-400" },
    { label: "Essential Spent", amount: summary.essentialSpent, color: "text-blue-400" },
    { label: "Lifestyle Spent", amount: summary.lifestyleSpent, color: "text-violet-400" },
    { label: "Safety Allocated", amount: summary.safetyAllocated, color: "text-amber-400" },
    { label: "Unallocated", amount: summary.unallocated, color: "text-zinc-400" },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Monthly Summary</h3>
        <p className="mt-0.5 font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
          Current month allocation
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3">
            <span className="text-sm text-zinc-400">{item.label}</span>
            <span className={`font-mono text-sm ${item.color}`}>{formatINR(item.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
