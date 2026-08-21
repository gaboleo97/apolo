import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db, products, supplierProducts, suppliers, tenants } from "@apolo/database";
import { createProduct } from "@apolo/module-inventory";
import {
  createSupplier,
  getSupplier,
  linkSupplierProduct,
  listSuppliers,
  listSupplierProducts,
  unlinkSupplierProduct,
  updateSupplier,
  upsertSuppliers,
} from "./service";

let dbUp = true;
try {
  await db.execute(sql`select 1`);
} catch {
  dbUp = false;
}

const tidA = crypto.randomUUID();
const tidB = crypto.randomUUID();

async function cleanup(tenantId: string) {
  await db.delete(supplierProducts).where(eq(supplierProducts.tenantId, tenantId));
  await db.delete(products).where(eq(products.tenantId, tenantId));
  await db.delete(suppliers).where(eq(suppliers.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
}

describe.skipIf(!dbUp)("suppliers service (integracion)", () => {
  beforeAll(async () => {
    for (const [id, slug] of [
      [tidA, `sup-a-${Date.now()}`],
      [tidB, `sup-b-${Date.now()}`],
    ] as const) {
      await db.insert(tenants).values({ id, name: "Tenant Sup", slug, country: "AR" });
    }
  });

  afterAll(async () => {
    try {
      await cleanup(tidA);
      await cleanup(tidB);
    } catch {
      // DB apagada a mitad de corrida
    }
  });

  it("crea, busca y actualiza proveedores", async () => {
    const r1 = await createSupplier(tidA, { name: "Distribuidora Test" });
    expect(r1.ok).toBe(true);

    const dup = await createSupplier(tidA, { name: "distribuidora test" });
    expect(dup).toMatchObject({ ok: false, error: "DUPLICATE" });

    const r2 = await createSupplier(tidA, {
      name: "Verduras del Sur",
      taxId: "30-71234567-4",
      phone: "011 4777-1234",
    });
    expect(r2.ok).toBe(true);

    const found = await listSuppliers(tidA, { search: "del sur" });
    expect(found).toHaveLength(1);
    expect(found[0]?.taxId).toBe("30-71234567-4");

    const byTax = await listSuppliers(tidA, { search: "71234567" });
    expect(byTax).toHaveLength(1);

    const upd = await updateSupplier(tidA, r2.ok ? r2.supplier.id : "", {
      phone: "011 4000-0000",
      isActive: false,
    });
    expect(upd.ok).toBe(true);
    if (upd.ok) expect(upd.supplier.isActive).toBe(false);

    const renamed = await updateSupplier(tidA, r2.ok ? r2.supplier.id : "", { name: "Distribuidora Test" });
    expect(renamed).toMatchObject({ ok: false, error: "DUPLICATE" });
  });

  it("aisla proveedores por tenant", async () => {
    expect(await listSuppliers(tidB)).toHaveLength(0);

    const listed = await listSuppliers(tidA);
    const some = listed[0]!;
    expect(await getSupplier(tidB, some.id)).toBeNull();
  });

  it("vincula productos sin duplicar y desvincula", async () => {
    const sup = await createSupplier(tidA, { name: "Proveedor Productos" });
    if (!sup.ok) throw new Error("no se creo el proveedor");

    const prod = await createProduct(tidA, {
      name: "Papa Sup",
      price: 500,
      costPerBulk: 8000,
      unitsPerBulk: 20,
    });

    const first = await linkSupplierProduct(tidA, sup.supplier.id, prod!.id, {
      cost: 7900,
      code: "PAP-20",
    });
    expect(first.ok).toBe(true);

    // revincular con otro costo no duplica
    await linkSupplierProduct(tidA, sup.supplier.id, prod!.id, { cost: 8100 });
    let linked = await listSupplierProducts(tidA, sup.supplier.id);
    expect(linked).toHaveLength(1);
    expect(linked[0]?.cost).toBe(8100);
    expect(linked[0]?.code).toBe("PAP-20");
    expect(linked[0]?.inventoryCostPerUnit).toBe(400);

    // producto de otro tenant: no existe
    const cross = await linkSupplierProduct(tidB, sup.supplier.id, prod!.id, {});
    expect(cross.ok).toBe(false);

    // desvincular
    expect(await unlinkSupplierProduct(tidA, sup.supplier.id, prod!.id)).toBe(true);
    linked = await listSupplierProducts(tidA, sup.supplier.id);
    expect(linked).toHaveLength(0);
    expect(await unlinkSupplierProduct(tidA, sup.supplier.id, prod!.id)).toBe(false);
  });

  it("importa proveedores sin duplicar", async () => {
    const rows = [
      { nombre: "Importado Uno", cuit: "30-11111111-1", telefono: "555" },
      { nombre: "Importado Dos", activo: "no" },
    ];

    const first = await upsertSuppliers(tidA, rows);
    expect(first.created).toBe(2);
    expect(first.errors).toHaveLength(0);

    const second = await upsertSuppliers(tidA, [
      ...rows,
      { nombre: "Importado Uno", telefono: "999" },
      { nombre: "" },
    ]);
    expect(second.created).toBe(0);
    // las tres filas con nombre valido existen y se actualizan
    expect(second.updated).toBe(3);
    expect(second.errors).toEqual([{ line: 5, error: "Falta nombre" }]);

    const imported = (await listSuppliers(tidA)).find((s) => s.name === "Importado Uno");
    expect(imported?.phone).toBe("999");
  });
});
