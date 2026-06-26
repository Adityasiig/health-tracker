"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";

/**
 * Capacitor runtime hooks for the native Android (and future iOS) shell.
 *
 * - On web (Vercel browser): isNativePlatform() returns false, this is a no-op.
 * - On Android (Capacitor WebView): the status bar is drawn TRANSPARENT and
 *   the WebView draws edge-to-edge under it (set up natively in
 *   MainActivity.java). Here we just toggle the system icon brightness so
 *   they remain readable against whatever theme the page is in.
 *
 * Theme -> Status bar icon style:
 *   dark  page (#0F172A)     -> Style.Light (white icons)
 *   light page (#F8FAFC)     -> Style.Dark  (dark icons)
 *
 * Mounted from src/app/layout.tsx so it fires once per app boot, then
 * re-fires whenever the user toggles theme.
 */
export function CapacitorBootstrap() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!resolvedTheme) return;

    (async () => {
      try {
        // Light theme -> dark icons for contrast on light bg
        // Dark  theme -> light icons for contrast on dark  bg
        const style = resolvedTheme === "light" ? Style.Dark : Style.Light;
        await StatusBar.setStyle({ style });
        // Force transparent so the page bg shows through (matches MainActivity)
        await StatusBar.setBackgroundColor({ color: "#00000000" });
      } catch {
        // Plugin missing on this channel -- silent
      }
    })();
  }, [resolvedTheme]);

  return null;
}
