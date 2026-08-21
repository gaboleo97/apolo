import { NextResponse } from "next/server";
import { db } from "@apolo/database";
import { getIp, rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const ip = getIp(req);
  if (!(await rateLimit("lookup", ip, 30, "1 m"))) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("slug") ?? "").trim().toLowerCase();

  if (!slug) {
    return NextResponse.json({ error: "slug requerido" }, { status: 400 });
  }

  const tenant = await db.query.tenants.findFirst({
    where: (t, { eq }) => eq(t.slug, slug),
  });

  if (!tenant || !tenant.isActive) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ id: tenant.id, name: tenant.name });
}
