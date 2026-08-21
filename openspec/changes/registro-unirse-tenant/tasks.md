## 1. Modelo de datos

- [x] 1.1 Agregar tabla `tenant_invitations` en `packages/database/src/schema/core.ts` y verificar con `pnpm --filter @apolo/database db:generate` que se crea la migración

## 2. Lógica de invitaciones

- [x] 2.1 Crear `packages/auth/src/invitations.ts` con `createTenantInvitation`, `acceptInvitation` y `listTenantInvitations` y verificar typecheck
- [x] 2.2 Exportar desde `packages/auth/src/index.ts` y verificar typecheck

## 3. Endpoints

- [x] 3.1 Crear `GET/POST /api/team/invitations` (tenant_admin/super_admin) y verificar con curl que crea y lista invitaciones
- [x] 3.2 Crear `POST /api/register/join` (acepta token) y verificar con curl que un token válido crea el usuario con el rol/módulos de la invitación

## 4. UI

- [x] 4.1 Actualizar `/register` para soportar el modo invitación (`?invite=`) y verificar que renderiza ambos modos
- [x] 4.2 Agregar sección de invitaciones en `/dashboard/team` (crear + listar + copiar link) y verificar que renderiza

## 5. Verificación

- [x] 5.1 Ejecutar `pnpm typecheck` (12/12) y `pnpm --filter @apolo/web build` y verificar que ambos pasan
- [x] 5.2 Aplicar migración en local y Supabase Cloud y verificar la tabla `tenant_invitations`
- [x] 5.3 Flujo completo local: crear invitación → registrarse con el link → login → verificar rol/módulos del usuario
- [x] 5.4 Commit (convencional) + push y verificar deploy Ready en Vercel
