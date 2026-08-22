export type SaleItemData = {
  id: string;
  nameSnapshot: string;
  productSku: string | null;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
};

export type SalePaymentData = {
  id: string;
  amount: string;
  methodLabel: string;
  note: string | null;
};

export type SaleDetailData = {
  code: string;
  status: "draft" | "confirmed" | "cancelled" | string;
  clientName: string | null;
  clientTaxId: string | null;
  clientAddress: string | null;
  clientPhone: string | null;
  sellerName: string | null;
  createdAt: string;
  notes: string | null;
  total: number;
  paid: number;
  balance: number;
  items: SaleItemData[];
  payments: SalePaymentData[];
};

export type CompanyData = {
  name: string;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
};
