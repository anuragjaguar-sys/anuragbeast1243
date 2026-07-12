import PlaceholderPage from "@/components/PlaceholderPage";

export default function SettingsPage() {
  return (
    <PlaceholderPage
      icon="⚙️"
      title="Settings"
      subtitle="Configuration"
      description="Configure your FIRE54 experience. Manage profile preferences, currency settings, notification rules, and data privacy controls."
      accent="blue"
      features={[
        {
          icon: "👤",
          title: "Profile",
          description: "Set your name, age, retirement target, and personal FIRE number.",
        },
        {
          icon: "💱",
          title: "Currency & Locale",
          description: "Configure display currency, number formatting, and regional preferences.",
        },
        {
          icon: "🔔",
          title: "Notifications",
          description: "Control alerts for SIP debits, goal milestones, and monthly review reminders.",
        },
        {
          icon: "🎨",
          title: "Appearance",
          description: "Customize theme, accent colors, and dashboard layout preferences.",
        },
        {
          icon: "🔒",
          title: "Privacy & Security",
          description: "Manage data encryption, export controls, and session security settings.",
        },
        {
          icon: "💾",
          title: "Data Management",
          description: "Backup, restore, or reset your financial data with full export capabilities.",
        },
      ]}
    />
  );
}
