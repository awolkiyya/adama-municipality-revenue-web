/* ============================================================
   PAYMENT METHOD
============================================================ */

export type PaymentMethod =
  | "CHAPA"
  | "CASH"
  | "BANK_TRANSFER";


/* ============================================================
   PAYMENT PROVIDER
============================================================ */

export type PaymentProvider =
  | "CHAPA"
  | "TELEBIRR"
  | "CBE_BIRR"
  | "BANK"
  | "CASH";


/* ============================================================
   PAYMENT STATUS
============================================================ */

export type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";


/* ============================================================
   PAYMENT RESULT STATUS
============================================================ */

export type PaymentResultStatus =
  | "SUCCESS"
  | "FAILED"
  | "PENDING";