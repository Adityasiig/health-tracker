"use client";

import useSWR from "swr";
import { swrFetcher } from "@/lib/api";
import type {
  ProfileResponse, DayLog, WaterToday, TrendsData,
} from "@/lib/api";
import { CalorieRing } from "@/components/calorie-ring";
import { MacroCard } from "@/components/macro-card";
import { WaterTracker } from "@/components/water-tracker";
import { WeightChart } from "@/components/weight-chart";
import { WelcomeCard } from "@/components/welcome-card";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: pData } = useSWR<ProfileResponse>("/api/profile", swrFetcher);
  const { data: today } = useSWR<DayLog>("/api/today", swrFetcher);
  const { data: water, mutate: mutateWater } = useSWR<WaterToday>("/api/water/today", swrFetcher);
  const { data: trends } = useSWR<TrendsData>("/api/analytics/trends?days=30", swrFetcher);

  const profile = pData?.profile;
  const targets = pData?.computed;

  if (pData && !profile) {
    return (
      <div className="glass-card p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Welcome 👋</h2>
        <p className="text-[rgb(var(--fg-muted))] mb-4">
          Set up your profile to start tracking.
        </p>
        <a href="/profile" className="btn btn-primary">Go to Profile</a>
      </div>
    );
  }

  if (!profile || !targets || !today || !water) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <WelcomeCard profile={profile} targets={targets} />

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <CalorieRing
            consumed={today.totals.kcal}
            target={targets.target.calories}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MacroCard label="Protein" current={today.totals.protein_g} target={targets.target.protein_g} unit="g" color="emerald" />
          <MacroCard label="Carbs"   current={today.totals.carbs_g}   target={targets.target.carbs_g}   unit="g" color="blue" />
          <MacroCard label="Fat"     current={today.totals.fat_g}     target={targets.target.fat_g}     unit="g" color="orange" />
          <MacroCard label="Fiber"   current={today.totals.fiber_g}   target={targets.target.fiber_g}   unit="g" color="green" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WaterTracker
          currentMl={water.total_ml}
          targetMl={profile.water_goal_ml || 4000}
          onAdd={() => mutateWater()}
        />
        <WeightChart
          history={trends?.weight || []}
          goalKg={profile.goal_weight_kg}
        />
      </div>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="glass-card h-32" />
      <div className="grid lg:grid-cols-[auto_1fr] gap-6">
        <div className="glass-card h-64 w-64" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card h-28" />
          ))}
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card h-64" />
        <div className="glass-card h-64" />
      </div>
    </div>
  );
}
