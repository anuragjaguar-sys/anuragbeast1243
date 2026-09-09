/**
 * Unified Safe Storage Layer for FIRE54
 * Provides error-handling, SSR safety, type serialization, and future Supabase sync hooks.
 */

const STORAGE_KEYS = {
  PROFILE: "fire54_financial_profile",
  GOALS: "fire54_user_goals",
  PORTFOLIO: "fire54_portfolio_holdings",
  MONTHLY_REVIEWS: "fire54_monthly_reviews",
  BEHAVIOUR_PROFILE: "fire54_behaviour_profile",
  GOAL_LEDGER: "fire54_goal_ledger",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export class StorageManager {
  private static isClient(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  }

  public static get<T>(key: StorageKey | string, fallback: T): T {
    if (!this.isClient()) return fallback;

    try {
      const item = window.localStorage.getItem(key);
      if (!item) return fallback;
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`[StorageManager] Error reading key "${key}":`, error);
      return fallback;
    }
  }

  public static set<T>(key: StorageKey | string, value: T): boolean {
    if (!this.isClient()) return false;

    try {
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`[StorageManager] Failed to persist key "${key}":`, error);
      return false;
    }
  }

  public static remove(key: StorageKey | string): void {
    if (!this.isClient()) return;

    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`[StorageManager] Error removing key "${key}":`, error);
    }
  }

  public static KEYS = STORAGE_KEYS;
}
