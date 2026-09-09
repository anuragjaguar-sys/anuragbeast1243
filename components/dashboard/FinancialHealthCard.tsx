"use client";

export interface FinancialHealthCardProps {
  score: number | null;
  emergencyProgress: number;
  fireProgress: number;
  netWorth: number;
  financialAssets: number;
}

export default function FinancialHealthCard({
  score,
  emergencyProgress,
  fireProgress,
  netWorth,
  financialAssets,
}: FinancialHealthCardProps) {
  
  const formatINR = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-zinc-900/60 p-5 text-left transition-all duration-300 hover:border-zinc-700/80 hover:shadow-lg hover:shadow-black/20">
      <div className="absolute inset-0 bg-zinc-900/60" />
      <div className="relative">
        <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">Financial Health</p>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {score !== null ? `${score} / 100` : "N/A"}
          </p>
        </div>
        <p className="mt-2 text-xs text-emerald-400">
          Emergency Fund: {emergencyProgress}% · FIRE Progress: {fireProgress}%
        </p>
        <div className="mt-3 text-sm text-zinc-300">
          <div>Net Worth: {formatINR(netWorth)}</div>
          <div>Financial Assets: {formatINR(financialAssets)}</div>
        </div>
      </div>
    </div>
  );
}