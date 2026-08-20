import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@apolo/auth";
import { updateTeamUser } from "@apolo/auth";
import { ALL_MODULES, type ModuleKey } from "@apolo/core";

const roleSchema = z.enum(["super_admin", "tenant_admin", "manager", "seller", "viewer"]);
const modulesSchema = z.array(z.enum(ALL_MODULES as [string, ...string[]]));

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  role: roleSchema.optional(),
  modules: modulesSchema.optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const admin = session?.user;
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (admin.role !== "tenant_admin" && admin.role !== "super_admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const user = await updateTeamUser({
    userId: id,
    tenantId: admin.tenantId,
    ...parsed.data,
    modules: parsed.data.modules as ModuleKey[] | undefined,
  });

  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true, user });
}
