import type {
  PaymentMethod,
  PaymentSource,
  PaymentStatus,
} from "./payment-enums";

// ============================================================
// COMMON TYPES
// ============================================================

export interface PaymentUser {
  id: string;
  name: string;
  role: string | null;
}

export interface PaymentInvoice {
  id: string;
  invoice_number: string;
  status: string;
}

export interface PaymentCitizen {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface PaymentService {
  id: string;
  name: string;
  code: string | null;
}

// ============================================================
// CASH PAYMENT DETAILS
// ============================================================

export interface CashPaymentDetails {
  payment_id: string;

  received_by: PaymentUser | null;

  cashier_session_id: string | null;

  cash_received_at: string | null;

  notes: string | null;
}

// ============================================================
// BANK TRANSFER DETAILS
// ============================================================

export interface BankTransferDetails {
  payment_id: string;

  bank_account_id: string;

  transfer_reference: string;

  transfer_date: string;

  sender_name: string | null;

  sender_account: string | null;

  verification_status: string | null;

  verified_by: PaymentUser | null;

  verified_at: string | null;

  notes: string | null;
}

// ============================================================
// ONLINE PAYMENT DETAILS
// ============================================================

export interface OnlinePaymentDetails {
  payment_id: string;

  payment_provider_id: string;

  checkout_reference: string | null;

  provider_transaction_id: string | null;

  checkout_url: string | null;

  provider_status: string | null;

  callback_received_at: string | null;

  provider_response: Record<string, unknown> | null;

  paid_at: string | null;
}

// ============================================================
// RECEIPT
// ============================================================

export interface PaymentReceipt {
  id: string;

  receipt_number: string;

  payment_id: string;

  amount: number;

  currency: string;

  issued_at: string;

  issued_by: PaymentUser | null;
}

// ============================================================
// PAYMENT
// ============================================================

export interface Payment {
  // ==========================================================
  // IDENTITY
  // ==========================================================

  id: string;

  payment_number: string;

  // ==========================================================
  // REFERENCES
  // ==========================================================

  invoice_id: string | null;

  citizen_id: string | null;

  // ==========================================================
  // PAYMENT CLASSIFICATION
  // ==========================================================

  payment_method: PaymentMethod;

  payment_source: PaymentSource;

  status: PaymentStatus;

  // ==========================================================
  // PAYMENT REFERENCES
  // ==========================================================

  transaction_reference: string;

  // ==========================================================
  // MONEY
  // ==========================================================

  amount: number;

  currency: string;

  // ==========================================================
  // PROCESSING / VERIFICATION
  // ==========================================================

  processed_by: PaymentUser | null;

  verified_by: PaymentUser | null;

  verified_at: string | null;

  // ==========================================================
  // PAYER
  // ==========================================================

  payer_name: string | null;

  payer_email: string | null;

  payer_phone: string | null;

  // ==========================================================
  // FAILURE
  // ==========================================================

  failure_reason: string | null;

  // ==========================================================
  // METADATA
  // ==========================================================

  metadata: Record<string, unknown> | null;

  // ==========================================================
  // METHOD-SPECIFIC DETAILS
  // ==========================================================

  cash_details?: CashPaymentDetails | null;

  bank_transfer_details?: BankTransferDetails | null;

  online_details?: OnlinePaymentDetails | null;

  // ==========================================================
  // RECEIPT
  // ==========================================================

  receipt?: PaymentReceipt | null;

  // ==========================================================
  // TIMESTAMPS
  // ==========================================================

  created_at: string;

  updated_at: string;
}

// ============================================================
// PAYMENT DETAIL
// ============================================================

export interface PaymentDetail extends Payment {
  invoice: PaymentInvoice | null;

  citizen: PaymentCitizen | null;

  service: PaymentService | null;

  cash_details: CashPaymentDetails | null;

  bank_transfer_details: BankTransferDetails | null;

  online_details: OnlinePaymentDetails | null;

  receipt: PaymentReceipt | null;

  files?: PaymentFile[];
}

// ============================================================
// PAYMENT FILE
// ============================================================

export interface PaymentFile {
  id: string;

  file_name: string;

  original_name: string | null;

  mime_type: string | null;

  size: number | null;

  url?: string | null;
}

// ============================================================
// PAYMENT FILTERS
// ============================================================

export interface PaymentFilters {
  // ==========================================================
  // SEARCH
  // ==========================================================

  search?: string;

  // ==========================================================
  // PAYMENT REFERENCES
  // ==========================================================

  transaction_reference?: string;

  // ==========================================================
  // RELATED RECORDS
  // ==========================================================

  invoice_id?: string;

  citizen_id?: string;

  processed_by?: string;

  verified_by?: string;

  // ==========================================================
  // PAYMENT CLASSIFICATION
  // ==========================================================

  payment_method?: PaymentMethod;

  payment_source?: PaymentSource;

  status?: PaymentStatus;

  // ==========================================================
  // MONEY
  // ==========================================================

  currency?: string;

  amount_from?: number;

  amount_to?: number;

  // ==========================================================
  // DATE FILTERS
  // ==========================================================

  created_from?: string;

  created_to?: string;

  verified_from?: string;

  verified_to?: string;

  // ==========================================================
  // PAGINATION
  // ==========================================================

  page?: number;

  per_page?: number;

  // ==========================================================
  // SORTING
  // ==========================================================

  sort_by?: string;

  sort_direction?: "asc" | "desc";
}