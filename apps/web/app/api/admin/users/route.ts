import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@apolo/auth";
import { createTeamUser } from "@apolo/auth";
import { db, users, tenants } from "@apolo/database";
import { ALL_MODULES, type ModuleKey } from "@apolo/core";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "super_admin") return null;
  return session.user;
}

export async function GET(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId") ?? undefined;

  const list = await db.query.users.findMany({
    where: tenantId ? (u, { eq }) => eq(u.tenantId, tenantId) : undefined,
    orderBy: (u, { asc }) => [asc(u.createdAt)],
  });

  const tenantList = await db.query.tenants.findMany();
  const tenantName = new Map(tenantList.map((t) => [t.id, t.name]));

  return NextResponse.json({
    users: list.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      modules: u.modules,
      isActive: u.isActive,
      tenantId: u.tenantId,
      tenantName: tenantName.get(u.tenantId) ?? null,
      lastLogin: u.lastLogin,
    })),
  });
}

const roleSchema = z.enum(["super_admin", "tenant_admin", "manager", "seller", "viewer"]);
const modulesSchema = z.array(z.enum(ALL_MODULES as [string, ...string[]]));

const createSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: roleSchema,
  modules: modulesSchema,
});

export async function POST(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  try {
    const user = await createTeamUser({
      tenantId: parsed.data.tenantId,
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
