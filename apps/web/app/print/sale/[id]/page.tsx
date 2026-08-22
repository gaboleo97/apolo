import { notFound, redirect } from "next/navigation";
import { auth } from "@apolo/auth";
import type { ModuleKey } from "@apolo/core";
import {
  getCompanyData,
  getPrintTemplate,
  getSaleDetail,
} from "@apolo/module-sales";
import PrintClient, { type PrintPageProps } from "./PrintClient";

const methodLabels: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  other: "Otro",
};

export default async function PrintSalePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ format?: string; auto?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.modules.includes("sales" as ModuleKey)) redirect("/dashboard");

  const { id } = await params;
  const { format: fmtParam, auto } = await searchParams;
  const format = fmtParam === "thermal80" ? "thermal80" : "a4";

  const tenantId = session.user.tenantId as string;
  const detail = await getSaleDetail(tenantId, id);
  if (!detail) notFound();

  const [template, company] = await Promise.all([
    getPrintTemplate(tenantId, format),
    getCompanyData(tenantId),
  ]);
  if (!company) notFound();

  const props: PrintPageProps = {
    format,
    elements: template.elements,
    auto: auto === "1",
    sale: {
      code: detail.sale.code,
      status: detail.sale.status ?? "draft",
      clientName: detail.clientName,
      clientTaxId: detail.clientTaxId,
      clientAddress: detail.clientAddress,
      clientPhone: detail.clientPhone,
      sellerName: detail.sellerName,
      createdAt: (detail.sale.createdAt ?? new Date()).toISOString(),
      notes: detail.sale.notes,
      total: detail.total,
      paid: detail.paid,
      balance: detail.balance,
      items: detail.items.map((it) => ({
        id: it.id,
        nameSnapshot: it.nameSnapshot,
        productSku: it.productSku,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
      })),
      payments: detail.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        methodLabel: methodLabels[p.method] ?? p.method,
        note: p.note,
      })),
    },
    company,
  };

  return <PrintClient {...props} />;
}
