import { NextResponse } from "next/server";
import { requireApiModule } from "@/lib/api-auth";
import { listMovements, listProducts } from "@apolo/module-inventory";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const user = await requireApiModule("inventory");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { productId } = await params;

  const movements = await listMovements(user.tenantId, productId);
  const products = await listProducts(user.tenantId);
  const productName = new Map(products.map((p) => [p.id, p.name]));

  return NextResponse.json({
    movements: movements.map((m) => ({
      ...m,
      productName: productName.get(m.productId) ?? null,
    })),
  });
}
