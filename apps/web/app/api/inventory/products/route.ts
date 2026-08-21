import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@apolo/database";
import { requireApiModule } from "@/lib/api-auth";
import { listProducts, createProduct, listCategories } from "@apolo/module-inventory";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  categoryId: z.string().uuid().nullable().optional(),
  price: z.number().positive(),
  cost: z.number().nonnegative().nullable().optional(),
  taxRate: z.number().min(0).optional(),
  sku: z.string().max(80).nullable().optional(),
  barcode: z.string().max(80).nullable().optional(),
  unitType: z.enum(["unit", "kg", "lt", "m", "box", "pack"]).optional(),
  minStock: z.number().int().min(0).optional(),
  description: z.string().max(500).nullable().optional(),
});

export async function GET(req: Request) {
  const user = await requireApiModule("inventory");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;

  const [products, categories] = await Promise.all([
    listProducts(user.tenantId, { search, categoryId }),
    listCategories(user.tenantId),
  ]);

  return NextResponse.json({ products, categories });
}

export async function POST(req: Request) {
  const user = await requireApiModule("inventory");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const product = await createProduct(user.tenantId, parsed.data);
  if (!product) return NextResponse.json({ error: "No se pudo crear el producto" }, { status: 500 });

  return NextResponse.json({ ok: true, product }, { status: 201 });
}
