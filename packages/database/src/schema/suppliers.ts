import { pgTable, uuid, text, timestamp, boolean, numeric, unique } from "drizzle-orm/pg-core";
import { tenants } from "./core";
import { products } from "./inventory";

export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  taxId: text("tax_id"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  contactName: text("contact_name"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const supplierProducts = pgTable(
  "supplier_products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
    supplierId: uuid("supplier_id")
      .references(() => suppliers.id)
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id)
      .notNull(),
    cost: numeric("cost", { precision: 12, scale: 2 }),
    code: text("code"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [unique("supplier_products_supplier_product_uq").on(t.supplierId, t.productId)]
);
