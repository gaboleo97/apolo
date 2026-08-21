import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "./csv";

describe("csv roundtrip", () => {
  it("parsea lo que exporta toCsv (sin BOM)", () => {
    const rows = [
      { nombre: "Papa", unidad: "kg", cantidad_por_bulto: "20" },
      { nombre: "Cebolla", unidad: "bulto", cantidad_por_bulto: "18" },
    ];
    const parsed = parseCsv(toCsv(rows));
    expect(parsed).toEqual(rows);
  });

  it("normaliza headers a minusculas y sin espacios", () => {
    const parsed = parseCsv("Nombre ,  Unidad \nPapa,kg");
    expect(parsed[0]?.nombre).toBe("Papa");
    expect(parsed[0]?.unidad).toBe("kg");
  });

  it("escala valores con comas dentro de comillas", () => {
    const rows = [{ nombre: 'Papa, blanca', nota: 'dice "rica"' }];
    const parsed = parseCsv(toCsv(rows));
    expect(parsed[0]?.nombre).toBe("Papa, blanca");
    expect(parsed[0]?.nota).toBe('dice "rica"');
  });
});
