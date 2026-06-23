/**
 * AI Coach context builder — assembles the live user state into a string
 * the LLM can reason over. Uses the admin client (bypasses RLS) since
 * we already authenticated the user in the route handler.
 */
import { sb } from "@/lib/db/supabase";
import { computeTargets } from "@/lib/targets";

export async function buildCoachContext(userId: string): Promise<string> {
  const { data: profile } = await sb
    .from("profile").select("*").eq("user_id", userId).maybeSingle();
  if (!profile) return "User has not set up their profile yet.";

  const targets = computeTargets(profile);
  const today = new Date().toISOString().slice(0, 10);

  const { data: rows } = await sb
    .from("log_entries")
    .select(`
      quantity, note,
      food:foods!inner ( name, kcal, protein_g, carbs_g, fat_g, fiber_g )
    `)
    .eq("user_id", userId)
    .eq("log_date", today);

  const totals = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
  const items: string[] = [];
  (rows ?? []).forEach((r) => {
    const f = Array.isArray(r.food) ? r.food[0] : r.food;
    const q = Number(r.quantity);
    totals.kcal += f.kcal * q;
    totals.protein_g += f.protein_g * q;
    totals.carbs_g += f.carbs_g * q;
    totals.fat_g += f.fat_g * q;
    totals.fiber_g += f.fiber_g * q;
    items.push(`${f.name} ×${q}`);
  });

  const { data: water } = await sb
    .from("water_log").select("ml_amount").eq("user_id", userId).eq("log_date", today);
  const waterMl = (water ?? []).reduce((s, r) => s + Number(r.ml_amount), 0);

  const { data: weights } = await sb
    .from("weight_log").select("log_date, kg_value")
    .eq("user_id", userId)
    .order("log_date", { ascending: false }).limit(7);

  const r1 = (n: number) => Math.round(n * 10) / 10;

  return `USER PROFILE:
- Name: ${profile.name || "User"}
- Sex: ${profile.sex}, Age: ${profile.age}
- Height: ${profile.height_cm} cm, Current weight: ${profile.weight_kg} kg
- Goal weight: ${profile.goal_weight_kg ?? "not set"} kg
- Activity: ${profile.activity}, Goal: ${profile.goal}
- BMI: ${targets.bmi} (${targets.bmi_label})
- Healthy weight range: ${targets.healthy_low}–${targets.healthy_high} kg

DAILY TARGETS:
- Calories: ${targets.target.calories} kcal
- Protein: ${targets.target.protein_g} g
- Carbs: ${targets.target.carbs_g} g
- Fat: ${targets.target.fat_g} g
- Fiber: ${targets.target.fiber_g} g
- Water: ${profile.water_goal_ml ?? 4000} ml

TODAY SO FAR (${today}):
- Calories: ${r1(totals.kcal)} / ${targets.target.calories} kcal
- Protein: ${r1(totals.protein_g)} / ${targets.target.protein_g} g
- Carbs: ${r1(totals.carbs_g)} / ${targets.target.carbs_g} g
- Fat: ${r1(totals.fat_g)} / ${targets.target.fat_g} g
- Fiber: ${r1(totals.fiber_g)} / ${targets.target.fiber_g} g
- Water: ${waterMl} / ${profile.water_goal_ml ?? 4000} ml
- Foods logged: ${items.join(", ") || "none"}

RECENT WEIGHTS (last 7 entries):
${(weights ?? []).map(w => `- ${w.log_date}: ${w.kg_value} kg`).join("\n") || "- (no history yet)"}
`;
}
