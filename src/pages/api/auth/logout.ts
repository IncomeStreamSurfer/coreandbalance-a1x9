import type { APIRoute } from "astro";
import { ssrClient } from "../../../lib/supabase";

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const sb = ssrClient(cookies);
  if (sb) await sb.auth.signOut();
  return redirect("/");
};
