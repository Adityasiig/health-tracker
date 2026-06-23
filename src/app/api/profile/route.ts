import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, requireUser } from "@/lib/db/server";
import { sb as adminClient } from "@/lib/db/supabase";
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

    // Explicit insert-or-update to avoid the upsert/onConflict footgun
    const { data: existing } = await supabase
      .from("profile").select("user_id").eq("user_id", user.id).maybeSingle();
    if (existing) {
      const { error } = await supabase.from("profile").update(row).eq("user_id", user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabase.from("profile").insert(row);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-snapshot today's weight (use admin client to allow the weight_log
    // insert even before the user's first request; RLS won't block service_role)
    const today = new Date().toISOString().slice(0, 10);
    await adminClient.from("weight_log").upsert(
      { user_id: user.id, log_date: today, kg_value: row.weight_kg, recorded_at: new Date().toISOString() },
      { onConflict: "user_id,log_date" }
    );

    return NextResponse.json({ profile: row, computed: computeTargets(row) });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
