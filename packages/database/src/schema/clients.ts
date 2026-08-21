import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { tenants } from "./core";

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  clientType: text("client_type", { enum: ["retail", "wholesale", "business"] }).default("retail"),
  taxId: text("tax_id"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  contactName: text("contact_name"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
