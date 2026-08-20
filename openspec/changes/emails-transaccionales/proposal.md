## Why

El sistema ya tiene las funciones de email en `@apolo/email` (`sendWelcomeEmail`,
`sendPasswordResetEmail`) pero no están conectadas: al registrarse no se envía
ningún mail y no existe forma de recuperar la contraseña. Para vender el producto
a pymes necesitamos el flujo transaccional mínimo: bienvenida al registrarse y
restablecimiento de contraseña por mail.

## What Changes

- Enviar email de bienvenida al registrarse (se conecta `sendWelcomeEmail` a
  `/api/register`).
- Agregar flujo de restablecimiento de contraseña: solicitar reset (genera token
  con expiración y envía mail con link), y confirmar reset (valida token y
  actualiza el hash de la contraseña).
- Nueva tabla `password_reset_tokens` (token hasheado + expiración).
- Páginas `/forgot-password` y `/reset-password`.
- Remitente configurable vía `EMAIL_FROM` (ya configurado en Vercel).

## Capabilities

### New Capabilities

- `account-recovery`: solicitar y confirmar restablecimiento de contraseña por
  email con token de un solo uso y expiración.

### Modified Capabilities

- `auth-login`: el registro ahora envía un email de bienvenida.

## Impact

- `packages/database`: tabla `password_reset_tokens` + migración.
- `packages/auth`: `createPasswordResetToken` y `resetPassword`.
- `apps/web`: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`,
  páginas `/forgot-password` y `/reset-password`, y envío de welcome en
  `/api/register`.
- `packages/email`: ya existente, sin cambios funcionales (el `from` quedó
  configurable).
