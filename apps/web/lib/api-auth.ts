import { auth } from "@apolo/auth";
import type { ModuleKey } from "@apolo/core";

export async function requireApiModule(module: ModuleKey) {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.modules.includes(module)) return null;
  return user;
}
