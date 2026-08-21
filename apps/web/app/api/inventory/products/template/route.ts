import { NextResponse } from "next/server";
import { requireApiModule } from "@/lib/api-auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const user = await requireApiModule("inventory");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const example = [
    {
      nombre: "Papa",
      categoria: "Verduras",
      sku: "PAPA-001",
      codigo_barras: "",
      unidad: "kg",
      cantidad_por_bulto: "20",
      stock_minimo: "50",
      stock: "100",
      descripcion: "Papa blanca por kilo",
      activo: "si",
    },
  ];

  const csv = toCsv(example);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla-productos.csv"',
    },
  });
}
