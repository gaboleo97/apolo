## Context

Resend ya está configurado (`RESEND_API_KEY` en Vercel, `from` configurable vía
`EMAIL_FROM`). El paquete `@apolo/email` ya expone `sendWelcomeEmail` y
`sendPasswordResetEmail`. Falta el flujo de reset (token + páginas) y conectar el
welcome al registro. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- Welcome email al registrarse (sin bloquear el registro si falla).
- Forgot/reset password con token de un solo uso, hasheado y con expiración.
- No revelar si un email existe o no.

**Non-Goals:**
- No se implementa verificación de email ni "magic links".
- No se envían emails de invitación a usuarios del equipo (futuro).

## Decisions

### 1. Token opaco hasheado en DB (`password_reset_tokens`)

El token generado se envía por email en claro (`crypto.randomBytes(32)` hex) y en
la DB se guarda solo su SHA-256 (`token_hash`), con `expires_at` (1h) y `used_at`.
Alternativa: JWT firmado (evita tabla, pero no revocable y más acoplamiento). Se
elige tabla para permitir un solo uso y expiración revocable.

### 2. No revelar existencia de cuenta

`/api/auth/forgot-password` responde `200` siempre (exista o no el email). Evita
enumeración de usuarios. Se logra porque `createPasswordResetToken` devuelve
`null` si no hay usuario y la ruta igual responde ok.

### 3. Envío de email fuera del camino crítico

En `/api/register`, el welcome se envía con `await` dentro de `try/catch`: si
Resend falla, el registro se completa igual (se loguea el error). En
forgot-password, el envío se hace solo si el token se creó (email existe).

### 4. Enlace de reset armado con `AUTH_URL`

`resetUrl = ${process.env.AUTH_URL ?? "http://localhost:3000"}/reset-password?token=...`.
En prod `AUTH_URL` ya apunta al dominio de Vercel.

### 5. Páginas como componentes cliente con Suspense

`/reset-password` lee el token de la query (`useSearchParams`) → se envuelve en
`<Suspense>` igual que `/login`. `/forgot-password` no necesita query.

## Risks / Trade-offs

- [Email sin dominio verificado] El envío desde `noreply@apolo.app` falla hasta
  verificar el dominio en Resend → Mitigación: local usa `onboarding@resend.dev`;
  en prod se documentó el DNS a agregar.
- [Token en claro en el link] Aparece en el mail y en logs de servidores de mail →
  Mitigación: expira en 1h, un solo uso, y en DB solo se guarda el hash.
- [Fuga de timing] Responder igual exista o no el email aún permite distinguir por
  tiempo de respuesta (el camino con envío tarda más) → Mitigación: aceptable para
  v1; se podría simular latencia en el futuro.

## Migration Plan

1. Migración aditiva: tabla `password_reset_tokens`. No destructiva.
2. Desplegar. Rollback: revertir código; la tabla extra no afecta.
