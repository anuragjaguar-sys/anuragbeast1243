"use client";

import { Goal } from "@/lib/goals";

type GoalSummaryProps = {
  goals: Goal[];
};

export default function GoalSummary({
  goals,
}: GoalSummaryProps) {

  // ---------------------------------------
  // Summary Calculations
  // ---------------------------------------

  const totalGoals = goals.length;

  const completedGoals =
    goals.filter(
      (goal) =>
        goal.status === "Completed"
    ).length;

  const onTrackGoals =
    goals.filter(
      (goal) =>
        goal.status === "On Track"
    ).length;

  const behindGoals =
    goals.filter(
      (goal) =>
        goal.status === "Behind Schedule"
    ).length;

  const averageProgress =
    totalGoals === 0
      ? 0
      : Math.round(
          goals.reduce(
            (total, goal) =>
              total + goal.progress,
            0
          ) / totalGoals
        );

  // ---------------------------------------
  // Summary Cards
  // ---------------------------------------

  const cards = [
    {
      label: "Total Goals",
      value: totalGoals,
      subtitle: "Financial missions",
      color: "text-white",
    },
    {
      label: "Completed",
      value: completedGoals,
      subtitle: "Goals achieved",
      color: "text-emerald-400",
    },
    {
      label: "On Track",
      value: onTrackGoals,
      subtitle: "Progressing well",
      color: "text-blue-400",
    },
    {
      label: "Need Attention",
      value: behindGoals,
      subtitle: "Behind schedule",
      color: "text-amber-400",
    },
    {
      label: "Average Progress",
      value: `${averageProgress}%`,
      subtitle: "Across all goals",
      color: "text-violet-400",
    },
  ];

  return (
    <section className="space-y-4">

      <div>

        <h2 className="text-xl font-bold text-white">
          Goal Overview
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Your financial goals at a glance
        </p>

      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

        {cards.map((card) => (

          <div
            key={card.label}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
          >

            <p className="text-sm text-zinc-400">
              {card.label}
            </p>

            <p
              className={`mt-3 text-3xl font-bold ${card.color}`}
            >
              {card.value}
            </p>

            <p className="mt-2 text-xs text-zinc-600">
              {card.subtitle}
            </p>

          </div>

        ))}

      </div>

    </section>
  );
}