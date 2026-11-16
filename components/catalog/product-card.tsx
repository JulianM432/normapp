import Image from "next/image";
import { PhotoViewer } from "@/components/catalog/photo-viewer";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { formatPrice } from "@/lib/format";
import type { CatalogItem } from "@/lib/products";

type Props = {
  product: CatalogItem;
  contactUrl: string;
  eager: boolean;
};

export function ProductCard({ product, contactUrl, eager }: Props) {
  return (
    <article className="grid content-start overflow-hidden rounded-card bg-surface shadow-[0_1px_0_var(--color-line)]">
      <div className="arch m-3 mb-0 bg-sage">
        <PhotoViewer src={product.imageUrl} alt={product.title}>
          <span className="relative block aspect-[4/5]">
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
              preload={eager}
              loading={eager ? "eager" : "lazy"}
            />
          </span>
        </PhotoViewer>
      </div>
      <div className="grid gap-1 p-4">
        <h3 className="font-display text-piece">{product.title}</h3>
        <p className="text-price font-semibold tabular-nums">{formatPrice(product.price)}</p>
        <a className="btn btn-primary mt-2 w-full" href={contactUrl} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon />
          ¡Consultale a Norma!
        </a>
      </div>
    </article>
  );
}
