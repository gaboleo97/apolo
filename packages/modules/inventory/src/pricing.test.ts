import { describe, expect, it } from "vitest";
import {
  applyRounding,
  calcCostPerUnit,
  calcSuggestedPrice,
  generateSku,
  normalizeUnit,
  parseBool,
  parseNumber,
} from "./pricing";

describe("calcCostPerUnit", () => {
  it("divide el costo del bulto por la cantidad", () => {
    expect(calcCostPerUnit(8000, 20)).toBe(400);
  });

  it("redondea a 2 decimales", () => {
    expect(calcCostPerUnit(100, 3)).toBe(33.33);
  });

  it("sin costo devuelve null", () => {
    expect(calcCostPerUnit(null, 20)).toBeNull();
  });

  it("cantidad 0 o negativa usa 1 como fallback", () => {
    expect(calcCostPerUnit(500, 0)).toBe(500);
    expect(calcCostPerUnit(500, -5)).toBe(500);
  });
});

describe("applyRounding", () => {
  it("sin redondeo devuelve el precio exacto con 2 decimales", () => {
    expect(applyRounding(618.7999999, "none")).toBe(618.8);
  });

  it("multiplos de 10 redondea al mas cercano", () => {
    expect(applyRounding(615, "10")).toBe(620);
    expect(applyRounding(614, "10")).toBe(610);
  });

  it("multiplos de 50 redondea al mas cercano", () => {
    expect(applyRounding(618.8, "50")).toBe(600);
    expect(applyRounding(630, "50")).toBe(650);
  });

  it("multiplos de 100 redondea al mas cercano", () => {
    expect(applyRounding(671.29, "100")).toBe(700);
    expect(applyRounding(149, "100")).toBe(100);
  });
});

describe("calcSuggestedPrice", () => {
  it("aplica IVA y margen sobre el costo unitario (Papa)", () => {
    // 8000 / 20kg = 400 * 1.105 * 1.40 = 618.80
    expect(calcSuggestedPrice(8000, 20, 10.5, 40)).toBe(618.8);
  });

  it("con costo cero en impuestos y margen devuelve el costo unitario", () => {
    expect(calcSuggestedPrice(9000, 20, 0, 0)).toBe(450);
  });

  it("aplica el redondeo indicado", () => {
    expect(calcSuggestedPrice(8000, 20, 10.5, 40, "50")).toBe(600);
    expect(calcSuggestedPrice(9000, 20, 10.5, 35, "10")).toBe(670);
  });

  it("sin costo devuelve null", () => {
    expect(calcSuggestedPrice(null, 1, 21, 30)).toBeNull();
  });
});

describe("generateSku", () => {
  it("usa prefijo del nombre + sufijo aleatorio", () => {
    const sku = generateSku("Papa Blanca");
    expect(sku).toMatch(/^PAPA-[A-Z0-9]{4}$/);
  });

  it("limita el prefijo a 4 caracteres", () => {
    const sku = generateSku("Manzana Roja");
    expect(sku.startsWith("MANZ-")).toBe(true);
  });

  it("nombre sin caracteres validos usa PRD", () => {
    const sku = generateSku("¡¡¡");
    expect(sku).toMatch(/^PRD-/);
  });

  it("genera SKUs distintos", () => {
    expect(generateSku("Papa")).not.toBe(generateSku("Papa"));
  });
});

describe("parseNumber", () => {
  it("acepta punto decimal", () => {
    expect(parseNumber("45.5")).toBe(45.5);
  });

  it("acepta coma decimal", () => {
    expect(parseNumber("45,5")).toBe(45.5);
  });

  it("acepta miles con punto y coma decimal", () => {
    expect(parseNumber("1.234,56")).toBe(1234.56);
  });

  it("ignora texto suelto alrededor del numero", () => {
    expect(parseNumber("$ 123.45 kg")).toBe(123.45);
  });

  it("vacio o invalido devuelve null", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("   ")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber(undefined)).toBeNull();
  });
});

describe("parseBool", () => {
  it("vacio o valores truthy devuelven true", () => {
    expect(parseBool(undefined)).toBe(true);
    expect(parseBool("")).toBe(true);
    expect(parseBool("si")).toBe(true);
    expect(parseBool("true")).toBe(true);
  });

  it("valores falsos conocidos devuelven false", () => {
    expect(parseBool("no")).toBe(false);
    expect(parseBool("false")).toBe(false);
    expect(parseBool("0")).toBe(false);
    expect(parseBool("inactivo")).toBe(false);
  });
});

describe("normalizeUnit", () => {
  it("mapea bulto a bulk", () => {
    expect(normalizeUnit("bulto")).toBe("bulk");
    expect(normalizeUnit("Bultos")).toBe("bulk");
    expect(normalizeUnit("BULTO")).toBe("bulk");
  });

  it("mapea variantes de kilo, caja y pack", () => {
    expect(normalizeUnit("kilo")).toBe("kg");
    expect(normalizeUnit("kilos")).toBe("kg");
    expect(normalizeUnit("Caja")).toBe("box");
    expect(normalizeUnit("pack")).toBe("pack");
    expect(normalizeUnit("paquete")).toBe("pack");
  });

  it("vacio o desconocido devuelve unidad", () => {
    expect(normalizeUnit("")).toBe("unit");
    expect(normalizeUnit(undefined)).toBe("unit");
    expect(normalizeUnit("qqqq")).toBe("unit");
  });
});
