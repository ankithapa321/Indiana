// Stripe → Printify fulfillment. On a paid checkout, creates the matching Printify order.
// Orders are created on hold in Printify unless PRINTIFY_SEND_TO_PRODUCTION=true.
import { NextResponse, type NextRequest } from "next/server";
import { createPrintifyOrder, sendOrderToProduction } from "@/lib/printify";
import { decodeLines, verifyWebhook, type CheckoutSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not set" }, { status: 503 });

  const payload = await req.text();
  if (!verifyWebhook(payload, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(payload) as { type: string; data: { object: CheckoutSession } };
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return NextResponse.json({ received: true });
  }
  const session = event.data.object;
  if (session.payment_status !== "paid") return NextResponse.json({ received: true });

  const lines = decodeLines(session.metadata ?? {});
  const shipping = session.collected_information?.shipping_details ?? session.shipping_details;
  const address = shipping?.address ?? session.customer_details?.address;
  if (!lines.length || !address) {
    console.error("[webhook] session missing line items or address", session.id);
    return NextResponse.json({ error: "Session missing order data" }, { status: 422 });
  }

  const [firstName, ...rest] = (shipping?.name ?? session.customer_details?.name ?? "Customer").trim().split(/\s+/);
  try {
    const order = await createPrintifyOrder({
      external_id: session.id,
      label: `Stripe ${session.id.slice(-8)}`,
      line_items: lines.map((line) => ({ product_id: line.productId, variant_id: line.variantId, quantity: line.quantity })),
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: {
        first_name: firstName,
        last_name: rest.join(" ") || firstName,
        email: session.customer_details?.email ?? undefined,
        phone: session.customer_details?.phone ?? undefined,
        country: address.country,
        region: address.state ?? "",
        address1: address.line1,
        address2: address.line2 ?? "",
        city: address.city,
        zip: address.postal_code,
      },
    });
    if (process.env.PRINTIFY_SEND_TO_PRODUCTION === "true") await sendOrderToProduction(order.id);
    console.log(`[webhook] Printify order ${order.id} created for ${session.id}`);
    return NextResponse.json({ received: true, printifyOrderId: order.id });
  } catch (error) {
    // A non-2xx makes Stripe retry the event later.
    console.error("[webhook] Printify order failed:", error);
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
  }
}
