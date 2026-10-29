import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="state-panel">
      <h1>Checkout canceled</h1>
      <p>No payment was taken. Your bag is saved whenever you&apos;re ready.</p>
      <div className="state-actions">
        <Link href="/" className="home-btn">
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
