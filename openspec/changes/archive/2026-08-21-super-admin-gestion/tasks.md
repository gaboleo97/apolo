## 1. Helpers y seguridad

- [x] 1.1 Agregar `requireSuperAdmin()` en `apps/web/app/dashboard/access.ts` y verificar typecheck
- [x] 1.2 Definir `assignableRoles(actorRole)` y usarlo en `/api/team` para que `tenant_admin` no pueda asignar `super_admin`; verificar con curl que un tenant_admin recibe 403 al intentar crear un super_admin

## 2. API de administración

- [x] 2.1 Crear `GET/POST /api/admin/tenants` (listar/crear tenant con slug único) y verificar con curl
- [x] 2.2 Crear `GET /api/admin/users` (listar todos los usuarios con tenant, filtro por `tenantId`) y verificar con curl
- [x] 2.3 Crear `PATCH /api/admin/users/[id]` (tenant, role, modules, isActive) y verificar con curl que reasigna tenant/rol
- [x] 2.4 Verificar que `/api/admin/*` responde 403 para un usuario sin rol `super_admin`

## 3. Pantalla de administración

- [x] 3.1 Crear `/dashboard/admin` (server) con `requireSuperAdmin()` y verificar que un no-admin es redirigido
- [x] 3.2 Crear el client component con tabs Tenants/Usuarios (listar + crear tenant + editar usuario) y verificar que renderiza

## 4. Sidebar

- [x] 4.1 Agregar ítem "Administración" visible solo para `super_admin` en `apps/web/app/dashboard/shell.tsx` y verificar que aparece solo con ese rol

## 5. Verificación

- [x] 5.1 Ejecutar `pnpm typecheck` (12/12) y `pnpm --filter @apolo/web build` y verificar que ambos pasan
- [x] 5.2 Probar flujo completo local: super_admin crea tenant, reasigna un usuario a ese tenant y le cambia rol/módulos; verificar login de ese usuario
- [x] 5.3 Commit (convencional) + push y verificar deploy Ready en Vercel
