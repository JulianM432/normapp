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
    <article className="grid grid-cols-1 grid-rows-[auto_1fr] overflow-hidden rounded-card bg-surface shadow-[0_1px_0_var(--color-line)]">
      <div className="arch m-3 mb-0 bg-sage">
        <PhotoViewer src={product.imageUrl} alt={product.title}>
          <span className="relative block aspect-[4/5]">
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              sizes="(min-width: 1536px) 22rem, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
              loading={eager ? "eager" : "lazy"}
              fetchPriority={eager ? "high" : undefined}
            />
          </span>
        </PhotoViewer>
      </div>
      <div className="grid grid-cols-1 grid-rows-[auto_auto_1fr] gap-1 p-4">
        <h3 className="font-display text-piece">{product.title}</h3>
        <p className="text-price font-semibold tabular-nums">
          {formatPrice(product.price)}
        </p>
        <a
          className="btn btn-primary mt-2 w-full self-end"
          href={contactUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppIcon />
          Consulta
        </a>
      </div>
    </article>
  );
}
