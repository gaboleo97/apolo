## ADDED Requirements

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
- THEN se crea una empresa nueva y el usuario queda como `tenant_admin`
