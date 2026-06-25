import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, requireUser } from "@/lib/db/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const kg = Number(body.kg_value);
    if (!kg || kg <= 0) return NextResponse.json({ error: "kg_value > 0 required" }, { status: 400 });
    const log_date = body.log_date || new Date().toISOString().slice(0, 10);
    const supabase = await getServerSupabase();
    // Manual upsert because weight_log uses a partial UNIQUE INDEX (WHERE
    // user_id IS NOT NULL) — Postgres won't accept ON CONFLICT against a
    // partial index, so we do select-then-update-or-insert by hand.
    const { data: existing, error: selErr } = await supabase
      .from("weight_log")
      .select("id")
      .eq("user_id", user.id)
      .eq("log_date", log_date)
      .maybeSingle();
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });

    const row = { user_id: user.id, log_date, kg_value: kg, recorded_at: new Date().toISOString() };
    const op = existing
      ? supabase.from("weight_log").update(row).eq("id", existing.id)
      : supabase.from("weight_log").insert(row);
    const { error } = await op;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (log_date === new Date().toISOString().slice(0, 10)) {
      await supabase.from("profile").update({ weight_kg: kg }).eq("user_id", user.id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
