import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@apolo/auth";
import { adminUpdateUser } from "@apolo/auth";
import { ALL_MODULES, type ModuleKey } from "@apolo/core";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "super_admin") return null;
  return session.user;
}

const roleSchema = z.enum(["super_admin", "tenant_admin", "manager", "seller", "viewer"]);
const modulesSchema = z.array(z.enum(ALL_MODULES as [string, ...string[]]));

const updateSchema = z.object({
  tenantId: z.string().uuid().optional(),
  role: roleSchema.optional(),
  modules: modulesSchema.optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const user = await adminUpdateUser({
    userId: id,
    ...parsed.data,
    modules: parsed.data.modules as ModuleKey[] | undefined,
  });

  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true, user });
}
