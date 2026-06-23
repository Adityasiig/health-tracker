import { NextRequest, NextResponse } from "next/server";
import { sb } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ml = Number(body.ml_amount);
  if (!ml || ml <= 0) return NextResponse.json({ error: "ml_amount > 0 required" }, { status: 400 });
  const { error } = await sb.from("water_log").insert({
    log_date: new Date().toISOString().slice(0, 10),
    eaten_at: new Date().toISOString(),
    ml_amount: ml,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
