import type { ModuleKey, UserRole } from "./types";

export const ALL_MODULES: ModuleKey[] = [
  "inventory",
  "purchases",
  "sales",
  "accounting",
  "arca",
  "ai",
  "clients",
  "suppliers",
];

export const roleDefaultModules: Record<UserRole, ModuleKey[]> = {
  super_admin: ALL_MODULES,
  tenant_admin: ALL_MODULES,
  manager: ["inventory", "sales", "purchases", "accounting", "clients", "suppliers"],
  seller: ["sales", "inventory", "clients"],
  viewer: [],
};

export function isModuleKey(value: unknown): value is ModuleKey {
  return typeof value === "string" && (ALL_MODULES as string[]).includes(value);
}

export function getEffectiveModules(
  role: UserRole,
  override?: string[] | null
): ModuleKey[] {
  const base = override ?? roleDefaultModules[role];
  return (base.filter(isModuleKey) as ModuleKey[]);
}