import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { hasSession } from "@/lib/session";
import { ALLOWED_IMAGE_TYPES, IMAGE_PREFIX, MAX_IMAGE_BYTES } from "@/lib/image-rules";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      token: env().BLOB_READ_WRITE_TOKEN,
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
    return NextResponse.json({ error: "No se pudo subir la foto" }, { status: 400 });
  }
}
