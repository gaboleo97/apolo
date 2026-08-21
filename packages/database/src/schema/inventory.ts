import { pgTable, uuid, text, numeric, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { tenants, users } from "./core";

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  parentId: uuid("parent_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  categoryId: uuid("category_id").references(() => categories.id),
  name: text("name").notNull(),
  description: text("description"),
  sku: text("sku"),
  barcode: text("barcode"),
  unitType: text("unit_type", { enum: ["unit", "kg", "lt", "m", "box", "pack", "bulk"] }).default("unit"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  costPerBulk: numeric("cost", { precision: 12, scale: 2 }),
  unitsPerBulk: numeric("units_per_bulk", { precision: 12, scale: 2 }).default("1"),
  marginPct: numeric("margin_pct", { precision: 5, scale: 2 }).default("0"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("21"),
  minStock: numeric("min_stock", { precision: 12, scale: 2 }).default("0"),
  currentStock: numeric("current_stock", { precision: 12, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  userId: uuid("user_id").references(() => users.id),
  type: text("type", { enum: ["in", "out", "adjustment", "transfer"] }).notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  referenceType: text("reference_type"),
  referenceId: uuid("reference_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});