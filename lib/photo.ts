import { slugify } from "@/lib/format";
import { IMAGE_PREFIX, type UploadMode } from "@/lib/image-rules";

const MAX_SIDE = 1600;
const QUALITY = 0.82;

export async function compressPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))), "image/jpeg", QUALITY);
  });
}

export async function uploadPhoto(
  mode: UploadMode,
  photo: Blob,
  title: string,
  onProgress?: (fraction: number) => void,
) {
  const pathname = `${IMAGE_PREFIX}${slugify(title) || "pieza"}.jpg`;
  if (mode === "local") return uploadToDisk(pathname, photo, onProgress);
  const { upload } = await import("@vercel/blob/client");
  const result = await upload(pathname, photo, {
    access: "public",
    handleUploadUrl: "/api/upload",
    contentType: "image/jpeg",
    onUploadProgress: onProgress && (({ percentage }) => onProgress(percentage / 100)),
  });
  return result.url;
}

function uploadToDisk(pathname: string, photo: Blob, onProgress?: (fraction: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/upload?pathname=${encodeURIComponent(pathname)}`);
    xhr.setRequestHeader("Content-Type", photo.type || "image/jpeg");
    xhr.responseType = "json";
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(event.loaded / event.total);
      };
    }
    xhr.onload = () => {
      const url = (xhr.response as { url?: string } | null)?.url;
      if (xhr.status === 200 && url) resolve(url);
      else reject(new Error("upload failed"));
    };
    xhr.onerror = () => reject(new Error("upload failed"));
    xhr.send(photo);
  });
}
