import { Phone } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import { Flower, Leaf } from "@/components/decor/flower";
import { SiteFooter } from "@/components/catalog/site-footer";
import { Squiggle } from "@/components/decor/squiggle";
import { Vase } from "@/components/decor/vase";
import { env } from "@/lib/env";
import { formatPhone, whatsappUrl } from "@/lib/format";
import { getAvailableProducts } from "@/lib/products";

export default async function Home() {
  const items = await getAvailableProducts();
  const phone = env().CONTACT_PHONE;
  const contactUrl = whatsappUrl(phone);

  return (
    <>
    <main className="mx-auto grid w-full max-w-[88rem] grid-cols-1 content-start gap-10 px-3 pt-3 sm:px-4 sm:pt-4">
      <header className="scallop-bottom relative overflow-hidden rounded-t-card bg-wine text-on-wine">
        <div className="relative grid items-end gap-6 px-6 pt-16 pb-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-12 sm:pt-14 sm:pb-12">
          <Flower className="absolute top-4 right-5 w-10 sm:right-8 sm:w-14" />
          <Flower className="absolute top-12 right-16 w-6 sm:top-6 sm:right-28 sm:w-8" petal="var(--color-blush)" />
          <div className="grid max-w-[20rem] gap-3 sm:max-w-[38rem]">
            <h1 className="font-display text-hero">Cerámicas, lo de Norma</h1>
            <p className="text-xl text-pretty">Hecho con amor, y para vos.</p>
            <a
              href={`tel:+${phone}`}
              className="inline-flex min-h-12 items-center gap-2 justify-self-start text-xl font-semibold underline underline-offset-4"
            >
              <Phone aria-hidden="true" className="size-[1.1em]" />
              {formatPhone(phone)}
            </a>
          </div>
          <div className="relative hidden w-48 sm:block">
            <Leaf className="absolute -bottom-2 -left-10 w-14" />
            <div className="arch grid place-items-center bg-blush px-6 pt-10 pb-6">
              <Vase className="w-full" />
            </div>
          </div>
        </div>
      </header>

      {items.length > 0 ? (
        <section aria-labelledby="piezas" className="grid grid-cols-1 gap-6">
          <h2 id="piezas" className="px-1 text-xl font-semibold">
            {items.length === 1 ? "1 pieza disponible" : `${items.length} piezas disponibles`}
          </h2>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {items.map((product, index) => (
              <li key={product.id} className="grid grid-cols-1">
                <ProductCard product={product} contactUrl={contactUrl} eager={index === 0} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="grid justify-items-center gap-3 px-4 text-center">
          <div className="arch grid w-44 place-items-center bg-sage px-6 pt-10 pb-6">
            <Vase className="w-full" />
          </div>
          <h2 className="font-display text-title text-wine">Todavía no hay piezas</h2>
          <Squiggle className="w-16 text-sage-deep" />
          <p className="max-w-[30ch] text-lg text-muted">Norma está preparando más piezas. Volvé pronto.</p>
        </section>
      )}
    </main>
    <SiteFooter phone={phone} contactUrl={contactUrl} />
    </>
  );
}
