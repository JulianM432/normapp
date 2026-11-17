import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { createDb } from "../lib/db/client";
import { slugify } from "../lib/format";
import { loginAttempts, products } from "../lib/db/schema";
import { productInputSchema } from "../lib/product-input";
import { IMAGE_PREFIX } from "../lib/image-rules";
import { createStorage } from "../lib/storage";

const SEED_DIR = path.join(process.cwd(), "seed");
const IMAGES_DIR = path.join(SEED_DIR, "images");

const seedSchema = z.array(
  productInputSchema.extend({ image: z.string().min(1) }),
);

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name} en .env.local`);
  return value;
}

async function main() {
  const reset = process.argv.includes("--reset");
  const db = createDb(requireEnv("DATABASE_URL"));
  const storage = createStorage(process.env.BLOB_READ_WRITE_TOKEN || undefined);

  const items = seedSchema.parse(
    JSON.parse(readFileSync(path.join(SEED_DIR, "products.json"), "utf8")),
  );

  const missing = items
    .filter((i) => !existsSync(path.join(IMAGES_DIR, i.image)))
    .map((i) => i.image);
  if (missing.length > 0) {
    throw new Error(`Faltan fotos en seed/images: ${missing.join(", ")}`);
  }

  if (reset) {
    await db.delete(products);
    await db.delete(loginAttempts);
    const removed = await storage.clear();
    console.log(`Reset: catálogo vacío, ${removed} fotos borradas`);
  }

  const existing = await db.select({ title: products.title }).from(products);
  const existingTitles = new Set(
    existing.map((p) => p.title.toLocaleLowerCase("es-AR")),
  );

  const now = Date.now();
  let created = 0;

  for (const [index, item] of items.entries()) {
    if (existingTitles.has(item.title.toLocaleLowerCase("es-AR"))) {
      console.log(`= ${item.title} (ya existe)`);
      continue;
    }

    const jpeg = await sharp(path.join(IMAGES_DIR, item.image))
      .rotate()
      .resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    const { url } = await storage.upload(
      `${IMAGE_PREFIX}${slugify(item.title)}.jpg`,
      jpeg,
      "image/jpeg",
    );

    await db.insert(products).values({
      title: item.title,
      price: item.price,
      imageUrl: url,
      createdAt: new Date(now - index * 60_000),
    });

    created += 1;
    console.log(`+ ${item.title} (${Math.round(jpeg.length / 1024)} KB)`);
  }

  const count = await db.$count(products);
  console.log(`Listo: ${created} piezas nuevas, ${count} en total`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
