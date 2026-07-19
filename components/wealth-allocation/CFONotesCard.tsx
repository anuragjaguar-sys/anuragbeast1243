import type { CFONotes } from "@/lib/wealth-allocation-engine";

interface CFONotesCardProps {
  notes: CFONotes;
}

export default function CFONotesCard({ notes }: CFONotesCardProps) {
  const getHealthColor = (health: CFONotes["allocationHealth"]) => {
    switch (health) {
      case "Excellent":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
      case "Good":
        return "bg-blue-500/15 text-blue-400 border-blue-500/25";
      case "Fair":
        return "bg-amber-500/15 text-amber-400 border-amber-500/25";
      case "Poor":
        return "bg-rose-500/15 text-rose-400 border-rose-500/25";
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">CFO Notes</h3>
        <p className="mt-0.5 font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
          AI-powered recommendations
        </p>
      </div>

      <div className="space-y-4">
        {/* Allocation Health */}
        <div className={`rounded-lg border px-4 py-3 ${getHealthColor(notes.allocationHealth)}`}>
          <p className="font-mono text-[10px] font-semibold tracking-wide uppercase">
            Allocation Health
          </p>
          <p className="mt-1 text-sm font-medium">{notes.allocationHealth}</p>
        </div>

        {/* Primary Recommendation */}
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3">
          <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
            Primary Recommendation
          </p>
          <p className="mt-1 text-sm text-zinc-300">{notes.primaryRecommendation}</p>
        </div>

        {/* Secondary Recommendation */}
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3">
          <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
            Secondary Recommendation
          </p>
          <p className="mt-1 text-sm text-zinc-300">{notes.secondaryRecommendation}</p>
        </div>

        {/* Warning */}
        {notes.warning && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3">
            <p className="font-mono text-[10px] tracking-wider text-rose-400 uppercase">
              ⚠ Warning
            </p>
            <p className="mt-1 text-sm text-rose-300">{notes.warning}</p>
          </div>
        )}
      </div>
    </div>
  );
}
