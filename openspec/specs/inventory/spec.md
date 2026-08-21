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

### Requirement: Importación y exportación masiva

El sistema SHALL permitir exportar e importar productos en CSV.

#### Scenario: Descargar plantilla

- GIVEN un usuario con el módulo `inventory`
- WHEN descarga la plantilla
- THEN recibe un CSV con las columnas de producto y una fila de ejemplo

#### Scenario: Exportar productos

- GIVEN un usuario con el módulo `inventory`
- WHEN exporta los productos
- THEN recibe un CSV con los productos de su tenant en el mismo formato de la plantilla

#### Scenario: Importar creando productos

- GIVEN un usuario con el módulo `inventory`
- WHEN sube un CSV con productos que no existen
- THEN se crean los productos asociados a su tenant

#### Scenario: Importar sin duplicar

- GIVEN un CSV con productos que ya existen (por SKU, código de barras o nombre)
- WHEN se sube el CSV
- THEN los existentes se actualizan en vez de duplicarse

#### Scenario: Importar actualiza stock con movimiento

- GIVEN un CSV con una cantidad de stock para un producto existente
- WHEN se sube el CSV
- THEN se actualiza el stock y se registra un movimiento de ajuste en el historial

#### Scenario: Reporte de importación

- GIVEN una importación
- THEN el sistema devuelve cuántos productos se crearon, cuántos se actualizaron y los errores con su fila
