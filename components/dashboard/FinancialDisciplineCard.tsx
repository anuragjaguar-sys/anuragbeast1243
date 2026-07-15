"use client";

import { useEffect, useState } from "react";
import {
  getBehaviourDashboardData,
  getBehaviourProfile,
  type BehaviourDashboardData,
  type Milestone,
} from "@/lib/behaviour-engine";
import { formatINR } from "@/lib/financial-engine";

export default function FinancialDisciplineCard() {
  const [data, setData] = useState<BehaviourDashboardData | null>(null);

  useEffect(() => {
    const loadData = () => {
      const profile = getBehaviourProfile();
      const dashboardData = getBehaviourDashboardData(profile);
      setData(dashboardData);
    };

    loadData();

    // Listen for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "fire54_behaviour_profile") {
        loadData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  if (!data) return null;

  const getMilestoneColor = (tier: Milestone["tier"]) => {
    switch (tier) {
      case "First Week":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
      case "Bronze":
        return "bg-amber-500/15 text-amber-400 border-amber-500/25";
      case "Silver":
        return "bg-zinc-500/15 text-zinc-300 border-zinc-500/25";
      case "Gold":
        return "bg-yellow-500/15 text-yellow-400 border-yellow-500/25";
      case "Platinum":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/25";
      case "Legend":
        return "bg-violet-500/15 text-violet-400 border-violet-500/25";
      default:
        return "bg-zinc-500/15 text-zinc-300 border-zinc-500/25";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-blue-400";
    if (score >= 40) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return "stroke-emerald-500";
    if (score >= 60) return "stroke-blue-500";
    if (score >= 40) return "stroke-amber-500";
    return "stroke-rose-500";
  };

  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDashoffset = circumference - (data.financialDisciplineScore / 100) * circumference;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 transition-all duration-300 hover:border-zinc-700/80 hover:shadow-lg hover:shadow-black/20">
      <div className="absolute inset-0 bg-zinc-900/60" />
      <div className="relative">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
              Behaviour & Discipline
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex h-2 w-2 rounded-full ${data.isFAndOFree ? "bg-emerald-500" : "bg-rose-500"}`} />
              <span className={`text-sm font-semibold ${data.isFAndOFree ? "text-emerald-400" : "text-rose-400"}`}>
                {data.isFAndOFree ? "🟢 F&O FREE" : "🔴 TRADED"}
              </span>
            </div>
          </div>
          {/* Milestone Badge */}
          {data.currentMilestone && (
            <div className={`rounded-lg border px-3 py-1.5 ${getMilestoneColor(data.currentMilestone.tier)}`}>
              <p className="font-mono text-[10px] font-semibold tracking-wide uppercase">
                🏆 {data.currentMilestone.name}
              </p>
            </div>
          )}
        </div>

        {/* Streak Display */}
        <div className="mb-5">
          <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
            Current Streak
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {data.currentStreak} <span className="text-lg text-zinc-400">Days</span>
          </p>
          <div className="mt-2 flex items-center gap-4 text-xs text-zinc-400">
            <span>Longest: {data.longestStreak} days</span>
            <span>Started: {formatDate(data.recoveryStartDate)}</span>
          </div>
        </div>

        {/* Financial Discipline Score with Circular Progress */}
        <div className="mb-5 flex items-center gap-5">
          <div className="relative h-24 w-24">
            <svg className="h-24 w-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-zinc-800"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`transition-all duration-1000 ease-out ${getScoreRingColor(data.financialDisciplineScore)}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getScoreColor(data.financialDisciplineScore)}`}>
                {data.financialDisciplineScore}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
              Discipline Level
            </p>
            <p className={`mt-1 text-lg font-semibold ${getScoreColor(data.financialDisciplineScore)}`}>
              {data.disciplineLevel}
            </p>
          </div>
        </div>

        {/* Capital Preserved */}
        <div className="mb-4 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
          <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
            Capital Preserved
          </p>
          <p className="mt-1 text-xl font-semibold text-emerald-400">
            {formatINR(data.capitalPreserved)}
          </p>
        </div>

        {/* Next Milestone */}
        {data.nextMilestone && (
          <div className="mb-4 rounded-lg border border-zinc-800/60 bg-zinc-900/50 px-4 py-3">
            <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
              Next Milestone
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-zinc-300">{data.nextMilestone.name}</span>
              <span className="text-xs text-zinc-500">
                ({data.nextMilestone.days - data.currentStreak} days remaining)
              </span>
            </div>
          </div>
        )}

        {/* Motivational Quote */}
        <p className="text-center text-xs text-zinc-500 italic">
          Every disciplined day compounds into future wealth.
        </p>
      </div>
    </div>
  );
}
