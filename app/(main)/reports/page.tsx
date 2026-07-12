import PlaceholderPage from "@/components/PlaceholderPage";

export default function ReportsPage() {
  return (
    <PlaceholderPage
      icon="📊"
      title="Reports"
      subtitle="Analytics"
      description="Generate comprehensive financial reports and insights. Understand your wealth trajectory with beautiful charts and exportable summaries."
      accent="amber"
      features={[
        {
          icon: "📈",
          title: "Net Worth History",
          description: "Track net worth growth over months and years with trend lines and growth rates.",
        },
        {
          icon: "🥧",
          title: "Asset Allocation",
          description: "Historical allocation charts showing how your portfolio composition has evolved.",
        },
        {
          icon: "💹",
          title: "Income vs Expenses",
          description: "Annual and monthly cash flow reports with savings rate trends.",
        },
        {
          icon: "📋",
          title: "Tax Summary",
          description: "Consolidated view of capital gains, deductions, and tax-advantaged contributions.",
        },
        {
          icon: "📄",
          title: "PDF Export",
          description: "Generate professional PDF reports for personal records or financial advisors.",
        },
        {
          icon: "🔍",
          title: "Custom Date Ranges",
          description: "Filter any report by custom date ranges, quarters, or financial years.",
        },
      ]}
    />
  );
}
