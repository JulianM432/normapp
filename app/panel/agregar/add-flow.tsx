"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { RotateCw } from "lucide-react";
import { BloomingPot } from "@/components/panel/blooming-pot";
import { BackButton, BackLink, BottomBar, PhotoPicker, PriceField, TitleField } from "@/components/panel/controls";
import { formatPrice } from "@/lib/format";
import type { UploadMode } from "@/lib/image-rules";
import { compressPhoto, uploadPhoto } from "@/lib/photo";
import { priceSchema, titleSchema } from "@/lib/product-input";
import { createProduct, type FieldErrors } from "../product-actions";

type Step = 1 | 2 | 3;
type Photo = { blob: Blob; previewUrl: string };
type Status = "editing" | "uploading" | "saving" | "upload-error" | "save-error" | "done";

const STEP_NAMES = { 1: "Foto", 2: "Nombre", 3: "Precio" } as const;
const FORM_ID = "add-step";
const SCROLL_DELAY_MS = 480;

export function AddFlow({ uploadMode }: { uploadMode: UploadMode }) {
  const [run, setRun] = useState(0);
  useLayoutEffect(() => () => setRun((n) => n + 1), []);
  return <AddFlowRun key={run} uploadMode={uploadMode} />;
}

function AddFlowRun({ uploadMode }: { uploadMode: UploadMode }) {
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
  const [progress, setProgress] = useState(0);
  const [budding, setBudding] = useState(false);
  const [bloomed, setBloomed] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const touchedRef = useRef(false);
  const onResultScreen = status !== "editing";

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
      backToEditing();
    }
  });

  useEffect(() => {
    history.replaceState({ ...history.state, addStep: 1 }, "");
    const listener = (event: PopStateEvent) => onPopState(event);
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);

  useEffect(() => {
    if (!onResultScreen) return;
    touchedRef.current = false;
    const touched = () => {
      touchedRef.current = true;
    };
    const events = ["wheel", "touchmove", "keydown"] as const;
    events.forEach((name) => window.addEventListener(name, touched, { passive: true }));
    return () => events.forEach((name) => window.removeEventListener(name, touched));
  }, [onResultScreen]);

  useEffect(() => {
    if (!bloomed) return;
    const timer = setTimeout(() => {
      const actions = actionsRef.current;
      if (!actions || touchedRef.current) return;
      if (actions.getBoundingClientRect().bottom <= window.innerHeight) return;
      const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
      actions.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "end" });
    }, SCROLL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [bloomed]);

  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo.previewUrl);
  }, [photo]);

  function backToEditing() {
    setStatus("editing");
    setBudding(false);
  }

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
      setProgress(0);
      try {
        url = await uploadPhoto(uploadMode, photo.blob, title, setProgress);
        setProgress(1);
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

  if (onResultScreen && photo) {
    const failed = status === "upload-error" || status === "save-error";
    return (
      <section className="enter-pop grid justify-items-center gap-6 pt-6 text-center" aria-live="polite">
        <BloomingPot
          progress={progress}
          uploaded={uploadedUrl !== null}
          saved={status === "done"}
          paused={failed}
          onBud={() => setBudding(true)}
          onBloom={() => setBloomed(true)}
          className={`h-auto transition-[width,opacity] duration-500 ease-out ${bloomed ? "w-32" : "w-48"} ${failed ? "opacity-50" : ""}`}
        />
        {failed ? (
          <div className="grid w-full gap-6">
            <p role="alert" className="rounded-xl bg-error-bg p-4 text-xl font-semibold text-error">
              {status === "upload-error" ? "No se pudo subir la foto, probá de nuevo." : saveError}
            </p>
            {errors.title && <p className="text-lg">{errors.title}</p>}
            {errors.price && <p className="text-lg">{errors.price}</p>}
            <button type="button" onClick={() => void save()} className="btn btn-primary w-full">
              <RotateCw aria-hidden="true" />
              Reintentar
            </button>
            <button type="button" onClick={backToEditing} className="btn btn-quiet w-full">
              Revisar los datos
            </button>
          </div>
        ) : bloomed ? (
          <h1 className="enter-pop font-display text-title text-wine">¡Listo! Ya está en tu página</h1>
        ) : (
          <p key={budding ? "saving" : "uploading"} className="enter-pop font-display text-title text-wine">
            {budding ? "Guardando…" : "Subiendo foto…"}
          </p>
        )}
        {bloomed && saved && (
          <>
            <div className="enter-rise mx-auto grid w-full grid-cols-1 max-w-72 overflow-hidden rounded-card bg-surface text-left shadow-[0_1px_0_var(--color-line)] [--delay:60ms]">
              <div className="arch relative m-3 mb-0 aspect-[4/5] bg-sage">
                <Image src={photo.previewUrl} alt="" fill unoptimized className="object-cover" />
              </div>
              <div className="grid gap-1 p-4">
                <p className="font-display text-piece">{saved.title}</p>
                <p className="text-price font-semibold tabular-nums">{formatPrice(saved.price)}</p>
              </div>
            </div>
            <div ref={actionsRef} className="enter-rise grid w-full scroll-mb-6 gap-3 [--delay:140ms]">
              <Link href="/" className="btn btn-primary w-full">
                Ver mi página
              </Link>
              <Link href="/panel" replace className="btn btn-secondary w-full">
                Volver a mis piezas
              </Link>
            </div>
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
