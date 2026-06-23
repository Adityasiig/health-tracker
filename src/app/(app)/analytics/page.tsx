"use client";

import { useState } from "react";
import { useApiSWR } from "@/lib/use-api-swr";
// import {} from "@/lib/api";
import type { TrendsData, ProfileResponse } from "@/lib/api";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend,
} from "recharts";
import { Flame, Beef, Scale, Droplets } from "lucide-react";
import { fmt } from "@/lib/utils";

type Range = 7 | 30 | 90;

export default function AnalyticsPage() {
  const [days, setDays] = useState<Range>(30);
  const { data: trends } = useApiSWR<TrendsData>(`/api/analytics/trends?days=${days}`);
  const { data: pData } = useApiSWR<ProfileResponse>("/api/profile");

  const targets = pData?.computed?.target;

  if (!trends || !pData) return <div className="space-y-4 animate-pulse">
    {[1,2,3,4].map(i => <div key={i} className="glass-card h-72"/>)}
  </div>;

  const nutritionData = trends.nutrition.map(n => ({
    ...n,
    label: n.date.slice(5),
  }));
  const waterData = trends.water.map(w => ({ ...w, label: w.date.slice(5), L: (w.ml / 1000).toFixed(2) }));
  const weightData = trends.weight.map(w => ({ ...w, label: w.date.slice(5) }));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-sm text-[rgb(var(--fg-muted))] mt-1">
            Last {days} days of progress
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-[rgb(var(--bg-elev))] border border-[rgb(var(--border))]">
          {([7, 30, 90] as const).map(r => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                days === r ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow" : "text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))]"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <ChartCard icon={Flame} title="Calories" color="text-orange-500" bg="bg-orange-500/10">
        {nutritionData.length === 0 ? <Empty/> : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={nutritionData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cal-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.4} vertical={false}/>
              <XAxis dataKey="label" stroke="rgb(var(--fg-muted))" fontSize={11} tickLine={false} axisLine={false}/>
              <YAxis stroke="rgb(var(--fg-muted))" fontSize={11} tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={tooltipStyle}/>
              {targets && <ReferenceLine y={targets.calories} stroke="#10b981" strokeDasharray="4 4"
                label={{ value: `Target ${targets.calories}`, fill: "#10b981", fontSize: 10, position: "insideTopRight" }}/>}
              <Area type="monotone" dataKey="kcal" stroke="#f59e0b" strokeWidth={2} fill="url(#cal-fill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard icon={Beef} title="Protein" color="text-blue-500" bg="bg-blue-500/10">
        {nutritionData.length === 0 ? <Empty/> : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={nutritionData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.4} vertical={false}/>
              <XAxis dataKey="label" stroke="rgb(var(--fg-muted))" fontSize={11} tickLine={false} axisLine={false}/>
              <YAxis stroke="rgb(var(--fg-muted))" fontSize={11} tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={tooltipStyle}/>
              {targets && <ReferenceLine y={targets.protein_g} stroke="#10b981" strokeDasharray="4 4"
                label={{ value: `Target ${targets.protein_g}g`, fill: "#10b981", fontSize: 10, position: "insideTopRight" }}/>}
              <Bar dataKey="protein_g" fill="#3b82f6" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard icon={Scale} title="Weight" color="text-emerald-500" bg="bg-emerald-500/10">
        {weightData.length < 2 ? <Empty msg="Need at least 2 weigh-ins."/> : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weightData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.4} vertical={false}/>
              <XAxis dataKey="label" stroke="rgb(var(--fg-muted))" fontSize={11} tickLine={false} axisLine={false}/>
              <YAxis stroke="rgb(var(--fg-muted))" fontSize={11} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]}/>
              <Tooltip contentStyle={tooltipStyle}/>
              {pData.profile?.goal_weight_kg && (
                <ReferenceLine y={pData.profile.goal_weight_kg} stroke="#10b981" strokeDasharray="4 4"
                  label={{ value: `Goal ${pData.profile.goal_weight_kg}kg`, fill: "#10b981", fontSize: 10, position: "insideTopRight" }}/>
              )}
              <Line type="monotone" dataKey="kg" stroke="#10b981" strokeWidth={2}
                dot={{ r: 3, fill: "#10b981" }} activeDot={{ r: 5 }}/>
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard icon={Droplets} title="Water Intake" color="text-blue-500" bg="bg-blue-500/10">
        {waterData.length === 0 ? <Empty/> : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={waterData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.4} vertical={false}/>
              <XAxis dataKey="label" stroke="rgb(var(--fg-muted))" fontSize={11} tickLine={false} axisLine={false}/>
              <YAxis stroke="rgb(var(--fg-muted))" fontSize={11} tickLine={false} axisLine={false}
                tickFormatter={(v) => `${(v/1000).toFixed(1)}L`}/>
              <Tooltip contentStyle={tooltipStyle}
                formatter={(v) => [`${(Number(v ?? 0)/1000).toFixed(2)} L`, "Water"]}/>
              {pData.profile?.water_goal_ml && (
                <ReferenceLine y={pData.profile.water_goal_ml} stroke="#10b981" strokeDasharray="4 4"
                  label={{ value: `Goal ${pData.profile.water_goal_ml/1000}L`, fill: "#10b981", fontSize: 10, position: "insideTopRight" }}/>
              )}
              <Bar dataKey="ml" fill="#3b82f6" radius={[8,8,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

const tooltipStyle = {
  background: "rgb(var(--bg-elev))",
  border: "1px solid rgb(var(--border))",
  borderRadius: 12,
  fontSize: 12,
};

function ChartCard({
  icon: Icon, title, color, bg, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; color: string; bg: string; children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`}/>
        </div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </motion.section>
  );
}

function Empty({ msg = "No data yet for this range." }: { msg?: string }) {
  return (
    <div className="h-48 flex items-center justify-center text-sm text-[rgb(var(--fg-muted))]">
      {msg}
    </div>
  );
}
