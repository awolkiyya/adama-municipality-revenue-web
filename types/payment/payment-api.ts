import type { Payment } from "./payment";
import { PaymentMethod, PaymentProvider } from "./payment-enums";


// =====================================================
// INITIALIZE PAYMENT REQUEST
// =====================================================

export interface InitializePaymentRequest {

  invoice_id: string;

  assessment_id?: string | null;

  amount?: number;

  currency?: string;

  customer_first_name?: string;

  customer_last_name?: string;

  customer_email?: string;

  customer_phone?: string;

  transaction_reference?: string;

  payment_method?: PaymentMethod;

  payment_provider?: PaymentProvider;

  return_url?: string;

  callback_url?: string;

  description?: string;

  metadata?: Record<string, unknown>;
}


// =====================================================
// INITIALIZE PAYMENT RESPONSE
// =====================================================

export interface InitializePaymentResponse {

  success: boolean;

  message: string;

  data: {

    success: boolean;

    status:
      | "PROCESSING"
      | "PENDING"
      | "SUCCESS"
      | "FAILED";

    provider: string;

    paymentReference: string;

    amount: number;

    currency: string;

    providerReference?: string | null;

    checkoutUrl?: string | null;

    providerTransactionId?: string | null;

    message: string;

    metadata?: Record<
      string,
      unknown
    >;

  };

  errors?: Record<
    string,
    unknown
  > | null;

  meta?: {

    timestamp?: string;

    request_id?: string;

    version?: string;

  } | null;
}


// =====================================================
// VERIFY PAYMENT REQUEST
// =====================================================

export interface VerifyPaymentRequest {

  payment_id: string;

}


// =====================================================
// PAYMENT VERIFICATION RESULT
// =====================================================

export interface PaymentVerificationResult {

  status:
    | "SUCCESS"
    | "FAILED"
    | "PENDING";

  is_successful: boolean;

  message?: string | null;

  provider?: string | null;

  transaction_reference?: string | null;

  provider_reference?: string | null;

  amount?: number | null;

  currency?: string | null;

}


// =====================================================
// VERIFY PAYMENT RESPONSE
// =====================================================

export interface VerifyPaymentResponse {

  success: boolean;

  message: string;

  data: {

    payment: Payment;

    verification:
      PaymentVerificationResult;

  };

}


// =====================================================
// CHAPA INITIALIZATION RESPONSE
// =====================================================

export type ChapaPaymentResponse =
  InitializePaymentResponse;


// =====================================================
// CHAPA VERIFICATION RESPONSE
// =====================================================

export type ChapaVerificationResponse =
  VerifyPaymentResponse;