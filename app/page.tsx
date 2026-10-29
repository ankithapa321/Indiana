import Link from "next/link";
import { AboutButton } from "@/components/AboutButton";
import { CATEGORIES, cutoutSrc, cutoutSrcSet, formatPrice } from "@/lib/catalog";
import { getDesigns, pickHero } from "@/lib/printify";

// Rendered per request; lib/printify.ts caches the Printify catalog in memory for 10 minutes.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const designs = await getDesigns();
  const cards = CATEGORIES.map((category) => {
    const inCategory = designs.filter((design) => design.category === category.slug);
    const prices = inCategory.map((design) => design.minPrice);
    return {
      category,
      hero: pickHero(inCategory),
      minPrice: prices.length ? Math.min(...prices) : null,
      varies: new Set(inCategory.flatMap((design) => [design.minPrice, design.maxPrice])).size > 1,
    };
  });

  return (
    <main className="store-shell">
      <header className="hero-header">
        <h1 className="brand">INDIANA STATE APPAREL</h1>
        <p className="brandline">Premium Indiana Wear</p>
        <p className="tagline">Tees, hoodies, sweatshirts and more — printed fresh, shipped nationwide.</p>
        <div className="about-wrap">
          <AboutButton />
        </div>
      </header>

      <section className="product-grid" aria-label="Shop by category">
        {cards.map(({ category, hero, minPrice, varies }, index) => (
          <Link
            className="product-card"
            href={`/${category.slug}`}
            key={category.slug}
            style={{ animationDelay: `${0.3 + index * 0.07}s` }}
          >
            {hero ? (
              <img
                className="product-image"
                src={cutoutSrc(hero.thumb, 800)}
                srcSet={cutoutSrcSet(hero.thumb)}
                sizes="(max-width: 500px) 90vw, (max-width: 800px) 45vw, 340px"
                alt={`${category.title} — ${hero.name}`}
                width={400}
                height={400}
                loading={index < 3 ? "eager" : "lazy"}
              />
            ) : (
              <div className="product-image empty">Coming soon</div>
            )}
            <div className="product-copy">
              <div className="product-name">{category.title}</div>
              <div className="product-price">
                {minPrice == null ? "Coming soon" : `${varies ? "From " : ""}${formatPrice(minPrice)}`}
              </div>
            </div>
          </Link>
        ))}
      </section>

      <footer className="store-footer">Secure Stripe checkout · Ships in 3–5 days</footer>
    </main>
  );
}
