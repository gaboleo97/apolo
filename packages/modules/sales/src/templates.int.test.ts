import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db, printTemplates, tenants } from "@apolo/database";
import {
  defaultElements,
  deletePrintTemplate,
  getCompanyData,
  getPrintTemplate,
  savePrintTemplate,
} from "./templates";

let dbUp = true;
try {
  await db.execute(sql`select 1`);
} catch {
  dbUp = false;
}

const tidA = crypto.randomUUID();
const tidB = crypto.randomUUID();

async function cleanup(tenantId: string) {
  await db.delete(printTemplates).where(eq(printTemplates.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
}

describe.skipIf(!dbUp)("print templates (integracion)", () => {
  beforeAll(async () => {
    for (const [id, slug] of [
      [tidA, `print-a-${Date.now()}`],
      [tidB, `print-b-${Date.now()}`],
    ] as const) {
      await db.insert(tenants).values({ id, name: "Print Tenant", slug, country: "AR" });
    }
  });

  afterAll(async () => {
    try {
      await cleanup(tidA);
      await cleanup(tidB);
    } catch {
      // DB apagada
    }
  });

  it("devuelve el diseño estándar cuando no hay guardado", async () => {
    const t1 = await getPrintTemplate(tidA, "a4");
    expect(t1.saved).toBe(false);
    expect(t1.elements.length).toBeGreaterThan(5);
    expect(t1.elements.some((e) => e.type === "logo" && e.enabled)).toBe(true);

    const t2 = await getPrintTemplate(tidA, "thermal80");
    expect(t2.saved).toBe(false);
    // en térmica el logo viene desactivado por defecto y sin columna SKU
    expect(t2.elements.find((e) => e.type === "logo")?.enabled).toBe(false);
    expect(
      t2.elements.find((e) => e.type === "items")?.props?.columns?.sku
    ).toBeFalsy();

    const defaults = defaultElements("thermal80");
    expect(defaults.length).toBe(t2.elements.length);
  });

  it("guarda, actualiza y borra por formato", async () => {
    const custom = [
      ...defaultElements("a4").map((e) =>
        e.type === "logo" ? { ...e, enabled: false } : e
      ),
    ];
    const saved1 = await savePrintTemplate(tidA, "a4", custom);
    expect(saved1.format).toBe("a4");

    const loaded = await getPrintTemplate(tidA, "a4");
    expect(loaded.saved).toBe(true);
    expect(loaded.elements.find((e) => e.type === "logo")?.enabled).toBe(false);

    // upsert no duplica filas: re-guardar actualiza
    const saved2 = await savePrintTemplate(tidA, "a4", defaultElements("a4"));
    expect(saved2.id).toBe(saved1.id);
    const rows = await db.select().from(printTemplates).where(eq(printTemplates.tenantId, tidA));
    expect(rows).toHaveLength(1);

    // formatos son independientes
    await savePrintTemplate(tidA, "thermal80", defaultElements("thermal80"));
    const rowsAfter = await db.select().from(printTemplates).where(eq(printTemplates.tenantId, tidA));
    expect(rowsAfter).toHaveLength(2);

    await deletePrintTemplate(tidA, "a4");
    const backToDefault = await getPrintTemplate(tidA, "a4");
    expect(backToDefault.saved).toBe(false);
  });

  it("aisla plantillas y datos de empresa por tenant", async () => {
    const a = await getPrintTemplate(tidA, "a4");
    await savePrintTemplate(
      tidB,
      "a4",
      a.elements.map((e) => (e.type === "title" ? { ...e, props: { text: "OTRO" } } : e))
    );

    const bLoaded = await getPrintTemplate(tidB, "a4");
    expect(bLoaded.saved).toBe(true);
    expect(bLoaded.elements.find((e) => e.type === "title")?.props?.text).toBe("OTRO");

    const aReloaded = await getPrintTemplate(tidA, "a4");
    expect(aReloaded.saved).toBe(false);

    // datos de empresa del tenant B (sin logo)
    const company = await getCompanyData(tidB);
    expect(company?.name).toBe("Print Tenant");
    expect(company?.logoUrl).toBeNull();
    expect(await getCompanyData(crypto.randomUUID())).toBeNull();
  });
});
