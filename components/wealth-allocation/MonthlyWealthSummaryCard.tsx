import type { MonthlyWealthSummary } from "@/lib/wealth-allocation-engine";
import type { MoMComparisonSummary } from "@/lib/wealth-allocation-engine";
import { formatINR } from "@/lib/financial-engine";

interface MonthlyWealthSummaryCardProps {
  summary: MonthlyWealthSummary;
  momComparison?: MoMComparisonSummary;
}

export default function MonthlyWealthSummaryCard({ summary, momComparison }: MonthlyWealthSummaryCardProps) {
  const getDiffForHead = (headName: string) => {
    if (!momComparison || !momComparison.hasPreviousMonth) return null;
    const match = momComparison.comparisons.find((c) => c.head.toLowerCase().includes(headName.toLowerCase()));
    if (!match) return null;
    return match;
  };

  const items = [
    { label: "Salary Received", amount: summary.salaryReceived, color: "text-white", searchKey: "" },
    { label: "Wealth Created", amount: summary.wealthCreated, color: "text-emerald-400", searchKey: "wealth creation" },
    { label: "Essential Spent", amount: summary.essentialSpent, color: "text-blue-400", searchKey: "essential living" },
    { label: "Lifestyle Spent", amount: summary.lifestyleSpent, color: "text-violet-400", searchKey: "lifestyle" },
    { label: "Safety Allocated", amount: summary.safetyAllocated, color: "text-amber-400", searchKey: "safety" },
    { label: "Unallocated", amount: summary.unallocated, color: "text-zinc-400", searchKey: "unallocated" },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm shadow-xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Monthly Summary & MoM Delta</h3>
          <p className="mt-0.5 font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
            Head-by-head comparison vs. last month
          </p>
        </div>
        {momComparison?.cannibalizationDetected && (
          <span className="rounded-full bg-rose-500/10 px-3 py-1 font-mono text-[10px] text-rose-400 border border-rose-500/20">
            ⚠️ Capital Cannibalization
          </span>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const diffData = item.searchKey ? getDiffForHead(item.searchKey) : null;

          return (
            <div key={item.label} className="flex flex-col rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{item.label}</span>
                <span className={`font-mono text-sm font-bold ${item.color}`}>{formatINR(item.amount)}</span>
              </div>
              
              {diffData && (
                <div className="mt-2 flex items-center justify-between border-t border-zinc-800/40 pt-2 text-xs font-mono">
                  <span className="text-zinc-500">vs Last Month:</span>
                  <span className={diffData.difference >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {diffData.difference >= 0 ? `+${formatINR(diffData.difference)}` : formatINR(diffData.difference)} ({diffData.percentageChange}%)
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {momComparison?.cannibalizationMessage && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 leading-relaxed font-mono">
          {momComparison.cannibalizationMessage}
        </div>
      )}
    </div>
  );
}