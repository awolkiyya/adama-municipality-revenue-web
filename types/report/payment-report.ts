// src/types/payment-report.ts

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "REVERSED";

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "ONLINE";

export type PaymentSource =
  | "ASSESSMENT"
  | "DIRECT_COLLECTION"
  | "OFFICE_RECORDED";

export type PaymentSortField =
  | "created_at"
  | "amount"
  | "status";

export type SortDirection = "asc" | "desc";

// ---------------------------------------------------------
// Users
// ---------------------------------------------------------

export interface PaymentReportUser {
  id: number | string;
  name: string | null;
}

// ---------------------------------------------------------
// Citizen / Taxpayer
// ---------------------------------------------------------

export interface PaymentReportTaxpayer {
  id: number | string;
  citizen_uid: string | null;
  name: string | null;
  national_id: string | null;
  phone: string | null;
  email: string | null;
}

// ---------------------------------------------------------
// Bank Account
// ---------------------------------------------------------

export interface PaymentReportBankAccount {
  id: number | string;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  currency: string;
}

// ---------------------------------------------------------
// Bank Transfer Details
// ---------------------------------------------------------

export interface PaymentReportBankTransferDetails {
  transfer_reference: string | null;
  transfer_date: string | null;
  sender_name: string | null;
  verification_status:
    | "PENDING"
    | "PENDING_VERIFICATION"
    | "VERIFIED"
    | "REJECTED"
    | string
    | null;
  bank_account: PaymentReportBankAccount | null;
}

// ---------------------------------------------------------
// Payment Report
// ---------------------------------------------------------

export interface PaymentReport {
  // Payment identification
  id: number | string;
  payment_reference: string | null;
  receipt_number?: string | null;

  // Invoice information
  invoice_id: number | string | null;
  invoice_reference: string | null;

  // Citizen information
  taxpayer?: PaymentReportTaxpayer | null;

  // Financial information
  amount: string;
  currency: string;

  // Payment classification
  status: PaymentStatus | string;
  payment_method: PaymentMethod | string | null;
  payment_provider: string | null;
  payment_source: PaymentSource | string | null;

  // Bank transfer information
  bank_transfer_details?: PaymentReportBankTransferDetails | null;

  // Transaction references
  transaction_reference: string | null;

  // Payment processing and verification
  processed_by: PaymentReportUser | null;
  verified_by: PaymentReportUser | null;
  verified_at: string | null;

  // Timestamps
  completed_at?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ---------------------------------------------------------
// Filters
// ---------------------------------------------------------

export interface PaymentReportFilters {
  start_date?: string;
  end_date?: string;

  status?: PaymentStatus | "";
  payment_method?: PaymentMethod | "";
  payment_provider?: string;
  payment_source?: PaymentSource | "";

  administrative_unit_id?: number | string;
  revenue_category_id?: number | string;
  service_id?: number | string;

  search?: string;

  per_page?: number;
  page?: number;

  sort_by?: PaymentSortField;
  sort_direction?: SortDirection;
}

// ---------------------------------------------------------
// Summary
// ---------------------------------------------------------

export interface PaymentReportSummary {
  total_transactions: number;

  completed_count: number;
  completed_amount: string;

  pending_count: number;
  pending_amount: string;

  processing_count: number;
  processing_amount: string;

  failed_count: number;
  cancelled_count: number;
  expired_count: number;
  reversed_count: number;

  currency: string;
}

export interface PaymentReportSummaryResponse {
  message: string;
  data: PaymentReportSummary;
}

// ---------------------------------------------------------
// Pagination
// ---------------------------------------------------------

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;

  links: Array<{
    url: string | null;
    label: string;
    page?: number | null;
    active: boolean;
  }>;

  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginatedPaymentReports {
  data: PaymentReport[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export interface PaymentReportDetailResponse {
  data: PaymentReport;
}

// ---------------------------------------------------------
// API Errors
// ---------------------------------------------------------

export interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}
