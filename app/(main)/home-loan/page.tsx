import PlaceholderPage from "@/components/PlaceholderPage";

export default function HomeLoanPage() {
  return (
    <PlaceholderPage
      icon="🏦"
      title="Home Loan"
      subtitle="Liability Management"
      description="Take control of your home loan with amortization schedules, prepayment planning, and interest savings projections."
      accent="rose"
      features={[
        {
          icon: "📑",
          title: "Loan Summary",
          description: "Outstanding principal, interest rate, tenure remaining, and EMI breakdown at a glance.",
        },
        {
          icon: "📆",
          title: "Amortization Schedule",
          description: "Full payment schedule showing principal vs interest split for every EMI.",
        },
        {
          icon: "💸",
          title: "Prepayment Planner",
          description: "Model lump-sum and recurring prepayments to see interest saved and tenure reduced.",
        },
        {
          icon: "📊",
          title: "Interest vs Principal",
          description: "Visualize how your payments shift from interest-heavy to principal-heavy over time.",
        },
        {
          icon: "🎯",
          title: "Closure Timeline",
          description: "Project your loan-free date based on current prepayment strategy and cash flows.",
        },
        {
          icon: "⚡",
          title: "Rate Change Impact",
          description: "Simulate the effect of interest rate changes on EMI and total interest payable.",
        },
      ]}
    />
  );
}
