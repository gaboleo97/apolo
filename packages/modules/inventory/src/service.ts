import { and, desc, eq, ilike } from "drizzle-orm";
import { db, categories, products, stockMovements } from "@apolo/database";

export type UnitType = "unit" | "kg" | "lt" | "m" | "box" | "pack";

export type ProductInput = {
  name: string;
  categoryId?: string | null;
  price: number;
  cost?: number | null;
  taxRate?: number;
  sku?: string | null;
  barcode?: string | null;
  unitType?: UnitType;
  minStock?: number;
  description?: string | null;
};

function serializeProduct(p: typeof products.$inferSelect) {
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
    cost: p.cost != null ? Number(p.cost) : null,
    taxRate: p.taxRate != null ? Number(p.taxRate) : 0,
    minStock: p.minStock,
    currentStock: p.currentStock,
    isActive: p.isActive,
    createdAt: p.createdAt,
  };
}

export async function listProducts(
  tenantId: string,
  opts?: { search?: string; categoryId?: string }
) {
  const rows = await db.query.products.findMany({
    where: and(
      eq(products.tenantId, tenantId),
      opts?.categoryId ? eq(products.categoryId, opts.categoryId) : undefined,
      opts?.search ? ilike(products.name, `%${opts.search}%`) : undefined
    ),
    orderBy: desc(products.createdAt),
  });
  return rows.map(serializeProduct);
}

export async function getProduct(tenantId: string, productId: string) {
  const row = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.tenantId, tenantId)),
  });
  return row ? serializeProduct(row) : null;
}

export async function createProduct(tenantId: string, input: ProductInput) {
  const created = await db
    .insert(products)
    .values({
      tenantId,
      name: input.name.trim(),
      categoryId: input.categoryId ?? null,
      price: String(input.price),
      cost: input.cost != null ? String(input.cost) : null,
      taxRate: String(input.taxRate ?? 21),
      sku: input.sku?.trim() || null,
      barcode: input.barcode?.trim() || null,
      unitType: input.unitType ?? "unit",
      minStock: input.minStock ?? 0,
      description: input.description?.trim() || null,
      isActive: true,
    })
    .returning();

  const p = created[0];
  return p ? serializeProduct(p) : null;
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
      ...(input.cost !== undefined ? { cost: input.cost != null ? String(input.cost) : null } : {}),
      ...(input.taxRate !== undefined ? { taxRate: String(input.taxRate) } : {}),
      ...(input.sku !== undefined ? { sku: input.sku?.trim() || null } : {}),
      ...(input.barcode !== undefined ? { barcode: input.barcode?.trim() || null } : {}),
      ...(input.unitType !== undefined ? { unitType: input.unitType } : {}),
      ...(input.minStock !== undefined ? { minStock: input.minStock } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    })
    .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
    .returning();

  const p = updated[0];
  return p ? serializeProduct(p) : null;
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

    const current = product.currentStock ?? 0;
    let next = current;

    if (input.type === "in") {
      next = current + input.quantity;
    } else if (input.type === "out") {
      next = current - input.quantity;
      if (next < 0) return { ok: false as const, error: "INSUFFICIENT_STOCK" as const };
    } else {
      next = input.quantity;
    }

    await tx.update(products).set({ currentStock: next }).where(eq(products.id, input.productId));
    await tx.insert(stockMovements).values({
      tenantId,
      productId: input.productId,
      userId: input.userId,
      type: input.type,
      quantity: input.quantity,
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

export type ImportRow = {
  nombre?: string;
  categoria?: string;
  sku?: string;
  codigo_barras?: string;
  unidad?: string;
  precio?: string;
  costo?: string;
  iva?: string;
  stock_minimo?: string;
  stock?: string;
  descripcion?: string;
  activo?: string;
};

export type ImportReport = {
  created: number;
  updated: number;
  errors: { line: number; error: string }[];
};

function parseNumber(v?: string): number | null {
  if (v == null) return null;
  let s = v.trim().replace(/[^0-9.,-]/g, "");
  if (s === "") return null;
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseBool(v?: string): boolean {
  if (!v || v.trim() === "") return true;
  const k = v.trim().toLowerCase();
  return !["no", "false", "0", "inactivo", "off"].includes(k);
}

const unitMap: Record<string, UnitType> = {
  unidad: "unit", un: "unit", u: "unit", unit: "unit",
  kg: "kg", kilogramo: "kg", kilos: "kg",
  lt: "lt", l: "lt", litro: "lt", litros: "lt",
  m: "m", metro: "m", metros: "m",
  box: "box", caja: "box", cajas: "box",
  pack: "pack", paquete: "pack",
};

function normalizeUnit(v?: string): UnitType {
  if (!v || v.trim() === "") return "unit";
  return unitMap[v.trim().toLowerCase()] ?? "unit";
}

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

export async function upsertProducts(
  tenantId: string,
  userId: string,
  rows: ImportRow[]
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

      const precio = parseNumber(row.precio);
      if (precio == null || precio <= 0) {
        report.errors.push({ line, error: "Precio inválido o faltante" });
        continue;
      }

      const costo = parseNumber(row.costo);
      const iva = parseNumber(row.iva) ?? 21;
      const stockMinimo = parseNumber(row.stock_minimo);
      const stock = parseNumber(row.stock);
      const unidad = normalizeUnit(row.unidad);
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
            price: String(precio),
            cost: costo != null ? String(costo) : null,
            taxRate: String(iva),
            minStock: stockMinimo != null ? Math.round(stockMinimo) : 0,
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
            quantity: Math.round(stock),
            notes: "carga masiva",
            userId,
          });
        }

        report.updated++;
      } else {
        const created = await db
          .insert(products)
          .values({
            tenantId,
            name: nombre,
            categoryId,
            price: String(precio),
            cost: costo != null ? String(costo) : null,
            taxRate: String(iva),
            sku,
            barcode,
            unitType: unidad,
            minStock: stockMinimo != null ? Math.round(stockMinimo) : 0,
            currentStock: 0,
            description: row.descripcion?.trim() || null,
            isActive: activo,
          })
          .returning();

        const p = created[0];
        if (p && stock != null && stock > 0) {
          await adjustStock(tenantId, {
            productId: p.id,
            type: "adjustment",
            quantity: Math.round(stock),
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
