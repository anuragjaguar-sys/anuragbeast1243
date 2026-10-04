"use client";

import { useEffect, useState, useRef } from "react";
import {
  getBehaviourProfile,
  updateBehaviourProfile,
  type BehaviourProfile,
} from "@/lib/behaviour-engine";
import { StorageManager } from "@/lib/core/storage-manager";
import { CloudSyncService } from "@/lib/core/sync-service";

export default function SettingsPage() {
  const [profile, setProfile] = useState<BehaviourProfile | null>(null);
  const [recoveryStartDate, setRecoveryStartDate] = useState("");
  const [estimatedMonthlyLoss, setEstimatedMonthlyLoss] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Backup & Restore states
  const [backupStatus, setBackupStatus] = useState<string>("");
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } catch (_error) {
      setSaveMessage("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        appName: "FIRE54",
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        data: {
          profile: StorageManager.get(StorageManager.KEYS.PROFILE, null),
          portfolio: StorageManager.get(StorageManager.KEYS.PORTFOLIO, []),
          goals: StorageManager.get(StorageManager.KEYS.GOALS, []),
          goalLedger: StorageManager.get(StorageManager.KEYS.GOAL_LEDGER, null),
          monthlyReviews: StorageManager.get(StorageManager.KEYS.MONTHLY_REVIEWS, []),
          behaviourProfile: StorageManager.get(StorageManager.KEYS.BEHAVIOUR_PROFILE, null),
        },
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `fire54-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupStatus("Backup downloaded successfully!");
      setTimeout(() => setBackupStatus(""), 4000);
    } catch (err) {
      console.error("Export failed:", err);
      setBackupStatus("Failed to export backup.");
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setBackupStatus("Restoring data and syncing to cloud...");

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const payload = parsed.data || parsed;

      if (payload.portfolio && Array.isArray(payload.portfolio)) {
        StorageManager.set(StorageManager.KEYS.PORTFOLIO, payload.portfolio);
        StorageManager.set("portfolio", payload.portfolio);
        void CloudSyncService.pushStore("portfolio", payload.portfolio);
      }

      if (payload.profile) {
        StorageManager.set(StorageManager.KEYS.PROFILE, payload.profile);
      }

      if (payload.goals && Array.isArray(payload.goals)) {
        StorageManager.set(StorageManager.KEYS.GOALS, payload.goals);
        void CloudSyncService.pushStore("goals", payload.goals);
      }

      if (payload.goalLedger) {
        StorageManager.set(StorageManager.KEYS.GOAL_LEDGER, payload.goalLedger);
        void CloudSyncService.pushStore("goalLedger", payload.goalLedger);
      }

      if (payload.monthlyReviews && Array.isArray(payload.monthlyReviews)) {
        StorageManager.set(StorageManager.KEYS.MONTHLY_REVIEWS, payload.monthlyReviews);
      }

      if (payload.behaviourProfile) {
        StorageManager.set(StorageManager.KEYS.BEHAVIOUR_PROFILE, payload.behaviourProfile);
        void CloudSyncService.pushStore("behaviourProfile", payload.behaviourProfile);
      }

      setBackupStatus("Backup restored successfully! Reloading page...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Restore failed:", err);
      setBackupStatus("Error: Invalid backup file format.");
      setIsRestoring(false);
    }
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
            Configure your FIRE54 preferences and manage data
          </p>
        </header>

        {/* Data Backup & Cloud Restore */}
        <section className="mb-8 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">💾</span>
              <h2 className="text-lg font-semibold text-white">Data Backup & Restore</h2>
            </div>
            <p className="mt-0.5 font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
              Export your data offline or restore to any device
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Export */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Export Backup</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Download all your portfolio assets, liabilities, financial profile, goals, and monthly statements as a JSON file.
                </p>
              </div>
              <button
                onClick={handleExportBackup}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
              >
                <span>📥</span> Download Backup (JSON)
              </button>
            </div>

            {/* Import */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Restore from Backup</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Upload a previously exported FIRE54 JSON backup file. All restored records will also sync with Supabase.
                </p>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportBackup}
                  accept=".json,application/json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRestoring}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700 hover:text-white disabled:opacity-50"
                >
                  <span>📤</span> {isRestoring ? "Restoring..." : "Upload & Restore (JSON)"}
                </button>
              </div>
            </div>
          </div>

          {backupStatus && (
            <div className={`mt-4 rounded-xl border p-3 text-xs ${
              backupStatus.includes("Error") || backupStatus.includes("Failed")
                ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            }`}>
              {backupStatus}
            </div>
          )}
        </section>

        {/* Behaviour & Discipline Settings */}
        <section className="mb-8 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Behaviour & Discipline</h2>
            <p className="mt-0.5 font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
              Financial discipline configuration
            </p>
          </div>

          <div className="space-y-6">
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
      </main>
    </div>
  );
}
