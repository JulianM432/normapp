import { Phone } from "lucide-react";
import { Flower, Leaf } from "@/components/decor/flower";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { formatPhone } from "@/lib/format";

function Sprout({ className, petal, flower = true }: { className: string; petal?: string; flower?: boolean }) {
  return (
    <div className={`relative ${className}`}>
      <Leaf className="w-full" />
      {flower && <Flower petal={petal} className="absolute -top-[18%] left-[56.6%] w-[70%] -translate-x-1/2" />}
    </div>
  );
}

export function SiteFooter({ phone, contactUrl }: { phone: string; contactUrl: string }) {
  return (
    <footer className="relative mx-auto mt-24 w-full max-w-[88rem] px-3 pb-3 sm:px-4 sm:pb-4">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 bottom-[calc(100%-2.25rem)] sm:inset-x-4">
        <div className="mx-6 flex items-end justify-between sm:mx-12">
          <div className="flex items-end gap-1">
            <Sprout className="w-9 sm:w-14" />
            <Sprout className="w-6 sm:w-10" flower={false} />
          </div>
          <div className="hidden items-end gap-2 md:flex">
            <Sprout className="w-9" petal="var(--color-blush)" />
          </div>
          <div className="flex items-end gap-1">
            <Sprout className="w-7 sm:w-11" petal="var(--color-blush)" />
            <Sprout className="w-10 sm:w-16" />
          </div>
        </div>
      </div>

      <div className="scallop-top rounded-b-card bg-wine text-on-wine">
        <div className="grid grid-cols-1 gap-6 px-6 pt-6 pb-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:px-12 sm:pb-12">
          <div className="grid grid-cols-1 gap-2">
            <h2 className="font-display text-title">¿Te gustó alguna pieza?</h2>
            <p className="text-xl text-pretty">Escribile a Norma y te cuenta todo.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:justify-items-end">
            <a className="btn w-full bg-surface px-4 text-ink sm:w-auto sm:px-6" href={contactUrl} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="text-btn" />
              Mandale un WhatsApp
            </a>
            <a
              href={`tel:+${phone}`}
              className="inline-flex min-h-12 items-center gap-2 justify-self-start text-lg font-semibold underline underline-offset-4 sm:justify-self-end"
            >
              <Phone aria-hidden="true" className="size-[1.1em]" />
              Llamar al {formatPhone(phone)}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
