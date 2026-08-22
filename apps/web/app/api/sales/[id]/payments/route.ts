import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiModule } from "@/lib/api-auth";
import { addPayment } from "@apolo/module-sales";

const paymentSchema = z.object({
  amount: z.number().positive().max(99999999),
  method: z.enum(["cash", "transfer", "other"]).optional(),
  note: z.string().max(300).nullable().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiModule("sales");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const res = await addPayment(user.tenantId, id, {
    ...parsed.data,
    userId: user.id,
  });

  if (!res.ok) {
    const msg =
      res.error === "NOT_CONFIRMED"
        ? "Solo se registran pagos sobre ventas confirmadas"
        : res.error === "OVERPAY"
          ? `El pago supera el saldo pendiente${res.balance !== undefined ? ` ($${res.balance.toFixed(2)})` : ""}`
          : res.error === "INVALID_AMOUNT"
            ? "El monto debe ser mayor a cero"
            : "Venta no encontrada";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ ok: true, remainingBalance: res.remainingBalance });
}
