import type { AstroGlobal } from "astro";
import { ssrClient } from "./supabase";

export async function requireAdmin(Astro: AstroGlobal) {
  if (!Astro.locals.user) {
    return Astro.redirect("/login?next=" + encodeURIComponent(Astro.url.pathname));
  }
  const sb = ssrClient(Astro.cookies);
  if (!sb) {
    return new Response("Server not configured", { status: 500 });
  }
  const { data } = await sb.from("admins").select("email").eq("email", Astro.locals.user.email ?? "").maybeSingle();
  if (!data) {
    return new Response("Forbidden — this account is not on the studio admin list.", { status: 403 });
  }
  return null;
}
