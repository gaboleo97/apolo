import { NextResponse } from "next/server";
import { requireApiModule } from "@/lib/api-auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const user = await requireApiModule("inventory");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const example = [
    {
      nombre: "Papa",
      sku: "PAPA-001",
      codigo_barras: "",
      costo_bulto: "8000.00",
      iva: "10.5",
      margen: "40",
      precio: "",
    },
  ];

  const csv = toCsv(example);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla-precios.csv"',
    },
  });
}
