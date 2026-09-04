export type StartType =
  | "FIXED_FISCAL_MONTH"
  | "AGREEMENT_DATE";

export type CalculationBasis =
  | "PRINCIPAL"
  | "OUTSTANDING";

export type PenaltyFormValues = {
  name: string;

  initial_rate: string;

  increment_rate: string;

  maximum_rate: string;

  start_type: StartType;

  start_fiscal_month: string;

  increment_period: "MONTH";

  calculation_basis: CalculationBasis;

  effective_from: string;

  effective_to: string;

  legal_reference: string;

  description: string;

  is_active: boolean;
};

export type PenaltyRule = {
  id: string;

  name: string;

  initial_rate: string;

  increment_rate: string;

  maximum_rate: string;

  start_type: StartType;

  start_fiscal_month: number | null;

  increment_period: "MONTH";

  calculation_basis: CalculationBasis;

  effective_from: string;

  effective_to: string | null;

  legal_reference: string | null;

  description: string | null;

  is_active: boolean;

  created_at: string;

  updated_at: string;
};

export type PenaltyRuleFilters = {
  page?: number;

  per_page?: number;

  search?: string;

  is_active?: boolean;

  start_type?: StartType;

  calculation_basis?: CalculationBasis;

  sort_by?:
    | "name"
    | "effective_from"
    | "effective_to"
    | "created_at"
    | "updated_at";

  sort_direction?:
    | "asc"
    | "desc";
};

export type PenaltyRuleHistory = {
  id: string;

  penalty_rule_id: string;

  action:
    | "CREATED"
    | "UPDATED"
    | "ACTIVATED"
    | "DEACTIVATED";

  old_values:
    | Record<string, unknown>
    | null;

  new_values:
    | Record<string, unknown>
    | null;

  changed_by: string | null;

  changed_at: string;

  description: string | null;
};

// ============================================================
// EMPTY PENALTY FORM
// ============================================================

function getLocalDateString(): string {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    today.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export const EMPTY_PENALTY_FORM: PenaltyFormValues = {
  name: "",

  initial_rate: "5",

  increment_rate: "2",

  maximum_rate: "25",

  start_type: "FIXED_FISCAL_MONTH",

  start_fiscal_month: "7",

  increment_period: "MONTH",

  calculation_basis: "PRINCIPAL",

  effective_from: getLocalDateString(),

  effective_to: "",

  legal_reference: "",

  description: "",

  is_active: true,
};

// ============================================================
// FORM → API PAYLOAD
// ============================================================

export type PenaltyRulePayload = {
  name: string;

  initial_rate: number;

  increment_rate: number;

  maximum_rate: number;

  start_type: StartType;

  start_fiscal_month: number | null;

  increment_period: "MONTH";

  calculation_basis: CalculationBasis;

  effective_from: string;

  effective_to: string | null;

  legal_reference: string | null;

  description: string | null;

  is_active: boolean;
};

export function penaltyFormToPayload(
  form: PenaltyFormValues,
): PenaltyRulePayload {
  return {
    name: form.name.trim(),

    initial_rate: Number(
      form.initial_rate,
    ),

    increment_rate: Number(
      form.increment_rate,
    ),

    maximum_rate: Number(
      form.maximum_rate,
    ),

    start_type:
      form.start_type,

    start_fiscal_month:
      form.start_type ===
      "FIXED_FISCAL_MONTH"
        ? Number(
            form.start_fiscal_month,
          )
        : null,

    increment_period:
      "MONTH",

    calculation_basis:
      form.calculation_basis,

    effective_from:
      form.effective_from,

    effective_to:
      form.effective_to.trim() !== ""
        ? form.effective_to
        : null,

    legal_reference:
      form.legal_reference.trim() !== ""
        ? form.legal_reference.trim()
        : null,

    description:
      form.description.trim() !== ""
        ? form.description.trim()
        : null,

    is_active:
      form.is_active,
  };
}