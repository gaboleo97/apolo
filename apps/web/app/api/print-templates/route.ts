import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiModule } from "@/lib/api-auth";
import {
  getPrintTemplate,
  savePrintTemplate,
  deletePrintTemplate,
  type PrintTemplateElement,
} from "@apolo/module-sales";

const elementSchema = z.object({
  type: z.enum([
    "logo",
    "title",
    "company",
    "client",
    "meta",
    "items",
    "totals",
    "payments",
    "notes",
    "freetext",
    "footer",
  ]),
  enabled: z.boolean(),
  props: z
    .object({
      text: z.string().max(300).optional(),
      columns: z
        .object({
          sku: z.boolean().optional(),
          quantity: z.boolean().optional(),
          unitPrice: z.boolean().optional(),
          lineTotal: z.boolean().optional(),
        })
        .optional(),
      showPaid: z.boolean().optional(),
      showBalance: z.boolean().optional(),
      align: z.enum(["left", "center", "right"]).optional(),
    })
    .optional(),
});

export async function GET(req: Request) {
  const user = await requireApiModule("sales");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const format = new URL(req.url).searchParams.get("format");
  if (format !== "a4" && format !== "thermal80") {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  }

  const template = await getPrintTemplate(user.tenantId, format);
  return NextResponse.json(template);
}

export async function PUT(req: Request) {
  const user = await requireApiModule("sales");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  if (!["tenant_admin", "super_admin", "manager"].includes(user.role)) {
    return NextResponse.json({ error: "Solo administradores pueden guardar el diseño" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      format: z.enum(["a4", "thermal80"]),
      elements: z.array(elementSchema).min(1).max(20),
    })
    .safeParse(body);

  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const saved = await savePrintTemplate(
    user.tenantId,
    parsed.data.format,
    parsed.data.elements as PrintTemplateElement[]
  );

  return NextResponse.json({ ok: true, template: saved });
}

export async function DELETE(req: Request) {
  const user = await requireApiModule("sales");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  if (!["tenant_admin", "super_admin", "manager"].includes(user.role)) {
    return NextResponse.json({ error: "Solo administradores pueden restablecer el diseño" }, { status: 403 });
  }

  const format = new URL(req.url).searchParams.get("format");
  if (format !== "a4" && format !== "thermal80") {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  }

  await deletePrintTemplate(user.tenantId, format);
  const template = await getPrintTemplate(user.tenantId, format);
  return NextResponse.json({ ok: true, template });
}
