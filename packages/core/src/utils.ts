export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function generateSku(name: string, index: number): string {
  const prefix = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
  return `${prefix}-${String(index).padStart(4, "0")}`;
}

export function formatCurrency(amount: number, currency = "ARS"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
  }).format(amount);
}

export function withTenant<T extends Record<string, unknown>>(
  data: T,
  tenantId: string
): T & { tenantId: string } {
  return { ...data, tenantId };
}
