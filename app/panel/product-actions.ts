"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { db, products } from "@/lib/db";
import { env } from "@/lib/env";
import { productInputSchema } from "@/lib/product-input";
import { getProduct, PRODUCTS_TAG } from "@/lib/products";
import { requireSession } from "@/lib/session";
import { createStorage } from "@/lib/storage";

export type FieldErrors = { title?: string; price?: string };

export type ActionResult = { ok: true; id: string } | { ok: false; error: string; fieldErrors?: FieldErrors };

const idSchema = z.uuid();
const createSchema = productInputSchema.extend({ imageUrl: z.string() });
const updateSchema = productInputSchema.extend({ id: idSchema, imageUrl: z.string().optional() });

const NOT_FOUND = "No encontramos esa pieza. Volvé al inicio y probá de nuevo.";
const BAD_PHOTO = "La foto no se pudo usar. Elegí otra y probá de nuevo.";
const FAILED = "No se pudo guardar. Revisá la conexión y probá de nuevo.";

function storage() {
  return createStorage(env().BLOB_READ_WRITE_TOKEN);
}

function invalid(error: z.ZodError): ActionResult {
  const fields = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  return {
    ok: false,
    error: "Revisá los datos marcados.",
    fieldErrors: { title: fields.title?.[0], price: fields.price?.[0] },
  };
}

export async function createProduct(input: unknown): Promise<ActionResult> {
  await requireSession();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { title, price, imageUrl } = parsed.data;
  if (!storage().owns(imageUrl)) return { ok: false, error: BAD_PHOTO };

  try {
    const [row] = await db().insert(products).values({ title, price, imageUrl }).returning({ id: products.id });
    if (!row) return { ok: false, error: FAILED };
    updateTag(PRODUCTS_TAG);
    return { ok: true, id: row.id };
  } catch (error) {
    console.error("createProduct", error);
    return { ok: false, error: FAILED };
  }
}

export async function updateProduct(input: unknown): Promise<ActionResult> {
  await requireSession();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, title, price, imageUrl } = parsed.data;
  if (imageUrl !== undefined && !storage().owns(imageUrl)) return { ok: false, error: BAD_PHOTO };

  const existing = await getProduct(id);
  if (!existing) return { ok: false, error: NOT_FOUND };

  try {
    await db()
      .update(products)
      .set({ title, price, ...(imageUrl ? { imageUrl } : {}) })
      .where(eq(products.id, id));
    updateTag(PRODUCTS_TAG);
  } catch (error) {
    console.error("updateProduct", error);
    return { ok: false, error: FAILED };
  }

  if (imageUrl && imageUrl !== existing.imageUrl) {
    const oldImageUrl = existing.imageUrl;
    after(async () => {
      try {
        await storage().remove(oldImageUrl);
      } catch (error) {
        console.error("updateProduct: old image not removed", error);
      }
    });
  }
  return { ok: true, id };
}

export async function setSold(id: string, sold: boolean): Promise<ActionResult> {
  await requireSession();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: NOT_FOUND };

  try {
    const rows = await db()
      .update(products)
      .set({ status: sold ? "sold" : "available", soldAt: sold ? new Date() : null })
      .where(eq(products.id, parsed.data))
      .returning({ id: products.id });
    if (rows.length === 0) return { ok: false, error: NOT_FOUND };
    updateTag(PRODUCTS_TAG);
    return { ok: true, id: parsed.data };
  } catch (error) {
    console.error("setSold", error);
    return { ok: false, error: FAILED };
  }
}
