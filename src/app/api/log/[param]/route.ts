/**
 * Two operations live at /api/log/<param>:
 *   DELETE /api/log/123        → delete log_entry id=123 (user-scoped via RLS)
 *   GET    /api/log/2026-06-23 → day's log totals
 */
import { NextResponse } from "next/server";
import { getServerSupabase, requireUser } from "@/lib/db/server";
import { dayLog } from "../../today/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ param: string }> }) {
  try {
    await requireUser();
    const { param } = await ctx.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(param)) {
      return NextResponse.json({ error: "expected YYYY-MM-DD" }, { status: 400 });
    }
    return await dayLog(param);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ param: string }> }) {
  try {
    await requireUser();
    const { param } = await ctx.params;
    const id = Number(param);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "expected integer id" }, { status: 400 });
    }
    const supabase = await getServerSupabase();
    // RLS ensures the user can only delete their own row
    const { error } = await supabase.from("log_entries").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
