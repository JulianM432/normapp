import { notFound } from "next/navigation";
import { Camera, Check, Images, Plus, Share2, Undo2 } from "lucide-react";
import { Vase } from "@/components/decor/vase";
import { WhatsAppIcon } from "@/components/icons/whatsapp";

const SWATCHES = [
  ["bg", "Fondo"],
  ["surface", "Tarjeta"],
  ["ink", "Texto y precio"],
  ["muted", "Texto secundario"],
  ["btn", "Botón (celadón)"],
  ["wine", "Bordó"],
  ["blush", "Rosado"],
  ["sage", "Salvia suave"],
  ["sage-deep", "Salvia"],
  ["coral", "Coral suave"],
  ["coral-deep", "Coral"],
  ["mustard", "Mostaza"],
  ["focus", "Foco"],
  ["error", "Error"],
] as const;

const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export default function TokensPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-10 px-4 py-10">
      <header className="grid gap-1">
        <h1 className="font-display text-title">Cerámicas, lo de Norma</h1>
        <p className="text-muted">Hecho con amor, y para vos.</p>
      </header>

      <section className="grid gap-3">
        <h2 className="font-display text-piece">Colores</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SWATCHES.map(([token, label]) => (
            <li key={token} className="flex items-center gap-3 rounded-card bg-surface p-3">
              <span
                className="size-12 shrink-0 rounded-lg border border-line"
                style={{ background: `var(--color-${token})` }}
              />
              <span className="grid text-sm">
                <strong>{label}</strong>
                <code>{token}</code>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-3">
        <h2 className="font-display text-piece">Tarjeta del catálogo</h2>
        <article className="max-w-sm overflow-hidden rounded-card bg-surface shadow-[0_1px_0_var(--color-line)]">
          <div className="arch m-3 mb-0 grid aspect-[4/5] place-items-center bg-sage">
            <Vase className="w-3/5" />
          </div>
          <div className="grid gap-1 p-4">
            <h3 className="font-display text-piece">Cuenco para sopa</h3>
            <p className="text-price font-semibold tabular-nums">{ars.format(8000)}</p>
            <a className="btn btn-primary mt-2 w-full" href="#">
              <WhatsAppIcon />
              ¡Consultale a Norma!
            </a>
          </div>
        </article>
      </section>

      <section className="grid max-w-sm gap-3">
        <h2 className="font-display text-piece">Botones</h2>
        <button className="btn btn-primary">
          <Plus aria-hidden="true" />
          Agregar pieza
        </button>
        <button className="btn btn-primary">
          <Camera aria-hidden="true" />
          Sacar una foto
        </button>
        <button className="btn btn-secondary">
          <Images aria-hidden="true" />
          Elegir de mis fotos
        </button>
        <button className="btn btn-secondary">
          <Share2 aria-hidden="true" />
          Compartir mi página
        </button>
        <button className="btn btn-primary">
          <Check aria-hidden="true" />
          Listo
        </button>
        <button className="btn btn-quiet">
          <Undo2 aria-hidden="true" />
          Me equivoqué, no se vendió
        </button>
        <p className="rounded-xl bg-error-bg p-3 font-semibold text-error" role="alert">
          Esa clave no es. Te quedan 2 intentos.
        </p>
      </section>
    </main>
  );
}
