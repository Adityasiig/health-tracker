"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { swrFetcher, api } from "@/lib/api";
import type { ProfileResponse } from "@/lib/api";
import { motion } from "framer-motion";
import { User, Save, Check } from "lucide-react";

type Form = {
  name: string;
  sex: "male" | "female";
  age: number | "";
  height_cm: number | "";
  weight_kg: number | "";
  goal_weight_kg: number | "";
  activity: string;
  goal: string;
  ethnicity: string;
  water_goal_ml: number;
};

const blank: Form = {
  name: "", sex: "male", age: "", height_cm: "", weight_kg: "",
  goal_weight_kg: "", activity: "moderate", goal: "maintain",
  ethnicity: "asian_indian", water_goal_ml: 4000,
};

export default function ProfilePage() {
  const { data, mutate } = useSWR<ProfileResponse>("/api/profile", swrFetcher);
  const [form, setForm] = useState<Form>(blank);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (data?.profile) {
      const p = data.profile;
      setForm({
        name: p.name ?? "",
        sex: p.sex,
        age: p.age,
        height_cm: p.height_cm,
        weight_kg: p.weight_kg,
        goal_weight_kg: p.goal_weight_kg ?? "",
        activity: p.activity,
        goal: p.goal,
        ethnicity: p.ethnicity,
        water_goal_ml: p.water_goal_ml || 4000,
      });
    }
  }, [data]);

  const upd = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/profile", form);
      mutate();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-sm text-[rgb(var(--fg-muted))]">Your stats and goals</p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="glass-card p-6 space-y-6"
      >
        <Section title="Personal">
          <Row>
            <Field label="Name">
              <input className="input" value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Aditya"/>
            </Field>
            <Field label="Sex">
              <select className="input" value={form.sex} onChange={(e) => upd("sex", e.target.value as "male" | "female")}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
            <Field label="Age">
              <input type="number" min={10} max={100} className="input" value={form.age}
                onChange={(e) => upd("age", e.target.value === "" ? "" : Number(e.target.value))}/>
            </Field>
          </Row>
        </Section>

        <Section title="Body">
          <Row>
            <Field label="Height (cm)">
              <input type="number" step={0.1} className="input" value={form.height_cm}
                onChange={(e) => upd("height_cm", e.target.value === "" ? "" : Number(e.target.value))}/>
            </Field>
            <Field label="Current Weight (kg)">
              <input type="number" step={0.1} className="input" value={form.weight_kg}
                onChange={(e) => upd("weight_kg", e.target.value === "" ? "" : Number(e.target.value))}/>
            </Field>
            <Field label="Goal Weight (kg)">
              <input type="number" step={0.1} className="input" value={form.goal_weight_kg}
                onChange={(e) => upd("goal_weight_kg", e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Optional"/>
            </Field>
          </Row>
        </Section>

        <Section title="Goals">
          <Row>
            <Field label="Activity Level">
              <select className="input" value={form.activity} onChange={(e) => upd("activity", e.target.value)}>
                <option value="sedentary">Sedentary (desk job)</option>
                <option value="light">Light (1–3 days/week)</option>
                <option value="moderate">Moderate (3–5 days/week)</option>
                <option value="active">Active (6–7 days/week)</option>
                <option value="very_active">Very Active (athlete)</option>
              </select>
            </Field>
            <Field label="Goal">
              <select className="input" value={form.goal} onChange={(e) => upd("goal", e.target.value)}>
                <option value="cut">Cut (lose fat)</option>
                <option value="maintain">Maintain</option>
                <option value="bulk">Bulk (gain muscle)</option>
              </select>
            </Field>
            <Field label="BMI Standard">
              <select className="input" value={form.ethnicity} onChange={(e) => upd("ethnicity", e.target.value)}>
                <option value="asian_indian">Asian-Indian (WHO 2004)</option>
                <option value="general">General WHO</option>
              </select>
            </Field>
          </Row>
        </Section>

        <Section title="Hydration">
          <Field label={`Daily Water Goal — ${form.water_goal_ml / 1000}L`}>
            <input
              type="range" min={1500} max={6000} step={250}
              value={form.water_goal_ml}
              onChange={(e) => upd("water_goal_ml", Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-[rgb(var(--fg-muted))] mt-1">
              <span>1.5L</span><span>3L</span><span>4.5L</span><span>6L</span>
            </div>
          </Field>
        </Section>

        <div className="flex justify-end gap-3 pt-2 border-t border-[rgb(var(--border))]/40">
          <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">
            {savedFlash ? <><Check className="w-4 h-4"/> Saved!</> : <><Save className="w-4 h-4"/> {saving ? "Saving…" : "Save Profile"}</>}
          </button>
        </div>
      </motion.form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--fg-muted))] mb-3">{title}</h3>
      {children}
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
