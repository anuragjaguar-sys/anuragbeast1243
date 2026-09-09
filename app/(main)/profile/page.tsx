"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  hasFinancialProfile,
  updateFinancialProfile,
} from "@/lib/profile/profile-engine";
import { FinancialProfile } from "@/lib/profile/profile.types";
import { initializePortfolioFromProfile } from "@/lib/investments";
import { useProfile } from "@/lib/profile/profile-context"; // 👈 1. Import our new context

type ProfileSectionKey =
  | "personal"
  | "income"
  | "assets"
  | "assumptions"
  | "goals"
  | "partner";

export default function ProfilePage() {
  // 👈 2. Call the Doorman
  const { profile: globalProfile, isLoading: isGlobalLoading, refreshProfile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [isPortfolioInitialized, setIsPortfolioInitialized] = useState(false);
  const [profile, setProfile] = useState<FinancialProfile | null>(null);

  useEffect(() => {
    async function initLocalState() {
      if (isGlobalLoading) return; // Wait for the Doorman to finish loading

      try {
        const hasProfile = typeof hasFinancialProfile === "function"
          ? await hasFinancialProfile()
          : await (hasFinancialProfile as any);

        setIsPortfolioInitialized(Boolean(hasProfile));
        
        if (globalProfile) {
          // 👈 3. Deep copy the global profile so we can edit it locally without mutating app state!
          setProfile(JSON.parse(JSON.stringify(globalProfile)));
        }
      } catch (err) {
        console.error("Failed to initialize profile page state:", err);
      } finally {
        setLoading(false);
      }
    }

    initLocalState();
  }, [isGlobalLoading, globalProfile]);

  function updateNumber<K extends ProfileSectionKey>(
    section: K,
    field: string,
    value: number
  ) {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: {
          ...(prev[section] as unknown as Record<string, unknown>),
          [field]: value,
        },
      };
    });
  }

  function updatePartnerField(field: string, value: string | number) {
    setProfile((prev) => {
      if (!prev) return prev;
      const currentPartner = prev.partner ?? {
        name: "Partner",
        currentAge: 35,
        retirementAge: 54,
        monthlySalary: 0,
        monthlyInvestment: 0,
        monthlyPension: 0,
        mutualFunds: 0,
        ppf: 0,
        epf: 0,
        nps: 0,
      };
      return {
        ...prev,
        partner: {
          ...currentPartner,
          [field]: value,
        },
      };
    });
  }

  async function saveProfile() {
    if (!profile) return;

    const isFirstSave = !isPortfolioInitialized;

    // Save to the database
    await updateFinancialProfile(profile);

    if (isFirstSave) {
      await initializePortfolioFromProfile();
      setIsPortfolioInitialized(true);
    }

    // 👈 4. Tell the Doorman to fetch the newly saved data so the rest of the app updates!
    await refreshProfile();

    alert("✅ Financial Profile Saved Successfully");
  }

  // 👈 5. Block the UI if either the global context OR the local state is loading
  if (loading || isGlobalLoading || !profile) {
    return (
      <div className="flex h-96 items-center justify-center text-zinc-400">
        Loading financial profile...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      <h1 className="mb-8 text-4xl font-bold text-white">
        👤 Financial Profile
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ===================== */}
        {/* PERSONAL */}
        {/* ===================== */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-6 text-xl font-semibold text-white">
            👤 Personal
          </h2>

          <Input
            label="Current Age"
            value={profile.personal.currentAge}
            onChange={(v) => updateNumber("personal", "currentAge", v)}
          />

          <Input
            label="Retirement Age"
            value={profile.personal.retirementAge}
            onChange={(v) => updateNumber("personal", "retirementAge", v)}
          />

          <Input
            label="Life Expectancy"
            value={profile.personal.lifeExpectancy}
            onChange={(v) => updateNumber("personal", "lifeExpectancy", v)}
          />
        </div>

        {/* ===================== */}
        {/* PARTNER / SPOUSE */}
        {/* ===================== */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-6 text-xl font-semibold text-white">
            👩‍❤️‍👨 Partner / Spouse Profile
          </h2>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-zinc-400">
              Partner Name
            </label>
            <input
              type="text"
              value={profile.partner?.name ?? "Partner"}
              onChange={(e) => updatePartnerField("name", e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </div>

          <Input
            label="Partner Monthly Salary (₹)"
            value={profile.partner?.monthlySalary ?? 0}
            onChange={(v) => updatePartnerField("monthlySalary", v)}
          />

          <Input
            label="Partner Monthly Investment (₹)"
            value={profile.partner?.monthlyInvestment ?? 0}
            onChange={(v) => updatePartnerField("monthlyInvestment", v)}
          />

          <Input
            label="Partner Mutual Funds (₹)"
            value={profile.partner?.mutualFunds ?? 0}
            onChange={(v) => updatePartnerField("mutualFunds", v)}
          />

          <Input
            label="Partner PPF + EPF + NPS (₹)"
            value={(profile.partner?.ppf ?? 0) + (profile.partner?.epf ?? 0) + (profile.partner?.nps ?? 0)}
            onChange={(v) => updatePartnerField("ppf", v)}
          />
        </div>

        {/* ===================== */}
        {/* INCOME */}
        {/* ===================== */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-6 text-xl font-semibold text-white">
            💼 Income
          </h2>

          <Input
            label="Monthly Salary"
            value={profile.income.monthlySalary}
            onChange={(v) => updateNumber("income", "monthlySalary", v)}
          />

          <Input
            label="Annual Increment (%)"
            value={profile.income.annualIncrement}
            onChange={(v) => updateNumber("income", "annualIncrement", v)}
          />

          <Input
            label="Monthly Pension"
            value={profile.income.monthlyPension}
            onChange={(v) => updateNumber("income", "monthlyPension", v)}
          />
        </div>

        {/* ===================== */}
        {/* ASSETS (Initial Setup vs Portfolio) */}
        {/* ===================== */}
        {!isPortfolioInitialized ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-6 text-xl font-semibold text-white">
              💰 Assets (Initial Setup)
            </h2>

            <Input
              label="Mutual Funds (₹)"
              value={profile.assets.mutualFunds}
              onChange={(v) => updateNumber("assets", "mutualFunds", v)}
            />

            <Input
              label="PPF (₹)"
              value={profile.assets.ppf}
              onChange={(v) => updateNumber("assets", "ppf", v)}
            />

            <Input
              label="EPF (₹)"
              value={profile.assets.epf}
              onChange={(v) => updateNumber("assets", "epf", v)}
            />

            <Input
              label="NPS (₹)"
              value={profile.assets.nps}
              onChange={(v) => updateNumber("assets", "nps", v)}
            />

            <Input
              label="Emergency Fund (₹)"
              value={profile.assets.emergencyFund}
              onChange={(v) => updateNumber("assets", "emergencyFund", v)}
            />

            <Input
              label="Cash / Savings (₹)"
              value={profile.assets.cash}
              onChange={(v) => updateNumber("assets", "cash", v)}
            />

            <Input
              label="Stocks (₹)"
              value={profile.assets.stocks}
              onChange={(v) => updateNumber("assets", "stocks", v)}
            />

            <Input
              label="Fixed Deposits (₹)"
              value={profile.assets.fd}
              onChange={(v) => updateNumber("assets", "fd", v)}
            />

            <Input
              label="Gold (₹)"
              value={profile.assets.gold}
              onChange={(v) => updateNumber("assets", "gold", v)}
            />

            <Input
              label="Property (₹)"
              value={profile.assets.property}
              onChange={(v) => updateNumber("assets", "property", v)}
            />
          </div>
        ) : (
          <PortfolioManagedCard />
        )}

        {/* ===================== */}
        {/* ASSUMPTIONS */}
        {/* ===================== */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-6 text-xl font-semibold text-white">
            📈 Assumptions
          </h2>

          <Input
            label="Equity Return (%)"
            value={profile.assumptions.equityReturn}
            onChange={(v) => updateNumber("assumptions", "equityReturn", v)}
          />

          <Input
            label="Debt Return (%)"
            value={profile.assumptions.debtReturn}
            onChange={(v) => updateNumber("assumptions", "debtReturn", v)}
          />

          <Input
            label="Inflation Rate (%)"
            value={profile.assumptions.inflationRate}
            onChange={(v) => updateNumber("assumptions", "inflationRate", v)}
          />

          <Input
            label="Withdrawal Rate (%)"
            value={profile.assumptions.withdrawalRate}
            onChange={(v) => updateNumber("assumptions", "withdrawalRate", v)}
          />

          <Input
            label="Annual SIP Increase (%)"
            value={profile.assumptions.sipIncrease}
            onChange={(v) => updateNumber("assumptions", "sipIncrease", v)}
          />
        </div>

        {/* ===================== */}
        {/* GOALS */}
        {/* ===================== */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-6 text-xl font-semibold text-white">
            🎯 Goals
          </h2>

          <Input
            label="Desired Monthly Retirement Income (₹)"
            value={profile.goals.desiredMonthlyRetirementIncome}
            onChange={(v) =>
              updateNumber("goals", "desiredMonthlyRetirementIncome", v)
            }
          />

          <Input
            label="Annual Travel Budget (₹)"
            value={profile.goals.annualTravelBudget}
            onChange={(v) => updateNumber("goals", "annualTravelBudget", v)}
          />

          <Input
            label="Emergency Fund (Months)"
            value={profile.goals.emergencyFundMonths}
            onChange={(v) => updateNumber("goals", "emergencyFundMonths", v)}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={saveProfile}
          className="rounded-xl bg-emerald-500 px-8 py-3 font-semibold text-black transition hover:bg-emerald-400"
        >
          💾 Save Financial Profile
        </button>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-4">
      <label className="mb-2 block text-sm font-medium text-zinc-400">
        {label}
      </label>

      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
      />
    </div>
  );
}

function PortfolioManagedCard() {
  return (
    <div className="rounded-2xl border border-blue-500/40 bg-zinc-900 p-6">
      <h2 className="mb-3 text-xl font-semibold text-white">
        💼 Assets & Liabilities Managed in Portfolio
      </h2>
      <p className="mb-5 text-sm text-zinc-400">
        Your portfolio is now the single source of truth for assets and liabilities (including home loans). Manage those values inside the Portfolio module.
      </p>
      <Link
        href="/portfolio"
        className="inline-flex rounded-xl bg-blue-500 px-4 py-2 font-semibold text-white transition hover:bg-blue-400"
      >
        Open Portfolio
      </Link>
    </div>
  );
}