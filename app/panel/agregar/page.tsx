import type { Metadata } from "next";
import { Suspense } from "react";
import { uploadMode } from "@/lib/env";
import { requireSession } from "@/lib/session";
import { AddFlow } from "./add-flow";

export const metadata: Metadata = {
  title: "Agregar pieza · Cerámicas, lo de Norma",
  robots: { index: false, follow: false },
};

export default function AddPage() {
  return (
    <main className="mx-auto grid w-full grid-cols-1 max-w-[30rem] content-start px-4 pt-4 pb-44">
      <AddFlow uploadMode={uploadMode()} />
      <Suspense fallback={null}>
        <Gate />
      </Suspense>
    </main>
  );
}

async function Gate() {
  await requireSession();
  return null;
}
