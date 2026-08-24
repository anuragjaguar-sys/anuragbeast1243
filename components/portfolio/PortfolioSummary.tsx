"use client";

import { PortfolioItem } from "@/lib/investments";

interface PortfolioSummaryProps {
  portfolio: PortfolioItem[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PortfolioSummary({
  portfolio,
}: PortfolioSummaryProps) {

  const assets = portfolio.filter(
    (item) => item.type === "Asset"
  );

  const liabilities = portfolio.filter(
    (item) => item.type === "Liability"
  );

  const totalAssets = assets.reduce(
    (sum, item) => sum + item.currentValue,
    0
  );

  const totalLiabilities = liabilities.reduce(
    (sum, item) => sum + item.currentValue,
    0
  );

  const monthlyInvestment = assets.reduce(
    (sum, item) =>
      sum +
      ("monthlyContribution" in item
        ? item.monthlyContribution
        : 0),
    0
  );

  const monthlyEMI = liabilities.reduce(
    (sum, item) =>
      sum +
      ("emi" in item ? item.emi : 0),
    0
  );

  const netWorth =
    totalAssets - totalLiabilities;

  const cards = [
    {
      title: "Total Assets",
      value: totalAssets,
      color: "text-emerald-400",
    },
    {
      title: "Total Liabilities",
      value: totalLiabilities,
      color: "text-red-400",
    },
    {
      title: "Net Worth",
      value: netWorth,
      color:
        netWorth >= 0
          ? "text-emerald-400"
          : "text-red-400",
    },
    {
      title: "Monthly Investment",
      value: monthlyInvestment,
      color: "text-blue-400",
    },
    {
      title: "Monthly EMI",
      value: monthlyEMI,
      color: "text-yellow-400",
    },
  ];

  return (
    <section className="space-y-4">

      <h2 className="text-2xl font-bold text-white">
        Portfolio Summary
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">

        {cards.map((card) => (

          <div
            key={card.title}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg"
          >

            <p className="text-xs uppercase tracking-wider text-zinc-500">
              {card.title}
            </p>

            <p
              className={`mt-3 text-2xl font-bold ${card.color}`}
            >
              {formatCurrency(card.value)}
            </p>

          </div>

        ))}

      </div>

    </section>
  );
}