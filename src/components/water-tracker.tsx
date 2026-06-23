"use client";

import { motion } from "framer-motion";
import { Droplets, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { fmt } from "@/lib/utils";
import { useState } from "react";

export function WaterTracker({
  currentMl, targetMl, onAdd,
}: {
  currentMl: number; targetMl: number; onAdd: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const pct = Math.min(100, (currentMl / targetMl) * 100);
  const fillPct = Math.min(100, Math.max(0, pct));

  const add = async (ml: number) => {
    setAdding(true);
    try {
      await api.post("/api/water", { ml_amount: ml });
      onAdd();
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Droplets className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <div className="font-semibold">Water</div>
          <div className="text-xs text-[rgb(var(--fg-muted))]">Stay hydrated</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-2xl font-bold tabular-nums">
            {(currentMl / 1000).toFixed(1)}
            <span className="text-sm text-[rgb(var(--fg-muted))] ml-1">/ {(targetMl/1000).toFixed(1)}L</span>
          </div>
          <div className="text-xs text-blue-500 tabular-nums">{fmt.int(pct)}%</div>
        </div>
      </div>

      {/* Glass visualization */}
      <div className="relative h-32 mb-4 flex items-end justify-center">
        <div className="relative w-24 h-32 rounded-b-2xl rounded-t-md border-2 border-blue-500/30 overflow-hidden bg-blue-500/5">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${fillPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute bottom-0 left-0 right-0"
            style={{
              background: "linear-gradient(180deg, rgba(59,130,246,0.4), rgba(20,184,166,0.7))",
            }}
          />
          {/* surface ripple */}
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute left-0 right-0 h-1 bg-blue-300/40"
            style={{ bottom: `${fillPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { ml: 250, label: "+250 ml" },
          { ml: 500, label: "+500 ml" },
          { ml: 1000, label: "+1 L" },
        ].map(({ ml, label }) => (
          <button
            key={ml}
            disabled={adding}
            onClick={() => add(ml)}
            className="btn btn-outline disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
