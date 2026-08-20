import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@apolo/auth";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  country: z.enum(["AR", "MX", "CO", "CL", "PE", "US"]).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    const user = await registerUser(parsed.data);
    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err) {
    if ((err as { code?: string }).code === "EMAIL_TAKEN") {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}