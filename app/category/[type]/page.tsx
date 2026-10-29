import { notFound, permanentRedirect } from "next/navigation";
import { CATEGORIES } from "@/lib/catalog";

// Legacy category URLs (/category/T-Shirts) now live at /tshirt, /hoodie, …
export default async function LegacyCategoryPage({ params }: { params: Promise<{ type: string }> }) {
  const type = decodeURIComponent((await params).type).toLowerCase();
  const category = CATEGORIES.find((c) => c.name.toLowerCase() === type || c.slug === type);
  if (!category) notFound();
  permanentRedirect(`/${category.slug}`);
}
