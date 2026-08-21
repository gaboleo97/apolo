import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, tenantInvitations, users } from "@apolo/database";
import type { ModuleKey, UserRole } from "@apolo/core";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function newToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function createTenantInvitation(input: {
  tenantId: string;
  createdBy: string;
  email?: string;
  role: UserRole;
  modules: ModuleKey[];
}) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const created = await db
    .insert(tenantInvitations)
    .values({
      tenantId: input.tenantId,
      email: input.email?.trim().toLowerCase() || null,
      role: input.role,
      modules: input.modules,
      token,
      expiresAt,
      createdBy: input.createdBy,
    })
    .returning();

  const invite = created[0];
  if (!invite) throw new Error("INVITE_CREATE_FAILED");

  return { id: invite.id, token: invite.token, email: invite.email, role: invite.role, modules: invite.modules };
}

export async function listTenantInvitations(tenantId: string) {
  const list = await db.query.tenantInvitations.findMany({
    where: (t, { eq }) => eq(t.tenantId, tenantId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  return list.map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    modules: i.modules,
    token: i.token,
    expiresAt: i.expiresAt,
    usedAt: i.usedAt,
    createdAt: i.createdAt,
  }));
}

export async function acceptInvitation(input: {
  token: string;
  name: string;
  email: string;
  password: string;
}): Promise<{ id: string; email: string; tenantId: string; role: string } | null> {
  const email = input.email.trim().toLowerCase();
  const now = new Date();

  return db.transaction(async (tx) => {
    const invite = await tx.query.tenantInvitations.findFirst({
      where: (t, { and, eq, gt, isNull }) =>
        and(eq(t.token, input.token), isNull(t.usedAt), gt(t.expiresAt, now)),
    });

    if (!invite) return null;

    if (invite.email && invite.email !== email) return null;

    const existing = await tx.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email),
    });
    if (existing) return null;

    const passwordHash = await bcrypt.hash(input.password, 10);

    const created = await tx
      .insert(users)
      .values({
        tenantId: invite.tenantId,
        email,
        passwordHash,
        name: input.name.trim(),
        role: invite.role,
        modules: invite.modules ?? null,
        isActive: true,
      })
      .returning();

    const user = created[0];
    if (!user) throw new Error("USER_CREATE_FAILED");

    await tx.update(tenantInvitations).set({ usedAt: now }).where(eq(tenantInvitations.id, invite.id));

    return { id: user.id, email: user.email, tenantId: user.tenantId, role: user.role ?? "viewer" };
  });
}
