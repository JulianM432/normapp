"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize2, X } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  children: ReactNode;
};

export function PhotoViewer({ src, alt, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onPopState = () => {
      dialogRef.current?.close();
      setOpen(false);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [open]);

  function show() {
    history.pushState({ photoViewer: true }, "");
    setOpen(true);
    dialogRef.current?.showModal();
  }

  function hide() {
    history.back();
  }

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="group relative block w-full cursor-zoom-in"
        aria-label={`Ver grande: ${alt}`}
      >
        {children}
        <span className="absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-btn bg-surface px-3 py-1.5 font-semibold text-ink shadow-[0_1px_0_var(--color-line)]">
          <Maximize2 aria-hidden="true" className="size-[1.1em]" />
          Ver grande
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label={alt}
        onCancel={(event) => {
          event.preventDefault();
          hide();
        }}
        className="m-0 h-dvh max-h-none w-dvw max-w-none bg-transparent p-0 backdrop:bg-black/95"
      >
        <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] gap-3 p-3 sm:p-6" onClick={(e) => e.target === e.currentTarget && hide()}>
          <button type="button" onClick={hide} className="btn btn-secondary justify-self-end">
            <X aria-hidden="true" />
            Cerrar
          </button>
          {open && (
            <div className="relative" onClick={(e) => e.target === e.currentTarget && hide()}>
              <Image src={src} alt={alt} fill sizes="100vw" className="object-contain" />
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
