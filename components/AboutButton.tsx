"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AboutSheet } from "./AboutSheet";

export function AboutButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button className="about-link" type="button" aria-expanded={open} onClick={() => setOpen(true)}>
        About Indiana State Apparel
      </button>
      {/* Portaled: an animated (transformed) ancestor would otherwise trap the fixed-position sheet. */}
      {mounted && createPortal(<AboutSheet open={open} onOpenChange={setOpen} />, document.body)}
    </>
  );
}
