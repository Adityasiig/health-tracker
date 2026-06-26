"use client";

import { useEffect, useMemo, useState } from "react";
import { Footprints, TrendingUp, Target, Flame } from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import {
  isNativeAndroid,
  healthConnectStatus,
  hasStepsPermission,
  fetchStepsHistory,
  type StepDay,
} from "@/lib/healthConnect";

const STEP_TARGET = 10000;

type State =
  | { kind: "loading" }
  | { kind: "web" }
  | { kind: "unavailable"; reason: string }
  | { kind: "needs-permission" }
  | { kind: "ready"; data: StepDay[] }
  | { kind: "error"; message: string };

const tooltipStyle = {
  background: "rgb(var(--bg-elev))",
  border: "1px solid rgb(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "0 8px 24px rgb(0 0 0 / 0.25)",
  padding: "8px 12px",
};

export function StepsHistoryChart({ days }: { days: number }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isNativeAndroid()) {
        if (!cancelled) setState({ kind: "web" });
        return;
      }
      const status = await healthConnectStatus();
      if (!status.available) {
        if (!cancelled) setState({
          kind: "unavailable",
          reason: status.statusCode === 2
            ? "Health Connect needs to be updated"
            : "Health Connect is not installed",
        });
        return;
      }
      const granted = await hasStepsPermission();
      if (!granted) {
        if (!cancelled) setState({ kind: "needs-permission" });
        return;
      }
      const data = await fetchStepsHistory(days);
      if (data === null) {
        if (!cancelled) setState({ kind: "error", message: "Could not read step history" });
      } else {
        if (!cancelled) setState({ kind: "ready", data });
      }
    })();
    return () => { cancelled = true; };
  }, [days]);

  const stats = useMemo(() => {
    if (state.kind !== "ready" || !state.data.length) return null;
    const data = state.data;
    const total = data.reduce((s, d) => s + d.steps, 0);
    const avg = Math.round(total / data.length);
    const best = data.reduce((m, d) => d.steps > m.steps ? d : m, data[0]);
    const goalHit = data.filter(d => d.steps >= STEP_TARGET).length;
    return { avg, best, goalHit, total, days: data.length };
  }, [state]);

  // Web platform: hide entirely (no value to showing it in browser)
  if (state.kind === "web") return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Footprints className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="font-semibold">Steps</h3>
        </div>
      </div>

      {state.kind === "loading" && (
        <div className="h-48 flex items-center justify-center text-sm text-[rgb(var(--fg-muted))] animate-pulse">
          Reading from Health Connect…
        </div>
      )}

      {state.kind === "unavailable" && (
        <div className="h-48 flex items-center justify-center text-sm text-amber-500/80 text-center px-6">
          {state.reason}
        </div>
      )}

      {state.kind === "needs-permission" && (
        <div className="h-48 flex flex-col items-center justify-center gap-2 text-sm text-[rgb(var(--fg-muted))] text-center px-6">
          <div>Health Connect permission not granted yet.</div>
          <div className="text-xs">
            Open the dashboard and tap <strong>Connect Health Connect</strong>.
          </div>
        </div>
      )}

      {state.kind === "error" && (
        <div className="h-48 flex items-center justify-center text-sm text-rose-400">
          {state.message}
        </div>
      )}

      {state.kind === "ready" && stats && (
        <>
          {state.data.every((d) => d.steps === 0) ? (
            <div className="h-48 flex flex-col items-center justify-center gap-1 text-sm text-[rgb(var(--fg-muted))] text-center px-6">
              <div>No step data for the past {days} days.</div>
              <div className="text-xs">
                Enable step tracking in a fitness app (Google Fit, Samsung Health, Fitbit etc.)
                and ensure it syncs to Health Connect.
              </div>
            </div>
          ) : (
            <>
              {/* Top headline: big average number */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-semibold tabular-nums text-[rgb(var(--fg))]">
                  {stats.avg.toLocaleString()}
                </span>
                <span className="text-xs text-[rgb(var(--fg-muted))]">avg / day</span>
              </div>
              <div className="text-xs text-[rgb(var(--fg-muted))] mb-4">
                {stats.total.toLocaleString()} steps over the last {stats.days} days
              </div>

              {/* Smooth area chart with gradient fill */}
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={state.data.map((d) => ({ ...d, label: d.date.slice(5) }))}
                  margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="stepsArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                      <stop offset="60%" stopColor="#14b8a6" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="stepsStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.25} vertical={false}/>
                  <XAxis
                    dataKey="label"
                    stroke="rgb(var(--fg-muted))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={20}
                  />
                  <YAxis
                    stroke="rgb(var(--fg-muted))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: "#10b981", strokeWidth: 1, strokeDasharray: "3 3" }}
                    labelStyle={{ color: "rgb(var(--fg))", fontWeight: 600, marginBottom: 2 }}
                    formatter={(v) => [`${Number(v).toLocaleString()}`, "steps"]}
                  />
                  <ReferenceLine
                    y={STEP_TARGET}
                    stroke="#10b981"
                    strokeDasharray="2 4"
                    strokeOpacity={0.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="steps"
                    stroke="url(#stepsStroke)"
                    strokeWidth={2.5}
                    fill="url(#stepsArea)"
                    activeDot={{
                      r: 5,
                      fill: "#10b981",
                      stroke: "rgb(var(--bg-elev))",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Three stat tiles below */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <StatTile
                  icon={Target}
                  label="Goal hit"
                  value={`${stats.goalHit}/${stats.days}`}
                  color="text-emerald-500"
                  bg="bg-emerald-500/10"
                />
                <StatTile
                  icon={Flame}
                  label="Best day"
                  value={stats.best.steps.toLocaleString()}
                  sub={stats.best.date.slice(5)}
                  color="text-orange-500"
                  bg="bg-orange-500/10"
                />
                <StatTile
                  icon={TrendingUp}
                  label="Target"
                  value={`${STEP_TARGET.toLocaleString()}`}
                  color="text-blue-500"
                  bg="bg-blue-500/10"
                />
              </div>
            </>
          )}
        </>
      )}
    </motion.section>
  );
}

function StatTile({
  icon: Icon, label, value, sub, color, bg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border)/0.6)] bg-[rgb(var(--bg-elev)/0.5)] p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <div className={`w-5 h-5 rounded-md ${bg} flex items-center justify-center`}>
          <Icon className={`w-3 h-3 ${color}`} />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[rgb(var(--fg-muted))] font-medium">
          {label}
        </span>
      </div>
      <div className="text-sm font-semibold tabular-nums text-[rgb(var(--fg))]">
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-[rgb(var(--fg-muted))] mt-0.5">{sub}</div>
      )}
    </div>
  );
}
