export type CountryCode = "AR" | "MX" | "CO" | "CL" | "PE" | "US";

export type UserRole = "super_admin" | "tenant_admin" | "manager" | "seller" | "viewer";

export type TenantPlan = "freemium" | "starter" | "business" | "enterprise";

export type ModuleKey = "inventory" | "purchases" | "sales" | "accounting" | "arca" | "ai";

export interface Session {
  userId: string;
  tenantId: string;
  role: UserRole;
  email: string;
}
