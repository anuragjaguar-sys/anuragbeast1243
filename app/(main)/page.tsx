"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/lib/profile/profile-context";
import { loadMonthlyReview, migrateToNewFormat } from "@/lib/storage";
import {
  formatINR,
  getFinancialMetrics,
  getAICFOInsights,
  calculateFinancialHealthScore,
} from "@/lib/financial-engine";
import { 
  getPortfolio, 
  getAssets, 
  getLiabilities, 
  runPortfolioMigration,
  getPortfolioSummary,
  getPortfolioInsights
} from "@/lib/investments";
import { getWealthMetrics } from "@/lib/wealth/wealth-engine";
import { 
  getRetirementProjection, 
  generateRetirementScenarios,
  DEFAULT_RETIREMENT_ASSUMPTIONS 
} from "@/lib/retirement/retirement-engine";
import { getGoals } from "@/lib/goals";

// Intelligence Engines
import { getCFOInsight } from "@/lib/intelligence/cfo-engine";
import { getDecisionPlan } from "@/lib/intelligence/decision-engine";
import { generateActions, getTopPriorityAction } from "@/lib/intelligence/action-engine";
import { getMonthlyCFOReview } from "@/lib/intelligence/monthly-cfo-engine";

// Components
import InvestmentPortfolioCard from "@/components/dashboard/InvestmentPortfolioCard";
import FinancialHealthCard from "@/components/dashboard/FinancialHealthCard";
import NetWorthTrendCard from "@/components/dashboard/NetWorthTrendCard";
import DebtOptimizerCard from "@/components/household/DebtOptimizerCard";
import ScenarioStressTestCard from "@/components/dashboard/ScenarioStressTestCard";
import LifeEventSimulatorCard from "@/components/dashboard/LifeEventSimulatorCard";
import FinancialDisciplineCard from "@/components/dashboard/FinancialDisciplineCard";
import RetirementCard from "@/components/dashboard/RetirementCard";
import CFOExecutivePlaybookCard from "@/components/dashboard/CFOExecutivePlaybookCard";
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
    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`h-5 w-5 text-zinc-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-emerald-400" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export default function Home() {
  const today = formatTodayDate();
  const { profile, isLoading: isProfileLoading } = useProfile();
  
  const [metrics, setMetrics] = useState<ReturnType<typeof getFinancialMetrics> | null>(null);
  const [goals, setGoals] = useState<ReturnType<typeof getGoals>>([]);
  const [aicfoInsights, setAicfoInsights] = useState<ReturnType<typeof getAICFOInsights> | null>(null);
  const [hasData, setHasData] = useState(false);

  // Dumb Component States
  const [wealthData, setWealthData] = useState<any>(null);
  const [retirementScenarios, setRetirementScenarios] = useState<any>(null);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [cfoData, setCfoData] = useState<any>(null);
  const [actionData, setActionData] = useState<any>(null);
  const [commandData, setCommandData] = useState<any>(null);
  const [monthlyReviewData, setMonthlyReviewData] = useState<any>(null);

  // Collapsible Section States
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    financialPosition: false,
    debtOptimizer: false,
    stressTest: false,
    discipline: false,
    goalsReview: false,
    healthIntelligence: false,
    commandCenter: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    migrateToNewFormat();
    runPortfolioMigration();

    const loadData = () => {
      const review = loadMonthlyReview();
      const financialMetrics = getFinancialMetrics();
      const canonicalPortfolio = getPortfolio();

      if (financialMetrics) {
        setMetrics(financialMetrics);

        // 1. Calculate Wealth Data
        const assets = getAssets(canonicalPortfolio);
        const liabilities = getLiabilities(canonicalPortfolio);
        const wealthMetrics = getWealthMetrics();
        setWealthData({ metrics: wealthMetrics, assets, liabilities });

        // 2. Calculate Portfolio Data
        const summary = getPortfolioSummary(canonicalPortfolio);
        const insights = getPortfolioInsights(canonicalPortfolio);
        setPortfolioData({ summary, insights });

        // 3. Calculate Health Data
        const emergencyAsset = canonicalPortfolio.find(
          (item) => item.type === "Asset" && item.name === "Emergency Fund"
        );
        const emergencyCurrent = emergencyAsset?.currentValue ?? 0;
        const emergencyProgress = Math.min(Math.round((emergencyCurrent / 600000) * 100), 100);
        
        let score = null;
        if (review) {
          try { score = calculateFinancialHealthScore(review); } catch {}
        }
        if (score === null && financialMetrics) {
          const proxy = Math.round(
            (financialMetrics.savingsRate * 1.5 + financialMetrics.investmentRate * 1.2 + emergencyProgress * 1.0) / 3
          );
          score = Math.min(Math.max(proxy, 0), 100);
        }
        
        setHealthData({
          score,
          emergencyProgress,
          fireProgress: financialMetrics.financialIndependenceProgress,
          netWorth: financialMetrics.netWorth,
          financialAssets: financialMetrics.financialAssets,
        });

        // 4. Monthly MoM Review Math
        try {
          const rawStorage = localStorage.getItem("fire54_monthly_reviews") || localStorage.getItem("fire54-monthly-reviews");
          let currentReview = review || { month: "August 2026", income: { salary: 250000 }, cashAllocation: { investments: 60000 } };
          let previousReview = { month: "July 2026", income: { salary: 250000 }, cashAllocation: { investments: 50000 } };

          if (rawStorage) {
            const parsed = JSON.parse(rawStorage);
            if (Array.isArray(parsed) && parsed.length >= 2) {
              currentReview = parsed[parsed.length - 1];
              previousReview = parsed[parsed.length - 2];
            } else if (Array.isArray(parsed) && parsed.length === 1) {
              currentReview = parsed[0];
            }
          }

          const currSalary = Number((currentReview as any)?.income?.salaryInHand || (currentReview as any)?.income?.salary || (currentReview as any)?.income || 250000);
          const currInvested = Number((currentReview as any)?.cashAllocation?.investments || (currentReview as any)?.investments || 60000);
          const currentInvRate = currSalary > 0 ? Number(((currInvested / currSalary) * 100).toFixed(1)) : 0;

          const prevSalary = Number((previousReview as any)?.income?.salaryInHand || (previousReview as any)?.income?.salary || (previousReview as any)?.income || 250000);
          const prevInvested = Number((previousReview as any)?.cashAllocation?.investments || (previousReview as any)?.investments || 50000);
          const prevInvRate = prevSalary > 0 ? Number(((prevInvested / prevSalary) * 100).toFixed(1)) : 0;
          const calculatedRateDelta = Number((currentInvRate - prevInvRate).toFixed(1));
          
          setMonthlyReviewData({
            currentMonth: currentReview?.month || "Current",
            currentInvRate,
            currentInvested: currInvested,
            prevMonth: previousReview?.month || "Prior",
            prevInvRate,
            prevInvested: prevInvested,
            rateDelta: calculatedRateDelta,
          });
        } catch {}
        
        setGoals(getGoals());
        setHasData(true);
      } else {
        setHasData(false);
      }
    };

    loadData();
  }, []);

  // Compute AI Intel and Scenarios once Profile is ready
  useEffect(() => {
    if (profile && hasData && metrics) {
      const canonicalPortfolio = getPortfolio();

      // Adapt profile data into retirement assumptions
      const retirementInputs: any = {
        ...DEFAULT_RETIREMENT_ASSUMPTIONS,
        currentAge: (profile as any)?.age || (profile as any)?.currentAge || DEFAULT_RETIREMENT_ASSUMPTIONS.currentAge,
        retirementAge: (profile as any)?.retirementAge || DEFAULT_RETIREMENT_ASSUMPTIONS.retirementAge,
        currentCorpus: metrics.financialAssets || 0,
        monthlyExpenses: (profile as any)?.monthlyExpenses || 50000,
        monthlySavings: (profile as any)?.monthlySavings || 20000,
        portfolio: canonicalPortfolio,
        profile,
      };
      
      const projection = getRetirementProjection(retirementInputs);
      const scenarios = generateRetirementScenarios({
        ...retirementInputs,
        projectedCorpus: (projection as any)?.projectedCorpus ?? 0,
        requiredCorpus: (projection as any)?.requiredCorpus ?? 0,
        yearsLeft: (projection as any)?.yearsLeft ?? 1,
      });
      setRetirementScenarios(scenarios);

      // Athena Intelligence
      const insight = getCFOInsight(profile);
      setCfoData(insight);

      const plan = getDecisionPlan(profile);
      const actionsList = generateActions(plan);
      const topPriority = getTopPriorityAction(actionsList);
      setActionData({ actions: actionsList, topAction: topPriority });

      const monthlyCFOReview = getMonthlyCFOReview(profile);
      
      setCommandData({
        plan: plan,
        score: metrics.fire54Score ?? 0,
        savings: metrics.savingsRate ?? 0,
        investments: metrics.investmentRate ?? 0,
        emergency: metrics.emergencyFundProgress ?? 0,
        review: monthlyCFOReview,
        topAction: topPriority,
        cfo: insight,
      });
    }
  }, [profile, hasData, metrics]);

  const kpiCards = metrics
    ? [
        { label: "Net Worth", value: formatINR(metrics.netWorth), accent: "emerald" as const, trend: "up" as const, subtext: "Calculated from assets" },
        { label: "Investment Rate", value: `${metrics.investmentRate}%`, accent: "blue" as const, subtext: "MoM Velocity Tracked" },
        { label: "FIRE54 Score", value: `${metrics.fire54Score}/100`, accent: "amber" as const, subtext: metrics.fire54Score >= 80 ? "Strong overall" : "Good progress" },
        { label: "Retirement Prob.", value: `${metrics.retirementScore}%`, accent: "violet" as const, subtext: metrics.retirementScore >= 75 ? "Target Secured" : "Building momentum" },
      ]
    : [];

  if (isProfileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0c] font-sans text-zinc-400">
        Initializing Command Center...
      </div>
    );
  }

  if (!hasData || !wealthData) {
    return (
      <div className="min-h-full bg-[#0a0a0c] font-sans text-zinc-100 p-12 text-center">
        <h2 className="text-xl font-semibold text-white mb-2">No financial data available yet</h2>
        <p className="text-zinc-400 mb-6">Complete your Monthly Entry to see your dashboard come to life.</p>
        <a href="/monthly-entry" className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white">Go to Monthly Entry</a>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#0a0a0c] font-sans text-zinc-100 selection:bg-emerald-500/30">
      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        
        {/* Header */}
        <header className="mb-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-zinc-800/60 pb-6">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
                <span className="font-mono text-sm font-bold text-black">54</span>
              </div>
              <p className="font-mono text-xs tracking-[0.3em] text-emerald-500/80 uppercase">Command Center OS</p>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              FIRE<span className="text-emerald-400">54</span>
            </h1>
            <p className="mt-1 text-base text-zinc-400">Personal Wealth Management System</p>
          </div>
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 px-5 py-3 shadow-inner">
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">As of today</p>
            <p className="mt-0.5 text-sm font-medium text-zinc-300">{today}</p>
          </div>
        </header>

        {/* TIER 1: COMMAND BAR */}
        <section className="mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => (
              card.label === "Net Worth" ? (
                <NetWorthCard 
                  key={card.label} 
                  metrics={wealthData.metrics} 
                  assets={wealthData.assets} 
                  liabilities={wealthData.liabilities} 
                />
              ) : (
                <div key={card.label} className={`rounded-2xl border bg-gradient-to-br ${accentRing[card.accent]} border-zinc-800/60 p-5 shadow-lg`}>
                  <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">{card.label}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-2xl font-bold text-white font-mono">{card.value}</p>
                    {card.accent === "emerald" && <UpArrow />}
                  </div>
                  <p className={`mt-2 text-xs ${accentText[card.accent]}`}>{card.subtext}</p>
                </div>
              )
            ))}
          </div>
        </section>

        {/* STRATEGIC ADVISORY: EXECUTIVE CFO PLAYBOOK */}
        <section className="mb-8">
          <CFOExecutivePlaybookCard statement={monthlyReviewData} />
        </section>

        {/* TIER 2: CORE WEALTH ENGINES */}
        <section className="mb-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <RetirementCard scenarios={retirementScenarios} />
          </div>
        </section>

        {/* DIRECT PLACEMENT: RETIREMENT GROWTH CHART & LIFE-EVENT MODELER */}
        <section className="mb-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <RetirementGrowthChart />
            <LifeEventSimulatorCard />
          </div>
        </section>

        {/* TIER 3: EXPANDABLE INTELLIGENCE TABS */}
        <div className="space-y-4 mt-6">

          {/* 1. Current Financial Position */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden transition-all">
            <button
              onClick={() => toggleSection("financialPosition")}
              className="w-full flex items-center justify-between p-5 text-left bg-zinc-950/60 hover:bg-zinc-900/80 transition"
            >
              <div>
                <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">Where am I?</span>
                <h3 className="text-lg font-semibold text-white">Current Financial Position Deep-Dive</h3>
              </div>
              <ChevronIcon isOpen={openSections.financialPosition} />
            </button>
            {openSections.financialPosition && (
              <div className="p-6 border-t border-zinc-800/60 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {healthData && (
                  <FinancialHealthCard 
                    score={healthData.score}
                    emergencyProgress={healthData.emergencyProgress}
                    fireProgress={healthData.fireProgress}
                    netWorth={healthData.netWorth}
                    financialAssets={healthData.financialAssets}
                  />
                )}
                {portfolioData && (
                  <InvestmentPortfolioCard 
                    summary={portfolioData.summary} 
                    insights={portfolioData.insights} 
                  />
                )}
              </div>
            )}
          </div>

          {/* 2. Debt vs Investing Optimizer */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden transition-all">
            <button
              onClick={() => toggleSection("debtOptimizer")}
              className="w-full flex items-center justify-between p-5 text-left bg-zinc-950/60 hover:bg-zinc-900/80 transition"
            >
              <div>
                <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">How do I leverage debt?</span>
                <h3 className="text-lg font-semibold text-white">Debt Paydown vs. Investing Optimizer</h3>
              </div>
              <ChevronIcon isOpen={openSections.debtOptimizer} />
            </button>
            {openSections.debtOptimizer && (
              <div className="p-6 border-t border-zinc-800/60">
                <DebtOptimizerCard />
              </div>
            )}
          </div>

          {/* 3. Scenario Stress Testing */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden transition-all">
            <button
              onClick={() => toggleSection("stressTest")}
              className="w-full flex items-center justify-between p-5 text-left bg-zinc-950/60 hover:bg-zinc-900/80 transition"
            >
              <div>
                <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">How resilient am I?</span>
                <h3 className="text-lg font-semibold text-white">Scenario Stress Testing & Modeler</h3>
              </div>
              <ChevronIcon isOpen={openSections.stressTest} />
            </button>
            {openSections.stressTest && (
              <div className="p-6 border-t border-zinc-800/60">
                <ScenarioStressTestCard />
              </div>
            )}
          </div>

          {/* 4. Financial Discipline */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden transition-all">
            <button
              onClick={() => toggleSection("discipline")}
              className="w-full flex items-center justify-between p-5 text-left bg-zinc-950/60 hover:bg-zinc-900/80 transition"
            >
              <div>
                <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">Am I protecting it?</span>
                <h3 className="text-lg font-semibold text-white">Financial Discipline & Risk Guards</h3>
              </div>
              <ChevronIcon isOpen={openSections.discipline} />
            </button>
            {openSections.discipline && (
              <div className="p-6 border-t border-zinc-800/60">
                <FinancialDisciplineCard />
              </div>
            )}
          </div>

          {/* 5. Goals & Monthly Review */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden transition-all">
            <button
              onClick={() => toggleSection("goalsReview")}
              className="w-full flex items-center justify-between p-5 text-left bg-zinc-950/60 hover:bg-zinc-900/80 transition"
            >
              <div>
                <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">What am I building?</span>
                <h3 className="text-lg font-semibold text-white">Goals Tracker & Monthly Accountability</h3>
              </div>
              <ChevronIcon isOpen={openSections.goalsReview} />
            </button>
            {openSections.goalsReview && (
              <div className="p-6 border-t border-zinc-800/60 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Goals Progress</h4>
                  {goals.map((goal) => (
                    <div key={goal.id} className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-200">{goal.title}</span>
                        <span className="font-mono text-white font-semibold">{goal.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${goal.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {monthlyReviewData && <AthenaMonthlyReviewCard reviewData={monthlyReviewData} />}
              </div>
            )}
          </div>

          {/* 6. Financial Health & AI Intelligence */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden transition-all">
            <button
              onClick={() => toggleSection("healthIntelligence")}
              className="w-full flex items-center justify-between p-5 text-left bg-zinc-950/60 hover:bg-zinc-900/80 transition"
            >
              <div>
                <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">Is it healthy?</span>
                <h3 className="text-lg font-semibold text-white">AI CFO Insights & Action Plan</h3>
              </div>
              <ChevronIcon isOpen={openSections.healthIntelligence} />
            </button>
            {openSections.healthIntelligence && (
              <div className="p-6 border-t border-zinc-800/60 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {cfoData && <AthenaCFOCard insight={cfoData} />}
                {actionData && <AthenaActionCard actions={actionData.actions} topAction={actionData.topAction} />}
              </div>
            )}
          </div>

          {/* 7. Athena Command Center */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden transition-all">
            <button
              onClick={() => toggleSection("commandCenter")}
              className="w-full flex items-center justify-between p-5 text-left bg-zinc-950/60 hover:bg-zinc-900/80 transition"
            >
              <div>
                <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">What should I do now?</span>
                <h3 className="text-lg font-semibold text-white">Athena Command Center Actions</h3>
              </div>
              <ChevronIcon isOpen={openSections.commandCenter} />
            </button>
            {openSections.commandCenter && (
              <div className="p-6 border-t border-zinc-800/60">
                {commandData && <AthenaCommandCenter commandData={commandData} />}
              </div>
            )}
          </div>

        </div>

        <footer className="mt-12 flex items-center justify-center gap-2 border-t border-zinc-800/40 pt-6 text-zinc-500 font-mono text-[10px] tracking-widest uppercase">
          FIRE54 · Personal Wealth Management · All figures in INR
        </footer>
      </main>
    </div>
  );
}