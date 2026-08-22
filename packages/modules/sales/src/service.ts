import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db, clients, products, saleItems, salePayments, sales, users } from "@apolo/database";

function toNum(v: unknown): number {
  return typeof v === "number" ? v : Number(v ?? 0);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export type SaleItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type CreateSaleInput = {
  clientId?: string | null;
  items: SaleItemInput[];
  notes?: string | null;
};

export async function nextSaleCode(tenantId: string): Promise<string> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(sales)
    .where(eq(sales.tenantId, tenantId));
  return `V-${String((row?.n ?? 0) + 1).padStart(4, "0")}`;
}

async function validateItems(tenantId: string, items: SaleItemInput[]) {
  if (items.length === 0) return { ok: false as const, error: "EMPTY_ITEMS" as const };

  const ids = [...new Set(items.map((i) => i.productId))];
  const found = await db.query.products.findMany({
    where: and(eq(products.tenantId, tenantId), inArray(products.id, ids)),
  });

  if (found.length !== ids.length) return { ok: false as const, error: "INVALID_PRODUCT" as const };

  for (const item of items) {
    if (!(item.quantity > 0)) return { ok: false as const, error: "INVALID_QUANTITY" as const };
    if (item.unitPrice < 0) return { ok: false as const, error: "INVALID_PRICE" as const };
  }

  const byId = new Map(found.map((p) => [p.id, p]));
  return { ok: true as const, productsById: byId };
}

export async function createSale(
  tenantId: string,
  input: CreateSaleInput,
  userId?: string | null
) {
  const check = await validateItems(tenantId, input.items);
  if (!check.ok) return check;

  let clientName: string | null = null;
  if (input.clientId) {
    const client = await db.query.clients.findFirst({
      where: and(eq(clients.tenantId, tenantId), eq(clients.id, input.clientId)),
    });
    if (!client) return { ok: false as const, error: "CLIENT_NOT_FOUND" as const };
    clientName = client.name;
  }

  const total = round2(
    input.items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0)
  );
  const code = await nextSaleCode(tenantId);

  return db.transaction(async (tx) => {
    const [sale] = await tx
      .insert(sales)
      .values({
        tenantId,
        clientId: input.clientId ?? null,
        code,
        status: "draft",
        total: String(total),
        notes: input.notes?.trim() || null,
        createdBy: userId ?? null,
      })
      .returning();

    await tx.insert(saleItems).values(
      input.items.map((i) => ({
        tenantId,
        saleId: sale!.id,
        productId: i.productId,
        nameSnapshot: check.ok ? check.productsById.get(i.productId)!.name : "",
        quantity: String(i.quantity),
        unitPrice: String(round2(i.unitPrice)),
        lineTotal: String(round2(i.quantity * i.unitPrice)),
      }))
    );

    return { ok: true as const, sale: sale!, clientName };
  });
}

export type SaleListRow = {
  id: string;
  code: string;
  status: string;
  total: number;
  paid: number;
  balance: number;
  clientId: string | null;
  clientName: string | null;
  itemCount: number;
  createdAt: Date | null;
  confirmedAt: Date | null;
};

export async function listSales(
  tenantId: string,
  filters: { status?: "draft" | "confirmed" | "cancelled"; search?: string } = {}
): Promise<SaleListRow[]> {
  const rows = await db
    .select({
      id: sales.id,
      code: sales.code,
      status: sales.status,
      total: sales.total,
      clientId: sales.clientId,
      clientName: clients.name,
      createdAt: sales.createdAt,
      confirmedAt: sales.confirmedAt,
      itemCount: sql<number>`(select count(*)::int from sale_items si where si.sale_id = ${sales.id})`,
      paid: sql<string>`(select coalesce(sum(p.amount), 0) from sale_payments p where p.sale_id = ${sales.id})`,
    })
    .from(sales)
    .leftJoin(clients, eq(clients.id, sales.clientId))
    .where(
      and(
        eq(sales.tenantId, tenantId),
        filters.status ? eq(sales.status, filters.status) : undefined,
        filters.search ? ilike(sales.code, `%${filters.search}%`) : undefined
      )
    )
    .orderBy(desc(sales.createdAt))
    .limit(200);

  return rows.map((r) => {
    const total = toNum(r.total);
    const paid = round2(toNum(r.paid));
    const balance = r.status === "cancelled" ? 0 : round2(Math.max(total - paid, 0));
    return {
      ...r,
      total,
      paid,
      balance,
      itemCount: Number(r.itemCount ?? 0),
    };
  });
}

export async function getSaleDetail(tenantId: string, saleId: string) {
  const [row] = await db
    .select({
      sale: sales,
      clientName: clients.name,
      clientType: clients.clientType,
      clientTaxId: clients.taxId,
      clientAddress: clients.address,
      clientPhone: clients.phone,
      sellerName: users.name,
    })
    .from(sales)
    .leftJoin(clients, eq(clients.id, sales.clientId))
    .leftJoin(users, eq(users.id, sales.createdBy))
    .where(and(eq(sales.tenantId, tenantId), eq(sales.id, saleId)));

  if (!row) return null;

  const items = await db
    .select({
      id: saleItems.id,
      productId: saleItems.productId,
      nameSnapshot: saleItems.nameSnapshot,
      quantity: saleItems.quantity,
      unitPrice: saleItems.unitPrice,
      lineTotal: saleItems.lineTotal,
      productSku: products.sku,
    })
    .from(saleItems)
    .leftJoin(products, eq(products.id, saleItems.productId))
    .where(eq(saleItems.saleId, saleId));
  const payments = await db
    .select()
    .from(salePayments)
    .where(eq(salePayments.saleId, saleId))
    .orderBy(desc(salePayments.paidAt));

  const total = toNum(row.sale.total);
  const paid = round2(payments.reduce((acc, p) => acc + toNum(p.amount), 0));

  return {
    sale: row.sale,
    clientName: row.clientName,
    clientType: row.clientType,
    clientTaxId: row.clientTaxId,
    clientAddress: row.clientAddress,
    clientPhone: row.clientPhone,
    sellerName: row.sellerName,
    items,
    payments,
    total,
    paid,
    balance: round2(Math.max(total - paid, 0)),
  };
}

export async function updateSaleDraft(
  tenantId: string,
  saleId: string,
  input: CreateSaleInput
) {
  const check = await validateItems(tenantId, input.items);
  if (!check.ok) return check;

  if (input.clientId) {
    const client = await db.query.clients.findFirst({
      where: and(eq(clients.tenantId, tenantId), eq(clients.id, input.clientId)),
    });
    if (!client) return { ok: false as const, error: "CLIENT_NOT_FOUND" as const };
  }

  const [sale] = await db
    .select()
    .from(sales)
    .where(and(eq(sales.tenantId, tenantId), eq(sales.id, saleId)));
  if (!sale) return { ok: false as const, error: "NOT_FOUND" as const };
  if (sale.status !== "draft") return { ok: false as const, error: "NOT_DRAFT" as const };

  const total = round2(input.items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0));

  return db.transaction(async (tx) => {
    await tx
      .update(sales)
      .set({
        clientId: input.clientId ?? null,
        total: String(total),
        notes: input.notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(sales.id, saleId));

    await tx.delete(saleItems).where(eq(saleItems.saleId, saleId));
    await tx.insert(saleItems).values(
      input.items.map((i) => ({
        tenantId,
        saleId,
        productId: i.productId,
        nameSnapshot: check.ok ? check.productsById.get(i.productId)!.name : "",
        quantity: String(i.quantity),
        unitPrice: String(round2(i.unitPrice)),
        lineTotal: String(round2(i.quantity * i.unitPrice)),
      }))
    );

    return { ok: true as const };
  });
}

export async function confirmSale(tenantId: string, saleId: string, userId: string) {
  // importa acá para evitar dependencia circular de tipos en build
  const { adjustStock } = await import("@apolo/module-inventory");

  const [sale] = await db
    .select()
    .from(sales)
    .where(and(eq(sales.tenantId, tenantId), eq(sales.id, saleId)));
  if (!sale) return { ok: false as const, error: "NOT_FOUND" as const };
  if (sale.status !== "draft") return { ok: false as const, error: "NOT_DRAFT" as const };

  const items = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));

  // agrupa cantidades por producto (por si vino duplicado en la venta)
  const needByProduct = new Map<string, { qty: number; name: string }>();
  for (const item of items) {
    const prev = needByProduct.get(item.productId);
    const qty = toNum(item.quantity);
    needByProduct.set(item.productId, {
      qty: (prev?.qty ?? 0) + qty,
      name: prev?.name ?? item.nameSnapshot,
    });
  }

  // valida stock antes de tocar nada
  for (const [productId, { qty, name }] of needByProduct) {
    const product = await db.query.products.findFirst({
      where: and(eq(products.tenantId, tenantId), eq(products.id, productId)),
    });
    if (!product) return { ok: false as const, error: "INVALID_PRODUCT" as const };
    if (toNum(product.currentStock) < qty - 1e-9) {
      return {
        ok: false as const,
        error: "INSUFFICIENT_STOCK" as const,
        product: `${name} (disponible: ${toNum(product.currentStock)}, pedido: ${qty})`,
      };
    }
  }

  for (const [productId, { qty, name }] of needByProduct) {
    const res = await adjustStock(tenantId, {
      productId,
      type: "out",
      quantity: qty,
      userId,
      notes: `Venta ${sale.code}`,
      referenceType: "sale",
      referenceId: sale.id,
    });
    if (!res.ok) {
      return { ok: false as const, error: "INSUFFICIENT_STOCK" as const, product: name };
    }
  }

  await db
    .update(sales)
    .set({ status: "confirmed", confirmedAt: new Date(), updatedAt: new Date() })
    .where(eq(sales.id, saleId));

  return { ok: true as const };
}

export async function cancelSale(tenantId: string, saleId: string) {
  const [sale] = await db
    .select()
    .from(sales)
    .where(and(eq(sales.tenantId, tenantId), eq(sales.id, saleId)));
  if (!sale) return { ok: false as const, error: "NOT_FOUND" as const };
  if (sale.status === "cancelled") return { ok: false as const, error: "ALREADY_CANCELLED" as const };

  if (sale.status === "confirmed") {
    // devuelve el stock que había descontado
    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
    for (const item of items) {
      const product = await db.query.products.findFirst({
        where: and(eq(products.tenantId, tenantId), eq(products.id, item.productId)),
      });
      if (!product) continue;
      const restored = toNum(product.currentStock) + toNum(item.quantity);
      await db
        .update(products)
        .set({ currentStock: String(restored), updatedAt: new Date() })
        .where(eq(products.id, item.productId));
      await db.insert((await import("@apolo/database")).stockMovements).values({
        tenantId,
        productId: item.productId,
        userId: sale.createdBy,
        type: "in",
        quantity: String(toNum(item.quantity)),
        referenceType: "sale_cancel",
        referenceId: sale.id,
        notes: `Anulación venta ${sale.code}`,
      });
    }
  }

  await db
    .update(sales)
    .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(sales.id, saleId));

  return { ok: true as const };
}

export async function addPayment(
  tenantId: string,
  saleId: string,
  input: { amount: number; method?: "cash" | "transfer" | "other"; note?: string | null; userId?: string | null }
) {
  const [sale] = await db
    .select()
    .from(sales)
    .where(and(eq(sales.tenantId, tenantId), eq(sales.id, saleId)));
  if (!sale) return { ok: false as const, error: "NOT_FOUND" as const };
  if (sale.status !== "confirmed")
    return { ok: false as const, error: "NOT_CONFIRMED" as const };

  const amount = round2(input.amount);
  if (!(amount > 0)) return { ok: false as const, error: "INVALID_AMOUNT" as const };

  const [agg] = await db
    .select({ paid: sql<string>`coalesce(sum(${salePayments.amount}), 0)` })
    .from(salePayments)
    .where(eq(salePayments.saleId, saleId));
  const balance = round2(toNum(sale.total) - toNum(agg?.paid));
  if (amount > balance + 1e-9) {
    return { ok: false as const, error: "OVERPAY" as const, balance };
  }

  const [payment] = await db
    .insert(salePayments)
    .values({
      tenantId,
      saleId,
      amount: String(amount),
      method: input.method ?? "cash",
      note: input.note?.trim() || null,
      userId: input.userId ?? null,
    })
    .returning();

  return { ok: true as const, payment: payment!, remainingBalance: round2(balance - amount) };
}

export async function deletePayment(tenantId: string, saleId: string, paymentId: string) {
  const res = await db
    .delete(salePayments)
    .where(
      and(
        eq(salePayments.tenantId, tenantId),
        eq(salePayments.saleId, saleId),
        eq(salePayments.id, paymentId)
      )
    )
    .returning();
  if (res.length === 0) return { ok: false as const, error: "NOT_FOUND" as const };
  return { ok: true as const };
}

export async function searchProductsForSale(tenantId: string, search: string) {
  const term = search.trim();
  if (!term) return [];
  return db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      barcode: products.barcode,
      unitType: products.unitType,
      price: products.price,
      currentStock: products.currentStock,
    })
    .from(products)
    .where(
      and(
        eq(products.tenantId, tenantId),
        eq(products.isActive, true),
        or(ilike(products.name, `%${term}%`), ilike(products.sku, `%${term}%`), ilike(products.barcode, `%${term}%`))
      )
    )
    .limit(15);
}
