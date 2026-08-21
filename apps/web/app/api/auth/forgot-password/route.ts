import { NextResponse } from "next/server";
import { z } from "zod";
import { createPasswordResetToken } from "@apolo/auth";
import { sendPasswordResetEmail } from "@apolo/email";
import { getIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const ip = getIp(req);
  if (!(await rateLimit("forgot-password", ip, 5, "1 m"))) {
    return NextResponse.json({ ok: true });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }

  const token = await createPasswordResetToken(parsed.data.email);
  if (token) {
    const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail(parsed.data.email, resetUrl);
    } catch (err) {
      console.error("reset email failed", err);
    }
  }

  return NextResponse.json({ ok: true });
}
