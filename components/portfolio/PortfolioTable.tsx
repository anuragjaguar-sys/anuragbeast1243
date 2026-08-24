"use client";

import { PortfolioItem } from "@/lib/investments";

interface PortfolioTableProps {
  title: string;
  type: "Asset" | "Liability";

  portfolio: PortfolioItem[];

  onEdit: (item: PortfolioItem) => void;

  onDelete: (id: string) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PortfolioTable({
  title,
  type,
  portfolio,
  onEdit,
  onDelete,
}: PortfolioTableProps) {

  const items = portfolio.filter(
    (item) => item.type === type
  );

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg">

      <div className="mb-6 flex items-center justify-between">

        <h2 className="text-xl font-bold text-white">
          {title}
        </h2>

        <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-400">
          {items.length} Items
        </span>

      </div>

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead>

            <tr className="border-b border-zinc-800">

              <th className="px-4 py-3 text-left text-sm text-zinc-400">
                Name
              </th>

              <th className="px-4 py-3 text-left text-sm text-zinc-400">
                Category
              </th>

              <th className="px-4 py-3 text-right text-sm text-zinc-400">
                Value
              </th>

              <th className="px-4 py-3 text-center text-sm text-zinc-400">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {items.length === 0 && (

              <tr>

                <td
                  colSpan={4}
                  className="py-10 text-center text-zinc-500"
                >
                  No {title} Added Yet
                </td>

              </tr>

            )}

            {items.map((item) => (

              <tr
                key={item.id}
                className="border-b border-zinc-800 transition hover:bg-zinc-800/40"
              >

                <td className="px-4 py-4 font-medium text-white">
                  {item.name}
                </td>

                <td className="px-4 py-4 text-zinc-300">
                  {item.category}
                </td>

                <td className="px-4 py-4 text-right font-semibold text-emerald-400">
                  {formatCurrency(item.currentValue)}
                </td>

                <td className="px-4 py-4">

                  <div className="flex justify-center gap-2">

                    <button
                      onClick={() => onEdit(item)}
                      className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {

                        if (
                          confirm(
                            `Delete ${item.name}?`
                          )
                        ) {
                          onDelete(item.id);
                        }

                      }}
                      className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                    >
                      Delete
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </section>
  );
}