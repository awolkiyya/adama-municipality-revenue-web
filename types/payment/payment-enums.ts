/* ============================================================
   PAYMENT METHOD
============================================================ */

/**
 * How the payment is made.
 *
 * CASH
 *   Physical cash paid to the municipality.
 *
 * BANK_TRANSFER
 *   Bank transfer submitted for municipal verification.
 *
 * ONLINE
 *   Payment processed through an online payment provider.
 */
export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "ONLINE";


/* ============================================================
   PAYMENT SOURCE
============================================================ */

/**
 * Where/how the payment entered the municipal system.
 *
 * OFFICE_RECORDED
 *   Payment was recorded directly by a municipal officer.
 *
 * BANK_TRANSFER
 *   Payment originated from a bank transfer.
 *
 * ONLINE
 *   Payment originated from an online payment provider.
 */
export type PaymentSource =
  | "OFFICE_RECORDED"
  | "BANK_TRANSFER"
  | "ONLINE";


/* ============================================================
   PAYMENT STATUS
============================================================ */

/**
 * Municipal payment lifecycle.
 *
 * PENDING
 *   Payment has been created and is waiting for completion,
 *   verification, or the next processing step.
 *
 * PROCESSING
 *   Payment is actively being processed.
 *   Commonly used for online payments.
 *
 * COMPLETED
 *   Payment has been successfully completed and is officially
 *   recognized by the municipality.
 *
 * FAILED
 *   Payment processing failed.
 *
 * CANCELLED
 *   Payment was explicitly cancelled.
 *
 * EXPIRED
 *   Payment attempt expired before completion.
 *
 * REVERSED
 *   A previously completed payment was reversed.
 */
export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "REVERSED";


/* ============================================================
   PAYMENT VERIFICATION STATUS
============================================================ */

/**
 * Verification state for payment methods that require
 * verification, especially bank transfers.
 *
 * This is separate from PaymentStatus.
 */
export type PaymentVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";


/* ============================================================
   PAYMENT RESULT STATUS
============================================================ */

/**
 * Immediate result of a payment operation.
 *
 * This is an operation/result status and does not replace
 * the actual PaymentStatus stored on the payment.
 */
export type PaymentResultStatus =
  | "SUCCESS"
  | "FAILED"
  | "PENDING";


/* ============================================================
   ONLINE PAYMENT PROVIDER
============================================================ */

/**
 * External providers supported by the online payment flow.
 */
export type OnlinePaymentProviderCode =
  | "CHAPA"
  | "TELEBIRR"
  | "CBE_BIRR";