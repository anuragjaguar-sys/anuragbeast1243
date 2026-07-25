"use client";

import { useState } from "react";
import {
  getFinancialProfile,
  updateFinancialProfile,
} from "@/lib/profile/profile-engine";
import { FinancialProfile } from "@/lib/profile/profile.types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<FinancialProfile>(
    getFinancialProfile()
  );

  function updateNumber(
    section: keyof FinancialProfile,
    field: string,
    value: number
  ) {
    setProfile((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  }

  function saveProfile() {
    console.log("=== Profile being saved ===");
console.log(profile);
console.log(profile.assumptions);updateFinancialProfile(profile);
    alert("✅ Financial Profile Saved Successfully");
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
            onChange={(v) =>
              updateNumber("personal", "currentAge", v)
            }
          />

          <Input
            label="Retirement Age"
            value={profile.personal.retirementAge}
            onChange={(v) =>
              updateNumber("personal", "retirementAge", v)
            }
          />

          <Input
            label="Life Expectancy"
            value={profile.personal.lifeExpectancy}
            onChange={(v) =>
              updateNumber("personal", "lifeExpectancy", v)
            }
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
            onChange={(v) =>
              updateNumber("income", "monthlySalary", v)
            }
          />

          <Input
            label="Annual Increment (%)"
            value={profile.income.annualIncrement}
            onChange={(v) =>
              updateNumber("income", "annualIncrement", v)
            }
          />

          <Input
            label="Monthly Pension"
            value={profile.income.monthlyPension}
            onChange={(v) =>
              updateNumber("income", "monthlyPension", v)
            }
          />
        </div>
                {/* ===================== */}
        {/* ASSETS */}
        {/* ===================== */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-6 text-xl font-semibold text-white">
            💰 Assets
          </h2>

          <Input
            label="Mutual Funds (₹)"
            value={profile.assets.mutualFunds}
            onChange={(v) =>
              updateNumber("assets", "mutualFunds", v)
            }
          />

          <Input
            label="PPF (₹)"
            value={profile.assets.ppf}
            onChange={(v) =>
              updateNumber("assets", "ppf", v)
            }
          />

          <Input
            label="EPF (₹)"
            value={profile.assets.epf}
            onChange={(v) =>
              updateNumber("assets", "epf", v)
            }
          />

          <Input
            label="NPS (₹)"
            value={profile.assets.nps}
            onChange={(v) =>
              updateNumber("assets", "nps", v)
            }
          />

          <Input
            label="Emergency Fund (₹)"
            value={profile.assets.emergencyFund}
            onChange={(v) =>
              updateNumber("assets", "emergencyFund", v)
            }
          />

          <Input
            label="Cash / Savings (₹)"
            value={profile.assets.cash}
            onChange={(v) =>
              updateNumber("assets", "cash", v)
            }
          />
        </div>

        {/* ===================== */}
        {/* LIABILITIES */}
        {/* ===================== */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-6 text-xl font-semibold text-white">
            🏦 Liabilities
          </h2>

          <Input
            label="Home Loan Outstanding (₹)"
            value={profile.liabilities.homeLoanOutstanding}
            onChange={(v) =>
              updateNumber(
                "liabilities",
                "homeLoanOutstanding",
                v
              )
            }
          />

          <Input
            label="Other Loans (₹)"
            value={profile.liabilities.otherLoans}
            onChange={(v) =>
              updateNumber(
                "liabilities",
                "otherLoans",
                v
              )
            }
          />
        </div>
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
            onChange={(v) =>
              updateNumber("assumptions", "equityReturn", v)
            }
          />

          <Input
            label="Debt Return (%)"
            value={profile.assumptions.debtReturn}
            onChange={(v) =>
              updateNumber("assumptions", "debtReturn", v)
            }
          />

          <Input
            label="Inflation Rate (%)"
            value={profile.assumptions.inflationRate}
            onChange={(v) =>
              updateNumber("assumptions", "inflationRate", v)
            }
          />

          <Input
            label="Withdrawal Rate (%)"
            value={profile.assumptions.withdrawalRate}
            onChange={(v) =>
              updateNumber("assumptions", "withdrawalRate", v)
            }
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
              updateNumber(
                "goals",
                "desiredMonthlyRetirementIncome",
                v
              )
            }
          />

          <Input
            label="Annual Travel Budget (₹)"
            value={profile.goals.annualTravelBudget}
            onChange={(v) =>
              updateNumber(
                "goals",
                "annualTravelBudget",
                v
              )
            }
          />

          <Input
            label="Emergency Fund (Months)"
            value={profile.goals.emergencyFundMonths}
            onChange={(v) =>
              updateNumber(
                "goals",
                "emergencyFundMonths",
                v
              )
            }
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