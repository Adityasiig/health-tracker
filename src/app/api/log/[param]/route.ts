/**
 * Two operations live at /api/log/<param>:
 *   DELETE /api/log/123        → delete log_entry id=123
 *   GET    /api/log/2026-06-23 → day's log totals
 *
 * They share the URL prefix because the Flask version had it that way and
 * the React app already calls both shapes. We dispatch by HTTP method and
 * by whether the param is numeric (id) vs. date-shaped (YYYY-MM-DD).
 */
import { NextResponse } from "next/server";
import { sb } from "@/lib/db/supabase";
import { dayLog } from "../../today/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ param: string }> }) {
  const { param } = await ctx.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(param)) {
    return NextResponse.json({ error: "expected YYYY-MM-DD" }, { status: 400 });
  }
  return await dayLog(param);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ param: string }> }) {
  const { param } = await ctx.params;
  const id = Number(param);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "expected integer id" }, { status: 400 });
  }
  const { error } = await sb.from("log_entries").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
