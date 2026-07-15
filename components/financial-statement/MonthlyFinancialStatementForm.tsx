"use client";

import { useEffect, useState } from "react";
import {
  getMonthLabel,
  INITIAL_MONTHLY_FINANCIAL_STATEMENT,
  type MonthlyFinancialStatement,
  type Investment,
  type Decision,
} from "@/lib/monthly-review";
import { saveFinancialStatement, loadMonthlyReview } from "@/lib/storage";
import {
  calculateMonthlyIncome,
  calculateTotalExpenses,
  calculateCashAllocation,
  formatINR,
} from "@/lib/financial-engine";

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
          <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function BalanceWarning({ isBalanced, difference }: { isBalanced: boolean; difference: number }) {
  if (isBalanced) return null;

  return (
    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <p className="font-mono text-xs font-semibold text-amber-400 uppercase tracking-wider">
        ⚠ Cash Allocation Incomplete
      </p>
      <p className="mt-1 text-sm text-zinc-300">
        Difference: {formatINR(Math.abs(difference))}
        {difference > 0 ? " unallocated" : " over-allocated"}
      </p>
    </div>
  );
}

export default function MonthlyFinancialStatementForm() {
  const [form, setForm] = useState<MonthlyFinancialStatement>(INITIAL_MONTHLY_FINANCIAL_STATEMENT);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const existing = loadMonthlyReview();
    if (existing && "version" in existing && existing.version === 2) {
      setForm(existing as MonthlyFinancialStatement);
    }
  }, []);

  function updateField<K extends keyof MonthlyFinancialStatement>(
    name: K,
    value: MonthlyFinancialStatement[K]
  ) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateIncomeField<K extends keyof MonthlyFinancialStatement["income"]>(
    name: K,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      income: { ...prev.income, [name]: value },
    }));
  }

  function updateCashAllocationField<K extends keyof MonthlyFinancialStatement["cashAllocation"]>(
    name: K,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      cashAllocation: { ...prev.cashAllocation, [name]: value },
    }));
  }

  function updateAssetField<K extends keyof MonthlyFinancialStatement["assets"]>(
    name: K,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      assets: { ...prev.assets, [name]: value },
    }));
  }

  function updateLiabilityField<K extends keyof MonthlyFinancialStatement["liabilities"]>(
    name: K,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      liabilities: { ...prev.liabilities, [name]: value },
    }));
  }

  function addInvestment() {
    const newInvestment: Investment = {
      id: Date.now().toString(),
      name: "",
      category: "Mutual Fund",
      monthlyContribution: "",
      currentValue: "",
      investedAmount: "",
    };
    setForm((prev) => ({
      ...prev,
      investments: [...prev.investments, newInvestment],
    }));
  }

  function updateInvestment(id: string, field: keyof Investment, value: string) {
    setForm((prev) => ({
      ...prev,
      investments: prev.investments.map((inv) =>
        inv.id === id ? { ...inv, [field]: value } : inv
      ),
    }));
  }

  function removeInvestment(id: string) {
    setForm((prev) => ({
      ...prev,
      investments: prev.investments.filter((inv) => inv.id !== id),
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

  function updateDecision(id: string, field: keyof Decision, value: string) {
    setForm((prev) => ({
      ...prev,
      decisionJournal: prev.decisionJournal.map((dec) =>
        dec.id === id ? { ...dec, [field]: value } : dec
      ),
    }));
  }

  function removeDecision(id: string) {
    setForm((prev) => ({
      ...prev,
      decisionJournal: prev.decisionJournal.filter((dec) => dec.id !== id),
    }));
  }

  function handleSave() {
    saveFinancialStatement(form);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3500);
  }

  const cashAllocationCheck = calculateCashAllocation(form);
  const totalIncome = calculateMonthlyIncome(form);
  const totalExpenses = calculateTotalExpenses(form);

  return (
    <div className="min-h-full bg-[#0a0a0c] font-sans text-zinc-100">
      {/* Success Notification */}
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

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[400px] rounded-full bg-emerald-500/[0.03] blur-[100px]" />
      </div>

      <main className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <header className="mb-10">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl ring-1 ring-blue-500/20">
              📊
            </div>
            <div>
              <p className="font-mono text-xs tracking-[0.25em] text-zinc-500 uppercase">
                Monthly Financial Statement
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {getMonthLabel()}
              </h1>
            </div>
          </div>
          <p className="max-w-2xl text-base leading-relaxed text-zinc-400">
            Complete financial snapshot for the month. Track income, expenses, investments, assets, and
            decisions in one place.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-6"
        >
          {/* Section 1: Month Information */}
          <SectionCard icon="📅" title="Month Information" subtitle="Basic details" accent="emerald">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
                  Month
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={form.month}
                  onChange={(e) => updateField("month", Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/60 py-3 px-4 font-mono text-sm text-white transition-colors focus:border-emerald-500/40 focus:bg-zinc-900/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
                  Year
                </label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => updateField("year", Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/60 py-3 px-4 font-mono text-sm text-white transition-colors focus:border-emerald-500/40 focus:bg-zinc-900/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>
            </div>
            <div className="mt-5">
              <label className="mb-2 block font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
                Financial Notes
              </label>
              <textarea
                value={form.financialNotes}
                onChange={(e) => updateField("financialNotes", e.target.value)}
                rows={3}
                placeholder="Any important notes about this month..."
                className="w-full resize-none rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-emerald-500/40 focus:bg-zinc-900/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>
            <div className="mt-5">
              <label className="mb-2 block font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
                Important Decisions
              </label>
              <textarea
                value={form.importantDecisions}
                onChange={(e) => updateField("importantDecisions", e.target.value)}
                rows={3}
                placeholder="Key financial decisions made this month..."
                className="w-full resize-none rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-emerald-500/40 focus:bg-zinc-900/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>
          </SectionCard>

          {/* Section 2: Income */}
          <SectionCard icon="💰" title="Income" subtitle="Monthly inflows" accent="emerald">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <CurrencyInput
                label="Salary (In Hand)"
                value={form.income.salaryInHand}
                onChange={(v) => updateIncomeField("salaryInHand", v)}
              />
              <CurrencyInput
                label="DA / Allowances"
                value={form.income.daAllowances}
                onChange={(v) => updateIncomeField("daAllowances", v)}
              />
              <CurrencyInput
                label="Bonus"
                value={form.income.bonus}
                onChange={(v) => updateIncomeField("bonus", v)}
              />
              <CurrencyInput
                label="Arrears"
                value={form.income.arrears}
                onChange={(v) => updateIncomeField("arrears", v)}
              />
              <CurrencyInput
                label="Interest Income"
                value={form.income.interestIncome}
                onChange={(v) => updateIncomeField("interestIncome", v)}
              />
              <CurrencyInput
                label="Dividend"
                value={form.income.dividend}
                onChange={(v) => updateIncomeField("dividend", v)}
              />
              <CurrencyInput
                label="Rental Income"
                value={form.income.rentalIncome}
                onChange={(v) => updateIncomeField("rentalIncome", v)}
              />
              <CurrencyInput
                label="Other Income"
                value={form.income.otherIncome}
                onChange={(v) => updateIncomeField("otherIncome", v)}
              />
            </div>
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <p className="font-mono text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Total Monthly Income
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">{formatINR(totalIncome)}</p>
            </div>
          </SectionCard>

          {/* Section 3: Cash Allocation */}
          <SectionCard icon="💵" title="Cash Allocation" subtitle="Where every rupee goes" accent="blue">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <CurrencyInput
                label="Investments"
                value={form.cashAllocation.investments}
                onChange={(v) => updateCashAllocationField("investments", v)}
              />
              <CurrencyInput
                label="Emergency Fund"
                value={form.cashAllocation.emergencyFund}
                onChange={(v) => updateCashAllocationField("emergencyFund", v)}
              />
              <CurrencyInput
                label="Savings Account"
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

          {/* Section 4: Investments */}
          <SectionCard icon="📈" title="Investments" subtitle="Portfolio details" accent="blue">
            <div className="space-y-4">
              {form.investments.map((investment) => (
                <div key={investment.id} className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-xs text-zinc-500">Investment #{investment.id.slice(-4)}</span>
                    <button
                      type="button"
                      onClick={() => removeInvestment(investment.id)}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
                        Investment Name
                      </label>
                      <input
                        type="text"
                        value={investment.name}
                        onChange={(e) => updateInvestment(investment.id, "name", e.target.value)}
                        placeholder="e.g. Parag Parikh Flexi Cap"
                        className="w-full rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-blue-500/40 focus:bg-zinc-900/80 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
                        Category
                      </label>
                      <select
                        value={investment.category}
                        onChange={(e) => updateInvestment(investment.id, "category", e.target.value as Investment["category"])}
                        className="w-full rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3 py-2 text-sm text-white transition-colors focus:border-blue-500/40 focus:bg-zinc-900/80 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                      >
                        <option value="Mutual Fund">Mutual Fund</option>
                        <option value="PPF">PPF</option>
                        <option value="NPS">NPS</option>
                        <option value="Gold">Gold</option>
                        <option value="FD">FD</option>
                        <option value="Stocks">Stocks</option>
                      </select>
                    </div>
                    <CurrencyInput
                      label="Monthly Contribution"
                      value={investment.monthlyContribution}
                      onChange={(v) => updateInvestment(investment.id, "monthlyContribution", v)}
                    />
                    <CurrencyInput
                      label="Current Value"
                      value={investment.currentValue}
                      onChange={(v) => updateInvestment(investment.id, "currentValue", v)}
                    />
                    <CurrencyInput
                      label="Invested Amount"
                      value={investment.investedAmount}
                      onChange={(v) => updateInvestment(investment.id, "investedAmount", v)}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addInvestment}
                className="w-full rounded-xl border border-dashed border-zinc-800/80 bg-zinc-900/30 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
              >
                + Add Investment
              </button>
            </div>
          </SectionCard>

          {/* Section 5: Expenses */}
          <SectionCard icon="🧾" title="Expenses" subtitle="Categorized spending" accent="rose">
            <div className="space-y-6">
              {/* Household */}
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

              {/* Lifestyle */}
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

              {/* Travel */}
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

              {/* Family */}
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

              {/* Misc */}
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

          {/* Section 6: Assets */}
          <SectionCard icon="🏦" title="Assets" subtitle="Current values" accent="violet">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <CurrencyInput
                label="Savings Account"
                value={form.assets.savingsAccount}
                onChange={(v) => updateAssetField("savingsAccount", v)}
              />
              <CurrencyInput
                label="Emergency Fund"
                value={form.assets.emergencyFund}
                onChange={(v) => updateAssetField("emergencyFund", v)}
              />
              <CurrencyInput
                label="Mutual Funds"
                value={form.assets.mutualFunds}
                onChange={(v) => updateAssetField("mutualFunds", v)}
              />
              <CurrencyInput
                label="PPF"
                value={form.assets.ppf}
                onChange={(v) => updateAssetField("ppf", v)}
              />
              <CurrencyInput
                label="NPS"
                value={form.assets.nps}
                onChange={(v) => updateAssetField("nps", v)}
              />
              <CurrencyInput
                label="FD"
                value={form.assets.fd}
                onChange={(v) => updateAssetField("fd", v)}
              />
              <CurrencyInput
                label="Gold"
                value={form.assets.gold}
                onChange={(v) => updateAssetField("gold", v)}
              />
              <CurrencyInput
                label="Property"
                value={form.assets.property}
                onChange={(v) => updateAssetField("property", v)}
              />
              <CurrencyInput
                label="Cash"
                value={form.assets.cash}
                onChange={(v) => updateAssetField("cash", v)}
              />
            </div>
          </SectionCard>

          {/* Section 7: Liabilities */}
          <SectionCard icon="📉" title="Liabilities" subtitle="Debt & loans" accent="rose">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <CurrencyInput
                label="Home Loan Outstanding"
                value={form.liabilities.homeLoanOutstanding}
                onChange={(v) => updateLiabilityField("homeLoanOutstanding", v)}
              />
              <CurrencyInput
                label="Vehicle Loan"
                value={form.liabilities.vehicleLoan}
                onChange={(v) => updateLiabilityField("vehicleLoan", v)}
              />
              <CurrencyInput
                label="Personal Loan"
                value={form.liabilities.personalLoan}
                onChange={(v) => updateLiabilityField("personalLoan", v)}
              />
              <CurrencyInput
                label="Other Loan"
                value={form.liabilities.otherLoan}
                onChange={(v) => updateLiabilityField("otherLoan", v)}
              />
            </div>
          </SectionCard>

          {/* Section 10: Decision Journal */}
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

          {/* Save button */}
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
