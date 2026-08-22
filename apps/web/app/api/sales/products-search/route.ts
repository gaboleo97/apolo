import { NextResponse } from "next/server";
import { requireApiModule } from "@/lib/api-auth";
import { searchProductsForSale } from "@apolo/module-sales";

export async function GET(req: Request) {
  const user = await requireApiModule("sales");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const search = new URL(req.url).searchParams.get("search") ?? "";
  const productsFound = await searchProductsForSale(user.tenantId, search);
  return NextResponse.json({
    products: productsFound.map((p) => ({
      ...p,
      price: Number(p.price),
      currentStock: Number(p.currentStock),
    })),
  });
}
