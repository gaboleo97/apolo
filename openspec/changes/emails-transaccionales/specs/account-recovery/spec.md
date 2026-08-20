## Purpose

Permitir a un usuario recuperar el acceso a su cuenta solicitando un enlace de
restablecimiento de contraseña por email, y confirmar el cambio con un token de un solo uso.

## ADDED Requirements

### Requirement: Solicitar restablecimiento

El sistema SHALL permitir solicitar un restablecimiento de contraseña con el email.

#### Scenario: Email registrado

- GIVEN un usuario con un email registrado
- WHEN solicita restablecer la contraseña
- THEN se genera un token con expiración
- AND se envía un email con un enlace de restablecimiento
- AND la API responde `200` sin revelar si el email existe

#### Scenario: Email no registrado

- GIVEN un email que no está registrado
- WHEN se solicita el restablecimiento
- THEN la API responde `200` sin enviar email (no revela existencia)

### Requirement: Confirmar restablecimiento

El sistema SHALL permitir establecer una nueva contraseña con un token válido.

#### Scenario: Token válido

- GIVEN un token de restablecimiento válido y no usado
- WHEN el usuario envía una nueva contraseña
- THEN se actualiza el hash de la contraseña
- AND el token queda marcado como usado

#### Scenario: Token inválido o expirado

- GIVEN un token inválido, usado o expirado
- WHEN el usuario intenta restablecer la contraseña
- THEN la API responde `400` y no se actualiza la contraseña

### Requirement: Expiración del enlace

El sistema SHALL invalidar los enlaces de restablecimiento después de una hora.

#### Scenario: Enlace expirado

- GIVEN un token con más de una hora de antigüedad
- THEN no puede usarse para restablecer la contraseña
