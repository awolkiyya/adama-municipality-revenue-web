export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";

export type PaymentMethod =
  | "CHAPA"
  | string;

export type PaymentProvider =
  | "CHAPA"
  | string;

export interface Payment {
  id: string;

  payment_number: string;

  invoice_id: string;

  invoice_number: string | null;

  payment_method: PaymentMethod;

  payment_provider: PaymentProvider;

  status: PaymentStatus;

  transaction_reference: string;

  provider_reference: string | null;

  amount: string;

  currency: string;

  payment_date: string | null;

  verified_at: string | null;

  failure_reason?: string | null;
}

export interface PaymentFilters {
  page?: number;
  per_page?: number;
  status?: PaymentStatus | string;
  invoice_id?: string;
}

export interface InitializePaymentRequest {
  invoice_id: string;

  /**
   * Amount being paid in this transaction.
   * Can be less than the invoice balance for partial payment.
   */
  amount: number;

  payment_method: "CHAPA";

  payment_provider: "CHAPA";

  customer_first_name?: string | null;
  customer_last_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;

  return_url?: string | null;
  callback_url?: string | null;

  description?: string | null;

  metadata?: Record<string, unknown>;
}

export interface InitializePaymentResponse {
  success: boolean;

  message: string;

  data?: {
    paymentId?: string;
    paymentNumber?: string;
    paymentReference?: string;
    providerReference?: string;
    checkoutUrl?: string;
    status?: PaymentStatus | string;
    amount?: number;
    currency?: string;
  };
}