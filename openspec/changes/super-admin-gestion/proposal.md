## Why

El `super_admin` hoy no puede gestionar la plataforma: no hay forma de listar
todos los tenants, ver todos los usuarios ni reasignar el tenant, rol o módulos
de un usuario fuera de su propio tenant. Además, un `tenant_admin` puede
actualmente otorgar el rol `super_admin` (fuga de privilegios). El super_admin
necesita una pantalla global para administrar tenants y usuarios.

## What Changes

- Nueva API `/api/admin/*` (solo `super_admin`): listar/crear tenants, listar
  todos los usuarios y asignar `tenant`, `role`, `modules` e `isActive`.
- Nueva pantalla `/dashboard/admin` (solo `super_admin`) con tabs de Tenants y
  Usuarios.
- Helper `requireSuperAdmin()`.
- Fix de seguridad: `tenant_admin` no puede otorgar el rol `super_admin`; solo
  `super_admin` puede otorgar `super_admin` y cambiar el tenant de un usuario.
- Sidebar: ítem "Administración" visible solo para `super_admin`.

## Capabilities

### New Capabilities

- `super-admin`: gestión global de la plataforma (tenants y usuarios) reservada
  al rol `super_admin`.

### Modified Capabilities

- `access-control`: los roles ahora restringen qué roles puede asignar cada
  administrador (un `tenant_admin` no puede otorgar `super_admin`).

## Impact

- `apps/web/app/api/admin/*`: nuevos endpoints.
- `apps/web/app/dashboard/admin/*`: nueva pantalla.
- `apps/web/app/api/team/*`: restricción de roles asignables por `tenant_admin`.
- `apps/web/app/dashboard/access.ts`: `requireSuperAdmin`.
- `apps/web/app/dashboard/shell.tsx`: ítem de menú para super_admin.
