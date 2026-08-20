# Tenancy: multi-tenant y roles

## Purpose

Definir el modelo multi-tenant de Apolo: cada empresa es un `tenant` y cada
usuario pertenece a un tenant con un rol que determina su nivel de acceso.

## Requirements

### Requirement: Aislamiento por tenant

El sistema SHALL agrupar usuarios, datos y módulos por `tenant`.

#### Scenario: Tenant creado al registrarse

- GIVEN un visitante que completa el registro
- WHEN la cuenta se crea
- THEN se crea un `tenant` con plan `freemium` y el módulo `inventory` habilitado
- AND el usuario queda asociado a ese tenant

#### Scenario: Slug único

- GIVEN un tenant nuevo
- THEN su `slug` es único y derivado del nombre (con sufijo aleatorio)

### Requirement: Roles de usuario

El sistema SHALL asignar a cada usuario uno de los siguientes roles:
`super_admin`, `tenant_admin`, `manager`, `seller` o `viewer`.

#### Scenario: Rol al registrarse

- GIVEN un usuario que se registra
- THEN su rol es `tenant_admin`

#### Scenario: Rol por defecto

- GIVEN un usuario creado sin rol explícito
- THEN el schema asigna `viewer` como valor por defecto

#### Scenario: Jerarquía de roles

- GIVEN los roles definidos
- THEN `super_admin` opera a nivel de plataforma (todos los tenants)
- AND `tenant_admin` opera dentro de su propio tenant
- AND `manager`, `seller` y `viewer` tienen acceso limitado dentro del tenant

### Requirement: Sesión con contexto de tenant

El sistema SHALL exponer el tenant y el rol en la sesión autenticada.

#### Scenario: Token de sesión

- GIVEN una sesión activa
- THEN el token contiene `id`, `tenantId` y `role`
- AND las rutas protegidas (`protectedProcedure`) exigen sesión
