import { del, put } from "@vercel/blob";

export type StoredImage = { url: string };

export interface ImageStorage {
  upload(pathname: string, body: Buffer | Blob, contentType: string): Promise<StoredImage>;
  remove(url: string | string[]): Promise<void>;
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function createVercelBlobStorage(token?: string): ImageStorage {
  return {
    async upload(pathname, body, contentType) {
      const blob = await put(pathname, body, {
        access: "public",
        addRandomSuffix: true,
        contentType,
        cacheControlMaxAge: 60 * 60 * 24 * 365,
        token,
      });
      return { url: blob.url };
    },
    async remove(url) {
      if (Array.isArray(url) && url.length === 0) return;
      await del(url, { token });
    },
  };
}
