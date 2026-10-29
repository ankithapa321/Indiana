import { NextResponse, type NextRequest } from "next/server";
import { getCategory, MAX_QUANTITY } from "@/lib/catalog";
import { fetchDesignLive } from "@/lib/printify";
import { createCheckoutSession, encodeLines, stripeConfigured, type OrderLine } from "@/lib/stripe";

type RequestLine = { productId?: unknown; variantId?: unknown; quantity?: unknown };

export async function POST(req: NextRequest) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "Checkout isn't available yet — payments haven't been configured for this store." },
      { status: 503 },
    );
  }

  let body: { items?: RequestLine[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const lines: OrderLine[] = [];
  for (const item of body.items ?? []) {
    const quantity = Number(item.quantity);
    if (typeof item.productId !== "string" || !Number.isInteger(Number(item.variantId)) || !Number.isInteger(quantity)) {
      return NextResponse.json({ error: "Invalid item in bag." }, { status: 400 });
    }
    if (quantity < 1 || quantity > MAX_QUANTITY) {
      return NextResponse.json({ error: `Quantity must be between 1 and ${MAX_QUANTITY}.` }, { status: 400 });
    }
    const existing = lines.find((line) => line.variantId === Number(item.variantId) && line.productId === item.productId);
    if (existing) existing.quantity = Math.min(MAX_QUANTITY, existing.quantity + quantity);
    else lines.push({ productId: item.productId, variantId: Number(item.variantId), quantity });
  }
  if (!lines.length) return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });

  // Price and availability always come from Printify, never from the browser.
  const designs = new Map<string, Awaited<ReturnType<typeof fetchDesignLive>>>();
  try {
    await Promise.all(
      [...new Set(lines.map((line) => line.productId))].map(async (id) => designs.set(id, await fetchDesignLive(id))),
    );
  } catch (error) {
    console.error("[checkout] Printify lookup failed:", error);
    return NextResponse.json({ error: "We couldn't confirm product availability. Please try again." }, { status: 502 });
  }

  const lineItems = [];
  for (const line of lines) {
    const design = designs.get(line.productId);
    const variant = design?.variants.find((v) => v.id === line.variantId);
    if (!design || !variant) {
      return NextResponse.json({ error: "An item in your bag is no longer sold. Please remove it." }, { status: 409 });
    }
    if (!variant.available) {
      return NextResponse.json({ error: `${design.name} is out of stock in that option. Please remove it.` }, { status: 409 });
    }
    const color = design.colors.find((c) => c.id === variant.colorId)?.title;
    const size = design.sizes.find((s) => s.id === variant.sizeId)?.title;
    const image = design.images.find((img) => variant.colorId == null || img.colorIds.includes(variant.colorId))?.src;
    lineItems.push({
      quantity: line.quantity,
      price_data: {
        currency: "usd",
        unit_amount: variant.price,
        product_data: {
          name: `${design.name} — ${getCategory(design.category)?.name ?? ""}`.replace(/ — $/, ""),
          description: [color, size].filter(Boolean).join(" / ") || undefined,
          images: image ? [image] : undefined,
          metadata: { printify_product_id: design.id, printify_variant_id: String(variant.id) },
        },
      },
    });
  }

  const origin = req.nextUrl.origin;
  const countries = (process.env.STRIPE_SHIPPING_COUNTRIES ?? "US")
    .split(",")
    .map((country) => country.trim().toUpperCase())
    .filter(Boolean);

  try {
    const session = await createCheckoutSession({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      shipping_address_collection: { allowed_countries: countries },
      phone_number_collection: { enabled: true },
      metadata: encodeLines(lines),
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[checkout] Stripe session failed:", error);
    return NextResponse.json({ error: "Checkout could not be started. Please try again." }, { status: 502 });
  }
}
