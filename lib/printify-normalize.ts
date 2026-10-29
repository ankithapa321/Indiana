// Pure transformation from raw Printify API products to the storefront's Design shape.
// No path aliases or Next imports here: scripts/sync-products.ts runs this file directly with Node.
import { CATEGORIES, CATEGORY_PRIORITY } from "./catalog.ts";
import type { CategorySlug, ColorOption, Design, ProductImage, SizeOption, Variant } from "./catalog.ts";

type RawOptionValue = { id: number; title: string; colors?: string[] };
type RawOption = { name: string; type: string; values: RawOptionValue[] };
type RawVariant = {
  id: number;
  price: number;
  title: string;
  options: number[];
  is_enabled: boolean;
  is_default: boolean;
  is_available: boolean;
};
type RawImage = {
  src: string;
  variant_ids: number[];
  position: string;
  is_default: boolean;
  is_selected_for_publishing?: boolean;
};
export type RawProduct = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: RawOption[];
  variants: RawVariant[];
  images: RawImage[];
  visible: boolean;
  is_deleted?: boolean;
  blueprint_id: number;
};

const POSITION_ORDER = ["front", "back", "other"];

export function classify(product: Pick<RawProduct, "tags" | "title">): CategorySlug | null {
  const tags = new Set(product.tags.map((tag) => tag.toLowerCase()));
  for (const slug of CATEGORY_PRIORITY) {
    const category = CATEGORIES.find((c) => c.slug === slug)!;
    if (tags.has(category.tag.toLowerCase())) return slug;
  }
  // Fallback for products without category tags: match the product type named in the title.
  const title = product.title.toLowerCase();
  for (const slug of CATEGORY_PRIORITY) {
    const category = CATEGORIES.find((c) => c.slug === slug)!;
    if (category.keywords.some((keyword) => title.includes(keyword))) return slug;
  }
  return null;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(text: string) {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const value = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** Printify descriptions are HTML; the storefront renders them as plain paragraphs. */
export function htmlToParagraphs(html: string): string[] {
  const text = html
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|div|h[1-6]|li|ul|ol|tr)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(text)
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function normalizeProduct(product: RawProduct): Design | null {
  if (product.is_deleted || !product.visible) return null;
  const category = classify(product);
  if (!category) return null;

  const colorOption = product.options.find((option) => option.type === "color");
  const sizeOption = product.options.find((option) => option.type === "size");
  const colorIds = new Set(colorOption?.values.map((value) => value.id));
  const sizeIds = new Set(sizeOption?.values.map((value) => value.id));

  const variants: Variant[] = product.variants
    .filter((variant) => variant.is_enabled)
    .map((variant) => ({
      id: variant.id,
      colorId: variant.options.find((id) => colorIds.has(id)) ?? null,
      sizeId: variant.options.find((id) => sizeIds.has(id)) ?? null,
      price: variant.price,
      available: variant.is_available,
    }));
  if (!variants.length) return null;

  // Only offer option values that at least one enabled variant uses, in Printify's order.
  const usedColors = new Set(variants.map((variant) => variant.colorId));
  const usedSizes = new Set(variants.map((variant) => variant.sizeId));
  const colors: ColorOption[] = (colorOption?.values ?? [])
    .filter((value) => usedColors.has(value.id))
    .map((value) => ({ id: value.id, title: value.title, hex: value.colors?.[0] ?? null }));
  const sizes: SizeOption[] = (sizeOption?.values ?? [])
    .filter((value) => usedSizes.has(value.id))
    .map((value) => ({ id: value.id, title: value.title }));

  const colorOfVariant = new Map(variants.map((variant) => [variant.id, variant.colorId]));
  const images: ProductImage[] = product.images
    .filter((image) => image.is_selected_for_publishing !== false)
    .map((image) => ({
      src: image.src,
      position: image.position,
      colorIds: [...new Set(image.variant_ids.map((id) => colorOfVariant.get(id)).filter((id): id is number => id != null))],
      isDefault: image.is_default,
    }))
    // Mockups for disabled variants only would never be shown.
    .filter((image) => !colors.length || image.colorIds.length > 0)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || rank(a.position) - rank(b.position));
  if (!images.length) return null;

  const defaultVariant =
    variants.find((variant) => variant.available && product.variants.some((raw) => raw.id === variant.id && raw.is_default)) ??
    variants.find((variant) => variant.available) ??
    variants[0];
  const prices = variants.map((variant) => variant.price);

  return {
    id: product.id,
    title: product.title.trim(),
    name: product.title.split("|")[0].trim(),
    category,
    description: htmlToParagraphs(product.description ?? ""),
    colors,
    sizes,
    variants,
    images,
    defaultVariantId: defaultVariant.id,
    thumb: images[0].src,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
  };
}

function rank(position: string) {
  const index = POSITION_ORDER.indexOf(position);
  return index === -1 ? POSITION_ORDER.length : index;
}
