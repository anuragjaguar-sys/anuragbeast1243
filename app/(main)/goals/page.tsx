import PlaceholderPage from "@/components/PlaceholderPage";

export default function GoalsPage() {
  return (
    <PlaceholderPage
      icon="🎯"
      title="Goals"
      subtitle="Financial Targets"
      description="Set, track, and achieve your financial goals — from emergency funds to retirement. Visualize progress and stay motivated on your FIRE journey."
      accent="violet"
      features={[
        {
          icon: "🛡️",
          title: "Emergency Fund",
          description: "Track your safety net with target months of expenses and current coverage ratio.",
        },
        {
          icon: "🏠",
          title: "Home Loan Payoff",
          description: "Monitor progress toward becoming debt-free with milestone celebrations.",
        },
        {
          icon: "🌴",
          title: "Retirement / FIRE",
          description: "Set your FIRE number and track corpus growth against your target retirement date.",
        },
        {
          icon: "✈️",
          title: "Lifestyle Goals",
          description: "Plan for travel, education, or major purchases with dedicated savings buckets.",
        },
        {
          icon: "📈",
          title: "Milestone Tracking",
          description: "Break large goals into milestones with projected completion dates.",
        },
        {
          icon: "🔔",
          title: "Goal Alerts",
          description: "Receive notifications when you're ahead or behind on goal contributions.",
        },
      ]}
    />
  );
}
