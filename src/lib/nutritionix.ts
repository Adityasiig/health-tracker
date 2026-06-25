// Natural-language food parser — Groq llama-3.3-70b + IFCT seed lookup.
//
// (File kept named nutritionix.ts so existing imports / route handler don't
// break; the function still exposes the same { ok, foods | reason } shape.)
//
// Why Groq instead of Nutritionix:
//   - Already wired (GROQ_API_KEY in env, used by /coach)
//   - No new account, no 200/day cap, no IP-block surprises
//   - LLM understands transliterations: "kela" → "Banana", "dahi" → "Curd"
//   - Macros come from our own IFCT 2017 seed (authoritative Indian data)
//
// Flow:
//   user query → Groq returns JSON {matches:[{food, qty, unit, grams}]}
//   → fuzzy-lookup each food in foods table
//   → scale row macros by grams/unit_grams
//   → return NlpFood[] in the shape the UI already expects.

import Groq from "groq-sdk";
import { sb } from "@/lib/db/supabase";

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/** UI-facing shape. Same as before so the route/UI don't change. */
export type NutritionixFood = {
  food_name: string;
  serving_qty: number;
  serving_unit: string;
  serving_weight_grams: number | null;
  nf_calories: number;
  nf_total_fat: number;
  nf_total_carbohydrate: number;
  nf_protein: number;
  nf_dietary_fiber: number | null;
  nf_sugars: number | null;
  nf_sodium: number | null;
  photo?: { thumb?: string };
};

export type NlpResult =
  | { ok: true; foods: NutritionixFood[] }
  | { ok: false; reason: "no_key" | "quota" | "bad_query" | "upstream" | "no_match"; message: string };

/** LLM-parsed item before DB lookup. */
type ParseItem = {
  food: string;     // canonical English name guess, e.g. "Bengal gram, dal"
  alias?: string;   // user's raw input ("dal", "kela") for fallback search
  qty: number;
  unit: string;
  grams: number;    // grams of edible portion this qty+unit represents
  // LLM-estimated macros for the ENTIRE portion (qty+unit). Used as a fallback
  // when no row in the foods table matches — IFCT is raw Indian foods only, so
  // composite/Western dishes like "chicken wrap" never match but the LLM knows
  // their macros from training data.
  kcal_est?: number;
  protein_g_est?: number;
  carbs_g_est?: number;
  fat_g_est?: number;
  fiber_g_est?: number;
};

const SYSTEM_PROMPT = `You parse food log entries into structured items AND estimate their macros.

Given a phrase like "1 katori dal and 2 chapatis" or "30g paneer" or "chicken wrap",
extract each distinct food item the user ate AND give per-portion macro estimates.

Rules:
- Output a JSON object: {"items": [...]}.
- Each item shape:
    {
      "food": "<English canonical name>",
      "alias": "<user's raw word, optional>",
      "qty": <number>,
      "unit": "<g | piece | katori | cup | tbsp | tsp | slice | bowl>",
      "grams": <total edible grams for qty * unit>,
      "kcal_est":      <kcal for the ENTIRE portion above>,
      "protein_g_est": <protein g for the entire portion>,
      "carbs_g_est":   <carbs g for the entire portion>,
      "fat_g_est":     <fat g for the entire portion>,
      "fiber_g_est":   <fibre g for the entire portion>
    }
- Macros are estimates for the WHOLE portion (qty*unit), not per-100g.
- Default unit weights:
    1 katori dal/sabzi/curd        = 150 g
    1 katori cooked rice/pulao     = 180 g
    1 chapati / roti               = 40 g
    1 paratha                      = 60 g
    1 piece bread slice            = 25 g
    1 cup milk/buttermilk          = 240 g
    1 cup chai (with milk+sugar)   = 200 g
    1 medium banana                = 120 g
    1 medium apple                 = 180 g
    1 medium egg                   = 50 g
    1 tbsp ghee/oil/butter         = 14 g
    1 tsp sugar/salt               = 5 g
    1 piece samosa                 = 60 g
    1 piece dosa                   = 90 g
    1 piece idli                   = 35 g
    1 chicken wrap                 = 250 g
    1 sandwich                     = 200 g
    1 pizza slice                  = 110 g
    1 burger                       = 250 g
- Translate Hindi/regional terms: kela=Banana, badam=Almond, aam=Mango, kaju=Cashew,
  dahi=Curd, dal=Lentil, chawal=Rice, paneer=Paneer, ghee=Ghee, besan=Chickpea flour,
  atta=Wheat flour, sabzi=Vegetable curry, namak=Salt.
- Prefer specific IFCT names when obvious: "dal" → "Bengal gram, dal" or "Red gram, dal".
- For composite/Western dishes (chicken wrap, sandwich, pizza, burger, pasta), still
  estimate macros from your training data — the user will see your numbers as a fallback
  when the local Indian food DB has no match.
- If the user gives explicit grams like "30g paneer", set qty=30, unit="g", grams=30.
- If you cannot identify anything edible, output {"items": []}.

Reply ONLY with the JSON object. No prose, no markdown.`;

export async function nutritionixNlp(query: string): Promise<NlpResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "no_key", message: "GROQ_API_KEY missing" };
  }
  const trimmed = query.trim();
  if (!trimmed) return { ok: false, reason: "bad_query", message: "empty query" };

  // 1) Ask Groq to parse the phrase
  let items: ParseItem[];
  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: trimmed },
      ],
      temperature: 0.1,
      max_tokens: 600,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    items = Array.isArray(parsed?.items) ? parsed.items : [];
  } catch (e) {
    return { ok: false, reason: "upstream", message: `Groq parse failed: ${(e as Error).message}` };
  }

  if (items.length === 0) {
    return { ok: false, reason: "no_match", message: "Couldn't recognise a food in that query" };
  }

  // 2) For each item, try DB lookup first; fall back to LLM-estimated macros
  const out: NutritionixFood[] = [];
  for (const it of items) {
    const grams = Math.max(1, Number(it.grams) || 0);
    const qty = Number(it.qty) || 1;
    const unit = it.unit || "serving";

    const row = await findFoodRow(it.food, it.alias);
    if (row) {
      // DB hit — scale row macros by grams. Row unit_grams is per-1-unit weight.
      const perGram = row.unit_grams && row.unit_grams > 0 ? 1 / row.unit_grams : 1 / 100;
      out.push({
        food_name: `${row.name} (${qty} ${unit})`,
        serving_qty: qty, serving_unit: unit, serving_weight_grams: grams,
        nf_calories:           row.kcal      * perGram * grams,
        nf_total_fat:          row.fat_g     * perGram * grams,
        nf_total_carbohydrate: row.carbs_g   * perGram * grams,
        nf_protein:            row.protein_g * perGram * grams,
        nf_dietary_fiber:      row.fiber_g   * perGram * grams,
        nf_sugars: null, nf_sodium: null,
      });
    } else if (
      it.kcal_est !== undefined && it.protein_g_est !== undefined &&
      it.carbs_g_est !== undefined && it.fat_g_est !== undefined
    ) {
      // DB miss but LLM gave us estimates — use them with a clear label
      out.push({
        food_name: `${it.food} (${qty} ${unit}) · AI estimate`,
        serving_qty: qty, serving_unit: unit, serving_weight_grams: grams,
        nf_calories:           it.kcal_est,
        nf_total_fat:          it.fat_g_est,
        nf_total_carbohydrate: it.carbs_g_est,
        nf_protein:            it.protein_g_est,
        nf_dietary_fiber:      it.fiber_g_est ?? 0,
        nf_sugars: null, nf_sodium: null,
      });
    }
    // If neither: silently drop this item
  }

  if (out.length === 0) {
    return { ok: false, reason: "no_match", message: "Couldn't match or estimate macros for that query" };
  }
  return { ok: true, foods: out };
}

type FoodRow = {
  name: string; unit_grams: number | null;
  kcal: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number;
};

/** Two-tier fuzzy search: ILIKE on the LLM's canonical name, then on the alias. */
async function findFoodRow(canonical: string, alias?: string): Promise<FoodRow | null> {
  const tryOne = async (term: string) => {
    const t = term.trim();
    if (!t) return null;
    // Exact ILIKE first (catches "Banana", "Almond, dried")
    const { data: exact } = await sb
      .from("foods")
      .select("name, unit_grams, kcal, protein_g, carbs_g, fat_g, fiber_g")
      .ilike("name", t)
      .limit(1);
    if (exact && exact[0]) return exact[0] as FoodRow;
    // Then prefix match
    const { data: pref } = await sb
      .from("foods")
      .select("name, unit_grams, kcal, protein_g, carbs_g, fat_g, fiber_g")
      .ilike("name", `${t}%`)
      .order("is_custom", { ascending: false })
      .limit(1);
    if (pref && pref[0]) return pref[0] as FoodRow;
    // Then contains match
    const { data: cont } = await sb
      .from("foods")
      .select("name, unit_grams, kcal, protein_g, carbs_g, fat_g, fiber_g")
      .ilike("name", `%${t}%`)
      .order("is_custom", { ascending: false })
      .limit(1);
    return (cont && cont[0]) ? (cont[0] as FoodRow) : null;
  };

  return (await tryOne(canonical)) || (alias ? await tryOne(alias) : null);
}

/** Convert one parsed food → the shape the Log dialog already accepts. */
export function asLogFood(f: NutritionixFood) {
  return {
    name: f.food_name,
    category: "snack",
    unit: f.serving_unit || "serving",
    unit_grams: f.serving_weight_grams ?? null,
    kcal: round1(f.nf_calories),
    protein_g: round1(f.nf_protein),
    carbs_g: round1(f.nf_total_carbohydrate),
    fat_g: round1(f.nf_total_fat),
    fiber_g: round1(f.nf_dietary_fiber ?? 0),
    source: "nutritionix" as const,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
