import { NextResponse } from "next/server";
import { getServerSupabase, requireUser } from "@/lib/db/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from("chat_log").select("id, role, content, created_at")
      .order("id", { ascending: true }).limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function DELETE() {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { error } = await supabase.from("chat_log").delete().gt("id", 0);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
