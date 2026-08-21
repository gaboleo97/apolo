import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@apolo/auth";
import { db, tenants } from "@apolo/database";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "super_admin") return null;
  return session.user;
}

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const list = await db.query.tenants.findMany({
    orderBy: (t, { asc }) => [asc(t.createdAt)],
  });

  return NextResponse.json({
    tenants: list.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      country: t.country,
      plan: t.plan,
      modulesEnabled: t.modulesEnabled,
      isActive: t.isActive,
      createdAt: t.createdAt,
    })),
  });
}

const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const createSchema = z.object({
  name: z.string().min(2).max(120),
  country: z.enum(["AR", "MX", "CO", "CL", "PE", "US"]),
  plan: z.enum(["freemium", "starter", "business", "enterprise"]).default("freemium"),
  slug: z.string().min(1).max(60).regex(slugRegex).optional(),
});

export async function POST(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const name = parsed.data.name.trim();
  const slug =
    parsed.data.slug ??
    `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32)}-${Math.random().toString(36).slice(2, 8)}`;

  const existingSlug = await db.query.tenants.findFirst({
    where: (t, { eq }) => eq(t.slug, slug),
  });
  if (existingSlug) {
    return NextResponse.json({ error: "Ese código ya está en uso" }, { status: 409 });
  }

  const created = await db
    .insert(tenants)
    .values({
      name,
      slug,
      country: parsed.data.country,
      plan: parsed.data.plan,
      modulesEnabled: ["inventory"],
      isActive: true,
    })
    .returning();

  const tenant = created[0];
  if (!tenant) return NextResponse.json({ error: "No se pudo crear el tenant" }, { status: 500 });

  return NextResponse.json({ ok: true, tenant }, { status: 201 });
}
