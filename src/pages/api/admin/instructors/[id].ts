import type { APIRoute } from "astro";
import { ssrClient } from "../../../../lib/supabase";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, params, redirect }) => {
  const sb = ssrClient(cookies);
  if (!sb) return new Response("unconfigured", { status: 500 });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response("unauth", { status: 401 });
  const { data: admin } = await sb.from("admins").select("email").eq("email", user.email ?? "").maybeSingle();
  if (!admin) return new Response("forbidden", { status: 403 });

  const form = await request.formData();
  const patch = {
    name: String(form.get("name") ?? ""),
    role: String(form.get("role") ?? "") || null,
    bio: String(form.get("bio") ?? "") || null,
    published_at: form.get("published") ? new Date().toISOString() : null,
  };

  const { error } = await sb.from("instructors").update(patch).eq("id", params.id);
  if (error) return new Response(error.message, { status: 500 });
  return redirect("/admin/instructors");
};
