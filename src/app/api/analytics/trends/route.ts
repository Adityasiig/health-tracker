import { NextRequest, NextResponse } from "next/server";
import { sb } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const days = Number(req.nextUrl.searchParams.get("days") || 7);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  // Daily nutrition totals — fetch raw rows + aggregate in JS (cleaner than 5x Postgres function calls)
  type Row = {
    log_date: string;
    quantity: number;
    food: { kcal: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number } | { kcal: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number }[];
  };
  const { data: rawRows, error: nErr } = await sb
    .from("log_entries")
    .select(`
      log_date, quantity,
      food:foods!inner ( kcal, protein_g, carbs_g, fat_g, fiber_g )
    `)
    .gte("log_date", cutoffStr);
  if (nErr) return NextResponse.json({ error: nErr.message }, { status: 500 });

  const byDay: Record<string, { kcal: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number }> = {};
  ((rawRows ?? []) as Row[]).forEach((r) => {
    const food = Array.isArray(r.food) ? r.food[0] : r.food;
    const d = r.log_date;
    if (!byDay[d]) byDay[d] = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
    const q = Number(r.quantity);
    byDay[d].kcal      += food.kcal * q;
    byDay[d].protein_g += food.protein_g * q;
    byDay[d].carbs_g   += food.carbs_g * q;
    byDay[d].fat_g     += food.fat_g * q;
    byDay[d].fiber_g   += food.fiber_g * q;
  });
  const nutrition = Object.keys(byDay).sort().map(d => ({
    date: d,
    kcal:      Math.round(byDay[d].kcal      * 10) / 10,
    protein_g: Math.round(byDay[d].protein_g * 10) / 10,
    carbs_g:   Math.round(byDay[d].carbs_g   * 10) / 10,
    fat_g:     Math.round(byDay[d].fat_g     * 10) / 10,
    fiber_g:   Math.round(byDay[d].fiber_g   * 10) / 10,
  }));

  // Water: aggregate by day
  const { data: waterRows, error: wErr } = await sb
    .from("water_log")
    .select("log_date, ml_amount")
    .gte("log_date", cutoffStr);
  if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 });
  const waterByDay: Record<string, number> = {};
  (waterRows ?? []).forEach((r) => {
    waterByDay[r.log_date] = (waterByDay[r.log_date] || 0) + Number(r.ml_amount);
  });
  const water = Object.keys(waterByDay).sort().map(d => ({ date: d, ml: waterByDay[d] }));

  // Weight history
  const { data: weightRows, error: kgErr } = await sb
    .from("weight_log")
    .select("log_date, kg_value")
    .gte("log_date", cutoffStr)
    .order("log_date", { ascending: true });
  if (kgErr) return NextResponse.json({ error: kgErr.message }, { status: 500 });
  const weight = (weightRows ?? []).map(r => ({ date: r.log_date, kg: r.kg_value }));

  return NextResponse.json({ days, nutrition, water, weight });
}
