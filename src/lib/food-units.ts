/**
 * Heuristic unit inference for USDA imports.
 * When USDA hands us "Egg, whole, raw" or "Rice, cooked", we shouldn't
 * default to grams — pick the natural counting unit a human uses.
 */

type UnitGuess = { unit: string; unit_grams: number };

// Order matters — first match wins.
const RULES: { pattern: RegExp; guess: UnitGuess; veto?: RegExp }[] = [
  // Eggs
  { pattern: /\begg/i, veto: /eggplant|noodle|roll|whites?\s+only|powder/i, guess: { unit: "piece", unit_grams: 50 } },
  // Fruits typically counted as pieces
  { pattern: /\bbanana/i, veto: /chip|powder|dried|flour/i, guess: { unit: "piece", unit_grams: 120 } },
  { pattern: /\bapple/i,  veto: /sauce|juice|cider|chip|dried|powder/i, guess: { unit: "piece", unit_grams: 180 } },
  { pattern: /\borange/i, veto: /juice|peel|zest/i, guess: { unit: "piece", unit_grams: 130 } },
  { pattern: /\bmango/i,  veto: /juice|powder|dried|chip/i, guess: { unit: "piece", unit_grams: 200 } },
  { pattern: /\bpear/i,   veto: /juice|sauce/i, guess: { unit: "piece", unit_grams: 178 } },
  { pattern: /\bpeach/i,  veto: /juice|canned/i, guess: { unit: "piece", unit_grams: 150 } },
  { pattern: /\bavocado/i, veto: /oil|powder/i, guess: { unit: "piece", unit_grams: 200 } },

  // Bread + slices
  { pattern: /\bbread/i, veto: /crumb|powder|flour|pudding/i, guess: { unit: "slice", unit_grams: 30 } },
  { pattern: /\btoast/i, guess: { unit: "slice", unit_grams: 28 } },
  { pattern: /\bbagel/i, guess: { unit: "piece", unit_grams: 95 } },
  { pattern: /\bcroissant/i, guess: { unit: "piece", unit_grams: 60 } },

  // Cooked grains → katori (Indian eating)
  { pattern: /rice.*cook|cook.*rice|rice,\s*white|rice,\s*brown/i, guess: { unit: "katori", unit_grams: 150 } },
  { pattern: /\bquinoa,?\s*cook/i, guess: { unit: "katori", unit_grams: 150 } },
  { pattern: /\boats?,?\s*cook|oatmeal/i, guess: { unit: "katori", unit_grams: 150 } },
  { pattern: /\bpasta,?\s*cook/i, guess: { unit: "katori", unit_grams: 150 } },

  // Drinks → cup
  { pattern: /\bmilk/i, veto: /powder|condensed|chocolate.*milk|coconut\s*milk/i, guess: { unit: "cup", unit_grams: 240 } },
  { pattern: /\bjuice/i, guess: { unit: "cup", unit_grams: 240 } },
  { pattern: /\byogurt|curd/i, veto: /powder|chip/i, guess: { unit: "katori", unit_grams: 150 } },

  // Meats sold by piece
  { pattern: /\bchicken\s+breast/i, veto: /sliced|deli|lunchmeat|powder/i, guess: { unit: "piece", unit_grams: 170 } },
  { pattern: /\bfish\s+fillet|salmon\s+fillet/i, guess: { unit: "piece", unit_grams: 150 } },

  // Nuts
  { pattern: /^almond$|^cashew$|^pistachio$|^walnut$/i, guess: { unit: "piece", unit_grams: 1.2 } },

  // Liquids — fall back to cup
  { pattern: /\bsoup|\bsauce/i, veto: /mix|powder|dry/i, guess: { unit: "katori", unit_grams: 200 } },
];

export function inferUnitFromName(name: string): UnitGuess | null {
  const n = name.toLowerCase();
  for (const r of RULES) {
    if (r.pattern.test(n) && !(r.veto && r.veto.test(n))) {
      return r.guess;
    }
  }
  return null;
}
