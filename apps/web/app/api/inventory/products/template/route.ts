import { NextResponse } from "next/server";
import { requireApiModule } from "@/lib/api-auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const user = await requireApiModule("inventory");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const example = [
    {
      nombre: "Coca Cola 1.5L",
      categoria: "Bebidas",
      sku: "COCA15",
      codigo_barras: "7790895000997",
      unidad: "unidad",
      precio: "2500.00",
      costo: "1500.00",
      iva: "21",
      stock_minimo: "10",
      stock: "50",
      descripcion: "Gaseosa 1.5 litros",
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
