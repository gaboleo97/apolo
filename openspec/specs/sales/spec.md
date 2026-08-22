# Sales: ventas

## Purpose

Registrar presupuestos que se confirman como ventas, descontando stock
automáticamente y permitiendo registrar pagos parciales hasta cubrir el total.
Es el módulo que conecta inventario (productos y stock) con clientes.

## Requirements

### Requirement: Presupuestos

El sistema SHALL permitir crear presupuestos (borradores de venta) con cliente
opcional, productos, cantidades y precios editables.

#### Scenario: Crear presupuesto

- GIVEN un usuario con el módulo `sales`
- WHEN crea un presupuesto con al menos un producto
- THEN queda guardado como borrador con código único por empresa y el total calculado en el servidor

#### Scenario: Sin productos

- GIVEN la creación o edición de una venta
- WHEN no se incluye ningún producto
- THEN el sistema rechaza la operación

#### Scenario: Editar presupuesto

- GIVEN un presupuesto en borrador
- WHEN se modifica cliente, ítems o notas
- THEN se recalcula el total; las ventas confirmadas no se pueden editar

### Requirement: Confirmación con descuento de stock

El sistema SHALL descontar el stock automáticamente al confirmar una venta.

#### Scenario: Confirmar venta

- GIVEN un presupuesto con productos que tienen stock suficiente
- WHEN se confirma
- THEN se descuenta el stock de cada producto, se registran movimientos de tipo salida vinculados a la venta y la venta pasa a estado confirmada

#### Scenario: Stock insuficiente

- GIVEN un presupuesto con un producto cuyo stock es menor a lo pedido
- WHEN se intenta confirmar
- THEN la confirmación se rechaza indicando producto, disponible y pedido, y el presupuesto sigue siendo editable

### Requirement: Anulación

El sistema SHALL permitir anular presupuestos y ventas.

#### Scenario: Anular venta confirmada

- GIVEN una venta confirmada
- WHEN se anula
- THEN el stock descontado se devuelve y se registra un movimiento de entrada

#### Scenario: Anular presupuesto

- GIVEN un presupuesto sin confirmar
- WHEN se anula
- THEN solo cambia su estado; el stock no se modifica

### Requirement: Pagos parciales

El sistema SHALL permitir registrar pagos parciales contra ventas confirmadas
y mostrar el saldo pendiente.

#### Scenario: Registrar pago

- GIVEN una venta confirmada con saldo pendiente
- WHEN se registra un pago menor o igual al saldo
- THEN se guarda con método (efectivo, transferencia u otro) y el saldo se actualiza

#### Scenario: Pago excedido

- GIVEN una venta con saldo pendiente
- WHEN se intenta registrar un pago mayor al saldo
- THEN el sistema rechaza la operación indicando el saldo disponible

#### Scenario: Solo ventas confirmadas

- GIVEN un presupuesto sin confirmar
- WHEN se intenta registrar un pago
- THEN el sistema lo rechaza

### Requirement: Aislamiento por tenant

El sistema SHALL garantizar que cada empresa solo vea y modifique sus propias ventas.

#### Scenario: Datos aislados

- GIVEN dos empresas distintas
- THEN las ventas de una no son visibles ni modificables desde la otra

### Requirement: Acceso por módulo

El sistema SHALL restringir ventas a los usuarios con el módulo `sales`.

#### Scenario: Acceso denegado

- GIVEN un usuario sin el módulo `sales`
- WHEN intenta acceder a la página o a la API
- THEN el sistema deniega el acceso
