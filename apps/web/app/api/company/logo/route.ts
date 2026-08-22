import { NextResponse } from "next/server";
import { requireApiModule } from "@/lib/api-auth";
import { setCompanyLogo } from "@apolo/module-sales";

const MAX_BYTES = 500 * 1024;
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
};

export async function POST(req: Request) {
  const user = await requireApiModule("sales");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  if (!["tenant_admin", "super_admin", "manager"].includes(user.role)) {
    return NextResponse.json({ error: "Solo administradores pueden subir el logo" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) return NextResponse.json({ error: "Solo se aceptan PNG o JPG" }, { status: 400 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen no puede superar 500KB" }, { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Storage no configurado" }, { status: 500 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const path = `${user.tenantId}.${ext}`;

  const upRes = await fetch(`${supabaseUrl}/storage/v1/object/logos/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": file.type,
      "x-upsert": "true",
    },
    body: new Uint8Array(bytes),
  });

  if (!upRes.ok) {
    const detail = await upRes.text().catch(() => "");
    console.error("logo upload failed", detail);
    return NextResponse.json({ error: "No se pudo subir el logo" }, { status: 500 });
  }

  const logoUrl = `${supabaseUrl}/storage/v1/object/public/logos/${path}`;
  await setCompanyLogo(user.tenantId, logoUrl);

  return NextResponse.json({ ok: true, logoUrl });
}
