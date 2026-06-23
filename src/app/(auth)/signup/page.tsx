"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { getBrowserSupabase } from "@/lib/db/browser";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge]           = useState("");
  const [sex, setSex]           = useState<"male" | "female">("male");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [goal, setGoal]         = useState<"cut" | "maintain" | "bulk">("maintain");
  const [activity, setActivity] = useState("moderate");

  const [step, setStep]   = useState<1 | 2>(1);   // 1 = email/pw, 2 = body stats
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (!email.includes("@"))  { setError("Enter a valid email.");                  return; }
    setStep(2);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = getBrowserSupabase();
      // Create the auth user. Profile metadata stuffed into user_metadata so
      // we can read it back when seeding the profile row.
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          // Explicit redirect URL — guards against Supabase Site URL drift
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: name,
            age: Number(age),
            sex,
            height_cm: Number(heightCm),
            weight_kg: Number(weightKg),
            goal,
            activity,
          },
        },
      });
      if (error) throw error;

      // Seed the profile row server-side now that we have the user.
      // The signup may auto-sign-in (no email confirmation required) OR
      // wait for email confirmation. Either way, calling /api/profile POST
      // will write the row once the cookie is set.
      if (data.session) {
        await fetch("/api/profile/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name, sex, age: Number(age),
            height_cm: Number(heightCm),
            weight_kg: Number(weightKg),
            goal, activity, ethnicity: "asian_indian",
            water_goal_ml: 4000,
          }),
        });
        router.push("/");
        router.refresh();
      } else {
        // Email confirmation required → tell user to check inbox
        setSuccess(true);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Check your email</h1>
        <p className="text-sm text-[rgb(var(--fg-muted))] mb-6">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
        <Link href="/login" className="btn btn-outline w-full inline-block">Back to sign in</Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-sm text-[rgb(var(--fg-muted))]">
            Step {step} of 2 — {step === 1 ? "Credentials" : "Body stats"}
          </p>
        </div>
        <div className="flex gap-1">
          <span className={`h-1 w-8 rounded-full ${step >= 1 ? "bg-emerald-500" : "bg-[rgb(var(--border))]"}`} />
          <span className={`h-1 w-8 rounded-full ${step >= 2 ? "bg-emerald-500" : "bg-[rgb(var(--border))]"}`} />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={next} className="space-y-4">
          <div>
            <label className="label">Your name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--fg-muted))]" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aditya" required className="input pl-10" />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--fg-muted))]" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" className="input pl-10" />
            </div>
          </div>
          <div>
            <label className="label">Password (min 6)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--fg-muted))]" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} autoComplete="new-password" className="input pl-10" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Age</label>
              <input type="number" min={10} max={100} value={age} onChange={(e) => setAge(e.target.value)} required className="input" />
            </div>
            <div>
              <label className="label">Sex</label>
              <select value={sex} onChange={(e) => setSex(e.target.value as "male" | "female")} className="input">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="label">Height (cm)</label>
              <input type="number" step={0.1} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} required className="input" />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" step={0.1} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} required className="input" />
            </div>
          </div>
          <div>
            <label className="label">Goal</label>
            <select value={goal} onChange={(e) => setGoal(e.target.value as "cut" | "maintain" | "bulk")} className="input">
              <option value="cut">Cut (lose fat)</option>
              <option value="maintain">Maintain</option>
              <option value="bulk">Bulk (gain muscle)</option>
            </select>
          </div>
          <div>
            <label className="label">Activity level</label>
            <select value={activity} onChange={(e) => setActivity(e.target.value)} className="input">
              <option value="sedentary">Sedentary (desk job)</option>
              <option value="light">Light (1–3 d/wk)</option>
              <option value="moderate">Moderate (3–5 d/wk)</option>
              <option value="active">Active (6–7 d/wk)</option>
              <option value="very_active">Very Active</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setStep(1)} className="btn btn-outline">
              Back
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 disabled:opacity-50">
              {loading ? "Creating…" : <>Create account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 text-sm text-center text-[rgb(var(--fg-muted))]">
        Already have an account?{" "}
        <Link href="/login" className="text-emerald-500 hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </motion.div>
  );
}
