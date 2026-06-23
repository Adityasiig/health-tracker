import { NextRequest, NextResponse } from "next/server";
import { sb } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.food_id || !body.quantity) {
    return NextResponse.json({ error: "food_id + quantity required" }, { status: 400 });
  }
  const today = body.log_date || new Date().toISOString().slice(0, 10);
  const { error } = await sb.from("log_entries").insert({
    log_date: today,
    eaten_at: new Date().toISOString(),
    food_id: Number(body.food_id),
    quantity: Number(body.quantity),
    note: body.note || "",
    meal_category: body.meal_category || "snack",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
