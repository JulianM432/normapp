import { randomBytes } from "node:crypto";
import { mkdir, readdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, list, put } from "@vercel/blob";
import { ALLOWED_IMAGE_TYPES, IMAGE_PREFIX } from "@/lib/image-rules";

export type StoredImage = { url: string };

export interface ImageStorage {
  upload(pathname: string, body: Buffer | Blob, contentType: string): Promise<StoredImage>;
  remove(url: string | string[]): Promise<void>;
  owns(url: string): boolean;
  clear(): Promise<number>;
}

export function createStorage(token: string | undefined): ImageStorage {
  return token ? createVercelBlobStorage(token) : createLocalStorage();
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
    async clear() {
      let cursor: string | undefined;
      let removed = 0;
      do {
        const page = await list({ prefix: IMAGE_PREFIX, cursor, token });
        await this.remove(page.blobs.map((b) => b.url));
        removed += page.blobs.length;
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      return removed;
    },
  };
}

export const LOCAL_URL_PREFIX = "/uploads/";
const LOCAL_DIR = path.join(process.cwd(), ".uploads");

const EXTENSIONS: Record<(typeof ALLOWED_IMAGE_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const CONTENT_TYPES = Object.fromEntries(Object.entries(EXTENSIONS).map(([type, ext]) => [ext, type]));

const LOCAL_URL_PATTERN = new RegExp(`^${LOCAL_URL_PREFIX}${IMAGE_PREFIX}[a-z0-9-]+\\.(jpg|png|webp)$`);

function localFile(url: string) {
  return path.join(LOCAL_DIR, url.slice(LOCAL_URL_PREFIX.length));
}

function isAllowedType(type: string): type is keyof typeof EXTENSIONS {
  return type in EXTENSIONS;
}

export function createLocalStorage(): ImageStorage {
  return {
    async upload(pathname, body, contentType) {
      if (!isAllowedType(contentType)) throw new Error(`Tipo de imagen no permitido: ${contentType}`);
      const base = path.posix.basename(pathname).replace(/\.[^.]*$/, "").replace(/[^a-z0-9-]/g, "") || "pieza";
      const url = `${LOCAL_URL_PREFIX}${IMAGE_PREFIX}${base}-${randomBytes(6).toString("hex")}.${EXTENSIONS[contentType]}`;
      const file = localFile(url);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, Buffer.isBuffer(body) ? body : Buffer.from(await body.arrayBuffer()));
      return { url };
    },
    async remove(url) {
      const urls = (Array.isArray(url) ? url : [url]).filter((u) => this.owns(u));
      await Promise.all(urls.map((u) => unlink(localFile(u)).catch(() => undefined)));
    },
    owns(url) {
      return LOCAL_URL_PATTERN.test(url);
    },
    async clear() {
      const dir = path.join(LOCAL_DIR, IMAGE_PREFIX);
      const files = await readdir(dir).catch(() => []);
      await rm(dir, { recursive: true, force: true });
      return files.length;
    },
  };
}

export async function readLocalImage(url: string) {
  if (!LOCAL_URL_PATTERN.test(url)) return null;
  try {
    const body = await readFile(localFile(url));
    return { body, contentType: CONTENT_TYPES[path.extname(url).slice(1)] ?? "application/octet-stream" };
  } catch {
    return null;
  }
}
