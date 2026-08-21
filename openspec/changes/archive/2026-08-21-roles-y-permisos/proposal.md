## Why

Apolo se vende a pymes para gestionar finanzas, ventas, inventario, compras,
proveedores y clientes. Hoy cualquier usuario autenticado ve todos los módulos
del menú y no hay control de quién accede a qué, ni aislamiento real por tenant
(el router de inventario no filtra por `tenantId`). Necesitamos control de acceso
por rol y por módulo para que el `tenant_admin` decida qué ve cada usuario de su
equipo, y que cada tenant vea solo su propia información.

## What Changes

- Agregar `users.modules` (jsonb `string[]`) para el acceso a módulos por usuario
  (override). Si es `null`, aplican los módulos por defecto del rol.
- Extender `ModuleKey` con `clients` y `suppliers` (módulos separados).
- Definir `roleDefaultModules`: módulos por defecto de cada rol (`tenant_admin`,
  `manager`, `seller`, `viewer`, `super_admin`).
- Exponer los módulos efectivos (defaults + override) en la sesión/JWT de NextAuth.
- Agregar middleware que proteja `/dashboard/*` (sin sesión → `/login`).
- Filtrar la sidebar por los módulos del usuario; el Dashboard es siempre visible.
- Guard en las páginas de módulo: sin permiso → redirigir a `/dashboard`.
- Nueva pantalla `/dashboard/team` (solo `tenant_admin`) para listar/crear/editar
  usuarios del tenant y asignar rol + módulos.
- Corregir aislamiento por tenant en el router de inventario (queries scoped por
  `tenantId`).

## Capabilities

### New Capabilities

- `access-control`: control de acceso por módulo y por rol, defaults por rol,
  override por usuario, enforcement de sesión/módulo/tenant.

### Modified Capabilities

- `tenancy`: el acceso por módulo ahora es por usuario (dentro del tenant) y los
  roles determinan un conjunto base de módulos; el `tenant_admin` administra el
  equipo de su tenant.

## Impact

- `packages/database`: migración para `users.modules`.
- `packages/core`: `ModuleKey`, `roleDefaultModules`, tipo `Session.modules`.
- `packages/auth`: cálculo de módulos efectivos en `jwt`/`session`.
- `apps/web`: `middleware.ts`, layout/sidebar del dashboard, página `/dashboard/team`,
  guard de módulo.
- `packages/modules/inventory`: scoping por `tenantId` en queries.
