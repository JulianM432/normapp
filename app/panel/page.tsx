import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Pencil, Plus } from "lucide-react";
import { BottomBar } from "@/components/panel/controls";
import { ReactivateButton } from "@/components/panel/reactivate-button";
import { ShareButton } from "@/components/panel/share-button";
import { env } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { lockedMessage } from "@/lib/login-messages";
import { getPanelProducts } from "@/lib/products";
import { clientKey, lockedUntil } from "@/lib/rate-limit";
import { hasSession } from "@/lib/session";
import { PinScreen } from "./pin-screen";

export const metadata: Metadata = {
  title: "Tu panel · Cerámicas, lo de Norma",
  robots: { index: false, follow: false },
};

export default function PanelPage() {
  return (
    <main className="mx-auto grid w-full grid-cols-1 max-w-[30rem] content-start px-4 pt-8 pb-36">
      <Suspense fallback={<p className="text-center text-lg text-muted">Cargando…</p>}>
        <PanelGate />
      </Suspense>
    </main>
  );
}

async function PanelGate() {
  if (await hasSession()) return <PanelHome />;
  const lock = await lockedUntil(await clientKey());
  return <PinScreen initial={lock ? { error: lockedMessage(lock), lockedUntil: lock.getTime() } : undefined} />;
}

async function PanelHome() {
  const { available, sold } = await getPanelProducts();

  return (
    <div className="grid grid-cols-1 gap-8">
      <header className="grid grid-cols-1 gap-4">
        <h1 className="font-display text-title text-wine">Tus piezas</h1>
        <ShareButton url={env().NEXT_PUBLIC_SITE_URL} />
      </header>

      {available.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3">
          {available.map((product, index) => (
            <li key={product.id}>
              <Link
                href={`/panel/pieza/${product.id}`}
                className="flex flex-wrap items-center gap-4 rounded-card bg-surface p-3 shadow-[0_1px_0_var(--color-line)] active:scale-[0.98] motion-safe:transition-transform"
              >
                <Thumb src={product.imageUrl} eager={index < 2} />
                <span className="grid min-w-0 flex-1 basis-[10rem] gap-1">
                  <span className="font-display text-piece [overflow-wrap:anywhere]">{product.title}</span>
                  <span className="text-xl font-semibold tabular-nums">{formatPrice(product.price)}</span>
                  <span className="inline-flex items-center gap-2 text-muted [overflow-wrap:anywhere]">
                    <Pencil aria-hidden="true" className="size-5 shrink-0" />
                    Tocá para cambiarla
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-card bg-surface p-5 text-center text-xl">
          No tenés piezas a la venta. Tocá <strong>Agregar pieza</strong> para sumar una.
        </p>
      )}

      {sold.length > 0 && (
        <details className="group grid gap-3">
          <summary className="btn btn-quiet w-full cursor-pointer list-none no-underline [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Ver vendidas ({sold.length})</span>
            <span className="hidden group-open:inline">Ocultar vendidas</span>
          </summary>
          <ul className="mt-3 grid gap-3">
            {sold.map((product) => (
              <li key={product.id} className="grid gap-3 rounded-card bg-surface p-3">
                <div className="flex flex-wrap items-center gap-4">
                  <Thumb src={product.imageUrl} />
                  <span className="grid min-w-0 flex-1 basis-[10rem] gap-1">
                    <span className="font-display text-piece [overflow-wrap:anywhere]">{product.title}</span>
                    <span className="text-xl font-semibold tabular-nums">{formatPrice(product.price)}</span>
                    <span className="text-muted">Vendida</span>
                  </span>
                </div>
                <ReactivateButton id={product.id} />
              </li>
            ))}
          </ul>
        </details>
      )}

      <BottomBar>
        <Link href="/panel/agregar" className="btn btn-primary min-h-16 w-full text-xl">
          <Plus aria-hidden="true" />
          Agregar pieza
        </Link>
      </BottomBar>
    </div>
  );
}

function Thumb({ src, eager = false }: { src: string; eager?: boolean }) {
  return (
    <span className="relative aspect-[4/5] w-[min(6rem,26vw)] shrink-0 overflow-hidden rounded-xl bg-sage">
      <Image src={src} alt="" fill sizes="96px" className="object-cover" loading={eager ? "eager" : "lazy"} />
    </span>
  );
}
