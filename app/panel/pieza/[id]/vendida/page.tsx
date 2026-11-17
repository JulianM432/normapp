import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CircleCheck } from "lucide-react";
import { z } from "zod";
import { getProduct } from "@/lib/products";
import { requireSession } from "@/lib/session";
import { UndoSold } from "./undo-sold";

export const metadata: Metadata = {
  title: "Vendida · Cerámicas, lo de Norma",
  robots: { index: false, follow: false },
};

export default function SoldPage({ params }: PageProps<"/panel/pieza/[id]/vendida">) {
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-[30rem] content-center px-4 py-10">
      <Suspense fallback={<p className="text-center text-lg text-muted">Cargando…</p>}>
        <Gate params={params} />
      </Suspense>
    </main>
  );
}

async function Gate({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const product = await getProduct(id.data);
  if (!product) notFound();
  if (product.status !== "sold") redirect(`/panel/pieza/${product.id}`);

  return (
    <section className="enter-pop grid gap-8 text-center">
      <div className="grid justify-items-center gap-3">
        <CircleCheck aria-hidden="true" className="size-20 text-btn" />
        <h1 className="font-display text-title text-wine">Marcada como vendida</h1>
      </div>
      <div className="flex items-center gap-4 rounded-card bg-surface p-3 text-left">
        <span className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl bg-sage">
          <Image src={product.imageUrl} alt="" fill sizes="96px" className="object-cover" />
        </span>
        <span className="font-display text-piece break-words">{product.title}</span>
      </div>
      <p className="text-xl">Ya no aparece en tu página.</p>
      <div className="grid gap-3">
        <Link href="/panel" replace className="btn btn-primary min-h-16 w-full text-xl">
          Listo
        </Link>
        <UndoSold id={product.id} />
      </div>
    </section>
  );
}
