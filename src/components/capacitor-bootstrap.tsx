"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";

/**
 * Capacitor runtime hooks for the native Android (and future iOS) shell.
 *
 * Status bar handling:
 *   Capacitor Style.Light = LIGHT bar appearance = dark icons -> use on LIGHT bg
 *   Capacitor Style.Dark  = DARK  bar appearance = white icons -> use on DARK  bg
 *
 *   light theme (#F8FAFC) -> Style.Light (dark icons, readable)
 *   dark  theme (#0F172A) -> Style.Dark  (white icons, readable)
 *
 * Status bar background is forced transparent so the page bg shows through
 * (set up natively in MainActivity.java + here as a belt-and-braces).
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
        const style = resolvedTheme === "light" ? Style.Light : Style.Dark;
        await StatusBar.setStyle({ style });
        await StatusBar.setBackgroundColor({ color: "#00000000" });
      } catch {
        // Plugin missing on this channel -- silent
      }
    })();
  }, [resolvedTheme]);

  return null;
}
