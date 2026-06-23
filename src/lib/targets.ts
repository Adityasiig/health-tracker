/**
 * Targets: BMI / BMR / TDEE / macros.
 * Direct port of the Flask `compute_targets()` after the 2026-06-23 rewrite
 * (bodyweight-based protein/fat per Aditya's spec, not % of calories).
 */

export type Sex = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "cut" | "maintain" | "bulk";
export type Ethnicity = "asian_indian" | "general";

export type ProfileInput = {
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity: Activity;
  goal: Goal;
  ethnicity?: Ethnicity;
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

const ACTIVITY_MULT: Record<Activity, number> = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
};

const GOAL_CAL_DELTA: Record<Goal, number> = {
  cut:      -500,
  maintain:  0,
  bulk:      350,
};

// Bodyweight-based macros (industry-standard, not % of calories).
const PROTEIN_PER_KG: Record<Goal, number> = {
  cut:      2.0,   // fat-loss 1.8-2.2 → midpoint
  maintain: 1.6,   // general fitness 1.2-1.6 → upper
  bulk:     1.8,   // muscle gain 1.6-2.2 → midpoint
};

const FAT_PER_KG: Record<Goal, number> = {
  cut:      0.8,
  maintain: 0.9,
  bulk:     1.0,
};

export function bmrMifflin(sex: Sex, kg: number, cm: number, age: number): number {
  const base = 10 * kg + 6.25 * cm - 5 * age;
  return base + (sex === "male" ? 5 : -161);
}

export function bmiCategory(
  bmi: number,
  ethnicity: Ethnicity = "asian_indian"
): { label: string; color: "green" | "amber" | "red" } {
  if (ethnicity === "asian_indian") {
    if (bmi < 18.5) return { label: "Underweight", color: "amber" };
    if (bmi < 23.0) return { label: "Normal", color: "green" };
    if (bmi < 25.0) return { label: "Overweight", color: "amber" };
    if (bmi < 30.0) return { label: "Obese I", color: "red" };
    return { label: "Obese II", color: "red" };
  }
  // General WHO
  if (bmi < 18.5) return { label: "Underweight", color: "amber" };
  if (bmi < 25.0) return { label: "Normal", color: "green" };
  if (bmi < 30.0) return { label: "Overweight", color: "amber" };
  if (bmi < 35.0) return { label: "Obese I", color: "red" };
  if (bmi < 40.0) return { label: "Obese II", color: "red" };
  return { label: "Obese III", color: "red" };
}

export function healthyWeightRange(
  cm: number,
  ethnicity: Ethnicity = "asian_indian"
): [number, number] {
  const m = cm / 100;
  const [lo, hi] = ethnicity === "asian_indian" ? [18.5, 22.9] : [18.5, 24.9];
  return [Number((lo * m * m).toFixed(1)), Number((hi * m * m).toFixed(1))];
}

export function computeTargets(p: ProfileInput): Targets {
  const weight = p.weight_kg;
  const goal = p.goal;

  const bmr = bmrMifflin(p.sex, weight, p.height_cm, p.age);
  const tdee = bmr * ACTIVITY_MULT[p.activity];
  const targetCal = tdee + GOAL_CAL_DELTA[goal];

  const proteinG = weight * PROTEIN_PER_KG[goal];
  const fatG = weight * FAT_PER_KG[goal];
  const remainingKcal = targetCal - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(0, remainingKcal / 4);

  const bmi = weight / Math.pow(p.height_cm / 100, 2);
  const eth = p.ethnicity ?? "asian_indian";
  const { label, color } = bmiCategory(bmi, eth);
  const [lo, hi] = healthyWeightRange(p.height_cm, eth);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    bmi: Number(bmi.toFixed(1)),
    bmi_label: label,
    bmi_color: color,
    healthy_low: lo,
    healthy_high: hi,
    target: {
      calories: Math.round(targetCal),
      protein_g: Math.round(proteinG),
      carbs_g: Math.round(carbsG),
      fat_g: Math.round(fatG),
      fiber_g: Math.round((targetCal / 1000) * 14),
    },
  };
}
