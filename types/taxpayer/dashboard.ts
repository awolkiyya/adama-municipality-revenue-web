/**
 * src/types/taxpayer/dashboard.ts
 *
 * Taxpayer Dashboard Types
 *
 * These types correspond to:
 *
 * App\Modules\Taxpayer\Resources\TaxpayerDashboardResource
 *
 * Nested resources:
 *
 * App\Modules\Taxpayer\Resources\TaxpayerInvoiceResource
 * App\Modules\Taxpayer\Resources\TaxpayerPaymentResource
 */

/* ================================================================
   INVOICE STATUS
================================================================ */

export type TaxpayerDashboardInvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

/* ================================================================
   INVOICE SOURCE TYPE
================================================================ */

/**
 * How the invoice was generated.
 *
 * Values currently observed from the backend:
 *
 * - ASSESSMENT
 * - DIRECT_COLLECTION
 *
 * Keep this extensible enough for future invoice sources.
 */
export type TaxpayerDashboardInvoiceSourceType =
  | "ASSESSMENT"
  | "DIRECT_COLLECTION"
  | string;

/* ================================================================
   PAYMENT STATUS
================================================================ */

export type TaxpayerDashboardPaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | string;

/* ================================================================
   PAYMENT METHOD
================================================================ */

export type TaxpayerDashboardPaymentMethod =
  | "CASH"
  | "BANK"
  | "ONLINE"
  | string;

/* ================================================================
   DASHBOARD SUMMARY
================================================================ */

/**
 * Financial summary displayed on the taxpayer dashboard.
 */
export interface TaxpayerDashboardSummary {
  /**
   * Total number of invoices belonging to the taxpayer.
   */
  total_invoices: number;

  /**
   * Number of invoices that still have an outstanding balance.
   */
  outstanding_invoices: number;

  /**
   * Number of fully paid invoices.
   */
  paid_invoices: number;

  /**
   * Total remaining amount owed.
   *
   * Laravel returns this as a formatted string.
   *
   * Example:
   * "185378.17"
   */
  total_outstanding: string;

  /**
   * Total amount paid.
   *
   * Laravel returns this as a formatted string.
   *
   * Example:
   * "0.00"
   */
  total_paid: string;

  /**
   * Currency code.
   *
   * Example:
   * "ETB"
   */
  currency: string;
}

/* ================================================================
   INVOICE ITEM
================================================================ */

/**
 * Individual line item belonging to an invoice.
 *
 * Example:
 *
 * {
 *   "line_number": 1,
 *   "service_name": "...",
 *   "description": "...",
 *   "amount": "576.92"
 * }
 */
export interface TaxpayerDashboardInvoiceItem {
  /**
   * Invoice item UUID.
   */
  id: string;

  /**
   * Sequential line number within the invoice.
   */
  line_number: number;

  /**
   * Municipal service UUID.
   */
  service_id: string | null;

  /**
   * Municipal service name.
   */
  service_name: string;

  /**
   * Description displayed for this invoice line.
   */
  description: string | null;

  /**
   * Quantity of the service.
   *
   * Backend returns this as a string when present.
   */
  quantity: string | null;

  /**
   * Unit of measurement.
   *
   * Example:
   *
   * "installment"
   */
  unit: string | null;

  /**
   * Unit price.
   *
   * Can be null depending on how the invoice was generated.
   */
  unit_price: string | null;

  /**
   * Base amount for this line.
   */
  amount: string;

  /**
   * Discount applied to this line.
   */
  discount_amount: string;

  /**
   * Penalty applied to this line.
   */
  penalty_amount: string;

  /**
   * Interest applied to this line.
   */
  interest_amount: string;

  /**
   * Final total for this line.
   */
  total_amount: string;

  /**
   * Currency of the invoice item.
   */
  currency: string;
}

/* ================================================================
   DASHBOARD INVOICE
================================================================ */

/**
 * Invoice representation returned by the taxpayer dashboard.
 *
 * This now reflects the actual TaxpayerInvoiceResource response.
 */
export interface TaxpayerDashboardInvoice {
  /**
   * Invoice UUID.
   */
  id: string;

  /**
   * Human-readable invoice number.
   *
   * Example:
   *
   * "INV-2026-000012"
   */
  invoice_number: string;

  /**
   * How the invoice was generated.
   *
   * Examples:
   *
   * "ASSESSMENT"
   * "DIRECT_COLLECTION"
   */
  source_type: TaxpayerDashboardInvoiceSourceType;

  /**
   * Current invoice status.
   */
  status: TaxpayerDashboardInvoiceStatus;

  /**
   * Invoice currency.
   */
  currency: string;

  /**
   * Invoice subtotal before discounts, penalties and interest.
   */
  subtotal: string;

  /**
   * Total discount applied to the invoice.
   */
  discount_amount: string;

  /**
   * Total penalty applied to the invoice.
   */
  penalty_amount: string;

  /**
   * Total interest applied to the invoice.
   */
  interest_amount: string;

  /**
   * Final invoice amount.
   */
  total_amount: string;

  /**
   * Amount already paid against this invoice.
   */
  paid_amount: string;

  /**
   * Amount still owed.
   *
   * This is the value that should be used when
   * displaying the outstanding amount.
   */
  balance_due: string;

  /**
   * Invoice issue timestamp.
   *
   * Example:
   *
   * "2026-09-28T23:12:01.000000Z"
   */
  issued_at: string | null;

  /**
   * Invoice due date.
   *
   * Example:
   *
   * "2026-09-11"
   */
  due_date: string | null;

  /**
   * Timestamp when the invoice was fully paid.
   */
  paid_at: string | null;

  /**
   * Backend-calculated overdue flag.
   *
   * This should be preferred over calculating
   * overdue state in the frontend.
   */
  is_overdue: boolean;

  /**
   * Backend-calculated fully-paid flag.
   */
  is_fully_paid: boolean;

  /**
   * Invoice line items.
   */
  items: TaxpayerDashboardInvoiceItem[];
}

/* ================================================================
   DASHBOARD PAYMENT
================================================================ */

/**
 * Payment transaction returned by the taxpayer dashboard.
 *
 * IMPORTANT:
 *
 * A payment is an actual financial transaction.
 *
 * It is NOT a payment schedule/installment.
 *
 * The exact nested payment resource should be verified
 * against TaxpayerPaymentResource when provided.
 */
export interface TaxpayerDashboardPayment {
  /**
   * Payment UUID.
   */
  id: string;

  /**
   * Human-readable payment number.
   */
  payment_number: string;

  /**
   * Related invoice UUID.
   */
  invoice_id: string | null;

  /**
   * Related invoice number.
   */
  invoice_number: string | null;

  /**
   * Actual payment amount.
   */
  amount: string;

  /**
   * Payment transaction status.
   */
  status: TaxpayerDashboardPaymentStatus;

  /**
   * Payment method.
   */
  payment_method: TaxpayerDashboardPaymentMethod | null;

  /**
   * Payment completion timestamp.
   */
  paid_at: string | null;
}

/* ================================================================
   COMPLETE DASHBOARD
================================================================ */

/**
 * Complete taxpayer dashboard payload.
 *
 * This represents the contents of:
 *
 * data
 *
 * from:
 *
 * {
 *   success: true,
 *   message: "...",
 *   data: {...}
 * }
 */
export interface TaxpayerDashboard {
  /**
   * Financial summary.
   */
  summary: TaxpayerDashboardSummary;

  /**
   * Recently created/updated invoices.
   */
  recent_invoices: TaxpayerDashboardInvoice[];

  /**
   * Recently recorded payment transactions.
   */
  recent_payments: TaxpayerDashboardPayment[];

  /**
   * Outstanding invoices whose due date has passed.
   *
   * Currently empty in the supplied backend response.
   */
  overdue_invoices: TaxpayerDashboardInvoice[];

  /**
   * Outstanding invoices approaching their due date.
   *
   * Currently empty in the supplied backend response.
   */
  due_soon_invoices: TaxpayerDashboardInvoice[];
}