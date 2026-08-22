"use client";

import type { PrintFormat, PrintTemplateElement } from "@apolo/database";
import PrintDocument from "./PrintDocument";
import type { SaleDetailData, CompanyData } from "./types";
import { useAutoPrint } from "./PrintDocument";

export type PrintPageProps = {
  format: PrintFormat;
  elements: PrintTemplateElement[];
  sale: SaleDetailData;
  company: CompanyData;
  auto: boolean;
};

const pageCss = (format: PrintFormat) =>
  format === "thermal80"
    ? `@page { size: 80mm auto; margin: 0; }`
    : `@page { size: A4; margin: 15mm; }`;

const docCss = `
.print-wrap { min-height: 100vh; background: #e8e8e8; padding: 24px 12px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.print-doc { background: #fff; color: #000; box-shadow: 0 2px 10px rgba(0,0,0,.25); }
.doc-a4 { width: 180mm; padding: 10mm 12mm; font-family: Arial, Helvetica, sans-serif; font-size: 12px; }
.doc-thermal { width: 72mm; padding: 3mm 4mm; font-family: "Courier New", ui-monospace, monospace; font-size: 11px; }
.blk { margin-bottom: 8px; }
.blk-logo img { max-height: 70px; max-width: 45%; }
.doc-title-row { }
.doc-kind { font-weight: bold; letter-spacing: .6px; }
.doc-a4 .doc-kind { font-size: 15px; }
.doc-thermal .doc-kind { font-size: 12px; }
.doc-code { font-weight: bold; font-size: 13px; }
.strong { font-weight: bold; }
.muted { opacity: .65; font-size: .85em; }
.items-table { width: 100%; border-collapse: collapse; margin: 4px 0 8px; }
.doc-a4 .items-table th, .doc-a4 .items-table td { border: 1px solid #000; padding: 3px 6px; font-size: 11px; }
.doc-a4 .items-table th { background: #f2f2f2; }
.doc-thermal .items-table th { border-bottom: 1px dashed #000; font-size: 10px; }
.doc-thermal .items-table td { padding: 2px 0; vertical-align: top; border-bottom: 1px dotted #bbb; }
.ta-l { text-align: left; } .ta-r { text-align: right; } .ta-c { text-align: center; }
.total-line { display: flex; justify-content: space-between; gap: 12px; }
.total-line.main { font-weight: bold; font-size: 1.25em; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
.section-label { font-weight: bold; font-size: .85em; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 2px; }
.signature { margin-top: 30px; width: 60mm; }
.sig-line { border-top: 1px solid #000; }
.sig-caption { font-size: 10px; margin-top: 2px; }
.print-toolbar { display: flex; gap: 8px; position: fixed; top: 12px; right: 12px; }
.print-toolbar button { padding: 8px 14px; border-radius: 8px; border: 1px solid #999; background: #fff; cursor: pointer; font-size: 14px; }
.print-toolbar button:hover { background: #f0f0f0; }
@media print {
  body { margin: 0 !important; background: #fff !important; }
  .print-wrap { padding: 0; background: #fff; display: block; }
  .print-doc { box-shadow: none; width: auto; max-width: none; }
  .doc-a4 { width: 180mm; }
  .doc-thermal { width: 80mm; }
  .no-print { display: none !important; }
}
`;

export default function PrintClient({ format, elements, sale, company, auto }: PrintPageProps) {
  useAutoPrint(auto);

  return (
    <div className="print-wrap">
      {/* eslint-disable-next-line react/no-danger */}
      <style>{pageCss(format)}</style>
      {/* eslint-disable-next-line react/no-danger */}
      <style>{docCss}</style>
      <div className="print-toolbar no-print">
        <button onClick={() => window.print()}>🖨️ Imprimir</button>
        <button onClick={() => window.close()}>Cerrar</button>
      </div>
      <PrintDocument format={format} elements={elements} sale={sale} company={company} />
    </div>
  );
}
