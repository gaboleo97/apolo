"use client";

import { useEffect } from "react";
import type {
  PrintFormat,
  PrintTemplateElement,
} from "@apolo/database";
import type { SaleDetailData, CompanyData } from "./types";

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type PrintDocumentProps = {
  format: PrintFormat;
  elements: PrintTemplateElement[];
  sale: SaleDetailData;
  company: CompanyData;
};

function alignOf(el: PrintTemplateElement) {
  switch (el.props?.align) {
    case "center":
      return "center" as const;
    case "right":
      return "right" as const;
    default:
      return "left" as const;
  }
}

export default function PrintDocument({ format, elements, sale, company }: PrintDocumentProps) {
  const thermal = format === "thermal80";
  const statusLabel =
    sale.status === "draft"
      ? "PRESUPUESTO"
      : sale.status === "cancelled"
        ? "COMPROBANTE ANULADO"
        : "VENTA";

  return (
    <div className={`print-doc ${thermal ? "doc-thermal" : "doc-a4"}`}>
      {elements
        .filter((el) => el.enabled)
        .map((el, idx) => {
          const align = alignOf(el);
          switch (el.type) {
            case "logo":
              return company.logoUrl ? (
                <div key={idx} className="blk blk-logo" style={{ textAlign: align }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={company.logoUrl} alt="Logo" />
                </div>
              ) : null;

            case "title":
              return (
                <div key={idx} className="blk blk-title" style={{ textAlign: align }}>
                  <div className="doc-kind">{el.props?.text || statusLabel}</div>
                  <div className="doc-code">{sale.code}</div>
                </div>
              );

            case "company":
              return (
                <div key={idx} className="blk blk-company" style={{ textAlign: align }}>
                  <div className="strong">{company.name}</div>
                  {company.taxId && <div>CUIT: {company.taxId}</div>}
                  {company.address && <div>{company.address}</div>}
                  {(company.phone || company.email) && (
                    <div>
                      {[company.phone, company.email].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
              );

            case "client":
              return (
                <div key={idx} className="blk blk-client" style={{ textAlign: align }}>
                  <div className="strong">Cliente: {sale.clientName ?? "Consumidor final"}</div>
                  {sale.clientTaxId && <div>CUIT/DNI: {sale.clientTaxId}</div>}
                  {sale.clientAddress && <div>{sale.clientAddress}</div>}
                  {sale.clientPhone && <div>Tel: {sale.clientPhone}</div>}
                </div>
              );

            case "meta": {
              const date = new Date(sale.createdAt).toLocaleString("es-AR");
              return (
                <div key={idx} className="blk blk-meta" style={{ textAlign: align }}>
                  <div>Fecha: {date}</div>
                  {sale.sellerName && <div>Vendedor: {sale.sellerName}</div>}
                </div>
              );
            }

            case "items": {
              const cols = el.props?.columns ?? {};
              if (thermal) {
                return (
                  <table key={idx} className="blk items-table">
                    <thead>
                      <tr>
                        <th className="ta-l">Producto</th>
                        {cols.quantity !== false && <th className="ta-r">Cant</th>}
                        <th className="ta-r">Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sale.items.map((it) => (
                        <tr key={it.id}>
                          <td className="ta-l">
                            {it.nameSnapshot}
                            {cols.unitPrice !== false && cols.quantity !== false && (
                              <div className="muted">
                                {Number(it.quantity)} x ${fmt(Number(it.unitPrice))}
                              </div>
                            )}
                            {cols.sku && it.productSku && (
                              <div className="muted">SKU: {it.productSku}</div>
                            )}
                          </td>
                          {cols.quantity !== false && (
                            <td className="ta-r">{Number(it.quantity)}</td>
                          )}
                          <td className="ta-r">${fmt(Number(it.lineTotal))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              }
              return (
                <table key={idx} className="blk items-table">
                  <thead>
                    <tr>
                      <th className="ta-l">Descripción</th>
                      {cols.sku && <th>SKU</th>}
                      {cols.quantity !== false && <th className="ta-r">Cantidad</th>}
                      {cols.unitPrice !== false && <th className="ta-r">Precio unit.</th>}
                      {cols.lineTotal !== false && <th className="ta-r">Subtotal</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((it) => (
                      <tr key={it.id}>
                        <td className="ta-l">
                          {it.nameSnapshot}
                          {sale.status === "draft" && (
                            <span className="muted"> (presupuesto)</span>
                          )}
                        </td>
                        {cols.sku && <td className="ta-c">{it.productSku ?? "—"}</td>}
                        {cols.quantity !== false && (
                          <td className="ta-r">{Number(it.quantity)}</td>
                        )}
                        {cols.unitPrice !== false && (
                          <td className="ta-r">${fmt(Number(it.unitPrice))}</td>
                        )}
                        {cols.lineTotal !== false && (
                          <td className="ta-r">${fmt(Number(it.lineTotal))}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            }

            case "totals":
              return (
                <div key={idx} className="blk blk-totals" style={{ textAlign: align }}>
                  <div className="total-line main">
                    <span>TOTAL</span>
                    <span>${fmt(sale.total)}</span>
                  </div>
                  {el.props?.showPaid && sale.payments.length > 0 && (
                    <div className="total-line">
                      <span>Pagado</span>
                      <span>${fmt(sale.paid)}</span>
                    </div>
                  )}
                  {el.props?.showBalance && sale.balance > 0 && sale.status === "confirmed" && (
                    <div className="total-line">
                      <span>Saldo pendiente</span>
                      <span>${fmt(sale.balance)}</span>
                    </div>
                  )}
                </div>
              );

            case "payments":
              return sale.payments.length > 0 ? (
                <div key={idx} className="blk blk-payments" style={{ textAlign: align }}>
                  <div className="section-label">Pagos</div>
                  {sale.payments.map((p) => (
                    <div key={p.id}>
                      - ${fmt(Number(p.amount))} ({p.methodLabel})
                      {p.note ? ` — ${p.note}` : ""}
                    </div>
                  ))}
                </div>
              ) : null;

            case "notes":
              return sale.notes ? (
                <div key={idx} className="blk blk-notes" style={{ textAlign: align }}>
                  <div className="section-label">Notas</div>
                  <div>{sale.notes}</div>
                </div>
              ) : null;

            case "freetext":
              return el.props?.text ? (
                <div key={idx} className="blk blk-freetext" style={{ textAlign: align }}>
                  {el.props.text}
                </div>
              ) : null;

            case "footer":
              return (
                <div key={idx} className="blk blk-footer" style={{ textAlign: align }}>
                  {el.props?.text || "¡Gracias por su compra!"}
                  <div className="signature">
                    <div className="sig-line" />
                    <div className="sig-caption">Firma y aclaración</div>
                  </div>
                </div>
              );

            default:
              return null;
          }
        })}
    </div>
  );
}

/** Botonera flotante que no sale en la impresión. */
export function PrintToolbar() {
  return (
    <div className="print-toolbar no-print">
      <button onClick={() => window.print()}>🖨️ Imprimir</button>
      <button onClick={() => window.close()}>Cerrar</button>
    </div>
  );
}

export function useAutoPrint(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [enabled]);
}
