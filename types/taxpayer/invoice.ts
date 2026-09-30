/**
 * src/types/taxpayer/invoice.ts
 *
 * Taxpayer Invoice Types
 *
 * These types correspond directly to:
 *
 * App\Modules\Taxpayer\Resources\TaxpayerInvoiceResource
 * App\Modules\Taxpayer\Resources\TaxpayerInvoiceItemResource
 *
 * Important:
 *
 * Monetary values are strings because Laravel's decimal()
 * helper returns formatted strings.
 */

/* ========================================================================
 * INVOICE STATUS
 * ====================================================================== */

export type TaxpayerInvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

/* ========================================================================
 * INVOICE SOURCE TYPE
 * ====================================================================== */

/**
 * This should match the values used by the Laravel invoice model.
 *
 * Current known source types:
 *
 * - ASSESSMENT
 * - EXISTING_LIZZ
 *
 * Keep this type explicit rather than using string.
 */
export type TaxpayerInvoiceSourceType =
  | "ASSESSMENT"
  | "EXISTING_LIZZ";

/* ========================================================================
 * INVOICE ITEM
 * ====================================================================== */

export interface TaxpayerInvoiceItem {
  id: string;

  line_number: number;

  service_id: string | null;

  service_name: string | null;

  description: string | null;

  quantity: string | null;

  unit: string | null;

  unit_price: string | null;

  amount: string;

  discount_amount: string;

  penalty_amount: string;

  interest_amount: string;

  total_amount: string;

  currency: string;
}

/* ========================================================================
 * INVOICE
 * ====================================================================== */

export interface TaxpayerInvoice {
  id: string;

  invoice_number: string;

  source_type: TaxpayerInvoiceSourceType;

  status: TaxpayerInvoiceStatus;

  currency: string;

  subtotal: string;

  discount_amount: string;

  penalty_amount: string;

  interest_amount: string;

  total_amount: string;

  paid_amount: string;

  balance_due: string;

  issued_at: string | null;

  due_date: string | null;

  paid_at: string | null;

  is_overdue: boolean;

  is_fully_paid: boolean;

  items: TaxpayerInvoiceItem[];
}