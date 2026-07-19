import type { WealthAllocationBreakdown } from "@/lib/wealth-allocation-engine";
import { formatINR } from "@/lib/financial-engine";

interface WealthAllocationBreakdownProps {
  breakdown: WealthAllocationBreakdown;
}

export default function WealthAllocationBreakdown({ breakdown }: WealthAllocationBreakdownProps) {
  const items = [
    { name: "Mutual Funds", amount: breakdown.mutualFunds, color: "text-emerald-400" },
    { name: "PPF", amount: breakdown.ppf, color: "text-blue-400" },
    { name: "NPS", amount: breakdown.nps, color: "text-violet-400" },
    { name: "FD", amount: breakdown.fd, color: "text-cyan-400" },
    { name: "Gold", amount: breakdown.gold, color: "text-yellow-400" },
    { name: "Other Investments", amount: breakdown.otherInvestments, color: "text-zinc-400" },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Wealth Creation Breakdown</h3>
        <p className="mt-0.5 font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
          Investment allocation
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3">
            <span className="text-sm text-zinc-400">{item.name}</span>
            <span className={`font-mono text-sm ${item.color}`}>{formatINR(item.amount)}</span>
          </div>
        ))}

        <div className="h-px border-zinc-800" />

        <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <span className="text-sm text-emerald-300">Total Wealth Creation</span>
          <span className="font-mono text-sm font-semibold text-emerald-400">
            {formatINR(breakdown.totalWealthCreation)}
          </span>
        </div>
      </div>
    </div>
  );
}
