import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";

const URL = import.meta.env.PUBLIC_SUPABASE_URL ?? process.env.PUBLIC_SUPABASE_URL ?? "";
const ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? process.env.PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE = import.meta.env.SUPABASE_SERVICE_ROLE ?? process.env.SUPABASE_SERVICE_ROLE ?? "";

/** Stateless public client — use in .astro frontmatter + /api/* reads
 *  that RLS already gates. Returns null if env missing so callers can
 *  degrade gracefully. */
export function anonClient(): SupabaseClient | null {
  if (!URL || !ANON) return null;
  return createClient(URL, ANON, { auth: { persistSession: false } });
}

/** Service-role client — server-only. ONLY import from /api/* +
 *  webhooks. Bypasses RLS. Returns null if env missing. */
export function serviceClient(): SupabaseClient | null {
  if (!URL || !SERVICE) return null;
  return createClient(URL, SERVICE, { auth: { persistSession: false } });
}

/** Cookie-backed SSR client — reads the signed-in admin's session so RLS
 *  policies keyed on auth.email() apply. Used by /admin routes instead of
 *  the service-role client (this project doesn't ship a service_role key —
 *  admin writes go through authenticated RLS policies + the create_booking
 *  RPC for the one privileged write the public booking flow needs). */
export function ssrClient(cookies: AstroCookies): SupabaseClient | null {
  if (!URL || !ANON) return null;
  return createServerClient(URL, ANON, {
    cookies: {
      get: (name) => cookies.get(name)?.value,
      set: (name, value, options: CookieOptionsWithName) => {
        cookies.set(name, value, { ...options, path: "/" });
      },
      remove: (name, options) => {
        cookies.delete(name, { ...options, path: "/" });
      },
    },
  });
}
