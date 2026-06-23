import { NextRequest, NextResponse } from "next/server";
import { sb } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const kg = Number(body.kg_value);
  if (!kg || kg <= 0) return NextResponse.json({ error: "kg_value > 0 required" }, { status: 400 });
  const log_date = body.log_date || new Date().toISOString().slice(0, 10);
  const { error } = await sb.from("weight_log").upsert(
    { log_date, kg_value: kg, recorded_at: new Date().toISOString() },
    { onConflict: "log_date" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // If logging today, sync to profile.weight_kg
  if (log_date === new Date().toISOString().slice(0, 10)) {
    await sb.from("profile").update({ weight_kg: kg }).eq("id", 1);
  }
  return NextResponse.json({ ok: true });
}
