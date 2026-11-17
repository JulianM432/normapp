import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { hasSession } from "@/lib/session";
import { ALLOWED_IMAGE_TYPES, IMAGE_PREFIX, MAX_IMAGE_BYTES } from "@/lib/image-rules";
import { createLocalStorage } from "@/lib/storage";

const UPLOAD_FAILED = { error: "No se pudo subir la foto" };

export async function POST(request: Request) {
  const token = env().BLOB_READ_WRITE_TOKEN;
  return token ? uploadToBlob(request, token) : uploadToDisk(request);
}

async function uploadToBlob(request: Request, token: string) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await hasSession())) throw new Error("unauthorized");
        if (!pathname.startsWith(IMAGE_PREFIX)) throw new Error("invalid pathname");
        return {
          allowedContentTypes: [...ALLOWED_IMAGE_TYPES],
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
        };
      },
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(UPLOAD_FAILED, { status: 400 });
  }
}

async function uploadToDisk(request: Request) {
  if (!(await hasSession())) return NextResponse.json(UPLOAD_FAILED, { status: 401 });

  const pathname = new URL(request.url).searchParams.get("pathname") ?? "";
  const contentType = request.headers.get("content-type") ?? "";
  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (
    !pathname.startsWith(IMAGE_PREFIX) ||
    !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType) ||
    declaredSize > MAX_IMAGE_BYTES
  ) {
    return NextResponse.json(UPLOAD_FAILED, { status: 400 });
  }

  try {
    const body = Buffer.from(await request.arrayBuffer());
    if (body.length === 0 || body.length > MAX_IMAGE_BYTES) return NextResponse.json(UPLOAD_FAILED, { status: 400 });
    const { url } = await createLocalStorage().upload(pathname, body, contentType);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json(UPLOAD_FAILED, { status: 400 });
  }
}
