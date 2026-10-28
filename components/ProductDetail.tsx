"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/products";
import { useCart } from "./Cart";

export function ProductDetail({ product }: { product: Product }) {
  const singleSize = product.sizes.length === 1;
  const [size, setSize] = useState<string | null>(singleSize ? product.sizes[0] : null);
  const [quantity, setQuantity] = useState(1);
  const [sizeWarning, setSizeWarning] = useState(false);
  const { add, open, count } = useCart();

  const addToBag = () => {
    if (!size) {
      setSizeWarning(true);
      return;
    }
    add(product, size, quantity);
  };

  return (
    <div className="detail-page">
      <nav className="detail-nav">
        <div className="nav-left">
          <Link href="/" className="home-btn" aria-label="Back to home"><ArrowLeft size={16} /> Home</Link>
          <Link href="/" className="nav-brand">Indiana State Apparel</Link>
        </div>
        <button type="button" className="home-btn" onClick={open}><ShoppingBag size={16} /> Bag ({count})</button>
      </nav>

      <main className="detail-layout">
        <div className="detail-media">
          <div className="detail-image">
            <Image src={product.image} alt={product.name} fill sizes="(max-width: 720px) 100vw, 520px" priority />
          </div>
          <span className="badge">New Drop</span>
        </div>

        <div className="detail-info">
          <div>
            <h1>{product.name}</h1>
          </div>
          <div className="price-row">
            <span className="price">${product.price.toFixed(2)}</span>
            <span className="price-note">Tax calculated at checkout</span>
          </div>
          <div className="divider" />
          <div>
            <p className="label">Select size</p>
            <div className="size-grid">
              {product.sizes.map((option) => (
                <button
                  className={`size-btn ${size === option ? "selected" : ""}`}
                  type="button"
                  key={option}
                  aria-pressed={size === option}
                  onClick={() => { setSize(option); setSizeWarning(false); }}
                >
                  {option}
                </button>
              ))}
            </div>
            {sizeWarning && <p className="size-warning" role="alert">Please select a size</p>}
          </div>
          <div>
            <p className="label">Quantity</p>
            <div className="quantity-selector">
              <button className="qty-btn" type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((q) => q - 1)}>−</button>
              <div className="qty-value" aria-live="polite">{quantity}</div>
              <button className="qty-btn" type="button" aria-label="Increase quantity" disabled={quantity >= 10} onClick={() => setQuantity((q) => q + 1)}>+</button>
            </div>
          </div>
          <button className="buy-btn" type="button" onClick={addToBag}>Add to bag</button>
          <div className="trust">
            <span className="trust-item"><ShieldCheck size={16} /> Secure checkout</span>
            <span className="trust-item"><ArrowRight size={16} /> Ships in 3–5 days</span>
          </div>
          <div className="divider" />
          <p className="detail-description">{product.description}</p>
        </div>
      </main>
    </div>
  );
}
