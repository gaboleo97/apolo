import bcrypt from "bcryptjs";
import { db } from "@apolo/database";
import { tenants, users } from "@apolo/database";

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  country?: "AR" | "MX" | "CO" | "CL" | "PE" | "US";
}) {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 10);

  const existing = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
  });
  if (existing) {
    const error = new Error("EMAIL_TAKEN") as Error & { code: string };
    error.code = "EMAIL_TAKEN";
    throw error;
  }

  const slug = `${input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32)}-${Math.random().toString(36).slice(2, 8)}`;

  const createdTenant = await db
    .insert(tenants)
    .values({
      name: input.name.trim(),
      slug,
      country: input.country ?? "AR",
      plan: "freemium",
      modulesEnabled: ["inventory"],
      isActive: true,
    })
    .returning();

  const tenant = createdTenant[0];
  if (!tenant) {
    throw new Error("TENANT_CREATE_FAILED");
  }

  const createdUser = await db
    .insert(users)
    .values({
      tenantId: tenant.id,
      email,
      passwordHash,
      name: input.name.trim(),
      role: "tenant_admin",
      isActive: true,
    })
    .returning();

  const user = createdUser[0];
  if (!user) {
    throw new Error("USER_CREATE_FAILED");
  }

  return { id: user.id, email: user.email, tenantId: user.tenantId, role: user.role };
}