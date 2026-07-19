/**
 * ATHENA Behaviour Insights Engine
 * 
 * Generates constructive coaching messages and calculates discipline metrics.
 * Focuses on improvement without shaming the user.
 */

import type { BehaviourProfile } from "./behaviour-engine";

// =========================================
// TYPES
// =========================================

export type MonthlyHabitEntry = {
  monthKey: string;          // YYYY-MM
  monthlyReviewCompleted: boolean;
  salaryAllocated: boolean;
  sipCompleted: boolean;
  loanPaymentCompleted: boolean;
  emergencyFundUpdated: boolean;
  noFAndOTrading: boolean;
  dailyReflectionCompleted: boolean;
};

export type DailyReflection = {
  date: string;              // YYYY-MM-DD
  bestDecision: string;
  temptationResisted: string;
  gratitude: string;
};

export type BehaviourInsight = {
  message: string;
  strength?: string;
  areaForImprovement?: string;
  recommendation?: string;
};

// =========================================
// MONTHLY DISCIPLINE SCORE
// =========================================

/**
 * Calculate monthly discipline score (0-100)
 * Weights:
 * - No F&O Trading: 30 points
 * - Monthly Review: 20 points
 * - Salary Allocation: 15 points
 * - SIP Completion: 20 points
 * - Loan Payment: 10 points
 * - Daily Reflection: 5 points
 */
export function getMonthlyDisciplineScore(habits: MonthlyHabitEntry): number {
  let score = 0;

  if (habits.noFAndOTrading) score += 30;
  if (habits.monthlyReviewCompleted) score += 20;
  if (habits.salaryAllocated) score += 15;
  if (habits.sipCompleted) score += 20;
  if (habits.loanPaymentCompleted) score += 10;
  if (habits.dailyReflectionCompleted) score += 5;

  return score;
}

/**
 * Get habit completion percentage
 */
export function getHabitCompletionPercentage(habits: MonthlyHabitEntry): number {
  const totalHabits = 6; // 6 habits tracked
  let completed = 0;

  if (habits.monthlyReviewCompleted) completed++;
  if (habits.salaryAllocated) completed++;
  if (habits.sipCompleted) completed++;
  if (habits.loanPaymentCompleted) completed++;
  if (habits.emergencyFundUpdated) completed++;
  if (habits.noFAndOTrading) completed++;

  return Math.round((completed / totalHabits) * 100);
}

/**
 * Get behaviour trend from monthly scores
 */
export function getBehaviourTrend(monthlyScores: number[]): "improving" | "stable" | "declining" {
  if (monthlyScores.length < 2) return "stable";

  const recent = monthlyScores.slice(-3); // Last 3 months
  const average = recent.reduce((a, b) => a + b, 0) / recent.length;
  const previous = monthlyScores[monthlyScores.length - 2] || 0;

  if (average > previous + 5) return "improving";
  if (average < previous - 5) return "declining";
  return "stable";
}

// =========================================
// AI BEHAVIOUR COACH
// =========================================

/**
 * Generate constructive behaviour insights
 * Never shames the user. Always focuses on improvement.
 */
export function generateBehaviourInsights(
  profile: BehaviourProfile,
  currentMonthHabits: MonthlyHabitEntry | null,
  monthlyScores: number[]
): BehaviourInsight {
  const currentStreak = calculateCurrentStreak(profile.lastTradeDate);
  const monthlyScore = currentMonthHabits ? getMonthlyDisciplineScore(currentMonthHabits) : 0;
  const completion = currentMonthHabits ? getHabitCompletionPercentage(currentMonthHabits) : 0;
  const trend = getBehaviourTrend(monthlyScores);

  let message = "";
  let strength = "";
  let areaForImprovement = "";
  let recommendation = "";

  // Determine overall message based on score and streak
  if (monthlyScore >= 80) {
    message = "Excellent discipline this month. Your financial habits are strong and consistent.";
    strength = "High completion rate across all habits";
    recommendation = "Maintain current strategy. Consider setting higher goals.";
  } else if (monthlyScore >= 60) {
    message = "Good progress this month. You're building solid financial habits.";
    strength = currentStreak > 30 ? "Strong F&O-free streak" : "Consistent habit completion";
    areaForImprovement = "Focus on completing remaining habits";
    recommendation = "Identify which habits need attention and prioritize them.";
  } else if (monthlyScore >= 40) {
    message = "Making progress. Some habits need more attention.";
    strength = currentStreak > 7 ? "Building F&O-free discipline" : "Partial habit completion";
    areaForImprovement = "Increase habit completion rate";
    recommendation = "Focus on completing monthly review and SIP allocation.";
  } else {
    message = "Building foundation. Focus on establishing core habits.";
    strength = currentStreak > 0 ? "Started F&O-free journey" : "Taking first steps";
    areaForImprovement = "Complete monthly review and salary allocation";
    recommendation = "Start with monthly review. Small steps lead to big changes.";
  }

  // Add specific insights based on habits
  if (currentMonthHabits) {
    if (!currentMonthHabits.monthlyReviewCompleted) {
      areaForImprovement = "Monthly Review is pending";
      recommendation = "Complete monthly review before month-end to track progress.";
    }
    if (!currentMonthHabits.sipCompleted) {
      areaForImprovement = areaForImprovement || "SIP completion";
      recommendation = "Ensure SIP is completed for consistent wealth building.";
    }
    if (!currentMonthHabits.noFAndOTrading) {
      areaForImprovement = "F&O trading detected";
      recommendation = "Focus on avoiding F&O trading. Every day counts.";
    }
  }

  // Add trend-based insights
  if (trend === "improving") {
    strength = strength + ". Consistent improvement over time";
  } else if (trend === "declining") {
    areaForImprovement = areaForImprovement || "Recent decline in habits";
    recommendation = "Review recent changes and refocus on core habits.";
  }

  return {
    message,
    strength: strength || undefined,
    areaForImprovement: areaForImprovement || undefined,
    recommendation: recommendation || undefined,
  };
}

/**
 * Calculate current streak (helper function)
 */
function calculateCurrentStreak(lastTradeDate: string): number {
  const lastTrade = new Date(lastTradeDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - lastTrade.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get current month key
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get current date key
 */
export function getCurrentDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
