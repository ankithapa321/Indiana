// Server-only: turns a Printify mockup (garment on a flat studio background) into a transparent
// WebP, like the hand-made cut-outs on the reference site. Results are cached on disk.
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const CACHE_DIR = path.join(process.cwd(), ".next", "cache", "cutouts");
/** Max per-channel distance from the background color still treated as background.
 *  Kept tight: anything looser leaks into white garments. */
const TOLERANCE = 10;
const inflight = new Map<string, Promise<boolean>>();

export const CUTOUT_WIDTHS = [400, 800] as const;
type Width = (typeof CUTOUT_WIDTHS)[number];

export function isPrintifyMockup(src: string) {
  return /^https:\/\/images-api\.printify\.com\/mockup\//.test(src);
}

const keyOf = (src: string) => crypto.createHash("sha1").update(src).digest("hex");
const fileOf = (key: string, width: Width | "none") => path.join(CACHE_DIR, `${key}.${width}.${width === "none" ? "txt" : "webp"}`);

/** Returns the transparent WebP, or null when the mockup isn't a clean studio shot. */
export async function getCutout(src: string, width: Width): Promise<Buffer | null> {
  const key = keyOf(src);
  try {
    return await fs.readFile(fileOf(key, width));
  } catch {}
  return (await ensure(key, src)) ? fs.readFile(fileOf(key, width)) : null;
}

/** Processes a mockup once (both widths), deduplicating concurrent requests. */
function ensure(key: string, src: string): Promise<boolean> {
  let job = inflight.get(key);
  if (!job) {
    job = generate(key, src).finally(() => inflight.delete(key));
    inflight.set(key, job);
  }
  return job;
}

async function generate(key: string, src: string) {
  try {
    await fs.access(fileOf(key, 800));
    return true;
  } catch {}
  try {
    await fs.access(fileOf(key, "none"));
    return false;
  } catch {}

  // The PNG rendition has no JPEG noise around the garment edge (the JPG leaks into white shirts).
  const res = await fetch(src.replace(/\.jpg(\?|$)/, ".png$1"), { cache: "no-store" });
  if (!res.ok) throw new Error(`Mockup fetch failed (${res.status})`);
  const cut = await removeBackground(Buffer.from(await res.arrayBuffer()));

  await fs.mkdir(CACHE_DIR, { recursive: true });
  if (!cut) {
    await fs.writeFile(fileOf(key, "none"), src);
    return false;
  }
  await Promise.all(
    CUTOUT_WIDTHS.map(async (width) => fs.writeFile(fileOf(key, width), await square(cut, width))),
  );
  return true;
}

let warming = false;

/** Pre-generates cut-outs in the background so first views don't wait on Printify. */
export function warmCutouts(srcs: string[], concurrency = 6) {
  if (warming) return;
  warming = true;
  const queue = [...new Set(srcs.filter(isPrintifyMockup))];
  const worker = async () => {
    for (let src = queue.shift(); src; src = queue.shift()) {
      await ensure(keyOf(src), src).catch(() => {});
    }
  };
  Promise.all(Array.from({ length: concurrency }, worker)).finally(() => {
    warming = false;
  });
}

/** Returns a trimmed RGBA PNG of the garment, or null if the background isn't a flat studio color. */
async function removeBackground(input: Buffer): Promise<Buffer | null> {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const n = W * H;

  const borderIdx: number[] = [];
  for (let x = 0; x < W; x++) borderIdx.push(x, (H - 1) * W + x);
  for (let y = 1; y < H - 1; y++) borderIdx.push(y * W, y * W + W - 1);

  // Background color = median of the border pixels.
  const ref = [0, 1, 2].map((c) => {
    const values = borderIdx.map((i) => data[i * 3 + c]).sort((a, b) => a - b);
    return values[values.length >> 1];
  });
  const distance = (i: number) =>
    Math.max(Math.abs(data[i * 3] - ref[0]), Math.abs(data[i * 3 + 1] - ref[1]), Math.abs(data[i * 3 + 2] - ref[2]));

  // Lifestyle / folded shots have busy edges: leave those as they are.
  if (borderIdx.filter((i) => distance(i) <= TOLERANCE).length < borderIdx.length * 0.9) return null;

  // Flood-fill the background inwards from the border.
  const background = new Uint8Array(n);
  const stack = borderIdx.slice();
  let removed = 0;
  while (stack.length) {
    const i = stack.pop()!;
    if (background[i] || distance(i) > TOLERANCE) continue;
    background[i] = 1;
    removed++;
    const x = i % W;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (i >= W) stack.push(i - W);
    if (i < n - W) stack.push(i + W);
  }
  // If the fill leaked into a pale garment, almost nothing would be left.
  if (n - removed < n * 0.08) return null;

  // Printify renders a pale halo around coloured garments. When the garment is clearly not pale,
  // strip near-background pixels in a narrow band next to the background (white garments skip this).
  const sample: number[] = [];
  for (let i = 0; i < n; i += 13) if (!background[i]) sample.push(distance(i));
  sample.sort((a, b) => a - b);
  if (sample[sample.length >> 1] > 60) {
    const HALO_TOLERANCE = 70;
    const BAND = 18;
    const depth = new Uint8Array(n);
    let queue: number[] = [];
    for (let i = 0; i < n; i++) if (background[i]) queue.push(i);
    for (let d = 1; d <= BAND && queue.length; d++) {
      const next: number[] = [];
      for (const i of queue) {
        const x = i % W;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) {
          if (j < 0 || j >= n || background[j] || depth[j] || distance(j) > HALO_TOLERANCE) continue;
          depth[j] = d;
          background[j] = 1;
          next.push(j);
        }
      }
      queue = next;
    }
  }

  // Feathered alpha, pulled in slightly so no pale rim of studio background remains.
  const mask = Buffer.alloc(n);
  for (let i = 0; i < n; i++) mask[i] = background[i] ? 0 : 255;
  const soft = await sharp(mask, { raw: { width: W, height: H, channels: 1 } }).blur(1.2).extractChannel(0).raw().toBuffer();
  const rgba = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    rgba[i * 4] = data[i * 3];
    rgba[i * 4 + 1] = data[i * 3 + 1];
    rgba[i * 4 + 2] = data[i * 3 + 2];
    rgba[i * 4 + 3] = Math.max(0, Math.min(255, Math.round(((soft[i] - 70) * 255) / 185)));
  }
  return sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 0 }).png().toBuffer();
}

/** Pads the garment back to a square so every product sits at a similar scale. */
function square(cut: Buffer, width: Width) {
  const inner = Math.round(width * 0.86);
  const pad = Math.round((width - inner) / 2);
  const clear = { r: 0, g: 0, b: 0, alpha: 0 };
  return sharp(cut)
    .resize(inner, inner, { fit: "contain", background: clear })
    .extend({ top: pad, bottom: width - inner - pad, left: pad, right: width - inner - pad, background: clear })
    .webp({ quality: 84, alphaQuality: 90 })
    .toBuffer();
}
