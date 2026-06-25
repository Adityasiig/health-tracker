"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";

/**
 * Capacitor runtime hooks for the native Android (and future iOS) shell.
 *
 * - On web (Vercel browser): isNativePlatform() returns false, this is a no-op.
 * - On Android (Capacitor WebView): tint the status bar to match our dark
 *   theme so it blends with the dashboard, hide the splash once the React
 *   tree has mounted.
 *
 * Mounted from src/app/layout.tsx so it fires once per app boot.
 */
export function CapacitorBootstrap() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    (async () => {
      try {
        // Status bar matches the dashboard's deep slate (#0b1220).
        // Style.Dark = light text on a dark background.
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#0b1220" });
        // Hide the default Capacitor splash once the React tree is mounted.
        await SplashScreen.hide({ fadeOutDuration: 200 });
      } catch {
        // Plugins not installed on this build channel — fail silent
      }
    })();
  }, []);

  return null;
}
