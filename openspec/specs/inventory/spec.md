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
- THEN ve únicamente los productos de su tenant, con precio, costo por bulto, margen y stock

#### Scenario: Crear producto

- GIVEN un usuario con el módulo `inventory`
- WHEN crea un producto con nombre, precio y unidad
- THEN el producto queda asociado a su tenant con stock inicial 0
- AND si el SKU viene vacío, se autogenera

#### Scenario: Deshabilitar producto

- GIVEN un usuario con el módulo `inventory`
- WHEN deshabilita un producto
- THEN el producto deja de mostrarse como activo

### Requirement: Costo por bulto y precio sugerido

El sistema SHALL calcular el costo unitario y un precio sugerido a partir del costo por bulto, el IVA y el margen de ganancia.

#### Scenario: Costo unitario

- GIVEN un producto con costo por bulto y unidades por bulto
- THEN el costo unitario es el costo por bulto dividido por las unidades por bulto

#### Scenario: Precio sugerido

- GIVEN un producto con costo por bulto, IVA y margen de ganancia
- THEN el precio sugerido es costo unitario × (1 + IVA/100) × (1 + margen/100)
- AND el precio de venta real es editable (por defecto, el sugerido)

#### Scenario: Stock decimal

- GIVEN un producto vendido por kilo
- THEN el stock soporta decimales (ej. 15.5 kg)

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

### Requirement: Importación y exportación masiva

El sistema SHALL permitir exportar e importar productos y precios en CSV, en dos pasos separados.

#### Scenario: Cargar productos (datos maestros)

- GIVEN un usuario con el módulo `inventory`
- WHEN sube un CSV con nombre, categoría, unidad, unidades por bulto y stock
- THEN se crean o actualizan los productos, sin tocar precios
- AND si el SKU viene vacío, se autogenera

#### Scenario: Cargar precios

- GIVEN un usuario con el módulo `inventory`
- WHEN sube un CSV de precios identificando el producto por nombre, SKU o código de barras
- THEN se actualizan costo por bulto, IVA, margen y precio del producto

#### Scenario: Importar sin duplicar

- GIVEN un CSV con productos que ya existen (por SKU, código de barras o nombre)
- WHEN se sube el CSV
- THEN los existentes se actualizan en vez de duplicarse

#### Scenario: Precio por defecto sugerido

- GIVEN una carga de precios sin columna de precio
- THEN el precio se calcula automáticamente a partir del costo por bulto, IVA y margen

#### Scenario: Reporte de importación

- GIVEN una importación
- THEN el sistema devuelve cuántos se crearon, cuántos se actualizaron y los errores con su fila
