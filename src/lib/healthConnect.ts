import { Capacitor, registerPlugin } from "@capacitor/core";

/**
 * Bridge to NyxHealthConnectPlugin.kt -- our custom Capacitor plugin
 * that talks to Android Health Connect.
 *
 * isAvailable() returns:
 *   available: true  if Health Connect is installed + ready
 *   status:    3 = ready, 2 = needs provider update, 1 = unavailable
 */
export interface NyxHealthConnectBridge {
  isAvailable: () => Promise<{ available: boolean; status: number }>;
  checkStepsPermission: () => Promise<{ granted: boolean }>;
  requestStepsPermission: () => Promise<{ granted: boolean }>;
  getTodaySteps: () => Promise<{ steps: number; date: string; recordCount: number }>;
  getStepsHistory: (opts: { days: number }) => Promise<{
    days: Array<{ date: string; steps: number }>;
    recordCount: number;
  }>;
}

export type StepDay = { date: string; steps: number };

const NyxHealthConnect = registerPlugin<NyxHealthConnectBridge>("NyxHealthConnect");

export function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export async function healthConnectStatus(): Promise<{
  platform: "web" | "android";
  available: boolean;
  statusCode: number;
}> {
  if (!isNativeAndroid()) {
    return { platform: "web", available: false, statusCode: -1 };
  }
  try {
    const { available, status } = await NyxHealthConnect.isAvailable();
    return { platform: "android", available, statusCode: status };
  } catch {
    return { platform: "android", available: false, statusCode: -1 };
  }
}

export async function hasStepsPermission(): Promise<boolean> {
  if (!isNativeAndroid()) return false;
  try {
    const { granted } = await NyxHealthConnect.checkStepsPermission();
    return granted;
  } catch {
    return false;
  }
}

export async function requestStepsPermission(): Promise<boolean> {
  if (!isNativeAndroid()) return false;
  try {
    const { granted } = await NyxHealthConnect.requestStepsPermission();
    return granted;
  } catch {
    return false;
  }
}

export async function fetchTodaySteps(): Promise<number | null> {
  if (!isNativeAndroid()) return null;
  try {
    const { steps } = await NyxHealthConnect.getTodaySteps();
    return steps;
  } catch {
    return null;
  }
}

/**
 * Returns daily step totals for the past N days, oldest -> newest with
 * zero-fill for days that have no records. null = web (no HC available).
 */
export async function fetchStepsHistory(days: number): Promise<StepDay[] | null> {
  if (!isNativeAndroid()) return null;
  try {
    const { days: arr } = await NyxHealthConnect.getStepsHistory({ days });
    return arr;
  } catch {
    return null;
  }
}
