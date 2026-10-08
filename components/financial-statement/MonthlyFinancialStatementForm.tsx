"use client";

import {
  getPortfolio,
  saveCurrentPortfolio,
} from "@/lib/investments";

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
import { parseAmount } from "@/lib/spending-analytics";

import {
  loadGoals,
  loadGoalLedger,
  saveGoalLedger,
  type Goal,
} from "@/lib/goals";
import { loadPortfolio } from "@/lib/investments/portfolio-storage/storage";
import type { PortfolioItem } from "@/lib/investments";

function CurrencyInput({
  label,
  value,
  onChange,
  onShowHistory,
  placeholder = "0",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onShowHistory?: () => void;
  placeholder?: string;
}) {
  return (
    <div>
      {onShowHistory ? (
        <button
          type="button"
          onClick={onShowHistory}
          aria-label={`View past ${label} expenses`}
          className="mb-2 block font-mono text-[11px] tracking-wider text-zinc-500 uppercase transition-colors hover:text-rose-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
        >
          {label}
        </button>
      ) : (
        <span className="mb-2 block font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
          {label}
        </span>
      )}
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-zinc-500">
          ₹
        </span>
        <input
          type="text"
          inputMode="decimal"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/60 py-3 pl-9 pr-4 font-mono text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-blue-500/40 focus:bg-zinc-900/80 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
        />
      </div>
    </div>
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
  const [accountReview, setAccountReview] = useState<{
    previousMonthLabel: string | null;
    previousRunningBalance: string;
    previousEmergencyBalance: string;
    currentRunningBalance: number | null;
    currentEmergencyBalance: number | null;
  } | null>(null);
  const [accountReviewReady, setAccountReviewReady] = useState(false);
  const [accountStatus, setAccountStatus] = useState<"unchanged" | "updated" | null>(null);
  const [postSaveSummary, setPostSaveSummary] = useState<{
    monthLabel: string;
    portfolio: PortfolioItem[];
    topExpenses: { label: string; amount: number }[];
  } | null>(null);
  const [expenseHistory, setExpenseHistory] = useState<{
    label: string;
    entries: { monthKey: string; monthLabel: string; amount: string }[];
  } | null>(null);
  const [goals] = useState<Goal[]>(loadGoals());

  function showExpenseHistory(
    label: string,
    getAmount: (statement: MonthlyFinancialStatement) => string | undefined
  ) {
    setExpenseHistory({
      label,
      entries: getAllMonthlyReviews().map((entry) => ({
        monthKey: entry.monthKey,
        monthLabel: entry.monthLabel,
        amount: getAmount(entry.data) ?? "",
      })),
    });
  }

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
    const reviews = getAllMonthlyReviews();
    const previousEntry =
      reviews.find((entry) => entry.monthKey === initialMonthKey) ??
      reviews.find((entry) => entry.monthKey < initialMonthKey);
    const portfolio = loadPortfolio();
    const runningAccounts = portfolio.filter(
      (item) => item.type === "Asset" && item.category === "Savings Account"
    );
    const emergencyAccounts = portfolio.filter(
      (item) => item.type === "Asset" && item.category === "Emergency Fund"
    );

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

    setAccountReview({
      previousMonthLabel: previousEntry?.monthLabel ?? null,
      previousRunningBalance: previousEntry?.data.assets.savingsAccount ?? "",
      previousEmergencyBalance: previousEntry?.data.assets.emergencyFund ?? "",
      currentRunningBalance:
        runningAccounts.length > 0
          ? runningAccounts.reduce((total, account) => total + account.currentValue, 0)
          : null,
      currentEmergencyBalance:
        emergencyAccounts.length > 0
          ? emergencyAccounts.reduce((total, account) => total + account.currentValue, 0)
          : null,
    });
    setAccountReviewReady(true);
  }, []);

  function refreshAccountBalances() {
    const portfolio = loadPortfolio();
    const runningAccounts = portfolio.filter(
      (item) => item.type === "Asset" && item.category === "Savings Account"
    );
    const emergencyAccounts = portfolio.filter(
      (item) => item.type === "Asset" && item.category === "Emergency Fund"
    );

    setAccountReview((previous) =>
      previous
        ? {
            ...previous,
            currentRunningBalance:
              runningAccounts.length > 0
                ? runningAccounts.reduce((total, account) => total + account.currentValue, 0)
                : null,
            currentEmergencyBalance:
              emergencyAccounts.length > 0
                ? emergencyAccounts.reduce((total, account) => total + account.currentValue, 0)
                : null,
          }
        : previous
    );
  }

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

    const portfolio = typeof window !== "undefined" ? getPortfolio() : [];
  const homeLoan = portfolio.find(
    (item) => item.type === "Liability" && (item.category === "Home Loan" || item.name.toLowerCase().includes("loan"))
  );
  const isHomeLoanActive = homeLoan ? (Number(homeLoan.currentValue ?? homeLoan.outstandingAmount ?? 0) > 0) : false;

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

    const _previousStatement = loadMonthlyReview(monthKey);
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

    const portfolioAtSave = loadPortfolio();
    const runningAccounts = portfolioAtSave.filter(
      (item) => item.type === "Asset" && item.category === "Savings Account"
    );
    const emergencyAccounts = portfolioAtSave.filter(
      (item) => item.type === "Asset" && item.category === "Emergency Fund"
    );
    const runningBalance =
      runningAccounts.length > 0
        ? runningAccounts.reduce((total, account) => total + account.currentValue, 0)
        : null;
    const emergencyBalance =
      emergencyAccounts.length > 0
        ? emergencyAccounts.reduce((total, account) => total + account.currentValue, 0)
        : null;

    const statementToSave: MonthlyFinancialStatement = {
      ...form,
      sipStepUp:
        form.month === 1
          ? form.sipStepUp
          : { plannedPercent: annualSipPlan, appliedThisMonth: "Not Applicable" },
      sipAnnualReview,
      assets: {
        ...form.assets,
        savingsAccount:
          runningBalance === null
            ? form.assets.savingsAccount
            : String(runningBalance),
        emergencyFund:
          emergencyBalance === null
            ? form.assets.emergencyFund
            : String(emergencyBalance),
      },
    };

    

        const prepaymentAmount = Number(form.cashAllocation.homeLoanPrepayment || 0);
    if (prepaymentAmount > 0 && isHomeLoanActive && homeLoan) {
      const currentBal = Number(homeLoan.currentValue ?? homeLoan.outstandingAmount ?? 0);
      const newBal = Math.max(0, currentBal - prepaymentAmount);
      const updatedPortfolio = portfolio.map((item) =>
        item.id === homeLoan.id
          ? { ...item, currentValue: newBal, outstandingAmount: newBal }
          : item
      );
      saveCurrentPortfolio(updatedPortfolio);
    }

    saveFinancialStatement(
      statementToSave,
      monthKey,
      getMonthLabel(new Date(year, month - 1, 1))
    );

    const expenseItems = [
      { label: "Groceries", amount: parseAmount(statementToSave.expenses.household.groceries) },
      { label: "MESS BILL", amount: parseAmount(statementToSave.expenses.household.messBill ?? "") },
      { label: "Electricity", amount: parseAmount(statementToSave.expenses.household.electricity) },
      { label: "Gas", amount: parseAmount(statementToSave.expenses.household.gas) },
      { label: "Internet", amount: parseAmount(statementToSave.expenses.household.internet) },
      { label: "Maintenance", amount: parseAmount(statementToSave.expenses.household.maintenance) },
      { label: "House Help", amount: parseAmount(statementToSave.expenses.household.houseHelp) },
      { label: "Fuel", amount: parseAmount(statementToSave.expenses.household.fuel) },
      { label: "Restaurants", amount: parseAmount(statementToSave.expenses.lifestyle.restaurants) },
      { label: "Shopping", amount: parseAmount(statementToSave.expenses.lifestyle.shopping) },
      { label: "Clothes", amount: parseAmount(statementToSave.expenses.lifestyle.clothes) },
      { label: "Entertainment", amount: parseAmount(statementToSave.expenses.lifestyle.entertainment) },
      { label: "Gym", amount: parseAmount(statementToSave.expenses.lifestyle.gym) },
      { label: "Subscriptions", amount: parseAmount(statementToSave.expenses.lifestyle.subscriptions) },
      { label: "Flights", amount: parseAmount(statementToSave.expenses.travel.flights) },
      { label: "Hotels", amount: parseAmount(statementToSave.expenses.travel.hotels) },
      { label: "Taxi", amount: parseAmount(statementToSave.expenses.travel.taxi) },
      { label: "Holiday", amount: parseAmount(statementToSave.expenses.travel.holiday) },
      { label: "Parents", amount: parseAmount(statementToSave.expenses.family.parents) },
      { label: "Medical", amount: parseAmount(statementToSave.expenses.family.medical) },
      { label: "Children", amount: parseAmount(statementToSave.expenses.family.children) },
      { label: "Gifts", amount: parseAmount(statementToSave.expenses.family.gifts) },
      { label: "Unexpected", amount: parseAmount(statementToSave.expenses.misc.unexpected) },
      { label: "Repairs", amount: parseAmount(statementToSave.expenses.misc.repairs) },
      { label: "Other", amount: parseAmount(statementToSave.expenses.misc.other) },
    ];

    setPostSaveSummary({
      monthLabel: getMonthLabel(new Date(year, month - 1, 1)),
      portfolio: portfolioAtSave,
      topExpenses: expenseItems
        .filter((item) => item.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3),
    });
    setShowNotification(true);

    setTimeout(() => {
      setShowNotification(false);
    }, 3500);
  }

  const cashAllocationCheck = calculateCashAllocation(form);
  const totalIncome = calculateMonthlyIncome(form);
  const totalExpenses = calculateTotalExpenses(form);
  const accountComparisons = accountReview
    ? [
        {
          label: "Running Account",
          current: accountReview.currentRunningBalance,
          previous: accountReview.previousRunningBalance,
        },
        {
          label: "Emergency Account",
          current: accountReview.currentEmergencyBalance,
          previous: accountReview.previousEmergencyBalance,
        },
      ].map((account) => ({
        ...account,
        difference:
          account.current !== null && account.previous.trim()
            ? account.current - parseAmount(account.previous)
            : null,
      }))
    : [];
  const portfolioAssets =
    postSaveSummary?.portfolio.filter((item) => item.type === "Asset") ?? [];
  const portfolioLiabilities =
    postSaveSummary?.portfolio.filter((item) => item.type === "Liability") ?? [];
  const portfolioAssetTotal = portfolioAssets.reduce(
    (total, asset) => total + asset.currentValue,
    0
  );
  const portfolioLiabilityTotal = portfolioLiabilities.reduce(
    (total, liability) => total + liability.outstandingAmount,
    0
  );

  return (
    <div className="min-h-full bg-[#0a0a0c] font-sans text-zinc-100">
      {accountReviewReady && accountStatus === null && accountReview && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-review-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-400">
              Before you start
            </p>
            <h2 id="account-review-title" className="mt-2 text-2xl font-semibold text-white">
              Confirm your account balances
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Compare the latest balances in Portfolio with your last saved monthly entry.
              {accountReview.previousMonthLabel
                ? ` Last saved entry: ${accountReview.previousMonthLabel}.`
                : " There is no earlier monthly entry to compare."}
            </p>

            <div className="mt-5 space-y-3">
              {accountComparisons.map((account) => (
                <div key={account.label} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-medium text-white">{account.label}</h3>
                    <span className="font-mono text-sm text-white">
                      {account.current === null ? "Not tracked in Portfolio" : formatINR(account.current)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {accountReview.previousMonthLabel
                      ? `Last entry: ${account.previous.trim() ? formatINR(parseAmount(account.previous)) : "Balance not recorded"}`
                      : "No previous balance available"}
                  </p>
                  {account.difference !== null && (
                    <p className={`mt-1 text-xs ${account.difference === 0 ? "text-emerald-400" : "text-amber-300"}`}>
                      {account.difference === 0
                        ? "Same as last entry"
                        : `Changed by ${account.difference > 0 ? "+" : "−"}${formatINR(Math.abs(account.difference))} in ${account.label}`}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {(accountReview.currentRunningBalance === null ||
              accountReview.currentEmergencyBalance === null) && (
              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-amber-200">
                <p>
                  One or both balances are not tracked in Portfolio. Add or update the relevant
                  Savings Account or Emergency Fund there to include them in this check.
                </p>
                <div className="mt-2 flex flex-wrap gap-4">
                  <a href="/portfolio" target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    Open Portfolio
                  </a>
                  <button type="button" onClick={refreshAccountBalances} className="underline underline-offset-2">
                    Refresh balances
                  </button>
                </div>
              </div>
            )}

            <fieldset className="mt-5 space-y-2">
              <legend className="mb-2 text-sm font-medium text-zinc-300">
                Has either balance changed since the last entry?
              </legend>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800 p-3 text-sm text-zinc-300">
                <input
                  type="radio"
                  name="account-status"
                  checked={accountStatus === "unchanged"}
                  onChange={() => setAccountStatus("unchanged")}
                  className="mt-1 accent-emerald-500"
                />
                No, the balances are unchanged (or this is my first entry).
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800 p-3 text-sm text-zinc-300">
                <input
                  type="radio"
                  name="account-status"
                  checked={accountStatus === "updated"}
                  onChange={() => setAccountStatus("updated")}
                  className="mt-1 accent-emerald-500"
                />
                Yes, I updated the changed account balances in Portfolio.
              </label>
            </fieldset>
            <button
              type="button"
              disabled={accountStatus === null}
              onClick={() => setAccountReviewReady(false)}
              className="mt-5 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirm and start monthly entry
            </button>
          </section>
        </div>
      )}

      {postSaveSummary && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-save-summary-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
              Monthly entry saved
            </p>
            <h2 id="post-save-summary-title" className="mt-2 text-2xl font-semibold text-white">
              {postSaveSummary.monthLabel} account summary
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Account balances are taken from Portfolio. Expenditures are from this saved monthly entry.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <h3 className="font-semibold text-white">Assets</h3>
                {portfolioAssets.length > 0 ? (
                  <>
                    <ul className="mt-3 space-y-2">
                      {portfolioAssets.map((asset) => (
                        <li key={asset.id} className="flex justify-between gap-3 text-sm">
                          <span className="text-zinc-400">{asset.name}</span>
                          <span className="font-mono text-white">{formatINR(asset.currentValue)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 flex justify-between border-t border-zinc-800 pt-3 text-sm font-semibold">
                      <span className="text-zinc-300">Total assets</span>
                      <span className="font-mono text-white">{formatINR(portfolioAssetTotal)}</span>
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-zinc-500">No asset accounts are recorded in Portfolio.</p>
                )}
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <h3 className="font-semibold text-white">Liabilities</h3>
                {portfolioLiabilities.length > 0 ? (
                  <>
                    <ul className="mt-3 space-y-2">
                      {portfolioLiabilities.map((liability) => (
                        <li key={liability.id} className="flex justify-between gap-3 text-sm">
                          <span className="text-zinc-400">{liability.name}</span>
                          <span className="font-mono text-white">{formatINR(liability.outstandingAmount)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 flex justify-between border-t border-zinc-800 pt-3 text-sm font-semibold">
                      <span className="text-zinc-300">Total liabilities</span>
                      <span className="font-mono text-white">{formatINR(portfolioLiabilityTotal)}</span>
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-zinc-500">No liabilities are recorded in Portfolio.</p>
                )}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
              <h3 className="font-semibold text-white">Top expenditures</h3>
              {postSaveSummary.topExpenses.length > 0 ? (
                <ol className="mt-3 space-y-2">
                  {postSaveSummary.topExpenses.map((expense, index) => (
                    <li key={expense.label} className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-zinc-300">
                        <span className="mr-2 font-mono text-rose-300">{index + 1}.</span>
                        {expense.label}
                      </span>
                      <span className="font-mono font-medium text-white">{formatINR(expense.amount)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm text-zinc-500">No expenditure amounts were entered for this month.</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPostSaveSummary(null)}
              className="mt-5 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              Continue
            </button>
          </section>
        </div>
      )}

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

      {expenseHistory && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setExpenseHistory(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-history-title"
            className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Monthly expenditure history
                </p>
                <h2 id="expense-history-title" className="mt-1 text-lg font-semibold text-white">
                  {expenseHistory.label}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setExpenseHistory(null)}
                aria-label="Close expenditure history"
                className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-5">
              {expenseHistory.entries.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">
                  No saved monthly statements yet.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-800">
                  {expenseHistory.entries.map((entry) => (
                    <li
                      key={entry.monthKey}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="text-sm text-zinc-300">{entry.monthLabel}</span>
                      <span className="font-mono text-sm font-medium text-white">
                        {entry.amount.trim() ? formatINR(parseAmount(entry.amount)) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
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
              {isHomeLoanActive ? (
                <CurrencyInput
                  label="Home Loan Prepayment"
                  value={form.cashAllocation.homeLoanPrepayment}
                  onChange={(v) => updateCashAllocationField("homeLoanPrepayment", v)}
                />
              ) : (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 flex items-center gap-2">
                  <span className="text-base">🎉</span>
                  <div>
                    <p className="font-semibold text-white">Home Loan Fully Paid Off</p>
                    <p className="text-[11px] text-emerald-400/80">No prepayment required this month.</p>
                  </div>
                </div>
              )}
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
                    onShowHistory={() => showExpenseHistory("Groceries", (statement) => statement.expenses.household.groceries)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, household: { ...prev.expenses.household, groceries: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="MESS BILL"
                    value={form.expenses.household.messBill ?? ""}
                    onShowHistory={() => showExpenseHistory("MESS BILL", (statement) => statement.expenses.household.messBill)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, household: { ...prev.expenses.household, messBill: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Electricity"
                    value={form.expenses.household.electricity}
                    onShowHistory={() => showExpenseHistory("Electricity", (statement) => statement.expenses.household.electricity)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, household: { ...prev.expenses.household, electricity: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Gas"
                    value={form.expenses.household.gas}
                    onShowHistory={() => showExpenseHistory("Gas", (statement) => statement.expenses.household.gas)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, household: { ...prev.expenses.household, gas: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Internet"
                    value={form.expenses.household.internet}
                    onShowHistory={() => showExpenseHistory("Internet", (statement) => statement.expenses.household.internet)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, household: { ...prev.expenses.household, internet: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Maintenance"
                    value={form.expenses.household.maintenance}
                    onShowHistory={() => showExpenseHistory("Maintenance", (statement) => statement.expenses.household.maintenance)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, household: { ...prev.expenses.household, maintenance: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="House Help"
                    value={form.expenses.household.houseHelp}
                    onShowHistory={() => showExpenseHistory("House Help", (statement) => statement.expenses.household.houseHelp)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, household: { ...prev.expenses.household, houseHelp: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Fuel"
                    value={form.expenses.household.fuel}
                    onShowHistory={() => showExpenseHistory("Fuel", (statement) => statement.expenses.household.fuel)}
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
                    onShowHistory={() => showExpenseHistory("Restaurants", (statement) => statement.expenses.lifestyle.restaurants)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, lifestyle: { ...prev.expenses.lifestyle, restaurants: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Shopping"
                    value={form.expenses.lifestyle.shopping}
                    onShowHistory={() => showExpenseHistory("Shopping", (statement) => statement.expenses.lifestyle.shopping)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, lifestyle: { ...prev.expenses.lifestyle, shopping: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Clothes"
                    value={form.expenses.lifestyle.clothes}
                    onShowHistory={() => showExpenseHistory("Clothes", (statement) => statement.expenses.lifestyle.clothes)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, lifestyle: { ...prev.expenses.lifestyle, clothes: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Entertainment"
                    value={form.expenses.lifestyle.entertainment}
                    onShowHistory={() => showExpenseHistory("Entertainment", (statement) => statement.expenses.lifestyle.entertainment)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, lifestyle: { ...prev.expenses.lifestyle, entertainment: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Gym"
                    value={form.expenses.lifestyle.gym}
                    onShowHistory={() => showExpenseHistory("Gym", (statement) => statement.expenses.lifestyle.gym)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, lifestyle: { ...prev.expenses.lifestyle, gym: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Subscriptions"
                    value={form.expenses.lifestyle.subscriptions}
                    onShowHistory={() => showExpenseHistory("Subscriptions", (statement) => statement.expenses.lifestyle.subscriptions)}
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
                    onShowHistory={() => showExpenseHistory("Flights", (statement) => statement.expenses.travel.flights)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, travel: { ...prev.expenses.travel, flights: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Hotels"
                    value={form.expenses.travel.hotels}
                    onShowHistory={() => showExpenseHistory("Hotels", (statement) => statement.expenses.travel.hotels)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, travel: { ...prev.expenses.travel, hotels: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Taxi"
                    value={form.expenses.travel.taxi}
                    onShowHistory={() => showExpenseHistory("Taxi", (statement) => statement.expenses.travel.taxi)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, travel: { ...prev.expenses.travel, taxi: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Holiday"
                    value={form.expenses.travel.holiday}
                    onShowHistory={() => showExpenseHistory("Holiday", (statement) => statement.expenses.travel.holiday)}
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
                    onShowHistory={() => showExpenseHistory("Parents", (statement) => statement.expenses.family.parents)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, family: { ...prev.expenses.family, parents: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Medical"
                    value={form.expenses.family.medical}
                    onShowHistory={() => showExpenseHistory("Medical", (statement) => statement.expenses.family.medical)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, family: { ...prev.expenses.family, medical: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Children"
                    value={form.expenses.family.children}
                    onShowHistory={() => showExpenseHistory("Children", (statement) => statement.expenses.family.children)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, family: { ...prev.expenses.family, children: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Gifts"
                    value={form.expenses.family.gifts}
                    onShowHistory={() => showExpenseHistory("Gifts", (statement) => statement.expenses.family.gifts)}
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
                    onShowHistory={() => showExpenseHistory("Unexpected", (statement) => statement.expenses.misc.unexpected)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, misc: { ...prev.expenses.misc, unexpected: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Repairs"
                    value={form.expenses.misc.repairs}
                    onShowHistory={() => showExpenseHistory("Repairs", (statement) => statement.expenses.misc.repairs)}
                    onChange={(v) => setForm((prev) => ({
                      ...prev,
                      expenses: { ...prev.expenses, misc: { ...prev.expenses.misc, repairs: v } }
                    }))}
                  />
                  <CurrencyInput
                    label="Other"
                    value={form.expenses.misc.other}
                    onShowHistory={() => showExpenseHistory("Other", (statement) => statement.expenses.misc.other)}
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
