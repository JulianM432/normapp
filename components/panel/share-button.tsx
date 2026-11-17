"use client";

import { useEffect, useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 4000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function share() {
    setFailed(false);
    const data = { title: "Cerámicas, lo de Norma", text: "Mirá mis piezas", url };
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      <button type="button" onClick={share} className="btn btn-secondary w-full">
        <Share2 aria-hidden="true" />
        Compartir mi página
      </button>
      <p aria-live="polite" className="empty:hidden">
        {copied && (
          <span className="flex items-center justify-center gap-2 rounded-xl bg-sage p-3 text-xl font-semibold">
            <Check aria-hidden="true" className="size-7" />
            ¡Link copiado!
          </span>
        )}
        {failed && (
          <span className="block rounded-xl bg-surface p-3 text-center text-lg">
            Tu página es <strong className="break-all">{url}</strong>
          </span>
        )}
      </p>
    </div>
  );
}
