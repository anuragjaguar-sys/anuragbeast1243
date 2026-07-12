"use client";

import { useEffect, useState } from "react";
import PieChart from "@/components/spending-analytics/PieChart";
import {
  categorySpendingPercent,
  formatINR,
  getSpendingAnalytics,
  type SpendingAnalyticsResult,
} from "@/lib/spending-analytics";

const accentRing: Record<string, string> = {
  rose: "from-rose-500/20 to-transparent border-rose-500/20",
  blue: "from-blue-500/20 to-transparent border-blue-500/20",
  emerald: "from-emerald-500/20 to-transparent border-emerald-500/20",
  violet: "from-violet-500/20 to-transparent border-violet-500/20",
};

const accentText: Record<string, string> = {
  rose: "text-rose-400",
  blue: "text-blue-400",
  emerald: "text-emerald-400",
  violet: "text-violet-400",
};

function KpiCard({
  label,
  value,
  subtext,
  accent,
}: {
  label: string;
  value: string;
  subtext: string;
  accent: keyof typeof accentRing;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${accentRing[accent]} border-zinc-800/60 p-5 transition-all duration-300 hover:border-zinc-700/80 hover:shadow-lg hover:shadow-black/20`}
    >
      <div className="absolute inset-0 bg-zinc-900/60" />
      <div className="relative">
        <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{value}</p>
        <p className={`mt-2 text-xs ${accentText[accent]}`}>{subtext}</p>
      </div>
    </div>
  );
}

export default function SpendingAnalyticsView() {
  const [result, setResult] = useState<SpendingAnalyticsResult | null>(null);

  useEffect(() => {
    setResult(getSpendingAnalytics());
  }, []);

  if (!result) return null;

  const { data, source } = result;
  const categories =
    data.expenseCategories.length > 0
      ? data.expenseCategories
      : [
          { id: "empty", category: "No expenses", amount: 1, color: "#3f3f46" },
        ];

  return (
    <div className="min-h-full bg-[#0a0a0c] font-sans text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-[500px] w-[500px] rounded-full bg-violet-500/[0.04] blur-[120px]" />
        <div className="absolute top-1/2 right-0 h-[400px] w-[400px] rounded-full bg-rose-500/[0.03] blur-[100px]" />
      </div>

      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl ring-1 ring-violet-500/20">
                💳
              </div>
              <div>
                <p className="font-mono text-xs tracking-[0.25em] text-zinc-500 uppercase">
                  Cash Flow Analysis
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Spending Analytics
                </h1>
              </div>
            </div>
            <p className="max-w-2xl text-base leading-relaxed text-zinc-400">
              Breakdown of monthly spending, investments, and savings efficiency for{" "}
              <span className="text-zinc-300">{data.monthLabel}</span>.
            </p>
          </div>

          <div
            className={`shrink-0 rounded-xl border px-4 py-2.5 ${
              source === "monthly-review"
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-zinc-800/80 bg-zinc-900/50"
            }`}
          >
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Data Source
            </p>
            <p
              className={`mt-0.5 text-sm font-medium ${
                source === "monthly-review" ? "text-emerald-400" : "text-zinc-400"
              }`}
            >
              {source === "monthly-review" ? "Monthly Review" : "Sample Data"}
            </p>
          </div>
        </header>

        {/* KPI Cards */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total Monthly Spending"
            value={formatINR(data.totalMonthlySpending)}
            subtext="All expense categories"
            accent="rose"
          />
          <KpiCard
            label="Total Investments"
            value={formatINR(data.totalInvestments)}
            subtext="PPF, SIP, NPS & more"
            accent="blue"
          />
          <KpiCard
            label="Savings Rate"
            value={`${data.savingsRate}%`}
            subtext="Income retained after expenses"
            accent="emerald"
          />
          <KpiCard
            label="Investment Rate"
            value={`${data.investmentRate}%`}
            subtext="Portion of income invested"
            accent="violet"
          />
        </section>

        {/* Pie Chart */}
        <section className="mb-8 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm sm:p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Spending by Category</h2>
              <p className="mt-0.5 font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
                Expense distribution
              </p>
            </div>
            <span className="rounded-lg bg-zinc-800/80 px-2.5 py-1 font-mono text-xs text-zinc-400">
              {data.expenseCategories.length} categories
            </span>
          </div>
          <PieChart categories={categories} />
        </section>

        {/* Expense Table */}
        <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm">
          <div className="border-b border-zinc-800/60 px-6 py-5 sm:px-8">
            <h2 className="text-lg font-semibold text-white">Expense Breakdown</h2>
            <p className="mt-0.5 font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
              Category · Amount · Share of spending
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-zinc-800/40">
                  <th className="px-6 py-4 text-left font-mono text-[11px] tracking-wider text-zinc-500 uppercase sm:px-8">
                    Category
                  </th>
                  <th className="px-6 py-4 text-right font-mono text-[11px] tracking-wider text-zinc-500 uppercase sm:px-8">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-right font-mono text-[11px] tracking-wider text-zinc-500 uppercase sm:px-8">
                    % of Spending
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.expenseCategories.map((cat, index) => {
                  const percent = categorySpendingPercent(
                    cat.amount,
                    data.totalMonthlySpending
                  );
                  return (
                    <tr
                      key={cat.id}
                      className={`border-b border-zinc-800/30 transition-colors hover:bg-zinc-800/20 ${
                        index === data.expenseCategories.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <td className="px-6 py-4 sm:px-8">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-sm font-medium text-zinc-200">{cat.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-sm text-white sm:px-8">
                        {formatINR(cat.amount)}
                      </td>
                      <td className="px-6 py-4 text-right sm:px-8">
                        <div className="flex items-center justify-end gap-3">
                          <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800 sm:block">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percent}%`,
                                backgroundColor: cat.color,
                              }}
                            />
                          </div>
                          <span className="w-12 font-mono text-sm text-zinc-400">{percent}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-800/60 bg-zinc-900/60">
                  <td className="px-6 py-4 text-sm font-semibold text-white sm:px-8">Total</td>
                  <td className="px-6 py-4 text-right font-mono text-sm font-semibold text-white sm:px-8">
                    {formatINR(data.totalMonthlySpending)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm font-semibold text-zinc-400 sm:px-8">
                    100%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <footer className="mt-8 flex items-center justify-center border-t border-zinc-800/40 pt-6">
          <span className="font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
            FIRE54 · Spending Analytics · All figures in INR
          </span>
        </footer>
      </main>
    </div>
  );
}
