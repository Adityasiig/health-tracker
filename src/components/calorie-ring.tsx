"use client";

import { motion } from "framer-motion";
import { fmt } from "@/lib/utils";

export function CalorieRing({ consumed, target }: { consumed: number; target: number }) {
  const pct = Math.min(100, (consumed / target) * 100);
  const left = target - consumed;
  const over = consumed > target;

  // SVG ring math
  const size = 220;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="ring-gradient-over" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--border))"
          strokeWidth={stroke}
          opacity={0.4}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${over ? "ring-gradient-over" : "ring-gradient"})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-xs text-[rgb(var(--fg-muted))] uppercase tracking-wider">
          Calories
        </div>
        <div className="text-4xl font-bold mt-1 tabular-nums">{fmt.int(consumed)}</div>
        <div className="text-sm text-[rgb(var(--fg-muted))] tabular-nums">
          / {fmt.int(target)} kcal
        </div>
        <div
          className={`text-xs mt-2 font-medium tabular-nums ${
            over ? "text-red-500" : "text-emerald-500"
          }`}
        >
          {over ? `${fmt.int(Math.abs(left))} over` : `${fmt.int(left)} left`}
        </div>
      </div>
    </div>
  );
}
