"use client";

import { useState } from "react";
import Link from "next/link";

import GoalForm from "@/components/goals/GoalForm";
import GoalSummary from "@/components/goals/GoalSummary";
import GoalTable from "@/components/goals/GoalTable";

import {
  Goal,
  loadGoals,
  saveGoals,
} from "@/lib/goals";

export default function GoalsPage() {

  const [goals, setGoals] =
    useState<Goal[]>(
      loadGoals()
    );

  const [showForm, setShowForm] =
    useState(false);

  const [editingGoal, setEditingGoal] =
    useState<Goal | null>(null);

  // ---------------------------------------
  // Save Goal
  // ---------------------------------------

  function handleSave(goal: Goal) {

    let updatedGoals: Goal[];

    if (editingGoal) {

      updatedGoals =
        goals.map((g) =>
          g.id === editingGoal.id
            ? goal
            : g
        );

    } else {

      updatedGoals = [
        ...goals,
        goal,
      ];

    }

    setGoals(updatedGoals);

    saveGoals(updatedGoals);

    setEditingGoal(null);

    setShowForm(false);

  }

  // ---------------------------------------
  // Delete Goal
  // ---------------------------------------

  function handleDelete(id: string) {

    const updatedGoals =
      goals.filter(
        (goal) =>
          goal.id !== id
      );

    setGoals(updatedGoals);

    saveGoals(updatedGoals);

  }

  // ---------------------------------------
  // Edit Goal
  // ---------------------------------------

  function handleEdit(goal: Goal) {

    setEditingGoal(goal);

    setShowForm(true);

  }

  return (

    <main className="mx-auto max-w-7xl space-y-8 p-8">
      {/* Header */}

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-4">

          <Link
            href="/"
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-blue-500 hover:text-white"
          >
            ← Dashboard
          </Link>

          <div>

            <h1 className="text-4xl font-bold text-white">
              Financial Goals
            </h1>

            <p className="mt-2 text-zinc-400">
              Plan, track and achieve your financial milestones.
            </p>

          </div>

        </div>

        <button
          onClick={() => {

            setEditingGoal(null);

            setShowForm(true);

          }}
          className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
        >
          + Add Goal
        </button>

      </div>

      {/* Goal Summary */}

      <GoalSummary
        goals={goals}
      />

      {/* Goal Form */}

      {showForm && (

        <GoalForm
          goal={editingGoal}
          onSave={handleSave}
          onCancel={() => {

            setEditingGoal(null);

            setShowForm(false);

          }}
        />

      )}
            {/* Goal Table */}

      <GoalTable
        title="Long-Term Goals"
        goals={goals.filter((goal) => goal.timeframe === "Long Term")}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <GoalTable
        title="Short-Term Goals"
        goals={goals.filter((goal) => goal.timeframe !== "Long Term")}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

    </main>

  );

}
