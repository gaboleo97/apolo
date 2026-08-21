# Tenancy: multi-tenant y roles

## Purpose

Definir el modelo multi-tenant de Apolo: cada empresa es un `tenant` y cada
usuario pertenece a un tenant con un rol que determina su nivel de acceso.

## Requirements

### Requirement: Aislamiento por tenant

El sistema SHALL agrupar usuarios, datos y módulos por `tenant`.

#### Scenario: Tenant creado por el super_admin

- GIVEN un usuario con rol `super_admin`
- WHEN crea un tenant
- THEN el tenant queda activo con su plan, país y slug
- AND los usuarios se asocian a ese tenant al registrarse con su código

#### Scenario: Slug único

- GIVEN un tenant nuevo
- THEN su `slug` es único; el super_admin puede definirlo (código limpio) o se genera automáticamente

### Requirement: Roles de usuario

El sistema SHALL asignar a cada usuario uno de los siguientes roles:
`super_admin`, `tenant_admin`, `manager`, `seller` o `viewer`.

#### Scenario: Rol al registrarse

- GIVEN un usuario que se registra
- THEN su rol es `viewer` (solo lectura), salvo que entre por una invitación con rol pre-asignado

#### Scenario: Rol por defecto

- GIVEN un usuario creado sin rol explícito
- THEN el schema asigna `viewer` como valor por defecto

#### Scenario: Jerarquía de roles

- GIVEN los roles definidos
- THEN `super_admin` opera a nivel de plataforma (todos los tenants)
- AND `tenant_admin` opera dentro de su propio tenant
- AND `manager`, `seller` y `viewer` tienen acceso limitado dentro del tenant

### Requirement: Sesión con contexto de tenant

El sistema SHALL exponer el tenant, el rol y los módulos efectivos en la sesión autenticada.

#### Scenario: Token de sesión

- GIVEN una sesión activa
- THEN el token contiene `id`, `tenantId`, `role` y `modules`
- AND `modules` es la lista de módulos efectivos del usuario (defaults del rol + override)
- AND las rutas protegidas (`protectedProcedure`) exigen sesión
