"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import type { Food } from "@/lib/api";
import { fmt } from "@/lib/utils";

export function LogModal({
  food, onClose, onLogged,
}: {
  food: Food | null;
  onClose: () => void;
  onLogged: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [meal, setMeal] = useState<"breakfast" | "lunch" | "dinner" | "snack">("snack");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (!food) return null;

  const submit = async () => {
    if (!qty || qty <= 0) return;
    setSaving(true);
    try {
      await api.post("/api/log", {
        food_id: food.id, quantity: qty, meal_category: meal, note,
      });
      onLogged();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", duration: 0.4 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card w-full max-w-md p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-[rgb(var(--fg-muted))] uppercase tracking-wider mb-1">Log Food</div>
              <h3 className="text-lg font-bold">{food.name}</h3>
              <div className="text-xs text-[rgb(var(--fg-muted))] mt-1 tabular-nums">
                per 1 {food.unit}: {fmt.dec(food.kcal)} kcal · P {fmt.dec(food.protein_g)} · C {fmt.dec(food.carbs_g)} · F {fmt.dec(food.fat_g)}
              </div>
            </div>
            <button onClick={onClose} className="btn btn-ghost p-1"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4 mt-6">
            <div>
              <label className="label">Meal</label>
              <div className="grid grid-cols-4 gap-2">
                {(["breakfast", "lunch", "dinner", "snack"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMeal(m)}
                    className={`btn ${meal === m ? "btn-primary" : "btn-outline"} capitalize text-xs`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <div>
                <label className="label">Quantity ({food.unit})</label>
                <input
                  type="number" step={0.1} min={0} value={qty}
                  onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Note (optional)</label>
              <input
                type="text" value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. post-workout"
                className="input"
              />
            </div>

            <div className="pt-2 grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-emerald-500/5">
                <div className="text-xs text-[rgb(var(--fg-muted))]">Total kcal</div>
                <div className="text-lg font-bold text-emerald-500 tabular-nums">{fmt.dec(food.kcal * qty, 0)}</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/5">
                <div className="text-xs text-[rgb(var(--fg-muted))]">Total protein</div>
                <div className="text-lg font-bold text-blue-500 tabular-nums">{fmt.dec(food.protein_g * qty)}g</div>
              </div>
            </div>

            <button onClick={submit} disabled={saving} className="btn btn-primary w-full">
              {saving ? "Logging…" : "Log to Diary"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
