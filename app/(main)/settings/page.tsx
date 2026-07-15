"use client";

import { useEffect, useState } from "react";
import {
  getBehaviourProfile,
  updateBehaviourProfile,
  type BehaviourProfile,
} from "@/lib/behaviour-engine";

export default function SettingsPage() {
  const [profile, setProfile] = useState<BehaviourProfile | null>(null);
  const [recoveryStartDate, setRecoveryStartDate] = useState("");
  const [estimatedMonthlyLoss, setEstimatedMonthlyLoss] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const loadProfile = () => {
      const behaviourProfile = getBehaviourProfile();
      setProfile(behaviourProfile);
      setRecoveryStartDate(behaviourProfile.recoveryStartDate);
      setEstimatedMonthlyLoss(behaviourProfile.estimatedMonthlyTradingLoss.toString());
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    setSaveMessage("");

    try {
      updateBehaviourProfile({
        recoveryStartDate,
        estimatedMonthlyTradingLoss: parseInt(estimatedMonthlyLoss) || 30000,
      });

      setProfile(getBehaviourProfile());
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateForInput = (dateString: string) => {
    return dateString; // Already in YYYY-MM-DD format
  };

  return (
    <div className="min-h-full bg-[#0a0a0c] font-sans text-zinc-100">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/[0.04] blur-[120px]" />
        <div className="absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-violet-500/[0.03] blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[600px] rounded-full bg-emerald-500/[0.03] blur-[100px]" />
      </div>

      <main className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <header className="mb-10">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/20">
              <span className="text-lg">⚙️</span>
            </div>
            <p className="font-mono text-xs tracking-[0.3em] text-blue-500/80 uppercase">
              Configuration
            </p>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Settings
          </h1>
          <p className="mt-1 text-base text-zinc-400">
            Configure your FIRE54 experience
          </p>
        </header>

        {/* Behaviour & Discipline Settings */}
        <section className="mb-8 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Behaviour & Discipline</h2>
            <p className="mt-0.5 font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
              Financial discipline configuration
            </p>
          </div>

          <div className="space-y-6">
            {/* Recovery Start Date */}
            <div>
              <label className="mb-2 block font-mono text-[11px] tracking-wider text-zinc-400 uppercase">
                Recovery Start Date
              </label>
              <input
                type="date"
                value={recoveryStartDate}
                onChange={(e) => setRecoveryStartDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-500 transition-all duration-300 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="mt-2 text-xs text-zinc-500">
                The date you started your F&O-free journey
              </p>
            </div>

            {/* Estimated Monthly Trading Loss */}
            <div>
              <label className="mb-2 block font-mono text-[11px] tracking-wider text-zinc-400 uppercase">
                Estimated Monthly Trading Loss
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
                <input
                  type="number"
                  value={estimatedMonthlyLoss}
                  onChange={(e) => setEstimatedMonthlyLoss(e.target.value)}
                  placeholder="30000"
                  className="w-full rounded-xl border border-zinc-800/60 bg-zinc-900/50 pl-8 pr-4 py-3 text-white placeholder-zinc-500 transition-all duration-300 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Estimated amount you would have lost per month from F&O trading
              </p>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:from-blue-400 hover:to-blue-500 hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              {saveMessage && (
                <p className={`text-sm ${saveMessage.includes("success") ? "text-emerald-400" : "text-rose-400"}`}>
                  {saveMessage}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Placeholder for other settings */}
        <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Coming Soon</h2>
            <p className="mt-0.5 font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
              Additional settings
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <p className="font-medium text-white">Profile</p>
                  <p className="text-xs text-zinc-500">Personal information</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💱</span>
                <div>
                  <p className="font-medium text-white">Currency & Locale</p>
                  <p className="text-xs text-zinc-500">Display preferences</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔔</span>
                <div>
                  <p className="font-medium text-white">Notifications</p>
                  <p className="text-xs text-zinc-500">Alerts and reminders</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎨</span>
                <div>
                  <p className="font-medium text-white">Appearance</p>
                  <p className="text-xs text-zinc-500">Theme and layout</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
