import {
  getMonthKey,
  getMonthLabel,
  type MonthlyReviewFormData,
} from "./monthly-review";

const STORAGE_KEY = "fire54_monthly_reviews";

export type StoredMonthlyReview = {
  monthKey: string;
  monthLabel: string;
  savedAt: string;
  data: MonthlyReviewFormData;
};

type MonthlyReviewsStore = Record<string, StoredMonthlyReview>;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readStore(): MonthlyReviewsStore {
  if (!isBrowser()) return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed as MonthlyReviewsStore;
  } catch {
    return {};
  }
}

function writeStore(store: MonthlyReviewsStore): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/** Load a monthly review by key. Defaults to the current month. */
export function loadMonthlyReview(
  monthKey: string = getMonthKey()
): MonthlyReviewFormData | null {
  const store = readStore();
  return store[monthKey]?.data ?? null;
}

/**
 * Save (or update) a monthly review for the given month.
 * Upserts by monthKey — no duplicate entries for the same month.
 */
export function saveMonthlyReview(
  data: MonthlyReviewFormData,
  monthKey: string = getMonthKey(),
  monthLabel: string = getMonthLabel()
): StoredMonthlyReview {
  const store = readStore();

  const record: StoredMonthlyReview = {
    monthKey,
    monthLabel,
    savedAt: new Date().toISOString(),
    data,
  };

  store[monthKey] = record;
  writeStore(store);

  return record;
}

/** Return all stored reviews, newest month first. */
export function getAllMonthlyReviews(): StoredMonthlyReview[] {
  return Object.values(readStore()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

/** Check whether a review exists for a given month. */
export function hasMonthlyReview(monthKey: string = getMonthKey()): boolean {
  return monthKey in readStore();
}

/** Remove a review for a given month. */
export function deleteMonthlyReview(monthKey: string): void {
  const store = readStore();
  delete store[monthKey];
  writeStore(store);
}

/** Clear all stored monthly reviews. */
export function clearAllMonthlyReviews(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
}
