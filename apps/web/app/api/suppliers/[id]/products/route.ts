import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiModule } from "@/lib/api-auth";
import {
  getSupplier,
  linkSupplierProduct,
  listSupplierProducts,
  unlinkSupplierProduct,
} from "@apolo/module-suppliers";

const linkSchema = z.object({
  productId: z.string().uuid(),
  cost: z.number().nonnegative().nullable().optional(),
  code: z.string().max(80).nullable().optional(),
});

const unlinkSchema = z.object({
  productId: z.string().uuid(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiModule("suppliers");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  if (!(await getSupplier(user.tenantId, id))) {
    return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
  }

  const products = await listSupplierProducts(user.tenantId, id);
  return NextResponse.json({ products });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiModule("suppliers");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const result = await linkSupplierProduct(user.tenantId, id, parsed.data.productId, parsed.data);
  if (!result.ok) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiModule("suppliers");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = unlinkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const deleted = await unlinkSupplierProduct(user.tenantId, id, parsed.data.productId);
  if (!deleted) return NextResponse.json({ error: "Vínculo no encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
