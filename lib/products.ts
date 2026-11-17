import "server-only";
import { desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, products, type Product } from "@/lib/db";

export const PRODUCTS_TAG = "products";

export type CatalogItem = {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
};

const catalogColumns = {
  id: products.id,
  title: products.title,
  price: products.price,
  imageUrl: products.imageUrl,
};

export async function getAvailableProducts(): Promise<CatalogItem[]> {
  "use cache";
  cacheLife("max");
  cacheTag(PRODUCTS_TAG);

  return db()
    .select(catalogColumns)
    .from(products)
    .where(eq(products.status, "available"))
    .orderBy(desc(products.createdAt));
}

export async function getPanelProducts() {
  const rows = await db()
    .select({ ...catalogColumns, status: products.status, soldAt: products.soldAt })
    .from(products)
    .orderBy(desc(products.createdAt));
  return {
    available: rows.filter((p) => p.status === "available"),
    sold: rows
      .filter((p) => p.status === "sold")
      .sort((a, b) => (b.soldAt?.getTime() ?? 0) - (a.soldAt?.getTime() ?? 0)),
  };
}

export async function getProduct(id: string): Promise<Product | null> {
  const [row] = await db().select().from(products).where(eq(products.id, id));
  return row ?? null;
}
