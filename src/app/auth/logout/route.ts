/**
 * Logout endpoint — clears the Supabase session cookie, redirects to /login.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/db/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
