// ============================================================
// PENALTY RULE TYPES
// ============================================================

export type CalculationType =
  | "FIXED"
  | "PERCENTAGE"
  | "PROGRESSIVE";

export type StartType =
  | "DUE_DATE"
  | "AGREEMENT_START"
  | "AFTER_GRACE_PERIOD"
  | "FISCAL_YEAR_START";

export type PeriodUnit =
  | "DAY"
  | "MONTH"
  | "YEAR";

export type CalculationBasis =
  | "PRINCIPAL"
  | "OUTSTANDING";

  export type PenaltyRuleScope =
  | "ALL"
  | "DEFAULT"
  | "LIZZ";

export type PenaltyRuleStatus =
  | "ACTIVE"
  | "INACTIVE";

// ============================================================
// REVENUE SERVICE
// ============================================================

export type RevenueService = {
  id: string;
  name: string;
};

// ============================================================
// PENALTY RULE
// ============================================================

export type PenaltyRule = {
  id: string;

  /**
   * NULL = global/default penalty rule
   * UUID = service-specific penalty rule
   */
  revenue_service_id: string | null;

  /**
   * Loaded revenue service.
   */
  revenue_service?: RevenueService | null;

  name: string;

  // ----------------------------------------------------------
  // Scope
  // ----------------------------------------------------------

  scope: PenaltyRuleScope;
  scope_label: string;

  // ----------------------------------------------------------
  // Calculation
  // ----------------------------------------------------------

  calculation_type: CalculationType;
  calculation_type_label: string;

  /**
   * Used by FIXED calculation.
   */
  fixed_amount: string | null;

  /**
   * Used by PERCENTAGE / PROGRESSIVE.
   */
  initial_rate: string | null;

  /**
   * Used by PROGRESSIVE.
   */
  increment_rate: string | null;

  /**
   * Used by PROGRESSIVE.
   */
  maximum_rate: string | null;

  // ----------------------------------------------------------
  // Start configuration
  // ----------------------------------------------------------

  start_type: StartType;

  /**
   * Number of days/months/years to offset from the
   * selected start date.
   *
   * Example:
   * AFTER_GRACE_PERIOD + 7 + DAY
   * = penalty starts 7 days after the due date.
   */
  start_offset_value: number;

  start_offset_unit: PeriodUnit;

  // ----------------------------------------------------------
  // Progressive increment
  // ----------------------------------------------------------

  /**
   * How frequently the progressive rate increases.
   */
  increment_period: PeriodUnit | null;

  // ----------------------------------------------------------
  // Calculation basis
  // ----------------------------------------------------------

  calculation_basis: CalculationBasis;

  // ----------------------------------------------------------
  // Effective period
  // ----------------------------------------------------------

  effective_from: string;
  effective_to: string | null;

  // ----------------------------------------------------------
  // Status
  // ----------------------------------------------------------

  is_active: boolean;

  status: PenaltyRuleStatus;

  /**
   * Whether the rule is effective on today's date.
   */
  is_effective_today: boolean;

  // ----------------------------------------------------------
  // Description / legal reference
  // ----------------------------------------------------------

  description: string | null;

  legal_reference: string | null;

  // ----------------------------------------------------------
  // Audit
  // ----------------------------------------------------------

  created_by: string | null;
  updated_by: string | null;

  created_at: string;
  updated_at: string;
};

// ============================================================
// PENALTY RULE FILTERS
// ============================================================

export type PenaltyRuleFilters = {
  page?: number;
  per_page?: number;
  search?: string;
  scope?: "ALL" | "DEFAULT" | "LIZZ";
  is_active?: boolean;
  calculation_type?: "ALL" | CalculationType;
  sort_by?:
    | "name"
    | "calculation_type"
    | "effective_from"
    | "effective_to"
    | "created_at"
    | "updated_at";
  sort_direction?: "asc" | "desc";
};

// ============================================================
// PENALTY FORM VALUES
// ============================================================

export type PenaltyFormValues = {
  /**
   * "DEFAULT" means global/default rule.
   * Otherwise contains a revenue service UUID.
   */
  revenue_service_id: string;

  name: string;

  calculation_type: CalculationType;

  /**
   * Keep numeric form fields as strings so inputs work
   * correctly with React Hook Form.
   */
  fixed_amount: string;

  initial_rate: string;

  increment_rate: string;

  maximum_rate: string;

  start_type: StartType;

  start_offset_value: string;

  start_offset_unit: PeriodUnit;

  increment_period: PeriodUnit;

  calculation_basis: CalculationBasis;

  effective_from: string;

  effective_to: string;

  is_active: boolean;

  legal_reference: string;

  description: string;
};

// ============================================================
// EMPTY FORM
// ============================================================

export const EMPTY_PENALTY_FORM: PenaltyFormValues = {
  revenue_service_id: "DEFAULT",

  name: "",

  calculation_type: "PROGRESSIVE",

  fixed_amount: "",

  initial_rate: "5",

  increment_rate: "2",

  maximum_rate: "25",

  start_type: "AFTER_GRACE_PERIOD",

  start_offset_value: "7",

  start_offset_unit: "DAY",

  increment_period: "MONTH",

  calculation_basis: "PRINCIPAL",

  effective_from: new Date()
    .toISOString()
    .slice(0, 10),

  effective_to: "",

  is_active: true,

  legal_reference: "",

  description: "",
};

// ============================================================
// CONVERSION: API → FORM
// ============================================================

export function penaltyRuleToForm(
  rule: PenaltyRule,
): PenaltyFormValues {
  return {
    revenue_service_id:
      rule.revenue_service_id ?? "DEFAULT",

    name: rule.name,

    calculation_type:
      rule.calculation_type,

    fixed_amount:
      rule.fixed_amount ?? "",

    initial_rate:
      rule.initial_rate ?? "",

    increment_rate:
      rule.increment_rate ?? "",

    maximum_rate:
      rule.maximum_rate ?? "",

    start_type:
      rule.start_type,

    start_offset_value:
      rule.start_offset_value?.toString() ?? "0",

    start_offset_unit:
      rule.start_offset_unit,

    increment_period:
      rule.increment_period ?? "MONTH",

    calculation_basis:
      rule.calculation_basis,

    effective_from:
      rule.effective_from,

    effective_to:
      rule.effective_to ?? "",

    is_active:
      rule.is_active,

    legal_reference:
      rule.legal_reference ?? "",

    description:
      rule.description ?? "",
  };
}

// ============================================================
// CONVERSION: FORM → API PAYLOAD
// ============================================================

export function penaltyFormToPayload(
  form: PenaltyFormValues,
) {
  return {
    revenue_service_id:
      form.revenue_service_id === "DEFAULT"
        ? null
        : form.revenue_service_id,

    name:
      form.name.trim(),

    calculation_type:
      form.calculation_type,

    fixed_amount:
      form.calculation_type === "FIXED" &&
      form.fixed_amount
        ? Number(form.fixed_amount)
        : null,

    initial_rate:
      form.calculation_type === "PERCENTAGE" ||
      form.calculation_type === "PROGRESSIVE"
        ? form.initial_rate
          ? Number(form.initial_rate)
          : null
        : null,

    increment_rate:
      form.calculation_type === "PROGRESSIVE" &&
      form.increment_rate
        ? Number(form.increment_rate)
        : null,

    maximum_rate:
      form.calculation_type === "PROGRESSIVE" &&
      form.maximum_rate
        ? Number(form.maximum_rate)
        : null,

    start_type:
      form.start_type,

    start_offset_value:
      Number(form.start_offset_value || 0),

    start_offset_unit:
      form.start_offset_unit,

    increment_period:
      form.calculation_type === "PROGRESSIVE"
        ? form.increment_period
        : null,

    calculation_basis:
      form.calculation_basis,

    effective_from:
      form.effective_from,

    effective_to:
      form.effective_to || null,

    is_active:
      form.is_active,

    legal_reference:
      form.legal_reference.trim() || null,

    description:
      form.description.trim() || null,
  };
}

// ============================================================
// HISTORY
// ============================================================

export type PenaltyRuleHistory = {
  id: string;

  penalty_rule_id: string;

  action:
    | "CREATED"
    | "UPDATED"
    | "ACTIVATED"
    | "DEACTIVATED";

  old_values: Record<string, unknown> | null;

  new_values: Record<string, unknown> | null;

  changed_by: string | null;

  changed_at: string;

  description: string | null;
};