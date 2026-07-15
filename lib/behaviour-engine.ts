/**
 * ATHENA Behaviour & Decision Intelligence Engine
 * 
 * This engine manages behavioural data independently from the Financial Engine.
 * It focuses on reinforcing positive financial behaviour and long-term discipline.
 */

// =========================================
// DATA MODEL (Raw Data Only)
// =========================================

/**
 * BehaviourProfile - Raw data stored in localStorage
 * Only raw data is stored. All calculated values are computed dynamically.
 */
export type BehaviourProfile = {
  recoveryStartDate: string;              // ISO date string (YYYY-MM-DD)
  lastTradeDate: string;                  // ISO date string (YYYY-MM-DD)
  longestStreak: number;                  // days (raw data, updated when streak is broken)
  estimatedMonthlyTradingLoss: number;    // INR (configurable, default ₹30,000)
};

// =========================================
// CALCULATED DATA TYPES
// =========================================

/**
 * Milestone definition
 */
export type Milestone = {
  days: number;
  name: string;
  tier: "First Week" | "Bronze" | "Silver" | "Gold" | "Platinum" | "Legend";
};

/**
 * Dashboard data - all calculated metrics in one object
 */
export type BehaviourDashboardData = {
  currentStreak: number;
  longestStreak: number;
  financialDisciplineScore: number;
  disciplineLevel: string;
  capitalPreserved: number;
  currentMilestone: Milestone | null;
  nextMilestone: Milestone | null;
  isFAndOFree: boolean;
  recoveryStartDate: string;
  lastTradeDate: string;
};

// =========================================
// MILESTONE DEFINITIONS
// =========================================

const MILESTONES: Milestone[] = [
  { days: 7, name: "First Week", tier: "First Week" },
  { days: 30, name: "Bronze", tier: "Bronze" },
  { days: 100, name: "Silver", tier: "Silver" },
  { days: 180, name: "Half Year", tier: "Silver" },
  { days: 365, name: "Gold", tier: "Gold" },
  { days: 500, name: "Platinum", tier: "Platinum" },
  { days: 1000, name: "Legend", tier: "Legend" },
];

// =========================================
// CALCULATION FUNCTIONS
// =========================================

/**
 * Calculate current streak in days
 * Based on lastTradeDate
 */
export function calculateCurrentStreak(lastTradeDate: string): number {
  const lastTrade = new Date(lastTradeDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - lastTrade.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Update longest streak
 * Returns the new longest streak value
 */
export function calculateLongestStreak(currentStreak: number, existingLongestStreak: number): number {
  return Math.max(currentStreak, existingLongestStreak);
}

/**
 * Calculate financial discipline score (0-100)
 * Based on current streak
 */
export function calculateFinancialDisciplineScore(currentStreak: number): number {
  // Score based on streak milestones
  if (currentStreak >= 1000) return 100;
  if (currentStreak >= 500) return 90;
  if (currentStreak >= 365) return 80;
  if (currentStreak >= 180) return 70;
  if (currentStreak >= 100) return 60;
  if (currentStreak >= 30) return 50;
  if (currentStreak >= 7) return 40;
  if (currentStreak >= 1) return 30;
  return 0;
}

/**
 * Calculate discipline level based on score
 */
export function calculateDisciplineLevel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Strong";
  if (score >= 40) return "Improving";
  return "Needs Attention";
}

/**
 * Calculate capital preserved
 * Based on current streak and estimated monthly trading loss
 */
export function calculateCapitalProtected(currentStreak: number, estimatedMonthlyLoss: number): number {
  // Capital preserved = (streak / 30) * monthly loss
  const months = currentStreak / 30;
  return Math.round(months * estimatedMonthlyLoss);
}

/**
 * Get current milestone based on streak
 */
export function getCurrentMilestone(currentStreak: number): Milestone | null {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (currentStreak >= MILESTONES[i].days) {
      return MILESTONES[i];
    }
  }
  return null;
}

/**
 * Get next milestone based on streak
 */
export function getNextMilestone(currentStreak: number): Milestone | null {
  for (const milestone of MILESTONES) {
    if (currentStreak < milestone.days) {
      return milestone;
    }
  }
  return null;
}

// =========================================
// DASHBOARD DATA FUNCTION
// =========================================

/**
 * Get all dashboard metrics in one object
 * This is the single source of truth for the dashboard
 */
export function getBehaviourDashboardData(profile: BehaviourProfile): BehaviourDashboardData {
  const currentStreak = calculateCurrentStreak(profile.lastTradeDate);
  const updatedLongestStreak = calculateLongestStreak(currentStreak, profile.longestStreak);
  const financialDisciplineScore = calculateFinancialDisciplineScore(currentStreak);
  const disciplineLevel = calculateDisciplineLevel(financialDisciplineScore);
  const capitalPreserved = calculateCapitalProtected(currentStreak, profile.estimatedMonthlyTradingLoss);
  const currentMilestone = getCurrentMilestone(currentStreak);
  const nextMilestone = getNextMilestone(currentStreak);
  const isFAndOFree = currentStreak > 0;

  return {
    currentStreak,
    longestStreak: updatedLongestStreak,
    financialDisciplineScore,
    disciplineLevel,
    capitalPreserved,
    currentMilestone,
    nextMilestone,
    isFAndOFree,
    recoveryStartDate: profile.recoveryStartDate,
    lastTradeDate: profile.lastTradeDate,
  };
}

// =========================================
// LOCAL STORAGE FUNCTIONS
// =========================================

const STORAGE_KEY = "fire54_behaviour_profile";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Load behaviour profile from localStorage
 */
export function loadBehaviourProfile(): BehaviourProfile | null {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const profile: BehaviourProfile = JSON.parse(raw);
    return profile;
  } catch (error) {
    console.error("Failed to load behaviour profile:", error);
    return null;
  }
}

/**
 * Save behaviour profile to localStorage
 */
export function saveBehaviourProfile(profile: BehaviourProfile): void {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("Failed to save behaviour profile:", error);
  }
}

/**
 * Initialize behaviour profile with default values
 */
export function initializeBehaviourProfile(
  recoveryStartDate?: string,
  lastTradeDate?: string,
  estimatedMonthlyTradingLoss?: number
): BehaviourProfile {
  const today = new Date().toISOString().split('T')[0];

  const profile: BehaviourProfile = {
    recoveryStartDate: recoveryStartDate || today,
    lastTradeDate: lastTradeDate || today,
    longestStreak: 0,
    estimatedMonthlyTradingLoss: estimatedMonthlyTradingLoss || 30000, // ₹30,000 default
  };

  saveBehaviourProfile(profile);
  return profile;
}

/**
 * Get or initialize behaviour profile
 * Convenience function that loads or creates profile
 */
export function getBehaviourProfile(): BehaviourProfile {
  const existing = loadBehaviourProfile();
  if (existing) return existing;

  return initializeBehaviourProfile();
}

/**
 * Update behaviour profile fields
 * Only updates provided fields, preserves others
 */
export function updateBehaviourProfile(updates: Partial<BehaviourProfile>): BehaviourProfile {
  const existing = getBehaviourProfile();
  const updated = { ...existing, ...updates };
  saveBehaviourProfile(updated);
  return updated;
}
