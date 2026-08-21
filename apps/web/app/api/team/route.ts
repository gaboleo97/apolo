import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@apolo/auth";
import { createTeamUser } from "@apolo/auth";
import { db } from "@apolo/database";
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

  const list = await db.query.users.findMany({
    where: (u, { eq }) => eq(u.tenantId, admin.tenantId),
    orderBy: (u, { asc }) => [asc(u.createdAt)],
  });

  return NextResponse.json({
    users: list.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      modules: u.modules,
      isActive: u.isActive,
    })),
  });
}

const createSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
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

  try {
    const user = await createTeamUser({
      tenantId: admin.tenantId,
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      role: parsed.data.role,
      modules: parsed.data.modules as ModuleKey[],
    });
    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err) {
    if ((err as { code?: string }).code === "EMAIL_TAKEN") {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
