export type RatePeriod = "YEAR" | "MONTH" | "DAY";

export type CalculationMethod =
  | "SIMPLE"
  | "COMPOUND";

export type CalculationBasis =
  | "PRINCIPAL"
  | "OUTSTANDING";

export type InterestRule = {
  id: string;

  rate: number;

  rate_period: RatePeriod;

  calculation_method: CalculationMethod;

  calculation_basis: CalculationBasis;

  effective_from: string;

  effective_to: string | null;

  is_active: boolean;

  legal_reference: string | null;

  description: string | null;

  created_at: string;

  updated_at: string;
};

export type InterestRuleFormValues = {
  rate: string;

  rate_period: RatePeriod;

  calculation_method: CalculationMethod;

  calculation_basis: CalculationBasis;

  effective_from: string;

  effective_to: string;

  legal_reference: string;

  description: string;
};

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

export function interestRuleToForm(
  rule: InterestRule,
): InterestRuleFormValues {
  return {
    rate: String(rule.rate),

    rate_period: rule.rate_period,

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

export function interestRuleFormToPayload(
  form: InterestRuleFormValues,
) {
  return {
    rate: Number(form.rate),

    rate_period: form.rate_period,

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