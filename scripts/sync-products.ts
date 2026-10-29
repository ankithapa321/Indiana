// Saves a snapshot of the configured Printify store to lib/products-data.json.
// The site reads Printify live; this snapshot is only served if the live API is unreachable.
// Run with: npm run sync
import fs from "node:fs";
import path from "node:path";
import { normalizeProduct, type RawProduct } from "../lib/printify-normalize.ts";

process.loadEnvFile(".env.local");
const token = process.env.PRINTIFY_API_KEY;
const shopId = process.env.PRINTIFY_SHOP_ID;
if (!token || !shopId) {
  console.error("Missing PRINTIFY_API_KEY or PRINTIFY_SHOP_ID in .env.local");
  process.exit(1);
}

const raw: RawProduct[] = [];
let page = 1;
let lastPage = 1;
do {
  const res = await fetch(`https://api.printify.com/v1/shops/${shopId}/products.json?limit=50&page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.error(`Printify responded ${res.status} on page ${page}`);
    process.exit(1);
  }
  const data = (await res.json()) as { data: RawProduct[]; last_page: number };
  raw.push(...data.data);
  lastPage = data.last_page;
  page++;
} while (page <= lastPage);

const ids = new Set<string>();
const unique = raw.filter((product) => !ids.has(product.id) && ids.add(product.id));
const designs = unique.map(normalizeProduct);
const skipped = unique.filter((_, i) => !designs[i]).map((product) => product.title);
const kept = designs.filter((design) => design !== null);

const counts: Record<string, number> = {};
for (const design of kept) counts[design.category] = (counts[design.category] ?? 0) + 1;

const file = path.join(process.cwd(), "lib", "products-data.json");
fs.writeFileSync(file, JSON.stringify({ shopId, fetchedAt: Date.now(), designs: kept }));
console.log(`Fetched ${raw.length} products from shop ${shopId}; saved ${kept.length} to ${file}`);
console.log("Per category:", counts);
if (skipped.length) console.log("Skipped (hidden, uncategorized or no enabled variants):", skipped);
