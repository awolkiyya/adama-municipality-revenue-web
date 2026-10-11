import type { PaymentProvider } from "../revenue/payment-provider";
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
  name: string | null;
  role?: string | null;
}

export interface PaymentPayer {
  name: string | null;
  email: string | null;
  phone: string | null;
}

// ============================================================
// CITIZEN
// ============================================================

export interface PaymentCitizen {
  id: string;
  citizen_uid?: string | null;
  name: string | null;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  national_id?: string | null;
}

// ============================================================
// REVENUE CODE
// ============================================================

export interface PaymentRevenueCode {
  id: string;
  code: string | null;
  name: string | null;
}

// ============================================================
// SERVICE
// ============================================================

export interface PaymentService {
  id: string;
  name: string;
  description: string | null;
  service_type: string | null;
  collection_mode: string | null;
  revenue_code: PaymentRevenueCode | null;
}

// ============================================================
// ASSESSMENT
// ============================================================

export interface PaymentAssessment {
  id: string;
  assessment_number: string | null;
  status: string | null;
  source_type: string | null;
}

// ============================================================
// ASSESSMENT SERVICE
// ============================================================

export interface PaymentAssessmentService {
  id: string;
  assessment_id: string | null;
  service_id: string | null;
  status: string | null;
  computed_amount: number | null;
  paid_amount: number | null;
  remaining_amount: number | null;
  payment_status: string | null;
  assessment: PaymentAssessment | null;
}

// ============================================================
// PAYMENT SCHEDULE
// ============================================================

export interface PaymentScheduleContext {
  id: string;
  status: string | null;
}

// ============================================================
// INVOICE ITEM
// ============================================================

export interface PaymentInvoiceItem {
  id: string;
  line_number: number;
  description: string | null;
  service_id: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  amount: number | null;
  discount_amount: number | null;
  penalty_amount: number | null;
  interest_amount: number | null;
  total_amount: number | null;
  currency: string | null;

  service: PaymentService | null;

  assessment_service: PaymentAssessmentService | null;

  payment_schedule: PaymentScheduleContext | null;
}

// ============================================================
// INVOICE
// ============================================================

export interface PaymentInvoice {
  id: string;
  invoice_number: string;
  source_type: string | null;
  status: string;
  currency: string | null;

  subtotal: number | null;
  discount_amount: number | null;
  penalty_amount: number | null;
  interest_amount: number | null;
  total_amount: number | null;
  paid_amount: number | null;
  balance_due: number | null;

  issued_at: string | null;
  due_date: string | null;

  items?: PaymentInvoiceItem[] | null;

  citizen: PaymentCitizen | null;
}

// ============================================================
// BANK ACCOUNT
// ============================================================

export interface PaymentBankAccount {
  id: string;
  bank_name: string | null;
  account_name: string | null;
  currency: string | null;
}

// ============================================================
// PAYMENT FILE
// ============================================================

export interface PaymentFile {
  id: string;
  original_name: string | null;
  mime_type: string | null;
  size: number | null;
  category: string | null;
  visibility: string | null;

  /**
   * The backend intentionally does not return storage_path.
   * Open private files through an authorized file endpoint.
   */
  download_url?: string | null;

  created_at: string | null;
  updated_at: string | null;
}

// ============================================================
// CASH PAYMENT DETAILS
// ============================================================

export interface CashPaymentDetails {
  id: string;
  cash_received_at: string | null;
  cashier_session_id: string | null;
  received_by: string | null;
  received_by_user: PaymentUser | null;
  notes: string | null;
}

// ============================================================
// BANK TRANSFER DETAILS
// ============================================================

export interface BankTransferDetails {
  id: string;
  bank_account_id: string | null;
  transfer_reference: string | null;
  transfer_date: string | null;
  sender_name: string | null;
  sender_account: string | null;
  verification_status: string | null;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;

  verified_by_user: PaymentUser | null;

  bank_account: PaymentBankAccount | null;

  files: PaymentFile[] | null;
}

// ============================================================
// ONLINE PAYMENT PROVIDER
// ============================================================

export interface OnlinePaymentProvider {
  id: string;
  code: string | null;
  name: string | null;
}

// ============================================================
// ONLINE PAYMENT DETAILS
// ============================================================

export interface OnlinePaymentDetails {
  id: string;
  payment_provider_id: string | null;
  checkout_reference: string | null;
  provider_transaction_id: string | null;
  checkout_url: string | null;
  provider_status: string | null;
  callback_received_at: string | null;
  paid_at: string | null;

  payment_provider: OnlinePaymentProvider | null;
}

// ============================================================
// RECEIPT
// ============================================================

export interface PaymentReceipt {
  id: string;
  receipt_number: string;
  issued_at: string | null;
  issued_by: string | null;
  issued_by_user: PaymentUser | null;
}

// ============================================================
// PAYMENT
// ============================================================

export interface Payment {
  // Identity
  id: string;
  payment_number: string;
  transaction_reference: string | null;
  provider_reference: string | null;

  // References
  invoice_id: string | null;
  citizen_id: string | null;

  // Classification
  payment_method: PaymentMethod;
  payment_provider: PaymentProvider | null;
  payment_source: PaymentSource;
  status: PaymentStatus;

  // Financial information
  amount: number;
  currency: string;

  // Payer snapshot
  payer: PaymentPayer;

  // Processing and verification
  processed_by: string | null;
  processed_by_user?: PaymentUser | null;

  verified_by: string | null;
  verified_by_user?: PaymentUser | null;
  verified_at: string | null;

  // Failure
  failure_reason: string | null;

  // Metadata
  metadata: Record<string, unknown> | null;

  // Related records
  invoice?: PaymentInvoice | null;
  citizen?: PaymentCitizen | null;

  cash_details?: CashPaymentDetails | null;
  bank_transfer_details?: BankTransferDetails | null;
  online_details?: OnlinePaymentDetails | null;

  receipt?: PaymentReceipt | null;

  /**
   * Files directly attached to the payment.
   * Bank transfer evidence is under bank_transfer_details.files.
   */
  files?: PaymentFile[] | null;

  // Timestamps
  created_at: string | null;
  updated_at: string | null;
}

// ============================================================
// PAYMENT DETAIL
// ============================================================

export interface PaymentDetail extends Payment {
  invoice: PaymentInvoice | null;
  citizen: PaymentCitizen | null;

  cash_details: CashPaymentDetails | null;
  bank_transfer_details: BankTransferDetails | null;
  online_details: OnlinePaymentDetails | null;

  receipt: PaymentReceipt | null;
  files: PaymentFile[] | null;
}

// ============================================================
// PAYMENT FILTERS
// ============================================================

export interface PaymentFilters {
  // Search
  search?: string;

  // Payment references
  transaction_reference?: string;
  payment_number?: string;

  // Related records
  invoice_id?: string;
  citizen_id?: string;
  processed_by?: string;
  verified_by?: string;

  // Classification
  payment_method?: PaymentMethod;
  payment_source?: PaymentSource;
  status?: PaymentStatus;

  // Money
  currency?: string;
  amount_from?: number;
  amount_to?: number;

  // Date filters
  created_from?: string;
  created_to?: string;
  verified_from?: string;
  verified_to?: string;

  // Pagination
  page?: number;
  per_page?: number;

  // Sorting
  sort_by?: string;
  sort_direction?: "asc" | "desc";
}