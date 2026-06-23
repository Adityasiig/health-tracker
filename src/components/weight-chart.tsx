"use client";

import { motion } from "framer-motion";
import { TrendingDown } from "lucide-react";
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

export function WeightChart({ history, goalKg }: { history: Pt[]; goalKg: number | null }) {
  const data = history.map((d) => ({
    ...d,
    label: d.date.slice(5), // MM-DD
  }));

  const latest = history[history.length - 1]?.kg;
  const first = history[0]?.kg;
  const delta = latest != null && first != null ? latest - first : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <TrendingDown className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">Weight Progress</div>
          <div className="text-xs text-[rgb(var(--fg-muted))]">Last {history.length || 0} entries</div>
        </div>
        {latest != null && (
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">{latest.toFixed(1)} <span className="text-xs text-[rgb(var(--fg-muted))]">kg</span></div>
            {delta !== 0 && (
              <div className={`text-xs tabular-nums ${delta < 0 ? "text-emerald-500" : "text-orange-500"}`}>
                {delta > 0 ? "+" : ""}{delta.toFixed(1)} kg
              </div>
            )}
          </div>
        )}
      </div>

      {data.length < 2 ? (
        <div className="h-48 flex flex-col items-center justify-center text-[rgb(var(--fg-muted))] text-sm">
          <div>Need at least 2 weigh-ins</div>
          <div className="text-xs mt-1">Log your weight daily to see your trend.</div>
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
                }}
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
