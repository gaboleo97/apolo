## Purpose

Permitir invitar usuarios a unirse a un tenant existente con un rol y módulos
pre-asignados, mediante un enlace con token de un solo uso y expiración.

## ADDED Requirements

### Requirement: Crear invitación

El sistema SHALL permitir al `tenant_admin` (y `super_admin`) crear invitaciones para su tenant.

#### Scenario: Invitación con rol y módulos

- GIVEN un usuario con rol `tenant_admin`
- WHEN crea una invitación con rol y módulos
- THEN se genera un token único con expiración (7 días)
- AND se obtiene un enlace para compartir

#### Scenario: Invitación con email específico

- GIVEN una invitación con email definido
- THEN solo ese email puede usarla

### Requirement: Aceptar invitación

El sistema SHALL permitir a un usuario registrarse uniéndose al tenant de la invitación.

#### Scenario: Token válido

- GIVEN un token de invitación válido y no usado
- WHEN el usuario se registra con nombre, email y contraseña
- THEN se crea el usuario en el tenant de la invitación
- AND el usuario queda con el rol y módulos de la invitación
- AND la invitación queda marcada como usada

#### Scenario: Token inválido o expirado

- GIVEN un token inválido, usado o expirado
- WHEN el usuario intenta unirse
- THEN la API responde `400` y no se crea el usuario

#### Scenario: Email no autorizado

- GIVEN una invitación con un email específico
- WHEN un usuario con otro email intenta usarla
- THEN la API rechaza la operación

### Requirement: Expiración de la invitación

El sistema SHALL invalidar las invitaciones después de 7 días.

#### Scenario: Invitación vencida

- GIVEN una invitación con más de 7 días de antigüedad
- THEN no puede usarse para unirse al tenant
