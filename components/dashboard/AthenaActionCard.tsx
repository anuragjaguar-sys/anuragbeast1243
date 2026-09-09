"use client";

export interface AthenaActionCardProps {
  actions: any[];
  topAction: any | null;
}

export default function AthenaActionCard({ actions, topAction }: AthenaActionCardProps) {
  if (!actions) return null;

  function statusBadge(status: string) {
    const base = "inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs font-medium tracking-wide";
    if (status === "High") return <span className={`${base} bg-rose-600/10 text-rose-300 border border-rose-600/20`}>HIGH</span>;
    if (status === "Medium") return <span className={`${base} bg-amber-600/10 text-amber-300 border border-amber-600/20`}>MEDIUM</span>;
    return <span className={`${base} bg-zinc-700/40 text-zinc-200 border border-zinc-700/30`}>LOW</span>;
  }

  function actionStatusBadge(s: string) {
    const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
    if (s === "Pending") return <span className={`${base} bg-amber-600/10 text-amber-300 border border-amber-600/20`}>Pending</span>;
    if (s === "Active") return <span className={`${base} bg-emerald-600/10 text-emerald-300 border border-emerald-600/20`}>Active</span>;
    return <span className={`${base} bg-emerald-700/10 text-emerald-200 border border-emerald-700/20`}>Completed</span>;
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-5 text-left shadow-lg shadow-black/10 transition-all duration-300 hover:border-zinc-700/80 hover:shadow-black/20">
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] tracking-[0.22em] text-zinc-500 uppercase">ATHENA ACTION PLAN</p>
            <p className="mt-1 text-[11px] tracking-[0.18em] text-zinc-400 uppercase">Recommended next steps</p>
          </div>
          <div className="text-sm">
            {topAction ? (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-zinc-200">Current Priority</span>
              </div>
            ) : (
              <div className="text-xs text-zinc-500">No actions</div>
            )}
          </div>
        </div>

        {topAction && (
          <div className="mt-4 rounded-xl border border-zinc-800/70 bg-zinc-900/60 p-3">
            <p className="text-lg font-semibold text-white">{topAction.title}</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="text-xs text-zinc-400">Category</div>
              <div className="text-sm text-zinc-200">{topAction.category}</div>
              <div className="ml-4">{statusBadge(topAction.priority)}</div>
              <div className="ml-auto">{actionStatusBadge(topAction.status)}</div>
            </div>

            <div className="mt-3 text-sm text-zinc-300">
              <p className="font-mono text-[10px] text-zinc-500 uppercase">Impact</p>
              <p className="mt-1 text-zinc-200">{topAction.impact}</p>
            </div>
          </div>
        )}

        <div className="mt-4">
          <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">Actions</p>
          <div className="mt-2 space-y-2">
            {actions.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border border-zinc-800/50 bg-zinc-900/40 p-3">
                <div>
                  <div className="font-medium text-zinc-200">{a.title}</div>
                  <div className="text-xs text-zinc-500">{a.category}</div>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(a.priority)}
                  {actionStatusBadge(a.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}