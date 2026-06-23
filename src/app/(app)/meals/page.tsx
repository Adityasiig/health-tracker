"use client";

import { useApiSWR } from "@/lib/use-api-swr";
import { api } from "@/lib/api";
import type { DayLog, LogEntry } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Sunrise, Sun, Moon, Cookie, X, Plus } from "lucide-react";
import { fmt } from "@/lib/utils";
import Link from "next/link";

// Tailwind v4 can't compile dynamic class strings — use static literals via a lookup
const MEALS = [
  { key: "breakfast" as const, label: "Breakfast", icon: Sunrise, bg: "bg-orange-500/10",  fg: "text-orange-500" },
  { key: "lunch"     as const, label: "Lunch",     icon: Sun,     bg: "bg-emerald-500/10", fg: "text-emerald-500" },
  { key: "dinner"    as const, label: "Dinner",    icon: Moon,    bg: "bg-blue-500/10",    fg: "text-blue-500" },
  { key: "snack"     as const, label: "Snacks",    icon: Cookie,  bg: "bg-red-500/10",     fg: "text-red-500" },
];

export default function MealsPage() {
  const { data, mutate } = useApiSWR<DayLog>("/api/today");

  if (!data) return <div className="space-y-4 animate-pulse">
    {[1,2,3,4].map(i => <div key={i} className="glass-card h-32"/>)}
  </div>;

  const del = async (id: number) => {
    await api.del(`/api/log/${id}`);
    mutate();
  };

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "short", day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meals</h1>
          <p className="text-sm text-[rgb(var(--fg-muted))] mt-1">{today}</p>
        </div>
        <Link href="/food-search" className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Food
        </Link>
      </div>

      {/* Day totals strip */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Tot label="Calories" v={fmt.int(data.totals.kcal)} unit="kcal" />
          <Tot label="Protein"  v={fmt.int(data.totals.protein_g)} unit="g" cls="text-blue-500" />
          <Tot label="Carbs"    v={fmt.int(data.totals.carbs_g)}   unit="g" cls="text-orange-500" />
          <Tot label="Fat"      v={fmt.int(data.totals.fat_g)}     unit="g" cls="text-red-500" />
          <Tot label="Fiber"    v={fmt.int(data.totals.fiber_g)}   unit="g" cls="text-green-500" />
        </div>
      </div>

      {/* Meal sections */}
      {MEALS.map((meal) => {
        const entries = data.entries.filter((e) => e.meal_category === meal.key);
        const Icon = meal.icon;
        const subtotal = entries.reduce((s, e) => s + e.kcal, 0);
        return (
          <motion.section
            key={meal.key}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${meal.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${meal.fg}`} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{meal.label}</div>
                <div className="text-xs text-[rgb(var(--fg-muted))]">
                  {entries.length} {entries.length === 1 ? "item" : "items"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold tabular-nums">{fmt.int(subtotal)}</div>
                <div className="text-xs text-[rgb(var(--fg-muted))]">kcal</div>
              </div>
            </div>

            {entries.length === 0 ? (
              <div className="text-sm text-[rgb(var(--fg-muted))] italic text-center py-4">
                Nothing logged for {meal.label.toLowerCase()} yet.
              </div>
            ) : (
              <AnimatePresence>
                <div className="space-y-2">
                  {entries.map((e) => (
                    <MealRow key={e.id} entry={e} onDelete={() => del(e.id)} />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </motion.section>
        );
      })}
    </div>
  );
}

function MealRow({ entry, onDelete }: { entry: LogEntry; onDelete: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[rgb(var(--border))]/30 group"
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{entry.food.name}</div>
        <div className="text-xs text-[rgb(var(--fg-muted))] tabular-nums">
          {entry.quantity} {entry.food.unit}
          {entry.note && <span className="italic"> · {entry.note}</span>}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-4 text-xs tabular-nums">
        <span className="text-blue-500">P {fmt.dec(entry.protein_g)}</span>
        <span className="text-orange-500">C {fmt.dec(entry.carbs_g)}</span>
        <span className="text-red-500">F {fmt.dec(entry.fat_g)}</span>
      </div>
      <div className="font-semibold tabular-nums w-16 text-right">{fmt.int(entry.kcal)}</div>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 btn btn-ghost p-1 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function Tot({ label, v, unit, cls }: { label: string; v: string; unit: string; cls?: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-[rgb(var(--fg-muted))] uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold mt-1 tabular-nums ${cls ?? "text-emerald-500"}`}>
        {v}<span className="text-xs ml-1 text-[rgb(var(--fg-muted))]">{unit}</span>
      </div>
    </div>
  );
}
