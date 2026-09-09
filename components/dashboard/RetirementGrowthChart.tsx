"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import { getRetirementProjection } from "@/lib/retirement/retirement-engine";
import { getRetirementAssumptionsFromProfile } from "@/lib/profile/profile-retirement-adapter";
import { useProfile } from "@/lib/profile/profile-context";
import { YearProjection } from "@/lib/retirement/types";

export default function RetirementGrowthChart() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-400">
        Loading...
      </div>
    );
  }

  const retirementInputs = getRetirementAssumptionsFromProfile(profile);
  const projection = getRetirementProjection(retirementInputs);

  const data = (projection.yearlyProjection ?? []).map((yearData: YearProjection) => ({
    ...yearData,
    monteCarloRange: [yearData.corpus10, yearData.corpus90],
  }));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="mb-1 text-xl font-bold text-white">
            📈 Retirement Monte Carlo Projection
          </h2>
          <p className="mb-6 text-sm text-zinc-400">
            Based on 1,000 market simulations • 10th to 90th Percentile
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-400">Success Probability</p>
          <p className={`text-2xl font-bold ${projection.probabilityOfSuccess >= 75 ? 'text-green-500' : 'text-amber-500'}`}>
            {projection.probabilityOfSuccess}%
          </p>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />

            <XAxis
              dataKey="age"
              stroke="#a1a1aa"
            />

            <YAxis
              stroke="#a1a1aa"
              tickFormatter={(value) =>
                `₹${(Number(value) / 10000000).toFixed(1)} Cr`
              }
            />

            <Tooltip
              contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#fff" }}
              formatter={(value, name) => {
                if (Array.isArray(value)) {
                   return [`₹${(value[0] / 10000000).toFixed(2)}Cr - ₹${(value[1] / 10000000).toFixed(2)}Cr`, "Confidence Band"];
                }
                if (typeof value !== "number") return "";
                return [`₹${(value / 10000000).toFixed(2)} Cr`, name];
              }}
            />

            <Legend />

            <Area
              type="monotone"
              dataKey="monteCarloRange"
              name="Probability Range (10% - 90%)"
              stroke="none"
              fill="#22c55e"
              fillOpacity={0.15}
            />

            <Line
              type="monotone"
              dataKey="corpus"
              name="Projected Corpus (Expected)"
              stroke="#22c55e"
              strokeWidth={3}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="targetCorpus"
              name="Required Corpus"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}