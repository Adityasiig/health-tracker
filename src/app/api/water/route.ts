import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, requireUser } from "@/lib/db/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const ml = Number(body.ml_amount);
    if (!ml || ml <= 0) return NextResponse.json({ error: "ml_amount > 0 required" }, { status: 400 });
    const supabase = await getServerSupabase();
    const { error } = await supabase.from("water_log").insert({
      user_id: user.id,
      log_date: new Date().toISOString().slice(0, 10),
      eaten_at: new Date().toISOString(),
      ml_amount: ml,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
