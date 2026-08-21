import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@apolo/auth";
import { createTenantInvitation, listTenantInvitations } from "@apolo/auth";
import { ALL_MODULES, assignableRoles, type ModuleKey, type UserRole } from "@apolo/core";

const roleSchema = z.enum(["super_admin", "tenant_admin", "manager", "seller", "viewer"]);
const modulesSchema = z.array(z.enum(ALL_MODULES as [string, ...string[]]));

async function requireAdmin() {
  const session = await auth();
  const user = session?.user;
  if (!user) return null;
  if (user.role !== "tenant_admin" && user.role !== "super_admin") return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const invitations = await listTenantInvitations(admin.tenantId);
  return NextResponse.json({ invitations });
}

const createSchema = z.object({
  email: z.string().email().optional(),
  role: roleSchema,
  modules: modulesSchema,
});

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const allowedRoles = assignableRoles(admin.role as UserRole);
  if (!allowedRoles.includes(parsed.data.role)) {
    return NextResponse.json({ error: "No tenés permiso para asignar ese rol" }, { status: 403 });
  }

  const invite = await createTenantInvitation({
    tenantId: admin.tenantId,
    createdBy: admin.id,
    email: parsed.data.email,
    role: parsed.data.role,
    modules: parsed.data.modules as ModuleKey[],
  });

  return NextResponse.json({ ok: true, invite }, { status: 201 });
}
