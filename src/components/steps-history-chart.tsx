"use client";

import { useEffect, useState } from "react";
import { Footprints } from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
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

// Lightweight pretty formatter for tooltip values
const tooltipStyle = {
  background: "rgb(var(--bg-elev))",
  border: "1px solid rgb(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "0 8px 24px rgb(0 0 0 / 0.25)",
};
const barCursor = { fill: "rgb(var(--fg) / 0.06)", radius: 8 };

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
        {state.kind === "ready" && (
          <div className="text-xs text-[rgb(var(--fg-muted))]">
            Avg{" "}
            <span className="font-semibold text-[rgb(var(--fg))]">
              {Math.round(
                state.data.reduce((s, d) => s + d.steps, 0) / Math.max(state.data.length, 1)
              ).toLocaleString()}
            </span>
            /day
          </div>
        )}
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

      {state.kind === "ready" && (
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
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={state.data.map((d) => ({ ...d, label: d.date.slice(5) }))}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.4} vertical={false}/>
                <XAxis dataKey="label" stroke="rgb(var(--fg-muted))" fontSize={11} tickLine={false} axisLine={false}/>
                <YAxis stroke="rgb(var(--fg-muted))" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}/>
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={barCursor}
                  labelStyle={{ color: "rgb(var(--fg))", fontWeight: 600, marginBottom: 4 }}
                  formatter={(v) => [`${Number(v).toLocaleString()} steps`, "Steps"]}
                />
                <ReferenceLine
                  y={STEP_TARGET}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    value: `Target ${STEP_TARGET.toLocaleString()}`,
                    fill: "#10b981",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
                <Bar dataKey="steps" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </motion.section>
  );
}
