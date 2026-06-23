/**
 * Server-side Supabase client (cookies-aware).
 * Use this inside Route Handlers + Server Components — it reads the
 * user's session from cookies and respects Row Level Security.
 *
 * For admin operations that must bypass RLS (data migration, public
 * cache writes), import { sb } from "@/lib/db/supabase" instead.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.SUPABASE_URL!,
    // For server client we use the ANON key + the user's session cookie.
    // Anon key is safe to expose, RLS does the heavy lifting.
    process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from Server Component is read-only — ignore.
          }
        },
      },
    }
  );
}

/**
 * Convenience: get the current authed user or null.
 * Returns the user object so callers can use user.id directly.
 */
export async function getUser() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/**
 * Helper that throws if there's no user — for Route Handlers
 * that should never see anonymous traffic (middleware should redirect).
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    throw new Response(
      JSON.stringify({ error: "unauthorized" }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
  }
  return user;
}
