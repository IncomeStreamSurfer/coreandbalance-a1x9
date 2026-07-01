import type { APIRoute } from "astro";
import { stripe } from "../../../lib/stripe";
import { anonClient } from "../../../lib/supabase";
import { sendBookingConfirmation } from "../../../lib/email";

export const prerender = false;

const WEBHOOK_SECRET = import.meta.env.STRIPE_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET ?? "";

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get("stripe-signature");
  if (!sig) return new Response("no sig", { status: 400 });

  const rawBody = await request.text();
  let event: any;
  try {
    event = await stripe().webhooks.constructEventAsync(rawBody, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    return new Response(`invalid sig: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    const sb = anonClient();
    if (!sb) return new Response("server not configured", { status: 500 });

    const classSessionId = s.metadata?.class_session_id;
    const customerName = s.metadata?.customer_name ?? s.customer_details?.name ?? "Guest";
    const customerPhone = s.metadata?.customer_phone ?? "";
    const spots = parseInt(s.metadata?.spots ?? "1", 10) || 1;
    const email = s.customer_details?.email ?? s.customer_email ?? null;

    if (classSessionId && email) {
      // Atomic, capacity-checked booking insert via RPC (bypasses the need
      // for a service_role key — see create_booking() in the migration).
      const { data: bookingId, error: rpcError } = await sb.rpc("create_booking", {
        p_class_session_id: classSessionId,
        p_customer_name: customerName,
        p_customer_email: email,
        p_customer_phone: customerPhone,
        p_spots: spots,
        p_amount_paid_cents: s.amount_total ?? 0,
        p_currency: (s.currency ?? "usd").toUpperCase(),
        p_stripe_session_id: s.id,
      });

      if (!rpcError && bookingId) {
        const { data: sessionRow } = await sb
          .from("class_sessions")
          .select("start_time, location, class:classes(name), instructor:instructors(name)")
          .eq("id", classSessionId)
          .maybeSingle();

        const cls: any = Array.isArray(sessionRow?.class) ? sessionRow?.class[0] : sessionRow?.class;
        const instructor: any = Array.isArray(sessionRow?.instructor) ? sessionRow?.instructor[0] : sessionRow?.instructor;

        await sendBookingConfirmation({
          to: email,
          className: cls?.name ?? "Pilates class",
          instructorName: instructor?.name ?? "Staff instructor",
          startTime: sessionRow?.start_time
            ? new Date(sessionRow.start_time).toLocaleString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
            : "",
          location: sessionRow?.location ?? "South Congress Studio",
          spots,
          amount: ((s.amount_total ?? 0) / 100).toFixed(2),
          currency: (s.currency ?? "usd").toUpperCase(),
          bookingId: String(bookingId).slice(-10).toUpperCase(),
        }).catch(() => {});
      }
    }
  }

  return new Response("ok", { status: 200 });
};
