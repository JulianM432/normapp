"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useLayoutEffect, useState, type FormEvent } from "react";
import { CircleCheck, RotateCw } from "lucide-react";
import { BackButton, BackLink, BottomBar, PhotoPicker, PriceField, TitleField } from "@/components/panel/controls";
import { formatPrice } from "@/lib/format";
import { compressPhoto, uploadPhoto } from "@/lib/photo";
import { priceSchema, titleSchema } from "@/lib/product-input";
import { createProduct, type FieldErrors } from "../product-actions";

type Step = 1 | 2 | 3;
type Photo = { blob: Blob; previewUrl: string };
type Status = "editing" | "uploading" | "saving" | "upload-error" | "save-error" | "done";

const STEP_NAMES = { 1: "Foto", 2: "Nombre", 3: "Precio" } as const;
const FORM_ID = "add-step";

export function AddFlow() {
  const [run, setRun] = useState(0);
  useLayoutEffect(() => () => setRun((n) => n + 1), []);
  return <AddFlowRun key={run} />;
}

function AddFlowRun() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<"none" | "forward" | "back">("none");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("editing");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ title: string; price: number } | null>(null);

  const onPopState = useEffectEvent((event: PopStateEvent) => {
    if (status === "done") {
      router.replace("/panel");
      return;
    }
    if (status === "uploading" || status === "saving") {
      history.pushState({ addStep: step }, "");
      return;
    }
    const target = (event.state as { addStep?: Step } | null)?.addStep;
    if (target === 1 || target === 2 || target === 3) {
      setDirection(target < step ? "back" : "forward");
      setStep(target);
      setStatus("editing");
    }
  });

  useEffect(() => {
    history.replaceState({ ...history.state, addStep: 1 }, "");
    const listener = (event: PopStateEvent) => onPopState(event);
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);

  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo.previewUrl);
  }, [photo]);

  function goTo(next: Step) {
    setDirection("forward");
    history.pushState({ ...history.state, addStep: next }, "");
    setStep(next);
  }

  async function pickPhoto(file: File) {
    setPhotoError(null);
    setPreparing(true);
    try {
      const blob = await compressPhoto(file);
      setPhoto({ blob, previewUrl: URL.createObjectURL(blob) });
      setUploadedUrl(null);
    } catch {
      setPhotoError("No se pudo abrir esa foto. Probá con otra.");
    } finally {
      setPreparing(false);
    }
  }

  function submitTitle(event: FormEvent) {
    event.preventDefault();
    const result = titleSchema.safeParse(title);
    if (!result.success) {
      setErrors({ title: result.error.issues[0]?.message });
      return;
    }
    setErrors({});
    setTitle(result.data);
    goTo(3);
  }

  function submitPrice(event: FormEvent) {
    event.preventDefault();
    const result = priceSchema.safeParse(price);
    if (!result.success) {
      setErrors({ price: result.error.issues[0]?.message });
      return;
    }
    setErrors({});
    void save();
  }

  async function save() {
    if (!photo) return;
    setSaveError(null);
    let url = uploadedUrl;
    if (!url) {
      setStatus("uploading");
      try {
        url = await uploadPhoto(photo.blob, title);
        setUploadedUrl(url);
      } catch {
        setStatus("upload-error");
        return;
      }
    }
    setStatus("saving");
    try {
      const result = await createProduct({ title, price, imageUrl: url });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setSaveError(result.error);
        setStatus("save-error");
        return;
      }
    } catch {
      setSaveError("No se pudo guardar. Revisá la conexión y probá de nuevo.");
      setStatus("save-error");
      return;
    }
    history.replaceState({ ...history.state, addStep: "done" }, "");
    setSaved({ title, price: Number(price) });
    setStatus("done");
  }

  if (status === "done" && saved && photo) {
    return (
      <section className="enter-pop grid gap-6 text-center">
        <div className="grid justify-items-center gap-3">
          <CircleCheck aria-hidden="true" className="size-20 text-btn" />
          <h1 className="font-display text-title text-wine">¡Listo! Ya está en tu página</h1>
        </div>
        <div className="mx-auto grid w-full grid-cols-1 max-w-72 overflow-hidden rounded-card bg-surface text-left shadow-[0_1px_0_var(--color-line)]">
          <div className="arch relative m-3 mb-0 aspect-[4/5] bg-sage">
            <Image src={photo.previewUrl} alt="" fill unoptimized className="object-cover" />
          </div>
          <div className="grid gap-1 p-4">
            <p className="font-display text-piece">{saved.title}</p>
            <p className="text-price font-semibold tabular-nums">{formatPrice(saved.price)}</p>
          </div>
        </div>
        <div className="grid gap-3">
          <Link href="/" className="btn btn-primary w-full">
            Ver mi página
          </Link>
          <Link href="/panel" replace className="btn btn-secondary w-full">
            Volver a mis piezas
          </Link>
        </div>
      </section>
    );
  }

  if (status !== "editing") {
    const busy = status === "uploading" || status === "saving";
    return (
      <section className="enter-pop grid gap-6 pt-10 text-center" aria-live="polite">
        {busy ? (
          <p className="font-display text-title text-wine">{status === "uploading" ? "Subiendo foto…" : "Guardando…"}</p>
        ) : (
          <>
            <p role="alert" className="rounded-xl bg-error-bg p-4 text-xl font-semibold text-error">
              {status === "upload-error" ? "No se pudo subir la foto, probá de nuevo." : saveError}
            </p>
            {errors.title && <p className="text-lg">{errors.title}</p>}
            {errors.price && <p className="text-lg">{errors.price}</p>}
            <button type="button" onClick={() => void save()} className="btn btn-primary w-full">
              <RotateCw aria-hidden="true" />
              Reintentar
            </button>
            <button type="button" onClick={() => setStatus("editing")} className="btn btn-quiet w-full">
              Revisar los datos
            </button>
          </>
        )}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-6">
      <div className="grid gap-3">
        {step === 1 ? <BackLink href="/panel" /> : <BackButton onBack={() => history.back()} />}
        <p className="text-xl font-semibold">
          Paso {step} de 3: {STEP_NAMES[step]}
        </p>
        <div className="grid grid-cols-3 gap-2" aria-hidden="true">
          {([1, 2, 3] as const).map((n) => (
            <span
              key={n}
              className={`h-2.5 rounded-full transition-colors duration-200 ${n <= step ? "bg-btn" : "bg-line"}`}
            />
          ))}
        </div>
      </div>

      <div key={step} className={direction === "none" ? undefined : direction === "back" ? "enter-back" : "enter-forward"}>
        {step === 1 && (
          <div className="grid gap-5">
            <h1 className="font-display text-title text-wine">{photo ? "¿Usamos esta foto?" : "Elegí una foto"}</h1>
            {photo ? (
              <div className="arch relative aspect-[4/5] bg-sage">
                <Image src={photo.previewUrl} alt="Vista previa de la foto" fill unoptimized className="object-cover" />
              </div>
            ) : (
              <>
                <PhotoPicker onPick={pickPhoto} disabled={preparing} />
                {preparing && <p className="text-center text-xl font-semibold text-muted">Preparando la foto…</p>}
                {photoError && (
                  <p role="alert" className="rounded-xl bg-error-bg p-3 text-lg font-semibold text-error">
                    {photoError}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <form id={FORM_ID} onSubmit={submitTitle} className="grid gap-5" noValidate>
            <TitleField
              value={title}
              onChange={(value) => {
                setTitle(value);
                setErrors({});
              }}
              error={errors.title}
              hint="Así te la van a pedir por WhatsApp."
              autoFocus
              heading
            />
          </form>
        )}

        {step === 3 && (
          <form id={FORM_ID} onSubmit={submitPrice} className="grid gap-5" noValidate>
            <PriceField
              value={price}
              onChange={(value) => {
                setPrice(value);
                setErrors({});
              }}
              error={errors.price}
              hint="Sin centavos."
              autoFocus
              heading
            />
          </form>
        )}
      </div>

      {step === 1 && photo && (
        <BottomBar>
          <button type="button" onClick={() => goTo(2)} className="btn btn-primary w-full">
            Usar esta foto
          </button>
          <button type="button" onClick={() => setPhoto(null)} className="btn btn-secondary w-full">
            Elegir otra
          </button>
        </BottomBar>
      )}
      {step > 1 && (
        <BottomBar>
          <button type="submit" form={FORM_ID} className="btn btn-primary w-full">
            {step === 2 ? "Siguiente" : "Guardar"}
          </button>
        </BottomBar>
      )}
    </section>
  );
}
