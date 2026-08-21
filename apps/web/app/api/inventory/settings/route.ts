import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiModule } from "@/lib/api-auth";
import { getPricingSettings, setTenantRounding } from "@apolo/module-inventory";

const schema = z.object({
  priceRounding: z.enum(["none", "10", "50", "100"]),
});

export async function GET() {
  const user = await requireApiModule("inventory");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  return NextResponse.json(await getPricingSettings(user.tenantId));
}

export async function PATCH(req: Request) {
  const user = await requireApiModule("inventory");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  if (user.role !== "tenant_admin" && user.role !== "super_admin") {
    return NextResponse.json({ error: "Solo el administrador puede cambiar esta configuración" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  await setTenantRounding(user.tenantId, parsed.data.priceRounding);
  return NextResponse.json({ ok: true, priceRounding: parsed.data.priceRounding });
}
