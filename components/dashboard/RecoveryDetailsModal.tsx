"use client";

import { useEffect, useState } from "react";

import {
  getBehaviourProfile,
  getRecoverySummary,
  getRecoveryHistory,
  getRecoveryInsights,
} from "@/lib/behaviour-engine";
interface RecoveryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RecoveryDetailsModal({
  isOpen,
  onClose,
}: RecoveryDetailsModalProps) {
  const [profile, setProfile] = useState(getBehaviourProfile());

  useEffect(() => {
    const loadProfile = () => {
      setProfile(getBehaviourProfile());
    };

    loadProfile();

    window.addEventListener(
      "behaviourProfileUpdated",
      loadProfile
    );

    return () => {
      window.removeEventListener(
        "behaviourProfileUpdated",
        loadProfile
      );
    };
  }, []);

  const summary = getRecoverySummary(profile);
  const history = getRecoveryHistory(profile);
  const insights = getRecoveryInsights(profile);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">

        {/* Header */}

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            Recovery Details
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Close
          </button>
        </div>

        {/* Summary Cards */}

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">

          <div className="rounded-xl bg-zinc-800 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Current Streak
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-400">
              {summary.currentStreak}
            </p>

            <p className="text-sm text-zinc-400">
              Days
            </p>
          </div>

          <div className="rounded-xl bg-zinc-800 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Longest Streak
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {summary.longestStreak}
            </p>

            <p className="text-sm text-zinc-400">
              Days
            </p>
          </div>

          <div className="rounded-xl bg-zinc-800 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Total Relapses
            </p>

            <p className="mt-2 text-2xl font-bold text-rose-400">
              {summary.relapseCount}
            </p>
          </div>

          <div className="rounded-xl bg-zinc-800 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Recovery Started
            </p>

            <p className="mt-2 text-sm font-semibold text-white">
              {new Date(summary.recoveryStartDate).toLocaleDateString("en-IN")}
            </p>
          </div>

        </div>

        {/* Financial Summary */}

        <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-800/40 p-5">

          <h3 className="mb-4 text-lg font-semibold text-emerald-400">
            Financial Recovery
          </h3>

          <div className="space-y-3">

            <div className="flex justify-between">
              <span className="text-zinc-400">
                Total Trading Loss
              </span>

              <span className="font-semibold text-rose-400">
                ₹{summary.totalLoss.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">
                Average Loss / Relapse
              </span>

              <span className="font-semibold text-white">
                ₹{Math.round(summary.averageLoss).toLocaleString("en-IN")}
              </span>
            </div>

          </div>

        </div>
<div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-800/40 p-5">

  <h3 className="mb-4 text-lg font-semibold text-cyan-400">
    Recovery Insights
  </h3>

  <div className="space-y-3">

    <div className="flex justify-between">
      <span className="text-zinc-400">
        Most Common Trigger
      </span>

      <span className="font-semibold text-white">
        {insights.mostCommonTrigger}
      </span>
    </div>

    <div className="flex justify-between">
      <span className="text-zinc-400">
        Largest Single Loss
      </span>

      <span className="font-semibold text-rose-400">
        ₹{insights.largestLoss.toLocaleString("en-IN")}
      </span>
    </div>

    <div className="flex justify-between">
      <span className="text-zinc-400">
        Average Loss
      </span>

      <span className="font-semibold text-white">
        ₹{Math.round(insights.averageLoss).toLocaleString("en-IN")}
      </span>
    </div>

    <div className="flex justify-between">
      <span className="text-zinc-400">
        Estimated Wealth Lost
      </span>

      <span className="font-semibold text-amber-400">
        ₹{Math.round(insights.estimatedWealthLost).toLocaleString("en-IN")}
      </span>
    </div>

  </div>

</div>
        {/* Last Relapse */}

        <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-800/40 p-5">

          <h3 className="mb-4 text-lg font-semibold text-rose-400">
            Last Relapse
          </h3>

          {summary.lastRelapse ? (
            <div className="space-y-2 text-zinc-300">

              <p>
                <strong>Date:</strong>{" "}
                {new Date(summary.lastRelapse.tradeDate).toLocaleDateString("en-IN")}
              </p>

              <p>
                <strong>Loss:</strong>{" "}
                ₹{summary.lastRelapse.loss.toLocaleString("en-IN")}
              </p>

              <p>
                <strong>Trigger:</strong>{" "}
                {summary.lastRelapse.trigger}
              </p>

              <p>
                <strong>Streak Broken:</strong>{" "}
                {summary.lastRelapse.streakBroken} Days
              </p>

              {summary.lastRelapse.notes && (
                <p>
                  <strong>Notes:</strong>{" "}
                  {summary.lastRelapse.notes}
                </p>
              )}

            </div>
          ) : (
            <p className="text-zinc-500">
              No relapses recorded.
            </p>
          )}

        </div>

        {/* Recovery Timeline */}

        <div>

          <h3 className="mb-4 text-lg font-semibold text-white">
            Recovery Timeline
          </h3>

          {history.length === 0 ? (
            <p className="text-zinc-500">
              No relapse history available.
            </p>
          ) : (
            <div className="space-y-4">

              {history.map((trade) => (

                <div
                  key={trade.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4"
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="font-semibold text-white">
                        {new Date(trade.tradeDate).toLocaleDateString("en-IN")}
                      </p>

                      <p className="text-sm text-zinc-500">
                        {trade.trigger}
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="font-semibold text-rose-400">
                        ₹{trade.loss.toLocaleString("en-IN")}
                      </p>

                      <p className="text-xs text-zinc-500">
                        Broke {trade.streakBroken} day streak
                      </p>

                    </div>

                  </div>

                  {trade.notes && (
                    <p className="mt-3 text-sm text-zinc-400">
                      {trade.notes}
                    </p>
                  )}

                </div>

              ))}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}