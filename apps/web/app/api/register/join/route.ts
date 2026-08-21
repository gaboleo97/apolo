import { NextResponse } from "next/server";
import { z } from "zod";
import { acceptInvitation } from "@apolo/auth";

const joinSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export async function POST(req: Request) {
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
