"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import PortfolioSummary from "@/components/portfolio/PortfolioSummary";
import PortfolioTable from "@/components/portfolio/PortfolioTable";
import PortfolioForm from "@/components/portfolio/PortfolioForm";

import {
  Asset,
  Liability,
  PortfolioItem,
  getPortfolio,
  saveCurrentPortfolio,
} from "@/lib/investments";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] =
  useState<PortfolioItem | null>(null);
useEffect(() => {
  setPortfolio(getPortfolio());
}, []);
  const handleSave = (
  item: Asset | Liability
) => {

  let updatedPortfolio: PortfolioItem[];

  if (editingItem) {

    updatedPortfolio = portfolio.map((p) =>
      p.id === editingItem.id
        ? {
            ...item,
            id: editingItem.id,
          }
        : p
    );

  } else {

    updatedPortfolio = [
      ...portfolio,
      item,
    ];

  }

  setPortfolio(updatedPortfolio);

  saveCurrentPortfolio(updatedPortfolio);

  setEditingItem(null);

  setShowForm(false);

};

  const handleDelete = (id: string) => {

  const updatedPortfolio =
    portfolio.filter(
      (item) => item.id !== id
    );

  setPortfolio(updatedPortfolio);

  saveCurrentPortfolio(updatedPortfolio);

};
  const handleEdit = (
  item: PortfolioItem
) => {

  setEditingItem(item);

  setShowForm(true);

  // Sprint 4C
  // This will open PortfolioForm
  // with existing values.
};

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-8">

     {/* Header */}

<div className="flex items-center justify-between">

  <div className="flex items-center gap-4">

    <Link
      href="/"
      className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-blue-500 hover:text-white"
    >
      ← Dashboard
    </Link>

    <div>

      <h1 className="text-4xl font-bold text-white">
        Portfolio
      </h1>

      <p className="mt-2 text-zinc-400">
        Manage your Assets & Liabilities
      </p>

    </div>

  </div>

  <button
    onClick={() => {
      setEditingItem(null);
      setShowForm(true);
    }}
    className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
  >
    + Add Portfolio Item
  </button>

</div>
      {/* Summary */}

      <PortfolioSummary
        portfolio={portfolio}
      />

      {/* Form */}

      {showForm && (
        <PortfolioForm
          item={editingItem}
          onSave={handleSave}
          onCancel={() => {
            setEditingItem(null);
            setShowForm(false);
          }}
        />
      )}

      {/* Assets */}

      <PortfolioTable
        title="Assets"
        type="Asset"
        portfolio={portfolio}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      {/* Liabilities */}

      <PortfolioTable
        title="Liabilities"
        type="Liability"
        portfolio={portfolio}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

    </main>
  );
}