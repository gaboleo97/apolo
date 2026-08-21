import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiModule } from "@/lib/api-auth";
import { updateSupplier } from "@apolo/module-suppliers";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  taxId: z.string().max(80).nullable().optional(),
  phone: z.string().max(80).nullable().optional(),
  email: z.string().max(200).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  contactName: z.string().max(200).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiModule("suppliers");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const result = await updateSupplier(user.tenantId, id, parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          result.error === "DUPLICATE"
            ? "Ya existe un proveedor con ese nombre"
            : "Proveedor no encontrado",
      },
      { status: result.error === "DUPLICATE" ? 400 : 404 }
    );
  }

  return NextResponse.json({ ok: true, supplier: result.supplier });
}
