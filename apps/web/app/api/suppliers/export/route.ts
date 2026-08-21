import { NextResponse } from "next/server";
import { requireApiModule } from "@/lib/api-auth";
import { toCsv } from "@/lib/csv";
import { listSuppliers } from "@apolo/module-suppliers";

export async function GET() {
  const user = await requireApiModule("suppliers");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const suppliers = await listSuppliers(user.tenantId);
  const rows = suppliers.map((s) => ({
    nombre: s.name,
    cuit: s.taxId ?? "",
    telefono: s.phone ?? "",
    email: s.email ?? "",
    direccion: s.address ?? "",
    contacto: s.contactName ?? "",
    notas: s.notes ?? "",
    activo: s.isActive ? "si" : "no",
  }));

  const csv = toCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="proveedores.csv"',
    },
  });
}
