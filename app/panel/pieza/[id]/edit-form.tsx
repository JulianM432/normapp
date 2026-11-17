"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { CircleCheck } from "lucide-react";
import { BackLink, BottomBar, PhotoPicker, PriceField, TitleField } from "@/components/panel/controls";
import { compressPhoto, uploadPhoto } from "@/lib/photo";
import { productInputSchema, titleSchema } from "@/lib/product-input";
import { setSold, updateProduct, type FieldErrors } from "../../product-actions";

type Props = { id: string; title: string; price: number; imageUrl: string };
type Status = "idle" | "preparing" | "uploading" | "saving" | "selling";

export function EditForm(product: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(product.title);
  const [price, setPrice] = useState(String(product.price));
  const [photo, setPhoto] = useState<{ blob: Blob; previewUrl: string } | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const busy = status !== "idle";
  const cleanTitle = titleSchema.safeParse(title);
  const dirty =
    photo !== null || !cleanTitle.success || cleanTitle.data !== product.title || price !== String(product.price);

  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo.previewUrl);
  }, [photo]);

  async function pickPhoto(file: File) {
    setError(null);
    setStatus("preparing");
    try {
      const blob = await compressPhoto(file);
      setPhoto({ blob, previewUrl: URL.createObjectURL(blob) });
      setUploadedUrl(null);
    } catch {
      setError("No se pudo abrir esa foto. Probá con otra.");
    } finally {
      setStatus("idle");
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!dirty) return;
    setError(null);
    const parsed = productInputSchema.safeParse({ title, price });
    if (!parsed.success) {
      const issues = parsed.error.issues;
      setErrors({
        title: issues.find((i) => i.path[0] === "title")?.message,
        price: issues.find((i) => i.path[0] === "price")?.message,
      });
      return;
    }
    setErrors({});

    let imageUrl: string | undefined = uploadedUrl ?? undefined;
    if (photo && !imageUrl) {
      setStatus("uploading");
      try {
        imageUrl = await uploadPhoto(photo.blob, parsed.data.title);
        setUploadedUrl(imageUrl);
      } catch {
        setError("No se pudo subir la foto, probá de nuevo.");
        setStatus("idle");
        return;
      }
    }

    setStatus("saving");
    try {
      const result = await updateProduct({ id: product.id, ...parsed.data, imageUrl });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setError(result.error);
        setStatus("idle");
        return;
      }
      router.replace("/panel");
    } catch {
      setError("No se pudo guardar. Revisá la conexión y probá de nuevo.");
      setStatus("idle");
    }
  }

  async function markSold() {
    setError(null);
    setStatus("selling");
    try {
      const result = await setSold(product.id, true);
      if (result.ok) {
        router.replace(`/panel/pieza/${product.id}/vendida`);
        return;
      }
      setError(result.error);
    } catch {
      setError("No se pudo guardar. Revisá la conexión y probá de nuevo.");
    }
    setStatus("idle");
  }

  const saveLabel =
    status === "uploading"
      ? "Subiendo foto…"
      : status === "saving"
        ? "Guardando…"
        : uploadedUrl
          ? "Reintentar"
          : dirty
            ? "Guardar"
            : "Sin cambios";

  return (
    <form onSubmit={save} className="grid grid-cols-1 gap-6" noValidate>
      <BackLink href="/panel" />
      <h1 className="font-display text-title text-wine">Cambiar pieza</h1>

      <div className="grid grid-cols-1 gap-3">
        <div className="arch relative aspect-[4/5] bg-sage">
          {photo ? (
            <Image src={photo.previewUrl} alt="Foto nueva" fill unoptimized className="object-cover" />
          ) : (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              sizes="(min-width: 480px) 448px, 100vw"
              className="object-cover"
              loading="eager"
              fetchPriority="high"
            />
          )}
        </div>
        <PhotoPicker onPick={pickPhoto} disabled={busy} cameraLabel="Sacar otra foto" galleryLabel="Cambiar foto" quiet />
        {status === "preparing" && <p className="text-center text-xl font-semibold text-muted">Preparando la foto…</p>}
      </div>

      <TitleField
        value={title}
        onChange={(value) => {
          setTitle(value);
          setErrors((e) => ({ ...e, title: undefined }));
        }}
        error={errors.title}
      />
      <PriceField
        value={price}
        onChange={(value) => {
          setPrice(value);
          setErrors((e) => ({ ...e, price: undefined }));
        }}
        error={errors.price}
      />

      {error && (
        <p role="alert" className="rounded-xl bg-error-bg p-3 text-lg font-semibold text-error">
          {error}
        </p>
      )}

      <section className="mt-6 grid grid-cols-1 gap-3 border-t-2 border-dashed border-line pt-8">
        <h2 className="font-display text-piece">¿Ya la vendiste?</h2>
        <p className="text-lg text-muted">Deja de aparecer en tu página. Podés volver a ponerla en venta cuando quieras.</p>
        <button type="button" onClick={markSold} disabled={busy} className="btn btn-secondary w-full">
          <CircleCheck aria-hidden="true" />
          {status === "selling" ? "Marcando…" : "Ya se vendió"}
        </button>
      </section>

      <BottomBar>
        <button type="submit" disabled={busy || !dirty} className="btn btn-primary min-h-16 w-full text-xl" aria-live="polite">
          {saveLabel}
        </button>
      </BottomBar>
    </form>
  );
}
