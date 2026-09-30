/*
|--------------------------------------------------------------------------
| INVOICE DETAIL TYPES
|--------------------------------------------------------------------------
*/

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED"
  | "VOID";

export type InvoiceSourceType =
  | "ASSESSMENT"
  | "DIRECT_COLLECTION";

export type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type MoneyValue =
  | number
  | string;

export interface InvoiceUser {
  id: string;
  name: string;
}

export interface Citizen {
  id: string;
  name: string | null;
  citizen_number: string | null;
  phone: string | null;
  email: string | null;
}

export interface AdministrativeUnit {
  id: string;
  name: string;
  code: string;
}

export interface Assessment {
  id: string;
  assessment_number: string;
  status: string;
}

export interface RevenueService {
  id: string;
  name: string;
  code: string;
}

export interface AssessmentService {
  id: string;
  computed_amount: MoneyValue;
}

export interface PaymentSchedule {
  id: string;
  installment_number: number;
  due_date: string | null;
  amount_due: MoneyValue;
  amount_paid: MoneyValue;
  status: string;
}

export interface InvoiceItem {
  id: string;
  line_number: number;

  assessment_service_id: string | null;
  payment_schedule_id: string | null;
  service_id: string;

  description: string;

  quantity: MoneyValue | null;
  unit: string | null;
  unit_price: MoneyValue | null;

  amount: MoneyValue;
  discount_amount: MoneyValue;
  penalty_amount: MoneyValue;
  interest_amount: MoneyValue;
  total_amount: MoneyValue;

  currency: string;

  tariff_version_id: string | null;
  tariff_rule_id: string | null;

  input_snapshot: Record<string, unknown> | null;
  calculation_snapshot: Record<string, unknown> | null;

  service: RevenueService | null;
  assessment_service: AssessmentService | null;
  payment_schedule: PaymentSchedule | null;
}

export interface PaymentFile {
  id: string;
  uuid: string;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
  status: string;
  visibility: string;
  uploaded_at: string | null;
}

export interface Payment {
  id: string;

  payment_number: string;

  amount: MoneyValue;
  currency: string;

  payment_method: string;
  payment_provider: string;

  status: PaymentStatus;

  transaction_reference: string | null;
  provider_reference: string | null;

  payment_date: string | null;
  verified_at: string | null;

  received_by: InvoiceUser | null;
  verified_by: InvoiceUser | null;

  failure_reason: string | null;

  evidence: PaymentFile[];
  receipts: PaymentFile[];
}

export interface InvoiceFinancial {
  subtotal: MoneyValue;
  discount_amount: MoneyValue;
  penalty_amount: MoneyValue;
  interest_amount: MoneyValue;
  total_amount: MoneyValue;
  paid_amount: MoneyValue;
  balance_due: MoneyValue;
}

export interface InvoiceDates {
  issued_at: string | null;
  due_date: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  voided_at: string | null;
}

export interface InvoiceSource {
  type: InvoiceSourceType;
  metadata: Record<string, unknown> | null;
}

export interface InvoiceAudit {
  created_at: string;
  updated_at: string;

  created_by: InvoiceUser | null;
  issued_by: InvoiceUser | null;
}

export interface InvoiceCancellation {
  cancelled_at: string | null;
  reason: string | null;
  cancelled_by: InvoiceUser | null;
}

export interface InvoiceVoid {
  voided_at: string | null;
  reason: string | null;
  voided_by: InvoiceUser | null;
}

export interface InvoiceDetail {
  id: string;

  invoice_number: string;

  source_type: InvoiceSourceType;

  status: InvoiceStatus;

  currency: string;

  citizen: Citizen | null;

  administrative_unit: AdministrativeUnit | null;

  assessment: Assessment | null;

  financial: InvoiceFinancial;

  dates: InvoiceDates;

  items: InvoiceItem[];

  payments: Payment[];

  source: InvoiceSource;

  audit: InvoiceAudit;

  cancellation: InvoiceCancellation;

  void: InvoiceVoid;

  notes: string | null;
}