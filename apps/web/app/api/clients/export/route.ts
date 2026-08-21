import { NextResponse } from "next/server";
import { requireApiModule } from "@/lib/api-auth";
import { toCsv } from "@/lib/csv";
import { listClients } from "@apolo/module-clients";

const typeLabels: Record<string, string> = {
  retail: "mostrador",
  wholesale: "mayorista",
  business: "comercio",
};

export async function GET() {
  const user = await requireApiModule("clients");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const clients = await listClients(user.tenantId);
  const rows = clients.map((c) => ({
    nombre: c.name,
    tipo: typeLabels[c.clientType] ?? "mostrador",
    cuit_dni: c.taxId ?? "",
    telefono: c.phone ?? "",
    email: c.email ?? "",
    direccion: c.address ?? "",
    contacto: c.contactName ?? "",
    notas: c.notes ?? "",
    activo: c.isActive ? "si" : "no",
  }));

  const csv = toCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="clientes.csv"',
    },
  });
}
