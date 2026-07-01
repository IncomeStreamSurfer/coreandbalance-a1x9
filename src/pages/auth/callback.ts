import type { APIRoute } from "astro";
import { ssrClient } from "../../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/admin";
  if (!code) return redirect("/login?error=missing_code");
  const sb = ssrClient(cookies);
  if (!sb) return redirect("/login?error=auth_not_configured");
  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (error) return redirect("/login?error=exchange_failed");
  return redirect(next);
};
