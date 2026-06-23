import { NextRequest, NextResponse } from "next/server";
import { sb } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  let query = sb.from("foods").select("*");
  if (q) {
    query = query.ilike("name", `%${q}%`).limit(50);
  } else {
    query = query.order("is_custom", { ascending: false }).order("name").limit(200);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  for (const f of ["name", "unit", "kcal", "protein_g", "carbs_g", "fat_g", "fiber_g"]) {
    if (body[f] === undefined) return NextResponse.json({ error: `missing ${f}` }, { status: 400 });
  }
  const row = {
    name: String(body.name).trim(),
    category: body.category || "custom",
    unit: body.unit,
    unit_grams: body.unit_grams === "" || body.unit_grams == null ? null : Number(body.unit_grams),
    kcal: Number(body.kcal),
    protein_g: Number(body.protein_g),
    carbs_g: Number(body.carbs_g),
    fat_g: Number(body.fat_g),
    fiber_g: Number(body.fiber_g),
    is_custom: 1,
  };
  const { data, error } = await sb.from("foods").insert(row).select().single();
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: `duplicate name: ${row.name}` }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data.id, ok: true });
}
