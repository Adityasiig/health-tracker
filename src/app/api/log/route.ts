import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, requireUser } from "@/lib/db/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    if (!body.food_id || !body.quantity) {
      return NextResponse.json({ error: "food_id + quantity required" }, { status: 400 });
    }
    const supabase = await getServerSupabase();
    const today = body.log_date || new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("log_entries").insert({
      user_id: user.id,
      log_date: today,
      eaten_at: new Date().toISOString(),
      food_id: Number(body.food_id),
      quantity: Number(body.quantity),
      note: body.note || "",
      meal_category: body.meal_category || "snack",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
