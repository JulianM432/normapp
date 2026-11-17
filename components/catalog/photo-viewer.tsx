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
  const [ratio, setRatio] = useState(4 / 5);

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
        aria-label={`Ampliar: ${alt}`}
      >
        {children}
        <span className="absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-btn bg-surface px-3 py-1.5 font-semibold text-ink shadow-[0_1px_0_var(--color-line)]">
          <Maximize2 aria-hidden="true" className="size-[1.1em]" />
          Ampliar
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label={alt}
        onCancel={(event) => {
          event.preventDefault();
          hide();
        }}
        className="viewer m-0 h-dvh max-h-none w-dvw max-w-none bg-transparent p-0 backdrop:bg-black/95"
      >
        <div
          className="grid h-full cursor-zoom-out place-items-center p-6 sm:p-10"
          onClick={hide}
        >
          {open && (
            <div
              className="grid size-full place-items-center"
              style={{ containerType: "size" }}
            >
              <div
                className="viewer-photo relative cursor-auto"
                style={{
                  aspectRatio: ratio,
                  width: `min(100cqw, 100cqh * ${ratio})`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  onLoad={(e) =>
                    setRatio(
                      e.currentTarget.naturalWidth /
                        e.currentTarget.naturalHeight,
                    )
                  }
                />
                <button
                  type="button"
                  onClick={hide}
                  aria-label="Cerrar"
                  className="absolute -top-4 -right-4 grid size-12 cursor-pointer place-items-center rounded-full bg-surface text-ink shadow-[0_2px_12px_rgb(0_0_0/0.35)] active:scale-95"
                >
                  <X aria-hidden="true" className="size-6" />
                </button>
              </div>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
