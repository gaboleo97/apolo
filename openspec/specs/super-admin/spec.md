# super-admin Specification

## Purpose
Permitir al rol `super_admin` administrar globalmente la plataforma: ver y crear
tenants y ver y editar todos los usuarios, incluyendo su tenant, rol y módulos.

## Requirements

### Requirement: Gestión global de tenants

El sistema SHALL permitir al `super_admin` listar y crear tenants.

#### Scenario: Listar tenants

- GIVEN un usuario con rol `super_admin`
- WHEN consulta la lista de tenants
- THEN ve todos los tenants de la plataforma

#### Scenario: Crear tenant

- GIVEN un usuario con rol `super_admin`
- WHEN crea un tenant con nombre, país y plan
- THEN se genera un slug único y el tenant queda activo

### Requirement: Gestión global de usuarios

El sistema SHALL permitir al `super_admin` listar y editar todos los usuarios de la plataforma.

#### Scenario: Listar todos los usuarios

- GIVEN un usuario con rol `super_admin`
- WHEN consulta la lista de usuarios
- THEN ve los usuarios de todos los tenants, con su tenant, rol y módulos

#### Scenario: Reasignar tenant

- GIVEN un usuario con rol `super_admin`
- WHEN edita un usuario cambiando su tenant
- THEN el usuario queda asociado al nuevo tenant

#### Scenario: Otorgar super_admin

- GIVEN un usuario con rol `super_admin`
- WHEN asigna el rol `super_admin` a otro usuario
- THEN ese usuario obtiene el rol `super_admin`

### Requirement: Acceso restringido al super_admin

El sistema SHALL restringir la gestión global al rol `super_admin`.

#### Scenario: Acceso denegado a no super_admin

- GIVEN un usuario sin rol `super_admin`
- WHEN intenta acceder a `/dashboard/admin` o a `/api/admin/*`
- THEN el sistema deniega el acceso (403 o redirige a `/dashboard`)

### Requirement: Roles asignables por el administrador

El sistema SHALL impedir que un `tenant_admin` otorgue el rol `super_admin`.

#### Scenario: tenant_admin no puede dar super_admin

- GIVEN un usuario con rol `tenant_admin`
- WHEN intenta crear o editar un usuario asignándole el rol `super_admin`
- THEN el sistema rechaza la operación (403)

#### Scenario: super_admin puede dar cualquier rol

- GIVEN un usuario con rol `super_admin`
- WHEN asigna cualquier rol a un usuario
- THEN la operación es aceptada
