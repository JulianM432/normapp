import { del, put } from "@vercel/blob";
import { IMAGE_PREFIX } from "@/lib/image-rules";

export type StoredImage = { url: string };

export interface ImageStorage {
  upload(pathname: string, body: Buffer | Blob, contentType: string): Promise<StoredImage>;
  remove(url: string | string[]): Promise<void>;
  owns(url: string): boolean;
}


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
    owns(url) {
      try {
        const parsed = new URL(url);
        return (
          parsed.protocol === "https:" &&
          parsed.hostname.endsWith(".public.blob.vercel-storage.com") &&
          parsed.pathname.startsWith(`/${IMAGE_PREFIX}`)
        );
      } catch {
        return false;
      }
    },
  };
}
