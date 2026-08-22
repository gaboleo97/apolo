import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiModule } from "@/lib/api-auth";
import { getCompanyData, updateCompanyData } from "@apolo/module-sales";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  taxId: z.string().max(80).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  phone: z.string().max(80).nullable().optional(),
  email: z.string().max(200).nullable().optional(),
});

export async function GET() {
  const user = await requireApiModule("sales");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const company = await getCompanyData(user.tenantId);
  if (!company) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });

  return NextResponse.json({ company });
}

export async function PATCH(req: Request) {
  const user = await requireApiModule("sales");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  if (!["tenant_admin", "super_admin", "manager"].includes(user.role)) {
    return NextResponse.json({ error: "Solo administradores pueden editar estos datos" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  await updateCompanyData(user.tenantId, parsed.data);
  return NextResponse.json({ ok: true });
}
