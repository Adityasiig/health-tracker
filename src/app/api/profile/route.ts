import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, requireUser } from "@/lib/db/server";
import { computeTargets } from "@/lib/targets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from("profile").select("*").eq("user_id", user.id).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ profile: null, computed: null });
    return NextResponse.json({ profile: data, computed: computeTargets(data) });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    for (const f of ["sex", "age", "height_cm", "weight_kg", "activity", "goal"]) {
      if (body[f] === undefined || body[f] === null || body[f] === "")
        return NextResponse.json({ error: `missing ${f}` }, { status: 400 });
    }
    const supabase = await getServerSupabase();
    const row = {
      user_id: user.id,
      name: body.name ?? "",
      sex: body.sex,
      age: Number(body.age),
      height_cm: Number(body.height_cm),
      weight_kg: Number(body.weight_kg),
      activity: body.activity,
      goal: body.goal,
      ethnicity: body.ethnicity ?? "asian_indian",
      water_goal_ml: Number(body.water_goal_ml) || 4000,
      goal_weight_kg: body.goal_weight_kg ? Number(body.goal_weight_kg) : null,
      updated_at: new Date().toISOString(),
    };
    const { error: upErr } = await supabase.from("profile").upsert(row, { onConflict: "user_id" });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    // Auto-snapshot weight to weight_log
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("weight_log").upsert(
      { user_id: user.id, log_date: today, kg_value: row.weight_kg, recorded_at: new Date().toISOString() },
      { onConflict: "user_id,log_date" }
    );

    return NextResponse.json({ profile: row, computed: computeTargets(row) });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
