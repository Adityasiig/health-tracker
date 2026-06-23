import { NextResponse } from "next/server";
import { getServerSupabase, requireUser } from "@/lib/db/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("water_log")
      .select("id, eaten_at, ml_amount")
      .eq("log_date", today)
      .order("eaten_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const total = (data ?? []).reduce((s, r) => s + Number(r.ml_amount), 0);
    return NextResponse.json({ total_ml: total, entries: data ?? [] });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
