export type PriceRounding = "none" | "10" | "50" | "100";

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function toNum(v: string | null | undefined): number {
  return v == null ? 0 : Number(v);
}

export function calcCostPerUnit(costPerBulk: number | null, unitsPerBulk: number): number | null {
  if (costPerBulk == null) return null;
  const units = unitsPerBulk > 0 ? unitsPerBulk : 1;
  return round2(costPerBulk / units);
}

export function applyRounding(price: number, rounding: PriceRounding): number {
  if (rounding === "none") return round2(price);
  const step = Number(rounding);
  return Math.round(price / step) * step;
}

export function calcSuggestedPrice(
  costPerBulk: number | null,
  unitsPerBulk: number,
  taxRate: number,
  marginPct: number,
  rounding: PriceRounding = "none"
): number | null {
  const costPerUnit = calcCostPerUnit(costPerBulk, unitsPerBulk);
  if (costPerUnit == null) return null;
  return applyRounding(costPerUnit * (1 + taxRate / 100) * (1 + marginPct / 100), rounding);
}

export function generateSku(name: string): string {
  const prefix = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "PRD";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

export function parseNumber(v?: string): number | null {
  if (v == null) return null;
  let s = v.trim().replace(/[^0-9.,-]/g, "");
  if (s === "") return null;
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function parseBool(v?: string): boolean {
  if (!v || v.trim() === "") return true;
  const k = v.trim().toLowerCase();
  return !["no", "false", "0", "inactivo", "off"].includes(k);
}

export type UnitType = "unit" | "kg" | "lt" | "m" | "box" | "pack" | "bulk";

const unitMap: Record<string, UnitType> = {
  unidad: "unit", un: "unit", u: "unit", unit: "unit",
  kg: "kg", kilogramo: "kg", kilos: "kg", kilo: "kg",
  lt: "lt", l: "lt", litro: "lt", litros: "lt",
  m: "m", metro: "m", metros: "m",
  box: "box", caja: "box", cajas: "box",
  pack: "pack", paquete: "pack",
  bulk: "bulk", bulto: "bulk", bultos: "bulk",
};

export function normalizeUnit(v?: string): UnitType {
  if (!v || v.trim() === "") return "unit";
  return unitMap[v.trim().toLowerCase()] ?? "unit";
}
