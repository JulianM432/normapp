import type { Metadata } from "next";
import { Suspense } from "react";
import { lockedMessage } from "@/lib/login-messages";
import { clientKey, lockedUntil } from "@/lib/rate-limit";
import { hasSession } from "@/lib/session";
import { PinScreen } from "./pin-screen";

export const metadata: Metadata = {
  title: "Tu panel · Cerámicas, lo de Norma",
  robots: { index: false, follow: false },
};

export default function PanelPage() {
  return (
    <main className="mx-auto grid w-full max-w-[30rem] content-start px-4 pt-10 pb-16">
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

function PanelHome() {
  return (
    <section className="grid gap-3 text-center">
      <h1 className="font-display text-title text-wine">Tus piezas</h1>
      <p className="text-xl">Ya entraste. Muy pronto vas a poder agregar y cambiar tus piezas desde acá.</p>
    </section>
  );
}
