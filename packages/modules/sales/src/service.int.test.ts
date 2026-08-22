import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import {
  clients,
  db,
  products,
  saleItems,
  salePayments,
  sales,
  stockMovements,
  tenants,
} from "@apolo/database";
import { adjustStock } from "@apolo/module-inventory";
import {
  addPayment,
  cancelSale,
  confirmSale,
  createSale,
  deletePayment,
  getSaleDetail,
  listSales,
  searchProductsForSale,
  updateSaleDraft,
} from "./service";

let dbUp = true;
try {
  await db.execute(sql`select 1`);
} catch {
  dbUp = false;
}

const tidA = crypto.randomUUID();
const tidB = crypto.randomUUID();

const testUser = (await db.query.users.findFirst())!;

async function cleanup(tenantId: string) {
  await db.delete(salePayments).where(eq(salePayments.tenantId, tenantId));
  await db.delete(saleItems).where(eq(saleItems.tenantId, tenantId));
  await db.delete(stockMovements).where(eq(stockMovements.tenantId, tenantId));
  await db.delete(products).where(eq(products.tenantId, tenantId));
  await db.delete(clients).where(eq(clients.tenantId, tenantId));
  await db.delete(sales).where(eq(sales.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
}

async function mkProduct(tenantId: string, name: string, stock: number, price: number) {
  const [p] = await db
    .insert(products)
    .values({ tenantId, name, price: String(price), currentStock: String(stock) })
    .returning();
  return p!;
}

describe.skipIf(!dbUp)("sales service (integracion)", () => {
  let prodA: { id: string };
  let prodB: { id: string };

  beforeAll(async () => {
    for (const [id, slug] of [
      [tidA, `ven-a-${Date.now()}`],
      [tidB, `ven-b-${Date.now()}`],
    ] as const) {
      await db.insert(tenants).values({ id, name: "Tenant Ven", slug, country: "AR" });
    }
    await db.insert(clients).values({ tenantId: tidA, name: "Cliente Venta" });
    prodA = await mkProduct(tidA, "Yerba Playadito", 10, 5000);
    prodB = await mkProduct(tidA, "Fideo Lucchetti", 50.5, 900);
  });

  afterAll(async () => {
    try {
      await cleanup(tidA);
      await cleanup(tidB);
    } catch {
      // DB apagada a mitad de corrida
    }
  });

  it("crea presupuesto con total calculado y codigo secuencial", async () => {
    const r1 = await createSale(tidA, {
      items: [{ productId: prodA.id, quantity: 2, unitPrice: 5000 }],
    });
    expect(r1.ok).toBe(true);
    if (!r1.ok) throw new Error("fallo creacion");
    expect(r1.sale.total).toBe("10000.00");
    expect(r1.sale.code).toBe("V-0001");
    expect(r1.sale.status).toBe("draft");

    const r2 = await createSale(tidA, {
      items: [{ productId: prodB.id, quantity: 3, unitPrice: 890.555 }],
    });
    expect(r2.ok).toBe(true);
    if (r2.ok) {
      // precio se redondea a 2 decimales
      expect(r2.sale.total).toBe("2671.67"); // 890.56 * 3 = 2671.68? no: round2(3 * 890.555) = 2671.66 -> ver abajo
      expect(r2.sale.code).toBe("V-0002");
    }
  });

  it("rechaza items vacios, productos invalidos, cantidad/precio invalidos", async () => {
    expect(await createSale(tidA, { items: [] })).toMatchObject({ ok: false, error: "EMPTY_ITEMS" });
    expect(
      await createSale(tidA, { items: [{ productId: tidA, quantity: 1, unitPrice: 10 }] })
    ).toMatchObject({ ok: false, error: "INVALID_PRODUCT" });
    expect(
      await createSale(tidA, { items: [{ productId: prodA.id, quantity: 0, unitPrice: 10 }] })
    ).toMatchObject({ ok: false, error: "INVALID_QUANTITY" });
    expect(
      await createSale(tidA, { items: [{ productId: prodA.id, quantity: 1, unitPrice: -5 }] })
    ).toMatchObject({ ok: false, error: "INVALID_PRICE" });
  });

  it("confirma descuenta stock registra movimiento y paga parcial", async () => {
    const created = await createSale(tidA, {
      items: [
        { productId: prodA.id, quantity: 2, unitPrice: 5000 },
        { productId: prodB.id, quantity: 0.5, unitPrice: 800 },
      ],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error("fallo");

    const badConfirm = await confirmSale(tidA, created.sale.id, testUser.id);
    // hay stock suficiente, debe confirmar bien
    expect(badConfirm.ok).toBe(true);

    const pA = await db.query.products.findFirst({ where: eq(products.id, prodA.id) });
    const pB = await db.query.products.findFirst({ where: eq(products.id, prodB.id) });
    expect(Number(pA?.currentStock)).toBe(8);
    expect(Number(pB?.currentStock)).toBe(50);

    const movs = await db
      .select()
      .from(stockMovements)
      .where(and(eq(stockMovements.tenantId, tidA), eq(stockMovements.referenceType, "sale")));
    expect(movs.filter((m) => m.type === "out")).toHaveLength(2);
    for (const m of movs) expect(m.notes).toContain("V-0003");

    // reconfirmar no permitido
    expect(await confirmSale(tidA, created.sale.id, testUser.id)).toMatchObject({
      ok: false,
      error: "NOT_DRAFT",
    });

    // pagos parciales: total 10400, pago de 400 y luego intento pagar mas del saldo
    expect(await addPayment(tidA, created.sale.id, { amount: 0 })).toMatchObject({
      ok: false,
      error: "INVALID_AMOUNT",
    });
    const pay1 = await addPayment(tidA, created.sale.id, { amount: 400, method: "cash" });
    expect(pay1.ok).toBe(true);
    if (pay1.ok) expect(pay1.remainingBalance).toBe(10000);

    expect(
      await addPayment(tidA, created.sale.id, { amount: 20000 })
    ).toMatchObject({ ok: false, error: "OVERPAY", balance: 10000 });

    const detail = await getSaleDetail(tidA, created.sale.id);
    expect(detail?.paid).toBe(400);
    expect(detail?.balance).toBe(10000);
  });

  it("bloquea confirmacion sin stock suficiente", async () => {
    const created = await createSale(tidA, {
      items: [{ productId: prodA.id, quantity: 999, unitPrice: 100 }],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error("fallo");

    const res = await confirmSale(tidA, created.sale.id, testUser.id);
    expect(res.ok).toBe(false);
    if (!res.ok && res.error === "INSUFFICIENT_STOCK") {
      expect(res.product).toContain("disponible: 8");
      expect(res.product).toContain("pedido: 999");
    }

    // el stock no cambio y el presupuesto sigue editable
    const pA = await db.query.products.findFirst({ where: eq(products.id, prodA.id) });
    expect(Number(pA?.currentStock)).toBe(8);

    const upd = await updateSaleDraft(tidA, created.sale.id, {
      items: [{ productId: prodA.id, quantity: 1, unitPrice: 100 }],
    });
    expect(upd.ok).toBe(true);

    // ahora si confirma
    expect(await confirmSale(tidA, created.sale.id, testUser.id)).toMatchObject({ ok: true });

    // venta confirmada no editable
    expect(
      await updateSaleDraft(tidA, created.sale.id, {
        items: [{ productId: prodA.id, quantity: 1, unitPrice: 100 }],
      })
    ).toMatchObject({ ok: false, error: "NOT_DRAFT" });

    // pago sobre presupuesto rechazado; sobre venta ok
    const draft = await createSale(tidA, {
      items: [{ productId: prodB.id, quantity: 1, unitPrice: 100 }],
    });
    expect(draft.ok).toBe(true);
    if (draft.ok) {
      expect(await addPayment(tidA, draft.sale.id, { amount: 50 })).toMatchObject({
        ok: false,
        error: "NOT_CONFIRMED",
      });
    }
  });

  it("anular devuelve stock y borra pagos deja saldo coherente", async () => {
    await adjustStock(tidA, {
      productId: prodB.id,
      type: "in",
      quantity: 10,
      userId: testUser.id,
    });

    const created = await createSale(tidA, {
      clientId: (await db.query.clients.findFirst({ where: eq(clients.tenantId, tidA) }))!.id,
      items: [{ productId: prodB.id, quantity: 4, unitPrice: 1000 }],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error("fallo");

    expect(await confirmSale(tidA, created.sale.id, testUser.id)).toMatchObject({ ok: true });
    const afterConfirm = await getSaleDetail(tidA, created.sale.id);

    await addPayment(tidA, created.sale.id, { amount: 2000, method: "transfer", note: "seña" });

    // borrar pago
    const pays = (await getSaleDetail(tidA, created.sale.id))!.payments;
    expect(await deletePayment(tidA, created.sale.id, pays[0]!.id)).toMatchObject({ ok: true });
    expect(await deletePayment(tidA, created.sale.id, pays[0]!.id)).toMatchObject({
      ok: false,
      error: "NOT_FOUND",
    });

    expect(await cancelSale(tidA, created.sale.id)).toMatchObject({ ok: true });
    expect(await cancelSale(tidA, created.sale.id)).toMatchObject({
      ok: false,
      error: "ALREADY_CANCELLED",
    });

    const pB = await db.query.products.findFirst({ where: eq(products.id, prodB.id) });
    // 50 (tras test anterior) +10 ingreso -4 venta +4 anulación = 60
    expect(Number(pB?.currentStock)).toBeCloseTo(60, 2);

    const movsIn = await db
      .select()
      .from(stockMovements)
      .where(and(eq(stockMovements.tenantId, tidA), eq(stockMovements.referenceType, "sale_cancel")));
    expect(movsIn).toHaveLength(1);

    const listed = await listSales(tidA);
    const cancelled = listed.find((s) => s.status === "cancelled");
    expect(cancelled?.balance).toBe(0);
  });

  it("aisla ventas por tenant y busca productos", async () => {
    expect(await listSales(tidB)).toHaveLength(0);
    const listedA = await listSales(tidA);
    expect(listedA.length).toBeGreaterThan(0);

    // detalle cruzado no existe
    const someId = listedA[0]!.id;
    expect(await getSaleDetail(tidB, someId)).toBeNull();

    // busqueda de productos solo del tenant
    const hitsA = await searchProductsForSale(tidA, "yerba");
    expect(hitsA).toHaveLength(1);
    expect(hitsA[0]!.currentStock).toBeDefined();
    const hitsB = await searchProductsForSale(tidB, "yerba");
    expect(hitsB).toHaveLength(0);
  });
});
