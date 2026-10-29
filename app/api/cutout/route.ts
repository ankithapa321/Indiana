import { NextResponse, type NextRequest } from "next/server";
import { CUTOUT_WIDTHS, getCutout, isPrintifyMockup } from "@/lib/cutout";

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src") ?? "";
  const width = Number(req.nextUrl.searchParams.get("w"));
  if (!isPrintifyMockup(src) || !CUTOUT_WIDTHS.includes(width as (typeof CUTOUT_WIDTHS)[number])) {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }

  try {
    const image = await getCutout(src, width as (typeof CUTOUT_WIDTHS)[number]);
    // Not a clean studio shot: show the original mockup instead.
    if (!image) return NextResponse.redirect(src, { headers: { "Cache-Control": "public, max-age=86400" } });
    return new NextResponse(new Uint8Array(image), {
      headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch (error) {
    console.error("[cutout]", error);
    return NextResponse.redirect(src);
  }
}
