"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { products } from "@/lib/products";
import { AboutSheet } from "./AboutSheet";
import { WeatherControl } from "./WeatherControl";

export function Storefront() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      {/* FORCED INLINE STYLES TO PULL EVERYTHING UP */}
      <main 
        className="store-shell" 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          minHeight: "100vh", 
          justifyContent: "flex-start", 
          paddingTop: "20px" /* Starts near the top */
        }}
      >
        <header className="hero-header" style={{ marginTop: "0px", paddingTop: "0px", marginBottom: "40px" }}>
          <h1 className="brand">INDIANA STATE APPAREL</h1>
          <p className="brandline">Premium Indiana Wear</p>
          <p className="tagline">Tees, hoodies, caps and more — printed fresh, shipped nationwide.</p>
          <div className="about-wrap">
            <button className="about-link" type="button" onClick={() => setAboutOpen((open) => !open)}>About Indiana State Apparel</button>
          </div>
        </header>

        {/* marginTop: auto pushes the products to the bottom, leaving space for the text at the top */}
        <section className="product-grid" aria-label="Product catalog" style={{ marginTop: "auto", paddingTop: "50px" }}>
          {products.map((product, index) => (
            <Link className="product-card" href={`/products/${product.slug}`} key={product.slug} style={{ animationDelay: `${0.3 + index * 0.07}s` }}>
              <Image
                className="product-image"
                src={product.image}
                alt={`${product.name} by Indiana State Apparel`}
                width={800}
                height={800}
                sizes="(max-width: 500px) 100vw, (max-width: 800px) 50vw, 360px"
                priority={index < 3}
              />
              <div className="product-copy">
                <div className="product-name">{product.name}</div>
                <div className="product-price">${product.price.toFixed(2)}</div>
              </div>
            </Link>
          ))}
        </section>
        <footer className="store-footer">Secure checkout · Ships in 3–5 days</footer>
      </main>

      <AboutSheet open={aboutOpen} onOpenChange={setAboutOpen} />
      <WeatherControl />
    </>
  );
}