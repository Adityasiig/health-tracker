# Android App — Capacitor wrap

This webapp ships as both a Vercel-hosted PWA and a native Android app that
loads the live Vercel URL inside a WebView. Same code, two delivery surfaces,
zero re-write.

## How it works

```
┌──────────────────────┐        ┌──────────────────────────────────────┐
│  Android phone       │ HTTPS  │  Vercel (Next.js 16)                 │
│  ┌────────────────┐  │ ─────► │  health-tracker-five-xi.vercel.app   │
│  │ Capacitor      │  │        │                                      │
│  │ WebView        │  │ ◄───── │  Route Handlers, Supabase, Groq      │
│  │ (Chrome 90+)   │  │        │                                      │
│  └────────────────┘  │        └──────────────────────────────────────┘
│  + Native plugins:   │
│  • Status bar tint   │
│  • Splash screen     │
│  • App lifecycle     │
│  • Health Connect    │  ← Phase 3, not yet wired
└──────────────────────┘
```

The native shell is a thin Java/Kotlin app that boots a Chromium WebView
pointed at the Vercel URL. When you `git push`, the Vercel deployment
updates and the Android app picks it up on next launch — **no APK rebuild
required for content/UI/logic changes.** Rebuild the APK only when you
change Capacitor config, plugins, or native code.

## App identity

| | |
|---|---|
| Bundle ID | `com.adityasingh.healthtracker` |
| Display name | "Health Tracker" |
| Min SDK | 29 — Android 10 (Q, 2019) |
| Compile/Target SDK | 35 — Android 15 |
| Java target | 17 |
| Orientation | Locked portrait |

Bundle ID is permanent once published to Play Store; change it now if you
want a different one (`capacitor.config.ts` → `appId`).

## Build an APK on your laptop

1. **Install Android Studio** (Koala or newer). You already did this.
2. **Open the project**: in Android Studio → File → Open → select
   `health-tracker/android/` (NOT the repo root — specifically the `android/`
   subdirectory).
3. **Wait for Gradle sync** (~5 min first time, pulls the Android SDK).
   If it asks to "Upgrade Gradle plugin" — accept.
4. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
5. The APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`.
6. Plug your phone in (USB debugging on) and **Run ▶** the app, or `adb install`
   the APK manually.

## Sync after a Capacitor config change

If you edit `capacitor.config.ts` or add a plugin:

```bash
npm run build              # build the Next.js app (Capacitor needs webDir to exist)
npx cap sync android       # copy config + plugins into android/
```

You do NOT need to run `npx cap sync` for Vercel-side changes — those flow
through the WebView automatically.

## Adding a plugin (example: Health Connect)

```bash
npm install @capacitor-community/health-connect
npx cap sync android
```

Then add the relevant permissions to
`android/app/src/main/AndroidManifest.xml` and call the plugin from a
client component on the Vercel side.

## Phases shipped

| Phase | Status |
|---|---|
| **1. Capacitor wrap** — Android project, manifest, gradle, build config | ✅ done |
| **2. Native polish** — status-bar tint, splash, portrait lock, Java 17 + desugaring | ✅ done |
| **3. Health Connect plugin** — `@capacitor-community/health-connect`, perms, sync API | ⏳ next session |
| **4. Play Store release** — signed AAB, privacy policy URL, Play Console listing | ⏳ later |

## Custom icon (later)

Default Capacitor icon is in `android/app/src/main/res/mipmap-*`. To replace:

- Android Studio → right-click `res/` → New → **Image Asset** → "Launcher Icons (Adaptive and Legacy)"
- Drop your 512×512 PNG in
- It generates all densities (mdpi → xxxhdpi) automatically

Or use a tool like https://easyappicon.com/ and copy the generated files in.
