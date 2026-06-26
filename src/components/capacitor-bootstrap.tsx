"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

/**
 * Capacitor runtime hooks for the native Android (and future iOS) shell.
 *
 * Status bar icon tint is driven by a direct JavascriptInterface
 * (window.NyxStatusBar.setLight) exposed by MainActivity.java. We bypassed
 * @capacitor/status-bar because it doesn't reliably flip icon colour when
 * the WebView is drawing edge-to-edge under a transparent status bar.
 *
 * Theme -> system icon style:
 *   light page (#F8FAFC) -> setLight(true)  -> dark/black icons
 *   dark  page (#0F172A) -> setLight(false) -> light/white icons
 */
declare global {
  interface Window {
    NyxStatusBar?: {
      setLight: (light: boolean) => void;
    };
  }
}

export function CapacitorBootstrap() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!resolvedTheme) return;
    if (typeof window === "undefined") return;
    const bridge = window.NyxStatusBar;
    if (!bridge) return; // Web mode or older APK that lacks the bridge
    try {
      bridge.setLight(resolvedTheme === "light");
    } catch {
      // never block render on a native call
    }
  }, [resolvedTheme]);

  return null;
}
