import { pgTable, uuid, text, timestamp, jsonb, boolean, numeric, integer } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  country: text("country", { enum: ["AR", "MX", "CO", "CL", "PE", "US"] }).notNull(),
  plan: text("plan", { enum: ["freemium", "starter", "business", "enterprise"] }).default("freemium"),
  modulesEnabled: jsonb("modules_enabled").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  email: text("email").notNull(),
  name: text("name"),
  role: text("role", {
    enum: ["super_admin", "tenant_admin", "manager", "seller", "viewer"],
  }).default("viewer"),
  avatar: text("avatar"),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const modulePricing = pgTable("module_pricing", {
  id: uuid("id").defaultRandom().primaryKey(),
  moduleKey: text("module_key").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  priceMonthly: text("price_monthly").notNull(),
  priceYearly: text("price_yearly").notNull(),
  currency: text("currency").default("USD"),
  isActive: boolean("is_active").default(true),
});

export const tenantSubscriptions = pgTable("tenant_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  moduleKey: text("module_key").notNull(),
  status: text("status", { enum: ["active", "cancelled", "past_due", "trial"] }).default("trial"),
  provider: text("provider", { enum: ["stripe", "mercadopago"] }),
  providerSubscriptionId: text("provider_subscription_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});
