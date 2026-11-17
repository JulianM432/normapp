import { z } from "zod";

export const TITLE_MAX = 60;
export const PRICE_MIN = 1;
export const PRICE_MAX = 10_000_000;

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase("es-AR") + value.slice(1);
}

export const titleSchema = z
  .string()
  .transform((v) => capitalize(v.replace(/\s+/g, " ").trim().replace(/[.\s]+$/, "")))
  .pipe(
    z
      .string()
      .min(1, "Escribí el nombre de la pieza")
      .max(TITLE_MAX, `El nombre es muy largo. Usá hasta ${TITLE_MAX} letras`),
  );

export const priceSchema = z
  .union([z.number(), z.string()])
  .transform((v) => (typeof v === "number" ? v : Number(v.replace(/\D/g, "") || NaN)))
  .pipe(
    z
      .number({ error: "Escribí el precio en números" })
      .int("Escribí el precio sin centavos")
      .min(PRICE_MIN, "Escribí el precio de la pieza")
      .max(PRICE_MAX, "Ese precio es muy alto. Revisalo"),
  );

export const productInputSchema = z.object({
  title: titleSchema,
  price: priceSchema,
});

export type ProductInput = z.output<typeof productInputSchema>;
