import { eq, inArray } from "drizzle-orm";
import {
  db,
  tenants,
  users,
  tenantSubscriptions,
  auditLogs,
  passwordResetTokens,
  tenantInvitations,
  categories,
  products,
  stockMovements,
} from "@apolo/database";

export async function deleteTenant(tenantId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const tenantUsers = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.tenantId, tenantId));
    const userIds = tenantUsers.map((u) => u.id);

    await tx.delete(stockMovements).where(eq(stockMovements.tenantId, tenantId));
    await tx.delete(products).where(eq(products.tenantId, tenantId));
    await tx.delete(categories).where(eq(categories.tenantId, tenantId));
    await tx.delete(auditLogs).where(eq(auditLogs.tenantId, tenantId));
    await tx.delete(tenantInvitations).where(eq(tenantInvitations.tenantId, tenantId));
    await tx.delete(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, tenantId));

    if (userIds.length > 0) {
      await tx.delete(passwordResetTokens).where(inArray(passwordResetTokens.userId, userIds));
    }

    await tx.delete(users).where(eq(users.tenantId, tenantId));
    await tx.delete(tenants).where(eq(tenants.id, tenantId));

    return true;
  });
}
