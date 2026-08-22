import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./core";

export type PrintFormat = "a4" | "thermal80";

export type PrintElementType =
  | "logo"
  | "title"
  | "company"
  | "client"
  | "meta"
  | "items"
  | "totals"
  | "payments"
  | "notes"
  | "freetext"
  | "footer";

export type PrintElementProps = {
  text?: string;
  columns?: { sku?: boolean; quantity?: boolean; unitPrice?: boolean; lineTotal?: boolean };
  showPaid?: boolean;
  showBalance?: boolean;
  align?: "left" | "center" | "right";
};

export type PrintTemplateElement = {
  type: PrintElementType;
  enabled: boolean;
  props?: PrintElementProps;
};

export const printTemplates = pgTable("print_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  format: text("format", { enum: ["a4", "thermal80"] }).notNull(),
  elements: jsonb("elements").$type<PrintTemplateElement[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
