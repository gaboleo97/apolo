# Auth: login y registro

## Purpose

Gestionar autenticación de usuarios con email y contraseña, incluyendo creación
de cuentas (tenant + usuario) y sesiones persistentes.

## Requirements

### Requirement: Registro de cuenta

El sistema SHALL permitir crear una cuenta uniéndose a un tenant existente mediante su código (slug).

#### Scenario: Alta exitosa

- GIVEN un visitante en `/register`
- WHEN envía un código de empresa válido, nombre, email y contraseña (mínimo 6 caracteres)
- THEN se crea el usuario en el tenant correspondiente con rol `viewer` (sin módulos)
- AND se guarda la contraseña hasheada con bcrypt (10 rondas)
- AND el sistema redirige a `/login`

#### Scenario: Empresa inexistente

- GIVEN un código de empresa que no existe o un tenant inactivo
- WHEN el visitante intenta registrarse
- THEN la API responde `404` y no se crea ninguna cuenta

#### Scenario: Email duplicado

- GIVEN un email ya registrado
- WHEN se intenta registrar la misma cuenta
- THEN la API responde `409 EMAIL_TAKEN`

#### Scenario: Datos inválidos

- GIVEN un email mal formado o contraseña menor a 6 caracteres
- WHEN se envía el formulario
- THEN la API responde `400` y no se crea ninguna cuenta

### Requirement: Inicio de sesión

El sistema SHALL autenticar usuarios con email y contraseña mediante el helper
`signIn` de `next-auth/react`, que gestiona el token CSRF automáticamente.

#### Scenario: Credenciales válidas

- GIVEN un usuario registrado y activo
- WHEN envía email y contraseña correctos en `/login`
- THEN se emite una sesión (`authjs.session-token`)
- AND el usuario es redirigido a `/dashboard`

#### Scenario: Contraseña incorrecta

- GIVEN un usuario registrado
- WHEN envía una contraseña incorrecta
- THEN la autenticación falla (`CredentialsSignin`)
- AND se muestra el mensaje inline "Email o contraseña incorrectos"
- AND no se crea sesión

#### Scenario: Cuenta recién creada

- GIVEN un usuario que acaba de registrarse
- WHEN llega a `/login?registered=1`
- THEN se muestra el mensaje "Cuenta creada. Ya podés iniciar sesión."

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

### Requirement: Email de bienvenida

El sistema SHALL enviar un email de bienvenida al completar el registro.

#### Scenario: Registro exitoso

- GIVEN un visitante que completa el registro con éxito
- THEN se envía un email de bienvenida a la dirección registrada
- AND si el envío falla, la cuenta se crea igualmente (el registro no falla)

### Requirement: Registro por invitación

El sistema SHALL permitir registrarse uniéndose a un tenant existente mediante un enlace de invitación.

#### Scenario: Registro con invitación

- GIVEN un visitante con un enlace de invitación válido
- WHEN completa nombre, email y contraseña
- THEN el usuario se crea en el tenant de la invitación con el rol y módulos asignados
- AND el sistema redirige al login

#### Scenario: Registro sin invitación

- GIVEN un visitante sin enlace de invitación
- WHEN se registra
- THEN se une al tenant indicado por su código y queda como `viewer`
