import type { LiquidityPosition } from "@/lib/wealth-allocation-engine";
import { formatINR } from "@/lib/financial-engine";

interface LiquidityPositionCardProps {
  liquidity: LiquidityPosition;
}

export default function LiquidityPositionCard({ liquidity }: LiquidityPositionCardProps) {
  const getMonthsColor = (months: number) => {
    if (months >= 6) return "text-emerald-400";
    if (months >= 3) return "text-blue-400";
    if (months >= 1) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Liquidity Position</h3>
        <p className="mt-0.5 font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
          Liquid assets & emergency coverage
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3">
          <span className="text-sm text-zinc-400">Emergency Fund</span>
          <span className="font-mono text-sm text-white">{formatINR(liquidity.emergencyFund)}</span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3">
          <span className="text-sm text-zinc-400">Savings Account</span>
          <span className="font-mono text-sm text-white">{formatINR(liquidity.savingsAccount)}</span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3">
          <span className="text-sm text-zinc-400">Cash</span>
          <span className="font-mono text-sm text-white">{formatINR(liquidity.cash)}</span>
        </div>

        <div className="h-px border-zinc-800" />

        <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <span className="text-sm text-emerald-300">Total Liquid Assets</span>
          <span className="font-mono text-sm font-semibold text-emerald-400">
            {formatINR(liquidity.totalLiquidAssets)}
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Months of Expenses Covered</span>
            <span className={`font-mono text-lg font-semibold ${getMonthsColor(liquidity.monthsOfExpensesCovered)}`}>
              {liquidity.monthsOfExpensesCovered.toFixed(1)}
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Based on monthly essential expenses of {formatINR(liquidity.monthlyExpenses)}
          </p>
        </div>
      </div>
    </div>
  );
}
