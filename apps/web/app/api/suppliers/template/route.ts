import { NextResponse } from "next/server";
import { requireApiModule } from "@/lib/api-auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const user = await requireApiModule("suppliers");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const example = [
    {
      nombre: "Distribuidora Central",
      cuit: "30-12345678-9",
      telefono: "011 4444-5555",
      email: "ventas@central.com",
      direccion: "Av. Siempreviva 742",
      contacto: "Juan Pérez",
      notas: "Entrega los martes",
      activo: "si",
    },
  ];

  const csv = toCsv(example);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla-proveedores.csv"',
    },
  });
}
