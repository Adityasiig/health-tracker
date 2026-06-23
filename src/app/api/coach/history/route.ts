import { NextResponse } from "next/server";
import { sb } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { data, error } = await sb
    .from("chat_log")
    .select("id, role, content, created_at")
    .order("id", { ascending: true })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function DELETE() {
  // Supabase requires a filter, so use a guaranteed-true one.
  const { error } = await sb.from("chat_log").delete().gt("id", 0);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
