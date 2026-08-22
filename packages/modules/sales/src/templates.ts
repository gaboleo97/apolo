import { and, eq } from "drizzle-orm";
import { db, printTemplates, tenants, type PrintFormat, type PrintTemplateElement } from "@apolo/database";

export type { PrintFormat, PrintTemplateElement };

function el(
  type: PrintTemplateElement["type"],
  enabled: boolean,
  props?: PrintTemplateElement["props"]
): PrintTemplateElement {
  return { type, enabled, ...(props ? { props } : {}) };
}

/** Diseño estándar por defecto para cada formato. */
export function defaultElements(format: PrintFormat): PrintTemplateElement[] {
  if (format === "thermal80") {
    return [
      el("logo", false),
      el("title", true, { text: "COMPROBANTE NO FISCAL", align: "center" }),
      el("company", true, { align: "center" }),
      el("meta", true, { align: "left" }),
      el("client", true, { align: "left" }),
      el("items", true, {
        columns: { sku: false, quantity: true, unitPrice: true, lineTotal: true },
      }),
      el("totals", true, { showPaid: true, showBalance: true }),
      el("payments", true),
      el("notes", true),
      el("freetext", false, { text: "" }),
      el("footer", true, { text: "¡Gracias por su compra!", align: "center" }),
    ];
  }

  return [
    el("logo", true),
    el("title", true, { text: "COMPROBANTE NO FISCAL", align: "right" }),
    el("company", true, { align: "left" }),
    el("client", true, { align: "left" }),
    el("meta", true, { align: "right" }),
    el("items", true, {
      columns: { sku: true, quantity: true, unitPrice: true, lineTotal: true },
    }),
    el("totals", true, { showPaid: true, showBalance: true }),
    el("payments", true),
    el("notes", true),
    el("freetext", false, { text: "" }),
    el("footer", true, { text: "Documento no válido como factura. ¡Gracias por su compra!", align: "center" }),
  ];
}

const BLOCK_LABELS: Record<PrintTemplateElement["type"], string> = {
  logo: "Logo",
  title: "Título del comprobante",
  company: "Datos de la empresa",
  client: "Datos del cliente",
  meta: "Fecha y vendedor",
  items: "Tabla de productos",
  totals: "Totales",
  payments: "Pagos recibidos",
  notes: "Notas",
  freetext: "Texto libre",
  footer: "Pie / firma",
};

export function blockLabel(type: PrintTemplateElement["type"]): string {
  return BLOCK_LABELS[type];
}

export async function getPrintTemplate(tenantId: string, format: PrintFormat) {
  const [row] = await db
    .select()
    .from(printTemplates)
    .where(and(eq(printTemplates.tenantId, tenantId), eq(printTemplates.format, format)));

  if (row) {
    return { id: row.id, format, elements: row.elements ?? [], saved: true };
  }
  return { id: null, format, elements: defaultElements(format), saved: false };
}

export async function savePrintTemplate(
  tenantId: string,
  format: PrintFormat,
  elements: PrintTemplateElement[]
) {
  const [existing] = await db
    .select({ id: printTemplates.id })
    .from(printTemplates)
    .where(and(eq(printTemplates.tenantId, tenantId), eq(printTemplates.format, format)));

  if (existing) {
    const [updated] = await db
      .update(printTemplates)
      .set({ elements, updatedAt: new Date() })
      .where(eq(printTemplates.id, existing.id))
      .returning();
    return updated!;
  }

  const [created] = await db
    .insert(printTemplates)
    .values({ tenantId, format, elements })
    .returning();
  return created!;
}

export async function deletePrintTemplate(tenantId: string, format: PrintFormat) {
  await db
    .delete(printTemplates)
    .where(and(eq(printTemplates.tenantId, tenantId), eq(printTemplates.format, format)));
}

export async function getCompanyData(tenantId: string) {
  const t = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: {
      name: true,
      taxId: true,
      address: true,
      phone: true,
      email: true,
      logoUrl: true,
    },
  });
  if (!t) return null;
  return { ...t, logoUrl: t.logoUrl ?? null };
}

export async function updateCompanyData(
  tenantId: string,
  patch: {
    name?: string;
    taxId?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  }
) {
  await db.update(tenants).set(patch).where(eq(tenants.id, tenantId));
}

export async function setCompanyLogo(tenantId: string, logoUrl: string) {
  await db.update(tenants).set({ logoUrl }).where(eq(tenants.id, tenantId));
}
