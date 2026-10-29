// Minimal server-only Stripe REST client (Checkout Sessions + webhook signatures).
import crypto from "node:crypto";

const API = "https://api.stripe.com/v1";

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Flattens nested objects into Stripe's form encoding: a[b][0][c]=value. */
function encode(value: unknown, prefix = "", out = new URLSearchParams()) {
  if (value === undefined || value === null) return out;
  if (Array.isArray(value)) value.forEach((item, i) => encode(item, `${prefix}[${i}]`, out));
  else if (typeof value === "object")
    for (const [key, item] of Object.entries(value)) encode(item, prefix ? `${prefix}[${key}]` : key, out);
  else out.append(prefix, String(value));
  return out;
}

async function stripe<T>(method: "GET" | "POST", pathname: string, body?: Record<string, unknown>): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: body ? encode(body).toString() : undefined,
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe ${pathname} failed (${res.status}): ${data?.error?.message ?? "unknown error"}`);
  return data as T;
}

export type CheckoutSession = {
  id: string;
  url: string | null;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  status: "open" | "complete" | "expired";
  amount_total: number | null;
  metadata: Record<string, string>;
  customer_details?: { email?: string | null; name?: string | null; phone?: string | null; address?: StripeAddress | null } | null;
  shipping_details?: { name?: string | null; address?: StripeAddress | null } | null;
  collected_information?: { shipping_details?: { name?: string | null; address?: StripeAddress | null } | null } | null;
};

export type StripeAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

export function createCheckoutSession(params: Record<string, unknown>) {
  return stripe<CheckoutSession>("POST", "/checkout/sessions", params);
}

export function retrieveCheckoutSession(id: string) {
  return stripe<CheckoutSession>("GET", `/checkout/sessions/${encodeURIComponent(id)}`);
}

/** Verifies a Stripe-Signature header (v1 HMAC-SHA256, 5 minute tolerance). */
export function verifyWebhook(payload: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((part) => part.split("=") as [string, string]));
  const signatures = header
    .split(",")
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));
  const timestamp = Number(parts.t);
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return signatures.some(
    (signature) =>
      signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)),
  );
}

// Printify line items ride along in session metadata ("productId:variantId:qty,…"),
// chunked to respect Stripe's 500-character metadata value limit.
export type OrderLine = { productId: string; variantId: number; quantity: number };

export function encodeLines(lines: OrderLine[]) {
  const metadata: Record<string, string> = {};
  let chunk: string[] = [];
  let index = 0;
  for (const line of lines) {
    const entry = `${line.productId}:${line.variantId}:${line.quantity}`;
    if ([...chunk, entry].join(",").length > 500) {
      metadata[`items_${index++}`] = chunk.join(",");
      chunk = [];
    }
    chunk.push(entry);
  }
  if (chunk.length) metadata[`items_${index}`] = chunk.join(",");
  return metadata;
}

export function decodeLines(metadata: Record<string, string>): OrderLine[] {
  return Object.keys(metadata)
    .filter((key) => key.startsWith("items_"))
    .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)))
    .flatMap((key) => metadata[key].split(","))
    .map((entry) => {
      const [productId, variantId, quantity] = entry.split(":");
      return { productId, variantId: Number(variantId), quantity: Number(quantity) };
    });
}
