import { readLocalImage } from "@/lib/storage";

export async function GET(_request: Request, { params }: RouteContext<"/uploads/[...path]">) {
  const { path } = await params;
  const image = await readLocalImage(`/uploads/${path.join("/")}`);
  if (!image) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(image.body), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
