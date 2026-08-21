# Clients: clientes

## Purpose

Gestionar el maestro de clientes de cada tenant, con aislamiento de datos por
empresa y acceso restringido al módulo `clients`. Clasifica clientes por tipo
(mostrador, mayorista, comercio) para preparar listas de precios diferenciadas
en el módulo de ventas.

## Requirements

### Requirement: Gestión de clientes

El sistema SHALL permitir listar (con búsqueda), crear, editar y deshabilitar clientes del tenant.

#### Scenario: Crear cliente

- GIVEN un usuario con el módulo `clients`
- WHEN crea un cliente con nombre, tipo y datos de contacto
- THEN el cliente queda asociado a su tenant como activo, con tipo `mostrador` por defecto

#### Scenario: Nombre duplicado

- GIVEN un cliente existente con un nombre en el tenant
- WHEN se intenta crear o renombrar otro con el mismo nombre (ignorando mayúsculas)
- THEN la API responde `400` indicando que ya existe

#### Scenario: Deshabilitar cliente

- GIVEN un usuario con el módulo `clients`
- WHEN deshabilita un cliente
- THEN deja de mostrarse como activo sin eliminarse

#### Scenario: Tipos de cliente

- GIVEN la creación o edición de un cliente
- WHEN se elige el tipo
- THEN solo se aceptan mostrador (`retail`), mayorista (`wholesale`) o comercio (`business`)

### Requirement: Aislamiento por tenant

El sistema SHALL garantizar que cada tenant solo vea y modifique sus propios clientes.

#### Scenario: Datos aislados

- GIVEN dos tenants distintos
- THEN los clientes de uno no son visibles ni modificables desde el otro

### Requirement: Acceso por módulo

El sistema SHALL restringir clientes a los usuarios con el módulo `clients`.

#### Scenario: Acceso denegado

- GIVEN un usuario sin el módulo `clients`
- WHEN intenta acceder a la página o a la API
- THEN el sistema deniega el acceso (redirige o responde 403)

### Requirement: Importación y exportación masiva

El sistema SHALL permitir exportar e importar clientes en CSV.

#### Scenario: Importar creando clientes

- GIVEN un CSV con clientes que no existen
- WHEN se sube
- THEN se crean asociados al tenant con el tipo indicado (o mostrador si viene vacío)

#### Scenario: Importar sin duplicar

- GIVEN un CSV con un cliente cuyo nombre ya existe
- WHEN se sube
- THEN el existente se actualiza en vez de duplicarse
- AND los campos vacíos o ausentes en el CSV conservan su valor actual

#### Scenario: Reporte de importación

- GIVEN una importación
- THEN el sistema devuelve cuántos se crearon, cuántos se actualizaron y los errores con su fila
