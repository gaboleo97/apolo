## 1. Modelo de datos

- [x] 1.1 Agregar tabla `password_reset_tokens` en `packages/database/src/schema/core.ts` y verificar con `pnpm --filter @apolo/database db:generate` que se crea la migración

## 2. Lógica de reset

- [x] 2.1 Crear `packages/auth/src/password-reset.ts` con `createPasswordResetToken` y `resetPassword` y verificar con `pnpm --filter @apolo/auth typecheck`
- [x] 2.2 Exportar desde `packages/auth/src/index.ts` y verificar typecheck

## 3. Endpoints

- [x] 3.1 Crear `POST /api/auth/forgot-password` (genera token + envía mail, responde 200 siempre) y verificar con curl que responde 200
- [x] 3.2 Crear `POST /api/auth/reset-password` (valida token + actualiza hash) y verificar con curl que un token inválido responde 400
- [x] 3.3 Conectar `sendWelcomeEmail` en `/api/register` (sin fallar si el envío falla) y verificar que el registro sigue respondiendo 201

## 4. Páginas

- [x] 4.1 Crear `/forgot-password` y verificar que carga y permite enviar el email
- [x] 4.2 Crear `/reset-password` (con Suspense por `useSearchParams`) y verificar que renderiza

## 5. Verificación

- [x] 5.1 Ejecutar `pnpm typecheck` (12/12) y `pnpm --filter @apolo/web build` y verificar que ambos pasan
- [x] 5.2 Aplicar migración en local y Supabase Cloud y verificar la tabla `password_reset_tokens`
- [x] 5.3 Flujo completo local: pedir reset → obtener token de la DB → resetear → login con la nueva contraseña
- [x] 5.4 Commit (convencional) + push y verificar deploy Ready en Vercel
