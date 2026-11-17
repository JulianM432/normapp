"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  Download,
  Ellipsis,
  EllipsisVertical,
  Share,
  Smartphone,
  SquarePlus,
} from "lucide-react";

type Platform = "ios" | "android";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const standaloneQuery = "(display-mode: standalone)";
const drawerEase = "cubic-bezier(0.32, 0.72, 0, 1)";

function subscribeStandalone(onChange: () => void) {
  const media = window.matchMedia(standaloneQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function isStandalone() {
  return (
    window.matchMedia(standaloneQuery).matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

async function slideClosed(dialog: HTMLDialogElement) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timing: KeyframeAnimationOptions = { duration: 220, easing: drawerEase, fill: "forwards" };
  const sheet = dialog.animate(
    reduce ? [{ opacity: 1 }, { opacity: 0 }] : [{ transform: "translateY(0)" }, { transform: "translateY(100%)" }],
    timing,
  );
  const backdrop = dialog.animate([{ opacity: 1 }, { opacity: 0 }], { ...timing, pseudoElement: "::backdrop" });
  await sheet.finished.catch(() => {});
  dialog.close();
  sheet.cancel();
  backdrop.cancel();
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  return "ios";
}

export function InstallHelp() {
  const installed = useSyncExternalStore(
    subscribeStandalone,
    isStandalone,
    () => true,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("ios");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPopState = () => {
      setOpen(false);
      const dialog = dialogRef.current;
      if (dialog) slideClosed(dialog);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [open]);

  function show() {
    setPlatform(detectPlatform());
    history.pushState({ installHelp: true }, "");
    setOpen(true);
    dialogRef.current?.showModal();
  }

  function hide() {
    history.back();
  }

  async function installNow() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (outcome === "accepted") hide();
  }

  if (installed) return null;

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="btn btn-quiet justify-self-center"
      >
        <Smartphone aria-hidden="true" />
        Instalala como app
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="install-help-title"
        onCancel={(event) => {
          event.preventDefault();
          hide();
        }}
        onClick={(event) => event.target === event.currentTarget && hide()}
        className="drawer mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-[30rem] overflow-y-auto overscroll-contain rounded-t-card bg-bg p-0 text-ink backdrop:bg-ink/45"
      >
        <div className="grid grid-cols-1 gap-6 px-4 pt-7 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))]">
          <header className="grid gap-2">
            <h2
              id="install-help-title"
              className="font-display text-title text-wine"
            >
              Instalala como app
            </h2>
            <p className="text-xl">
              Así Norma la abre tocando un ícono, como cualquier otra app, sin
              tener que buscar la página.
            </p>
          </header>

          <div
            role="group"
            aria-label="¿Qué teléfono tiene?"
            className="grid grid-cols-2 gap-2 rounded-btn bg-surface p-1.5"
          >
            <PlatformTab
              active={platform === "ios"}
              onSelect={() => setPlatform("ios")}
            >
              iPhone
            </PlatformTab>
            <PlatformTab
              active={platform === "android"}
              onSelect={() => setPlatform("android")}
            >
              Android
            </PlatformTab>
          </div>

          {platform === "ios" ? (
            <Steps key="ios">
              <Step n={1}>
                Abrí esta página en <strong>Safari</strong> (la brújula azul).
              </Step>
              <Step n={2}>
                Tocá el botón de compartir{" "}
                <Glyph icon={<Share />} label="Compartir" />. Si no lo ves, tocá
                primero los tres puntitos{" "}
                <Glyph icon={<Ellipsis />} label="Más" /> de abajo.
              </Step>
              <Step n={3}>
                Bajá un poco y tocá{" "}
                <Glyph icon={<SquarePlus />} label="Agregar a inicio" />.
              </Step>
              <Step n={4}>
                Dejá prendido <strong>Abrir como app web</strong> si aparece, y
                tocá <strong>Agregar</strong> arriba a la derecha.
              </Step>
              <Step n={5}>
                ¡Listo! Va a aparecer el ícono <strong>Normapp</strong> en la
                pantalla de inicio.
              </Step>
            </Steps>
          ) : (
            <Steps key="android">
              {installPrompt && (
                <li className="grid gap-3 rounded-card bg-sage p-4">
                  <p className="text-lg">
                    Este teléfono la puede instalar directo:
                  </p>
                  <button
                    type="button"
                    onClick={installNow}
                    className="btn btn-primary w-full"
                  >
                    <Download aria-hidden="true" />
                    Instalar ahora
                  </button>
                  <p className="text-muted">
                    Si no funciona, seguí estos pasos:
                  </p>
                </li>
              )}
              <Step n={1}>
                Abrí esta página en <strong>Chrome</strong>.
              </Step>
              <Step n={2}>
                Tocá los tres puntitos{" "}
                <Glyph icon={<EllipsisVertical />} label="Menú" /> arriba a la
                derecha.
              </Step>
              <Step n={3}>
                Tocá <strong>Agregar a la pantalla principal</strong> (o{" "}
                <strong>Instalar app</strong>).
              </Step>
              <Step n={4}>
                Tocá <strong>Instalar</strong> para confirmar.
              </Step>
              <Step n={5}>
                ¡Listo! Va a aparecer el ícono <strong>Normapp</strong> junto a
                las otras apps.
              </Step>
            </Steps>
          )}

          <p className="rounded-card bg-surface p-4 text-lg">
            La primera vez que Norma la abra va a tener que poner su clave de 6
            números.
          </p>

          <button type="button" onClick={hide} className="btn btn-primary w-full">
            Volver al panel
          </button>
        </div>
      </dialog>
    </>
  );
}

function PlatformTab({
  active,
  onSelect,
  children,
}: {
  active: boolean;
  onSelect: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`btn min-h-12 w-full ${active ? "btn-primary" : "bg-transparent text-ink"}`}
    >
      {children}
    </button>
  );
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="enter-pop grid grid-cols-1 gap-3">{children}</ol>;
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-4 rounded-card bg-surface p-4 shadow-[0_1px_0_var(--color-line)]">
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-wine font-display text-xl text-on-wine"
      >
        {n}
      </span>
      <p className="min-w-0 pt-1.5 text-lg [overflow-wrap:anywhere]">
        {children}
      </p>
    </li>
  );
}

function Glyph({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-sage px-2 py-0.5 align-middle font-semibold whitespace-nowrap [&_svg]:size-[1.15em]">
      <span aria-hidden="true" className="contents">
        {icon}
      </span>
      {label}
    </span>
  );
}
