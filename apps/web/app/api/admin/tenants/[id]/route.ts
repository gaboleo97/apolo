import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@apolo/auth";
import { adminUpdateTenant, deleteTenant } from "@apolo/auth";
import { db } from "@apolo/database";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "super_admin") return null;
  return session.user;
}

const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  slug: z.string().min(1).max(60).regex(slugRegex).optional(),
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

  if (parsed.data.slug !== undefined) {
    const slug = parsed.data.slug.toLowerCase();
    const existing = await db.query.tenants.findFirst({
      where: (t, { and, eq, ne }) => and(eq(t.slug, slug), ne(t.id, id)),
    });
    if (existing) {
      return NextResponse.json({ error: "Ese código ya está en uso" }, { status: 409 });
    }
  }

  const tenant = await adminUpdateTenant({
    tenantId: id,
    ...parsed.data,
    slug: parsed.data.slug?.toLowerCase(),
  });

  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true, tenant });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;

  await deleteTenant(id);

  return NextResponse.json({ ok: true });
}
