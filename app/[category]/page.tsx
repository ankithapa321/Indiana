import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductExperience } from "@/components/ProductExperience";
import { SiteNav } from "@/components/SiteNav";
import { getCategory, summarize } from "@/lib/catalog";
import { getDesign, getDesigns, pickHero } from "@/lib/printify";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ design?: string | string[] }>;
};

// Rendered per request (?design= selects the product); the Printify catalog is cached in memory.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const category = getCategory((await params).category);
  if (!category) return {};
  const designId = (await searchParams).design;
  const design = typeof designId === "string" ? await getDesign(designId).catch(() => undefined) : undefined;
  return {
    title: `${design?.name ?? category.title} — Indiana State Apparel`,
    description: design?.description[0] ?? `Shop ${category.name.toLowerCase()} from Indiana State Apparel.`,
    openGraph: design ? { images: [design.thumb] } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = getCategory((await params).category);
  if (!category) notFound();

  const designs = await getDesigns(category.slug);
  const requested = (await searchParams).design;
  let design = typeof requested === "string" ? designs.find((d) => d.id === requested) : undefined;

  if (typeof requested === "string" && !design) {
    // A design linked under the wrong category is sent to the category it belongs to.
    const elsewhere = await getDesign(requested);
    if (elsewhere) redirect(`/${elsewhere.category}?design=${elsewhere.id}`);
  }
  design ??= pickHero(designs);

  return (
    <div className="detail-page">
      <SiteNav current={category.slug} />
      {design ? (
        <ProductExperience category={category} designs={designs.map(summarize)} design={design} />
      ) : (
        <main className="state-panel">
          <h1>{category.name}</h1>
          <p>No {category.name.toLowerCase()} are available right now. Please check back soon.</p>
        </main>
      )}
    </div>
  );
}
