"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";
import { ArrowLeft, Camera, Images } from "lucide-react";
import { digitsOnly } from "@/lib/format";
import { PRICE_MAX, TITLE_MAX } from "@/lib/product-limits";

const backClass = "btn btn-quiet -ml-3 justify-self-start px-3 no-underline";

export function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} className={backClass}>
      <ArrowLeft aria-hidden="true" />
      Volver
    </button>
  );
}

export function BackLink({ href }: { href: string }) {
  return (
    <Link href={href} replace className={backClass}>
      <ArrowLeft aria-hidden="true" />
      Volver
    </Link>
  );
}

export function PhotoPicker({
  onPick,
  disabled,
  cameraLabel = "Sacar una foto",
  galleryLabel = "Elegir de mis fotos",
  quiet = false,
}: {
  onPick: (file: File) => void;
  disabled?: boolean;
  cameraLabel?: string;
  galleryLabel?: string;
  quiet?: boolean;
}) {
  const pick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onPick(file);
  };
  return (
    <div className="grid grid-cols-1 gap-3">
      <label
        className={`btn ${quiet ? "btn-secondary" : "btn-primary"} hidden w-full cursor-pointer has-disabled:opacity-70 [@media(pointer:coarse)]:inline-flex`}
      >
        <Camera aria-hidden="true" />
        {cameraLabel}
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={pick} disabled={disabled} />
      </label>
      <label className="btn btn-secondary w-full cursor-pointer has-disabled:opacity-70">
        <Images aria-hidden="true" />
        {galleryLabel}
        <input type="file" accept="image/*" className="sr-only" onChange={pick} disabled={disabled} />
      </label>
    </div>
  );
}

function FieldShell({
  label,
  heading,
  hint,
  error,
  children,
}: {
  label: string;
  heading?: boolean;
  hint?: string;
  error?: string;
  children: (ids: { input: string; describedBy: string | undefined }) => ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="grid grid-cols-1 gap-2">
      {heading ? (
        <h1 className="font-display text-title text-wine">
          <label htmlFor={id}>{label}</label>
        </h1>
      ) : (
        <label htmlFor={id} className="font-display text-piece">
          {label}
        </label>
      )}
      {hint && (
        <p id={hintId} className="text-lg text-muted">
          {hint}
        </p>
      )}
      {children({ input: id, describedBy })}
      {error && (
        <p id={errorId} role="alert" className="rounded-xl bg-error-bg p-3 text-lg font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "min-h-16 w-full rounded-2xl border-2 border-line bg-surface px-4 text-xl text-ink focus:border-btn aria-invalid:border-error";

export function TitleField({
  value,
  onChange,
  error,
  hint,
  autoFocus,
  heading,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  autoFocus?: boolean;
  heading?: boolean;
}) {
  return (
    <FieldShell label="Nombre de la pieza" hint={hint} error={error} heading={heading}>
      {({ input, describedBy }) => (
        <input
          id={input}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={TITLE_MAX + 20}
          autoComplete="off"
          autoCapitalize="sentences"
          enterKeyHint="next"
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass}
        />
      )}
    </FieldShell>
  );
}

export function PriceField({
  value,
  onChange,
  error,
  hint,
  autoFocus,
  heading,
}: {
  value: string;
  onChange: (digits: string) => void;
  error?: string;
  hint?: string;
  autoFocus?: boolean;
  heading?: boolean;
}) {
  const shown = value ? Number(value).toLocaleString("es-AR") : "";
  return (
    <FieldShell label="Precio en pesos" hint={hint} error={error} heading={heading}>
      {({ input, describedBy }) => (
        <div className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-xl font-semibold">
            $
          </span>
          <input
            id={input}
            type="text"
            inputMode="numeric"
            value={shown}
            onChange={(e) => onChange(digitsOnly(e.target.value).replace(/^0+/, "").slice(0, String(PRICE_MAX).length))}
            autoComplete="off"
            enterKeyHint="done"
            autoFocus={autoFocus}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`${inputClass} pl-9 font-semibold tabular-nums`}
          />
        </div>
      )}
    </FieldShell>
  );
}

export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
      <div className="mx-auto grid w-full max-w-[30rem] grid-cols-1 gap-2">{children}</div>
    </div>
  );
}
