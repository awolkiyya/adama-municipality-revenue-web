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
  role?: string | null;
}

export interface PaymentPayer {
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface PaymentInvoice {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number | null;
  paid_amount: number | null;
  balance_due: number | null;
}

export interface PaymentCitizen {
  id: string;
  name: string | null;
}

export interface PaymentService {
  id: string;
  name: string;
  code: string | null;
}

// ============================================================
// BANK ACCOUNT
// ============================================================

export interface PaymentBankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  currency: string;
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
   * Internal storage path.
   *
   * Prefer not to expose this from the backend for private files.
   * Kept optional because production API should preferably return
   * a controlled download/view URL instead.
   */
  storage_path?: string | null;

  /**
   * Controlled API URL for viewing/downloading the file.
   *
   * This should be supplied by the backend once the private-file
   * download endpoint is implemented.
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

  cash_receipt_number: string | null;

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

  bank_account_id: string;

  transfer_reference: string;

  transfer_date: string;

  sender_name: string | null;

  sender_account: string | null;

  verification_status: string | null;

  /**
   * Backend currently returns the verifier ID here.
   */
  verified_by: string | null;

  verified_at: string | null;

  notes: string | null;

  bank_account: PaymentBankAccount | null;

  /**
   * Evidence uploaded for this bank transfer.
   */
  files: PaymentFile[];
}

// ============================================================
// ONLINE PAYMENT DETAILS
// ============================================================

export interface OnlinePaymentDetails {
  id: string;

  payment_provider_id: string;

  checkout_reference: string | null;

  provider_transaction_id: string | null;

  checkout_url: string | null;

  provider_status: string | null;

  callback_received_at: string | null;

  provider_response: Record<string, unknown> | null;

  paid_at: string | null;

  payment_provider: {
    id: string;
    code: string;
    name: string;
  } | null;
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
  // PAYER
  // ==========================================================

  payer: PaymentPayer;

  // ==========================================================
  // PROCESSING / VERIFICATION
  // ==========================================================

  processed_by: string | null;

  processed_by_user?: PaymentUser | null;

  verified_by: string | null;

  verified_by_user?: PaymentUser | null;

  verified_at: string | null;

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

  /**
   * Files directly attached to Payment.
   *
   * Bank-transfer evidence is NOT stored here.
   * It is available through:
   *
   * payment.bank_transfer_details.files
   */
  files?: PaymentFile[];
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

  payment_number?: string;

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
