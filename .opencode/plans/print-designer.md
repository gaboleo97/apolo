# Plan: Comprobantes imprimibles (A4 + Térmica 80mm) con diseñador drag & drop

## Objetivo
Poder imprimir presupuestos y ventas en **hoja A4** o **ticket térmico de 80mm**,
con datos de la empresa y del cliente, productos, cantidades y precios. Incluye
un **diseñador de comprobantes** por bloques (drag & drop) con opciones estándar,
un diseño por formato, guardado por empresa.

## Decisiones confirmadas por el usuario
- Diseñador de **bloques apilables** (no lienzo libre)
- **Con carga de logo** (Supabase Storage, bucket `logos`)
- Comprobantes **no fiscales** (presupuesto/remito/pedido X, sin AFIP)
- **Una plantilla por formato** (`a4` | `thermal80`), no múltiples plantillas

---

## 1. Migración 0010 — datos de la empresa + plantillas

### Columnas nuevas en `tenants`
- `tax_id` text — CUIT/razón social fiscal
- `address` text
- `phone` text
- `email` text
- `logo_url` text — URL pública del logo en Supabase Storage

### Tabla nueva `print_templates`
- `id` uuid pk
- `tenant_id` uuid fk tenants notNull
- `format` text enum ["a4", "thermal80"] notNull
- `elements` jsonb notNull — array ordenado de bloques:
  `{ type, enabled, props }`
- `updated_at`, `created_at`
- unique `(tenant_id, format)`

Aplicar migración a DB local (localhost:54322) y cloud (pooler Supabase).

Tipos TS exportados desde `@apolo/database`: `PrintTemplate`,
`PrintElement`, `PrintFormat`.

## 2. Logo — Supabase Storage
- Crear bucket público `logos` vía SQL (`insert into storage.buckets ...`)
- Políticas RLS: lectura pública; escritura solo desde el servidor de Apolo
  (nuestras rutas API validan sesión NextAuth antes de subir con anon key)
- Ruta API `POST /api/company/logo` (multipart): valida PNG/JPG ≤ 500KB, sube
  como `{tenantId}.{ext}`, guarda URL pública en `tenants.logo_url`

## 3. Datos de la empresa — API + UI
- `GET /api/company` → datos del tenant para el encabezado
- `PATCH /api/company` (solo tenant_admin/super_admin): taxId, address,
  phone, email
- Tarjeta "Datos de la empresa" dentro del diseñador (una sola vez se completa)

## 4. Servicio de plantillas (en `@apolo/module-sales`)
- `getTemplate(tenantId, format)` → si no hay fila, devuelve **diseño estándar
  por defecto** generado en código (sin seed ni migración de datos)
- `saveTemplate(tenantId, format, elements)` → upsert
- Defaults estándar:
  - **A4**: logo, título+código, datos empresa, datos cliente, fecha/vendedor,
    tabla productos, totales, notas, pie/firma
  - **Térmica 80mm**: título+código centrado, empresa compacta, cliente,
    tabla simplificada, totales, notas
- Tests de integración: defaults, upsert, aislamiento por tenant

## 5. Motor de impresión
- Componente compartido `PrintDocument({ sale, company, template })` que dibuja
  los bloques habilitados en el orden guardado
- Página `/dashboard/sales/[id]/print?format=a4|thermal80`:
  - Server component: carga venta (detalle existente), tenant y template
  - Botón "Imprimir" → `window.print()`
  - CSS `@page`: A4 = `size: A4; margin: 15mm` · Térmica =
    `size: 80mm auto; margin: 0`, ancho útil 72mm, fuente compacta monoespaciada
- Bloques estándar configurables: logo, título (texto editable + código),
  empresa, cliente, fecha/vendedor, tabla (columnas opcionales SKU/cantidad/
  precio/subtotal), totales (total/pagado/saldo), pagos, notas, texto libre,
  pie/firma

## 6. Diseñador — pestaña "Comprobantes" en Ventas
Ruta `/dashboard/sales/designer` (guard `requireModule("sales")`)

Layout de 3 columnas:
1. **Paleta**: lista de bloques disponibles (agregar = activar)
2. **Canvas**: bloques ordenables con **dnd-kit** (drag & drop vertical),
   switch visible/no por bloque, y propiedades según tipo (texto del título,
   texto libre, columnas visibles de la tabla, alineación)
3. **Vista previa en vivo** con datos demo + selector **A4 ↔ Térmica**
   (cada formato tiene su diseño propio e independiente)

Acciones: Guardar (PUT `/api/print-templates`), Restablecer diseño estándar.
La tarjeta "Datos de la empresa" vive arriba del diseñador.

## 7. Botones de impresión en Ventas
En el diálogo de detalle de venta/presupuesto: menú **Imprimir → A4 /
Térmica 80mm**, abre la página de impresión en pestaña nueva.

## 8. Calidad y despliegue
- Tests integración (plantillas CRUD + defaults + aislamiento) → `pnpm test`
- `pnpm typecheck` (15 paquetes) + build local
- Commit convencional `feat(sales): ...` + push → deploy Vercel
- Verificación manual: impresión de prueba en ambos formatos

## Fuera de alcance (por ahora)
- Facturación electrónica AFIP (CAE)
- Lienzo libre / posicionamiento absoluto
- Múltiples plantillas con nombre por empresa
- Código de barras del comprobante
