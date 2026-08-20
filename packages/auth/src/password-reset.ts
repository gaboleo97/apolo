import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, users, passwordResetTokens } from "@apolo/database";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email.trim().toLowerCase()),
  });
  if (!user) return null;

  const token = randomToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return token;
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const tokenHash = await hashToken(token);
  const now = new Date();

  const record = await db.query.passwordResetTokens.findFirst({
    where: (t, { and, eq, gt, isNull }) =>
      and(eq(t.tokenHash, tokenHash), isNull(t.usedAt), gt(t.expiresAt, now)),
  });
  if (!record) return false;

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db.update(users).set({ passwordHash }).where(eq(users.id, record.userId));
  await db.update(passwordResetTokens).set({ usedAt: now }).where(eq(passwordResetTokens.id, record.id));

  return true;
}
