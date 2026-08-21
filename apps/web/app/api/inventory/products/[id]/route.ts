import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiModule } from "@/lib/api-auth";
import { updateProduct } from "@apolo/module-inventory";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  price: z.number().min(0).optional(),
  costPerBulk: z.number().nonnegative().nullable().optional(),
  unitsPerBulk: z.number().positive().optional(),
  marginPct: z.number().min(0).optional(),
  taxRate: z.number().min(0).optional(),
  sku: z.string().max(80).nullable().optional(),
  barcode: z.string().max(80).nullable().optional(),
  unitType: z.enum(["unit", "kg", "lt", "m", "box", "pack"]).optional(),
  minStock: z.number().min(0).optional(),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiModule("inventory");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const product = await updateProduct(user.tenantId, id, parsed.data);
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true, product });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiModule("inventory");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;

  const product = await updateProduct(user.tenantId, id, { isActive: false });
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
