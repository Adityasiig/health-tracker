/**
 * Supabase admin client — server-side ONLY (never imported into client code).
 * Uses the service_role key which bypasses Row Level Security.
 * Singleton across hot-reloads in dev.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  // Helpful error if someone forgets the env vars
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — DB calls will fail."
  );
}

declare global {
  // eslint-disable-next-line no-var
  var __supabaseAdmin: SupabaseClient | undefined;
}

export const sb: SupabaseClient =
  globalThis.__supabaseAdmin ??
  createClient(URL ?? "https://invalid.supabase.co", KEY ?? "invalid", {
    auth: { persistSession: false, autoRefreshToken: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__supabaseAdmin = sb;
}
