"use client";

import { useState } from "react";
import { useProfile } from "@/lib/profile/profile-context";
import { getRetirementProjection } from "@/lib/retirement/retirement-engine";

type EventName = "none" | "sabbatical" | "secondHome" | "education";
const presets = { sabbatical: { label: "Sabbatical", cost: 0, year: 1, pause: 12 }, secondHome: { label: "Second home", cost: 4000000, year: 1, pause: 0 }, education: { label: "Education", cost: 2500000, year: 8, pause: 0 } };

function formatCompact(value: number) { return value >= 10000000 ? `₹${(value / 10000000).toFixed(2)}Cr` : value >= 100000 ? `₹${(value / 100000).toFixed(2)}L` : `₹${Math.round(value).toLocaleString("en-IN")}`; }

export default function LifeEventSimulatorCard() {
  const { profile, loading } = useProfile();
  const [event, setEvent] = useState<EventName>("none");
  const [inputs, setInputs] = useState({ cost: 0, year: 1, pause: 0, recoveryMonths: 36 });
  if (loading) return <div className="rounded-3xl border border-zinc-800/60 bg-zinc-950/60 p-6"><p className="text-sm text-zinc-400">Loading simulator...</p></div>;
  const projection = getRetirementProjection(profile);
  const yearsLeft = Math.max(projection.yearsLeft, 1);
  const returnRate = Math.max(profile.assumptions.equityReturn, 0);
  const impact = event === "none" ? 0 : (inputs.cost + profile.income.monthlyInvestment * inputs.pause) * Math.pow(1 + returnRate, Math.max(0, yearsLeft - inputs.year));
  const corpus = Math.max(0, projection.projectedCorpus - impact);
  const probability = projection.projectedCorpus > 0 ? Math.max(0, Math.round(projection.probabilityOfSuccess * corpus / projection.projectedCorpus)) : 0;
  const recovery = inputs.recoveryMonths > 0 ? Math.ceil(impact / inputs.recoveryMonths) : impact;
  const choose = (next: EventName) => { setEvent(next); if (next !== "none") { const preset = presets[next]; setInputs((current) => ({ ...current, cost: preset.cost || profile.income.monthlyInvestment * 12, year: preset.year, pause: preset.pause })); } };
  const setNumber = (key: keyof typeof inputs, value: string) => setInputs((current) => ({ ...current, [key]: Math.max(0, Number(value) || 0) }));
  return <div className="rounded-3xl border border-zinc-800/60 bg-zinc-950/60 p-6 backdrop-blur-md shadow-2xl"><div className="mb-4 border-b border-zinc-800/60 pb-4"><p className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">Retirement horizon sandbox</p><h3 className="mt-1 text-xl font-bold text-white">Life-Event Modeler</h3></div><div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{(["none", "sabbatical", "secondHome", "education"] as EventName[]).map((item) => <button key={item} onClick={() => choose(item)} className={`rounded-xl px-3 py-2 text-xs ${event === item ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300" : "bg-zinc-900 text-zinc-400"}`}>{item === "none" ? "Baseline" : presets[item].label}</button>)}</div>{event !== "none" && <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><Input label="Event cost" value={inputs.cost} onChange={(v) => setNumber("cost", v)} /><Input label="Event year" value={inputs.year} onChange={(v) => setNumber("year", v)} /><Input label="SIP pause (months)" value={inputs.pause} onChange={(v) => setNumber("pause", v)} /><Input label="Recovery months" value={inputs.recoveryMonths} onChange={(v) => setNumber("recoveryMonths", v)} /></div>}<div className="grid grid-cols-2 gap-3"><Metric label="Projected corpus" value={formatCompact(corpus)} /><Metric label="Success probability" value={`${probability}%`} /></div>{event !== "none" && <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-100">Estimated future impact: {formatCompact(impact)}. A simple recovery target is {formatCompact(recovery)} extra per month for {inputs.recoveryMonths} months. Planning estimate only.</p>}</div>;
}
function Input({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) { return <label className="text-xs text-zinc-400">{label}<input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white" /></label>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4"><p className="text-[10px] uppercase text-zinc-500">{label}</p><p className="mt-1 font-mono text-lg font-bold text-white">{value}</p></div>; }
