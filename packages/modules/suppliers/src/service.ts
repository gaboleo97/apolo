import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, products, supplierProducts, suppliers } from "@apolo/database";

export type SupplierInput = {
  name: string;
  taxId?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contactName?: string | null;
  notes?: string | null;
};

function serializeSupplier(s: typeof suppliers.$inferSelect) {
  return {
    id: s.id,
    tenantId: s.tenantId,
    name: s.name,
    taxId: s.taxId,
    phone: s.phone,
    email: s.email,
    address: s.address,
    contactName: s.contactName,
    notes: s.notes,
    isActive: s.isActive ?? true,
    createdAt: s.createdAt,
  };
}

export async function listSuppliers(tenantId: string, opts?: { search?: string }) {
  const rows = await db.query.suppliers.findMany({
    where: and(
      eq(suppliers.tenantId, tenantId),
      opts?.search
        ? or(
            ilike(suppliers.name, `%${opts.search}%`),
            ilike(suppliers.taxId, `%${opts.search}%`)
          )
        : undefined
    ),
    orderBy: desc(suppliers.createdAt),
  });
  return rows.map(serializeSupplier);
}

export async function getSupplier(tenantId: string, supplierId: string) {
  const row = await db.query.suppliers.findFirst({
    where: and(eq(suppliers.id, supplierId), eq(suppliers.tenantId, tenantId)),
  });
  return row ? serializeSupplier(row) : null;
}

export async function createSupplier(tenantId: string, input: SupplierInput) {
  const existing = await findSupplierByName(tenantId, input.name);
  if (existing) return { ok: false as const, error: "DUPLICATE" as const };

  const created = await db
    .insert(suppliers)
    .values({
      tenantId,
      name: input.name.trim(),
      taxId: input.taxId?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      contactName: input.contactName?.trim() || null,
      notes: input.notes?.trim() || null,
      isActive: true,
    })
    .returning();

  const s = created[0];
  return s ? { ok: true as const, supplier: serializeSupplier(s) } : { ok: false as const, error: "ERROR" as const };
}

export async function updateSupplier(
  tenantId: string,
  supplierId: string,
  input: Partial<SupplierInput> & { isActive?: boolean }
) {
  if (input.name !== undefined) {
    const dup = await db.query.suppliers.findFirst({
      where: and(
        eq(suppliers.tenantId, tenantId),
        ilike(suppliers.name, input.name.trim()),
        eq(suppliers.isActive, true)
      ),
    });
    if (dup && dup.id !== supplierId) return { ok: false as const, error: "DUPLICATE" as const };
  }

  const updated = await db
    .update(suppliers)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.taxId !== undefined ? { taxId: input.taxId?.trim() || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
      ...(input.email !== undefined ? { email: input.email?.trim() || null } : {}),
      ...(input.address !== undefined ? { address: input.address?.trim() || null } : {}),
      ...(input.contactName !== undefined ? { contactName: input.contactName?.trim() || null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    })
    .where(and(eq(suppliers.id, supplierId), eq(suppliers.tenantId, tenantId)))
    .returning();

  const s = updated[0];
  return s ? { ok: true as const, supplier: serializeSupplier(s) } : { ok: false as const, error: "NOT_FOUND" as const };
}

// ---------- Productos del proveedor ----------

function serializeLink(row: typeof supplierProducts.$inferSelect, p: typeof products.$inferSelect) {
  return {
    id: row.id,
    productId: row.productId,
    supplierId: row.supplierId,
    code: row.code,
    cost: row.cost != null ? Number(row.cost) : null,
    productName: p.name,
    productSku: p.sku,
    productUnitType: p.unitType,
    inventoryCostPerBulk: p.costPerBulk != null ? Number(p.costPerBulk) : null,
    inventoryCostPerUnit:
      p.costPerBulk != null && Number(p.unitsPerBulk) > 0
        ? Math.round((Number(p.costPerBulk) / Number(p.unitsPerBulk)) * 100) / 100
        : null,
    isActive: p.isActive,
  };
}

export async function listSupplierProducts(tenantId: string, supplierId: string) {
  const rows = await db.query.supplierProducts.findMany({
    where: and(eq(supplierProducts.tenantId, tenantId), eq(supplierProducts.supplierId, supplierId)),
    orderBy: desc(supplierProducts.createdAt),
  });

  if (rows.length === 0) return [];

  const out = [];
  for (const row of rows) {
    const p = await db.query.products.findFirst({ where: eq(products.id, row.productId) });
    if (!p) continue;
    out.push(serializeLink(row, p));
  }
  return out;
}

export async function linkSupplierProduct(
  tenantId: string,
  supplierId: string,
  productId: string,
  data?: { cost?: number | null; code?: string | null }
) {
  const [supplier, product] = await Promise.all([
    db.query.suppliers.findFirst({
      where: and(eq(suppliers.id, supplierId), eq(suppliers.tenantId, tenantId)),
    }),
    db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.tenantId, tenantId)),
    }),
  ]);
  if (!supplier || !product) return { ok: false as const, error: "NOT_FOUND" as const };

  await db
    .insert(supplierProducts)
    .values({
      tenantId,
      supplierId,
      productId,
      cost: data?.cost != null ? String(data.cost) : null,
      code: data?.code?.trim() || null,
    })
    .onConflictDoUpdate({
      target: [supplierProducts.supplierId, supplierProducts.productId],
      set: {
        ...(data?.cost !== undefined ? { cost: data?.cost != null ? String(data.cost) : null } : {}),
        ...(data?.code !== undefined ? { code: data?.code?.trim() || null } : {}),
      },
    });

  return { ok: true as const };
}

export async function unlinkSupplierProduct(tenantId: string, supplierId: string, productId: string) {
  const deleted = await db
    .delete(supplierProducts)
    .where(
      and(
        eq(supplierProducts.tenantId, tenantId),
        eq(supplierProducts.supplierId, supplierId),
        eq(supplierProducts.productId, productId)
      )
    )
    .returning();
  return deleted.length > 0;
}

// ---------- CSV ----------

export type SupplierImportRow = {
  nombre?: string;
  cuit?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  contacto?: string;
  notas?: string;
  activo?: string;
};

async function findSupplierByName(tenantId: string, name: string) {
  return db.query.suppliers.findFirst({
    where: and(eq(suppliers.tenantId, tenantId), ilike(suppliers.name, name.trim())),
  });
}

function parseBool(v?: string): boolean {
  if (!v || v.trim() === "") return true;
  const k = v.trim().toLowerCase();
  return !["no", "false", "0", "inactivo", "off"].includes(k);
}

export type ImportReport = {
  created: number;
  updated: number;
  errors: { line: number; error: string }[];
};

export async function upsertSuppliers(tenantId: string, rows: SupplierImportRow[]): Promise<ImportReport> {
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

      const values = {
        name: nombre,
        taxId: row.cuit?.trim() || null,
        phone: row.telefono?.trim() || null,
        email: row.email?.trim() || null,
        address: row.direccion?.trim() || null,
        contactName: row.contacto?.trim() || null,
        notes: row.notas?.trim() || null,
        isActive: parseBool(row.activo),
      };

      const existing = await findSupplierByName(tenantId, nombre);
      if (existing) {
        await db.update(suppliers).set(values).where(eq(suppliers.id, existing.id));
        report.updated++;
      } else {
        await db.insert(suppliers).values({ tenantId, ...values });
        report.created++;
      }
    } catch {
      report.errors.push({ line, error: "Error inesperado" });
    }
  }

  return report;
}
