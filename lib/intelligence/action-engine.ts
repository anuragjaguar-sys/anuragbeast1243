import { getDecisionPlan, DecisionPlan } from "@/lib/intelligence/decision-engine";

export type ActionStatus = "Pending" | "Active" | "Completed";

export interface AthenaAction {
  id: string;
  title: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  status: ActionStatus;
  targetDate?: string;
  completedDate?: string;
  impact: string;
}

function makeId(prefix = "act") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function generateActions(plan: DecisionPlan): AthenaAction[] {
  const actions: AthenaAction[] = [];

  if (!plan) return actions;

  switch (plan.phase) {
    case "Behavioural Protection":
      actions.push({
        id: makeId("behaviour"),
        title: "Protect F&O-Free Recovery",
        category: "Behaviour",
        priority: "High",
        status: "Pending",
        impact: "Protects the recovery streak and prevents further trading-related capital destruction",
      });
      break;

    case "Financial Safety":
      actions.push({
        id: makeId("emergency"),
        title: "Build Emergency Fund",
        category: "Safety",
        priority: "High",
        status: "Pending",
        impact: "Protects liquidity and prevents forced asset sales during income shocks",
      });
      break;

    case "Debt Reduction":
      actions.push({
        id: makeId("home-loan"),
        title: "Close Home Loan",
        category: "Debt",
        priority: "High",
        status: "Pending",
        impact: "After closure redirect EMI amount into investments",
      });
      break;

    case "Retirement Optimisation":
      actions.push({
        id: makeId("retirement"),
        title: "Increase Long Term Investments",
        category: "Wealth",
        priority: "High",
        status: "Pending",
        impact: "Increase SIPs or contributions to close retirement funding gap",
      });
      break;

    case "Wealth Acceleration":
    default:
      actions.push({
        id: makeId("wealth"),
        title: "Grow Equity Investments",
        category: "Wealth",
        priority: "Medium",
        status: "Pending",
        impact: "Gradually increase equity allocation and tax-efficient investments",
      });
      break;
  }

  return actions;
}

export function getTopPriorityAction(
  actions: AthenaAction[]
): AthenaAction | null {
  if (!actions || actions.length === 0) return null;

  const priorityOrder: Record<string, number> = {
    High: 3,
    Medium: 2,
    Low: 1,
  };

  const unfinished = actions.filter((a) => a.status !== "Completed");

  if (unfinished.length === 0) return null;

  unfinished.sort((a, b) => {
    const p = priorityOrder[b.priority] - priorityOrder[a.priority];

    if (p !== 0) return p;

    const statusOrder: Record<string, number> = {
      Active: 2,
      Pending: 1,
      Completed: 0,
    };

    const s = statusOrder[b.status] - statusOrder[a.status];

    if (s !== 0) return s;

    return a.id.localeCompare(b.id);
  });

  return unfinished[0] || null;
}