"use client";

import { getPortfolio, getPortfolioSummary } from "@/lib/investments";
import { getRetirementProjection, /* re-exported functions if needed */ } from "@/lib/retirement/retirement-engine";
import { getRetirementAssumptionsFromProfile } from "@/lib/profile/profile-retirement-adapter";

export default function RetirementIntelligenceCard() {
  const portfolio = getPortfolio();
  const summary = getPortfolioSummary(portfolio);
  const projection = getRetirementProjection();
  const assumptions = getRetirementAssumptionsFromProfile();

  // Derive funding gap / surplus using projection outputs
  const projectedCorpus = projection.projectedCorpus ?? 0;
  const requiredCorpus = projection.requiredCorpus ?? 0;
  const yearsLeft = projection.yearsLeft ?? 0;
  const desiredMonthlyIncome = assumptions.desiredMonthlyIncome ?? 0;
  const monthlyPension = assumptions.monthlyPension ?? 0;
  const currentCorpus = projection.currentCorpus ?? 0;
  const fundingGap = requiredCorpus - projectedCorpus;

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
      <div className="mb-3">
        <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">Retirement Intelligence</p>
        <h3 className="mt-1 text-lg font-semibold text-white">Retirement Insights</h3>
      </div>

      <div className="text-sm text-zinc-300 space-y-3">
        <div>
          <div className="text-xs text-zinc-500">Projected corpus at retirement</div>
          <div className="mt-1 font-semibold text-white">₹{projectedCorpus.toLocaleString("en-IN")}</div>
        </div>

        <div>
          <div className="text-xs text-zinc-500">Required retirement corpus</div>
          <div className="mt-1 font-semibold text-white">₹{requiredCorpus.toLocaleString("en-IN")}</div>
        </div>

        <div>
          <div className="text-xs text-zinc-500">Years to retirement</div>
          <div className="mt-1 font-semibold text-white">{yearsLeft}</div>
        </div>

        <div>
          <div className="text-xs text-zinc-500">Desired monthly retirement income</div>
          <div className="mt-1 text-sm text-zinc-300">₹{desiredMonthlyIncome.toLocaleString("en-IN")}</div>
        </div>

        <div>
          <div className="text-xs text-zinc-500">Current retirement corpus</div>
          <div className="mt-1 text-sm text-zinc-300">₹{currentCorpus.toLocaleString("en-IN")}</div>
        </div>

        <div>
          <div className="text-xs text-zinc-500">Monthly pension</div>
          <div className="mt-1 text-sm text-zinc-300">₹{monthlyPension.toLocaleString("en-IN")}</div>
        </div>

        <div>
          <div className="text-xs text-zinc-500">Funding gap / surplus</div>
          <div className={`mt-1 font-semibold ${fundingGap > 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {fundingGap > 0 ? `₹${fundingGap.toLocaleString("en-IN")} gap` : `Surplus ₹${Math.abs(fundingGap).toLocaleString("en-IN")}`}
          </div>
        </div>
      </div>
    </div>
  );
}
