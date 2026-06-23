import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmt = {
  int: (n: number | undefined) =>
    Number.isFinite(n) ? Math.round(n as number).toLocaleString() : "0",
  dec: (n: number | undefined, p = 1) =>
    Number.isFinite(n) ? (n as number).toFixed(p) : "0",
  pct: (cur: number, target: number) =>
    target > 0 ? Math.min(100, (cur / target) * 100) : 0,
};
