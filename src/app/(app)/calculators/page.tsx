"use client";

import useSWR from "swr";
import { swrFetcher } from "@/lib/api";
import type { ProfileResponse } from "@/lib/api";
import { motion } from "framer-motion";
import { Calculator, Flame, Target, Activity, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { fmt } from "@/lib/utils";

export default function CalculatorsPage() {
  const { data } = useSWR<ProfileResponse>("/api/profile", swrFetcher);

  if (!data?.profile || !data?.computed) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-[rgb(var(--fg-muted))] mb-4">Set up your profile to see your numbers.</p>
        <a href="/profile" className="btn btn-primary">Go to Profile</a>
      </div>
    );
  }

  const p = data.profile;
  const t = data.computed;

  // Compute BMI position on visual meter
  const bmiBucket =
    t.bmi < 18.5 ? "underweight" :
    p.ethnicity === "asian_indian"
      ? (t.bmi < 23 ? "normal" : t.bmi < 25 ? "overweight" : "obese")
      : (t.bmi < 25 ? "normal" : t.bmi < 30 ? "overweight" : "obese");

  const bmiPct = Math.min(100, Math.max(0, ((t.bmi - 15) / (40 - 15)) * 100));

  // 3 calorie goals
  const cutTarget = t.tdee - 500;
  const bulkTarget = t.tdee + 350;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">BMI &amp; Calorie Calculator</h1>
        <p className="text-sm text-[rgb(var(--fg-muted))] mt-1">
          Live calculations based on your profile.
        </p>
      </div>

      {/* BMI section */}
      <motion.section
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Body Mass Index</h2>
            <div className="text-xs text-[rgb(var(--fg-muted))]">
              {p.ethnicity === "asian_indian" ? "Asian-Indian thresholds (WHO 2004)" : "General WHO thresholds"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Stat icon={Activity} label="Your BMI" value={t.bmi.toFixed(1)} color={t.bmi_color} />
          <Stat icon={Target} label="Status" value={t.bmi_label} color={t.bmi_color} />
          <Stat icon={TrendingUp} label="Healthy Range" value={`${t.healthy_low}–${t.healthy_high} kg`} />
        </div>

        {/* BMI meter */}
        <div className="relative pt-8">
          <div className="h-3 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-green-500 via-orange-500 to-red-500" />
          <motion.div
            initial={{ left: 0 }}
            animate={{ left: `${bmiPct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-7"
            style={{ transform: "translateX(-50%)" }}
          >
            <div className="w-1 h-6 bg-[rgb(var(--fg))] mx-auto" />
            <div className="text-xs font-bold mt-1 whitespace-nowrap">{t.bmi.toFixed(1)}</div>
          </motion.div>
          <div className="flex justify-between text-[10px] text-[rgb(var(--fg-muted))] mt-12">
            <span>15</span><span>20</span><span>25</span><span>30</span><span>35</span><span>40</span>
          </div>
          <div className="grid grid-cols-4 mt-2 text-[10px] text-[rgb(var(--fg-muted))] capitalize text-center">
            <span className={bmiBucket === "underweight" ? "text-blue-500 font-semibold" : ""}>under</span>
            <span className={bmiBucket === "normal" ? "text-green-500 font-semibold" : ""}>normal</span>
            <span className={bmiBucket === "overweight" ? "text-orange-500 font-semibold" : ""}>over</span>
            <span className={bmiBucket === "obese" ? "text-red-500 font-semibold" : ""}>obese</span>
          </div>
        </div>
      </motion.section>

      {/* Calorie section */}
      <motion.section
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Calorie Calculator</h2>
            <div className="text-xs text-[rgb(var(--fg-muted))]">Mifflin-St Jeor BMR + activity multiplier</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-5 rounded-2xl bg-[rgb(var(--border))]/30">
            <div className="text-xs text-[rgb(var(--fg-muted))] uppercase tracking-wider mb-1">BMR (resting)</div>
            <div className="text-3xl font-bold tabular-nums">{fmt.int(t.bmr)}</div>
            <div className="text-xs text-[rgb(var(--fg-muted))] mt-1">kcal/day if you slept all day</div>
          </div>
          <div className="p-5 rounded-2xl gradient-bg text-white">
            <div className="text-xs uppercase tracking-wider mb-1 opacity-90">TDEE (maintenance)</div>
            <div className="text-3xl font-bold tabular-nums">{fmt.int(t.tdee)}</div>
            <div className="text-xs opacity-90 mt-1">kcal/day at {p.activity.replace("_", " ")} activity</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GoalCard
            icon={TrendingDown} label="Cut" color="text-orange-500" bg="bg-orange-500/10"
            value={cutTarget} sub="-500 kcal · ~0.5 kg/week fat loss"
            active={p.goal === "cut"}
          />
          <GoalCard
            icon={Minus} label="Maintain" color="text-emerald-500" bg="bg-emerald-500/10"
            value={t.tdee} sub="Hold current weight"
            active={p.goal === "maintain"}
          />
          <GoalCard
            icon={TrendingUp} label="Bulk" color="text-blue-500" bg="bg-blue-500/10"
            value={bulkTarget} sub="+350 kcal · lean muscle gain"
            active={p.goal === "bulk"}
          />
        </div>
      </motion.section>
    </div>
  );
}

function Stat({
  icon: Icon, label, value, color,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color?: string }) {
  const cls =
    color === "green" ? "text-green-500" :
    color === "amber" ? "text-orange-500" :
    color === "red"   ? "text-red-500" : "";
  return (
    <div className="p-4 rounded-xl bg-[rgb(var(--border))]/30">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${cls || "text-emerald-500"}`} />
        <div className="text-xs text-[rgb(var(--fg-muted))]">{label}</div>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}

function GoalCard({
  icon: Icon, label, color, bg, value, sub, active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; color: string; bg: string; value: number; sub: string; active: boolean;
}) {
  return (
    <div className={`p-5 rounded-2xl border-2 ${active ? "border-emerald-500 shadow-lg shadow-emerald-500/10" : "border-transparent bg-[rgb(var(--border))]/20"}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        {active && <span className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">Active</span>}
      </div>
      <div className="text-2xl font-bold tabular-nums">{fmt.int(value)} <span className="text-xs text-[rgb(var(--fg-muted))]">kcal</span></div>
      <div className="text-xs text-[rgb(var(--fg-muted))] mt-1">{sub}</div>
    </div>
  );
}
