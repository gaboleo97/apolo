import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiModule } from "@/lib/api-auth";
import { listCategories, createCategory } from "@apolo/module-inventory";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(300).nullable().optional(),
});

export async function GET() {
  const user = await requireApiModule("inventory");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const categories = await listCategories(user.tenantId);
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const user = await requireApiModule("inventory");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const category = await createCategory(user.tenantId, parsed.data);
  if (!category) return NextResponse.json({ error: "No se pudo crear la categoría" }, { status: 500 });

  return NextResponse.json({ ok: true, category }, { status: 201 });
}
