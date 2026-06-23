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
    const { error } = await supabase.from("weight_log").upsert(
      { user_id: user.id, log_date, kg_value: kg, recorded_at: new Date().toISOString() },
      { onConflict: "user_id,log_date" }
    );
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
