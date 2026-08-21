# Inventory: inventario y stock

## Purpose

Gestionar productos, categorías y movimientos de stock de cada tenant, con
aislamiento de datos por empresa y acceso restringido al módulo `inventory`.

## Requirements

### Requirement: Gestión de productos

El sistema SHALL permitir listar, crear, editar y deshabilitar productos del tenant.

#### Scenario: Listar productos

- GIVEN un usuario con el módulo `inventory`
- WHEN consulta los productos
- THEN ve únicamente los productos de su tenant, con precio, costo, stock y estado

#### Scenario: Crear producto

- GIVEN un usuario con el módulo `inventory`
- WHEN crea un producto con nombre, precio y unidad
- THEN el producto queda asociado a su tenant con stock inicial 0

#### Scenario: Deshabilitar producto

- GIVEN un usuario con el módulo `inventory`
- WHEN deshabilita un producto
- THEN el producto deja de mostrarse como activo

### Requirement: Gestión de categorías

El sistema SHALL permitir listar y crear categorías del tenant.

#### Scenario: Crear categoría

- GIVEN un usuario con el módulo `inventory`
- WHEN crea una categoría con nombre
- THEN la categoría queda asociada a su tenant con un slug derivado del nombre

### Requirement: Movimientos de stock

El sistema SHALL permitir registrar entradas, salidas y ajustes de stock, y ver el historial.

#### Scenario: Entrada de stock

- GIVEN un usuario con el módulo `inventory`
- WHEN registra una entrada de N unidades de un producto
- THEN el stock del producto se incrementa en N y queda registrado el movimiento

#### Scenario: Salida de stock

- GIVEN un usuario con el módulo `inventory`
- WHEN registra una salida de N unidades de un producto con stock suficiente
- THEN el stock se decrementa en N y queda registrado el movimiento

#### Scenario: Salida sin stock suficiente

- GIVEN una salida mayor al stock disponible
- WHEN se intenta registrar
- THEN la API responde `400` y el stock no cambia

#### Scenario: Historial de movimientos

- GIVEN un usuario con el módulo `inventory`
- WHEN consulta los movimientos
- THEN ve los movimientos de su tenant (producto, tipo, cantidad y fecha)

### Requirement: Aislamiento por tenant

El sistema SHALL garantizar que cada tenant solo vea y modifique sus propios productos, categorías y movimientos.

#### Scenario: Datos aislados

- GIVEN dos tenants distintos
- THEN los productos, categorías y movimientos de uno no son visibles para el otro

### Requirement: Acceso por módulo

El sistema SHALL restringir el inventario a los usuarios con el módulo `inventory`.

#### Scenario: Acceso denegado

- GIVEN un usuario sin el módulo `inventory`
- WHEN intenta acceder a la página o a la API de inventario
- THEN el sistema deniega el acceso (redirige o responde 403)
