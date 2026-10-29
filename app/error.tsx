"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="state-panel">
      <h1>Something went wrong</h1>
      <p>We couldn&apos;t load our products right now. Please try again in a moment.</p>
      <div className="state-actions">
        <button type="button" className="home-btn" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="home-btn">
          Back to home
        </Link>
      </div>
    </main>
  );
}
