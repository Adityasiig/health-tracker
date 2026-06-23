/**
 * OAuth / email confirmation callback handler.
 * Supabase redirects here after the user clicks the email confirmation link.
 * We exchange the code for a session, then redirect to the dashboard.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/db/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (code) {
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
