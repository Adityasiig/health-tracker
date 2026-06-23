// All /api/* requests are same-origin and proxied by the Next.js Route Handler
// at src/app/api/[...path]/route.ts → internal Flask on 127.0.0.1:5050.
async function request<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${res.status}: ${txt.slice(0, 200)}`);
  }
  return res.json();
}

export const api = {
  get: <T = unknown>(path: string) => request<T>(path),
  post: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  del: <T = unknown>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const swrFetcher = (path: string): Promise<any> => api.get(path);

// ---------- Types ----------
export type Profile = {
  id: number;
  name: string | null;
  sex: "male" | "female";
  age: number;
  height_cm: number;
  weight_kg: number;
  activity: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "cut" | "maintain" | "bulk";
  ethnicity: "asian_indian" | "general";
  water_goal_ml: number;
  goal_weight_kg: number | null;
  updated_at: string;
};

export type Targets = {
  bmr: number;
  tdee: number;
  bmi: number;
  bmi_label: string;
  bmi_color: "green" | "amber" | "red";
  healthy_low: number;
  healthy_high: number;
  target: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
};

export type ProfileResponse = {
  profile: Profile | null;
  computed: Targets | null;
};

export type Food = {
  id: number;
  name: string;
  category: string;
  unit: string;
  unit_grams: number | null;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  is_custom: number;
};

export type LogEntry = {
  id: number;
  eaten_at: string;
  meal_category: "breakfast" | "lunch" | "dinner" | "snack";
  food: {
    id: number;
    name: string;
    category: string;
    unit: string;
    unit_grams: number | null;
  };
  quantity: number;
  note: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
};

export type DayLog = {
  date: string;
  entries: LogEntry[];
  totals: {
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
};

export type WaterToday = {
  total_ml: number;
  entries: { id: number; eaten_at: string; ml_amount: number }[];
};

export type WeightPoint = { log_date: string; kg_value: number };

export type TrendsData = {
  days: number;
  nutrition: {
    date: string;
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  }[];
  water: { date: string; ml: number }[];
  weight: { date: string; kg: number }[];
};

export type ChatMessage = {
  id?: number;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
};

export type USDAFood = {
  fdcId: number;
  description: string;
  brandOwner: string | null;
  dataType: string;
  servingSize: number | null;
  servingSizeUnit: string;
  preview: {
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
};
