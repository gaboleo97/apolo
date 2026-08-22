import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiModule } from "@/lib/api-auth";
import { createSale, listSales } from "@apolo/module-sales";

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive().max(999999),
  unitPrice: z.number().min(0).max(99999999),
});

const createSchema = z.object({
  clientId: z.string().uuid().nullable().optional(),
  items: z.array(itemSchema).min(1),
  notes: z.string().max(500).nullable().optional(),
});

export async function GET(req: Request) {
  const user = await requireApiModule("sales");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const params = new URL(req.url).searchParams;
  const status = params.get("status");
  const search = params.get("search") ?? undefined;

  const salesList = await listSales(user.tenantId, {
    status:
      status === "draft" || status === "confirmed" || status === "cancelled"
        ? status
        : undefined,
    search,
  });
  return NextResponse.json({ sales: salesList });
}

export async function POST(req: Request) {
  const user = await requireApiModule("sales");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const result = await createSale(
    user.tenantId,
    parsed.data as { clientId?: string | null; items: { productId: string; quantity: number; unitPrice: number }[]; notes?: string | null },
    user.id
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, sale: result.sale });
}
