"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { formatPrice, getCategory, MAX_QUANTITY, type CategorySlug } from "@/lib/catalog";

export type CartItem = {
  productId: string;
  variantId: number;
  category: CategorySlug;
  name: string;
  color: string | null;
  size: string | null;
  image: string;
  /** Unit price in cents, as shown when added. Checkout re-prices from Printify. */
  unitPrice: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  add: (item: CartItem) => void;
  open: () => void;
  clear: () => void;
};

const STORAGE_KEY = "isa_cart";
const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(value: unknown): value is CartItem {
  const item = value as CartItem;
  return (
    !!item &&
    typeof item.productId === "string" &&
    Number.isInteger(item.variantId) &&
    !!getCategory(item.category) &&
    typeof item.name === "string" &&
    typeof item.image === "string" &&
    Number.isInteger(item.unitPrice) &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );
}

/** Starts a Stripe checkout for the given lines. Resolves with an error message on failure. */
export async function startCheckout(lines: Pick<CartItem, "productId" | "variantId" | "quantity">[]) {
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: lines.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })) }),
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (res.ok && data.url) {
      window.location.assign(data.url);
      return null;
    }
    return data.error ?? "Checkout could not be started. Please try again.";
  } catch {
    return "Network error — please check your connection and try again.";
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      // Bags saved by the old static catalog have no Printify variant and are dropped.
      if (Array.isArray(saved)) setItems(saved.filter(isCartItem));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return; // don't overwrite the saved bag with the empty initial state
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const add = useCallback((item: CartItem) => {
    setItems((current) => {
      const existing = current.find((line) => line.variantId === item.variantId && line.productId === item.productId);
      if (!existing) return [...current, { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity) }];
      return current.map((line) =>
        line === existing ? { ...line, ...item, quantity: Math.min(MAX_QUANTITY, line.quantity + item.quantity) } : line,
      );
    });
    setError(null);
    setDrawerOpen(true);
  }, []);
  const clear = useCallback(() => {
    // Also clear storage directly: a child's effect can run before the bag is loaded from it.
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setItems([]);
  }, []);
  const change = (variantId: number, amount: number) => {
    setError(null);
    setItems((current) =>
      current
        .map((line) =>
          line.variantId === variantId ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + amount) } : line,
        )
        .filter((line) => line.quantity > 0),
    );
  };

  const checkout = async () => {
    setCheckingOut(true);
    setError(null);
    const message = await startCheckout(items);
    if (message) {
      setError(message);
      setCheckingOut(false);
    }
  };

  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const value = useMemo(
    () => ({ items, count, add, clear, open: () => setDrawerOpen(true) }),
    [items, count, add, clear],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      {count > 0 && (
        <button className="cart-fab" type="button" aria-label={`Open bag (${count} items)`} onClick={() => setDrawerOpen(true)}>
          <ShoppingBag size={19} />
          <span>{count}</span>
        </button>
      )}
      <button
        aria-label="Close bag"
        className={`cart-backdrop ${drawerOpen ? "open" : ""}`}
        tabIndex={drawerOpen ? 0 : -1}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={`cart-drawer ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen} aria-label="Your bag" inert={!drawerOpen}>
        <div className="cart-header">
          <h2>Your bag</h2>
          <button type="button" aria-label="Close bag" onClick={() => setDrawerOpen(false)}>
            <X />
          </button>
        </div>
        <div className="cart-items">
          {!items.length && (
            <div className="cart-empty">
              <p>Your bag is empty.</p>
              <Link href="/" onClick={() => setDrawerOpen(false)}>
                Browse the collection
              </Link>
            </div>
          )}
          {items.map((item) => (
            <article className="cart-item" key={item.variantId}>
              <Link href={`/${item.category}?design=${item.productId}`} onClick={() => setDrawerOpen(false)}>
                <Image src={item.image} alt={item.name} width={100} height={100} sizes="100px" />
              </Link>
              <div>
                <b>{item.name}</b>
                <small>
                  {getCategory(item.category)?.name}
                  {[item.color, item.size].filter(Boolean).length ? ` · ${[item.color, item.size].filter(Boolean).join(" / ")}` : ""}
                </small>
                <span>
                  {formatPrice(item.unitPrice * item.quantity)}
                  {item.quantity > 1 && <small> ({formatPrice(item.unitPrice)} each)</small>}
                </span>
                <div className="quantity-control">
                  <button type="button" aria-label="Decrease quantity" onClick={() => change(item.variantId, -1)}>
                    <Minus />
                  </button>
                  <span aria-live="polite">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={item.quantity >= MAX_QUANTITY}
                    onClick={() => change(item.variantId, 1)}
                  >
                    <Plus />
                  </button>
                  <button type="button" aria-label="Remove item" onClick={() => change(item.variantId, -item.quantity)}>
                    <Trash2 />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {items.length > 0 && (
          <div className="cart-total">
            <span>Subtotal</span>
            <strong>{formatPrice(subtotal)}</strong>
            <button type="button" onClick={checkout} disabled={checkingOut}>
              {checkingOut ? (
                <>
                  <span className="spinner" /> Redirecting to checkout…
                </>
              ) : (
                "Checkout"
              )}
            </button>
            {error && (
              <p className="checkout-error" role="alert">
                {error}
              </p>
            )}
            <small>Shipping details are collected on the secure Stripe checkout page.</small>
          </div>
        )}
      </aside>
    </CartContext.Provider>
  );
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside CartProvider");
  return cart;
}
