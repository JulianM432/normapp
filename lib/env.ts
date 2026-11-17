import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.url(),
  BLOB_READ_WRITE_TOKEN: z
    .string()
    .optional()
    .transform((value) => value || undefined),
  CONTACT_PHONE: z.string().regex(/^\d{10,15}$/, "Solo dígitos, formato internacional sin + ni 15"),
  ADMIN_PIN_HASH: z.string().min(1),
  SESSION_SECRET: z.string().min(32, "Usá al menos 32 caracteres aleatorios"),
  NEXT_PUBLIC_SITE_URL: z.url(),
}).refine((value) => value.BLOB_READ_WRITE_TOKEN || !process.env.VERCEL, {
  path: ["BLOB_READ_WRITE_TOKEN"],
  message: "En Vercel es obligatorio: el disco no persiste las fotos",
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
      throw new Error(`Variables de entorno inválidas:\n${issues}`);
    }
    cached = parsed.data;
  }
  return cached;
}
