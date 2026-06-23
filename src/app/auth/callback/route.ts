/**
 * OAuth / email confirmation callback handler.
 * Supabase redirects here after the user clicks the email confirmation link.
 *
 * Flow:
 *   1. Exchange the one-time code for a session (sets the auth cookies)
 *   2. If the user has NO profile row yet AND has user_metadata from signup,
 *      seed the profile so the dashboard shows their data immediately
 *   3. Redirect to the dashboard (or ?next= if provided)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/db/server";
import { sb as adminClient } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await getServerSupabase();
  const { data: sessionData, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeErr || !sessionData.session) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const user = sessionData.user;

  // ── Auto-seed profile from signup user_metadata if missing ──
  const { data: existing } = await adminClient
    .from("profile")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing && user.user_metadata) {
    const m = user.user_metadata as {
      full_name?: string; age?: number; sex?: "male" | "female";
      height_cm?: number; weight_kg?: number; goal?: string; activity?: string;
    };
    // Only seed if we have the minimum required fields
    if (m.age && m.height_cm && m.weight_kg && m.sex) {
      await adminClient.from("profile").insert({
        user_id: user.id,
        name: m.full_name ?? "",
        sex: m.sex,
        age: Number(m.age),
        height_cm: Number(m.height_cm),
        weight_kg: Number(m.weight_kg),
        activity: m.activity ?? "moderate",
        goal: m.goal ?? "maintain",
        ethnicity: "asian_indian",
        water_goal_ml: 4000,
        updated_at: new Date().toISOString(),
      });
      // Snapshot first weigh-in
      await adminClient.from("weight_log").upsert(
        { user_id: user.id, log_date: new Date().toISOString().slice(0, 10), kg_value: Number(m.weight_kg), recorded_at: new Date().toISOString() },
        { onConflict: "user_id,log_date" }
      );
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
