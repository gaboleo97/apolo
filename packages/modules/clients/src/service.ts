import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, clients } from "@apolo/database";

export type ClientType = "retail" | "wholesale" | "business";

export type ClientInput = {
  name: string;
  clientType?: ClientType;
  taxId?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contactName?: string | null;
  notes?: string | null;
};

function serializeClient(c: typeof clients.$inferSelect) {
  return {
    id: c.id,
    tenantId: c.tenantId,
    name: c.name,
    clientType: (c.clientType as ClientType) ?? "retail",
    taxId: c.taxId,
    phone: c.phone,
    email: c.email,
    address: c.address,
    contactName: c.contactName,
    notes: c.notes,
    isActive: c.isActive ?? true,
    createdAt: c.createdAt,
  };
}

async function findClientByName(tenantId: string, name: string) {
  return db.query.clients.findFirst({
    where: and(eq(clients.tenantId, tenantId), ilike(clients.name, name.trim())),
  });
}

export async function listClients(tenantId: string, opts?: { search?: string }) {
  const rows = await db.query.clients.findMany({
    where: and(
      eq(clients.tenantId, tenantId),
      opts?.search
        ? or(
            ilike(clients.name, `%${opts.search}%`),
            ilike(clients.taxId, `%${opts.search}%`)
          )
        : undefined
    ),
    orderBy: desc(clients.createdAt),
  });
  return rows.map(serializeClient);
}

export async function getClient(tenantId: string, clientId: string) {
  const row = await db.query.clients.findFirst({
    where: and(eq(clients.id, clientId), eq(clients.tenantId, tenantId)),
  });
  return row ? serializeClient(row) : null;
}

export async function createClient(tenantId: string, input: ClientInput) {
  const existing = await findClientByName(tenantId, input.name);
  if (existing) return { ok: false as const, error: "DUPLICATE" as const };

  const created = await db
    .insert(clients)
    .values({
      tenantId,
      name: input.name.trim(),
      clientType: input.clientType ?? "retail",
      taxId: input.taxId?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      contactName: input.contactName?.trim() || null,
      notes: input.notes?.trim() || null,
      isActive: true,
    })
    .returning();

  const c = created[0];
  return c ? { ok: true as const, client: serializeClient(c) } : { ok: false as const, error: "ERROR" as const };
}

export async function updateClient(
  tenantId: string,
  clientId: string,
  input: Partial<ClientInput> & { isActive?: boolean }
) {
  if (input.name !== undefined) {
    const dup = await findClientByName(tenantId, input.name);
    if (dup && dup.id !== clientId) return { ok: false as const, error: "DUPLICATE" as const };
  }

  const updated = await db
    .update(clients)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.clientType !== undefined ? { clientType: input.clientType } : {}),
      ...(input.taxId !== undefined ? { taxId: input.taxId?.trim() || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
      ...(input.email !== undefined ? { email: input.email?.trim() || null } : {}),
      ...(input.address !== undefined ? { address: input.address?.trim() || null } : {}),
      ...(input.contactName !== undefined ? { contactName: input.contactName?.trim() || null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    })
    .where(and(eq(clients.id, clientId), eq(clients.tenantId, tenantId)))
    .returning();

  const c = updated[0];
  return c ? { ok: true as const, client: serializeClient(c) } : { ok: false as const, error: "NOT_FOUND" as const };
}

// ---------- CSV ----------

const typeMap: Record<string, ClientType> = {
  mostrador: "retail",
  minorista: "retail",
  retail: "retail",
  mayorista: "wholesale",
  wholesale: "wholesale",
  comercio: "business",
  negocio: "business",
  business: "business",
};

export function parseClientType(v?: string): ClientType {
  return typeMap[v?.trim().toLowerCase() ?? ""] ?? "retail";
}

export type ClientImportRow = {
  nombre?: string;
  tipo?: string;
  cuit_dni?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  contacto?: string;
  notas?: string;
  activo?: string;
};

function parseBool(v?: string): boolean {
  if (!v || v.trim() === "") return true;
  const k = v.trim().toLowerCase();
  return !["no", "false", "0", "inactivo", "off"].includes(k);
}

export type ImportReport = {
  created: number;
  updated: number;
  errors: { line: number; error: string }[];
};

export async function upsertClients(tenantId: string, rows: ClientImportRow[]): Promise<ImportReport> {
  const report: ImportReport = { created: 0, updated: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const line = i + 2;

    try {
      const nombre = row.nombre?.trim();
      if (!nombre) {
        report.errors.push({ line, error: "Falta nombre" });
        continue;
      }

      const values = {
        name: nombre,
        clientType: parseClientType(row.tipo),
        taxId: row.cuit_dni?.trim() || null,
        phone: row.telefono?.trim() || null,
        email: row.email?.trim() || null,
        address: row.direccion?.trim() || null,
        contactName: row.contacto?.trim() || null,
        notes: row.notas?.trim() || null,
        isActive: parseBool(row.activo),
      };

      const existing = await findClientByName(tenantId, nombre);
      if (existing) {
        // solo actualiza los campos presentes y no vacíos en el CSV
        await db
          .update(clients)
          .set({
            name: nombre,
            ...(row.tipo?.trim() ? { clientType: parseClientType(row.tipo) } : {}),
            ...(row.cuit_dni?.trim() ? { taxId: row.cuit_dni.trim() } : {}),
            ...(row.telefono?.trim() ? { phone: row.telefono.trim() } : {}),
            ...(row.email?.trim() ? { email: row.email.trim() } : {}),
            ...(row.direccion?.trim() ? { address: row.direccion.trim() } : {}),
            ...(row.contacto?.trim() ? { contactName: row.contacto.trim() } : {}),
            ...(row.notas?.trim() ? { notes: row.notas.trim() } : {}),
            ...(row.activo?.trim() ? { isActive: parseBool(row.activo) } : {}),
          })
          .where(eq(clients.id, existing.id));
        report.updated++;
      } else {
        await db.insert(clients).values({ tenantId, ...values });
        report.created++;
      }
    } catch {
      report.errors.push({ line, error: "Error inesperado" });
    }
  }

  return report;
}
