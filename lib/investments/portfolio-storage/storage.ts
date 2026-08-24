// =========================================
// ATHENA Portfolio Storage
// =========================================

import type { PortfolioItem } from "../types";
const STORAGE_KEY = "athena-portfolio";

export function loadPortfolio(): PortfolioItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function savePortfolio(
  portfolio: PortfolioItem[]
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(portfolio)
  );
}

export function clearPortfolio() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}