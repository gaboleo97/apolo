# Suppliers: proveedores

## Purpose

Gestionar el maestro de proveedores de cada tenant, con aislamiento de datos por
empresa y acceso restringido al módulo `suppliers`. Permite vincular productos del
inventario con su costo por proveedor, preparando el terreno para el módulo de compras.

## Requirements

### Requirement: Gestión de proveedores

El sistema SHALL permitir listar (con búsqueda), crear, editar y deshabilitar proveedores del tenant.

#### Scenario: Crear proveedor

- GIVEN un usuario con el módulo `suppliers`
- WHEN crea un proveedor con nombre y datos de contacto
- THEN el proveedor queda asociado a su tenant como activo

#### Scenario: Nombre duplicado

- GIVEN un proveedor existente con un nombre en el tenant
- WHEN se intenta crear o renombrar otro con el mismo nombre (ignorando mayúsculas)
- THEN la API responde `400` indicando que ya existe

#### Scenario: Deshabilitar proveedor

- GIVEN un usuario con el módulo `suppliers`
- WHEN deshabilita un proveedor
- THEN deja de mostrarse como activo sin eliminarse

### Requirement: Productos por proveedor

El sistema SHALL permitir vincular productos del inventario a un proveedor con costo y código propio.

#### Scenario: Vincular producto

- GIVEN un producto del inventario y un proveedor del tenant
- WHEN los vincula indicando costo y código opcional
- THEN el vínculo queda registrado para ese proveedor

#### Scenario: Revincular actualiza

- GIVEN un producto ya vinculado al proveedor
- WHEN se vuelve a vincular con otro costo o código
- THEN no se duplica: se actualiza el vínculo existente

#### Scenario: Costo de referencia

- GIVEN la lista de productos de un proveedor
- THEN muestra el costo del proveedor junto al costo unitario actual del inventario

### Requirement: Aislamiento por tenant

El sistema SHALL garantizar que cada tenant solo vea y modifique sus propios proveedores y vínculos.

#### Scenario: Datos aislados

- GIVEN dos tenants distintos
- THEN los proveedores y vínculos de uno no son visibles ni modificables desde el otro

### Requirement: Acceso por módulo

El sistema SHALL restringir proveedores a los usuarios con el módulo `suppliers`.

#### Scenario: Acceso denegado

- GIVEN un usuario sin el módulo `suppliers`
- WHEN intenta acceder a la página o a la API
- THEN el sistema deniega el acceso (redirige o responde 403)

### Requirement: Importación y exportación masiva

El sistema SHALL permitir exportar e importar proveedores en CSV.

#### Scenario: Importar creando proveedores

- GIVEN un CSV con proveedores que no existen
- WHEN se sube
- THEN se crean asociados al tenant

#### Scenario: Importar sin duplicar

- GIVEN un CSV con un proveedor cuyo nombre ya existe
- WHEN se sube
- THEN el existente se actualiza en vez de duplicarse

#### Scenario: Reporte de importación

- GIVEN una importación
- THEN el sistema devuelve cuántos se crearon, cuántos se actualizaron y los errores con su fila
