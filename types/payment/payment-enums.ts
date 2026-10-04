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
 *   Manual bank transfer submitted for verification.
 *
 * ONLINE
 *   Payment processed through an online payment provider.
 */
export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "ONLINE";


/* ============================================================
   PAYMENT PROVIDER
============================================================ */

/**
 * Who/processes the payment.
 *
 * CASH
 *   Physical municipal cash collection.
 *
 * BANK
 *   Manual bank transfer through a bank.
 *
 * CHAPA / TELEBIRR / CBE_BIRR
 *   External online payment providers.
 */
export type PaymentProvider =
  | "CASH"
  | "BANK"
  | "CHAPA"
  | "TELEBIRR"
  | "CBE_BIRR";


/* ============================================================
   PAYMENT STATUS
============================================================ */

/**
 * Municipal payment lifecycle.
 *
 * IMPORTANT:
 *
 * Only POSTED represents an officially recognized
 * municipal financial payment.
 */
export type PaymentStatus =
  // ----------------------------------------------------------
  // Initial states
  // ----------------------------------------------------------

  /**
   * Payment record has been created but processing
   * has not started/completed.
   */
  | "INITIATED"

  /**
   * Payment is currently being processed.
   *
   * Common for online payments.
   */
  | "PENDING"


  // ----------------------------------------------------------
  // Cash workflow
  // ----------------------------------------------------------

  /**
   * Cash payment has been recorded by the collector
   * but has not yet been finally posted.
   */
  | "RECORDED"


  // ----------------------------------------------------------
  // Bank-transfer workflow
  // ----------------------------------------------------------

  /**
   * Bank transfer has been submitted and is waiting
   * for municipal verification.
   */
  | "AWAITING_VERIFICATION"

  /**
   * Bank transfer has passed verification but may still
   * be awaiting the final posting operation.
   */
  | "VERIFIED"


  // ----------------------------------------------------------
  // Final financial state
  // ----------------------------------------------------------

  /**
   * Payment is officially recognized by the municipality.
   *
   * POSTED payments affect invoice balances.
   */
  | "POSTED"


  // ----------------------------------------------------------
  // Failure / rejection states
  // ----------------------------------------------------------

  /**
   * Payment processing failed.
   */
  | "FAILED"

  /**
   * Payment was explicitly rejected.
   *
   * Particularly relevant to bank-transfer verification.
   */
  | "REJECTED"

  /**
   * Payment was cancelled.
   */
  | "CANCELLED"

  /**
   * Payment attempt expired before completion.
   */
  | "EXPIRED";


/* ============================================================
   PAYMENT VERIFICATION STATUS
============================================================ */

/**
 * Result returned when an external payment provider
 * is checked.
 *
 * This is NOT the municipal payment lifecycle.
 *
 * Example:
 *
 * Chapa → SUCCESS
 *       ↓
 * Municipal payment → VERIFIED
 *       ↓
 * Municipal payment → POSTED
 */
export type PaymentVerificationStatus =
  | "SUCCESS"
  | "FAILED"
  | "PENDING";


/* ============================================================
   PAYMENT RESULT STATUS
============================================================ */

/**
 * Generic result of a payment operation.
 *
 * This is useful for API/service responses where we need
 * to describe the immediate result of an operation without
 * replacing the actual PaymentStatus.
 */
export type PaymentResultStatus =
  | "SUCCESS"
  | "FAILED"
  | "PENDING";