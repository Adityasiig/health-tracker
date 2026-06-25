"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, Plus, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";

type Pt = { date: string; kg: number };

export function WeightChart({
  history,
  goalKg,
  onLogged,
}: {
  history: Pt[];
  goalKg: number | null;
  onLogged?: () => void;
}) {
  const data = history.map((d) => ({
    ...d,
    label: d.date.slice(5), // MM-DD
  }));

  const latest = history[history.length - 1]?.kg;
  const first = history[0]?.kg;
  const delta = latest != null && first != null ? latest - first : 0;

  // Log-weight inline form
  const [open, setOpen] = useState(false);
  const [kg, setKg] = useState<string>(latest ? latest.toFixed(1) : "");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const num = Number(kg);
    if (!num || num <= 0) { setError("Enter a weight in kg"); return; }
    setSaving(true); setError("");
    try {
      await api.post("/api/weight", { kg_value: num, log_date: date });
      setOpen(false);
      onLogged?.();
    } catch (e) {
      setError((e as Error).message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-4 flex-wrap">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
          <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm sm:text-base truncate">Weight Progress</div>
          <div className="text-[11px] sm:text-xs text-[rgb(var(--fg-muted))] truncate">
            Last {history.length || 0} entries
          </div>
        </div>
        {latest != null && (
          <div className="text-right shrink-0">
            <div className="text-xl sm:text-2xl font-bold tabular-nums leading-none">
              {latest.toFixed(1)}<span className="text-[10px] sm:text-xs text-[rgb(var(--fg-muted))] ml-1">kg</span>
            </div>
            {delta !== 0 && (
              <div className={`text-[10px] sm:text-xs tabular-nums mt-0.5 ${delta < 0 ? "text-emerald-500" : "text-orange-500"}`}>
                {delta > 0 ? "+" : ""}{delta.toFixed(1)} kg
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => setOpen(o => !o)}
          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 px-2 sm:px-2.5 py-1.5 text-xs font-semibold"
          title="Log today's weight"
        >
          <Plus className="w-3.5 h-3.5" /> Log
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-3 sm:items-end">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[rgb(var(--fg-muted))]">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      className="input mt-1 w-full"
                      value={kg}
                      onChange={(e) => setKg(e.target.value)}
                      placeholder="e.g. 84.7"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[rgb(var(--fg-muted))]">Date</label>
                    <input
                      type="date"
                      className="input mt-1 w-full"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      max={new Date().toISOString().slice(0, 10)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-2">
                  <button
                    disabled={saving}
                    onClick={submit}
                    className="btn btn-primary disabled:opacity-50 flex-1 sm:flex-initial"
                    title="Save weight"
                  >
                    <Check className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => { setOpen(false); setError(""); }}
                    className="btn btn-outline shrink-0"
                    title="Cancel"
                    aria-label="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            {error && (
              <div className="text-xs text-red-500 -mt-2 mb-3 px-1">{error}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {data.length < 2 ? (
        <div className="h-48 flex flex-col items-center justify-center text-[rgb(var(--fg-muted))] text-sm">
          <div>Need at least 2 weigh-ins</div>
          <div className="text-xs mt-1">
            Tap <span className="text-emerald-500 font-semibold">+ Log</span> above to add today&apos;s weight.
          </div>
        </div>
      ) : (
        <div className="h-48 -mx-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="weight-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.4} vertical={false} />
              <XAxis dataKey="label" stroke="rgb(var(--fg-muted))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="rgb(var(--fg-muted))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={["dataMin - 1", "dataMax + 1"]}
              />
              <Tooltip
                contentStyle={{
                  background: "rgb(var(--bg-elev))",
                  border: "1px solid rgb(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                  boxShadow: "0 8px 24px rgb(0 0 0 / 0.25)",
                }}
                labelStyle={{ color: "rgb(var(--fg))", fontWeight: 600, marginBottom: 4 }}
                cursor={{ stroke: "rgb(var(--fg-muted))", strokeOpacity: 0.4, strokeDasharray: "3 3" }}
                formatter={(v: unknown) => [`${Number(v ?? 0).toFixed(1)} kg`, "Weight"]}
              />
              {goalKg && (
                <ReferenceLine
                  y={goalKg}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{ value: `Goal ${goalKg}kg`, position: "insideTopRight", fill: "#10b981", fontSize: 10 }}
                />
              )}
              <Area
                type="monotone"
                dataKey="kg"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#weight-fill)"
                dot={{ r: 3, fill: "#10b981" }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
