import type { ApiResponse } from "@/types/api";

/*
|--------------------------------------------------------------------------
| Payment Methods
|--------------------------------------------------------------------------
*/

export const PAYMENT_METHODS = [
  "CASH",
  "BANK",
  "MOBILE_MONEY",
  "CARD",
] as const;

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[number];


/*
|--------------------------------------------------------------------------
| Revenue Settings
|--------------------------------------------------------------------------
|
| Global singleton configuration for Revenue Management.
|
| IMPORTANT:
|
| - Ethiopian months are stored as numbers 1–13.
| - Financial precision/rounding belongs to Tariff Rules.
| - Penalty/interest rates belong to their own rule modules.
| - No calendar_type is stored here.
| - No global partial-payment setting is stored here.
|
*/

export interface RevenueSetting {
  id: string;

  /*
  |--------------------------------------------------------------------------
  | Payment Period
  |--------------------------------------------------------------------------
  */

  payment_start_month: number | null;
  payment_start_day: number | null;

  payment_end_month: number | null;
  payment_end_day: number | null;


  /*
  |--------------------------------------------------------------------------
  | Penalty / Interest
  |--------------------------------------------------------------------------
  */

  penalty_enabled: boolean;
  interest_enabled: boolean;


  /*
  |--------------------------------------------------------------------------
  | Assessment
  |--------------------------------------------------------------------------
  */

  assessment_auto_calculation: boolean;
  assessment_allow_manual_adjustment: boolean;
  assessment_requires_approval: boolean;
  assessment_reassessment_allowed: boolean;


  /*
  |--------------------------------------------------------------------------
  | Invoice
  |--------------------------------------------------------------------------
  */

  invoice_auto_numbering: boolean;
  invoice_prefix: string;

  invoice_allow_overpayment: boolean;
  invoice_allow_overdue_payment: boolean;


  /*
  |--------------------------------------------------------------------------
  | Payment
  |--------------------------------------------------------------------------
  */

  payment_confirmation_required: boolean;
  payment_auto_receipt: boolean;

  enabled_payment_methods: PaymentMethod[];


  /*
  |--------------------------------------------------------------------------
  | Receipt
  |--------------------------------------------------------------------------
  */

  receipt_auto_numbering: boolean;
  receipt_prefix: string;

  receipt_allow_reprint: boolean;


  /*
  |--------------------------------------------------------------------------
  | System Metadata
  |--------------------------------------------------------------------------
  */

  is_active: boolean;

  legal_reference: string | null;
  description: string | null;

  created_by: string | null;
  updated_by: string | null;

  created_at: string;
  updated_at: string;
}


/*
|--------------------------------------------------------------------------
| Payment Period
|--------------------------------------------------------------------------
*/

export interface RevenuePaymentPeriod {
  start: {
    month: number;
    day: number;
  } | null;

  end: {
    month: number;
    day: number;
  } | null;

  configured: boolean;
}


/*
|--------------------------------------------------------------------------
| Resource Response
|--------------------------------------------------------------------------
|
| The API resource currently exposes payment_period in addition to
| the raw month/day fields.
|
*/

export interface RevenueSettingResource
  extends RevenueSetting {
  payment_period: RevenuePaymentPeriod;
}


/*
|--------------------------------------------------------------------------
| Update Payload
|--------------------------------------------------------------------------
|
| Keep this separate from RevenueSetting so the frontend does not
| accidentally submit read-only fields such as id, timestamps,
| created_by, etc.
|
*/

export interface UpdateRevenueSettingPayload {
  payment_start_month: number | null;
  payment_start_day: number | null;

  payment_end_month: number | null;
  payment_end_day: number | null;

  penalty_enabled: boolean;
  interest_enabled: boolean;

  assessment_auto_calculation: boolean;
  assessment_allow_manual_adjustment: boolean;
  assessment_requires_approval: boolean;
  assessment_reassessment_allowed: boolean;

  invoice_auto_numbering: boolean;
  invoice_prefix: string;

  invoice_allow_overpayment: boolean;
  invoice_allow_overdue_payment: boolean;

  payment_confirmation_required: boolean;
  payment_auto_receipt: boolean;

  enabled_payment_methods: PaymentMethod[];

  receipt_auto_numbering: boolean;
  receipt_prefix: string;

  receipt_allow_reprint: boolean;

  legal_reference?: string | null;
  description?: string | null;
}


/*
|--------------------------------------------------------------------------
| API Responses
|--------------------------------------------------------------------------
*/

export type RevenueSettingResponse =
  ApiResponse<RevenueSettingResource>;