"use client";
import { useState } from "react";

export default function RetirementCard({ scenarios }: { scenarios: any }) {
  const [scenarioId, setScenarioId] = useState<"hybrid" | "stepUp" | "aggressive" | "statusQuo">("hybrid");

  if (!scenarios || !scenarios[scenarioId]) {
    return (
      <div className="flex h-full flex-col rounded-3xl border border-zinc-800/60 bg-zinc-950/60 p-6">
        <p className="text-sm text-zinc-400">Loading retirement scenarios...</p>
      </div>
    );
  }

  const active = scenarios[scenarioId];

  const formatCompact = (value: number) => {
    if (value === 0) return "₹0";
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    return `₹${value.toLocaleString("en-IN")}`;
  };

  return (
    <div className="flex h-full flex-col rounded-3xl border border-zinc-800/60 bg-zinc-950/60 p-6 backdrop-blur-md shadow-2xl">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
            Retirement Intelligence OS
          </p>
          <h3 className="mt-1 text-xl font-bold text-white">Retirement Scenarios</h3>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Success Prob.</div>
          <div className={`text-2xl font-black font-mono ${
              active.successProbability >= 75 ? "text-emerald-400" : active.successProbability >= 50 ? "text-amber-400" : "text-rose-400"
            }`}
          >
            {active.successProbability}%
          </div>
        </div>
      </div>

      <div className="mb-5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div className={`h-full transition-all duration-500 ${
              active.successProbability >= 75 ? "bg-emerald-500" : active.successProbability >= 50 ? "bg-amber-500" : "bg-rose-500"
            }`}
            style={{ width: `${Math.min(100, active.successProbability)}%` }}
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/90 p-1.5 sm:grid-cols-4">
        {["hybrid", "stepUp", "aggressive", "statusQuo"].map((key) => {
          const isSelected = scenarioId === key;
          const labels: any = { hybrid: "⭐ Hybrid", stepUp: "📈 Step-Up", aggressive: "🚀 Aggressive", statusQuo: "⚖️ Status Quo" };
          const colors: any = { hybrid: "emerald", stepUp: "blue", aggressive: "purple", statusQuo: "amber" };
          const color = colors[key];

          return (
            <button
              key={key}
              onClick={() => setScenarioId(key as any)}
              className={`rounded-xl px-2 py-2 text-xs font-medium transition ${
                isSelected ? `bg-${color}-500/20 text-${color}-400 border border-${color}-500/40 font-semibold shadow-sm` : "text-zinc-400 hover:text-white"
              }`}
            >
              {labels[key]}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Current Corpus</p>
          <p className="mt-1 text-lg font-bold text-white font-mono">{formatCompact(active.currentCorpus)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Projected Corpus</p>
          <p className="mt-1 text-lg font-bold text-emerald-400 font-mono">{formatCompact(active.projectedCorpus)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Target Corpus</p>
          <p className="mt-1 text-lg font-bold text-white font-mono">{formatCompact(active.requiredCorpus)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Time Horizon</p>
          <p className="mt-1 text-lg font-bold text-white font-mono">{active.yearsLeft} Years</p>
        </div>
      </div>

      <div className="mt-auto border-t border-zinc-800/60 pt-4 mt-4">
        <h4 className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-indigo-400">AI Directives ({scenarioId.toUpperCase()})</h4>
        <p className="text-xs leading-relaxed text-zinc-300">{active.directiveText}</p>
      </div>
    </div>
  );
}