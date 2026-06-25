"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Database, Globe, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { Food, USDAFood } from "@/lib/api";
import { fmt } from "@/lib/utils";
import { LogModal } from "@/components/log-modal";

// Shape returned by /api/food/nlp — already normalised by asLogFood() server-side.
type NlpFood = {
  name: string;
  category: string;
  unit: string;
  unit_grams: number | null;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  source: "nutritionix";
};

export default function FoodSearchPage() {
  const [q, setQ] = useState("");
  const [localFoods, setLocalFoods] = useState<Food[]>([]);
  const [nlpFoods, setNlpFoods] = useState<NlpFood[]>([]);
  const [usdaFoods, setUsdaFoods] = useState<USDAFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [nlpLoading, setNlpLoading] = useState(false);
  const [nlpError, setNlpError] = useState("");
  const [usdaLoading, setUsdaLoading] = useState(false);
  const [usdaError, setUsdaError] = useState("");
  const [picked, setPicked] = useState<Food | null>(null);

  const searchLocal = async (term: string) => {
    setQ(term);
    setNlpFoods([]); setNlpError("");
    setUsdaFoods([]); setUsdaError("");
    if (!term.trim()) { setLocalFoods([]); return; }
    setLoading(true);
    try {
      const rows = await api.get<Food[]>(`/api/foods?q=${encodeURIComponent(term)}`);
      setLocalFoods(rows);
    } finally {
      setLoading(false);
    }
  };

  // Nutritionix natural-language. Best for "1 katori dal" / "2 rotis" / "30g paneer".
  const searchNlp = async () => {
    if (!q.trim()) return;
    setNlpLoading(true); setNlpError("");
    try {
      const d = await api.get<{ ok: boolean; foods: NlpFood[]; reason?: string; message?: string }>(
        `/api/food/nlp?q=${encodeURIComponent(q)}`
      );
      if (!d.ok) {
        setNlpError(d.reason === "no_key" ? "Nutritionix not configured." : d.message || "Nutritionix unreachable.");
        return;
      }
      setNlpFoods(d.foods);
    } catch (err) {
      setNlpError((err as Error).message);
    } finally {
      setNlpLoading(false);
    }
  };

  // Import an NLP food into the user's foods table and open the log modal.
  // Nutritionix names can collide ("1 cup rice" parsed twice → same name), so we
  // tolerate the 409 duplicate-name response by re-searching local for that name.
  const importAndPickNlp = async (n: NlpFood) => {
    try {
      const r = await api.post<{ id: number; ok: boolean }>("/api/foods", {
        name: n.name, category: n.category, unit: n.unit, unit_grams: n.unit_grams,
        kcal: n.kcal, protein_g: n.protein_g, carbs_g: n.carbs_g, fat_g: n.fat_g, fiber_g: n.fiber_g,
        is_custom: 1,
      });
      // Build a Food-shaped object the LogModal can consume directly.
      setPicked({
        id: r.id, name: n.name, category: n.category,
        unit: n.unit, unit_grams: n.unit_grams ?? null,
        kcal: n.kcal, protein_g: n.protein_g, carbs_g: n.carbs_g,
        fat_g: n.fat_g, fiber_g: n.fiber_g, is_custom: 1,
      } as Food);
    } catch (e) {
      // Duplicate-name → find existing row and use that
      const msg = (e as Error).message || "";
      if (msg.includes("duplicate")) {
        const rows = await api.get<Food[]>(`/api/foods?q=${encodeURIComponent(n.name)}`);
        const hit = rows.find(r => r.name === n.name) || rows[0];
        if (hit) setPicked(hit);
      } else {
        throw e;
      }
    }
  };

  const searchUSDA = async () => {
    if (!q.trim()) return;
    setUsdaLoading(true);
    setUsdaError("");
    try {
      const d = await api.get<{ foods: USDAFood[] }>(`/api/usda/search?q=${encodeURIComponent(q)}`);
      setUsdaFoods(d.foods);
    } catch (err) {
      setUsdaError((err as Error).message);
    } finally {
      setUsdaLoading(false);
    }
  };

  const importAndPick = async (u: USDAFood) => {
    const r = await api.post<{ food: Food }>("/api/usda/import", u);
    setPicked(r.food);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Food Search</h1>
        <p className="text-sm text-[rgb(var(--fg-muted))] mt-1">
          Search your foods (IFCT 2017 + curated), parse natural language with Nutritionix, or query USDA.
        </p>
      </div>

      {/* Search input */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--fg-muted))]" />
          <input
            value={q}
            onChange={(e) => searchLocal(e.target.value)}
            placeholder="Search food…"
            className="input pl-11 text-base"
            autoFocus
          />
        </div>
      </div>

      {/* Local results */}
      {q.trim() && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[rgb(var(--fg-muted))]">
              Your Database
            </h2>
            <span className="text-xs text-[rgb(var(--fg-muted))]">· {localFoods.length} results</span>
          </div>
          {loading ? (
            <div className="text-sm text-[rgb(var(--fg-muted))]">Searching…</div>
          ) : localFoods.length === 0 ? (
            <div className="glass-card p-6 text-center text-sm text-[rgb(var(--fg-muted))]">
              No local matches. Try the USDA database below.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {localFoods.map((f) => (
                <FoodCard key={f.id} food={f} onPick={() => setPicked(f)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nutritionix natural-language */}
      {q.trim() && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[rgb(var(--fg-muted))]">
              Natural Language (Nutritionix)
            </h2>
            {nlpFoods.length > 0 && (
              <span className="text-xs text-[rgb(var(--fg-muted))]">· {nlpFoods.length} results</span>
            )}
          </div>

          {nlpFoods.length === 0 && !nlpLoading && !nlpError && (
            <button onClick={searchNlp} className="btn btn-outline w-full">
              <Sparkles className="w-4 h-4" /> Parse &quot;{q}&quot; with Nutritionix NLP
            </button>
          )}

          {nlpLoading && <div className="text-sm text-[rgb(var(--fg-muted))]">Parsing…</div>}

          {nlpError && (
            <div className="glass-card p-4 border-purple-500/30 text-sm">
              <div className="text-purple-500">{nlpError}</div>
              <button onClick={searchNlp} className="btn btn-outline mt-2 text-xs">↻ Retry</button>
            </div>
          )}

          {nlpFoods.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {nlpFoods.map((n, i) => (
                <NlpCard key={`nlp-${i}`} food={n} onPick={() => importAndPickNlp(n)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* USDA toggle / results */}
      {q.trim() && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[rgb(var(--fg-muted))]">
              USDA Food Database
            </h2>
            {usdaFoods.length > 0 && (
              <span className="text-xs text-[rgb(var(--fg-muted))]">· {usdaFoods.length} results</span>
            )}
          </div>

          {usdaFoods.length === 0 && !usdaLoading && !usdaError && (
            <button onClick={searchUSDA} className="btn btn-outline w-full">
              <Globe className="w-4 h-4" /> Search USDA for &quot;{q}&quot;
            </button>
          )}

          {usdaLoading && <div className="text-sm text-[rgb(var(--fg-muted))]">Querying USDA…</div>}

          {usdaError && (
            <div className="glass-card p-4 border-red-500/30 text-sm">
              <div className="text-red-500">USDA unreachable.</div>
              <button onClick={searchUSDA} className="btn btn-outline mt-2 text-xs">↻ Retry</button>
            </div>
          )}

          {usdaFoods.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {usdaFoods.map((u, i) => (
                <UsdaCard key={`${u.fdcId}-${i}`} food={u} onPick={() => importAndPick(u)} />
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {picked && (
          <LogModal food={picked} onClose={() => setPicked(null)} onLogged={() => setPicked(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}


function FoodCard({ food, onPick }: { food: Food; onPick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="glass-card p-4 flex flex-col gap-3"
    >
      <div>
        <div className="font-semibold text-sm">{food.name}</div>
        <div className="text-xs text-[rgb(var(--fg-muted))] capitalize">{food.category}</div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat label="kcal" value={fmt.dec(food.kcal)} cls="text-emerald-500" />
        <Stat label="P" value={`${fmt.dec(food.protein_g)}g`} cls="text-blue-500" />
        <Stat label="C" value={`${fmt.dec(food.carbs_g)}g`} cls="text-orange-500" />
        <Stat label="F" value={`${fmt.dec(food.fat_g)}g`} cls="text-red-500" />
      </div>
      <div className="text-[10px] text-[rgb(var(--fg-muted))] tabular-nums">
        per 1 {food.unit}{food.unit_grams ? ` (${fmt.dec(food.unit_grams)}g)` : ""}
      </div>
      <button onClick={onPick} className="btn btn-primary text-xs">
        <Plus className="w-3.5 h-3.5" /> Add Meal
      </button>
    </motion.div>
  );
}

function UsdaCard({ food, onPick }: { food: USDAFood; onPick: () => Promise<void> }) {
  const [adding, setAdding] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="glass-card p-4 flex flex-col gap-3 border-blue-500/20"
    >
      <div>
        <div className="font-semibold text-sm">{food.description}</div>
        <div className="text-xs text-[rgb(var(--fg-muted))]">
          {food.brandOwner && <span className="italic mr-2">{food.brandOwner}</span>}
          <span className="text-blue-500">{food.dataType.toLowerCase().replace("survey (fndds)", "fndds")}</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat label="kcal" value={fmt.dec(food.preview.kcal)} cls="text-emerald-500" />
        <Stat label="P" value={`${fmt.dec(food.preview.protein_g)}g`} cls="text-blue-500" />
        <Stat label="C" value={`${fmt.dec(food.preview.carbs_g)}g`} cls="text-orange-500" />
        <Stat label="F" value={`${fmt.dec(food.preview.fat_g)}g`} cls="text-red-500" />
      </div>
      <div className="text-[10px] text-[rgb(var(--fg-muted))] tabular-nums">
        per 100 g {food.servingSize ? `· serving ${food.servingSize}${food.servingSizeUnit}` : ""}
      </div>
      <button
        disabled={adding}
        onClick={async () => { setAdding(true); try { await onPick(); } finally { setAdding(false); } }}
        className="btn btn-primary text-xs disabled:opacity-50"
      >
        <Plus className="w-3.5 h-3.5" /> {adding ? "Importing…" : "Import + Log"}
      </button>
    </motion.div>
  );
}

function NlpCard({ food, onPick }: { food: NlpFood; onPick: () => Promise<void> }) {
  const [adding, setAdding] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="glass-card p-4 flex flex-col gap-3 border-purple-500/20"
    >
      <div>
        <div className="font-semibold text-sm">{food.name}</div>
        <div className="text-xs text-[rgb(var(--fg-muted))]">
          <span className="text-purple-500">parsed by Nutritionix</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat label="kcal" value={fmt.dec(food.kcal)} cls="text-emerald-500" />
        <Stat label="P" value={`${fmt.dec(food.protein_g)}g`} cls="text-blue-500" />
        <Stat label="C" value={`${fmt.dec(food.carbs_g)}g`} cls="text-orange-500" />
        <Stat label="F" value={`${fmt.dec(food.fat_g)}g`} cls="text-red-500" />
      </div>
      <div className="text-[10px] text-[rgb(var(--fg-muted))] tabular-nums">
        per 1 {food.unit}{food.unit_grams ? ` (${fmt.dec(food.unit_grams)}g)` : ""}
      </div>
      <button
        disabled={adding}
        onClick={async () => { setAdding(true); try { await onPick(); } finally { setAdding(false); } }}
        className="btn btn-primary text-xs disabled:opacity-50"
      >
        <Plus className="w-3.5 h-3.5" /> {adding ? "Importing…" : "Import + Log"}
      </button>
    </motion.div>
  );
}

function Stat({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div>
      <div className="text-[10px] text-[rgb(var(--fg-muted))] uppercase">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}
