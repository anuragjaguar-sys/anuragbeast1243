"use client";

import { getRetirementProjection } from "@/lib/retirement/retirement-engine";

export default function RetirementCard() {
  const projection = getRetirementProjection();

  const readinessColor =
    projection.fireReadiness >= 100
      ? "bg-emerald-500"
      : projection.fireReadiness >= 80
      ? "bg-lime-500"
      : projection.fireReadiness >= 60
      ? "bg-yellow-500"
      : "bg-red-500";

  const statusColor =
    projection.status === "Excellent"
      ? "bg-emerald-500/20 text-emerald-400"
      : projection.status === "On Track"
      ? "bg-lime-500/20 text-lime-400"
      : projection.status === "Needs Improvement"
      ? "bg-yellow-500/20 text-yellow-400"
      : "bg-red-500/20 text-red-400";

  const formatCr = (value: number) =>
    `₹${(value / 10000000).toFixed(2)} Cr`;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          🏖 Retirement Intelligence
        </h2>

        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${statusColor}`}
        >
          {projection.status}
        </span>
      </div>

      {/* FIRE Progress */}
      <div className="mt-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-zinc-400">FIRE Readiness</span>
          <span className="font-semibold text-white">
            {projection.fireReadiness}%
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-zinc-700">
          <div
            className={`h-full rounded-full transition-all duration-700 ${readinessColor}`}
            style={{
              width: `${Math.min(projection.fireReadiness, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="mt-6 grid grid-cols-2 gap-4">

        <Metric
          label="Current Corpus"
          value={formatCr(projection.currentCorpus)}
        />

        <Metric
          label="Projected Corpus"
          value={formatCr(projection.projectedCorpus)}
          valueColor="text-emerald-400"
        />

        <Metric
          label="Required Corpus"
          value={formatCr(projection.requiredCorpus)}
        />

        <Metric
          label="Years Left"
          value={`${projection.yearsLeft} Years`}
        />

      </div>

      {/* Gap Analysis */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-800/50 p-4">

        <div className="flex justify-between">
          <span className="text-zinc-400">Corpus Gap</span>

          <span
            className={
              projection.surplus >= 0
                ? "font-semibold text-emerald-400"
                : "font-semibold text-red-400"
            }
          >
            {projection.surplus >= 0 ? "+" : ""}
            {formatCr(projection.surplus)}
          </span>
        </div>

        <div className="mt-3 flex justify-between">
          <span className="text-zinc-400">
            Monthly Income Gap
          </span>

          <span className="font-semibold text-yellow-400">
            ₹{projection.monthlyIncomeGap.toLocaleString()}
          </span>
        </div>

      </div>

      {/* Recommendations */}
      <div className="mt-6">

        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Recommendations
        </h3>

        <div className="space-y-2">

          {projection.recommendations.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-3 text-sm text-zinc-300"
            >
              💡 {item}
            </div>
          ))}

        </div>

      </div>
    </div>
  );
}

type MetricProps = {
  label: string;
  value: string;
  valueColor?: string;
};

function Metric({
  label,
  value,
  valueColor = "text-white",
}: MetricProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className={`mt-2 text-lg font-bold ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}