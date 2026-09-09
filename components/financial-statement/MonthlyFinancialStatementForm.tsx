"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getMonthLabel,
  INITIAL_MONTHLY_FINANCIAL_STATEMENT,
  type MonthlyFinancialStatement,
  type Decision,
  type GoalContribution,
  calculateSipAnnualReview,
} from "@/lib/monthly-review";

import {
  saveFinancialStatement,
  loadMonthlyReview,
  getAllMonthlyReviews,
} from "@/lib/storage";



import {
  calculateMonthlyIncome,
  calculateTotalExpenses,
  calculateCashAllocation,
  formatINR,
} from "@/lib/financial-engine";

import {
  loadGoals,
  loadGoalLedger,
  saveGoalLedger,
  type Goal,
} from "@/lib/goals";

function CurrencyInput({
  label,
  value,
  onChange,
  placeholder = "0",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
        {label}
      </span>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-zinc-500">
          ₹
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/60 py-3 pl-9 pr-4 font-mono text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-blue-500/40 focus:bg-zinc-900/80 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
        />
      </div>
    </label>
  );
}

function SectionCard({
  icon,
  title,
  subtitle,
  accent,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  accent: "emerald" | "blue" | "violet" | "amber" | "rose";
  children: React.ReactNode;
}) {
  const accentIcon: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    violet: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
    amber: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    rose: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
  };

  return (
    <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ring-1 ${accentIcon[accent]}`}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function BalanceWarning({
  isBalanced,
  difference,
}: {
  isBalanced: boolean;
  difference: number;
}) {
  if (isBalanced) return null;

  return (
    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-400">
        ⚠ Cash Allocation Incomplete
      </p>
      <p className="mt-1 text-sm text-zinc-300">
        Difference: {formatINR(Math.abs(difference))}
        {difference > 0 ? " unallocated" : " over-allocated"}
      </p>
    </div>
  );
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SIP_STEP_UP_OPTIONS = ["10", "15", "20"] as const;

function createBlankStatement(month: number, year: number): MonthlyFinancialStatement {
  const blank = structuredClone(INITIAL_MONTHLY_FINANCIAL_STATEMENT);
  blank.month = month;
  blank.year = year;
  return blank;
}

export default function MonthlyFinancialStatementForm() {
  const [form, setForm] = useState<MonthlyFinancialStatement>(() =>
    createBlankStatement(
      INITIAL_MONTHLY_FINANCIAL_STATEMENT.month,
      INITIAL_MONTHLY_FINANCIAL_STATEMENT.year
    )
  );

  const [showNotification, setShowNotification] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [goals] = useState<Goal[]>(loadGoals());

  function getJanuarySipPlan(year: number): string {
    return (
      getAllMonthlyReviews().find(
        (entry) =>
          entry.data.year === year &&
          entry.data.month === 1 &&
          Boolean(entry.data.sipStepUp?.plannedPercent)
      )?.data.sipStepUp?.plannedPercent ?? ""
    );
  }

  const annualSipPlan =
    form.month === 1
      ? form.sipStepUp.plannedPercent
      : getJanuarySipPlan(form.year);

  const sipAnnualReview = useMemo(() => {
    const previousYearStatement =
      getAllMonthlyReviews().find(
        (entry) =>
          entry.data.month === form.month &&
          entry.data.year === form.year - 1
      )?.data ?? null;

    return calculateSipAnnualReview(
      {
        ...form,
        sipStepUp:
          form.month === 1
            ? form.sipStepUp
            : { plannedPercent: annualSipPlan, appliedThisMonth: "Not Applicable" },
      },
      previousYearStatement
    );
  }, [form, annualSipPlan]);

  // Handle Month/Year Selection Change with Athena check & confirmation dialog
  function handleMonthOrYearChange(newMonth: number, newYear: number) {
    const monthKey = `${newYear}-${String(newMonth).padStart(2, "0")}`;
    const existing = loadMonthlyReview(monthKey);
    const monthName = MONTHS[newMonth - 1];

    if (existing && "version" in existing && existing.version === 2) {
      const confirmAmend = window.confirm(
        `Do you want to amend your financial data for current month ie: ${monthName} ${newYear}?`
      );

      if (confirmAmend) {
        setForm({
          ...(existing as MonthlyFinancialStatement),
          goalContributions: (existing as MonthlyFinancialStatement).goalContributions ?? [],
          sipStepUp: (existing as MonthlyFinancialStatement).sipStepUp ?? {
            plannedPercent: "",
            appliedThisMonth: "Not Applicable",
          },
        });
        return;
      }
    }

    // Otherwise, reset to fresh zero-filled data for the selected month/year
    const blankStatement = createBlankStatement(newMonth, newYear);
    blankStatement.sipStepUp = {
      plannedPercent: newMonth === 1 ? "" : getJanuarySipPlan(newYear),
      appliedThisMonth: "Not Applicable",
    };
    setForm(blankStatement);
  }

  useEffect(() => {
    // Initial check for current form month/year on load
    const initialMonthKey = `${form.year}-${String(form.month).padStart(2, "0")}`;
    const existing = loadMonthlyReview(initialMonthKey);

    if (existing && "version" in existing && existing.version === 2) {
      const statement = existing as MonthlyFinancialStatement;
      setForm({
        ...statement,
        goalContributions: statement.goalContributions ?? [],
        sipStepUp: statement.sipStepUp ?? {
          plannedPercent: "",
          appliedThisMonth: "Not Applicable",
        },
      });
    }
  }, []);

  function updateField<K extends keyof MonthlyFinancialStatement>(
    name: K,
    value: MonthlyFinancialStatement[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function updateIncomeField<
    K extends keyof MonthlyFinancialStatement["income"]
  >(name: K, value: string) {
    setForm((prev) => ({
      ...prev,
      income: {
        ...prev.income,
        [name]: value,
      },
    }));
  }

  function updateCashAllocationField<
    K extends keyof MonthlyFinancialStatement["cashAllocation"]
  >(name: K, value: string) {
    setForm((prev) => ({
      ...prev,
      cashAllocation: {
        ...prev.cashAllocation,
        [name]: value,
      },
    }));
  }

  function updateAssetField<
    K extends keyof MonthlyFinancialStatement["assets"]
  >(name: K, value: string) {
    setForm((prev) => ({
      ...prev,
      assets: {
        ...prev.assets,
        [name]: value,
      },
    }));
  }

  function addDecision() {
    const newDecision: Decision = {
      id: Date.now().toString(),
      decision: "",
      reason: "",
      expectedOutcome: "",
    };

    setForm((prev) => ({
      ...prev,
      decisionJournal: [...prev.decisionJournal, newDecision],
    }));
  }

  function updateDecision(
    id: string,
    field: keyof Decision,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      decisionJournal: prev.decisionJournal.map((decision) =>
        decision.id === id
          ? {
              ...decision,
              [field]: value,
            }
          : decision
      ),
    }));
  }

  function removeDecision(id: string) {
    setForm((prev) => ({
      ...prev,
      decisionJournal: prev.decisionJournal.filter(
        (decision) => decision.id !== id
      ),
    }));
  }

  function addGoalContribution() {
    setForm((prev) => ({
      ...prev,
      goalContributions: [
        ...(prev.goalContributions ?? []),
        {
          id: crypto.randomUUID(),
          goalId: "",
          goalTitle: "",
          amount: "",
        },
      ],
    }));
  }

  function updateGoalContribution(
    id: string,
    field: keyof GoalContribution,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      goalContributions: (prev.goalContributions ?? []).map((goal) =>
        goal.id === id
          ? {
              ...goal,
              [field]: value,
            }
          : goal
      ),
    }));
  }

  function removeGoalContribution(id: string) {
    setForm((prev) => ({
      ...prev,
      goalContributions: (prev.goalContributions ?? []).filter(
        (goal) => goal.id !== id
      ),
    }));
  }

  function handleSave() {
    const medicalInsurancePremium = goals
      .filter((goal) => goal.category === "Insurance" && goal.timeframe === "Long Term")
      .reduce((total, goal) => total + Number(goal.monthlyExpense || 0), 0);
    const recordedMedicalExpense = Number(form.expenses.family.medical || 0);

    if (recordedMedicalExpense < medicalInsurancePremium) {
      setSaveError(
        `${formatINR(medicalInsurancePremium - recordedMedicalExpense)} of medical insurance premium is unaccounted. Add it under Family → Medical expenses before saving.`
      );
      return;
    }

    const cashAllocationCheck = calculateCashAllocation(form);

    if (!cashAllocationCheck.isBalanced) {
      const difference = Math.abs(cashAllocationCheck.difference);
      const issue =
        cashAllocationCheck.difference > 0
          ? `${formatINR(difference)} is unaccounted.`
          : `${formatINR(difference)} is over-accounted.`;

      setSaveError(
        `${issue} Allocate every rupee in Cash Allocation before saving.`
      );
      return;
    }

    setSaveError(null);

    const month = form.month;
    const year = form.year;
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;

    const previousStatement = loadMonthlyReview(monthKey);
    const now = new Date();
    const existingLedger = loadGoalLedger();
    const updatedLedger = [...existingLedger];

    for (const contribution of form.goalContributions ?? []) {
      const amount = Number(contribution.amount || 0);

      if (!contribution.goalId || amount <= 0) {
        continue;
      }

      const existingIndex = updatedLedger.findIndex(
        (entry) =>
          entry.goalId === contribution.goalId &&
          entry.month === month &&
          entry.year === year
      );

      const goal = goals.find((item) => item.id === contribution.goalId);

      const ledgerEntry = {
        id:
          existingIndex >= 0
            ? updatedLedger[existingIndex].id
            : crypto.randomUUID(),
        goalId: contribution.goalId,
        goalTitle: goal?.title ?? contribution.goalTitle,
        amount,
        month,
        year,
        date: now.toISOString(),
      };

      if (existingIndex >= 0) {
        updatedLedger[existingIndex] = ledgerEntry;
      } else {
        updatedLedger.push(ledgerEntry);
      }
    }

    saveGoalLedger(updatedLedger);

    const statementToSave: MonthlyFinancialStatement = {
      ...form,
      sipStepUp:
        form.month === 1
          ? form.sipStepUp
          : { plannedPercent: annualSipPlan, appliedThisMonth: "Not Applicable" },
      sipAnnualReview,
    };

    

    saveFinancialStatement(
      statementToSave,
      monthKey,
      getMonthLabel(new Date(year, month - 1, 1))
    );

    setShowNotification(true);

    setTimeout(() => {
      setShowNotification(false);
    }, 3500);
  }

  const cashAllocationCheck = calculateCashAllocation(form);
  const totalIncome = calculateMonthlyIncome(form);
  const totalExpenses = calculateTotalExpenses(form);

  return (
    <div className="min-h-full bg-[#0a0a0c] font-sans text-zinc-100">
      {showNotification && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-5 py-3.5 shadow-lg shadow-emerald-500/10 backdrop-blur-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm text-white">
            ✓
          </span>
          <span className="text-sm font-medium text-emerald-300">
            Monthly Financial Statement Saved Successfully.
          </span>
        </div>
      )}

      {saveError && (
        <div
          role="alert"
          className="fixed top-6 right-6 z-[100] max-w-md rounded-xl border border-amber-500/30 bg-amber-500/15 px-5 py-3.5 text-sm font-medium text-amber-200 shadow-lg shadow-amber-500/10 backdrop-blur-sm"
        >
          ⚠ {saveError}
        </div>
      )}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[400px] rounded-full bg-emerald-500/[0.03] blur-[100px]" />
      </div>

      <main className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-10">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl ring-1 ring-blue-500/20">
              📊
            </div>
            <div>
              <p className="font-mono text-xs tracking-[0.25em] uppercase text-zinc-500">
                Monthly Financial Statement
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {MONTHS[form.month - 1]} {form.year}
              </h1>
            </div>
          </div>
          <p className="max-w-2xl text-base leading-relaxed text-zinc-400">
            Record this month's financial activity. Portfolio values are managed
            separately in the Portfolio module.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-6"
        >
          {/* MONTH INFORMATION */}
          <SectionCard
            icon="📅"
            title="Month Information"
            subtitle="Basic details"
            accent="emerald"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                  Month
                </label>
                <select
                  value={form.month}
                  onChange={(e) =>
                    handleMonthOrYearChange(Number(e.target.value), form.year)
                  }
                  className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 font-mono text-sm text-white focus:border-blue-500/40 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                >
                  {MONTHS.map((monthName, index) => (
                    <option key={monthName} value={index + 1}>
                      {monthName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                  Year
                </label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) =>
                    handleMonthOrYearChange(form.month, Number(e.target.value))
                  }
                  className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 font-mono text-sm text-white"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                Financial Notes
              </label>
              <textarea
                value={form.financialNotes}
                onChange={(e) => updateField("financialNotes", e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 text-sm text-white"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                Important Decisions
              </label>
              <textarea
                value={form.importantDecisions}
                onChange={(e) => updateField("importantDecisions", e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 text-sm text-white"
              />
            </div>
          </SectionCard>

          {/* INCOME */}
          <SectionCard
            icon="💰"
            title="Income"
            subtitle="Monthly inflows"
            accent="emerald"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <CurrencyInput
                label="Salary (In Hand)"
                value={form.income.salaryInHand}
                onChange={(v) => updateIncomeField("salaryInHand", v)}
              />
              <CurrencyInput
                label="Other Income"
                value={form.income.otherIncome}
                onChange={(v) => updateIncomeField("otherIncome", v)}
              />
            </div>

            <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Total Monthly Income
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {formatINR(totalIncome)}
              </p>
            </div>
          </SectionCard>

          {/* INVESTMENTS THIS MONTH */}
          <SectionCard
            icon="📈"
            title="Investments This Month"
            subtitle="Monthly Contributions"
            accent="blue"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <CurrencyInput
                label="Mutual Fund SIP"
                value={form.cashAllocation.investments}
                onChange={(v) => updateCashAllocationField("investments", v)}
              />

              <div className="sm:col-span-2 rounded-xl border border-violet-500/30 bg-violet-500/10 p-5">
                <div className="mb-4">
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-violet-300">
                    Annual SIP Step-Up
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    January sets the annual plan. The selected plan is carried through the rest of the year.
                  </p>
                </div>

                {form.month === 1 ? (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
                        Planned Step-Up for This Year
                      </span>
                      <select
                        value={form.sipStepUp.plannedPercent}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            sipStepUp: { ...prev.sipStepUp, plannedPercent: e.target.value },
                          }))
                        }
                        className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 font-mono text-sm text-white focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
                      >
                        <option value="">Select a plan</option>
                        {SIP_STEP_UP_OPTIONS.map((percent) => (
                          <option key={percent} value={percent}>{percent}%</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
                        Was Step-Up Applied This Month?
                      </span>
                      <select
                        value={form.sipStepUp.appliedThisMonth}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            sipStepUp: {
                              ...prev.sipStepUp,
                              appliedThisMonth: e.target.value as "Yes" | "No" | "Not Applicable",
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 text-sm text-white focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
                      >
                        <option value="Not Applicable">Not Applicable</option>
                        <option value="Yes">Yes — Step-Up Applied</option>
                        <option value="No">No — Step-Up Not Applied</option>
                      </select>
                    </label>
                  </div>
                ) : (
                  <div className="rounded-xl border border-violet-500/20 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-300">
                    {annualSipPlan
                      ? `January ${form.year} plan: ${annualSipPlan}% SIP step-up. This plan is locked for the rest of the year.`
                      : `No January ${form.year} SIP plan has been recorded yet. Select January to create the annual plan.`}
                  </div>
                )}

                {form.month === 12 && (
                  <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    <span className="font-semibold">ATHENA reminder:</span> January SIP step-up planning is next month. Review your cash flow and choose a 10%, 15%, or 20% plan.
                  </div>
                )}
              </div>

              <CurrencyInput
                label="PPF Contribution"
                value={form.assets.ppf}
                onChange={(v) => updateAssetField("ppf", v)}
              />

              <CurrencyInput
                label="Stocks Purchased"
                value={form.assets.cash}
                onChange={(v) => updateAssetField("cash", v)}
              />

              <CurrencyInput
                label="NPS Contribution"
                value={form.assets.nps}
                onChange={(v) => updateAssetField("nps", v)}
              />
            </div>
          </SectionCard>

          {/* GOAL CONTRIBUTIONS */}
          <SectionCard
            icon="🎯"
            title="Goal Contributions"
            subtitle="Allocate Money Towards Goals"
            accent="emerald"
          >
            <div className="space-y-4">
              {form.goalContributions.map((contribution) => {
                const selectedGoal = goals.find(
                  (goal) => goal.id === contribution.goalId
                );

                return (
                  <div
                    key={contribution.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
                          Goal
                        </span>
                        <select
                          value={contribution.goalId}
                          onChange={(e) => {
                            const selected = goals.find(
                              (goal) => goal.id === e.target.value
                            );
                            updateGoalContribution(
                              contribution.id,
                              "goalId",
                              e.target.value
                            );
                            updateGoalContribution(
                              contribution.id,
                              "goalTitle",
                              selected?.title ?? ""
                            );
                          }}
                          className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 text-sm text-white focus:border-emerald-500/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                        >
                          <option value="">Select a goal</option>
                          {goals.map((goal) => (
                            <option key={goal.id} value={goal.id}>
                              {goal.title}
                            </option>
                          ))}
                        </select>
                      </label>

                      <CurrencyInput
                        label="Contribution"
                        value={contribution.amount}
                        onChange={(value) =>
                          updateGoalContribution(
                            contribution.id,
                            "amount",
                            value
                          )
                        }
                      />
                    </div>

                    {selectedGoal && (
                      <div className="mt-4 rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-500">Current Saved</span>
                          <span className="font-mono text-sm text-emerald-400">
                            {formatINR(selectedGoal.currentAmount)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-zinc-500">Target</span>
                          <span className="font-mono text-sm text-zinc-300">
                            {formatINR(selectedGoal.targetAmount)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeGoalContribution(contribution.id)}
                        className="rounded-lg border border-red-900/50 px-3 py-2 text-xs font-medium text-red-400 transition hover:border-red-700 hover:bg-red-950/30"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addGoalContribution}
                className="w-full rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 px-4 py-3 text-sm font-medium text-zinc-400 transition hover:border-emerald-500/50 hover:bg-zinc-900/60 hover:text-emerald-400"
              >
                + Add Goal Contribution
              </button>
            </div>
          </SectionCard>

          {/* CASH ALLOCATION */}
          <SectionCard
            icon="💵"
            title="Cash Allocation"
            subtitle="Where the remaining money went"
            accent="blue"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <CurrencyInput
                label="Emergency Fund Added"
                value={form.cashAllocation.emergencyFund}
                onChange={(v) => updateCashAllocationField("emergencyFund", v)}
              />
              <CurrencyInput
                label="Savings / Running Account Added"
                value={form.cashAllocation.savingsAccount}
                onChange={(v) => updateCashAllocationField("savingsAccount", v)}
              />
              <CurrencyInput
                label="Home Loan Prepayment"
                value={form.cashAllocation.homeLoanPrepayment}
                onChange={(v) => updateCashAllocationField("homeLoanPrepayment", v)}
              />
              <CurrencyInput
                label="Monthly Expenses"
                value={form.cashAllocation.monthlyExpenses}
                onChange={(v) => updateCashAllocationField("monthlyExpenses", v)}
              />
              <CurrencyInput
                label="Cash Remaining"
                value={form.cashAllocation.cashRemaining}
                onChange={(v) => updateCashAllocationField("cashRemaining", v)}
              />
            </div>
            <BalanceWarning
              isBalanced={cashAllocationCheck.isBalanced}
              difference={cashAllocationCheck.difference}
            />
          </SectionCard>

          {/* EXPENSES */}
          <SectionCard icon="🧾" title="Expenses" subtitle="Categorized spending" accent="rose">
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 font-mono text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Household
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CurrencyInput
                    label="Groceries"
                    value={form.expenses.household.groceries}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, household: { ...prev.expenses.household, groceries: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Electricity"
                    value={form.expenses.household.electricity}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, household: { ...prev.expenses.household, electricity: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Gas"
                    value={form.expenses.household.gas}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, household: { ...prev.expenses.household, gas: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Internet"
                    value={form.expenses.household.internet}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, household: { ...prev.expenses.household, internet: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Maintenance"
                    value={form.expenses.household.maintenance}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, household: { ...prev.expenses.household, maintenance: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="House Help"
                    value={form.expenses.household.houseHelp}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, household: { ...prev.expenses.household, houseHelp: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Fuel"
                    value={form.expenses.household.fuel}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, household: { ...prev.expenses.household, fuel: v } }
                    }))}
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-mono text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Lifestyle
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CurrencyInput
                    label="Restaurants"
                    value={form.expenses.lifestyle.restaurants}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, lifestyle: { ...prev.expenses.lifestyle, restaurants: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Shopping"
                    value={form.expenses.lifestyle.shopping}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, lifestyle: { ...prev.expenses.lifestyle, shopping: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Clothes"
                    value={form.expenses.lifestyle.clothes}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, lifestyle: { ...prev.expenses.lifestyle, clothes: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Entertainment"
                    value={form.expenses.lifestyle.entertainment}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, lifestyle: { ...prev.expenses.lifestyle, entertainment: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Gym"
                    value={form.expenses.lifestyle.gym}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, lifestyle: { ...prev.expenses.lifestyle, gym: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Subscriptions"
                    value={form.expenses.lifestyle.subscriptions}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, lifestyle: { ...prev.expenses.lifestyle, subscriptions: v } }
                    }))}
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-mono text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Travel
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CurrencyInput
                    label="Flights"
                    value={form.expenses.travel.flights}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, travel: { ...prev.expenses.travel, flights: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Hotels"
                    value={form.expenses.travel.hotels}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, travel: { ...prev.expenses.travel, hotels: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Taxi"
                    value={form.expenses.travel.taxi}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, travel: { ...prev.expenses.travel, taxi: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Holiday"
                    value={form.expenses.travel.holiday}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, travel: { ...prev.expenses.travel, holiday: v } }
                    }))}
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-mono text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Family
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CurrencyInput
                    label="Parents"
                    value={form.expenses.family.parents}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, family: { ...prev.expenses.family, parents: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Medical"
                    value={form.expenses.family.medical}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, family: { ...prev.expenses.family, medical: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Children"
                    value={form.expenses.family.children}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, family: { ...prev.expenses.family, children: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Gifts"
                    value={form.expenses.family.gifts}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, family: { ...prev.expenses.family, gifts: v } }
                    }))}
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-mono text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Miscellaneous
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CurrencyInput
                    label="Unexpected"
                    value={form.expenses.misc.unexpected}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, misc: { ...prev.expenses.misc, unexpected: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Repairs"
                    value={form.expenses.misc.repairs}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, misc: { ...prev.expenses.misc, repairs: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Other"
                    value={form.expenses.misc.other}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, misc: { ...prev.expenses.misc, other: v } }
                    }))}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
                <p className="font-mono text-xs font-semibold text-rose-400 uppercase tracking-wider">
                  Total Expenses
                </p>
                <p className="mt-1 text-2xl font-semibold text-white">{formatINR(totalExpenses)}</p>
              </div>
            </div>
          </SectionCard>

          {/* PORTFOLIO INFORMATION */}
          <SectionCard
            icon="🏦"
            title="Portfolio"
            subtitle="Managed separately"
            accent="violet"
          >
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6">
              <h3 className="text-lg font-semibold text-white">
                Portfolio is now managed separately
              </h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                ATHENA now keeps your investments, assets and liabilities
                inside the Portfolio module.
              </p>
            </div>
          </SectionCard>

          {/* DECISION JOURNAL */}
          <SectionCard icon="✍️" title="Decision Journal" subtitle="Track financial decisions" accent="emerald">
            <div className="space-y-4">
              {form.decisionJournal.map((decision) => (
                <div key={decision.id} className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-xs text-zinc-500">Decision #{decision.id.slice(-4)}</span>
                    <button
                      type="button"
                      onClick={() => removeDecision(decision.id)}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
                        Decision
                      </label>
                      <input
                        type="text"
                        value={decision.decision}
                        onChange={(e) => updateDecision(decision.id, "decision", e.target.value)}
                        placeholder="e.g. Stopped F&O Trading"
                        className="w-full rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-emerald-500/40 focus:bg-zinc-900/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
                        Reason
                      </label>
                      <input
                        type="text"
                        value={decision.reason}
                        onChange={(e) => updateDecision(decision.id, "reason", e.target.value)}
                        placeholder="Why did you make this decision?"
                        className="w-full rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-emerald-500/40 focus:bg-zinc-900/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
                        Expected Outcome
                      </label>
                      <input
                        type="text"
                        value={decision.expectedOutcome}
                        onChange={(e) => updateDecision(decision.id, "expectedOutcome", e.target.value)}
                        placeholder="What do you expect to achieve?"
                        className="w-full rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-emerald-500/40 focus:bg-zinc-900/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addDecision}
                className="w-full rounded-xl border border-dashed border-zinc-800/80 bg-zinc-900/30 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
              >
                + Add Decision
              </button>
            </div>
          </SectionCard>

          {/* SAVE BUTTON */}
          <div className="pt-2 pb-8">
            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 text-base font-semibold tracking-wide text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/30 active:scale-[0.99]"
            >
              Save Monthly Financial Statement
            </button>
            <p className="mt-3 text-center font-mono text-[10px] tracking-wider text-zinc-600 uppercase">
              Data stored locally in your browser · Database integration coming soon
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
