import type { APIRoute } from "astro";
import { ssrClient } from "../../../lib/supabase";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const next = String(form.get("next") ?? "/admin");
  if (!email) return redirect("/login?error=missing_email");

  const origin = import.meta.env.PUBLIC_SITE_URL
    ?? `${request.headers.get("x-forwarded-proto") ?? "https"}://${request.headers.get("x-forwarded-host") ?? request.headers.get("host")}`;

  const sb = ssrClient(cookies);
  if (!sb) return redirect("/login?error=auth_not_configured");
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return redirect("/login?error=send_failed");

  return redirect("/login?sent=1&email=" + encodeURIComponent(email));
};
