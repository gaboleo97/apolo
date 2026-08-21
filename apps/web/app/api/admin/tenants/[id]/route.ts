import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@apolo/auth";
import { adminUpdateTenant } from "@apolo/auth";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "super_admin") return null;
  return session.user;
}

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  country: z.enum(["AR", "MX", "CO", "CL", "PE", "US"]).optional(),
  plan: z.enum(["freemium", "starter", "business", "enterprise"]).optional(),
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

  const tenant = await adminUpdateTenant({
    tenantId: id,
    ...parsed.data,
  });

  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true, tenant });
}
