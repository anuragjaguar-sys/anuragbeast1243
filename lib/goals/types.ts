// =========================================
// ATHENA Goal Types
// =========================================

export type GoalCategory =
  | "Retirement"
  | "Vehicle"
  | "Property"
  | "Travel"
  | "Education"
  | "Emergency Fund"
  | "Debt"
  | "Investment"
  | "Insurance"
  | "Lifestyle"
  | "Custom";

export type GoalTimeframe = "Long Term" | "Short Term";

export type GoalPriority =
  | "Critical"
  | "High"
  | "Medium"
  | "Low";

export type GoalStatus =
  | "Not Started"
  | "On Track"
  | "Behind Schedule"
  | "Completed"
  | "Needs Attention"
  | "Paused";

export type CalculatedGoal = {
  id: string;
  type: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  progress: number;
  status: GoalStatus;
};

export interface Goal {

  id: string;

  title: string;

  description: string;

  category?: GoalCategory;

  type?: string;

  timeframe?: GoalTimeframe;

  priority?: GoalPriority;

  status: GoalStatus;

  targetAmount: number;
  targetValue?: number;

  // Updated every month from Monthly Statement
  currentAmount: number;
  currentValue?: number;

  // Automatically calculated
  monthlyRequired?: number;

  // Automatically calculated
  progress: number;

  targetDate?: string;
  notes?: string;
  createdDate?: string;

  completedDate?: string;

  monthlyExpense?: number;

  desiredMonthlyIncome?: number;

}

export interface GoalSummary {

  totalGoals: number;

  completedGoals: number;

  onTrackGoals: number;

  behindGoals: number;

  averageProgress: number;

}
