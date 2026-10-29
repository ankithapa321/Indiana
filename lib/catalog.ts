// Shared, client-safe catalog types and category definitions.
// Server-only Printify access lives in lib/printify.ts.

export const CATEGORIES = [
  {
    slug: "tshirt",
    name: "T-Shirts",
    title: "Premium Indiana Wear T-Shirt",
    tag: "T-shirts",
    keywords: ["t-shirt", "tee"],
  },
  {
    slug: "hoodie",
    name: "Hoodies",
    title: "Premium Indiana Wear Hoodie",
    tag: "Hoodies",
    keywords: ["hoodie"],
  },
  {
    slug: "sweatshirt",
    name: "Sweatshirts",
    title: "Premium Indiana Wear Sweatshirt",
    tag: "Sweatshirts",
    keywords: ["sweatshirt"],
  },
  {
    slug: "tanktop",
    name: "Tank Tops",
    title: "Premium Indiana Wear Tank Top",
    tag: "Tank Tops",
    keywords: ["tank top"],
  },
  {
    slug: "longsleeve",
    name: "Long Sleeves",
    title: "Premium Indiana Wear Long Sleeve Tee",
    tag: "Long Sleeves",
    keywords: ["long sleeve"],
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export type Category = (typeof CATEGORIES)[number];

// Long sleeves are also tagged "T-shirts" and hoodies can mention "sweatshirt", so
// classification checks the most specific categories first.
export const CATEGORY_PRIORITY: CategorySlug[] = ["longsleeve", "tanktop", "hoodie", "sweatshirt", "tshirt"];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((category) => category.slug === slug);
}

export type ColorOption = { id: number; title: string; hex: string | null };
export type SizeOption = { id: number; title: string };

export type Variant = {
  id: number;
  colorId: number | null;
  sizeId: number | null;
  /** Price in cents. */
  price: number;
  available: boolean;
};

export type ProductImage = {
  src: string;
  position: string;
  /** Colors this mockup shows. Empty when the product has no color option. */
  colorIds: number[];
  isDefault: boolean;
};

/** A single Printify product — shown as one "design" option inside its category page. */
export type Design = {
  id: string;
  title: string;
  /** Title up to the first "|", used as the display name. */
  name: string;
  category: CategorySlug;
  description: string[];
  colors: ColorOption[];
  sizes: SizeOption[];
  variants: Variant[];
  images: ProductImage[];
  defaultVariantId: number | null;
  thumb: string;
  minPrice: number;
  maxPrice: number;
};

/** Lightweight version of a design for galleries and cards. */
export type DesignSummary = Pick<Design, "id" | "name" | "thumb" | "minPrice">;

export function summarize(design: Design): DesignSummary {
  return { id: design.id, name: design.name, thumb: design.thumb, minPrice: design.minPrice };
}

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export const MAX_QUANTITY = 10;

/** Transparent cut-out of a Printify mockup, served by /api/cutout. */
export function cutoutSrc(src: string, width: 400 | 800) {
  return `/api/cutout?w=${width}&src=${encodeURIComponent(src)}`;
}

export function cutoutSrcSet(src: string) {
  return `${cutoutSrc(src, 400)} 400w, ${cutoutSrc(src, 800)} 800w`;
}
