import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { clients, db, tenants } from "@apolo/database";
import {
  createClient,
  getClient,
  listClients,
  parseClientType,
  updateClient,
  upsertClients,
} from "./service";

let dbUp = true;
try {
  await db.execute(sql`select 1`);
} catch {
  dbUp = false;
}

const tidA = crypto.randomUUID();
const tidB = crypto.randomUUID();

async function cleanup(tenantId: string) {
  await db.delete(clients).where(eq(clients.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
}

describe.skipIf(!dbUp)("clients service (integracion)", () => {
  beforeAll(async () => {
    for (const [id, slug] of [
      [tidA, `cli-a-${Date.now()}`],
      [tidB, `cli-b-${Date.now()}`],
    ] as const) {
      await db.insert(tenants).values({ id, name: "Tenant Cli", slug, country: "AR" });
    }
  });

  afterAll(async () => {
    try {
      await cleanup(tidA);
      await cleanup(tidB);
    } catch {
      // DB apagada a mitad de corrida
    }
  });

  it("crea con tipo por defecto, busca y actualiza", async () => {
    const r1 = await createClient(tidA, { name: "Kiosco Test" });
    expect(r1.ok).toBe(true);
    if (r1.ok) expect(r1.client.clientType).toBe("retail");

    const dup = await createClient(tidA, { name: "kiosco test" });
    expect(dup).toMatchObject({ ok: false, error: "DUPLICATE" });

    const r2 = await createClient(tidA, {
      name: "Restaurante Test",
      clientType: "business",
      taxId: "20-31234567-8",
      phone: "011 4555-6789",
    });
    expect(r2.ok).toBe(true);

    const found = await listClients(tidA, { search: "restaurante" });
    expect(found).toHaveLength(1);
    expect(found[0]?.clientType).toBe("business");

    const byTax = await listClients(tidA, { search: "31234567" });
    expect(byTax).toHaveLength(1);

    if (!r2.ok) throw new Error("no se creo el cliente");
    const upd = await updateClient(tidA, r2.client.id, {
      clientType: "wholesale",
      isActive: false,
    });
    expect(upd.ok).toBe(true);
    if (upd.ok) {
      expect(upd.client.clientType).toBe("wholesale");
      expect(upd.client.isActive).toBe(false);
    }

    const renamed = await updateClient(tidA, r2.client.id, { name: "Kiosco Test" });
    expect(renamed).toMatchObject({ ok: false, error: "DUPLICATE" });
  });

  it("aisla clientes por tenant", async () => {
    expect(await listClients(tidB)).toHaveLength(0);

    const listed = await listClients(tidA);
    const some = listed[0]!;
    expect(await getClient(tidB, some.id)).toBeNull();
  });

  it("importa clientes sin duplicar y parsea tipo", async () => {
    expect(parseClientType("mayorista")).toBe("wholesale");
    expect(parseClientType("comercio")).toBe("business");
    expect(parseClientType("cualquiera")).toBe("retail");
    expect(parseClientType(undefined)).toBe("retail");

    const rows = [
      { nombre: "Importado Uno", tipo: "mayorista", cuit_dni: "30-11111111-1" },
      { nombre: "Importado Dos", activo: "no" },
    ];

    const first = await upsertClients(tidA, rows);
    expect(first.created).toBe(2);
    expect(first.errors).toHaveLength(0);

    const second = await upsertClients(tidA, [...rows, { nombre: "Importado Uno", telefono: "999" }, { nombre: "" }]);
    expect(second.created).toBe(0);
    expect(second.updated).toBe(3);
    expect(second.errors).toEqual([{ line: 5, error: "Falta nombre" }]);

    const listed = await listClients(tidA);
    const uno = listed.find((c) => c.name === "Importado Uno");
    expect(uno?.phone).toBe("999");
    expect(uno?.clientType).toBe("wholesale");
    const dos = listed.find((c) => c.name === "Importado Dos");
    expect(dos?.isActive).toBe(false);
  });
});
