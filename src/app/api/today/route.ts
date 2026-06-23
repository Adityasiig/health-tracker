import { NextResponse } from "next/server";
import { getServerSupabase, requireUser } from "@/lib/db/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireUser();
    const today = new Date().toISOString().slice(0, 10);
    return await dayLog(today);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function dayLog(date: string) {
  // The Server-Supabase client uses the user's JWT — RLS scopes to the current user automatically.
  const supabase = await getServerSupabase();
  const { data: rows, error } = await supabase
    .from("log_entries")
    .select(`
      id, log_date, eaten_at, quantity, note, meal_category,
      food:foods!inner ( id, name, category, unit, unit_grams,
                         kcal, protein_g, carbs_g, fat_g, fiber_g )
    `)
    .eq("log_date", date)
    .order("eaten_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const totals = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
  const entries = (rows ?? []).map((r) => {
    const food = Array.isArray(r.food) ? r.food[0] : r.food;
    const q = Number(r.quantity);
    const e = {
      id: r.id,
      eaten_at: r.eaten_at,
      meal_category: r.meal_category ?? "snack",
      food: {
        id: food.id, name: food.name, category: food.category,
        unit: food.unit, unit_grams: food.unit_grams,
      },
      quantity: q,
      note: r.note,
      kcal:      Math.round(food.kcal      * q * 10) / 10,
      protein_g: Math.round(food.protein_g * q * 10) / 10,
      carbs_g:   Math.round(food.carbs_g   * q * 10) / 10,
      fat_g:     Math.round(food.fat_g     * q * 10) / 10,
      fiber_g:   Math.round(food.fiber_g   * q * 10) / 10,
    };
    totals.kcal      += e.kcal;
    totals.protein_g += e.protein_g;
    totals.carbs_g   += e.carbs_g;
    totals.fat_g     += e.fat_g;
    totals.fiber_g   += e.fiber_g;
    return e;
  });
  (Object.keys(totals) as (keyof typeof totals)[]).forEach(k => {
    totals[k] = Math.round(totals[k] * 10) / 10;
  });
  return NextResponse.json({ date, entries, totals });
}
