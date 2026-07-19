"use client";

import { useEffect, useState } from "react";
import {
  getMonthlyHabitEntry,
  updateMonthlyHabitEntry,
  checkAchievements,
  type MonthlyHabitEntry,
} from "@/lib/behaviour-engine";
import {
  getMonthlyDisciplineScore,
  getHabitCompletionPercentage,
  getCurrentMonthKey,
} from "@/lib/behaviour-insights";

export default function HabitTracker() {
  const [habits, setHabits] = useState<MonthlyHabitEntry | null>(null);
  const [monthlyScore, setMonthlyScore] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadData();

    // Listen for behaviour profile updates
    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('behaviourProfileUpdated', handleUpdate);
    return () => window.removeEventListener('behaviourProfileUpdated', handleUpdate);
  }, []);

  const loadData = () => {
    const currentMonthKey = getCurrentMonthKey();
    const currentHabits = getMonthlyHabitEntry(currentMonthKey);
    setHabits(currentHabits);
    setMonthlyScore(getMonthlyDisciplineScore(currentHabits));
    setCompletionPercentage(getHabitCompletionPercentage(currentHabits));
  };

  const handleToggle = async (habitKey: keyof MonthlyHabitEntry) => {
    if (!habits || isUpdating) return;

    setIsUpdating(true);
    try {
      const updatedHabits = { ...habits, [habitKey]: !habits[habitKey] };
      const currentMonthKey = getCurrentMonthKey();
      
      updateMonthlyHabitEntry(currentMonthKey, updatedHabits);
      
      // Check for achievements
      checkAchievements({ 
        recoveryStartDate: "", 
        lastTradeDate: "", 
        longestStreak: 0, 
        estimatedMonthlyTradingLoss: 0,
        dailyReflections: [],
        monthlyHabits: [updatedHabits],
        achievements: [],
        goals: [],
      });
      
      loadData();
    } catch (error) {
      console.error("Failed to update habit:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-blue-400";
    if (score >= 40) return "text-amber-400";
    return "text-rose-400";
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 60) return "bg-blue-500";
    if (percentage >= 40) return "bg-amber-500";
    return "bg-rose-500";
  };

  const habitItems = [
    { key: "monthlyReviewCompleted" as const, label: "Monthly Review", icon: "📊" },
    { key: "salaryAllocated" as const, label: "Salary Allocated", icon: "💰" },
    { key: "sipCompleted" as const, label: "SIP Completed", icon: "📈" },
    { key: "loanPaymentCompleted" as const, label: "Loan Payment", icon: "🏠" },
    { key: "emergencyFundUpdated" as const, label: "Emergency Fund", icon: "🛡️" },
    { key: "noFAndOTrading" as const, label: "No F&O Trading", icon: "🚫" },
  ];

  if (!habits) return null;

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6">
      <div className="mb-6">
        <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">
          Monthly Habit Tracker
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400">Monthly Discipline Score</p>
            <p className={`mt-1 text-2xl font-semibold ${getScoreColor(monthlyScore)}`}>
              {monthlyScore}/100
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400">Completion</p>
            <p className={`mt-1 text-2xl font-semibold ${getScoreColor(completionPercentage)}`}>
              {completionPercentage}%
            </p>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="mt-3 h-2 w-full rounded-full bg-zinc-800">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getCompletionColor(completionPercentage)}`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {habitItems.map((habit) => (
          <button
            key={habit.key}
            onClick={() => handleToggle(habit.key)}
            disabled={isUpdating || habit.key === "noFAndOTrading"} // No F&O Trading is auto-calculated
            className={`w-full rounded-xl border p-4 text-left transition-all duration-300 ${
              habits[habit.key]
                ? "border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/50"
                : "border-zinc-800/60 bg-zinc-900/50 hover:border-zinc-700/60"
            } ${habit.key === "noFAndOTrading" ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{habit.icon}</span>
                <span className="text-sm font-medium text-white">{habit.label}</span>
              </div>
              <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                habits[habit.key] ? "bg-emerald-500" : "bg-zinc-800"
              }`}>
                {habits[habit.key] && (
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-zinc-500">
        No F&O Trading is automatically calculated from your streak
      </p>
    </div>
  );
}
