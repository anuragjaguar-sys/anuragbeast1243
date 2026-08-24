"use client";

import { useEffect, useState } from "react";
import { loadMonthlyReview, migrateToNewFormat } from "@/lib/storage";
import {
  formatINR,
  getFinancialMetrics,
  getPortfolioAllocation,
  getAICFOInsights,
} from "@/lib/financial-engine";
import { getPortfolio, runPortfolioMigration } from "@/lib/investments";
import InvestmentPortfolioCard from "@/components/dashboard/InvestmentPortfolioCard";
import RetirementIntelligenceCard from "@/components/dashboard/RetirementIntelligenceCard";
import FinancialHealthCard from "@/components/dashboard/FinancialHealthCard";

import {
  getGoals,
} from "@/lib/goals";
import type { MonthlyFinancialStatement } from "@/lib/monthly-review";
import FinancialDisciplineCard from "@/components/dashboard/FinancialDisciplineCard";
import RetirementCard from "@/components/dashboard/RetirementCard";
import RetirementGrowthChart from "@/components/dashboard/RetirementGrowthChart";
import NetWorthCard from "@/components/dashboard/NetWorthCard";
import AthenaCFOCard from "@/components/dashboard/AthenaCFOCard";
import AthenaActionCard from "@/components/dashboard/AthenaActionCard";
import AthenaMonthlyReviewCard from "@/components/dashboard/AthenaMonthlyReviewCard";
import AthenaCommandCenter from "@/components/dashboard/AthenaCommandCenter";
function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const accentRing: Record<string, string> = {
  emerald: "from-emerald-500/20 to-transparent border-emerald-500/20",
  blue: "from-blue-500/20 to-transparent border-blue-500/20",
  violet: "from-violet-500/20 to-transparent border-violet-500/20",
  amber: "from-amber-500/20 to-transparent border-amber-500/20",
};

const accentText: Record<string, string> = {
  emerald: "text-emerald-400",
  blue: "text-blue-400",
  violet: "text-violet-400",
  amber: "text-amber-400",
};

function UpArrow() {
  return (
    <svg
      className="h-4 w-4 text-emerald-400"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
      />
    </svg>
  );
}

function DashboardSectionHeading({
  question,
  title,
}: {
  question: string;
  title: string;
}) {
  return (
    <div className="mb-4">
      <p className="font-mono text-[10px] tracking-[0.22em] text-emerald-500/80 uppercase">
        {question}
      </p>
      <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
    </div>
  );
}

export default function Home() {
  const today = formatTodayDate();
  const [metrics, setMetrics] = useState<ReturnType<typeof getFinancialMetrics> | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<ReturnType<typeof getPortfolioAllocation>>([]);
  const [goals, setGoals] =
useState<ReturnType<typeof getGoals>>([]);
  const [aicfoInsights, setAicfoInsights] = useState<ReturnType<typeof getAICFOInsights> | null>(null);
  const [hasData, setHasData] = useState(false);

useEffect(() => {
  // Run one-time migration on app load
  migrateToNewFormat();
runPortfolioMigration();

const loadData = () => {
    const review = loadMonthlyReview();

    // Financial metrics now come from:
    // Profile baseline + financial engine
    const financialMetrics = getFinancialMetrics();


if (financialMetrics) {
      setMetrics(financialMetrics);

      // Use canonical portfolio as the source of truth for dashboard allocation
      const canonicalPortfolio = getPortfolio();

      // Map PortfolioItem[] -> PortfolioAllocation[] shape expected by the dashboard
      const mapped = canonicalPortfolio.map((p) => {
        const isLiability = p.type === "Liability";
        // assetClass exists only on assets
        const assetClass = !isLiability && (p as any).assetClass ? (p as any).assetClass : undefined;
        return {
          name: p.name,
          amount: (p.currentValue as number) || 0,
          value: (p.currentValue as number) || 0,
          color:
            assetClass === "Equity"
              ? "bg-blue-500"
              : assetClass === "Debt"
              ? "bg-emerald-500"
              : assetClass === "Cash"
              ? "bg-amber-500"
              : assetClass === "Alternative"
              ? "bg-indigo-500"
              : isLiability
              ? "bg-rose-500"
              : "bg-zinc-500",
          liability: isLiability,
        };
      });

      setPortfolioItems(mapped);

      // AI CFO still needs a monthly statement for some insights
      if (review) {
        setAicfoInsights(getAICFOInsights(review));
      } else {
        setAicfoInsights(null);
      }

      // Goals come from Goal Engine
      setGoals(getGoals());

      setHasData(true);
    } else {
      setMetrics(null);
      setPortfolioItems([]);
      setAicfoInsights(null);
      setGoals([]);
      setHasData(false);
    }
  };

  // Initial load
  loadData();

  // Refresh when Profile or Monthly Entry changes
  const handleStorageChange = (e: StorageEvent) => {
    if (
      e.key === "fire54_monthly_reviews" ||
      e.key === "fire54-financial-profile"
    ) {
      loadData();
    }
  };

  // Refresh when returning to the Dashboard
  const handleFocus = () => {
    loadData();
  };

  window.addEventListener(
    "storage",
    handleStorageChange
  );

  window.addEventListener(
    "focus",
    handleFocus
  );

  return () => {
    window.removeEventListener(
      "storage",
      handleStorageChange
    );

    window.removeEventListener(
      "focus",
      handleFocus
    );
  };
}, []);

  const kpiCards = metrics
    ? [
        {
          label: "Net Worth",
          value: formatINR(metrics.netWorth),
          accent: "emerald" as const,
          trend: "up" as const,
          subtext: "Calculated from assets",
        },
        {
          label: "Financial Assets",
          value: formatINR(metrics.financialAssets),
          accent: "blue" as const,
          subtext: "Liquid + invested",
        },
        {
          label: "Retirement Score",
          value: `${metrics.retirementScore}%`,
          accent: "violet" as const,
          subtext: metrics.retirementScore >= 80 ? "On track for FIRE" : "Building momentum",
        },
        {
          label: "FIRE54 Score",
          value: `${metrics.fire54Score}/100`,
          accent: "amber" as const,
          subtext: metrics.fire54Score >= 80 ? "Strong overall" : "Good progress",
        },
      ]
    : [];

  const performanceKPIs = metrics
    ? [
        {
          label: "Savings Rate",
          value: `${metrics.savingsRate}%`,
          accent: "emerald" as const,
          subtext: "Income saved",
        },
        {
          label: "Investment Rate",
          value: `${metrics.investmentRate}%`,
          accent: "blue" as const,
          subtext: "Income invested",
        },
        {
          label: "Expense Ratio",
          value: metrics.expenseRatio ? `${metrics.expenseRatio}%` : "N/A",
          accent: "rose" as const,
          subtext: "Income spent",
        },
        {
          label: "Debt Ratio",
          value: metrics.debtRatio ? `${metrics.debtRatio}%` : "N/A",
          accent: "amber" as const,
          subtext: "Liabilities / Assets",
        },
        {
          label: "Emergency Fund",
          value: `${metrics.emergencyFundProgress}%`,
          accent: "violet" as const,
          subtext: "Target: ₹6L",
        },
        {
          label: "FIRE Progress",
          value: metrics.financialIndependenceProgress ? `${metrics.financialIndependenceProgress}%` : "N/A",
          accent: "emerald" as const,
          subtext: "Target: ₹5Cr",
        },
      ]
    : [];

  const maxPortfolio = portfolioItems.length > 0 ? Math.max(...portfolioItems.map((i) => i.value)) : 1;

  if (!hasData) {
    return (
      <div className="min-h-full bg-[#0a0a0c] font-sans text-zinc-100">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
          <div className="absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-blue-500/[0.03] blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-[300px] w-[600px] rounded-full bg-violet-500/[0.03] blur-[100px]" />
        </div>

        <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
                  <span className="font-mono text-sm font-bold text-black">54</span>
                </div>
                <p className="font-mono text-xs tracking-[0.3em] text-emerald-500/80 uppercase">
                  Live Dashboard
                </p>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                FIRE<span className="text-emerald-400">54</span>
              </h1>
              <p className="mt-1 text-base text-zinc-400">
                Personal Wealth Management System
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 px-5 py-3 backdrop-blur-sm">
              <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                As of today
              </p>
              <p className="mt-0.5 text-sm font-medium text-zinc-300">{today}</p>
            </div>
          </header>

          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-12 backdrop-blur-sm text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/80 mx-auto">
              <span className="text-3xl">📊</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No financial data available yet</h2>
            <p className="text-zinc-400 mb-6">
              Complete your Monthly Entry to see your financial dashboard come to life.
            </p>
            <a
              href="/monthly-entry"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/30"
            >
              Go to Monthly Entry
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#0a0a0c] font-sans text-zinc-100">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
        <div className="absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-blue-500/[0.03] blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[600px] rounded-full bg-violet-500/[0.03] blur-[100px]" />
      </div>

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
                <span className="font-mono text-sm font-bold text-black">54</span>
              </div>
              <p className="font-mono text-xs tracking-[0.3em] text-emerald-500/80 uppercase">
                Live Dashboard
              </p>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              FIRE<span className="text-emerald-400">54</span>
            </h1>
            <p className="mt-1 text-base text-zinc-400">
              Personal Wealth Management System
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 px-5 py-3 backdrop-blur-sm">
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              As of today
            </p>
            <p className="mt-0.5 text-sm font-medium text-zinc-300">{today}</p>
          </div>
        </header>



        <section className="mb-8">
          <DashboardSectionHeading question="Where am I?" title="Current Financial Position" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => (
            card.label === "Net Worth" ? (
              <NetWorthCard key={card.label} />
            ) : (
              <div
                key={card.label}
                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${accentRing[card.accent]} border-zinc-800/60 p-5 transition-all duration-300 hover:border-zinc-700/80 hover:shadow-lg hover:shadow-black/20`}
              >
                <div className="absolute inset-0 bg-zinc-900/60" />
                <div className="relative">
                  <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
                    {card.label}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                      {card.value}
                    </p>
                    {card.trend === "up" && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                        <UpArrow />
                      </span>
                    )}
                  </div>
                  <p className={`mt-2 text-xs ${accentText[card.accent]}`}>{card.subtext}</p>
                </div>
              </div>
            )
            ))}
          </div>
        </section>

        <section className="mb-8">
          <DashboardSectionHeading question="Where am I going?" title="Retirement" />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <RetirementCard />
            <RetirementGrowthChart />
          </div>
        </section>

        <section className="mb-8">
          <DashboardSectionHeading question="Am I protecting it?" title="Financial Discipline" />
          <FinancialDisciplineCard />
        </section>

        <section className="mb-8">
          <DashboardSectionHeading question="What am I building?" title="Goals & Monthly Review" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Goals</h2>
              <p className="mt-0.5 font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
                Progress tracker
              </p>
            </div>

            {goals.map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-200">
                    {goal.title}
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-zinc-500">
                      {formatINR(goal.currentAmount)}
                    </span>

                    <span
                      className={`font-mono text-sm font-semibold ${
                        goal.progress === 100
                          ? "text-emerald-400"
                          : "text-white"
                      }`}
                    >
                      {goal.progress}%
                    </span>
                  </div>
                </div>

                <div className="relative h-2.5 overflow-hidden rounded-full bg-zinc-800/80">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
                      goal.status === "Completed"
                        ? "bg-emerald-500"
                        : goal.status === "On Track"
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        Math.max(goal.progress || 0, 0),
                        100
                      )}%`,
                    }}
                  />

                  {goal.progress === 100 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  )}
                </div>

                <p className="mt-1 font-mono text-[10px] text-zinc-600">
                  Target: {formatINR(goal.targetAmount)}
                </p>
              </div>
            ))}
            </div>
            <AthenaMonthlyReviewCard />
          </div>
        </section>

        <section className="mb-8">
          <DashboardSectionHeading question="Is it healthy?" title="Financial Health & Intelligence" />
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
            <FinancialHealthCard />
            <InvestmentPortfolioCard />
            <RetirementIntelligenceCard />
            <AthenaCFOCard />
            <AthenaActionCard />
          </div>
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Portfolio Allocation</h3>
                <p className="mt-0.5 font-mono text-[11px] text-zinc-500 uppercase tracking-wider">Asset breakdown</p>
              </div>
              <span className="rounded-lg bg-zinc-800/80 px-2.5 py-1 font-mono text-xs text-zinc-400">{portfolioItems.length} holdings</span>
            </div>
            <div className="space-y-4">
              {portfolioItems.map((item) => (
                <div key={item.name}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2 w-2 rounded-full ${item.color}`} />
                      <span className="text-sm text-zinc-300">{item.name}</span>
                      {item.liability && <span className="rounded bg-rose-500/10 px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-rose-400 uppercase ring-1 ring-rose-500/20">Liability</span>}
                    </div>
                    <span className="font-mono text-sm font-medium text-white">{formatINR(item.amount)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800/80"><div className={`h-full rounded-full ${item.color} opacity-80 transition-all duration-700`} style={{ width: `${(item.value / maxPortfolio) * 100}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex h-3 overflow-hidden rounded-full">
              {portfolioItems.filter((i) => !i.liability).map((item) => (
                <div key={item.name} className={`${item.color} opacity-70`} style={{ width: `${(item.value / portfolioItems.filter((i) => !i.liability).reduce((sum, item) => sum + item.value, 0)) * 100}%` }} />
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] text-zinc-600">Net assets excluding liabilities · {formatINR(portfolioItems.filter((i) => !i.liability).reduce((sum, item) => sum + item.amount, 0))} total allocation</p>
          </div>
        </section>

        <section className="mb-8">
          <DashboardSectionHeading question="What should I do now?" title="Athena Command Center" />
          <AthenaCommandCenter />
        </section>

        <section className="mb-8">
          <DashboardSectionHeading question="AI CFO" title="Your Financial Advisory" />
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-emerald-950/20 p-6 sm:p-8 backdrop-blur-sm">
            {/* Decorative grid */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            <div className="relative">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                  <SparkIcon />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">AI CFO</h2>
                  <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
                    Intelligent financial advisory
                  </p>
                </div>
                <div className="ml-auto hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 ring-1 ring-emerald-500/20 sm:flex">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="font-mono text-[10px] tracking-wider text-emerald-400 uppercase">
                    Active
                  </span>
                </div>
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="text-sm text-zinc-400">Overall Financial Health</span>
                <span className={`rounded-lg px-4 py-1.5 font-mono text-sm font-semibold tracking-wide ring-1 ${
                  aicfoInsights?.overallHealth === "Excellent" ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25" :
                  aicfoInsights?.overallHealth === "Good" ? "bg-blue-500/15 text-blue-400 ring-blue-500/25" :
                  aicfoInsights?.overallHealth === "Fair" ? "bg-amber-500/15 text-amber-400 ring-amber-500/25" :
                  "bg-rose-500/15 text-rose-400 ring-rose-500/25"
                }`}>
                  {aicfoInsights?.overallHealth || "N/A"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
                  <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
                    Biggest Strength
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-emerald-300">
                    {aicfoInsights?.biggestStrength || "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
                  <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
                    Biggest Risk
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-rose-300">
                    {aicfoInsights?.biggestRisk || "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:col-span-1">
                  <p className="font-mono text-[10px] tracking-wider text-emerald-600/80 uppercase">
                    Recommendation
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                    {aicfoInsights?.recommendation || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {performanceKPIs.length > 0 && (
          <section className="mb-8 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
            <DashboardSectionHeading question="Performance Metrics" title="Financial Health Indicators" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {performanceKPIs.map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
                  <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">{kpi.label}</p>
                  <p className={`mt-2 text-lg font-semibold ${accentText[kpi.accent]}`}>{kpi.value}</p>
                  <p className="mt-1 text-[10px] text-zinc-600">{kpi.subtext}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        {/* Footer ticker */}
        <footer className="mt-8 flex items-center justify-center gap-2 border-t border-zinc-800/40 pt-6">
          <span className="font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
            FIRE54 · Personal Wealth Management · All figures in INR
          </span>
        </footer>
      </main>
    </div>
  );
}
