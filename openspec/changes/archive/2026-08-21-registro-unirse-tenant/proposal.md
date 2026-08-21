## Why

El registro actual solo permite crear una empresa nueva (auto-servicio). No hay
forma de que un usuario se una a un tenant existente. El `tenant_admin` necesita
invitar personas a su empresa con un rol y módulos ya definidos, y que el invitado
se registre quedando asociado a ese tenant.

## What Changes

- Nueva tabla `tenant_invitations` (tenant, email opcional, rol + módulos
  pre-asignados, token único con expiración, estado usado).
- El `tenant_admin` (y `super_admin`) genera invitaciones desde `/dashboard/team`
  (elige rol + módulos y, opcionalmente, email) y obtiene un link para compartir.
- El registro detecta el parámetro `?invite=<token>` y muestra el modo
  "Unirme a una empresa" (nombre, email, contraseña).
- `POST /api/register/join` acepta el token y crea el usuario en el tenant con el
  rol y módulos de la invitación; la invitación queda marcada como usada.
- Invitación válida por 7 días; solo el email indicado (si se especificó) puede usarla.

## Capabilities

### New Capabilities

- `tenant-invitations`: crear, compartir y aceptar invitaciones a un tenant con
  rol y módulos pre-asignados.

### Modified Capabilities

- `auth-login`: el registro ahora soporta unirse a un tenant existente mediante
  invitación, además de crear una empresa nueva.

## Impact

- `packages/database`: tabla `tenant_invitations` + migración.
- `packages/auth`: `createTenantInvitation`, `acceptInvitation`,
  `listTenantInvitations`.
- `apps/web`: `GET/POST /api/team/invitations`, `POST /api/register/join`,
  cambios en `/register` y en `/dashboard/team`.
