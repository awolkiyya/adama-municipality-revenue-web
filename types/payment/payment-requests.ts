import type { Payment } from "./payment";

import type {
  PaymentProvider,
  PaymentVerificationStatus,
  PaymentResultStatus,
} from "./payment-enums";


// ============================================================
// INITIALIZE ONLINE PAYMENT REQUEST
// ============================================================

/**
 * Starts an online payment through an external provider.
 *
 * Payment method is automatically ONLINE because this request
 * belongs to the online-payment endpoint.
 *
 * The backend controls:
 *
 * - payment method
 * - payment status
 * - transaction reference
 * - payment ID
 * - provider reference
 * - checkout URL
 */
export interface InitializeOnlinePaymentRequest {

  // ----------------------------------------------------------
  // Invoice
  // ----------------------------------------------------------

  invoice_id: string;


  // ----------------------------------------------------------
  // Payment amount
  // ----------------------------------------------------------

  /**
   * Optional if the backend determines the outstanding amount.
   */
  amount?: number;


  // ----------------------------------------------------------
  // Customer / payer information
  // ----------------------------------------------------------

  customer_first_name?: string;

  customer_last_name?: string;

  customer_email?: string;

  customer_phone?: string;


  // ----------------------------------------------------------
  // Online payment provider
  // ----------------------------------------------------------

  /**
   * External online payment provider.
   *
   * Examples:
   *
   * CHAPA
   * TELEBIRR
   * CBE_BIRR
   */
  payment_provider: Extract<
    PaymentProvider,
    "CHAPA" | "TELEBIRR" | "CBE_BIRR"
  >;


  // ----------------------------------------------------------
  // Description
  // ----------------------------------------------------------

  description?: string;


  // ----------------------------------------------------------
  // Additional metadata
  // ----------------------------------------------------------

  metadata?: Record<string, unknown>;
}


// ============================================================
// INITIALIZE ONLINE PAYMENT RESPONSE
// ============================================================

export interface InitializeOnlinePaymentResponse {

  success: boolean;

  message: string;

  data: {

    success: boolean;


    // --------------------------------------------------------
    // Operation result
    // --------------------------------------------------------

    status: PaymentResultStatus;


    // --------------------------------------------------------
    // Provider
    // --------------------------------------------------------

    provider: Extract<
      PaymentProvider,
      "CHAPA" | "TELEBIRR" | "CBE_BIRR"
    >;


    // --------------------------------------------------------
    // Internal payment reference
    // --------------------------------------------------------

    paymentReference: string;


    // --------------------------------------------------------
    // Money
    // --------------------------------------------------------

    amount: number;

    currency: string;


    // --------------------------------------------------------
    // External provider references
    // --------------------------------------------------------

    providerReference?: string | null;

    providerTransactionId?: string | null;


    // --------------------------------------------------------
    // Checkout
    // --------------------------------------------------------

    checkoutUrl?: string | null;


    // --------------------------------------------------------
    // Provider / operation message
    // --------------------------------------------------------

    message: string;


    // --------------------------------------------------------
    // Additional metadata
    // --------------------------------------------------------

    metadata?: Record<
      string,
      unknown
    >;
  };


  // ----------------------------------------------------------
  // Validation / operation errors
  // ----------------------------------------------------------

  errors?: Record<
    string,
    unknown
  > | null;


  // ----------------------------------------------------------
  // API metadata
  // ----------------------------------------------------------

  meta?: {

    timestamp?: string;

    request_id?: string;

    version?: string;

  } | null;
}


// ============================================================
// VERIFY ONLINE PAYMENT REQUEST
// ============================================================

/**
 * The payment ID belongs in the URL:
 *
 * GET /online-payments/{payment}/status
 *
 * Therefore no payment_id needs to be sent in the body.
 */
export interface VerifyOnlinePaymentRequest {
}


// ============================================================
// PAYMENT VERIFICATION RESULT
// ============================================================

export interface PaymentVerificationResult {

  // ----------------------------------------------------------
  // External provider result
  // ----------------------------------------------------------

  status: PaymentVerificationStatus;


  // ----------------------------------------------------------
  // Verification result
  // ----------------------------------------------------------

  is_successful: boolean;


  // ----------------------------------------------------------
  // Provider message
  // ----------------------------------------------------------

  message?: string | null;


  // ----------------------------------------------------------
  // Provider
  // ----------------------------------------------------------

  provider?: PaymentProvider | null;


  // ----------------------------------------------------------
  // References
  // ----------------------------------------------------------

  transaction_reference?: string | null;

  provider_reference?: string | null;


  // ----------------------------------------------------------
  // Money
  // ----------------------------------------------------------

  amount?: number | null;

  currency?: string | null;
}


// ============================================================
// VERIFY ONLINE PAYMENT RESPONSE
// ============================================================

export interface VerifyOnlinePaymentResponse {

  success: boolean;

  message: string;

  data: {

    // --------------------------------------------------------
    // Current municipal payment
    // --------------------------------------------------------

    payment: Payment;


    // --------------------------------------------------------
    // External provider verification result
    // --------------------------------------------------------

    verification: PaymentVerificationResult;
  };


  // ----------------------------------------------------------
  // API metadata
  // ----------------------------------------------------------

  meta?: {

    timestamp?: string;

    request_id?: string;

    version?: string;

  } | null;
}


// ============================================================
// CASH PAYMENT REQUEST
// ============================================================

/**
 * Records a physical cash payment.
 *
 * POST /cash-payments
 *
 * The backend determines:
 *
 * - payment method = CASH
 * - payment provider = CASH
 * - transaction reference
 * - payment status
 * - authenticated collector
 */
export interface CreateCashPaymentRequest {

  // ----------------------------------------------------------
  // Invoice
  // ----------------------------------------------------------

  invoice_id: string;


  // ----------------------------------------------------------
  // Payment amount
  // ----------------------------------------------------------

  amount: number;


  // ----------------------------------------------------------
  // Description
  // ----------------------------------------------------------

  description?: string;


  // ----------------------------------------------------------
  // Additional metadata
  // ----------------------------------------------------------

  metadata?: Record<string, unknown>;
}


// ============================================================
// CASH PAYMENT POST REQUEST
// ============================================================

/**
 * Posts a previously recorded cash payment.
 *
 * POST /cash-payments/{payment}/post
 *
 * Payment ID is supplied through the URL.
 *
 * No request body is required.
 */
export interface PostCashPaymentRequest {
}


// ============================================================
// BANK TRANSFER PAYMENT REQUEST
// ============================================================

/**
 * Submits a manual bank transfer for verification.
 *
 * POST /bank-transfers
 *
 * Initial backend status:
 *
 * PENDING_VERIFICATION
 */
export interface CreateBankTransferPaymentRequest {

  // ----------------------------------------------------------
  // Invoice
  // ----------------------------------------------------------

  invoice_id: string;


  // ----------------------------------------------------------
  // Payment amount
  // ----------------------------------------------------------

  amount: number;


  // ----------------------------------------------------------
  // Bank information
  // ----------------------------------------------------------

  bank_name: string;

  bank_account_name?: string;

  bank_account_number?: string;


  // ----------------------------------------------------------
  // Transfer information
  // ----------------------------------------------------------

  transfer_reference: string;

  transfer_date: string;


  // ----------------------------------------------------------
  // Payer information
  // ----------------------------------------------------------

  payer_name?: string;

  payer_phone?: string;


  // ----------------------------------------------------------
  // Description
  // ----------------------------------------------------------

  description?: string;


  // ----------------------------------------------------------
  // Supporting evidence
  // ----------------------------------------------------------

  /**
   * Bank transfer evidence.
   *
   * The frontend may send this as multipart/form-data.
   */
  evidence?: File;


  // ----------------------------------------------------------
  // Additional metadata
  // ----------------------------------------------------------

  metadata?: Record<string, unknown>;
}


// ============================================================
// VERIFY BANK TRANSFER REQUEST
// ============================================================

/**
 * Verifies a pending bank transfer.
 *
 * POST /bank-transfers/{payment}/verify
 *
 * The payment ID belongs in the URL.
 */
export interface VerifyBankTransferRequest {

  verification_notes?: string;
}


// ============================================================
// REJECT BANK TRANSFER REQUEST
// ============================================================

/**
 * Rejects a bank transfer that cannot be verified.
 *
 * POST /bank-transfers/{payment}/reject
 */
export interface RejectBankTransferRequest {

  reason: string;
}


// ============================================================
// PROVIDER-SPECIFIC RESPONSE ALIASES
// ============================================================

/**
 * Chapa initialization response.
 */
export type ChapaPaymentResponse =
  InitializeOnlinePaymentResponse;


/**
 * Chapa verification response.
 */
export type ChapaVerificationResponse =
  VerifyOnlinePaymentResponse;