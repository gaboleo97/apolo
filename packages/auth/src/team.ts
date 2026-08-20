import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db, users } from "@apolo/database";
import type { ModuleKey, UserRole } from "@apolo/core";

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
