import type { APIRoute } from "astro";
import { anonClient } from "../lib/supabase";

export const prerender = false;

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export const GET: APIRoute = async () => {
  const sb = anonClient();
  let classes: any[] = [];
  let instructors: any[] = [];
  if (sb) {
    const [{ data: c }, { data: i }] = await Promise.all([
      sb.from("classes").select("name, body_html").not("published_at", "is", null).order("sort_order"),
      sb.from("instructors").select("name, role, bio").not("published_at", "is", null).order("sort_order"),
    ]);
    classes = c ?? [];
    instructors = i ?? [];
  }

  const parts: string[] = [];
  parts.push("# Core & Balance Pilates — Austin\n");
  parts.push("Boutique pilates studio offering mat, reformer, prenatal, barre fusion, and private sessions.\n\n---\n");
  for (const c of classes) {
    parts.push(`# ${c.name}\n\n${stripHtml(c.body_html ?? "")}\n\n---\n`);
  }
  for (const i of instructors) {
    parts.push(`# ${i.name} — ${i.role}\n\n${i.bio ?? ""}\n\n---\n`);
  }

  return new Response(parts.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
