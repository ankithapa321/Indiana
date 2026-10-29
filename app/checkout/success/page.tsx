import Link from "next/link";
import { ClearCart } from "@/components/ClearCart";
import { formatPrice } from "@/lib/catalog";
import { retrieveCheckoutSession, stripeConfigured, type CheckoutSession } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const sessionId = (await searchParams).session_id;
  let session: CheckoutSession | null = null;
  if (sessionId && stripeConfigured()) {
    session = await retrieveCheckoutSession(sessionId).catch(() => null);
  }
  const paid = session?.payment_status === "paid";

  return (
    <main className="state-panel">
      {paid ? (
        <>
          <ClearCart />
          <h1>Thank you!</h1>
          <p>
            Your order is confirmed
            {session?.amount_total != null ? ` — ${formatPrice(session.amount_total)} paid` : ""}.
            {session?.customer_details?.email ? ` A receipt is on its way to ${session.customer_details.email}.` : ""}
          </p>
          <p>Each piece is printed to order and ships in 3–5 days.</p>
        </>
      ) : (
        <>
          <h1>Payment not confirmed</h1>
          <p>We couldn&apos;t confirm a completed payment for this checkout. Your bag has been kept.</p>
        </>
      )}
      <div className="state-actions">
        <Link href="/" className="home-btn">
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
