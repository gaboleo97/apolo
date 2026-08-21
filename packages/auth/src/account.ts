import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users } from "@apolo/database";

export async function changePassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: boolean; error?: "WRONG_PASSWORD" }> {
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, input.userId),
  });
  if (!user) return { ok: false };

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) return { ok: false, error: "WRONG_PASSWORD" };

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, input.userId));

  return { ok: true };
}
