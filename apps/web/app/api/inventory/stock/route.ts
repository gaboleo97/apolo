import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiModule } from "@/lib/api-auth";
import { adjustStock, listMovements, listProducts } from "@apolo/module-inventory";

const schema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.number().int().positive(),
  notes: z.string().max(300).nullable().optional(),
});

export async function GET() {
  const user = await requireApiModule("inventory");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const [movements, products] = await Promise.all([
    listMovements(user.tenantId),
    listProducts(user.tenantId),
  ]);
  const productName = new Map(products.map((p) => [p.id, p.name]));

  return NextResponse.json({
    movements: movements.map((m) => ({
      ...m,
      productName: productName.get(m.productId) ?? null,
    })),
  });
}

export async function POST(req: Request) {
  const user = await requireApiModule("inventory");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const result = await adjustStock(user.tenantId, {
    ...parsed.data,
    userId: user.id,
  });

  if (result.error === "NOT_FOUND") {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
  if (result.error === "INSUFFICIENT_STOCK") {
    return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, currentStock: result.currentStock });
}
