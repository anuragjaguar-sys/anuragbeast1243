"use client";

import { useProfile } from "@/lib/profile/profile-context";
import { getCFOInsight } from "@/lib/intelligence/cfo-engine";
import AthenaCFOCard from "@/components/dashboard/AthenaCFOCard";
import CFOExecutivePlaybookCard from "@/components/dashboard/CFOExecutivePlaybookCard";

export default function AiCfoPage() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-zinc-400">Loading AI CFO Intelligence...</p>
      </div>
    );
  }

  const cfoInsight = getCFOInsight(profile);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI CFO Advisory</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-400">
          Deterministic financial intelligence, capital allocation strategy, and recovery guardrails.
        </p>
      </div>

      {/* Primary CFO Insight Card */}
      <AthenaCFOCard insight={cfoInsight} />

      {/* Strategic Playbook Execution */}
      <CFOExecutivePlaybookCard />
    </div>
  );
}
