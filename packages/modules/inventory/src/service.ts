import { and, desc, eq, ilike } from "drizzle-orm";
import { db, categories, products, stockMovements, tenants } from "@apolo/database";
import {
  applyRounding,
  calcCostPerUnit,
  calcSuggestedPrice,
  generateSku,
  normalizeUnit,
  parseBool,
  parseNumber,
  toNum,
  type PriceRounding,
  type UnitType,
} from "./pricing";

export * from "./pricing";

export type ProductInput = {
  name: string;
  categoryId?: string | null;
  price: number;
  costPerBulk?: number | null;
  unitsPerBulk?: number;
  marginPct?: number;
  taxRate?: number;
  sku?: string | null;
  barcode?: string | null;
  unitType?: UnitType;
  minStock?: number;
  description?: string | null;
};

export async function getTenantRounding(tenantId: string): Promise<PriceRounding> {
  const t = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
  return (t?.priceRounding as PriceRounding) ?? "none";
}

export async function getPricingSettings(tenantId: string) {
  return { priceRounding: await getTenantRounding(tenantId) };
}

export async function setTenantRounding(tenantId: string, rounding: PriceRounding) {
  await db.update(tenants).set({ priceRounding: rounding }).where(eq(tenants.id, tenantId));
}

function serializeProduct(p: typeof products.$inferSelect, rounding: PriceRounding) {
  const costPerBulk = p.costPerBulk != null ? Number(p.costPerBulk) : null;
  const unitsPerBulk = toNum(p.unitsPerBulk) || 1;
  const marginPct = toNum(p.marginPct);
  const taxRate = p.taxRate != null ? Number(p.taxRate) : 21;

  return {
    id: p.id,
    tenantId: p.tenantId,
    categoryId: p.categoryId,
    name: p.name,
    description: p.description,
    sku: p.sku,
    barcode: p.barcode,
    unitType: p.unitType,
    price: Number(p.price),
    costPerBulk,
    unitsPerBulk,
    marginPct,
    taxRate,
    costPerUnit: calcCostPerUnit(costPerBulk, unitsPerBulk),
    suggestedPrice: calcSuggestedPrice(costPerBulk, unitsPerBulk, taxRate, marginPct, rounding),
    minStock: toNum(p.minStock),
    currentStock: toNum(p.currentStock),
    isActive: p.isActive,
    createdAt: p.createdAt,
  };
}

export async function listProducts(
  tenantId: string,
  opts?: { search?: string; categoryId?: string }
) {
  const rounding = await getTenantRounding(tenantId);
  const rows = await db.query.products.findMany({
    where: and(
      eq(products.tenantId, tenantId),
      opts?.categoryId ? eq(products.categoryId, opts.categoryId) : undefined,
      opts?.search ? ilike(products.name, `%${opts.search}%`) : undefined
    ),
    orderBy: desc(products.createdAt),
  });
  return rows.map((p) => serializeProduct(p, rounding));
}

export async function getProduct(tenantId: string, productId: string) {
  const rounding = await getTenantRounding(tenantId);
  const row = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.tenantId, tenantId)),
  });
  return row ? serializeProduct(row, rounding) : null;
}

export async function createProduct(tenantId: string, input: ProductInput) {
  const sku = input.sku?.trim() || generateSku(input.name);

  const created = await db
    .insert(products)
    .values({
      tenantId,
      name: input.name.trim(),
      categoryId: input.categoryId ?? null,
      price: String(input.price),
      costPerBulk: input.costPerBulk != null ? String(input.costPerBulk) : null,
      unitsPerBulk: String(input.unitsPerBulk ?? 1),
      marginPct: String(input.marginPct ?? 0),
      taxRate: String(input.taxRate ?? 21),
      sku,
      barcode: input.barcode?.trim() || null,
      unitType: input.unitType ?? "unit",
      minStock: String(input.minStock ?? 0),
      description: input.description?.trim() || null,
      isActive: true,
    })
    .returning();

  const p = created[0];
  return p ? serializeProduct(p, await getTenantRounding(tenantId)) : null;
}

export async function updateProduct(
  tenantId: string,
  productId: string,
  input: Partial<ProductInput> & { isActive?: boolean }
) {
  const updated = await db
    .update(products)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId ?? null } : {}),
      ...(input.price !== undefined ? { price: String(input.price) } : {}),
      ...(input.costPerBulk !== undefined
        ? { costPerBulk: input.costPerBulk != null ? String(input.costPerBulk) : null }
        : {}),
      ...(input.unitsPerBulk !== undefined ? { unitsPerBulk: String(input.unitsPerBulk) } : {}),
      ...(input.marginPct !== undefined ? { marginPct: String(input.marginPct) } : {}),
      ...(input.taxRate !== undefined ? { taxRate: String(input.taxRate) } : {}),
      ...(input.sku !== undefined ? { sku: input.sku?.trim() || null } : {}),
      ...(input.barcode !== undefined ? { barcode: input.barcode?.trim() || null } : {}),
      ...(input.unitType !== undefined ? { unitType: input.unitType } : {}),
      ...(input.minStock !== undefined ? { minStock: String(input.minStock) } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    })
    .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
    .returning();

  const p = updated[0];
  return p ? serializeProduct(p, await getTenantRounding(tenantId)) : null;
}

export async function listCategories(tenantId: string) {
  return db.query.categories.findMany({
    where: and(eq(categories.tenantId, tenantId), eq(categories.isActive, true)),
    orderBy: [desc(categories.createdAt)],
  });
}

export async function createCategory(tenantId: string, input: { name: string; description?: string | null }) {
  const slug = input.name.trim().toLowerCase().replace(/\s+/g, "-");
  const created = await db
    .insert(categories)
    .values({
      tenantId,
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      isActive: true,
    })
    .returning();
  return created[0] ?? null;
}

export type StockType = "in" | "out" | "adjustment";

export async function adjustStock(
  tenantId: string,
  input: { productId: string; type: StockType; quantity: number; notes?: string | null; userId: string }
) {
  return db.transaction(async (tx) => {
    const product = await tx.query.products.findFirst({
      where: and(eq(products.id, input.productId), eq(products.tenantId, tenantId)),
    });
    if (!product) return { ok: false as const, error: "NOT_FOUND" as const };

    const current = toNum(product.currentStock);
    let next = current;

    if (input.type === "in") {
      next = current + input.quantity;
    } else if (input.type === "out") {
      next = current - input.quantity;
      if (next < 0) return { ok: false as const, error: "INSUFFICIENT_STOCK" as const };
    } else {
      next = input.quantity;
    }

    await tx.update(products).set({ currentStock: String(next) }).where(eq(products.id, input.productId));
    await tx.insert(stockMovements).values({
      tenantId,
      productId: input.productId,
      userId: input.userId,
      type: input.type,
      quantity: String(input.quantity),
      notes: input.notes?.trim() || null,
    });

    return { ok: true as const, currentStock: next };
  });
}

export async function listMovements(tenantId: string, productId?: string) {
  return db.query.stockMovements.findMany({
    where: and(
      eq(stockMovements.tenantId, tenantId),
      productId ? eq(stockMovements.productId, productId) : undefined
    ),
    orderBy: [desc(stockMovements.createdAt)],
    limit: 100,
  });
}

// ---------- Import / export ----------

async function findOrCreateCategory(tenantId: string, name: string): Promise<string | null> {
  let cat = await db.query.categories.findFirst({
    where: and(eq(categories.tenantId, tenantId), ilike(categories.name, name.trim())),
  });
  if (!cat) {
    const created = await db
      .insert(categories)
      .values({
        tenantId,
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/\s+/g, "-"),
        isActive: true,
      })
      .returning();
    cat = created[0];
  }
  return cat?.id ?? null;
}

async function findProductByKey(tenantId: string, sku: string | null, barcode: string | null, name: string) {
  if (sku) {
    const row = await db.query.products.findFirst({
      where: and(eq(products.tenantId, tenantId), ilike(products.sku, sku)),
    });
    if (row) return row;
  }
  if (barcode) {
    const row = await db.query.products.findFirst({
      where: and(eq(products.tenantId, tenantId), ilike(products.barcode, barcode)),
    });
    if (row) return row;
  }
  return db.query.products.findFirst({
    where: and(eq(products.tenantId, tenantId), ilike(products.name, name)),
  });
}

export type ImportReport = {
  created: number;
  updated: number;
  errors: { line: number; error: string }[];
};

export type ProductImportRow = {
  nombre?: string;
  categoria?: string;
  sku?: string;
  codigo_barras?: string;
  unidad?: string;
  cantidad_por_bulto?: string;
  unidades_por_bulto?: string;
  stock_minimo?: string;
  stock?: string;
  descripcion?: string;
  activo?: string;
};

export async function upsertProducts(
  tenantId: string,
  userId: string,
  rows: ProductImportRow[]
): Promise<ImportReport> {
  const report: ImportReport = { created: 0, updated: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const line = i + 2;

    try {
      const nombre = row.nombre?.trim();
      if (!nombre) {
        report.errors.push({ line, error: "Falta nombre" });
        continue;
      }

      const unidad = normalizeUnit(row.unidad);
      const unitsPerBulk = parseNumber(row.cantidad_por_bulto ?? row.unidades_por_bulto) ?? 1;
      const stockMinimo = parseNumber(row.stock_minimo) ?? 0;
      const stock = parseNumber(row.stock);
      const activo = parseBool(row.activo);

      const sku = row.sku?.trim() || null;
      const barcode = row.codigo_barras?.trim() || null;

      const categoryId = row.categoria?.trim() ? await findOrCreateCategory(tenantId, row.categoria) : null;

      const existing = await findProductByKey(tenantId, sku, barcode, nombre);

      if (existing) {
        await db
          .update(products)
          .set({
            name: nombre,
            categoryId,
            unitsPerBulk: String(unitsPerBulk),
            minStock: String(stockMinimo),
            unitType: unidad,
            sku: sku ?? existing.sku,
            barcode: barcode ?? existing.barcode,
            description: row.descripcion?.trim() || null,
            isActive: activo,
          })
          .where(eq(products.id, existing.id));

        if (stock != null) {
          await adjustStock(tenantId, {
            productId: existing.id,
            type: "adjustment",
            quantity: stock,
            notes: "carga masiva",
            userId,
          });
        }

        report.updated++;
      } else {
        const finalSku = sku ?? generateSku(nombre);

        const created = await db
          .insert(products)
          .values({
            tenantId,
            name: nombre,
            categoryId,
            price: "0",
            costPerBulk: null,
            unitsPerBulk: String(unitsPerBulk),
            marginPct: "0",
            taxRate: "21",
            sku: finalSku,
            barcode,
            unitType: unidad,
            minStock: String(stockMinimo),
            currentStock: "0",
            description: row.descripcion?.trim() || null,
            isActive: activo,
          })
          .returning();

        const p = created[0];
        if (p && stock != null && stock > 0) {
          await adjustStock(tenantId, {
            productId: p.id,
            type: "adjustment",
            quantity: stock,
            notes: "carga masiva",
            userId,
          });
        }

        report.created++;
      }
    } catch {
      report.errors.push({ line, error: "Error inesperado" });
    }
  }

  return report;
}

export type PriceImportRow = {
  nombre?: string;
  sku?: string;
  codigo_barras?: string;
  costo_bulto?: string;
  iva?: string;
  margen?: string;
  precio?: string;
};

export async function upsertPrices(
  tenantId: string,
  rows: PriceImportRow[]
): Promise<ImportReport> {
  const report: ImportReport = { created: 0, updated: 0, errors: [] };
  const rounding = await getTenantRounding(tenantId);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const line = i + 2;

    try {
      const nombre = row.nombre?.trim();
      const sku = row.sku?.trim() || null;
      const barcode = row.codigo_barras?.trim() || null;
      if (!nombre && !sku && !barcode) {
        report.errors.push({ line, error: "Falta nombre, SKU o código de barras" });
        continue;
      }

      const existing = await findProductByKey(tenantId, sku, barcode, nombre ?? "");
      if (!existing) {
        report.errors.push({ line, error: "Producto no encontrado" });
        continue;
      }

      const costoBulto = parseNumber(row.costo_bulto);
      const iva = parseNumber(row.iva);
      const margen = parseNumber(row.margen);
      const precio = parseNumber(row.precio);

      const unitsPerBulk = toNum(existing.unitsPerBulk) || 1;
      const taxRate = iva ?? (existing.taxRate != null ? Number(existing.taxRate) : 21);
      const marginPct = margen ?? (existing.marginPct != null ? Number(existing.marginPct) : 0);

      let finalPrice = precio;
      if (finalPrice == null) {
        if (costoBulto == null) {
          report.errors.push({ line, error: "Falta costo o precio" });
          continue;
        }
        finalPrice = calcSuggestedPrice(costoBulto, unitsPerBulk, taxRate, marginPct, rounding);
        if (finalPrice == null) {
          report.errors.push({ line, error: "No se pudo calcular el precio" });
          continue;
        }
      }

      await db
        .update(products)
        .set({
          ...(costoBulto != null ? { costPerBulk: String(costoBulto) } : {}),
          ...(iva != null ? { taxRate: String(iva) } : {}),
          ...(margen != null ? { marginPct: String(margen) } : {}),
          price: String(finalPrice),
        })
        .where(eq(products.id, existing.id));

      report.updated++;
    } catch {
      report.errors.push({ line, error: "Error inesperado" });
    }
  }

  return report;
}
