import { NextResponse } from "next/server";
import { z } from "zod";
import { acceptInvitation } from "@apolo/auth";
import { getIp, rateLimit } from "@/lib/rate-limit";

const joinSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export async function POST(req: Request) {
  const ip = getIp(req);
  if (!(await rateLimit("register-join", ip, 10, "1 m"))) {
    return NextResponse.json({ error: "Demasiados intentos. Intentá más tarde." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const user = await acceptInvitation(parsed.data);
  if (!user) {
    return NextResponse.json({ error: "Invitación inválida, expirada o ya usada" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, user }, { status: 201 });
}
