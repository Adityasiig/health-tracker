"use client";

import { motion } from "framer-motion";
import { fmt } from "@/lib/utils";

const COLORS = {
  emerald: { from: "#10b981", to: "#14b8a6", text: "text-emerald-500", bg: "bg-emerald-500/10" },
  blue:    { from: "#3b82f6", to: "#06b6d4", text: "text-blue-500",    bg: "bg-blue-500/10" },
  orange:  { from: "#f59e0b", to: "#f97316", text: "text-orange-500",  bg: "bg-orange-500/10" },
  green:   { from: "#22c55e", to: "#10b981", text: "text-green-500",   bg: "bg-green-500/10" },
};

type ColorKey = keyof typeof COLORS;

export function MacroCard({
  label, current, target, unit = "g", color,
}: {
  label: string; current: number; target: number; unit?: string; color: ColorKey;
}) {
  const c = COLORS[color];
  const pct = Math.min(100, (current / target) * 100);
  const over = current > target;
  const left = Math.max(0, target - current);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="glass-card p-4 lg:p-5"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold uppercase tracking-wider ${c.text}`}>
          {label}
        </span>
        {over && (
          <span className="text-[10px] text-red-500 font-medium px-2 py-0.5 rounded-full bg-red-500/10">
            OVER
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-bold tabular-nums">{fmt.int(current)}</span>
        <span className="text-sm text-[rgb(var(--fg-muted))] tabular-nums">
          / {fmt.int(target)}{unit}
        </span>
      </div>
      <div className="text-xs text-[rgb(var(--fg-muted))] mb-3 tabular-nums">
        {over ? `${fmt.int(current - target)}${unit} over` : `${fmt.int(left)}${unit} left`}
      </div>
      <div className="h-2 bg-[rgb(var(--border))]/40 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{
            background: over
              ? "linear-gradient(90deg, #f59e0b, #ef4444)"
              : `linear-gradient(90deg, ${c.from}, ${c.to})`,
          }}
        />
      </div>
    </motion.div>
  );
}
