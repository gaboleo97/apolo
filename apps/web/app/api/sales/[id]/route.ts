import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiModule } from "@/lib/api-auth";
import {
  cancelSale,
  confirmSale,
  getSaleDetail,
  updateSaleDraft,
} from "@apolo/module-sales";

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive().max(999999),
  unitPrice: z.number().min(0).max(99999999),
});

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("confirm") }),
  z.object({ action: z.literal("cancel") }),
  z.object({
    action: z.literal("update"),
    clientId: z.string().uuid().nullable().optional(),
    items: z.array(itemSchema).min(1),
    notes: z.string().max(500).nullable().optional(),
  }),
]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiModule("sales");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const detail = await getSaleDetail(user.tenantId, id);
  if (!detail) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });

  return NextResponse.json(detail);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiModule("sales");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  if (parsed.data.action === "confirm") {
    const res = await confirmSale(user.tenantId, id, user.id);
    if (!res.ok) {
      const msg =
        res.error === "NOT_DRAFT"
          ? "Solo los presupuestos se pueden confirmar"
          : res.error === "INSUFFICIENT_STOCK"
            ? `Stock insuficiente: ${"product" in res && res.product ? res.product : ""}`
            : "Venta no encontrada";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "cancel") {
    const res = await cancelSale(user.tenantId, id);
    if (!res.ok) {
      const msg =
        res.error === "ALREADY_CANCELLED"
          ? "La venta ya está anulada"
          : "Venta no encontrada";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  const res = await updateSaleDraft(user.tenantId, id, parsed.data);
  if (!res.ok) {
    const msg =
      res.error === "NOT_DRAFT"
        ? "Solo los presupuestos se pueden editar"
        : res.error === "CLIENT_NOT_FOUND"
          ? "Cliente no encontrado"
          : res.error === "INVALID_PRODUCT"
            ? "Hay productos inválidos en la venta"
            : res.error === "INVALID_QUANTITY"
              ? "Las cantidades deben ser mayores a cero"
              : res.error === "INVALID_PRICE"
                ? "Los precios no pueden ser negativos"
                : "Datos inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
