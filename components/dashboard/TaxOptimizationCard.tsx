"use client";

import { useState } from "react";
import { useProfile } from "@/lib/profile/profile-context";
import { getPortfolio } from "@/lib/investments";

function formatINR(value: number) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} Lakhs`;
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function TaxOptimizationCard() {
  const { profile, loading } = useProfile();
  const [assumptions, setAssumptions] = useState({
    financialYear: "FY 2026–27",
    basicSalaryPercent: 45,
    employerNpsPercent: 14,
    ltcgAllowancePerPerson: 125000,
  });

  if (loading) return <div className="rounded-3xl border border-zinc-800/60 bg-zinc-950/60 p-6"><p className="text-sm text-zinc-400">Loading tax planning...</p></div>;

  const partner = profile.partner ?? { name: "Partner", monthlySalary: 0 };
  const annualSalary = (profile.income.monthlySalary + partner.monthlySalary) * 12;
  const npsAmount = annualSalary * (assumptions.basicSalaryPercent / 100) * (assumptions.employerNpsPercent / 100);
  const ltcgAmount = assumptions.ltcgAllowancePerPerson * 2;
  const portfolio = getPortfolio();
  const equity = portfolio.filter((item: any) => item.assetClass === "Equity").reduce((sum: number, item: any) => sum + Number(item.currentValue || 0), 0);
  const debt = portfolio.filter((item: any) => item.assetClass === "Debt").reduce((sum: number, item: any) => sum + Number(item.currentValue || 0), 0);
  const update = (key: keyof typeof assumptions, value: string) => setAssumptions((current) => ({ ...current, [key]: key === "financialYear" ? value : Number(value) || 0 }));

  return <div className="rounded-3xl border border-zinc-800/60 bg-zinc-950/60 p-6 backdrop-blur-md shadow-2xl">
    <div className="mb-5 border-b border-zinc-800/60 pb-4"><p className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">Planning assumptions</p><h3 className="mt-1 text-xl font-bold text-white">Tax Optimization & Asset Location</h3></div>
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><Field label="Financial year" value={assumptions.financialYear} onChange={(v) => update("financialYear", v)} /><Field label="Basic salary %" value={assumptions.basicSalaryPercent} onChange={(v) => update("basicSalaryPercent", v)} type="number" /><Field label="Employer NPS %" value={assumptions.employerNpsPercent} onChange={(v) => update("employerNpsPercent", v)} type="number" /><Field label="LTCG allowance / person" value={assumptions.ltcgAllowancePerPerson} onChange={(v) => update("ltcgAllowancePerPerson", v)} type="number" /></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Metric label="Employer NPS planning amount" value={`${formatINR(npsAmount)} / year`} /><Metric label="Family LTCG planning allowance" value={`${formatINR(ltcgAmount)} / year`} /></div>
    <p className="mt-5 text-sm text-zinc-300">Portfolio location: <span className="font-mono text-white">{formatINR(equity)}</span> equity and <span className="font-mono text-white">{formatINR(debt)}</span> debt.</p>
    <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-100">Planning tool only. Verify the current tax rules, tax regime, employer policy, realised gains, and ownership with a qualified tax professional before acting.</p>
  </div>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (value: string) => void; type?: "text" | "number" }) { return <label className="text-xs text-zinc-400">{label}<input type={type} min={type === "number" ? 0 : undefined} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white" /></label>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4"><p className="text-[10px] uppercase text-zinc-500">{label}</p><p className="mt-1 font-mono text-lg font-bold text-emerald-400">{value}</p></div>; }
