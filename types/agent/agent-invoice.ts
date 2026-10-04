export type AgentPendingInvoiceStatus =
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "OVERDUE";

export interface AgentInvoiceTaxpayer {
  id: string;
  taxpayer_number: string;
  name: string;
  phone: string | null;
}

export interface AgentInvoiceService {
  id: string;
  name: string;
  description: string | null;
  amount: string;
}

export interface AgentPendingInvoice {
  id: string;
  invoice_number: string;
  status: AgentPendingInvoiceStatus;

  issued_at: string | null;
  due_date: string | null;

  total_amount: string;
  paid_amount: string;
  balance_amount: string;

  taxpayer: AgentInvoiceTaxpayer | null;

  services: AgentInvoiceService[];
}

export interface AgentPendingInvoiceFilters {
  search?: string;
  page?: number;
  per_page?: number;
}