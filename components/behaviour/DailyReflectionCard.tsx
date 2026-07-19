"use client";

import { useEffect, useState } from "react";
import {
  addDailyReflection,
  getDailyReflection,
  hasReflectionToday,
  type DailyReflection,
} from "@/lib/behaviour-engine";

export default function DailyReflectionCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasReflectedToday, setHasReflectedToday] = useState(false);
  const [latestReflection, setLatestReflection] = useState<DailyReflection | null>(null);
  const [bestDecision, setBestDecision] = useState("");
  const [temptationResisted, setTemptationResisted] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();

    // Listen for behaviour profile updates
    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('behaviourProfileUpdated', handleUpdate);
    return () => window.removeEventListener('behaviourProfileUpdated', handleUpdate);
  }, []);

  const loadData = () => {
    setHasReflectedToday(hasReflectionToday());
    const today = new Date().toISOString().split('T')[0];
    const reflection = getDailyReflection(today);
    if (reflection) {
      setLatestReflection(reflection);
      setBestDecision(reflection.bestDecision);
      setTemptationResisted(reflection.temptationResisted);
      setGratitude(reflection.gratitude);
    }
  };

  const handleSave = async () => {
    if (!bestDecision.trim() || !temptationResisted.trim() || !gratitude.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      addDailyReflection({
        bestDecision,
        temptationResisted,
        gratitude,
      });
      setHasReflectedToday(true);
      setIsOpen(false);
      loadData();
    } catch (error) {
      console.error("Failed to save reflection:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  if (hasReflectedToday && latestReflection) {
    return (
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
              Daily Reflection
            </p>
            <p className="mt-1 text-sm text-emerald-400">✓ Completed today</p>
          </div>
          <span className="text-xs text-zinc-500">{formatDate(latestReflection.date)}</span>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs text-zinc-400">Best Decision</p>
            <p className="text-sm text-white">{latestReflection.bestDecision}</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-zinc-400">Temptation Resisted</p>
            <p className="text-sm text-white">{latestReflection.temptationResisted}</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-zinc-400">Gratitude</p>
            <p className="text-sm text-white">{latestReflection.gratitude}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6">
      <div className="mb-4">
        <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
          Daily Reflection
        </p>
        <p className="mt-1 text-sm text-zinc-400">Take a moment to reflect on your financial decisions today</p>
      </div>

      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/50 px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:border-zinc-600/60 hover:bg-zinc-800/70"
        >
          Start Today's Reflection
        </button>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block font-mono text-[10px] tracking-wider text-zinc-400 uppercase">
              What was your best financial decision today?
            </label>
            <textarea
              value={bestDecision}
              onChange={(e) => setBestDecision(e.target.value)}
              placeholder="e.g., I resisted the urge to trade and stuck to my SIP..."
              className="w-full rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-all duration-300 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="mb-2 block font-mono text-[10px] tracking-wider text-zinc-400 uppercase">
              What financial temptation did you resist today?
            </label>
            <textarea
              value={temptationResisted}
              onChange={(e) => setTemptationResisted(e.target.value)}
              placeholder="e.g., I didn't check stock prices during market hours..."
              className="w-full rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-all duration-300 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="mb-2 block font-mono text-[10px] tracking-wider text-zinc-400 uppercase">
              What are you grateful for financially today?
            </label>
            <textarea
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="e.g., I'm grateful for my steady income and emergency fund..."
              className="w-full rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-all duration-300 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || !bestDecision.trim() || !temptationResisted.trim() || !gratitude.trim()}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:from-blue-400 hover:to-blue-500 hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Reflection"}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-xl border border-zinc-700/60 bg-zinc-800/50 px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:border-zinc-600/60 hover:bg-zinc-800/70"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
