import { auth } from "@apolo/auth";
import { redirect } from "next/navigation";
import type { ModuleKey } from "@apolo/core";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireModule(module: ModuleKey) {
  const session = await requireSession();
  if (!session.user.modules.includes(module)) redirect("/dashboard");
  return session;
}

export async function requireTenantAdmin() {
  const session = await requireSession();
  if (session.user.role !== "tenant_admin" && session.user.role !== "super_admin") {
    redirect("/dashboard");
  }
  return session;
}
