## MODIFIED Requirements

### Requirement: Sesión con contexto de tenant

El sistema SHALL exponer el tenant, el rol y los módulos efectivos en la sesión autenticada.

#### Scenario: Token de sesión

- GIVEN una sesión activa
- THEN el token contiene `id`, `tenantId`, `role` y `modules`
- AND `modules` es la lista de módulos efectivos del usuario (defaults del rol + override)
- AND las rutas protegidas (`protectedProcedure`) exigen sesión
