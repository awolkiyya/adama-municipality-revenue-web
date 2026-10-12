import type { PaymentDetail as PaymentDetailApi } from "@/types/payment";

/* Mirrors the Laravel PaymentResource. */

export type UserView = { id: string; name: string; role?: string | null };

export type FileView = {
  id: string;
  original_name: string | null;
  mime_type: string | null;
  size: number | null;
  created_at: string | null;
};

export type CitizenView = {
  id: string;
  citizen_uid?: string | null;
  name: string | null;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  national_id?: string | null;
};

export type InvoiceItemView = {
  id: string;
  line_number: number;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  amount: number | null;
  discount_amount: number | null;
  penalty_amount: number | null;
  interest_amount: number | null;
  total_amount: number | null;
  currency: string | null;
  service: {
    name: string;
    revenue_code: { code: string | null } | null;
  } | null;
  assessment_service: {
    assessment: { assessment_number: string | null } | null;
  } | null;
};

export type InvoiceView = {
  id: string;
  invoice_number: string;
  status?: string | null;
  currency?: string | null;
  subtotal?: number | null;
  discount_amount?: number | null;
  penalty_amount?: number | null;
  interest_amount?: number | null;
  total_amount?: number | null;
  paid_amount?: number | null;
  balance_due?: number | null;
  due_date?: string | null;
  items?: InvoiceItemView[] | null;
  citizen?: CitizenView | null;
};

export type CashView = {
  cash_received_at: string | null;
  cashier_session_id: string | null;
  received_by: string | null;
  received_by_user: UserView | null;
  notes: string | null;
};

export type BankView = {
  transfer_reference: string | null;
  transfer_date: string | null;
  sender_name: string | null;
  sender_account: string | null;
  verification_status: string | null;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  verified_by_user: UserView | null;
  bank_account: { bank_name: string | null; account_name: string | null } | null;
  files: FileView[] | null;
};

export type OnlineView = {
  checkout_reference: string | null;
  provider_transaction_id: string | null;
  checkout_url: string | null;
  provider_status: string | null;
  callback_received_at: string | null;
  paid_at: string | null;
  payment_provider: { name: string | null } | null;
};

export type ReceiptView = {
  id: string;
  receipt_number: string;
  issued_at: string | null;
  issued_by: string | null;
  issued_by_user: UserView | null;
};

export type PaymentView = Omit<
  PaymentDetailApi,
  | "invoice"
  | "citizen"
  | "cash_details"
  | "bank_transfer_details"
  | "online_details"
  | "receipt"
  | "files"
  | "service"
> & {
  provider_reference?: string | null;
  payment_provider: string | null;
  payer: {
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  invoice: InvoiceView | null;
  citizen: CitizenView | null;
  cash_details: CashView | null;
  bank_transfer_details: BankView | null;
  online_details: OnlineView | null;
  receipt: ReceiptView | null;
};

/* -------------------------------------------------------------------------- */
/* Public contract                                                            */
/* -------------------------------------------------------------------------- */

export type PaymentDetailTab =
  | "overview"
  | "invoice"
  | "payment"
  | "activity";

export type PaymentDetailVariant = "page" | "embedded";

/** Where links inside the view should go. Omit a route to hide that link. */
export type PaymentDetailRoutes = {
  invoice?: (invoiceId: string) => string;
  receipt?: (paymentId: string) => string;
};

/**
 * What the current viewer may see or do.
 *
 * Cash completion is disabled by default.
 * Read-only features are enabled by default.
 */
export type PaymentDetailPermissions = {

  /** Show receipt print button. Default: true */
  printReceipt?: boolean;

  /** Show the invoice tab. Default: true */
  viewInvoice?: boolean;

  /** Show the activity (audit) tab. Default: true */
  viewActivity?: boolean;

  /** Show taxpayer information in OverviewTab. Default: true */
  viewTaxpayer?: boolean;
};

