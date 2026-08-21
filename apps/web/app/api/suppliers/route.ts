import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiModule } from "@/lib/api-auth";
import { createSupplier, listSuppliers } from "@apolo/module-suppliers";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  taxId: z.string().max(80).nullable().optional(),
  phone: z.string().max(80).nullable().optional(),
  email: z.string().max(200).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  contactName: z.string().max(200).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export async function GET(req: Request) {
  const user = await requireApiModule("suppliers");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const search = new URL(req.url).searchParams.get("search") ?? undefined;
  const suppliers = await listSuppliers(user.tenantId, { search });
  return NextResponse.json({ suppliers });
}

export async function POST(req: Request) {
  const user = await requireApiModule("suppliers");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const result = await createSupplier(user.tenantId, parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error === "DUPLICATE" ? "Ya existe un proveedor con ese nombre" : "Error al crear" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, supplier: result.supplier });
}
