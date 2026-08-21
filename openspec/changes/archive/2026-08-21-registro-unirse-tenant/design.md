## Context

El registro auto-servicio (`registerUser`) crea tenant + `tenant_admin`. La
gestión de equipo (`/api/team`) crea usuarios dentro del tenant del admin con
contraseña directa (no hay invitación). Falta el flujo "unirse a un tenant" con
rol pre-asignado. Ver `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Invitación con rol + módulos + email opcional + expiración (7 días).
- Registro por invitación (`?invite=<token>`).
- Listar/crear invitaciones desde `/dashboard/team`.

**Non-Goals:**
- No se gestiona reenvío/cancelación de invitaciones en UI (solo listar/crear).
- No se envían emails de invitación en esta iteración (el link se copia y comparte).

## Decisions

### 1. Token crudo en DB, expiración 7 días

A diferencia del reset de contraseña (hash), el token de invitación se guarda en
claro porque el equipo necesita reconstruir el link para mostrarlo/copiarlo. Es
de menor riesgo: expira, es de un solo uso y el `usedAt` lo inhabilita.

### 2. `acceptInvitation` valida token + email + expiración en una transacción

Se consulta la invitación válida, se crea el usuario (con el rol y módulos de la
invitación) y se marca `usedAt`. Si el email ya existe o el token no es válido,
retorna error. Se usa transacción para evitar doble uso.

### 3. Registro con dos modos (mismo endpoint de UI)

`/register` lee `?invite=<token>` (con Suspense). Si hay token → muestra
"Unirme a una empresa" y postea a `/api/register/join`. Si no → "Crear empresa"
y postea a `/api/register`.

### 4. Invitaciones en `/api/team/invitations`

`GET` lista las invitaciones del tenant (con estado y link). `POST` crea una
invitación (rol + módulos + email opcional). Protegido como `/api/team`
(`tenant_admin` o `super_admin`). El rol asignable respeta `assignableRoles`.

## Risks / Trade-offs

- [Token en claro] Cualquiera con el link puede unirse hasta que se use →
  Mitigación: expira en 7 días, un solo uso, y si se define email, lo restringe.
- [Invitación a rol privilegiado] Un `tenant_admin` podría invitar con rol
  `tenant_admin` → Mitigación: aceptable (co-admins); `super_admin` no se permite
  vía `assignableRoles`.

## Migration Plan

1. Migración aditiva: tabla `tenant_invitations`.
2. Desplegar. Rollback: revertir código; la tabla extra no afecta.
