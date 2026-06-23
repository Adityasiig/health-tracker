import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, requireUser } from "@/lib/db/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Naive plural-strip: "eggs" → "egg", "potatoes" → "potatoe" (close enough for ILIKE). */
function stem(w: string): string {
  if (w.length > 3 && w.endsWith("s")) return w.slice(0, -1);
  return w;
}

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
    const supabase = await getServerSupabase();

    if (!q) {
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .order("is_custom", { ascending: false })
        .order("name")
        .limit(200);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data ?? []);
    }

    // Multi-word search: split into words, stem, AND-match each word against
    // either the name or any alias. Uses `search_text` generated column when
    // available (after migration 0005); falls back gracefully if not.
    const words = q.split(/\s+/).filter((w) => w.length > 0).map(stem);

    let query = supabase.from("foods").select("*");
    for (const w of words) {
      // Match against `search_text` (which concatenates name + aliases lowercase).
      // If the column doesn't exist yet (pre-0005), Supabase falls back to name.
      query = query.or(
        `search_text.ilike.%${w}%,name.ilike.%${w}%`
      );
    }
    query = query.limit(50);

    const { data, error } = await query;
    if (error) {
      // If search_text column missing, retry against just `name`
      let fallback = supabase.from("foods").select("*");
      for (const w of words) fallback = fallback.ilike("name", `%${w}%`);
      fallback = fallback.limit(50);
      const { data: d2, error: e2 } = await fallback;
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
      return NextResponse.json(d2 ?? []);
    }
    return NextResponse.json(data ?? []);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    for (const f of ["name", "unit", "kcal", "protein_g", "carbs_g", "fat_g", "fiber_g"]) {
      if (body[f] === undefined) return NextResponse.json({ error: `missing ${f}` }, { status: 400 });
    }
    const supabase = await getServerSupabase();
    const row = {
      name: String(body.name).trim(),
      category: body.category || "custom",
      unit: body.unit,
      unit_grams: body.unit_grams === "" || body.unit_grams == null ? null : Number(body.unit_grams),
      kcal: Number(body.kcal),
      protein_g: Number(body.protein_g),
      carbs_g: Number(body.carbs_g),
      fat_g: Number(body.fat_g),
      fiber_g: Number(body.fiber_g),
      is_custom: 1,
      owner_id: user.id,
    };
    const { data, error } = await supabase.from("foods").insert(row).select().single();
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: `duplicate name: ${row.name}` }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ id: data.id, ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
