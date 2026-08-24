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
 * Daily Reflection - One reflection per day
 */
export type DailyReflection = {
  date: string;              // YYYY-MM-DD
  bestDecision: string;
  temptationResisted: string;
  gratitude: string;
};

/**
 * Monthly Habit Entry - Tracks habit completion per month
 */
export type MonthlyHabitEntry = {
  monthKey: string;          // YYYY-MM
  monthlyReviewCompleted: boolean;
  salaryAllocated: boolean;
  sipCompleted: boolean;
  loanPaymentCompleted: boolean;
  emergencyFundUpdated: boolean;
  noFAndOTrading: boolean;   // Auto-calculated from streak
  dailyReflectionCompleted: boolean;
};

/**
 * Behaviour Achievement - Unlocked achievements
 */
export type BehaviourAchievement = {
  id: string;
  name: string;
  icon: string;
  unlockedAt: string;        // YYYY-MM-DD
  description: string;
};

/**
 * Behaviour Goal - User-set goals
 */
export type BehaviourGoal = {
  id: string;
  type: "streak" | "score" | "reflections";
  target: number;
  current: number;
  deadline?: string;         // YYYY-MM-DD
};

/**
 * BehaviourProfile - Raw data stored in localStorage
 * Only raw data is stored. All calculated values are computed dynamically.
 */
export interface TradingEvent {
  id: string;

  tradeDate: string;

  loss: number;

  trigger: string;

  notes?: string;

  streakBroken: number;
}

export type BehaviourProfile = {
  recoveryStartDate: string;

  // KEEP THIS FOR NOW
  lastTradeDate: string;

  longestStreak: number;

  estimatedMonthlyTradingLoss: number;

  // NEW
  tradingHistory: TradingEvent[];

  dailyReflections: DailyReflection[];
  monthlyHabits: MonthlyHabitEntry[];
  achievements: BehaviourAchievement[];
  goals: BehaviourGoal[];
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
export interface RecordTradingRelapseInput {
  tradeDate: string;
  profitLoss: number;
  reason: string;
  notes?: string;
}export function recordTradingRelapse(
  profile: BehaviourProfile,
  input: RecordTradingRelapseInput
): BehaviourProfile {

  // Calculate streak before breaking it
  const streakBroken = calculateCurrentStreak(profile.recoveryStartDate);

  // Create history event
  const event: TradingEvent = {
    id: crypto.randomUUID(),
    tradeDate: input.tradeDate,
    loss: input.profitLoss,
    trigger: input.reason,
    notes: input.notes,
    streakBroken,
  };

  return {
    ...profile,

    tradingHistory: [
  ...(profile.tradingHistory ?? []),
  event,
],

    // Keep compatibility with existing code
    lastTradeDate: input.tradeDate,

    // Start a new recovery
    recoveryStartDate: input.tradeDate,

    longestStreak: Math.max(
      profile.longestStreak,
      streakBroken
    ),
  };
}
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
    tradingHistory: [],
    recoveryStartDate: recoveryStartDate || today,
    lastTradeDate: lastTradeDate || today,
    longestStreak: 0,
    estimatedMonthlyTradingLoss: estimatedMonthlyTradingLoss || 30000, // ₹30,000 default
    dailyReflections: [],
    monthlyHabits: [],
    achievements: [],
    goals: [],
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
 * Dispatches custom event for same-tab updates
 */
export function updateBehaviourProfile(updates: Partial<BehaviourProfile>): BehaviourProfile {
  const existing = getBehaviourProfile();
  const updated = { ...existing, ...updates };
  saveBehaviourProfile(updated);
  
  // Dispatch custom event for same-tab updates
  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent('behaviourProfileUpdated'));
  }
  
  return updated;
}

// =========================================
// DAILY REFLECTION FUNCTIONS
// =========================================

/**
 * Add or update daily reflection
 * Only one reflection per day
 */
export function addDailyReflection(reflection: Omit<DailyReflection, "date">): BehaviourProfile {
  const today = new Date().toISOString().split('T')[0];
  const profile = getBehaviourProfile();
  
  // Remove existing reflection for today if any
  const existingIndex = profile.dailyReflections.findIndex(r => r.date === today);
  const newReflections = [...profile.dailyReflections];
  
  if (existingIndex >= 0) {
    newReflections[existingIndex] = { ...reflection, date: today };
  } else {
    newReflections.push({ ...reflection, date: today });
  }
  
  return updateBehaviourProfile({ dailyReflections: newReflections });
}

/**
 * Get daily reflection for a specific date
 */
export function getDailyReflection(date: string): DailyReflection | null {
  const profile = getBehaviourProfile();
  return profile.dailyReflections.find(r => r.date === date) || null;
}

/**
 * Check if reflection exists for today
 */
export function hasReflectionToday(): boolean {
  const today = new Date().toISOString().split('T')[0];
  return getDailyReflection(today) !== null;
}

// =========================================
// MONTHLY HABIT FUNCTIONS
// =========================================

/**
 * Get or create monthly habit entry for current month
 */
export function getMonthlyHabitEntry(monthKey?: string): MonthlyHabitEntry {
  const profile = getBehaviourProfile();
  const currentMonthKey = monthKey || getCurrentMonthKey();
  
  let entry = profile.monthlyHabits.find(h => h.monthKey === currentMonthKey);
  
  if (!entry) {
    entry = {
      monthKey: currentMonthKey,
      monthlyReviewCompleted: false,
      salaryAllocated: false,
      sipCompleted: false,
      loanPaymentCompleted: false,
      emergencyFundUpdated: false,
      noFAndOTrading: calculateCurrentStreak(profile.lastTradeDate) > 0,
      dailyReflectionCompleted: false,
    };
  }
  
  return entry;
}

/**
 * Update monthly habit entry
 */
export function updateMonthlyHabitEntry(monthKey: string, updates: Partial<MonthlyHabitEntry>): BehaviourProfile {
  const profile = getBehaviourProfile();
  const existingIndex = profile.monthlyHabits.findIndex(h => h.monthKey === monthKey);
  const newHabits = [...profile.monthlyHabits];
  
  if (existingIndex >= 0) {
    newHabits[existingIndex] = { ...newHabits[existingIndex], ...updates };
  } else {
    newHabits.push({ 
      monthKey,
      monthlyReviewCompleted: false,
      salaryAllocated: false,
      sipCompleted: false,
      loanPaymentCompleted: false,
      emergencyFundUpdated: false,
      noFAndOTrading: calculateCurrentStreak(profile.lastTradeDate) > 0,
      dailyReflectionCompleted: false,
      ...updates 
    });
  }
  
  return updateBehaviourProfile({ monthlyHabits: newHabits });
}

/**
 * Get current month key helper
 */
function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// =========================================
// ACHIEVEMENT FUNCTIONS
// =========================================

/**
 * Unlock achievement
 */
export function unlockAchievement(achievement: Omit<BehaviourAchievement, "unlockedAt">): BehaviourProfile {
  const profile = getBehaviourProfile();
  const today = new Date().toISOString().split('T')[0];
  
  // Check if already unlocked
  if (profile.achievements.find(a => a.id === achievement.id)) {
    return profile;
  }
  
  const newAchievement: BehaviourAchievement = {
    ...achievement,
    unlockedAt: today,
  };
  
  return updateBehaviourProfile({ 
    achievements: [...profile.achievements, newAchievement] 
  });
}

/**
 * Check and unlock achievements based on current state
 */
export function checkAchievements(profile: BehaviourProfile): BehaviourProfile {
  const currentStreak = calculateCurrentStreak(profile.lastTradeDate);
  const reflectionCount = profile.dailyReflections.length;
  const updatedProfile = { ...profile };
  
  // 30 Days F&O Free
  if (currentStreak >= 30 && !updatedProfile.achievements.find(a => a.id === "streak-30")) {
    updatedProfile.achievements.push({
      id: "streak-30",
      name: "30 Days F&O Free",
      icon: "🥉",
      unlockedAt: new Date().toISOString().split('T')[0],
      description: "Maintained F&O-free discipline for 30 days",
    });
  }
  
  // 100 Days F&O Free
  if (currentStreak >= 100 && !updatedProfile.achievements.find(a => a.id === "streak-100")) {
    updatedProfile.achievements.push({
      id: "streak-100",
      name: "100 Days F&O Free",
      icon: "🥈",
      unlockedAt: new Date().toISOString().split('T')[0],
      description: "Maintained F&O-free discipline for 100 days",
    });
  }
  
  // 365 Days F&O Free
  if (currentStreak >= 365 && !updatedProfile.achievements.find(a => a.id === "streak-365")) {
    updatedProfile.achievements.push({
      id: "streak-365",
      name: "365 Days F&O Free",
      icon: "🥇",
      unlockedAt: new Date().toISOString().split('T')[0],
      description: "Maintained F&O-free discipline for one year",
    });
  }
  
  // 30 Daily Reflections
  if (reflectionCount >= 30 && !updatedProfile.achievements.find(a => a.id === "reflections-30")) {
    updatedProfile.achievements.push({
      id: "reflections-30",
      name: "30 Daily Reflections",
      icon: "📝",
      unlockedAt: new Date().toISOString().split('T')[0],
      description: "Completed 30 daily reflections",
    });
  }
  
  // Save if achievements were added
  if (updatedProfile.achievements.length !== profile.achievements.length) {
    saveBehaviourProfile(updatedProfile);
  }
  
  return updatedProfile;
}
export function getLastRelapse(
  profile: BehaviourProfile
): TradingEvent | null {
  if (profile.tradingHistory.length === 0) {
    return null;
  }

  return profile.tradingHistory[profile.tradingHistory.length - 1];
}
export function getRecoveryHistory(
  profile: BehaviourProfile
): TradingEvent[] {
  return [...profile.tradingHistory].reverse();
}
export function getRecoverySummary(
  profile: BehaviourProfile
) {
  const currentStreak = calculateCurrentStreak(
    profile.recoveryStartDate
  );

  const relapseCount = profile.tradingHistory.length;

  const totalLoss = profile.tradingHistory.reduce(
    (sum, trade) => sum + trade.loss,
    0
  );

  const averageLoss =
    relapseCount > 0
      ? totalLoss / relapseCount
      : 0;

  return {
    currentStreak,
    longestStreak: profile.longestStreak,
    recoveryStartDate: profile.recoveryStartDate,

    relapseCount,
    totalLoss,
    averageLoss,

    lastRelapse: getLastRelapse(profile),
  };
}
// =========================================
// GOAL FUNCTIONS
// =========================================

/**
 * Add or update goal
 */
export function setGoal(goal: BehaviourGoal): BehaviourProfile {
  const profile = getBehaviourProfile();
  const existingIndex = profile.goals.findIndex(g => g.id === goal.id);
  const newGoals = [...profile.goals];
  
  if (existingIndex >= 0) {
    newGoals[existingIndex] = goal;
  } else {
    newGoals.push(goal);
  }
  
  return updateBehaviourProfile({ goals: newGoals });
}

/**
 * Update goal progress
 */
export function updateGoalProgress(goalId: string, current: number): BehaviourProfile {
  const profile = getBehaviourProfile();
  const goal = profile.goals.find(g => g.id === goalId);
  
  if (!goal) return profile;
  
  return setGoal({ ...goal, current });
}
// =========================================
// RECOVERY INSIGHTS
// =========================================

export function getRecoveryInsights(profile: BehaviourProfile) {
  const history = profile.tradingHistory;

  if (history.length === 0) {
    return {
      totalLoss: 0,
      largestLoss: 0,
      averageLoss: 0,
      mostCommonTrigger: "None",
      totalRelapses: 0,
      estimatedWealthLost: 0,
    };
  }

  const totalLoss = history.reduce(
    (sum, trade) => sum + trade.loss,
    0
  );

  const largestLoss = Math.max(
    ...history.map((trade) => trade.loss)
  );

  const averageLoss = totalLoss / history.length;

  // Count triggers
  const triggerCounts: Record<string, number> = {};

  history.forEach((trade) => {
    triggerCounts[trade.trigger] =
      (triggerCounts[trade.trigger] || 0) + 1;
  });

  const mostCommonTrigger = Object.entries(triggerCounts).sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  // Assume 12% annual return over 20 years
  const estimatedWealthLost = totalLoss * Math.pow(1.12, 20);

  return {
    totalLoss,
    largestLoss,
    averageLoss,
    mostCommonTrigger,
    totalRelapses: history.length,
    estimatedWealthLost,
  };
}