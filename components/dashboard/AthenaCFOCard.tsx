"use client";

const statusStyles = {
  EXCELLENT: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
  },
  GOOD: {
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    dot: "bg-blue-400",
  },
  NEEDS_ATTENTION: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
  },
  CRITICAL: {
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    dot: "bg-rose-400",
  },
} as const;

export interface AthenaCFOCardProps {
  insight: {
    status: "EXCELLENT" | "GOOD" | "NEEDS_ATTENTION" | "CRITICAL";
    headline: string;
    primaryIssue: string;
    recommendedAction: string;
    financialImpact: string;
  };
}

export default function AthenaCFOCard({ insight }: AthenaCFOCardProps) {
  if (!insight) return null;

  const tone = statusStyles[insight.status] ?? statusStyles.NEEDS_ATTENTION;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 shadow-lg backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Athena CFO
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            Command Center
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest ${tone.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
          {insight.status}
        </span>
      </div>

      <div className="mt-6 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
        <p className="text-base font-semibold text-indigo-100">
          {insight.headline}
        </p>
      </div>

      <div className="mt-6 flex-1 space-y-5">
        {/* Diagnosis / Issue */}
        <div className="flex gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400">
            <span className="text-[10px]">🔎</span>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Diagnosis
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-300">
              {insight.primaryIssue}
            </p>
          </div>
        </div>

        {/* Action Directive */}
        <div className="flex gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
            <span className="text-[10px]">⚡</span>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Action Directive
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-300">
              {insight.recommendedAction}
            </p>
          </div>
        </div>

        {/* Impact */}
        <div className="flex gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <span className="text-[10px]">📈</span>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Expected Impact
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-300">
              {insight.financialImpact}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}