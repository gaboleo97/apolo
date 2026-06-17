import type { CountryCode } from "./types";

export interface CountryConfig {
  currency: string;
  locale: string;
  taxSystem: string;
  taxRates: TaxRate[];
  invoiceProvider: string;
  timezone: string;
}

export interface TaxRate {
  id: number;
  key: string;
  label: string;
  rate: number;
}

export const countryConfigs: Record<CountryCode, CountryConfig> = {
  AR: {
    currency: "ARS",
    locale: "es-AR",
    taxSystem: "iva",
    taxRates: [
      { id: 3, key: "0", label: "IVA 0%", rate: 0 },
      { id: 4, key: "10.5", label: "IVA 10.5%", rate: 10.5 },
      { id: 5, key: "21", label: "IVA 21%", rate: 21 },
      { id: 6, key: "27", label: "IVA 27%", rate: 27 },
    ],
    invoiceProvider: "arca",
    timezone: "America/Argentina/Buenos_Aires",
  },
  MX: {
    currency: "MXN",
    locale: "es-MX",
    taxSystem: "cfdi",
    taxRates: [
      { id: 1, key: "0", label: "IVA 0%", rate: 0 },
      { id: 2, key: "8", label: "IVA 8%", rate: 8 },
      { id: 3, key: "16", label: "IVA 16%", rate: 16 },
    ],
    invoiceProvider: "sat",
    timezone: "America/Mexico_City",
  },
  CO: {
    currency: "COP",
    locale: "es-CO",
    taxSystem: "iva",
    taxRates: [
      { id: 1, key: "0", label: "IVA 0%", rate: 0 },
      { id: 2, key: "5", label: "IVA 5%", rate: 5 },
      { id: 3, key: "19", label: "IVA 19%", rate: 19 },
    ],
    invoiceProvider: "dian",
    timezone: "America/Bogota",
  },
  CL: {
    currency: "CLP",
    locale: "es-CL",
    taxSystem: "iva",
    taxRates: [
      { id: 1, key: "0", label: "IVA 0%", rate: 0 },
      { id: 2, key: "19", label: "IVA 19%", rate: 19 },
    ],
    invoiceProvider: "sii",
    timezone: "America/Santiago",
  },
  PE: {
    currency: "PEN",
    locale: "es-PE",
    taxSystem: "igv",
    taxRates: [
      { id: 1, key: "0", label: "IGV 0%", rate: 0 },
      { id: 2, key: "18", label: "IGV 18%", rate: 18 },
    ],
    invoiceProvider: "sunat",
    timezone: "America/Lima",
  },
  US: {
    currency: "USD",
    locale: "en-US",
    taxSystem: "sales_tax",
    taxRates: [
      { id: 1, key: "0", label: "No Tax", rate: 0 },
    ],
    invoiceProvider: "generic",
    timezone: "America/New_York",
  },
};

export function getCountryConfig(code: CountryCode): CountryConfig {
  const config = countryConfigs[code];
  if (!config) throw new Error(`Country config not found for: ${code}`);
  return config;
}
