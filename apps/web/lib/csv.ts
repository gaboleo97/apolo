import Papa from "papaparse";

export function toCsv(rows: Record<string, unknown>[]): string {
  return "\uFEFF" + Papa.unparse(rows);
}

export function parseCsv(text: string): Record<string, string>[] {
  const res = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  return res.data;
}
