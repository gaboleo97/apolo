import { NextResponse } from "next/server";
import { z } from "zod";
import { resetPassword } from "@apolo/auth";
import { getIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6).max(128),
});

export async function POST(req: Request) {
  const ip = getIp(req);
  if (!(await rateLimit("reset-password", ip, 10, "1 m"))) {
    return NextResponse.json({ error: "Demasiados intentos. Intentá más tarde." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const ok = await resetPassword(parsed.data.token, parsed.data.password);
  if (!ok) {
    return NextResponse.json({ error: "Enlace inválido o expirado" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
