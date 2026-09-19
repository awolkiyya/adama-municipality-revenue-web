export type PaymentScheduleRuleStatus =
  | "ACTIVE"
  | "INACTIVE";


/*
|--------------------------------------------------------------------------
| Payment Schedule Rule
|--------------------------------------------------------------------------
*/

export type PaymentScheduleRule = {
  id: string;

  revenue_code_id: string;

  is_enabled: boolean;

  first_installment_percentage: number | null;

  status: PaymentScheduleRuleStatus;

  revenue_code: {
    id: string;
    code: string;
    name: string;
  };

  created_at: string;

  updated_at: string;
};


/*
|--------------------------------------------------------------------------
| Payment Schedule Rule Filters
|--------------------------------------------------------------------------
*/

export type PaymentScheduleRuleFilters = {
  search?: string;

  is_enabled?: boolean | "ALL";

  revenue_code_id?: string;

  has_first_installment_percentage?:
    | boolean
    | "ALL";

  sort_by?:
    | "created_at"
    | "updated_at"
    | "is_enabled"
    | "first_installment_percentage";

  sort_direction?:
    | "asc"
    | "desc";

  page?: number;

  per_page?: number;
};


/*
|--------------------------------------------------------------------------
| CREATE PAYMENT SCHEDULE RULE PAYLOAD
|--------------------------------------------------------------------------
|
| Revenue code is required when creating a rule.
|
| first_installment_percentage is optional because
| not every revenue code needs a first-installment
| percentage configuration.
|
*/

export type PaymentScheduleRulePayload = {
  revenue_code_id: string;

  is_enabled: boolean;

  first_installment_percentage?:
    | number
    | null;
};


/*
|--------------------------------------------------------------------------
| UPDATE PAYMENT SCHEDULE RULE PAYLOAD
|--------------------------------------------------------------------------
|
| Revenue code is intentionally excluded.
|
| Once a payment schedule rule has been created for
| a revenue code, that relationship should remain
| immutable.
|
*/

export type UpdatePaymentScheduleRulePayload = {
  is_enabled?: boolean;

  first_installment_percentage?:
    | number
    | null;
};


/*
|--------------------------------------------------------------------------
| Payment Schedule Rule Form Values
|--------------------------------------------------------------------------
|
| These represent the frontend form state.
|
| firstInstallmentPercentage is a string because
| form inputs normally operate with string values.
|
*/

export type PaymentScheduleRuleFormValues = {
  revenueCodeId: string;

  isEnabled: boolean;

  firstInstallmentPercentage: string;
};


/*
|--------------------------------------------------------------------------
| Payment Schedule Rule Summary
|--------------------------------------------------------------------------
*/

export type PaymentScheduleRuleSummary = {
  total: number;

  active: number;

  inactive: number;

  percentage_configured: number;

  percentage_not_configured: number;
};