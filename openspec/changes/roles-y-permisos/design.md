## Context

Apolo es un SaaS multi-tenant (NextAuth v5 credentials + Drizzle/PostgreSQL).
Hoy: `tenants.modules_enabled` (por plan), `users.role`, sesión con
`id/tenantId/role`. No hay middleware, la sidebar es estática y el router de
inventario no filtra por tenant. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- Modelo de acceso por módulo a nivel usuario (rol base + override).
- Exponer módulos efectivos en la sesión para filtrar UI y guardar rutas.
- Pantalla `/dashboard/team` para que `tenant_admin` administre su equipo.
- Aislamiento por tenant en las queries existentes.

**Non-Goals:**
- No se construye la funcionalidad de cada módulo (inventario, ventas, etc.);
  solo el control de acceso y las entradas de menú.
- No se implementa límite por plan (`tenants.modules_enabled`) como techo aún;
  queda documentado como nota para un cambio futuro.
- No se toca el envío de emails (cambio `emails-transaccionales` aparte).

## Decisions

### 1. Módulos por usuario como `users.modules` (jsonb `string[]`, nullable)

Almacenar la lista efectiva de módulos en el usuario. `null` → defaults del rol;
valor presente → override. Alternativa considerada: tabla join
`user_modules` (más normalizada pero más compleja y con más queries para un
escenario simple de "lista de módulos por usuario"). Se elige jsonb por
simplicidad y porque se lee siempre junto al usuario.

### 2. Defaults de rol como constante en código (`roleDefaultModules`)

Los módulos por defecto de cada rol viven en `packages/core` como constante TS.
Alternativa: tabla en DB (`role_modules`) para que el admin los edite. Se
descarta por ahora: no es un requisito y añade superficie de UI/administración
sin demanda. Si el usuario pide configurables por tenant, migramos a tabla.

### 3. Cálculo de módulos efectivos en los callbacks de NextAuth

En `jwt`/`session` de `packages/auth/src/auth.ts` se calcula
`modules = user.modules ?? roleDefaultModules[user.role]` y se incluye en el
token/sesión. Ventaja: se resuelve una sola vez al autenticar y queda disponible
para el server (middleware/pages) y el cliente (sidebar). Alternativa: calcular
en cada request (más consistente ante cambios de rol sin re-login, pero más
costoso). Trade-off documentado abajo.

### 4. Enforcement en dos capas: middleware + guard en layout/páginas

- `apps/web/middleware.ts` (NextAuth `auth` wrapper): protege `/dashboard/*`
  → sin sesión, redirect `/login`. Maneja sesión, no módulos.
- Guard de módulo: en el layout del dashboard se lee la sesión (server) y se
  pasa `modules` al cliente para filtrar la sidebar; cada página de módulo
  valida acceso y redirige a `/dashboard` si no corresponde.

Se separa porque el middleware no debe (ni conviene) evaluar la lógica de
módulos por rol; el guard de módulo vive junto a las páginas.

### 5. `ModuleKey` extendido con `clients` y `suppliers`

Módulos separados por decisión de producto. Se agregan al tipo y al menú. Las
rutas se crean en cambios futuros (hoy el resto de módulos ya 404 igual).

### 6. Scoping por tenant en el router de inventario

`listProducts`/`getProduct`/`listCategories` deben filtrar por
`ctx.session.tenantId`. `createProduct` ya lo inyecta en el insert. Se corrige
el read-path para cerrar la fuga de datos entre tenants.

## Risks / Trade-offs

- [Módulos calculados solo al autenticar] Si el admin cambia el rol/módulos de un
  usuario activo, no se refleja hasta re-login → Mitigación: al guardar cambios
  en `/dashboard/team`, forzar re-login o usar `session` con `update()`; aceptable
  para v1.
- [Sidebar filtra en cliente] Un usuario podría manipular el estado del cliente →
  Mitigación: el guard server-side en cada página de módulo es la fuente de
  verdad; la sidebar es solo UX.
- [jsonb sin validación fuerte] `users.modules` podría contener claves inválidas →
  Mitigación: validar contra `ModuleKey` en la capa de API de `/dashboard/team`.
- [Nuevos módulos sin ruta] Entradas de menú a rutas aún no implementadas → los
  módulos se agregan pero las páginas siguen 404 hasta su cambio correspondiente.

## Migration Plan

1. Migración Drizzle: agregar `users.modules` (jsonb, nullable). No destructiva;
   `null` mantiene el comportamiento por-rol de forma retrocompatible.
2. Desplegar código (el campo nuevo es opcional y el default es por-rol).
3. Rollback: la columna es aditiva; revertir código no rompe la DB.
