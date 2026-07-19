import type { WealthAllocation } from "@/lib/wealth-allocation-engine";

interface AllocationStatusBannerProps {
  allocation: WealthAllocation;
}

export default function AllocationStatusBanner({ allocation }: AllocationStatusBannerProps) {
  if (allocation.isComplete) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400">✅</span>
          <span className="text-sm font-medium text-emerald-300">Complete Allocation</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-amber-400">⚠</span>
        <span className="text-sm font-medium text-amber-300">
          Unallocated Cash: {allocation.allocationPercentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
