## Context

El `super_admin` existe como rol pero sin capacidades globales: `/api/team` y
`/dashboard/team` están scopeados a `admin.tenantId`. La sidebar muestra "Equipo"
a `tenant_admin` y `super_admin` por igual. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- API y pantalla globales de administración para `super_admin`.
- Regla de privilegios: solo `super_admin` otorga `super_admin` y cambia tenant.

**Non-Goals:**
- No se toca el flujo de registro ni las invitaciones (cambio `registro-unirse-tenant`).
- No se gestionan planes/suscripciones de tenants (futuro).

## Decisions

### 1. Roles asignables según el actor

Se define `assignableRoles(actorRole)`:
- `super_admin` → puede asignar `super_admin | tenant_admin | manager | seller | viewer`.
- `tenant_admin` → puede asignar `tenant_admin | manager | seller | viewer` (sin `super_admin`).

Se implementa en la capa de ruta (`/api/team` y `/api/admin`). Alternativa: en
`@apolo/auth`; se descarta para no mezclar la regla con la lógica de persistencia.

### 2. `requireSuperAdmin()` en el helper de acceso

Nuevo helper server-side junto a `requireTenantAdmin`. Reusa `auth()` y redirige
a `/dashboard` si el rol no es `super_admin`.

### 3. API `/api/admin/*` sin schema nuevo

Usa `users` y `tenants` existentes. `PATCH /api/admin/users/[id]` acepta
`tenantId`, `role`, `modules`, `isActive`. `POST /api/admin/tenants` genera slug
con la misma lógica que el registro (nombre + sufijo aleatorio).

### 4. Pantalla `/dashboard/admin` con tabs

Un solo server component que verifica `super_admin` y renderiza un client
component con dos tabs (Tenants / Usuarios) usando Tabs de MUI. Los datos se
cargan por fetch a `/api/admin/*`.

### 5. Sidebar: separar "Equipo" de "Administración"

- `Equipo` → visible para `tenant_admin` (y super_admin si está en un tenant).
- `Administración` → visible solo para `super_admin`.

## Risks / Trade-offs

- [super_admin con tenantId] El schema exige `tenantId` no nulo; el super_admin
  vive en un tenant "plataforma" (Apolo HQ) → Mitigación: la lógica global
  ignora el tenant del actor para listar/editar todo.
- [Exponer todos los usuarios] La API global lista datos de todas las pymes →
  Mitigación: protegida por `requireSuperAdmin` y el guard de rol.
- [Editar rol de otro super_admin] Un super_admin podría degradarse a sí mismo →
  Mitigación: en v1 se acepta; se puede impedir en el futuro.

## Migration Plan

1. Sin migraciones de schema.
2. Desplegar código + fix de seguridad.
3. Rollback: revertir código; no hay cambios de datos.
