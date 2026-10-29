"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { CATEGORIES, type CategorySlug } from "@/lib/catalog";
import { AboutButton } from "./AboutButton";
import { useCart } from "./Cart";

export function SiteNav({ current }: { current?: CategorySlug }) {
  const router = useRouter();
  const { count, open } = useCart();

  return (
    <nav className="detail-nav" aria-label="Store">
      <div className="nav-left">
        <Link href="/" className="home-btn" aria-label="Back to home">
          <ArrowLeft size={16} /> Home
        </Link>
        <Link href="/" className="nav-brand">
          Indiana State Apparel
        </Link>
      </div>
      <div className="nav-right">
        <div className="nav-controls">
          <div className="category-nav">
            <select
              className="category-select"
              aria-label="Shop by category"
              value={current ?? ""}
              onChange={(event) => event.target.value && router.push(`/${event.target.value}`)}
            >
              <option value="">Shop by category</option>
              {CATEGORIES.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="home-btn" onClick={open}>
            <ShoppingBag size={16} /> Bag ({count})
          </button>
        </div>
        <AboutButton />
      </div>
    </nav>
  );
}
