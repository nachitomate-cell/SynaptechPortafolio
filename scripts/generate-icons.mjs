// Generates PWA icons from scripts/icon-source.svg into public/.
// Run with: node scripts/generate-icons.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(here, "icon-source.svg"));
const publicDir = resolve(here, "..", "public");

const targets = [
  { name: "pwa-192x192.png", size: 192 },
  { name: "pwa-512x512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const { name, size } of targets) {
  await sharp(src)
    .resize(size, size)
    .png()
    .toFile(resolve(publicDir, name));
  console.log(`✓ ${name} (${size}x${size})`);
}

// Maskable icon: pad the glyph into the safe zone (~80%) on a solid backdrop.
const maskableInner = Math.round(512 * 0.78);
const pad = Math.round((512 - maskableInner) / 2);
const inner = await sharp(src).resize(maskableInner, maskableInner).png().toBuffer();
await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: "#09090b",
  },
})
  .composite([{ input: inner, top: pad, left: pad }])
  .png()
  .toFile(resolve(publicDir, "pwa-maskable-512x512.png"));
console.log("✓ pwa-maskable-512x512.png (512x512, maskable)");
