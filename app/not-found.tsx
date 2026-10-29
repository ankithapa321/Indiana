import Link from "next/link";

export default function NotFound() {
  return (
    <main className="state-panel">
      <h1>Page not found</h1>
      <p>That page doesn&apos;t exist. Browse our collection instead.</p>
      <div className="state-actions">
        <Link href="/" className="home-btn">
          Back to home
        </Link>
      </div>
    </main>
  );
}
