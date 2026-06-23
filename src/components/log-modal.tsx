"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import type { Food } from "@/lib/api";
import { fmt } from "@/lib/utils";

/**
 * Build the unit options for a given food.
 *
 * - Canonical unit (food.unit) is always offered.
 * - `g` is offered when the food has a known grams-per-unit conversion
 *   OR when the canonical unit is already `g` (degenerate case, dedup).
 * - For piece-based foods like Egg (50g) the user can switch between
 *   "piece" and "g", and kcal scales correctly through grams.
 */
function buildUnitOptions(food: Food): { value: string; label: string; perCanonical: number }[] {
  // perCanonical: how much of 1 canonical unit does 1 of THIS option represent?
  //   e.g. canonical=cup, unit_grams=240 → 1g = 1/240 of a cup → perCanonical = 1/240
  //        canonical=cup, choosing cup    → perCanonical = 1
  const opts: { value: string; label: string; perCanonical: number }[] = [];

  // Canonical (always)
  opts.push({
    value: food.unit,
    label: `${food.unit}${food.unit_grams ? ` (${fmt.dec(food.unit_grams)}g each)` : ""}`,
    perCanonical: 1,
  });

  // Grams option when the food has unit_grams or its canonical is already g
  if (food.unit !== "g") {
    if (food.unit_grams && food.unit_grams > 0) {
      opts.push({
        value: "g",
        label: "g",
        perCanonical: 1 / food.unit_grams,
      });
    }
  }
  return opts;
}

export function LogModal({
  food, onClose, onLogged,
}: {
  food: Food | null;
  onClose: () => void;
  onLogged: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState<string | null>(null);
  const [meal, setMeal] = useState<"breakfast" | "lunch" | "dinner" | "snack">("snack");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const unitOptions = useMemo(() => (food ? buildUnitOptions(food) : []), [food]);

  // Initialize selected unit to canonical when food changes
  const activeUnit = unit ?? (food?.unit ?? "");
  const selected = unitOptions.find((o) => o.value === activeUnit) ?? unitOptions[0];

  if (!food || !selected) return null;

  // Convert the user-entered qty (in selected unit) → canonical-unit quantity
  // That's what gets stored & multiplied by food.kcal (which is per-canonical)
  const canonicalQty = qty * selected.perCanonical;
  const totalKcal     = food.kcal      * canonicalQty;
  const totalProtein  = food.protein_g * canonicalQty;
  const totalCarbs    = food.carbs_g   * canonicalQty;
  const totalFat      = food.fat_g     * canonicalQty;

  const submit = async () => {
    if (!qty || qty <= 0 || canonicalQty <= 0) return;
    setSaving(true);
    try {
      await api.post("/api/log", {
        food_id: food.id,
        quantity: canonicalQty,    // always store in canonical units
        meal_category: meal,
        note,
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
                <label className="label">Quantity</label>
                <input
                  type="number" step={0.1} min={0} value={qty}
                  onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
                  className="input"
                />
              </div>
              {unitOptions.length > 1 ? (
                <div>
                  <label className="label">Unit</label>
                  <select
                    value={activeUnit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="input min-w-[140px]"
                  >
                    {unitOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="label">Unit</label>
                  <div className="input opacity-70 cursor-not-allowed">{selected.label}</div>
                </div>
              )}
            </div>

            {/* Live conversion hint when user picked a non-canonical unit */}
            {activeUnit !== food.unit && (
              <div className="text-xs text-[rgb(var(--fg-muted))] -mt-2">
                = {fmt.dec(canonicalQty, 2)} {food.unit}{canonicalQty === 1 ? "" : "s"}
              </div>
            )}

            <div>
              <label className="label">Note (optional)</label>
              <input
                type="text" value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. post-workout"
                className="input"
              />
            </div>

            <div className="pt-2 grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-xl bg-emerald-500/5">
                <div className="text-[10px] text-[rgb(var(--fg-muted))]">kcal</div>
                <div className="text-base font-bold text-emerald-500 tabular-nums">{fmt.dec(totalKcal, 0)}</div>
              </div>
              <div className="p-2 rounded-xl bg-blue-500/5">
                <div className="text-[10px] text-[rgb(var(--fg-muted))]">P</div>
                <div className="text-base font-bold text-blue-500 tabular-nums">{fmt.dec(totalProtein, 1)}g</div>
              </div>
              <div className="p-2 rounded-xl bg-orange-500/5">
                <div className="text-[10px] text-[rgb(var(--fg-muted))]">C</div>
                <div className="text-base font-bold text-orange-500 tabular-nums">{fmt.dec(totalCarbs, 1)}g</div>
              </div>
              <div className="p-2 rounded-xl bg-red-500/5">
                <div className="text-[10px] text-[rgb(var(--fg-muted))]">F</div>
                <div className="text-base font-bold text-red-500 tabular-nums">{fmt.dec(totalFat, 1)}g</div>
              </div>
            </div>

            <button onClick={submit} disabled={saving || qty <= 0} className="btn btn-primary w-full disabled:opacity-50">
              {saving ? "Logging…" : "Log to Diary"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
