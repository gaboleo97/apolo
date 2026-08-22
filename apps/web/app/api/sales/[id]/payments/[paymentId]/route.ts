import { NextResponse } from "next/server";
import { requireApiModule } from "@/lib/api-auth";
import { deletePayment } from "@apolo/module-sales";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const user = await requireApiModule("sales");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id, paymentId } = await params;
  const res = await deletePayment(user.tenantId, id, paymentId);
  if (!res.ok) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
