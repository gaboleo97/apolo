## MODIFIED Requirements

### Requirement: Administración del equipo

El sistema SHALL permitir al `tenant_admin` gestionar los usuarios de su tenant,
sin poder otorgar el rol `super_admin` ni cambiar el tenant de un usuario.

#### Scenario: Listar usuarios del tenant

- GIVEN un usuario con rol `tenant_admin`
- WHEN accede a `/dashboard/team`
- THEN ve únicamente los usuarios de su propio tenant

#### Scenario: Asignar rol y módulos

- GIVEN un usuario con rol `tenant_admin`
- WHEN edita un usuario de su tenant
- THEN puede asignar rol (salvo `super_admin`) y módulos a ese usuario

#### Scenario: Acceso denegado a no-admins

- GIVEN un usuario sin rol `tenant_admin`
- WHEN intenta acceder a `/dashboard/team`
- THEN es redirigido a `/dashboard`

#### Scenario: No puede otorgar super_admin

- GIVEN un usuario con rol `tenant_admin`
- WHEN intenta asignar el rol `super_admin` a un usuario
- THEN el sistema rechaza la operación
