import PlaceholderPage from "@/components/PlaceholderPage";

export default function AiCfoPage() {
  return (
    <PlaceholderPage
      icon="🤖"
      title="AI CFO"
      subtitle="Intelligent Advisory"
      description="Your personal AI-powered Chief Financial Officer. Get tailored insights, risk assessments, and actionable recommendations based on your complete financial picture."
      accent="emerald"
      features={[
        {
          icon: "🩺",
          title: "Health Assessment",
          description: "Comprehensive financial health score with strengths, risks, and improvement areas.",
        },
        {
          icon: "💡",
          title: "Smart Recommendations",
          description: "Personalized advice on investments, prepayments, and savings optimization.",
        },
        {
          icon: "⚠️",
          title: "Risk Analysis",
          description: "Identify concentration risks, liquidity gaps, and behavioral finance pitfalls.",
        },
        {
          icon: "🗣️",
          title: "Conversational Q&A",
          description: "Ask natural language questions about your finances and get contextual answers.",
        },
        {
          icon: "📅",
          title: "Monthly Briefings",
          description: "Automated monthly summaries highlighting key changes and action items.",
        },
        {
          icon: "🎯",
          title: "Scenario Planning",
          description: "What-if analysis for major financial decisions like prepayments or job changes.",
        },
      ]}
    />
  );
}
