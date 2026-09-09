"use client";

export interface AthenaCommandCenterProps {
  commandData: {
    plan: { phase: string; nextAction: string } | null;
    score: number;
    savings: number;
    investments: number;
    emergency: number;
    review: { month: string; overallStatus: string; strength: string; risk: string };
    topAction: { title: string; impact: string } | null;
    cfo: { headline: string; recommendedAction: string };
  };
}

export default function AthenaCommandCenter({ commandData }: AthenaCommandCenterProps) {
  if (!commandData) return null;
  const { plan, score, savings, investments, emergency, review, topAction, cfo } = commandData;

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-6 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-zinc-500 uppercase">ATHENA COMMAND CENTER</p>
          <p className="mt-1 text-sm text-zinc-400">Executive financial overview</p>
        </div>
        <div className="text-xs text-zinc-500">Live</div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 uppercase font-mono">Current Financial Phase</p>
          <p className="mt-1 text-lg font-semibold text-white">{plan?.phase ?? "-"}</p>

          <p className="mt-3 text-xs text-zinc-500 uppercase font-mono">Today's Priority</p>
          <p className="mt-1 text-sm text-zinc-200">{plan?.nextAction ?? "-"}</p>
        </div>

        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 uppercase font-mono">Financial Health</p>
          <div className="mt-2 flex items-baseline gap-4">
            <div>
              <div className="text-xs text-zinc-500">Score</div>
              <div className="text-lg font-semibold text-white">{score ? `${score} / 100` : "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Savings</div>
              <div className="text-lg font-semibold text-white">{savings ? `${savings}%` : "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Investment</div>
              <div className="text-lg font-semibold text-white">{investments ? `${investments}%` : "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Emergency</div>
              <div className="text-lg font-semibold text-white">{emergency ? `${emergency}%` : "N/A"}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 uppercase font-mono">Monthly Status</p>
          <p className="mt-1 text-sm text-zinc-200">{review?.month}</p>
          <div className="mt-2">
            <div className="text-xs text-zinc-500">Overall</div>
            <div className="text-sm font-semibold text-white">{review?.overallStatus}</div>
          </div>
          <div className="mt-2 text-sm text-zinc-300">
            <div>
              <div className="text-xs text-zinc-500">Strength</div>
              <div className="text-sm text-zinc-200">{review?.strength}</div>
            </div>
            <div className="mt-2">
              <div className="text-xs text-zinc-500">Risk</div>
              <div className="text-sm text-zinc-200">{review?.risk}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 uppercase font-mono">Top Action</p>
          {topAction ? (
            <div className="mt-2">
              <div className="text-lg font-semibold text-white">{topAction.title}</div>
              <div className="mt-1 text-sm text-zinc-200">{topAction.impact}</div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-zinc-400">No outstanding actions</div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500 uppercase font-mono">CFO Message</p>
          <div className="mt-2">
            <div className="text-lg font-semibold text-white">{cfo?.headline}</div>
            <div className="mt-1 text-sm text-zinc-200">{cfo?.recommendedAction}</div>
          </div>
        </div>
      </div>
    </div>
  );
}