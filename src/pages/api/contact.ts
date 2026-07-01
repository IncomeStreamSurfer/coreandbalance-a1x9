import type { APIRoute } from "astro";
import { anonClient } from "../../lib/supabase";
import { sendContactAck } from "../../lib/email";
import { hitOrReject } from "../../lib/rate-limit";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const ip = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const rl = hitOrReject(ip);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSec), "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  if (body.website) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const age = Date.now() - Number(body.renderedAt ?? 0);
  if (age < 3000 || age > 24 * 60 * 60 * 1000) {
    return new Response(JSON.stringify({ error: "Form expired — please reload" }), { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const message = String(body.message ?? "").trim();
  if (!name || !email || !message || message.length < 10) {
    return new Response(JSON.stringify({ error: "Please fill all fields" }), { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400 });
  }

  const sb = anonClient();
  if (!sb) {
    return new Response(JSON.stringify({ error: "Server not configured" }), { status: 500 });
  }
  await sb.from("contact_messages").insert({ name, email, message, source_ip: ip });

  await sendContactAck({ to: email, name }).catch(() => {});

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
