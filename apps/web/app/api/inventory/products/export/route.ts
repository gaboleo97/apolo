import { NextResponse } from "next/server";
import { requireApiModule } from "@/lib/api-auth";
import { toCsv } from "@/lib/csv";
import { listProducts, listCategories } from "@apolo/module-inventory";

export async function GET() {
  const user = await requireApiModule("inventory");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const [products, categories] = await Promise.all([
    listProducts(user.tenantId),
    listCategories(user.tenantId),
  ]);
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  const rows = products.map((p) => ({
    nombre: p.name,
    categoria: p.categoryId ? catName.get(p.categoryId) ?? "" : "",
    sku: p.sku ?? "",
    codigo_barras: p.barcode ?? "",
    unidad: p.unitType ?? "unidad",
    cantidad_por_bulto: String(p.unitsPerBulk ?? 1),
    stock_minimo: String(p.minStock ?? 0),
    stock: String(p.currentStock ?? 0),
    descripcion: p.description ?? "",
    activo: p.isActive ? "si" : "no",
  }));

  const csv = toCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="productos.csv"',
    },
  });
}
