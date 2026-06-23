"use client";

import type { Profile, Targets } from "@/lib/api";
import { motion } from "framer-motion";
import { Scale, Target, Activity } from "lucide-react";

export function WelcomeCard({ profile, targets }: { profile: Profile; targets: Targets }) {
  const goalDelta = profile.goal_weight_kg ? profile.weight_kg - profile.goal_weight_kg : null;
  const bmiColor =
    targets.bmi_color === "green" ? "text-green-500" :
    targets.bmi_color === "amber" ? "text-orange-500" : "text-red-500";
  const bmiBg =
    targets.bmi_color === "green" ? "bg-green-500/10" :
    targets.bmi_color === "amber" ? "bg-orange-500/10" : "bg-red-500/10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 lg:p-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="text-sm text-[rgb(var(--fg-muted))]">Welcome back,</div>
          <div className="text-2xl lg:text-3xl font-bold gradient-text">
            {profile.name || "there"}
          </div>
          <div className="text-sm text-[rgb(var(--fg-muted))] mt-1">
            Goal: <span className="capitalize text-[rgb(var(--fg))] font-medium">{profile.goal}</span>
            <span className="mx-2">·</span>
            <span className="capitalize">{profile.activity.replace("_", " ")}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 lg:gap-6">
          <Stat icon={Scale} label="Current" value={`${profile.weight_kg} kg`} />
          <Stat
            icon={Target}
            label="Goal"
            value={profile.goal_weight_kg ? `${profile.goal_weight_kg} kg` : "—"}
            sub={goalDelta !== null ? `${goalDelta > 0 ? "−" : "+"}${Math.abs(goalDelta).toFixed(1)} kg` : undefined}
          />
          <Stat
            icon={Activity}
            label="BMI"
            value={targets.bmi.toFixed(1)}
            sub={targets.bmi_label}
            valueClass={bmiColor}
            iconBgClass={bmiBg}
          />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({
  icon: Icon, label, value, sub, valueClass, iconBgClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string;
  valueClass?: string; iconBgClass?: string;
}) {
  return (
    <div className="text-center lg:text-right">
      <div className="flex items-center gap-2 justify-center lg:justify-end mb-1">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBgClass ?? "bg-emerald-500/10"}`}>
          <Icon className={`w-3.5 h-3.5 ${valueClass ?? "text-emerald-500"}`} />
        </div>
        <span className="text-xs text-[rgb(var(--fg-muted))]">{label}</span>
      </div>
      <div className={`text-lg lg:text-xl font-bold ${valueClass ?? ""}`}>{value}</div>
      {sub && <div className="text-xs text-[rgb(var(--fg-muted))]">{sub}</div>}
    </div>
  );
}
