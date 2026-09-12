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
| - annual_payment_due_date stores an Ethiopian recurring annual date
|   in MM-DD format.
| - The year is intentionally not stored because the payment deadline
|   recurs every Ethiopian calendar year.
| - The actual legal due date is resolved for each assessment service
|   and persisted on assessment_services.due_date.
| - Financial precision/rounding belongs to Tariff Rules.
| - Penalty/interest rates belong to their own rule modules.
| - No calendar_type is stored here.
| - No payment start/end period is stored here.
| - No global partial-payment setting is stored here.
|
*/

export interface RevenueSetting {
  id: string;

  /*
  |--------------------------------------------------------------------------
  | Annual Payment Due Date
  |--------------------------------------------------------------------------
  |
  | Format:
  |
  |     MM-DD
  |
  | Examples:
  |
  |     "01-15"
  | |   "10-30"
  | |   "13-06"
  |
  | Month 13 represents Pagume.
  |
  */

  annual_payment_due_date: string | null;


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
| Resource Response
|--------------------------------------------------------------------------
|
| The API resource represents the same persisted configuration.
|
| No payment_period object is required because the backend now stores
| one recurring annual payment due date instead of a start/end period.
|
*/

export interface RevenueSettingResource
  extends RevenueSetting {}


/*
|--------------------------------------------------------------------------
| Update Payload
|--------------------------------------------------------------------------
|
| Keep this separate from RevenueSetting so the frontend does not
| accidentally submit read-only fields such as:
|
| - id
| - timestamps
| - created_by
| - updated_by
| - is_active
|
*/

export interface UpdateRevenueSettingPayload {
  /*
  |--------------------------------------------------------------------------
  | Annual Payment Due Date
  |--------------------------------------------------------------------------
  */

  annual_payment_due_date: string | null;


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
  | Optional Metadata
  |--------------------------------------------------------------------------
  */

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