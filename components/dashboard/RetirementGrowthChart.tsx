"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import { getRetirementProjection } from "@/lib/retirement/retirement-engine";

export default function RetirementGrowthChart() {
  const projection = getRetirementProjection();

  const data = projection.yearlyProjection ?? [];
console.log("Retirement Chart Data:", data);
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg">
      <h2 className="mb-1 text-xl font-bold text-white">
        📈 Retirement Growth Projection
      </h2>

      <p className="mb-6 text-sm text-zinc-400">
        Expected corpus growth until retirement
      </p>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
              formatter={(value) => {
                if (typeof value !== "number") return "";

                return [`₹${(value / 10000000).toFixed(2)} Cr`];
              }}
            />

            <Legend />

            <Line
              type="monotone"
              dataKey="corpus"
              name="Projected Corpus"
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
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}