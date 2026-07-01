import type { APIRoute } from "astro";
import { stripe } from "../../lib/stripe";
import { anonClient } from "../../lib/supabase";
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
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }

  // HONEYPOT — fake success so bots don't learn
  if (body.website) {
    return new Response(JSON.stringify({ url: "/" }), { status: 200 });
  }

  // TIMING — reject if submitted implausibly fast or a stale replay
  const age = Date.now() - Number(body.renderedAt ?? 0);
  if (age < 1500 || age > 24 * 60 * 60 * 1000) {
    return new Response(JSON.stringify({ error: "Form expired — please reload and try again" }), { status: 400 });
  }

  const session_id = String(body.session_id ?? "").trim();
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const spots = Math.max(1, Math.min(4, parseInt(body.spots, 10) || 1));

  if (!session_id || !name || !email) {
    return new Response(JSON.stringify({ error: "Please fill in all required fields" }), { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: "Please enter a valid email" }), { status: 400 });
  }

  const sb = anonClient();
  if (!sb) {
    return new Response(JSON.stringify({ error: "Server not configured" }), { status: 500 });
  }

  const { data: session, error } = await sb
    .from("class_sessions")
    .select("id, start_time, capacity, spots_booked, class:classes(name, slug, price_cents, currency, image_url), instructor:instructors(name)")
    .eq("id", session_id)
    .eq("status", "scheduled")
    .maybeSingle();

  if (error || !session) {
    return new Response(JSON.stringify({ error: "That session could not be found" }), { status: 400 });
  }

  const cls: any = Array.isArray(session.class) ? session.class[0] : session.class;
  const instructor: any = Array.isArray(session.instructor) ? session.instructor[0] : session.instructor;

  if (session.spots_booked + spots > session.capacity) {
    return new Response(JSON.stringify({ error: "Not enough spots left in this session" }), { status: 400 });
  }

  const origin = import.meta.env.PUBLIC_SITE_URL
    ?? `${request.headers.get("x-forwarded-proto") ?? "https"}://${request.headers.get("x-forwarded-host") ?? request.headers.get("host")}`;

  const checkoutSession = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [
      {
        quantity: spots,
        price_data: {
          currency: (cls?.currency ?? "usd").toLowerCase(),
          unit_amount: cls?.price_cents ?? 0,
          product_data: {
            name: `${cls?.name ?? "Pilates class"} — ${new Date(session.start_time).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`,
            description: instructor?.name ? `with ${instructor.name}` : undefined,
            images: cls?.image_url ? [cls.image_url] : undefined,
          },
        },
      },
    ],
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel`,
    metadata: {
      class_session_id: session_id,
      customer_name: name,
      customer_phone: phone,
      spots: String(spots),
    },
  });

  return new Response(JSON.stringify({ url: checkoutSession.url }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
