/**
 * USDA FoodData Central — fetch + cache layer.
 * Mirrors the Flask implementation with same 7-day cache TTL and
 * Atwater-fallback for kcal-missing Foundation entries.
 */
import { sb } from "@/lib/db/supabase";

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";
const CACHE_TTL_SEC = 7 * 24 * 3600;

const N_ENERGY_KCAL = 1008;
const N_PROTEIN     = 1003;
const N_FAT         = 1004;
const N_CARBS       = 1005;
const N_FIBER       = 1079;

export type Nutrients = {
  kcal: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number;
};

export type UsdaFoodNutrient = {
  nutrientId?: number;
  value?: number;
  unitName?: string;
  nutrient?: { id?: number; unitName?: string; name?: string };
  amount?: number;
};

export type UsdaFood = {
  fdcId: number;
  description: string;
  brandOwner?: string | null;
  dataType?: string;
  servingSize?: number | null;
  servingSizeUnit?: string;
  foodNutrients?: UsdaFoodNutrient[];
};

export function nutrientLookup(nutrients: UsdaFoodNutrient[]): Nutrients {
  const out: Nutrients = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
  for (const n of nutrients ?? []) {
    let nid = n.nutrientId;
    let val = n.value;
    let unit = (n.unitName || "").toUpperCase();
    if (nid == null && n.nutrient) {
      nid = n.nutrient.id;
      val = n.amount;
      unit = (n.nutrient.unitName || "").toUpperCase();
    }
    if (val == null || !Number.isFinite(val)) continue;
    if (nid === N_ENERGY_KCAL && (unit === "KCAL" || unit === "")) out.kcal = val;
    else if (nid === N_PROTEIN) out.protein_g = val;
    else if (nid === N_CARBS) out.carbs_g = val;
    else if (nid === N_FAT) out.fat_g = val;
    else if (nid === N_FIBER) out.fiber_g = val;
  }
  // Atwater fallback when kcal missing/zero but macros are present.
  if (out.kcal <= 0 && (out.protein_g + out.carbs_g + out.fat_g) > 0) {
    out.kcal = Math.round((4 * out.protein_g + 4 * out.carbs_g + 9 * out.fat_g) * 10) / 10;
  }
  return out;
}

async function cachedGet(path: string, params: Record<string, string | number>) {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) throw new Error("USDA_API_KEY missing");

  // Cache key based on path + sorted params (excluding api_key)
  const sortedKeys = Object.keys(params).sort();
  const cacheKey = path + "?" + sortedKeys.map(k => `${k}=${params[k]}`).join("&");

  const { data: cached } = await sb
    .from("usda_cache").select("response_json, cached_at").eq("cache_key", cacheKey).maybeSingle();
  if (cached && Date.now() / 1000 - Number(cached.cached_at) < CACHE_TTL_SEC) {
    return JSON.parse(cached.response_json);
  }

  // Build URL with api_key + %20-encoded spaces (USDA prefers %20)
  const qs = new URLSearchParams();
  for (const k of sortedKeys) qs.set(k, String(params[k]));
  qs.set("api_key", apiKey);
  const url = `${USDA_BASE}${path}?${qs.toString().replace(/\+/g, "%20")}`;

  // 2 retries on 5xx / network errors; 4xx fails fast
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" }});
      if (r.status >= 400 && r.status < 500) {
        const text = await r.text();
        throw new Error(`USDA ${r.status}: ${text.slice(0, 200)}`);
      }
      if (!r.ok) { lastErr = new Error(`USDA ${r.status}`); await sleep(400); continue; }
      const body = await r.text();
      const data = JSON.parse(body);
      await sb.from("usda_cache").upsert(
        { cache_key: cacheKey, response_json: body, cached_at: Math.floor(Date.now() / 1000) },
        { onConflict: "cache_key" }
      );
      return data;
    } catch (e) {
      lastErr = e as Error;
      // 4xx errors don't retry — re-throw
      if (lastErr.message.startsWith("USDA 4")) throw lastErr;
      await sleep(400);
    }
  }
  throw lastErr ?? new Error("USDA unreachable");
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function searchUSDA(query: string) {
  // We fetch unfiltered and re-rank server-side. USDA's dataType param
  // produces intermittent 400s on some queries (verified for "quinoa").
  return await cachedGet("/foods/search", { query, pageSize: 100 });
}
