"use client";

import { getMonthlyCFOReview } from "@/lib/intelligence/monthly-cfo-engine";

export default function AthenaMonthlyReviewCard() {
  const review = getMonthlyCFOReview();

  const statusColor =
    review.overallStatus === "Excellent"
      ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
      : review.overallStatus === "Good"
      ? "text-amber-300 bg-amber-500/10 border-amber-500/20"
      : "text-rose-300 bg-rose-500/10 border-rose-500/20";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-5 text-left shadow-lg shadow-black/10 transition-all duration-300 hover:border-zinc-700/80 hover:shadow-black/20">
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.22em] text-zinc-500 uppercase">ATHENA MONTHLY REVIEW</p>
            <p className="mt-1 text-[11px] tracking-[0.18em] text-zinc-400 uppercase">{review.month}</p>
          </div>
          <div>
            <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-[0.18em] uppercase ${statusColor}`}>
              {review.overallStatus}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-md border border-zinc-800/50 bg-zinc-900/40 p-3 text-center">
            <div className="text-xs text-zinc-500">Savings Score</div>
            <div className="mt-1 text-lg font-semibold text-white">{review.savingScore}</div>
          </div>
          <div className="rounded-md border border-zinc-800/50 bg-zinc-900/40 p-3 text-center">
            <div className="text-xs text-zinc-500">Investment Score</div>
            <div className="mt-1 text-lg font-semibold text-white">{review.investmentScore}</div>
          </div>
          <div className="rounded-md border border-zinc-800/50 bg-zinc-900/40 p-3 text-center">
            <div className="text-xs text-zinc-500">Behaviour Score</div>
            <div className="mt-1 text-lg font-semibold text-white">{review.behaviourScore}</div>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-sm text-zinc-300">
          <div>
            <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">Strength</p>
            <p className="mt-1 text-zinc-200">{review.strength}</p>
          </div>

          <div>
            <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">Risk</p>
            <p className="mt-1 text-zinc-200">{review.risk}</p>
          </div>

          <div>
            <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">Athena Recommendation</p>
            <p className="mt-1 text-zinc-200">{review.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
