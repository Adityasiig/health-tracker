// Nutritionix Natural Language API wrapper.
// Free dev tier: 200 req/day per app_id. We use the /v2/natural/nutrients
// endpoint because it accepts strings like "1 katori dal" or "2 rotis" and
// resolves portion + macros in one call — exactly what the local IFCT/USDA
// seeds can't do (they're per-100g reference, no NLP).
//
// Get a free key at https://developer.nutritionix.com/ (no card). Two env vars:
//   NUTRITIONIX_APP_ID
//   NUTRITIONIX_APP_KEY

const NLP_URL = "https://trackapi.nutritionix.com/v2/natural/nutrients";

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
  | { ok: false; reason: "no_key" | "quota" | "bad_query" | "upstream"; message: string };

export async function nutritionixNlp(query: string): Promise<NlpResult> {
  const appId  = process.env.NUTRITIONIX_APP_ID;
  const appKey = process.env.NUTRITIONIX_APP_KEY;
  if (!appId || !appKey) {
    return { ok: false, reason: "no_key", message: "Nutritionix not configured" };
  }
  const trimmed = query.trim();
  if (!trimmed) return { ok: false, reason: "bad_query", message: "empty query" };

  const res = await fetch(NLP_URL, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "x-app-id":      appId,
      "x-app-key":     appKey,
      // Optional per-user attribution; helps Nutritionix dashboard
      "x-remote-user-id": "0",
    },
    body: JSON.stringify({ query: trimmed }),
    // Vercel edge will sometimes cache POST? Force fresh.
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    return { ok: false, reason: "no_key", message: "bad credentials" };
  }
  if (res.status === 429) {
    return { ok: false, reason: "quota", message: "Nutritionix daily quota hit" };
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    return { ok: false, reason: "upstream", message: `HTTP ${res.status}: ${txt.slice(0, 200)}` };
  }

  const data = await res.json();
  const foods: NutritionixFood[] = data.foods ?? [];
  return { ok: true, foods };
}

/** Convert one Nutritionix food → the shape the Log dialog already accepts. */
export function asLogFood(f: NutritionixFood) {
  return {
    name: `${f.food_name} (${f.serving_qty} ${f.serving_unit})`,
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
