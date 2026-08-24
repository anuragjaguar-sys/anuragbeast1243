"use client";

import { useState } from "react";

import {
  getBehaviourProfile,
  saveBehaviourProfile,
  recordTradingRelapse,
} from "@/lib/behaviour-engine";

type RecordRelapseModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function RecordRelapseModal({
  isOpen,
  onClose,
}: RecordRelapseModalProps) {
  const today = new Date().toISOString().split("T")[0];

  const [tradeDate, setTradeDate] = useState(today);
  const [loss, setLoss] = useState("");
  const [trigger, setTrigger] = useState("Greed");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSaveRelapse = () => {
    if (!loss || Number(loss) <= 0) {
      alert("Please enter a valid loss amount.");
      return;
    }

    try {
      // Load existing behaviour profile
      const profile = getBehaviourProfile();

      // Record relapse
      const updatedProfile = recordTradingRelapse(profile, {
        tradeDate,
        profitLoss: Number(loss),
        reason: trigger,
        notes,
      });

      // Save updated profile
      saveBehaviourProfile(updatedProfile);

      // Notify dashboard to refresh immediately
      window.dispatchEvent(
        new CustomEvent("behaviourProfileUpdated")
      );

      alert("Relapse recorded successfully.");

      // Reset form
      setTradeDate(today);
      setLoss("");
      setTrigger("Greed");
      setNotes("");

      // Close modal
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to record relapse.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            Record F&O Relapse
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Close
          </button>
        </div>

        <div className="space-y-5">

          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              Date of Relapse
            </label>

            <input
              type="date"
              value={tradeDate}
              onChange={(e) => setTradeDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              Loss (₹)
            </label>

            <input
              type="number"
              value={loss}
              onChange={(e) => setLoss(e.target.value)}
              placeholder="400000"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              Trigger
            </label>

            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
            >
              <option>Greed</option>
              <option>FOMO</option>
              <option>Overconfidence</option>
              <option>Stress</option>
              <option>Revenge Trading</option>
              <option>News Event</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              Notes
            </label>

            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">

            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-700 py-3 font-semibold text-white hover:bg-zinc-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveRelapse}
              className="flex-1 rounded-xl bg-rose-600 py-3 font-semibold text-white hover:bg-rose-700"
            >
              Save Relapse
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}