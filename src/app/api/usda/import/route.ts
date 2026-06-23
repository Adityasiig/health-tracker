import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, requireUser } from "@/lib/db/server";
import { nutrientLookup, type Nutrients } from "@/lib/usda";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type IncomingFood = {
  description?: string;
  brandOwner?: string | null;
  dataType?: string;
  servingSize?: number | null;
  servingSizeUnit?: string;
  preview?: Nutrients;
  foodNutrients?: Parameters<typeof nutrientLookup>[0];
};

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const f: IncomingFood = await req.json();

    const n: Nutrients =
      f.foodNutrients?.length
        ? nutrientLookup(f.foodNutrients)
        : (f.preview ?? { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 });

    const name = (f.description ?? "").trim();
    const brand = (f.brandOwner ?? "").trim();
    const dataType = f.dataType ?? "";
    const servingSize = f.servingSize ?? null;
    const servingUnit = (f.servingSizeUnit ?? "").toLowerCase();

    let unit: string, unit_grams: number | null, scale: number, category: string;
    if (dataType === "Branded" && servingSize && (servingUnit === "g" || servingUnit === "ml")) {
      unit = "piece";
      unit_grams = Number(servingSize);
      scale = unit_grams / 100;
      category = "branded";
    } else {
      unit = "g";
      unit_grams = null;
      scale = 1 / 100;
      category = (dataType || "usda").toLowerCase().replace(/\s+/g, "_").replace(/[()]/g, "");
    }

    const display =
      brand && !name.toLowerCase().includes(brand.toLowerCase())
        ? `${name} (${brand})`
        : name;
    const finalName = (display || "Unnamed USDA food").slice(0, 120);

    const food = {
      name: finalName,
      category: category.slice(0, 30),
      unit,
      unit_grams,
      kcal:      Math.round(n.kcal      * scale * 1000) / 1000,
      protein_g: Math.round(n.protein_g * scale * 1000) / 1000,
      carbs_g:   Math.round(n.carbs_g   * scale * 1000) / 1000,
      fat_g:     Math.round(n.fat_g     * scale * 1000) / 1000,
      fiber_g:   Math.round(n.fiber_g   * scale * 1000) / 1000,
      is_custom: 1,
      owner_id: user.id,
    };

    const supabase = await getServerSupabase();
    const { data: existing } = await supabase
      .from("foods").select("id, owner_id").eq("name", food.name).maybeSingle();
    if (existing) {
      // Only update if it's the user's own food (RLS will enforce this anyway)
      const { error } = await supabase.from("foods").update(food).eq("id", existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const { data: row } = await supabase.from("foods").select("*").eq("id", existing.id).single();
      return NextResponse.json({ ok: true, food: row });
    } else {
      const { data: row, error } = await supabase.from("foods").insert(food).select("*").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, food: row });
    }
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
