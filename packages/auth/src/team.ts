import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db, users, tenants } from "@apolo/database";
import type { CountryCode, ModuleKey, TenantPlan, UserRole } from "@apolo/core";

export async function createTeamUser(input: {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  modules: ModuleKey[];
}) {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 10);

  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });
  if (existing) {
    const error = new Error("EMAIL_TAKEN") as Error & { code: string };
    error.code = "EMAIL_TAKEN";
    throw error;
  }

  const created = await db
    .insert(users)
    .values({
      tenantId: input.tenantId,
      email,
      passwordHash,
      name: input.name.trim(),
      role: input.role,
      modules: input.modules,
      isActive: true,
    })
    .returning();

  const user = created[0];
  if (!user) throw new Error("USER_CREATE_FAILED");

  return { id: user.id, email: user.email, role: user.role, modules: user.modules, name: user.name };
}

export async function updateTeamUser(input: {
  userId: string;
  tenantId: string;
  name?: string;
  role?: UserRole;
  modules?: ModuleKey[];
  isActive?: boolean;
}) {
  const updated = await db
    .update(users)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.modules !== undefined ? { modules: input.modules } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    })
    .where(and(eq(users.id, input.userId), eq(users.tenantId, input.tenantId)))
    .returning();

  const user = updated[0];
  if (!user) return null;

  return { id: user.id, email: user.email, role: user.role, modules: user.modules, name: user.name };
}

export async function adminUpdateUser(input: {
  userId: string;
  tenantId?: string;
  role?: UserRole;
  modules?: ModuleKey[];
  isActive?: boolean;
}) {
  const updated = await db
    .update(users)
    .set({
      ...(input.tenantId !== undefined ? { tenantId: input.tenantId } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.modules !== undefined ? { modules: input.modules } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    })
    .where(eq(users.id, input.userId))
    .returning();

  const user = updated[0];
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    modules: user.modules,
    name: user.name,
    tenantId: user.tenantId,
    isActive: user.isActive,
  };
}

export async function adminUpdateTenant(input: {
  tenantId: string;
  name?: string;
  country?: CountryCode;
  plan?: TenantPlan;
  isActive?: boolean;
  modulesEnabled?: string[];
}) {
  const updated = await db
    .update(tenants)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.plan !== undefined ? { plan: input.plan } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.modulesEnabled !== undefined ? { modulesEnabled: input.modulesEnabled } : {}),
    })
    .where(eq(tenants.id, input.tenantId))
    .returning();

  const tenant = updated[0];
  if (!tenant) return null;

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    country: tenant.country,
    plan: tenant.plan,
    modulesEnabled: tenant.modulesEnabled,
    isActive: tenant.isActive,
  };
}
