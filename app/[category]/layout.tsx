import { notFound } from "next/navigation";
import { getCategory } from "@/lib/catalog";

// Validates the slug here, outside loading.tsx's boundary, so unknown paths get a real 404 status.
export default async function CategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ category: string }>;
}) {
  if (!getCategory((await params).category)) notFound();
  return children;
}
