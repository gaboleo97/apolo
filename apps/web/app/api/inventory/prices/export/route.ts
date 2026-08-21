import { NextResponse } from "next/server";
import { requireApiModule } from "@/lib/api-auth";
import { toCsv } from "@/lib/csv";
import { listProducts } from "@apolo/module-inventory";

export async function GET() {
  const user = await requireApiModule("inventory");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const products = await listProducts(user.tenantId);

  const rows = products.map((p) => ({
    nombre: p.name,
    sku: p.sku ?? "",
    codigo_barras: p.barcode ?? "",
    costo_bulto: p.costPerBulk != null ? p.costPerBulk.toFixed(2) : "",
    iva: String(p.taxRate ?? 21),
    margen: String(p.marginPct ?? 0),
    precio: p.price.toFixed(2),
  }));

  const csv = toCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="precios.csv"',
    },
  });
}
