import bcrypt from "bcryptjs";
import { db, users } from "@apolo/database";

export async function registerViewerUser(input: {
  slug: string;
  name: string;
  email: string;
  password: string;
}) {
  const email = input.email.trim().toLowerCase();
  const slug = input.slug.trim().toLowerCase();

  const tenant = await db.query.tenants.findFirst({
    where: (t, { eq }) => eq(t.slug, slug),
  });
  if (!tenant || !tenant.isActive) {
    const error = new Error("TENANT_NOT_FOUND") as Error & { code: string };
    error.code = "TENANT_NOT_FOUND";
    throw error;
  }

  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });
  if (existing) {
    const error = new Error("EMAIL_TAKEN") as Error & { code: string };
    error.code = "EMAIL_TAKEN";
    throw error;
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const created = await db
    .insert(users)
    .values({
      tenantId: tenant.id,
      email,
      passwordHash,
      name: input.name.trim(),
      role: "viewer",
      isActive: true,
    })
    .returning();

  const user = created[0];
  if (!user) throw new Error("USER_CREATE_FAILED");

  return { id: user.id, email: user.email, tenantId: user.tenantId, role: user.role };
}
