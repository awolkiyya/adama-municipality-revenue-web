import type {
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
} from "./payment-enums";


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

  assessment_id: string | null;


  // ==========================================================
  // PAYMENT CLASSIFICATION
  // ==========================================================

  payment_method: PaymentMethod;

  payment_provider: PaymentProvider;

  status: PaymentStatus;


  // ==========================================================
  // PAYMENT REFERENCES
  // ==========================================================

  transaction_reference: string;

  provider_reference: string | null;

  receipt_number: string | null;


  // ==========================================================
  // MONEY
  // ==========================================================

  amount: number;

  currency: string;


  // ==========================================================
  // PAYER
  // ==========================================================

  payer_name: string | null;

  payer_email: string | null;

  payer_phone: string | null;


  // ==========================================================
  // ONLINE PAYMENT
  // ==========================================================

  checkout_url: string | null;


  // ==========================================================
  // FAILURE
  // ==========================================================

  failure_reason: string | null;


  // ==========================================================
  // PAYMENT DATES
  // ==========================================================

  payment_date: string | null;

  verified_at: string | null;


  // ==========================================================
  // PROVIDER / AUDIT DATA
  // ==========================================================

  metadata: Record<
    string,
    unknown
  > | null;

  provider_response: Record<
    string,
    unknown
  > | null;


  // ==========================================================
  // TIMESTAMPS
  // ==========================================================

  created_at: string;

  updated_at: string;
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

  provider_reference?: string;


  // ==========================================================
  // RELATED RECORDS
  // ==========================================================

  invoice_id?: string;

  assessment_id?: string;

  user_id?: string;


  // ==========================================================
  // PAYMENT CLASSIFICATION
  // ==========================================================

  payment_method?: PaymentMethod;

  payment_provider?: PaymentProvider;

  status?: PaymentStatus;


  // ==========================================================
  // MONEY
  // ==========================================================

  currency?: string;

  amount_from?: number;

  amount_to?: number;


  // ==========================================================
  // PAYMENT DATE FILTERS
  // ==========================================================

  payment_date_from?: string;

  payment_date_to?: string;


  // ==========================================================
  // VERIFICATION DATE FILTERS
  // ==========================================================

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


export interface PaymentDetail extends Payment {
  payment_number: string;
  receipt_number: string | null;

  invoice: {
    id: string;
    invoice_number: string;
    status: string;
  } | null;

  assessment: {
    id: string;
    assessment_number: string;
  } | null;

  service: {
    id: string;
    name: string;
    code: string | null;
  } | null;

  citizen: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  } | null;

  received_by: {
    id: string;
    name: string;
    role: string | null;
  } | null;

  verified_by: {
    id: string;
    name: string;
    role: string | null;
  } | null;

  posted_by: {
    id: string;
    name: string;
    role: string | null;
  } | null;

  posted_at: string | null;
}