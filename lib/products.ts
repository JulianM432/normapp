import "server-only";
import { desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, products } from "@/lib/db";

export const PRODUCTS_TAG = "products";

export type CatalogItem = {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
};

export async function getAvailableProducts(): Promise<CatalogItem[]> {
  "use cache";
  cacheLife("max");
  cacheTag(PRODUCTS_TAG);

  return db()
    .select({ id: products.id, title: products.title, price: products.price, imageUrl: products.imageUrl })
    .from(products)
    .where(eq(products.status, "available"))
    .orderBy(desc(products.createdAt));
}
