"use client";

import { Goal } from "@/lib/goals";

interface GoalTableProps {

  goals: Goal[];

  title?: string;

  onEdit: (goal: Goal) => void;

  onDelete: (id: string) => void;

}

function formatCurrency(amount: number) {

  return new Intl.NumberFormat("en-IN", {

    style: "currency",

    currency: "INR",

    maximumFractionDigits: 0,

  }).format(amount);

}

export default function GoalTable({

  goals,

  title = "Financial Goals",

  onEdit,

  onDelete,

}: GoalTableProps) {

  return (

    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg">

      <div className="mb-6 flex items-center justify-between">

        <h2 className="text-xl font-bold text-white">

          {title}

        </h2>

        <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-400">

          {goals.length} Goals

        </span>

      </div>

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead>

            <tr className="border-b border-zinc-800">

              <th className="px-4 py-3 text-left text-sm text-zinc-400">
                Goal
              </th>

              <th className="px-4 py-3 text-left text-sm text-zinc-400">
                Category
              </th>

              <th className="px-4 py-3 text-left text-sm text-zinc-400">
                Priority
              </th>

              <th className="px-4 py-3 text-right text-sm text-zinc-400">
                Progress
              </th>

              <th className="px-4 py-3 text-center text-sm text-zinc-400">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>
            {goals.length === 0 && (

              <tr>

                <td
                  colSpan={5}
                  className="py-10 text-center text-zinc-500"
                >
                  No Goals Added Yet
                </td>

              </tr>

            )}

            {goals.map((goal) => (

              <tr
                key={goal.id}
                className="border-b border-zinc-800 transition hover:bg-zinc-800/40"
              >

                {/* Goal */}

                <td className="px-4 py-4">

                  <div>

                    <p className="font-semibold text-white">
                      {goal.title}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {goal.description}
                    </p>

                  </div>

                </td>

                {/* Category */}

                <td className="px-4 py-4 text-zinc-300">
                  {goal.category}
                </td>

                {/* Priority */}

                <td className="px-4 py-4">

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold

                    ${
                      goal.priority === "Critical"
                        ? "bg-red-500/20 text-red-400"

                        : goal.priority === "High"
                        ? "bg-amber-500/20 text-amber-400"

                        : goal.priority === "Medium"
                        ? "bg-blue-500/20 text-blue-400"

                        : "bg-zinc-700 text-zinc-300"

                    }`}
                  >

                    {goal.priority}

                  </span>

                </td>

                {/* Progress */}

                <td className="px-4 py-4">

                  <div className="flex items-center gap-3">

                    <div className="h-2 w-28 overflow-hidden rounded-full bg-zinc-700">

                      <div
                        className={`h-full rounded-full transition-all

                        ${
                          goal.status === "Completed"
                            ? "bg-emerald-500"

                            : goal.status === "On Track"
                            ? "bg-blue-500"

                            : "bg-amber-500"

                        }`}
                        style={{
                          width: `${goal.progress}%`,
                        }}
                      />

                    </div>

                    <span className="w-12 text-right font-semibold text-white">

                      {goal.progress}%

                    </span>

                  </div>

                  <p className="mt-2 text-xs text-zinc-500">

                    {formatCurrency(goal.currentAmount)}

                    {" / "}

                    {formatCurrency(goal.targetAmount)}

                  </p>

                </td>

                {/* Actions */}

                <td className="px-4 py-4">
                  <div className="flex justify-center gap-2">

                    <button
                      type="button"
                      onClick={() => onEdit(goal)}
                      className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white transition hover:bg-blue-700"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => {

                        if (
                          confirm(
                            `Delete "${goal.title}"?`
                          )
                        ) {

                          onDelete(goal.id);

                        }

                      }}
                      className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white transition hover:bg-red-700"
                    >
                      Delete
                    </button>

                  </div>
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </section>

  );

}
