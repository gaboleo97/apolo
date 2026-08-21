# Apolo

Plataforma modular de gestión empresarial (inventario, ventas, compras, contabilidad, facturación y AI analytics).

## Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: Next.js 15 (App Router) · React 19 · MUI 9 (`apps/web`)
- **Backend/DB**: Drizzle ORM + PostgreSQL (`packages/database`)
- **Auth**: NextAuth v5 (credentials, bcrypt) (`packages/auth`)
- **Paquetes**: `core` (tRPC/tipos), `email` (Resend), `ui`, `modules/*` (dominios)
- **Deploy**: Vercel (frontend) + Supabase (PostgreSQL) · CI/CD por integración Git
- **Planeamiento**: OpenSpec (`/opsx:*` en opencode)

## Requisitos

- Node.js ≥ 20 (recomendado 24)
- pnpm ≥ 11 (`corepack enable pnpm` o `npm i -g pnpm`)
- Docker Desktop (para Supabase local)
- Supabase CLI (`brew install supabase/tap/supabase`)

## Configuración de variables de entorno

```bash
cp .env.example .env.local   # solo si querés sobreescribir las locales (opcional)
```

`apps/web` lee las variables desde la raíz. Las claves que usa la app:

| Variable | Local | Producción |
|---|---|---|
| `DATABASE_URL` | Supabase local (`:54322`) | Pooler/directo de Supabase Cloud |
| `AUTH_SECRET` | valor local cualquiera | secreto fuerte en Vercel |
| `AUTH_URL` | `http://localhost:3000` | dominio de Vercel |
| `NEXT_PUBLIC_SUPABASE_*` | — | Supabase Cloud (solo si usás la API/edge) |
| `RESEND_API_KEY` | tu API key de Resend | API key de Resend en Vercel |
| `EMAIL_FROM` | `Apolo <onboarding@resend.dev>` (dev) | `Apolo <noreply@tudominio>` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | para `db:seed` | para `db:seed` |

## Entorno LOCAL

```bash
# 1) Levantar Supabase local (Postgres :54322, Studio :54323, API :54321)
supabase start

# 2) Instalar dependencias
pnpm install

# 3) Aplicar migraciones a la DB local
DATABASE_URL="postgres://postgres:postgres@localhost:54322/postgres" \
  pnpm --filter @apolo/database db:migrate

# 4) Seed de admin (local) — SEED_ADMIN_PASSWORD es obligatoria
DATABASE_URL="postgres://postgres:postgres@localhost:54322/postgres" \
  SEED_ADMIN_PASSWORD="tu-clave-fuerte" \
  pnpm --filter @apolo/database db:seed
# → crea admin@apolo.app (super_admin) con la clave que definiste

# 5) Levantar el dev server
pnpm dev
# → http://localhost:3000 (o :3001 si 3000 está ocupado)
```

### Ver la base de datos local

- **Supabase Studio**: http://127.0.0.1:54323
- **Drizzle Studio**: `pnpm --filter @apolo/database db:studio`

### Scripts útiles (package `@apolo/database`)

```bash
pnpm --filter @apolo/database db:generate   # genera SQL de migración desde el schema
pnpm --filter @apolo/database db:migrate    # aplica migraciones
pnpm --filter @apolo/database db:push       # sincroniza schema (sin archivos)
pnpm --filter @apolo/database db:seed       # crea el admin (usa SEED_ADMIN_*)
```

## Entorno PRODUCCIÓN (Vercel + Supabase Cloud)

La app vive en **https://apolo-web-nine.vercel.app**. El repo GitHub `gaboleo97/apolo`
está conectado al proyecto Vercel → **push a `main` = deploy automático**.

### Publicar un cambio

```bash
git add -A
git commit -m "feat/desc: ..."
git push origin main      # Vercel buildea y despliega solo
```

### Base de datos de producción (Supabase Cloud)

Con tu sesión de Supabase (`supabase login`):

```bash
# 1) Ver el proyecto (ref aabmvacqvnanokzxxlvz) y su estado
supabase projects list

# 2) Aplicar migraciones a la nube (usar la URL directa/pooler de la DB)
DATABASE_URL="postgres://postgres.<ref>:<password>@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require" \
  pnpm --filter @apolo/database db:migrate

# 3) Seed del admin en la nube — SEED_ADMIN_PASSWORD es obligatoria
DATABASE_URL="<url-de-la-nube>" SEED_ADMIN_EMAIL="admin@apolo.app" SEED_ADMIN_PASSWORD="<clave-fuerte>" \
  pnpm --filter @apolo/database db:seed
```

### Variables de entorno en Vercel

Se configuran con `vercel env add <NOMBRE> production` (o desde el dashboard).

| Variable | Valor |
|---|---|
| `DATABASE_URL` | URL directa/pooler de la DB cloud (sin `pgbouncer`) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://apolo-web-nine.vercel.app` |
| `AUTH_TRUST_HOST` | `true` |
| `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` / `SERVICE_ROLE_KEY` | del proyecto Supabase |

> Nota: si pausás el proyecto Supabase, la app deja de conectar hasta que se reactive
> (status `COMING_UP`/`RESTORING`). Los proyectos free se pausan por inactividad.

## Verificación rápida

```bash
# Local
curl -X POST http://localhost:3000/api/register -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"t@apolo.app","password":"secret123"}'

# Producción
curl -X POST https://apolo-web-nine.vercel.app/api/register -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"t@apolo.app","password":"secret123"}'
```

## Calidad

```bash
pnpm typecheck   # tsc en todos los paquetes (debe pasar 12/12)
pnpm lint        # next lint
pnpm build       # build de producción
```

## OpenSpec (SDD — Spec-Driven Development)

El repo usa [OpenSpec](https://openspec.dev/) para planificar cambios antes de escribir código.

### Flujo de trabajo (en opencode)

```
/opsx:explore                # (opcional) pensar/discutir la idea antes de proponer
/opsx:propose <nombre>       # genera proposal.md, design.md, tasks.md y el delta de spec
  └─ revisá y ajustá los artefactos antes de tocar código
/opsx:apply                  # implementa las tasks
/opsx:archive                # mergea el delta en specs/ y archiva el cambio
```

- **`openspec/specs/`**: fuente de verdad del comportamiento (una spec por capacidad: `auth-login`, `tenancy`, ...).
- **`openspec/changes/`**: cambios propuestos (uno por carpeta); al archivar pasan a `changes/archive/`.

### Comandos CLI

```bash
openspec validate --specs    # valida las specs
openspec list                # lista cambios activos
openspec show <cambio>       # detalle de un cambio
openspec view                # dashboard interactivo
```

### Convención de commits

Commits siguen [Conventional Commits](https://github.com/conventional-changelog/commitlint):
`tipo(scope): descripción` con `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, etc.