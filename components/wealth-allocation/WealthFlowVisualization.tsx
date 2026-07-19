import type { WealthAllocation } from "@/lib/wealth-allocation-engine";
import { formatINR } from "@/lib/financial-engine";

interface WealthFlowVisualizationProps {
  allocation: WealthAllocation;
}

export default function WealthFlowVisualization({ allocation }: WealthFlowVisualizationProps) {
  const flows = [
    { label: "Salary", amount: allocation.salaryReceived, color: "text-white" },
    { label: "Wealth Creation", amount: allocation.wealthCreation, color: "text-emerald-400" },
    { label: "Essential Living", amount: allocation.essentialLiving, color: "text-blue-400" },
    { label: "Lifestyle", amount: allocation.lifestyle, color: "text-violet-400" },
    { label: "Safety", amount: allocation.safety, color: "text-amber-400" },
    { label: "Unallocated", amount: allocation.unallocated, color: "text-zinc-400" },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Wealth Flow</h3>
        <p className="mt-0.5 font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
          Monthly salary allocation
        </p>
      </div>

      <div className="space-y-4">
        {flows.map((flow, index) => (
          <div key={flow.label} className="relative">
            <div className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3">
              <span className={`font-semibold ${flow.color}`}>{flow.label}</span>
              <span className="font-mono text-sm text-white">{formatINR(flow.amount)}</span>
            </div>
            {index < flows.length - 1 && (
              <div className="flex justify-center py-2">
                <div className="h-6 w-px bg-gradient-to-b from-zinc-700 to-zinc-800" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
