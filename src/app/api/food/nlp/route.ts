import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/db/server";
import { nutritionixNlp, asLogFood } from "@/lib/nutritionix";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/food/nlp?q=1+katori+dal
 *
 * Wraps Nutritionix's /v2/natural/nutrients. Handles "2 rotis", "1 cup curd
 * rice", "30g paneer" — the natural-language portion parsing the local IFCT
 * seed can't do.
 *
 * Returns { ok: true, foods: [...] } where each food is already in the shape
 * the Log dialog accepts (kcal/P/C/F/fiber per the parsed portion, not per
 * 100g).
 */
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (!q) return NextResponse.json({ ok: true, foods: [] });

    const result = await nutritionixNlp(q);
    if (!result.ok) {
      // no_match is a legit empty result (not an error) — return 200
      // so the UI can show a friendly "no match, try USDA" message.
      const status = result.reason === "no_key"     ? 503
                   : result.reason === "quota"      ? 429
                   : result.reason === "bad_query"  ? 400
                   : result.reason === "no_match"   ? 200
                   : 502;
      return NextResponse.json(
        { ok: false, reason: result.reason, message: result.message },
        { status }
      );
    }

    return NextResponse.json({
      ok: true,
      foods: result.foods.map(asLogFood),
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { ok: false, reason: "internal", message: (e as Error).message },
      { status: 500 }
    );
  }
}
