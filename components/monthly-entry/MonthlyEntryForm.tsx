"use client";

import { useEffect, useState, useRef } from "react";
import {
  getMonthLabel,
  INITIAL_MONTHLY_REVIEW,
  type MonthlyReviewFormData,
} from "@/lib/monthly-review";
import { loadMonthlyReview, saveMonthlyReview } from "@/lib/storage";

function CurrencyField({
  label,
  name,
  value,
  onChange,
  placeholder = "0",
}: {
  label: string;
  name: keyof MonthlyReviewFormData;
  value: string;
  onChange: (name: keyof MonthlyReviewFormData, value: string) => void;
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
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
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

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3.5">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-emerald-500" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function SuccessNotification({ visible }: { visible: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-5 py-3.5 shadow-lg shadow-emerald-500/10 backdrop-blur-sm transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
      }`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm text-white">
        ✓
      </span>
      <span className="text-sm font-medium text-emerald-300">
        Monthly Review Saved Successfully.
      </span>
    </div>
  );
}

function confidenceLabel(value: number): string {
  if (value <= 3) return "Uncertain";
  if (value <= 5) return "Moderate";
  if (value <= 7) return "Confident";
  if (value <= 9) return "Very Confident";
  return "Excellent";
}

export default function MonthlyEntryForm() {
  const [form, setForm] = useState<MonthlyReviewFormData>(INITIAL_MONTHLY_REVIEW);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    console.log("MonthlyEntryForm mounted");
    return () => {
      console.log("MonthlyEntryForm unmounted");
    };
  }, []);

  useEffect(() => {
    console.log("loadMonthlyReview called");
    const existing = loadMonthlyReview();
    console.log("loadMonthlyReview returned:", existing);
    if (existing) {
      console.log("setForm called with existing data from localStorage");
      setForm(existing);
    }
  }, []);

  function updateField(
    name: keyof MonthlyReviewFormData,
    value: string | boolean | number
  ) {
    console.log("setForm called - updating field:", name, "value:", value);
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSave() {
    console.log("saveMonthlyReview called with form data:", form);
    saveMonthlyReview(form);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3500);
  }

  return (
    <div className="min-h-full bg-[#0a0a0c] font-sans text-zinc-100">
      <SuccessNotification visible={showNotification} />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[400px] rounded-full bg-emerald-500/[0.03] blur-[100px]" />
      </div>

      <main className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <header className="mb-10">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl ring-1 ring-blue-500/20">
              📅
            </div>
            <div>
              <p className="font-mono text-xs tracking-[0.25em] text-zinc-500 uppercase">
                Monthly Review
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {getMonthLabel()}
              </h1>
            </div>
          </div>
          <p className="max-w-2xl text-base leading-relaxed text-zinc-400">
            Record this month&apos;s income, expenses, investments, assets, and reflections. Your
            complete financial snapshot in one place.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-6"
        >
          {/* 1. Income */}
          <SectionCard icon="💰" title="Income" subtitle="Monthly inflows" accent="emerald">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <CurrencyField
                label="Net Salary"
                name="netSalary"
                value={form.netSalary}
                onChange={updateField}
              />
              <CurrencyField
                label="Other Income"
                name="otherIncome"
                value={form.otherIncome}
                onChange={updateField}
              />
            </div>
          </SectionCard>

          {/* 2. Expenses */}
          <SectionCard icon="🧾" title="Expenses" subtitle="Monthly outflows" accent="rose">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <CurrencyField
                label="Living Expenses"
                name="livingExpenses"
                value={form.livingExpenses}
                onChange={updateField}
              />
              <CurrencyField
                label="Travel"
                name="travel"
                value={form.travel}
                onChange={updateField}
              />
              <CurrencyField
                label="Medical"
                name="medical"
                value={form.medical}
                onChange={updateField}
              />
              <CurrencyField
                label="Other Expenses"
                name="otherExpenses"
                value={form.otherExpenses}
                onChange={updateField}
              />
            </div>
          </SectionCard>

          {/* 3. Investments */}
          <SectionCard icon="📈" title="Investments" subtitle="Contributions this month" accent="blue">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <CurrencyField label="PPF" name="ppf" value={form.ppf} onChange={updateField} />
              <CurrencyField
                label="Mutual Fund SIP"
                name="mutualFundSip"
                value={form.mutualFundSip}
                onChange={updateField}
              />
              <CurrencyField
                label="Additional Mutual Fund Investment"
                name="additionalMutualFund"
                value={form.additionalMutualFund}
                onChange={updateField}
              />
              <CurrencyField label="NPS" name="nps" value={form.nps} onChange={updateField} />
            </div>
          </SectionCard>

          {/* 4. Assets */}
          <SectionCard icon="🏦" title="Assets" subtitle="Current values" accent="violet">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <CurrencyField
                label="Mutual Fund Value"
                name="mutualFundValue"
                value={form.mutualFundValue}
                onChange={updateField}
              />
              <CurrencyField
                label="PPF Value"
                name="ppfValue"
                value={form.ppfValue}
                onChange={updateField}
              />
              <CurrencyField
                label="NPS Value"
                name="npsValue"
                value={form.npsValue}
                onChange={updateField}
              />
              <CurrencyField
                label="Emergency Fund"
                name="emergencyFund"
                value={form.emergencyFund}
                onChange={updateField}
              />
              <CurrencyField
                label="Bank Balance"
                name="bankBalance"
                value={form.bankBalance}
                onChange={updateField}
              />
            </div>
          </SectionCard>

          {/* 5. Liabilities */}
          <SectionCard icon="📉" title="Liabilities" subtitle="Debt & payments" accent="amber">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <CurrencyField
                label="Home Loan Outstanding"
                name="homeLoanOutstanding"
                value={form.homeLoanOutstanding}
                onChange={updateField}
              />
              <CurrencyField
                label="EMI Paid"
                name="emiPaid"
                value={form.emiPaid}
                onChange={updateField}
              />
              <CurrencyField
                label="Extra Home Loan Payment"
                name="extraHomeLoanPayment"
                value={form.extraHomeLoanPayment}
                onChange={updateField}
              />
            </div>
          </SectionCard>

          {/* 6. Monthly Reflection */}
          <SectionCard icon="✍️" title="Monthly Reflection" subtitle="Personal review" accent="emerald">
            <div className="space-y-5">
              <Toggle
                label="Did you trade F&O?"
                checked={form.tradedFno}
                onChange={(checked) => updateField("tradedFno", checked)}
              />

              {form.tradedFno && (
                <CurrencyField
                  label="Trading Profit / Loss"
                  name="tradingProfitLoss"
                  value={form.tradingProfitLoss}
                  onChange={updateField}
                  placeholder="Use negative for loss"
                />
              )}

              <label className="block">
                <span className="mb-2 block font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
                  Biggest Financial Decision This Month
                </span>
                <textarea
                  name="biggestDecision"
                  value={form.biggestDecision}
                  onChange={(e) => updateField("biggestDecision", e.target.value)}
                  rows={3}
                  placeholder="e.g. Increased SIP by ₹10k, prepaid ₹50k on home loan..."
                  className="w-full resize-none rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-emerald-500/40 focus:bg-zinc-900/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                />
              </label>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
                    Confidence About Finances
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xl font-semibold text-white">
                      {form.confidence}
                    </span>
                    <span className="text-sm text-zinc-500">/ 10</span>
                    <span
                      className={`ml-1 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${
                        form.confidence <= 3
                          ? "bg-rose-500/10 text-rose-400 ring-rose-500/20"
                          : form.confidence <= 5
                            ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                            : form.confidence <= 7
                              ? "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                              : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                      }`}
                    >
                      {confidenceLabel(form.confidence)}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={form.confidence}
                  onChange={(e) => updateField("confidence", Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-emerald-500 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/30"
                />
                <div className="mt-2 flex justify-between font-mono text-[10px] text-zinc-600">
                  <span>1 — Uncertain</span>
                  <span>10 — Excellent</span>
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
                  Notes
                </span>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={4}
                  placeholder="Any additional thoughts, observations, or plans for next month..."
                  className="w-full resize-none rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-emerald-500/40 focus:bg-zinc-900/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                />
              </label>
            </div>
          </SectionCard>

          {/* Save button */}
          <div className="pt-2 pb-8">
            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 text-base font-semibold tracking-wide text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/30 active:scale-[0.99]"
            >
              Save Monthly Review
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
