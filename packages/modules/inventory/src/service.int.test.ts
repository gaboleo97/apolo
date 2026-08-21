import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray, sql } from "drizzle-orm";
import { categories, db, products, stockMovements, tenants } from "@apolo/database";
import {
  adjustStock,
  createProduct,
  getProduct,
  getPricingSettings,
  listMovements,
  listProducts,
  setTenantRounding,
  upsertPrices,
  upsertProducts,
} from "./service";

let dbUp = true;
try {
  await db.execute(sql`select 1`);
} catch {
  dbUp = false;
}

const tidA = crypto.randomUUID();
const tidB = crypto.randomUUID();
let testUserId = "";

async function cleanup(tenantId: string) {
  const prods = await db.query.products.findMany({ where: eq(products.tenantId, tenantId) });
  if (prods.length > 0) {
    await db.delete(stockMovements).where(
      inArray(
        stockMovements.productId,
        prods.map((p) => p.id)
      )
    );
  }
  await db.delete(products).where(eq(products.tenantId, tenantId));
  await db.delete(categories).where(eq(categories.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
}

describe.skipIf(!dbUp)("inventory service (integracion)", () => {
  beforeAll(async () => {
    for (const [id, slug] of [
      [tidA, `test-a-${Date.now()}`],
      [tidB, `test-b-${Date.now()}`],
    ] as const) {
      await db.insert(tenants).values({ id, name: "Tenant Test", slug, country: "AR" });
    }
    // los movimientos tienen FK a users: usamos un usuario existente
    testUserId = (await db.query.users.findFirst())!.id;
  });

  afterAll(async () => {
    try {
      await cleanup(tidA);
      await cleanup(tidB);
    } catch {
      // la DB se apago a mitad de la corrida: nada que limpiar
    }
  });

  it("createProduct genera SKU, calcula costo unitario y sugerido", async () => {
    const p = await createProduct(tidA, {
      name: "Papa Test",
      price: 618.8,
      costPerBulk: 8000,
      unitsPerBulk: 20,
      marginPct: 40,
      taxRate: 10.5,
    });

    expect(p?.sku).toMatch(/^PAPA-[A-Z0-9]{4}$/);
    expect(p?.costPerUnit).toBe(400);
    expect(p?.suggestedPrice).toBe(618.8);
    expect(p?.currentStock).toBe(0);
  });

  it("el sugerido refleja el redondeo configurado del tenant", async () => {
    await setTenantRounding(tidA, "50");
    expect(await getPricingSettings(tidA)).toEqual({ priceRounding: "50" });

    const listed = await listProducts(tidA);
    expect(listed.find((p) => p.name === "Papa Test")?.suggestedPrice).toBe(600);

    await setTenantRounding(tidA, "none");
    const restored = await listProducts(tidA);
    expect(restored.find((p) => p.name === "Papa Test")?.suggestedPrice).toBe(618.8);
  });

  it("aisla productos por tenant", async () => {
    const listed = await listProducts(tidB);
    expect(listed).toHaveLength(0);
  });

  it("adjustStock registra entradas, salidas y ajustes con decimales", async () => {
    const p = await createProduct(tidA, { name: "Lechuga Test", price: 500 });
    const productId = p!.id;

    await adjustStock(tidA, { productId, type: "in", quantity: 45.5, userId: testUserId });
    expect((await getProduct(tidA, productId))?.currentStock).toBe(45.5);

    await adjustStock(tidA, { productId, type: "out", quantity: 0.5, userId: testUserId });
    expect((await getProduct(tidA, productId))?.currentStock).toBe(45);

    await expect(
      adjustStock(tidA, { productId, type: "out", quantity: 100, userId: testUserId })
    ).resolves.toMatchObject({ ok: false, error: "INSUFFICIENT_STOCK" });
    expect((await getProduct(tidA, productId))?.currentStock).toBe(45);

    await adjustStock(tidA, { productId, type: "adjustment", quantity: 30, userId: testUserId });
    expect((await getProduct(tidA, productId))?.currentStock).toBe(30);

    const movs = await listMovements(tidA, productId);
    expect(movs).toHaveLength(3);
    expect(movs.some((m) => Number(m.quantity) === 45.5)).toBe(true);

    const cross = await adjustStock(tidB, { productId, type: "in", quantity: 1, userId: testUserId });
    expect(cross.ok).toBe(false);
  });

  it("upsertProducts crea y re-importa sin duplicar", async () => {
    const rows = [
      {
        nombre: "Tomate Test",
        categoria: "Verduras Test",
        unidad: "kg",
        cantidad_por_bulto: "25",
        stock: "60.5",
      },
      {
        nombre: "Coca Test",
        sku: "COCA-TEST",
        codigo_barras: "7790001111",
        unidad: "unit",
        stock: "12",
      },
    ];

    const first = await upsertProducts(tidA, testUserId, rows);
    expect(first.created).toBe(2);
    expect(first.updated).toBe(0);
    expect(first.errors).toHaveLength(0);

    const second = await upsertProducts(tidA, testUserId, rows);
    expect(second.created).toBe(0);
    expect(second.updated).toBe(2);

    const listed = await listProducts(tidA);
    expect(listed.filter((p) => p.name === "Tomate Test")).toHaveLength(1);
    expect(listed.find((p) => p.name === "Tomate Test")?.unitsPerBulk).toBe(25);
    expect(listed.find((p) => p.name === "Tomate Test")?.currentStock).toBe(60.5);

    const cats = await db.query.categories.findMany({ where: eq(categories.tenantId, tidA) });
    expect(cats.filter((c) => c.name === "Verduras Test")).toHaveLength(1);

    const tomate = listed.find((p) => p.name === "Tomate Test");
    const movs = await listMovements(tidA, tomate!.id);
    expect(movs.some((m) => m.notes === "carga masiva")).toBe(true);
  });

  it("upsertPrices identifica por nombre/sku/codigo de barras y aplica redondeo", async () => {
    const listedBefore = await listProducts(tidA);
    const cocaSku = listedBefore.find((p) => p.name === "Coca Test")!.sku!;

    const report = await upsertPrices(tidA, [
      // por nombre, precio calculado: 5000/25=200 * 1.105 * 1.3 = 287.30
      { nombre: "Tomate Test", costo_bulto: "5000", iva: "10,5", margen: "30" },
      // por sku, precio explicito
      { nombre: "", sku: cocaSku, precio: "700" },
      // errores
      { nombre: "Fantasma", precio: "100" },
      { nombre: "Tomate Test" }, // sin costo ni precio
    ]);

    expect(report.errors).toEqual([
      { line: 4, error: "Producto no encontrado" },
      { line: 5, error: "Falta costo o precio" },
    ]);

    let listed = await listProducts(tidA);
    const tomate = listed.find((p) => p.name === "Tomate Test")!;
    expect(tomate.price).toBe(287.3);
    expect(listed.find((p) => p.name === "Coca Test")!.price).toBe(700);

    // redondeo x100 en carga de precios
    await setTenantRounding(tidA, "100");
    await upsertPrices(tidA, [{ nombre: "Tomate Test", costo_bulto: "9000", margen: "35" }]);
    listed = await listProducts(tidA);
    // exacto: 9000/25=360 * 1.105 * 1.35 = 537.03 -> multiplo de 100 mas cercano = 500
    expect(listed.find((p) => p.name === "Tomate Test")!.price).toBe(500);

    await setTenantRounding(tidA, "none");
  });

  it("getProduct respeta el tenant", async () => {
    const listed = await listProducts(tidA);
    const some = listed[0]!;

    expect(await getProduct(tidA, some.id)).not.toBeNull();
    expect(await getProduct(tidB, some.id)).toBeNull();
  });
});
