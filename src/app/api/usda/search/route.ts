import { NextRequest, NextResponse } from "next/server";
import { searchUSDA, nutrientLookup, type UsdaFood } from "@/lib/usda";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TYPE_PRIORITY: Record<string, number> = {
  Foundation:        0,
  "SR Legacy":       1,
  "Survey (FNDDS)":  2,
  Branded:           3,
};

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ foods: [] });
  try {
    const data = await searchUSDA(q);
    const foods = (data.foods ?? []).map((f: UsdaFood) => ({
      fdcId: f.fdcId,
      description: f.description,
      brandOwner: f.brandOwner ?? null,
      dataType: f.dataType,
      servingSize: f.servingSize ?? null,
      servingSizeUnit: (f.servingSizeUnit ?? "").toLowerCase(),
      preview: nutrientLookup(f.foodNutrients ?? []),
    }));
    // Stable sort: Foundation > SR Legacy > Survey > Branded
    foods.sort((a: { dataType?: string }, b: { dataType?: string }) =>
      (TYPE_PRIORITY[a.dataType ?? ""] ?? 9) - (TYPE_PRIORITY[b.dataType ?? ""] ?? 9)
    );
    const nonBranded = foods.filter((f: { dataType?: string }) => f.dataType !== "Branded").slice(0, 20);
    const branded    = foods.filter((f: { dataType?: string }) => f.dataType === "Branded").slice(0, 8);
    return NextResponse.json({ totalHits: data.totalHits ?? 0, foods: [...nonBranded, ...branded] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
