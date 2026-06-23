import { NextRequest, NextResponse } from "next/server";
import { sb } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const days = Number(req.nextUrl.searchParams.get("days") || 90);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const { data, error } = await sb
    .from("weight_log")
    .select("log_date, kg_value")
    .gte("log_date", cutoff.toISOString().slice(0, 10))
    .order("log_date", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
