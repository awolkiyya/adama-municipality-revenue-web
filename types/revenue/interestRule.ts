export type RatePeriod =
  | "YEAR"
  | "MONTH"
  | "DAY";

export type CalculationMethod =
  | "SIMPLE"
  | "COMPOUND";

export type CalculationBasis =
  | "PRINCIPAL"
  | "OUTSTANDING";

/*
|--------------------------------------------------------------------------
| Interest Rule Labels
|--------------------------------------------------------------------------
*/

export const RATE_PERIOD_LABELS: Record<
  RatePeriod,
  string
> = {
  YEAR: "Annual",
  MONTH: "Monthly",
  DAY: "Daily",
};

export const CALCULATION_METHOD_LABELS: Record<
  CalculationMethod,
  string
> = {
  SIMPLE: "Simple Interest",
  COMPOUND: "Compound Interest",
};

export const CALCULATION_BASIS_LABELS: Record<
  CalculationBasis,
  string
> = {
  PRINCIPAL: "Principal",
  OUTSTANDING: "Outstanding",
};

/*
|--------------------------------------------------------------------------
| Interest Rule
|--------------------------------------------------------------------------
*/

export type InterestRule = {
  id: string;

  /**
   * Interest rate stored as a percentage.
   *
   * Examples:
   * 24.7250 = 24.725%
   * 2.0000  = 2%
   * 0.0500  = 0.05%
   */
  rate: number;

  /**
   * Period represented by the configured rate.
   */
  rate_period: RatePeriod;

  /**
   * Method used by the interest calculation engine.
   */
  calculation_method: CalculationMethod;

  /**
   * Monetary amount against which interest is calculated.
   */
  calculation_basis: CalculationBasis;

  /**
   * Legal/business effective period.
   */
  effective_from: string;

  effective_to: string | null;

  /**
   * Administrative status.
   */
  is_active: boolean;

  /**
   * Legal instrument defining the interest rule.
   */
  legal_reference: string | null;

  description: string | null;

  created_at: string;

  updated_at: string;
};

/*
|--------------------------------------------------------------------------
| Interest Rule Filters
|--------------------------------------------------------------------------
*/

export type InterestRuleFilters = {
  search?: string;

  is_active?: boolean | string;

  rate_period?: RatePeriod | "ALL";

  calculation_method?:
    | CalculationMethod
    | "ALL";

  calculation_basis?:
    | CalculationBasis
    | "ALL";

  effective_date?: string;

  sort_by?: string;

  sort_direction?: "asc" | "desc";

  page?: number;

  per_page?: number;
};

/*
|--------------------------------------------------------------------------
| Interest Rule History
|--------------------------------------------------------------------------
|
| Use this when the backend history endpoint returns
| audit/change information for an interest rule.
|
*/

export type InterestRuleHistory = {
  id: string;

  interest_rule_id: string;

  action:
    | "CREATED"
    | "UPDATED"
    | "ACTIVATED"
    | "DEACTIVATED";

  old_values?: Record<
    string,
    unknown
  > | null;

  new_values?: Record<
    string,
    unknown
  > | null;

  changed_by?: string | null;

  created_at: string;
};

/*
|--------------------------------------------------------------------------
| Interest Rule Form
|--------------------------------------------------------------------------
|
| Form values intentionally keep rate and text fields as strings.
| This is useful for controlled form inputs and validation.
|
*/

export type InterestRuleFormValues = {
  /**
   * Entered interest rate.
   *
   * Example:
   * "24.725"
   */
  rate: string;

  rate_period: RatePeriod;

  calculation_method: CalculationMethod;

  calculation_basis: CalculationBasis;

  effective_from: string;

  effective_to: string;

  legal_reference: string;

  description: string;
};

/*
|--------------------------------------------------------------------------
| Interest Rule Payload
|--------------------------------------------------------------------------
|
| Payload sent to the Laravel API.
|
*/

export type InterestRulePayload = {
  rate: number;

  rate_period: RatePeriod;

  calculation_method: CalculationMethod;

  calculation_basis: CalculationBasis;

  effective_from: string;

  effective_to: string | null;

  legal_reference: string | null;

  description: string | null;
};

/*
|--------------------------------------------------------------------------
| Empty Form
|--------------------------------------------------------------------------
*/

export const EMPTY_INTEREST_RULE_FORM: InterestRuleFormValues = {
  rate: "",

  rate_period: "YEAR",

  calculation_method: "SIMPLE",

  calculation_basis: "PRINCIPAL",

  effective_from: "",

  effective_to: "",

  legal_reference: "",

  description: "",
};

/*
|--------------------------------------------------------------------------
| Convert API Resource → Form
|--------------------------------------------------------------------------
*/

export function interestRuleToForm(
  rule: InterestRule,
): InterestRuleFormValues {
  return {
    rate: String(rule.rate),

    rate_period:
      rule.rate_period,

    calculation_method:
      rule.calculation_method,

    calculation_basis:
      rule.calculation_basis,

    effective_from:
      rule.effective_from,

    effective_to:
      rule.effective_to ?? "",

    legal_reference:
      rule.legal_reference ?? "",

    description:
      rule.description ?? "",
  };
}

/*
|--------------------------------------------------------------------------
| Convert Form → API Payload
|--------------------------------------------------------------------------
*/

export function interestRuleFormToPayload(
  form: InterestRuleFormValues,
): InterestRulePayload {
  return {
    rate: Number(form.rate),

    rate_period:
      form.rate_period,

    calculation_method:
      form.calculation_method,

    calculation_basis:
      form.calculation_basis,

    effective_from:
      form.effective_from,

    effective_to:
      form.effective_to || null,

    legal_reference:
      form.legal_reference.trim() || null,

    description:
      form.description.trim() || null,
  };
}