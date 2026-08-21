import { NextResponse } from "next/server";
import { z } from "zod";
import { auth, changePassword } from "@apolo/auth";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(128),
});

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const result = await changePassword({
    userId: user.id,
    currentPassword: parsed.data.currentPassword,
    newPassword: parsed.data.newPassword,
  });

  if (!result.ok) {
    return NextResponse.json({ error: "La contraseña actual no es correcta" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
