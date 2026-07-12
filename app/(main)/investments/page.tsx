import PlaceholderPage from "@/components/PlaceholderPage";

export default function InvestmentsPage() {
  return (
    <PlaceholderPage
      icon="📈"
      title="Investments"
      subtitle="Portfolio"
      description="Manage your entire investment portfolio in one place. Track mutual funds, stocks, PPF, NPS, and other assets with real-time valuations."
      accent="emerald"
      features={[
        {
          icon: "📊",
          title: "Holdings Overview",
          description: "View all investment holdings with current values, allocation percentages, and cost basis.",
        },
        {
          icon: "🔄",
          title: "SIP Tracker",
          description: "Monitor active SIPs across funds with next debit dates and cumulative invested amounts.",
        },
        {
          icon: "📉",
          title: "Performance Analytics",
          description: "Track XIRR, absolute returns, and benchmark comparisons for each asset class.",
        },
        {
          icon: "⚖️",
          title: "Rebalancing Alerts",
          description: "Get notified when portfolio drift exceeds your target allocation thresholds.",
        },
        {
          icon: "🏛️",
          title: "Tax-Advantaged Accounts",
          description: "Dedicated views for PPF, NPS, EPF with lock-in periods and maturity tracking.",
        },
        {
          icon: "🔔",
          title: "Market Updates",
          description: "Stay informed on NAV changes, dividend announcements, and corporate actions.",
        },
      ]}
    />
  );
}
