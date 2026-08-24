"use client";

import { useEffect, useState } from "react";

import {
  Goal,
  GoalCategory,
  GoalPriority,
  GoalTimeframe,
} from "@/lib/goals";

type GoalFormProps = {
  goal?: Goal | null;
  onSave: (goal: Goal) => void;
  onCancel: () => void;
};

export default function GoalForm({
  goal,
  onSave,
  onCancel,
}: GoalFormProps) {

  const isEditing =
    goal !== null &&
    goal !== undefined;

  // ---------------------------------------
  // Basic Information
  // ---------------------------------------

  const [title, setTitle] =
    useState(goal?.title ?? "");

  const [description, setDescription] =
    useState(goal?.description ?? "");

  const [category, setCategory] =
    useState<GoalCategory>(
      goal?.category ?? "Custom"
    );

  const [priority, setPriority] =
    useState<GoalPriority>(
      goal?.priority ?? "Medium"
    );
  const [timeframe, setTimeframe] = useState<GoalTimeframe>(goal?.timeframe ?? "Short Term");
  const [monthlyExpense, setMonthlyExpense] = useState(String(goal?.monthlyExpense ?? 0));
  const [desiredMonthlyIncome, setDesiredMonthlyIncome] = useState(String(goal?.desiredMonthlyIncome ?? 0));

  // ---------------------------------------
  // Financial
  // ---------------------------------------

  const [targetAmount, setTargetAmount] =
    useState(
      goal
        ? String(goal.targetAmount)
        : ""
    );
const [currentAmount, setCurrentAmount] = useState(
  goal
    ? String(goal.currentAmount)
    : "0"
);
  // ---------------------------------------
  // Timeline
  // ---------------------------------------

  const [targetDate, setTargetDate] =
    useState(
      goal?.targetDate ?? ""
    );

  // ---------------------------------------
  // Notes
  // ---------------------------------------

  const [notes, setNotes] =
    useState(
      goal?.notes ?? ""
    );

  // ---------------------------------------
  // Reload when Editing
  // ---------------------------------------

  useEffect(() => {

    if (!goal) return;

    setTitle(goal.title);

    setDescription(goal.description);

setCategory(goal.category ?? "Custom");

setPriority(goal.priority ?? "Medium");

setTimeframe(goal.timeframe ?? "Short Term");
setMonthlyExpense(String(goal.monthlyExpense ?? 0));
setDesiredMonthlyIncome(String(goal.desiredMonthlyIncome ?? 0));

setTargetAmount(
  String(goal.targetAmount)
);

setCurrentAmount(
  String(goal.currentAmount)
);

setTargetDate(goal.targetDate ?? "");

setNotes(goal.notes ?? "");
  }, [goal]);
  // ---------------------------------------
  // Save Goal
  // ---------------------------------------

  function handleSave() {

    if (!title.trim()) {
      alert("Please enter a goal title.");
      return;
    }

    if (!targetAmount) {
      alert("Please enter the target amount.");
      return;
    }

    const target =
      Number(targetAmount);

    const current =
      Number(currentAmount || 0);

    // Progress %

    const progress =
      target === 0
        ? 0
        : Math.min(
            100,
            Math.round(
              (current / target) * 100
            )
          );

    // Months Remaining

    let monthlyRequired = 0;

    if (targetDate) {

      const today =
        new Date();

      const targetDt =
        new Date(targetDate);

      const monthsRemaining =
        Math.max(
          1,
          Math.ceil(
            (targetDt.getTime() -
              today.getTime()) /
              (1000 * 60 * 60 * 24 * 30)
          )
        );

      monthlyRequired =
        Math.max(
          0,
          (target - current) /
            monthsRemaining
        );

    }

    const newGoal: Goal = {

      id:
        goal?.id ??
        crypto.randomUUID(),

      title,

      description,

      category,

      timeframe,

      priority,

      targetAmount: target,

      currentAmount: current,

      targetDate,

      monthlyRequired:
        Math.round(monthlyRequired),

      progress,

      status:
        progress >= 100
          ? "Completed"
          : progress >= 70
          ? "On Track"
          : "Behind Schedule",

      notes,

      createdDate:
        goal?.createdDate ??
        new Date().toISOString(),

      completedDate:
        progress >= 100
          ? new Date().toISOString()
          : undefined,

      monthlyExpense: Number(monthlyExpense || 0),
      desiredMonthlyIncome: Number(desiredMonthlyIncome || 0),

    };

    onSave(newGoal);

  }

  return (

    <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6">

      <h2 className="mb-6 text-2xl font-bold text-white">

        {isEditing
          ? "Edit Goal"
          : "New Financial Goal"}

      </h2>
            {/* Title */}

      <div className="mb-5">

        <label className="mb-2 block text-sm text-zinc-400">
          Goal Title
        </label>

        <input
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          placeholder="Buy Royal Enfield Himalayan"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
        />

      </div>

      {/* Description */}

      <div className="mb-5">

        <label className="mb-2 block text-sm text-zinc-400">
          Description
        </label>

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          rows={3}
          placeholder="Describe this goal..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
        />

      </div>

      <div className="grid grid-cols-2 gap-4">

        {/* Category */}

        <div>

          <label className="mb-2 block text-sm text-zinc-400">
            Category
          </label>

          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value as GoalCategory
              )
            }
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
          >
            <option>Retirement</option>
            <option>Vehicle</option>
            <option>Property</option>
            <option>Travel</option>
            <option>Education</option>
            <option>Emergency Fund</option>
            <option>Debt</option>
            <option>Investment</option>
            <option>Insurance</option>
            <option>Lifestyle</option>
            <option>Custom</option>
          </select>

        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">Timeframe</label>
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value as GoalTimeframe)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white">
            <option>Short Term</option>
            <option>Long Term</option>
          </select>
        </div>

        {/* Priority */}

        <div>

          <label className="mb-2 block text-sm text-zinc-400">
            Priority
          </label>

          <select
            value={priority}
            onChange={(e) =>
              setPriority(
                e.target.value as GoalPriority
              )
            }
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
          >
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>

        </div>

      </div>

      {category === "Insurance" && (
        <div className="mt-5">
          <label className="mb-2 block text-sm text-zinc-400">Required Monthly Premium</label>
          <input type="number" min="0" value={monthlyExpense} onChange={(e) => setMonthlyExpense(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white" />
          <p className="mt-2 text-xs text-zinc-500">Record this premium under Family → Medical in each Monthly Entry.</p>
        </div>
      )}

      {category === "Retirement" && (
        <div className="mt-5">
          <label className="mb-2 block text-sm text-zinc-400">Desired Monthly Retirement Income</label>
          <input type="number" min="0" value={desiredMonthlyIncome} onChange={(e) => setDesiredMonthlyIncome(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white" />
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-4">

        {/* Target Amount */}

        <div>

          <label className="mb-2 block text-sm text-zinc-400">
            Target Amount
          </label>

          <input
            type="number"
            value={targetAmount}
            onChange={(e) =>
              setTargetAmount(
                e.target.value
              )
            }
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
          />

        </div>

{/* Already Saved */}

<div>

  <label className="mb-2 block text-sm text-zinc-400">
    {isEditing
      ? "Already Saved"
      : "Already Saved"}
  </label>

  {isEditing ? (
    <>
      <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-lg font-semibold text-emerald-400">
        ₹ {Number(currentAmount).toLocaleString("en-IN")}
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        Monthly contributions are added automatically from
        Monthly Financial Statements.
      </p>
    </>
  ) : (
    <>
      <input
        type="number"
        min="0"
        value={currentAmount}
        onChange={(e) =>
          setCurrentAmount(e.target.value)
        }
        placeholder="0"
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
      />

      <p className="mt-2 text-xs text-zinc-500">
        Enter the amount you have already saved before
        starting monthly tracking.
      </p>
    </>
  )}

</div>

      {/* Target Date */}

      <div className="mt-5">

        <label className="mb-2 block text-sm text-zinc-400">
          Target Date
        </label>

        <input
          type="date"
          value={targetDate}
          onChange={(e) =>
            setTargetDate(
              e.target.value
            )
          }
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
        />

      </div>

      {/* Notes */}

      <div className="mt-5">

        <label className="mb-2 block text-sm text-zinc-400">
          Notes
        </label>

        <textarea
          value={notes}
          onChange={(e) =>
            setNotes(
              e.target.value
            )
          }
          rows={4}
          placeholder="Anything important..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
        />

      </div>

    </div>
            {/* Live Goal Summary */}

      {targetAmount && (

        <div className="mt-6 rounded-xl border border-emerald-800 bg-emerald-500/10 p-5">

          <h3 className="mb-4 text-lg font-semibold text-emerald-400">
            Goal Summary
          </h3>

          <div className="grid gap-4 md:grid-cols-3">

            <div>

              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Progress
              </p>

              <p className="mt-2 text-2xl font-bold text-white">
                {Math.min(
                  100,
                  Math.round(
                    ((Number(currentAmount || 0)) /
                      Number(targetAmount || 1)) *
                      100
                  )
                )}
                %
              </p>

            </div>

            <div>

              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Remaining
              </p>

              <p className="mt-2 text-2xl font-bold text-white">

                ₹
                {Math.max(
                  0,
                  Number(targetAmount || 0) -
                    Number(currentAmount || 0)
                ).toLocaleString("en-IN")}

              </p>

            </div>

            <div>

              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Monthly Required
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-400">

                ₹
                {(() => {

                  if (!targetDate)
                    return "0";

                  const today =
                    new Date();

                  const target =
                    new Date(targetDate);

                  const months =
                    Math.max(
                      1,
                      Math.ceil(
                        (target.getTime() -
                          today.getTime()) /
                          (1000 * 60 * 60 * 24 * 30)
                      )
                    );

                  const remaining =
                    Math.max(
                      0,
                      Number(targetAmount || 0) -
                        Number(currentAmount || 0)
                    );

                  return Math.round(
                    remaining / months
                  ).toLocaleString("en-IN");

                })()}

              </p>

            </div>

          </div>

        </div>

      )}

      {/* Buttons */}

      <div className="mt-8 flex gap-3">

        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-zinc-700 py-3 text-white transition hover:bg-zinc-800"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="flex-1 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700"
        >
          {isEditing
            ? "Update Goal"
            : "Save Goal"}
        </button>

      </div>

    </div>

  );

}
