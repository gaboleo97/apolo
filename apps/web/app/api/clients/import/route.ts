import { NextResponse } from "next/server";
import { requireApiModule } from "@/lib/api-auth";
import { parseCsv } from "@/lib/csv";
import { upsertClients, type ClientImportRow } from "@apolo/module-clients";

export async function POST(req: Request) {
  const user = await requireApiModule("clients");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file || typeof file.text !== "function") {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCsv(text);

  if (rows.length === 0) {
    return NextResponse.json({ error: "El archivo está vacío o no tiene filas válidas" }, { status: 400 });
  }

  const report = await upsertClients(user.tenantId, rows as ClientImportRow[]);

  return NextResponse.json({ ok: true, report });
}
