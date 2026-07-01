import { defineMiddleware } from "astro:middleware";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";

const URL = import.meta.env.PUBLIC_SUPABASE_URL ?? process.env.PUBLIC_SUPABASE_URL ?? "";
const ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? process.env.PUBLIC_SUPABASE_ANON_KEY ?? "";

export const onRequest = defineMiddleware(async (ctx, next) => {
  // GUARD: if Supabase env vars aren't set yet, skip auth resolution rather
  // than throwing "supabaseUrl is required" on every request.
  if (URL && ANON) {
    try {
      const sb = createServerClient(URL, ANON, {
        cookies: {
          get: (name) => ctx.cookies.get(name)?.value,
          set: (name, value, options: CookieOptionsWithName) => ctx.cookies.set(name, value, { ...options, path: "/" }),
          remove: (name, options) => ctx.cookies.delete(name, { ...options, path: "/" }),
        },
      });
      const { data } = await sb.auth.getUser();
      ctx.locals.user = data.user ?? null;
    } catch {
      ctx.locals.user = null;
    }
  } else {
    ctx.locals.user = null;
  }

  const response = await next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return response;
});
