"use client";

import { useEffect } from "react";
import { useCart } from "./Cart";

/** Empties the bag once a paid checkout is confirmed. */
export function ClearCart() {
  const { clear } = useCart();
  useEffect(() => clear(), [clear]);
  return null;
}
