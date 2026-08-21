# access-control Specification

## Purpose
Controlar qué módulos puede ver y usar cada usuario dentro de su tenant, según su rol y los permisos asignados por el administrador.

## Requirements

### Requirement: Módulos por usuario

El sistema SHALL determinar los módulos visibles para cada usuario a partir de los módulos por defecto de su rol, con override individual asignado por el `tenant_admin`.

#### Scenario: Rol con módulos por defecto

- GIVEN un usuario con rol `seller`
- WHEN el usuario no tiene override individual
- THEN ve los módulos por defecto de `seller` (ventas, inventario, clientes)

#### Scenario: Override individual

- GIVEN un usuario con override individual definido
- WHEN el sistema calcula sus módulos
- THEN usa la lista del override en lugar de los defaults del rol

### Requirement: Dashboard siempre visible

El sistema SHALL mostrar el Dashboard a todos los usuarios autenticados, independientemente de sus módulos.

#### Scenario: Usuario sin módulos

- GIVEN un usuario autenticado sin módulos asignados
- THEN el Dashboard permanece visible y accesible

### Requirement: Módulos por defecto por rol

El sistema SHALL definir un conjunto base de módulos para cada rol.

#### Scenario: tenant_admin

- GIVEN un usuario con rol `tenant_admin`
- THEN tiene acceso a todos los módulos del tenant

#### Scenario: manager

- GIVEN un usuario con rol `manager`
- THEN tiene acceso a inventario, ventas, compras, contabilidad, clientes y proveedores

#### Scenario: seller

- GIVEN un usuario con rol `seller`
- THEN tiene acceso a ventas, inventario y clientes

#### Scenario: viewer

- GIVEN un usuario con rol `viewer`
- THEN solo tiene acceso al Dashboard

### Requirement: Enforcement de sesión

El sistema SHALL exigir sesión para acceder a las rutas protegidas del dashboard.

#### Scenario: Acceso sin sesión

- GIVEN un visitante sin sesión
- WHEN intenta acceder a `/dashboard` o a un módulo
- THEN es redirigido a `/login`

### Requirement: Enforcement por módulo

El sistema SHALL impedir el acceso a las páginas de módulos que el usuario no tiene asignados.

#### Scenario: Acceso a módulo no asignado

- GIVEN un usuario autenticado sin el módulo `contabilidad`
- WHEN intenta acceder a `/dashboard/accounting`
- THEN es redirigido a `/dashboard`

### Requirement: Aislamiento de datos por tenant

El sistema SHALL garantizar que cada tenant solo acceda a sus propios datos.

#### Scenario: Query scoped por tenant

- GIVEN una consulta de un módulo
- THEN todos los resultados se filtran por el `tenantId` de la sesión

### Requirement: Administración del equipo

El sistema SHALL permitir al `tenant_admin` gestionar los usuarios de su tenant,
sin poder otorgar el rol `super_admin` ni cambiar el tenant de un usuario.

#### Scenario: Listar usuarios del tenant

- GIVEN un usuario con rol `tenant_admin`
- WHEN accede a `/dashboard/team`
- THEN ve únicamente los usuarios de su propio tenant

#### Scenario: Asignar rol y módulos

- GIVEN un usuario con rol `tenant_admin`
- WHEN edita un usuario de su tenant
- THEN puede asignar rol (salvo `super_admin`) y módulos a ese usuario

#### Scenario: Acceso denegado a no-admins

- GIVEN un usuario sin rol `tenant_admin`
- WHEN intenta acceder a `/dashboard/team`
- THEN es redirigido a `/dashboard`

#### Scenario: No puede otorgar super_admin

- GIVEN un usuario con rol `tenant_admin`
- WHEN intenta asignar el rol `super_admin` a un usuario
- THEN el sistema rechaza la operación
