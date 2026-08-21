## 1. Modelo de datos y tipos

- [x] 1.1 Agregar `modules` (jsonb `string[]`, nullable) a `users` en `packages/database/src/schema/core.ts` y verificar con `pnpm --filter @apolo/database db:generate` que se crea la migración
- [x] 1.2 Extender `ModuleKey` en `packages/core/src/types.ts` con `clients` y `suppliers` y verificar con `pnpm typecheck` que no rompe tipos
- [x] 1.3 Agregar `roleDefaultModules` (mapeo rol → módulos) y `modules` al tipo `Session` en `packages/core/src/types.ts`, verificando `pnpm typecheck`

## 2. Sesión y auth

- [x] 2.1 En `packages/auth/src/auth.ts`, calcular módulos efectivos (`user.modules ?? roleDefaultModules[user.role]`) e incluir `modules` en `jwt` y `session`; verificar con `pnpm --filter @apolo/auth typecheck`
- [x] 2.2 Asegurar que `Session` de next-auth (augmentation en `packages/auth/src/types.ts`) incluya `modules`; verificar typecheck

## 3. Enforcement de sesión y módulos

- [x] 3.1 Crear `apps/web/middleware.ts` con el wrapper `auth` protegiendo `/dashboard/*` (redirect a `/login` sin sesión); verificar abriendo `/dashboard` deslogueado → redirige a `/login`
- [x] 3.2 Cargar sesión en el layout del dashboard y pasar `modules` + `role` a la sidebar; verificar que el menú se filtra por módulos y Dashboard siempre aparece
- [x] 3.3 Agregar guard server-side en las páginas de módulo (sin permiso → redirect a `/dashboard`); verificar que un usuario sin módulo `accounting` no entra a `/dashboard/accounting`
- [x] 3.4 Agregar al menú las entradas `Clientes` y `Proveedores` (módulos `clients`/`suppliers`); verificar que aparecen solo con el módulo asignado

## 4. Administración del equipo

- [x] 4.1 Crear API de equipo (listar/crear/editar usuarios del tenant) con validación de rol `tenant_admin` y de `ModuleKey` en los módulos; verificar con curl que lista solo usuarios del tenant y valida módulos
- [x] 4.2 Crear página `/dashboard/team` (listado + alta/edición de usuario con rol y módulos); verificar que `tenant_admin` ve su equipo y un `seller`/`viewer` es redirigido

## 5. Aislamiento por tenant

- [x] 5.1 Corregir `listProducts`, `getProduct` y `listCategories` en `packages/modules/inventory/src/router.ts` para filtrar por `ctx.session.tenantId`; verificar que un tenant no ve productos de otro
- [x] 5.2 Ejecutar `pnpm typecheck` (12/12) y `pnpm --filter @apolo/web build` y verificar que ambos pasan

## 6. Migración y despliegue

- [x] 6.1 Aplicar la migración en local y en Supabase Cloud con `pnpm --filter @apolo/database db:migrate`; verificar que la columna `users.modules` existe en ambas
- [x] 6.2 Commit (convencional) + push y verificar deploy Ready en Vercel y login/roles funcionando en producción
