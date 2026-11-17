# normapp

Challenge propuesto por Goncy Pozzo. Espero te guste, Tía Norma.

- **Catálogo:** https://normapp.vercel.app
- **Panel:** https://normapp.vercel.app/panel

## Correr en local

### Requisitos

- **Node.js 22** o superior
- **pnpm** (el proyecto fija la versión en `packageManager`; con `corepack enable` se instala sola)
- Una base de datos **Postgres**: puede ser local (con Docker) o en [Neon](https://neon.tech)
- Para las fotos: nada, o un store de **[Vercel Blob](https://vercel.com/docs/storage/vercel-blob)** si querés usar el mismo almacenamiento que producción

La app elige el driver según `DATABASE_URL`: si el host termina en `.neon.tech` usa el driver HTTP de Neon, y para cualquier otro Postgres usa `node-postgres`.

Para las fotos pasa algo parecido: si `BLOB_READ_WRITE_TOKEN` está vacío, se guardan en la carpeta `.uploads/` del proyecto y la app las sirve en `/uploads/...`. Si tiene un token, van a Vercel Blob. **Con Docker y sin token, la app corre entera sin ninguna cuenta externa.**

#### Postgres local con Docker

```bash
docker run -d --name normapp-db -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=normapp postgres:17
```

Con eso, la URL es `postgres://postgres:postgres@localhost:5432/normapp`.

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Completá `.env.local`:

| Variable | Qué es | Cómo obtenerla |
| --- | --- | --- |
| `DATABASE_URL` | Connection string de Postgres | Local: `postgres://postgres:postgres@localhost:5432/normapp`. Neon: Dashboard → *Connection string* |
| `BLOB_READ_WRITE_TOKEN` | Token de Vercel Blob (opcional en local) | Vacío: fotos en `.uploads/`. Con Blob: Vercel → *Storage* → tu Blob store → *.env.local* |
| `CONTACT_PHONE` | Número de WhatsApp al que escriben los clientes | Solo dígitos, formato internacional sin `+` ni `15` (ej. `5491122334455`) |
| `ADMIN_PIN_HASH` | Hash del PIN de 6 números para entrar a `/panel` | `pnpm pin:hash 123456` (ver abajo) |
| `SESSION_SECRET` | Clave para firmar la cookie de sesión | Mínimo 32 caracteres: `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | URL pública de la app | `http://localhost:3000` en local |

Para generar el hash del PIN:

```bash
pnpm pin:hash 123456
# ADMIN_PIN_HASH=scrypt:...
```

Copiá la línea que imprime en `.env.local`. Ese PIN (`123456` en el ejemplo) es el que vas a usar para entrar al panel.

Si falta alguna variable o tiene un formato inválido, la app lo avisa al arrancar con un mensaje que indica cuál es.

### 3. Crear las tablas

```bash
pnpm db:push
```

### 4. Cargar productos de ejemplo (opcional)

```bash
pnpm seed
```

Sube las fotos de `seed/images` (a `.uploads/` o a Vercel Blob, según el token) y crea las piezas de `seed/products.json`. Si lo corrés de nuevo, saltea las que ya existen. Para vaciar el catálogo (base y fotos) y volver a cargarlo:

```bash
pnpm seed:reset
```

### 5. Levantar la app

```bash
pnpm dev
```

- Catálogo: http://localhost:3000
- Panel: http://localhost:3000/panel (pide el PIN del paso 2)

### Otros scripts

| Script | Qué hace |
| --- | --- |
| `pnpm build` / `pnpm start` | Build y servidor de producción |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Genera los tipos de rutas y corre `tsc` |
| `pnpm db:studio` | Abre Drizzle Studio para ver la base |

## Stack

- **[Next.js 16](https://nextjs.org)** (App Router, Cache Components, Server Actions) con **React 19**
- **TypeScript**
- **[Tailwind CSS 4](https://tailwindcss.com)**
- **[Drizzle ORM](https://orm.drizzle.team)** + **drizzle-kit** sobre **Postgres**: **[Neon](https://neon.tech)** (serverless, driver HTTP) en producción y `node-postgres` para cualquier otro Postgres
- **[Vercel Blob](https://vercel.com/docs/storage/vercel-blob)** para las imágenes en producción, y disco local (`.uploads/`) en desarrollo sin token
- **[Zod](https://zod.dev)** para validar formularios y variables de entorno
- **[sharp](https://sharp.pixelplumbing.com)** para procesar las fotos del seed
- **[Lucide](https://lucide.dev)** para los íconos
- Autenticación del panel con PIN hasheado con `scrypt` y cookie de sesión firmada con HMAC
- Deploy en **[Vercel](https://vercel.com)**
