"use client";

import { useCallback, useEffect, useState } from "react";
import { Footprints, AlertCircle, RefreshCw } from "lucide-react";
import {
  isNativeAndroid,
  healthConnectStatus,
  hasStepsPermission,
  requestStepsPermission,
  fetchTodaySteps,
} from "@/lib/healthConnect";

type State =
  | { kind: "loading" }
  | { kind: "web" }
  | { kind: "unavailable"; reason: string }
  | { kind: "needs-permission" }
  | { kind: "ready"; steps: number; refreshing: boolean }
  | { kind: "error"; message: string };

const STEP_TARGET = 10000;

export function StepsCard() {
  const [state, setState] = useState<State>({ kind: "loading" });

  const refresh = useCallback(async () => {
    const steps = await fetchTodaySteps();
    if (steps === null) {
      setState({ kind: "error", message: "Could not read steps" });
    } else {
      setState({ kind: "ready", steps, refreshing: false });
    }
  }, []);

  const bootstrap = useCallback(async () => {
    if (!isNativeAndroid()) {
      setState({ kind: "web" });
      return;
    }
    const status = await healthConnectStatus();
    if (!status.available) {
      const reason =
        status.statusCode === 2
          ? "Health Connect needs to be updated"
          : "Health Connect is not installed";
      setState({ kind: "unavailable", reason });
      return;
    }
    const granted = await hasStepsPermission();
    if (!granted) {
      setState({ kind: "needs-permission" });
      return;
    }
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Re-check when window regains focus (user returns from Health Connect UI)
  useEffect(() => {
    const onFocus = () => void bootstrap();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") onFocus();
    });
    return () => window.removeEventListener("focus", onFocus);
  }, [bootstrap]);

  const onRequestPermission = async () => {
    setState({ kind: "loading" });
    const granted = await requestStepsPermission();
    if (granted) await refresh();
    else setState({ kind: "needs-permission" });
  };

  if (state.kind === "loading") {
    return (
      <div className="glass-card p-5">
        <div className="text-sm text-[rgb(var(--fg-muted))] animate-pulse">
          Checking Health Connect...
        </div>
      </div>
    );
  }

  if (state.kind === "web") {
    return null; // Don't show Steps card in browser
  }

  if (state.kind === "unavailable") {
    return (
      <div className="glass-card p-5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold text-sm">Steps unavailable</div>
          <div className="text-xs text-[rgb(var(--fg-muted))] mt-1">{state.reason}</div>
        </div>
      </div>
    );
  }

  if (state.kind === "needs-permission") {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
            <Footprints className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold">Steps</div>
            <div className="text-xs text-[rgb(var(--fg-muted))]">
              Sync your daily step count
            </div>
          </div>
        </div>
        <button onClick={onRequestPermission} className="btn btn-primary w-full">
          Connect Health Connect
        </button>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-rose-400">{state.message}</div>
          <button onClick={() => void refresh()} className="btn btn-ghost p-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ready
  const pct = Math.min(100, Math.round((state.steps / STEP_TARGET) * 100));
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
            <Footprints className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold">STEPS</div>
            <div className="text-xs text-[rgb(var(--fg-muted))]">Today</div>
          </div>
        </div>
        <button
          onClick={() => void refresh()}
          className="btn btn-ghost p-2"
          aria-label="Refresh steps"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <div className="text-4xl font-bold tabular-nums">
          {state.steps.toLocaleString()}
        </div>
        <div className="text-sm text-[rgb(var(--fg-muted))]">
          / {STEP_TARGET.toLocaleString()}
        </div>
      </div>
      <div className="h-2 bg-[rgb(var(--border)/0.4)] rounded-full overflow-hidden">
        <div
          className="h-full gradient-bg rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-[rgb(var(--fg-muted))] mt-2">
        {pct >= 100 ? "Goal reached" : `${(STEP_TARGET - state.steps).toLocaleString()} to go`}
      </div>
    </div>
  );
}
