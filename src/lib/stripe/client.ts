import Stripe from "stripe";

let cached: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env and restart the dev server.",
    );
  }

  if (!cached) {
    cached = new Stripe(secretKey);
  }

  return cached;
}
