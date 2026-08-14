"use client";

import { getCFOInsight } from "@/lib/intelligence/cfo-engine";

const statusStyles = {
  EXCELLENT: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    ring: "ring-emerald-500/20",
    dot: "bg-emerald-400",
  },
  GOOD: {
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    ring: "ring-blue-500/20",
    dot: "bg-blue-400",
  },
  NEEDS_ATTENTION: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    ring: "ring-amber-500/20",
    dot: "bg-amber-400",
  },
  CRITICAL: {
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    ring: "ring-rose-500/20",
    dot: "bg-rose-400",
  },
} as const;

export default function AthenaCFOCard() {
  const insight = getCFOInsight();
  const tone = statusStyles[insight.status] ?? statusStyles.NEEDS_ATTENTION;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-5 text-left shadow-lg shadow-black/10 transition-all duration-300 hover:border-zinc-700/80 hover:shadow-black/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),transparent_35%)]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.22em] text-zinc-500 uppercase">
              ATHENA CFO
            </p>
            <p className="mt-1 text-[11px] tracking-[0.18em] text-zinc-400 uppercase">
              Financial Command Center
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-[0.18em] uppercase ${tone.badge}`}
          >
            <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
            {insight.status}
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-zinc-800/70 bg-zinc-900/60 p-3">
          <p className="text-lg font-semibold text-white">{insight.headline}</p>
        </div>

        <div className="mt-4 space-y-3 text-sm text-zinc-300">
          <div>
            <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">Primary Issue</p>
            <p className="mt-1 text-zinc-200">{insight.primaryIssue}</p>
          </div>

          <div>
            <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">Recommended Action</p>
            <p className="mt-1 text-zinc-200">{insight.recommendedAction}</p>
          </div>

          <div>
            <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">Financial Impact</p>
            <p className="mt-1 text-zinc-200">{insight.financialImpact}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
