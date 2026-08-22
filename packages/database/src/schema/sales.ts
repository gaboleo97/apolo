import { pgTable, uuid, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { tenants, users } from "./core";
import { clients } from "./clients";
import { products } from "./inventory";

export const sales = pgTable("sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  clientId: uuid("client_id").references(() => clients.id),
  code: text("code").notNull(),
  status: text("status", { enum: ["draft", "confirmed", "cancelled"] }).default("draft").notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  confirmedAt: timestamp("confirmed_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const saleItems = pgTable("sale_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  saleId: uuid("sale_id")
    .references(() => sales.id, { onDelete: "cascade" })
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  nameSnapshot: text("name_snapshot").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
});

export const salePayments = pgTable("sale_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  saleId: uuid("sale_id")
    .references(() => sales.id, { onDelete: "cascade" })
    .notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  method: text("method", { enum: ["cash", "transfer", "other"] }).default("cash").notNull(),
  note: text("note"),
  userId: uuid("user_id").references(() => users.id),
  paidAt: timestamp("paid_at").defaultNow(),
});
