import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { getProduct } from "@/lib/products";
import { requireSession } from "@/lib/session";
import { EditForm } from "./edit-form";

export const metadata: Metadata = {
  title: "Cambiar pieza · Cerámicas, lo de Norma",
  robots: { index: false, follow: false },
};

export default function EditPage({ params }: PageProps<"/panel/pieza/[id]">) {
  return (
    <main className="mx-auto grid w-full max-w-[30rem] content-start px-4 pt-4 pb-36">
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
  if (product.status === "sold") redirect("/panel");
  return (
    <EditForm
      key={product.updatedAt.toISOString()}
      id={product.id}
      title={product.title}
      price={product.price}
      imageUrl={product.imageUrl}
    />
  );
}
