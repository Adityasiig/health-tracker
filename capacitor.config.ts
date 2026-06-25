import type { CapacitorConfig } from "@capacitor/cli";

// Health Tracker — Capacitor configuration.
//
// We do NOT bundle the Next.js webapp into the APK. Instead the native shell
// loads the live Vercel URL in a WebView. Benefits:
//   - `git push` auto-deploys → app updates without re-installing the APK
//   - Server-side Route Handlers, Supabase auth, Groq AI all keep working
//   - APK stays tiny (~2 MB shell)
// Downside accepted: requires network. No offline mode.
//
// To switch to a bundled build later (offline-capable), remove the `server`
// block and add `webDir: "out"` after running `next build` with the
// `output: 'export'` config.

const config: CapacitorConfig = {
  appId: "com.adityasingh.healthtracker",
  appName: "Health Tracker",
  // webDir is required by Capacitor schema even when using server.url — point
  // at the standard Next.js build output so `npx cap sync` doesn't complain.
  webDir: ".next",
  server: {
    url: "https://health-tracker-five-xi.vercel.app",
    cleartext: false,
    androidScheme: "https",
    // Allow only the Vercel domain + Supabase (auth callbacks) + Groq (AI coach).
    // Anything else won't load inside the WebView — defence against XSS-style
    // navigation to attacker-controlled origins.
    allowNavigation: [
      "health-tracker-five-xi.vercel.app",
      "*.vercel.app",
      "*.supabase.co",
      "api.groq.com",
    ],
  },
  android: {
    // Lock to portrait — health tracker doesn't need landscape
    // (configured in MainActivity.java by Capacitor)
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true, // disable for Play Store release build
    minWebViewVersion: 90,             // requires Chrome 90+ on device (Android 10+ all ship newer)
  },
  // Splash + status-bar polish handled in Phase 2 via dedicated plugins
};

export default config;
