import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function stripe(): Stripe {
  if (_stripe) return _stripe;
  const key = import.meta.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY ?? "";
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  _stripe = new Stripe(key, { apiVersion: "2024-06-20" as any });
  return _stripe;
}
