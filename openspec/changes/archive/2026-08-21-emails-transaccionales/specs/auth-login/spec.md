## ADDED Requirements

### Requirement: Email de bienvenida

El sistema SHALL enviar un email de bienvenida al completar el registro.

#### Scenario: Registro exitoso

- GIVEN un visitante que completa el registro con éxito
- THEN se envía un email de bienvenida a la dirección registrada
- AND si el envío falla, la cuenta se crea igualmente (el registro no falla)
