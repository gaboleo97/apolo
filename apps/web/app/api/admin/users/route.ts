import { NextResponse } from "next/server";
import { auth } from "@apolo/auth";
import { db, users, tenants } from "@apolo/database";

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
