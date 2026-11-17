import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BG = "#F1EFE7";
const VASE = `
  <path d="M40 14h20v8c0 5 16 13 16 33 0 19-9 31-26 31S24 74 24 55c0-20 16-28 16-33z" fill="#9FB8A6"/>
  <path d="M24 55c0-5 2-9 3.5-12.5h45C74 46 76 50 76 55c0 19-9 31-26 31S24 74 24 55z" fill="#2E5546"/>
  <path d="M36 14h28" stroke="#2E5546" stroke-width="5" stroke-linecap="round"/>`;

function svg({ rounded, scale }: { rounded: boolean; scale: number }) {
  const offset = 50 - 50 * scale;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" ${rounded ? 'rx="22"' : ""} fill="${BG}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">${VASE}</g>
</svg>`);
}

const root = process.cwd();
const iconsDir = path.join(root, "public", "icons");
mkdirSync(iconsDir, { recursive: true });

const outputs = [
  { file: path.join(iconsDir, "icon-192.png"), size: 192, rounded: true, scale: 1 },
  { file: path.join(iconsDir, "icon-512.png"), size: 512, rounded: true, scale: 1 },
  { file: path.join(iconsDir, "icon-maskable-512.png"), size: 512, rounded: false, scale: 0.72 },
  { file: path.join(root, "app", "apple-icon.png"), size: 180, rounded: false, scale: 0.86 },
];

async function main() {
  for (const { file, size, rounded, scale } of outputs) {
    await sharp(svg({ rounded, scale }), { density: 72 * (size / 100) * 2 })
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(file);
    console.log(`${path.relative(root, file)} (${size}px)`);
  }
}

main();
