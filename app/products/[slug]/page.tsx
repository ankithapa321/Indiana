import { notFound, permanentRedirect } from "next/navigation";
import { getDesign } from "@/lib/printify";

// Legacy product URLs (/products/<printify id>) now open the design on its category page.
export default async function LegacyProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const design = await getDesign((await params).slug);
  if (!design) notFound();
  permanentRedirect(`/${design.category}?design=${design.id}`);
}
