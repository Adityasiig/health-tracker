/**
 * Profile init endpoint — called once during signup to seed the row
 * with the body stats collected on step 2 of /signup.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, requireUser } from "@/lib/db/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const supabase = await getServerSupabase();
    const row = {
      user_id: user.id,
      name: body.name ?? user.user_metadata?.full_name ?? "",
      sex: body.sex,
      age: Number(body.age),
      height_cm: Number(body.height_cm),
      weight_kg: Number(body.weight_kg),
      activity: body.activity ?? "moderate",
      goal: body.goal ?? "maintain",
      ethnicity: body.ethnicity ?? "asian_indian",
      water_goal_ml: Number(body.water_goal_ml) || 4000,
      goal_weight_kg: body.goal_weight_kg ? Number(body.goal_weight_kg) : null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("profile").upsert(row, { onConflict: "user_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // First weigh-in
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("weight_log").upsert(
      { user_id: user.id, log_date: today, kg_value: row.weight_kg, recorded_at: new Date().toISOString() },
      { onConflict: "user_id,log_date" }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
