// Server-only Printify access. PRINTIFY_API_KEY is never exposed to the browser:
// this module is only imported by server components and route handlers.
import fs from "node:fs/promises";
import path from "node:path";
import { CATEGORIES, type CategorySlug, type Design } from "./catalog";
import { warmCutouts } from "./cutout";
import { normalizeProduct, type RawProduct } from "./printify-normalize";

const API = "https://api.printify.com/v1";
const CACHE_TTL_MS = 10 * 60 * 1000;
const SNAPSHOT_PATH = path.join(process.cwd(), "lib", "products-data.json");

export class PrintifyConfigError extends Error {}

function credentials() {
  const token = process.env.PRINTIFY_API_KEY;
  const shopId = process.env.PRINTIFY_SHOP_ID;
  if (!token || !shopId) throw new PrintifyConfigError("PRINTIFY_API_KEY and PRINTIFY_SHOP_ID must be set in .env.local");
  return { token, shopId };
}

async function printifyGet<T>(pathname: string): Promise<T> {
  const { token } = credentials();
  const res = await fetch(`${API}${pathname}`, {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "IndianaStateApparel" },
    // Product pages are ~1MB each, above Next's 2MB-per-entry fetch cache budget once
    // combined, so caching happens in memory below instead.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Printify ${pathname} responded ${res.status}`);
  return res.json() as Promise<T>;
}

type ProductPage = { data: RawProduct[]; last_page: number };

export async function fetchRawProducts(): Promise<RawProduct[]> {
  const { shopId } = credentials();
  const first = await printifyGet<ProductPage>(`/shops/${shopId}/products.json?limit=50&page=1`);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.last_page - 1) }, (_, i) =>
      printifyGet<ProductPage>(`/shops/${shopId}/products.json?limit=50&page=${i + 2}`),
    ),
  );
  return [first, ...rest].flatMap((page) => page.data);
}

export function normalizeAll(raw: RawProduct[]): Design[] {
  const seen = new Set<string>();
  const designs: Design[] = [];
  for (const product of raw) {
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    const design = normalizeProduct(product);
    if (design) designs.push(design);
  }
  return designs;
}

type Catalog = { designs: Design[]; source: "live" | "snapshot"; fetchedAt: number };
let cache: { value: Catalog; expires: number } | null = null;
let inflight: Promise<Catalog> | null = null;

async function loadCatalog(): Promise<Catalog> {
  try {
    const designs = normalizeAll(await fetchRawProducts());
    return { designs, source: "live", fetchedAt: Date.now() };
  } catch (error) {
    // Fall back to the last data synced from the same store (npm run sync), if present.
    try {
      const snapshot = JSON.parse(await fs.readFile(SNAPSHOT_PATH, "utf8")) as { fetchedAt: number; designs: Design[] };
      console.error("[printify] live fetch failed, serving snapshot:", error);
      return { designs: snapshot.designs, source: "snapshot", fetchedAt: snapshot.fetchedAt };
    } catch {
      throw error;
    }
  }
}

export async function getCatalog(): Promise<Catalog> {
  if (cache && cache.expires > Date.now()) return cache.value;
  inflight ??= loadCatalog()
    .then((value) => {
      // A snapshot fallback is retried sooner than live data.
      cache = { value, expires: Date.now() + (value.source === "live" ? CACHE_TTL_MS : 60_000) };
      // Cut-outs are only used by the homepage category cards.
      const heroes = CATEGORIES.map((c) => pickHero(value.designs.filter((d) => d.category === c.slug)));
      warmCutouts(heroes.flatMap((design) => (design ? [design.thumb] : [])));
      return value;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export async function getDesigns(category?: CategorySlug): Promise<Design[]> {
  const { designs } = await getCatalog();
  return category ? designs.filter((design) => design.category === category) : designs;
}

export async function getDesign(id: string): Promise<Design | undefined> {
  return (await getDesigns()).find((design) => design.id === id);
}

/** Fetches one product straight from Printify, bypassing the cache (used to price checkouts). */
export async function fetchDesignLive(id: string): Promise<Design | null> {
  const { shopId } = credentials();
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  return normalizeProduct(await printifyGet<RawProduct>(`/shops/${shopId}/products/${id}.json`));
}

/** The design shown first in a category: the Indiana State Apparel brand design when there is one. */
export function pickHero(designs: Design[]): Design | undefined {
  return designs.find((design) => BRAND_DESIGN.test(design.name)) ?? designs[0];
}

const BRAND_DESIGN = /indiana state apparel/i;

export async function createPrintifyOrder(order: unknown): Promise<{ id: string }> {
  const { token, shopId } = credentials();
  const res = await fetch(`${API}/shops/${shopId}/orders.json`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "IndianaStateApparel" },
    body: JSON.stringify(order),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Printify order creation failed (${res.status}): ${await res.text()}`);
  return res.json() as Promise<{ id: string }>;
}

export async function sendOrderToProduction(orderId: string) {
  const { token, shopId } = credentials();
  const res = await fetch(`${API}/shops/${shopId}/orders/${orderId}/send_to_production.json`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "IndianaStateApparel" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Printify send_to_production failed (${res.status}): ${await res.text()}`);
}
