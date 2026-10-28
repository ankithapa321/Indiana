"use client";

import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/products";

type CartItem = Product & { size: string; quantity: number };
type CartContextValue = { items: CartItem[]; count: number; add: (product: Product, size: string, quantity?: number) => void; open: () => void };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("isa_cart") ?? "[]");
      if (Array.isArray(saved)) setItems(saved);
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return; // don't overwrite the saved bag with the empty initial state
    try { localStorage.setItem("isa_cart", JSON.stringify(items)); } catch {}
  }, [items, loaded]);

  const add = useCallback((product: Product, size: string, quantity = 1) => {
    setItems((current) => {
      const index = current.findIndex((item) => item.slug === product.slug && item.size === size);
      if (index >= 0) return current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: item.quantity + quantity } : item);
      return [...current, { ...product, size, quantity }];
    });
    setDrawerOpen(true);
  }, []);
  const change = (index: number, amount: number) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0));
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const value = useMemo(() => ({ items, count: quantity, add, open: () => setDrawerOpen(true) }), [items, quantity, add]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {quantity > 0 && <button className="cart-fab" type="button" onClick={() => setDrawerOpen(true)}><ShoppingBag size={19} /><span>{quantity}</span></button>}
      <button aria-label="Close cart" className={`cart-backdrop ${drawerOpen ? "open" : ""}`} tabIndex={drawerOpen ? 0 : -1} onClick={() => setDrawerOpen(false)} />
      <aside className={`cart-drawer ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen} inert={!drawerOpen}>
        <div className="cart-header"><h2>Your bag</h2><button type="button" aria-label="Close cart" onClick={() => setDrawerOpen(false)}><X /></button></div>
        <div className="cart-items">
          {!items.length && <p>Your bag is empty.</p>}
          {items.map((item, index) => (
            <article className="cart-item" key={`${item.slug}-${item.size}`}>
              <Image src={item.image} alt="" width={90} height={90} />
              <div><b>{item.name}</b><small>Size {item.size}</small><span>${(item.price * item.quantity).toFixed(2)}</span>
                <div className="quantity-control">
                  <button type="button" aria-label="Decrease quantity" onClick={() => change(index, -1)}><Minus /></button>{item.quantity}
                  <button type="button" aria-label="Increase quantity" onClick={() => change(index, 1)}><Plus /></button>
                  <button type="button" aria-label="Remove item" onClick={() => change(index, -item.quantity)}><Trash2 /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="cart-total"><span>Total</span><strong>${total.toFixed(2)}</strong><button type="button" onClick={() => alert("Checkout integration is ready for a payment provider.")}>Continue to secure checkout</button><small>Payment is not collected in this demo.</small></div>
      </aside>
    </CartContext.Provider>
  );
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside CartProvider");
  return cart;
}
