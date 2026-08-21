import { NextResponse } from "next/server";
import { z } from "zod";
import { registerViewerUser } from "@apolo/auth";
import { sendWelcomeEmail } from "@apolo/email";

const registerSchema = z.object({
  slug: z.string().min(1).max(60),
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    const user = await registerViewerUser(parsed.data);

    try {
      await sendWelcomeEmail(parsed.data.email, parsed.data.name);
    } catch (err) {
      console.error("welcome email failed", err);
    }

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "TENANT_NOT_FOUND") {
      return NextResponse.json({ error: "Empresa no encontrada. Verificá el código." }, { status: 404 });
    }
    if (code === "EMAIL_TAKEN") {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
