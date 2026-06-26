"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

/**
 * Custom Capacitor plugin defined natively in
 * android/app/src/main/java/com/adityasingh/healthtracker/NyxStatusBarPlugin.java.
 *
 * On Android it calls WindowInsetsControllerCompat.setAppearanceLightStatusBars
 * directly. On web, the registerPlugin call returns a noop proxy so this
 * silently does nothing in the browser.
 */
interface NyxStatusBarBridge {
  setLight: (opts: { light: boolean }) => Promise<void>;
}
const NyxStatusBar = registerPlugin<NyxStatusBarBridge>("NyxStatusBar");

export function CapacitorBootstrap() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!resolvedTheme) return;
    // light theme  -> light=true  -> dark icons (visible on white)
    // dark  theme  -> light=false -> light icons (visible on slate-900)
    NyxStatusBar.setLight({ light: resolvedTheme === "light" }).catch(() => {});
  }, [resolvedTheme]);

  return null;
}
