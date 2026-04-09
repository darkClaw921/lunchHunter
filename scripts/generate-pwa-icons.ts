/**
 * One-off generator for PWA icons.
 *
 * Renders a brand SVG (orange background + white "utensils-crossed" glyph)
 * into PNG icons at the sizes required by the Web App Manifest:
 *   - /public/icons/icon-192.png            (192x192, purpose: any)
 *   - /public/icons/icon-512.png            (512x512, purpose: any)
 *   - /public/icons/icon-maskable-192.png   (192x192, purpose: maskable)
 *   - /public/icons/icon-maskable-512.png   (512x512, purpose: maskable)
 *
 * Maskable icons include additional safe-area padding around the glyph so
 * they render cleanly inside the OS icon mask.
 *
 * Run with:  pnpm tsx scripts/generate-pwa-icons.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const BRAND_ORANGE = "#FF5C00";
const OUTPUT_DIR = join(process.cwd(), "public", "icons");

/**
 * A simplified "utensils crossed" glyph (fork + knife) rendered in white
 * strokes. Coordinates are designed for a 512x512 viewBox so that the SVG
 * can be scaled to any target size via sharp's raster resize.
 */
function buildIconSvg(opts: { size: number; safeAreaRatio: number }): string {
  const { size, safeAreaRatio } = opts;
  const viewBox = 512;
  // Safe area for maskable icons — glyph occupies the central safeAreaRatio
  // fraction of the canvas, leaving padding on the outside.
  const glyphInset = (viewBox * (1 - safeAreaRatio)) / 2;
  const glyphSize = viewBox - glyphInset * 2;

  // Inner SVG of the glyph sized to glyphSize, translated by glyphInset.
  // Stroke width scales with glyph size to stay readable.
  const stroke = Math.round(glyphSize * 0.08);
  const g = (x: number): number => glyphInset + (x / 512) * glyphSize;

  // Fork (top-left to bottom-right diagonal) with tines at top-left.
  // Knife (top-right to bottom-left diagonal) with blade at top-right.
  const forkHandleX1 = g(180);
  const forkHandleY1 = g(180);
  const forkHandleX2 = g(430);
  const forkHandleY2 = g(430);

  const knifeHandleX1 = g(332);
  const knifeHandleY1 = g(180);
  const knifeHandleX2 = g(82);
  const knifeHandleY2 = g(430);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${viewBox} ${viewBox}">
  <rect width="${viewBox}" height="${viewBox}" fill="${BRAND_ORANGE}"/>
  <g fill="none" stroke="#FFFFFF" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
    <!-- Fork handle -->
    <line x1="${forkHandleX1}" y1="${forkHandleY1}" x2="${forkHandleX2}" y2="${forkHandleY2}"/>
    <!-- Fork tines (three short strokes branching from the top end) -->
    <line x1="${g(140)}" y1="${g(140)}" x2="${g(200)}" y2="${g(80)}"/>
    <line x1="${g(165)}" y1="${g(165)}" x2="${g(240)}" y2="${g(105)}"/>
    <line x1="${g(120)}" y1="${g(120)}" x2="${g(160)}" y2="${g(50)}"/>
    <!-- Knife -->
    <line x1="${knifeHandleX1}" y1="${knifeHandleY1}" x2="${knifeHandleX2}" y2="${knifeHandleY2}"/>
    <!-- Knife blade (triangular blob near top-right) -->
    <path d="M ${g(300)} ${g(150)} L ${g(380)} ${g(70)} L ${g(430)} ${g(120)} Z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="${Math.round(stroke / 2)}"/>
  </g>
</svg>`;
}

async function renderIcon(opts: {
  size: number;
  safeAreaRatio: number;
  fileName: string;
}): Promise<void> {
  const svg = buildIconSvg({ size: opts.size, safeAreaRatio: opts.safeAreaRatio });
  const png = await sharp(Buffer.from(svg))
    .resize(opts.size, opts.size)
    .png({ compressionLevel: 9 })
    .toBuffer();
  const outputPath = join(OUTPUT_DIR, opts.fileName);
  await writeFile(outputPath, png);
  // eslint-disable-next-line no-console
  console.log(`wrote ${outputPath} (${png.byteLength} bytes)`);
}

async function main(): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Standard icons — glyph fills ~80% of the canvas.
  await renderIcon({ size: 192, safeAreaRatio: 0.82, fileName: "icon-192.png" });
  await renderIcon({ size: 512, safeAreaRatio: 0.82, fileName: "icon-512.png" });

  // Maskable icons — glyph must fit inside the safe zone (60% circle),
  // so we shrink the glyph area to ~62% of the canvas.
  await renderIcon({
    size: 192,
    safeAreaRatio: 0.62,
    fileName: "icon-maskable-192.png",
  });
  await renderIcon({
    size: 512,
    safeAreaRatio: 0.62,
    fileName: "icon-maskable-512.png",
  });

  // Apple touch icon (180x180, standard apple size, no maskable padding).
  await renderIcon({
    size: 180,
    safeAreaRatio: 0.82,
    fileName: "apple-touch-icon.png",
  });
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
