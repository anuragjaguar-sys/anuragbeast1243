"use client";

import { getRetirementProjection } from "@/lib/retirement/retirement-engine";

export default function RetirementCard() {
  const projection = getRetirementProjection();

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          🏖 Retirement Intelligence
        </h2>

        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-400">
          {projection.status}
        </span>
      </div>

      <div className="mt-6 space-y-3 text-white">
        <div className="flex justify-between">
          <span className="text-zinc-400">FIRE Readiness</span>
          <span>{projection.fireReadiness}%</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Years Left</span>
          <span>{projection.yearsLeft}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Current Corpus</span>
          <span>
            ₹{(projection.currentCorpus / 10000000).toFixed(2)} Cr
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Required Corpus</span>
          <span>
            ₹{(projection.requiredCorpus / 10000000).toFixed(2)} Cr
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Projected Corpus</span>
          <span className="text-green-400">
            ₹{(projection.projectedCorpus / 10000000).toFixed(2)} Cr
          </span>
        </div>
      </div>
    </div>
  );
}