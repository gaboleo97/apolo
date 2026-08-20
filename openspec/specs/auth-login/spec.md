# Auth: login y registro

## Purpose

Gestionar autenticación de usuarios con email y contraseña, incluyendo creación
de cuentas (tenant + usuario) y sesiones persistentes.

## Requirements

### Requirement: Registro de cuenta

El sistema SHALL permitir crear una cuenta con nombre, email y contraseña.

#### Scenario: Alta exitosa

- GIVEN un visitante en `/register`
- WHEN envía nombre, email y contraseña válidos (mínimo 6 caracteres)
- THEN se crea un tenant `freemium` con el módulo `inventory` habilitado
- AND se crea un usuario con rol `tenant_admin`
- AND se guarda la contraseña hasheada con bcrypt (10 rondas)
- AND el sistema redirige a `/login`

#### Scenario: Email duplicado

- GIVEN un email ya registrado
- WHEN se intenta registrar la misma cuenta
- THEN la API responde `409 EMAIL_TAKEN`

#### Scenario: Datos inválidos

- GIVEN un email mal formado o contraseña menor a 6 caracteres
- WHEN se envía el formulario
- THEN la API responde `400` y no se crea ninguna cuenta

### Requirement: Inicio de sesión

El sistema SHALL autenticar usuarios con email y contraseña.

#### Scenario: Credenciales válidas

- GIVEN un usuario registrado y activo
- WHEN envía email y contraseña correctos en `/login`
- THEN se emite una sesión (`authjs.session-token`)
- AND el usuario es redirigido al dashboard

#### Scenario: Contraseña incorrecta

- GIVEN un usuario registrado
- WHEN envía una contraseña incorrecta
- THEN la autenticación falla (`CredentialsSignin`)
- AND no se crea sesión

#### Scenario: Usuario inactivo

- GIVEN un usuario con `is_active = false`
- WHEN intenta iniciar sesión
- THEN la autenticación es rechazada

### Requirement: Roles y multi-tenant

El sistema SHALL asociar cada usuario a un tenant y asignarle un rol.

#### Scenario: Acceso por rol

- GIVEN una sesión activa
- THEN el token contiene `id`, `tenantId` y `role`
- AND las rutas protegidas (`protectedProcedure`) exigen sesión