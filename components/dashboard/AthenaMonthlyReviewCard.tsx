"use client";
import { formatINR } from "@/lib/financial-engine";

export interface AthenaMonthlyReviewCardProps {
  reviewData: {
    currentMonth: string;
    currentInvRate: number;
    currentInvested: number;
    prevMonth: string;
    prevInvRate: number;
    prevInvested: number;
    rateDelta: number;
    isPositiveDelta: boolean;
  };
}

export default function AthenaMonthlyReviewCard({ reviewData }: AthenaMonthlyReviewCardProps) {
  if (!reviewData) return null;

  const { 
    currentMonth, currentInvRate, currentInvested, 
    prevMonth, prevInvRate, prevInvested, 
    rateDelta, isPositiveDelta 
  } = reviewData;

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
              Athena Accountability Engine
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              Monthly Review: MoM Velocity
            </h2>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-medium text-emerald-400 uppercase">
            {currentMonth}
          </span>
        </div>

        {/* MoM Comparison Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Last Month ({prevMonth})</p>
            <p className="mt-1 text-xl font-bold text-zinc-300 font-mono">
              {prevInvRate}% <span className="text-xs font-normal text-zinc-500">({formatINR(prevInvested)})</span>
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">This Month ({currentMonth})</p>
            <p className="mt-1 text-xl font-bold text-white font-mono">
              {currentInvRate}% <span className="text-xs font-normal text-zinc-400">({formatINR(currentInvested)})</span>
            </p>
          </div>
        </div>

        {/* Delta Indicator Banner */}
        <div className={`mt-4 rounded-xl border p-4 flex items-center justify-between ${
          isPositiveDelta 
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" 
            : "border-rose-500/30 bg-rose-500/10 text-rose-400"
        }`}>
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-80">Month-over-Month Velocity Delta</p>
            <p className="text-lg font-bold font-mono">
              {isPositiveDelta ? `+${rateDelta}%` : `${rateDelta}%`} vs Last Month
            </p>
          </div>
          <span className="text-2xl">{isPositiveDelta ? "🚀" : "⚠️"}</span>
        </div>
      </div>

      {/* Athena Action Directive */}
      <div className="mt-6 border-t border-zinc-800/60 pt-4">
        <h4 className="font-mono text-[10px] uppercase tracking-wider text-indigo-400">
          Athena CFO Review Directive
        </h4>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
          {isPositiveDelta ? (
            <>
              <strong className="text-white">Capital acceleration detected!</strong> Your investment rate climbed by {rateDelta}% compared to last month. Maintain this surplus deployment velocity to compress your FIRE timeline further.
            </>
          ) : (
            <>
              <strong className="text-white">Investment rate contraction detected.</strong> Your deployment dropped by {Math.abs(rateDelta)}% MoM. Review discretionary outflows or channel unexpected cash flow back into your SIP engine.
            </>
          )}
        </p>
      </div>
    </div>
  );
}