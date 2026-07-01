import type { APIRoute } from "astro";
import { anonClient } from "../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async () => {
  const SITE = (import.meta.env.PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const sb = anonClient();

  let pages: any[] = [];
  let classes: any[] = [];
  let instructors: any[] = [];
  if (sb) {
    const [{ data: p }, { data: c }, { data: i }] = await Promise.all([
      sb.from("pages").select("slug, title, meta_description").not("published_at", "is", null),
      sb.from("classes").select("slug, name, short_description").not("published_at", "is", null).order("sort_order"),
      sb.from("instructors").select("slug, name, role").not("published_at", "is", null).order("sort_order"),
    ]);
    pages = p ?? [];
    classes = c ?? [];
    instructors = i ?? [];
  }

  const lines: string[] = [];
  lines.push(`# Core & Balance Pilates`);
  lines.push("");
  lines.push(`> A boutique Austin pilates studio offering mat, reformer, prenatal, barre fusion, and private sessions taught by certified instructors, with instant online booking.`);
  lines.push("");
  lines.push("## Key pages");
  lines.push("");
  for (const p of pages) {
    lines.push(`- [${p.title}](${SITE}/${p.slug === "home" ? "" : p.slug}): ${p.meta_description ?? ""}`);
  }
  lines.push(`- [Class schedule](${SITE}/schedule): Live weekly schedule with instant Stripe-powered booking.`);
  lines.push(`- [Instructors](${SITE}/instructors): Certified pilates instructor bios.`);
  lines.push(`- [Book a class](${SITE}/book): Reserve and pay for a class online.`);
  if (classes.length > 0) {
    lines.push("");
    lines.push("## Classes");
    lines.push("");
    for (const c of classes) {
      lines.push(`- [${c.name}](${SITE}/classes/${c.slug}): ${c.short_description ?? ""}`);
    }
  }
  if (instructors.length > 0) {
    lines.push("");
    lines.push("## Instructors");
    lines.push("");
    for (const i of instructors) {
      lines.push(`- [${i.name}](${SITE}/instructors/${i.slug}): ${i.role ?? ""}`);
    }
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
