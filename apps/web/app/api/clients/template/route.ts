import { NextResponse } from "next/server";
import { requireApiModule } from "@/lib/api-auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const user = await requireApiModule("clients");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const example = [
    {
      nombre: "Kiosco San Juan",
      tipo: "comercio",
      cuit_dni: "30-12345678-9",
      telefono: "011 4444-5555",
      email: "kiosco@mail.com",
      direccion: "Av. Siempreviva 742",
      contacto: "María López",
      notas: "Pide los jueves",
      activo: "si",
    },
  ];

  const csv = toCsv(example);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla-clientes.csv"',
    },
  });
}
