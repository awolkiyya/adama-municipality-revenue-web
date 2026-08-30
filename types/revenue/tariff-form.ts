import { BaseField } from "./revenue-baseField";

/*
|--------------------------------------------------------------------------
| Condition
|--------------------------------------------------------------------------
*/

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal";

export interface Condition {
  fieldId: string;
  operator: ConditionOperator;
  value: string;
}

/*
|--------------------------------------------------------------------------
| Tariff Rule Record
|--------------------------------------------------------------------------
*/

export interface TariffRuleRecord {
  id: string;

  name: string;

  description: string;

  serviceId: string;

  tariffVersionId: string;

  calculationType:
    | "FIXED"
    | "PERCENTAGE"
    | "PER_UNIT"
    | "RANGE"
    | "FORMULA"
    | "";

  baseFieldId: string;

  priority: number;

  executionOrder: number;

  minValue: string | null;

  maxValue: string | null;

  amount: string | null;

  percentage: string | null;

  measurementUnitId: string | null;

  minimumAmount: string | null;

  maximumAmount: string | null;

  formula: string | null;

  conditions: Condition[];

  roundingRule:
    | "NONE"
    | "ROUND_UP"
    | "ROUND_DOWN"
    | "NEAREST";

  isActive: boolean;

  baseField: {
    id: string;
    name: string;
  } | null;

  unit: {
    id: string;
    name: string;
  } | null;

  service: {
    id: string;
    name: string;
  } | null;

  siblingRules: {
    id: string;
    name: string;
    priority: number;
    executionOrder: number;
  }[];
}

/*
|--------------------------------------------------------------------------
| Hook Result
|--------------------------------------------------------------------------
*/

export interface UseTariffRuleResult {
  data: TariffRuleRecord | null;

  isLoading: boolean;

  isError: boolean;

  refetch: () => void;
}

/*
|--------------------------------------------------------------------------
| Calculation Type
|--------------------------------------------------------------------------
*/

export type CalculationType =
  | "FIXED"
  | "PERCENTAGE"
  | "PER_UNIT"
  | "RANGE"
  | "FORMULA";

/*
|--------------------------------------------------------------------------
| Rounding Rule
|--------------------------------------------------------------------------
*/

export type RoundingRule =
  | "NONE"
  | "ROUND_UP"
  | "ROUND_DOWN"
  | "NEAREST";

/*
|--------------------------------------------------------------------------
| Tariff Rule Form
|--------------------------------------------------------------------------
|
| Form values may temporarily contain "" because a select/input can
| initially have no selected value.
|
*/

export interface TariffRuleFormType {
  name: string;

  description: string;

  serviceId: string;

  tariffVersionId: string;

  calculationType: CalculationType | "";

  baseFieldId: string | null;

  priority: number;

  executionOrder: number;

  minValue: string;

  maxValue: string;

  amount: string;

  percentage: string;

  measurementUnitId: string;

  minimumAmount: string;

  maximumAmount: string;

  formula: string;

  conditions: Condition[];

  roundingRule: RoundingRule;

  isActive: boolean;
}

/*
|--------------------------------------------------------------------------
| Existing Rule
|--------------------------------------------------------------------------
*/

export interface ExistingRule {
  name: string;

  priority: number;

  executionOrder: number;
}

/*
|--------------------------------------------------------------------------
| Map API Rule -> Form
|--------------------------------------------------------------------------
*/

export function mapRuleToFormShape(
  rule: TariffRuleRecord
): Partial<TariffRuleFormType> {
  return {
    name: rule.name,

    description: rule.description ?? "",

    serviceId: rule.serviceId,

    tariffVersionId: rule.tariffVersionId,

    calculationType: rule.calculationType,

    baseFieldId: rule.baseFieldId ?? "",

    priority: rule.priority,

    executionOrder: rule.executionOrder,

    minValue: rule.minValue ?? "",

    maxValue: rule.maxValue ?? "",

    amount: rule.amount ?? "",

    percentage: rule.percentage ?? "",

    measurementUnitId:
      rule.measurementUnitId ?? "",

    minimumAmount:
      rule.minimumAmount ?? "",

    maximumAmount:
      rule.maximumAmount ?? "",

    formula: rule.formula ?? "",

    conditions: rule.conditions?.map((condition) => ({
      fieldId: condition.fieldId,
      operator: condition.operator,
      value: condition.value,
    })) ?? [],

    roundingRule: rule.roundingRule,

    isActive: rule.isActive,
  };
}

/*
|--------------------------------------------------------------------------
| Create Tariff Rule Payload
|--------------------------------------------------------------------------
*/

export interface CreateTariffRulePayload {
  tariff_version_id: string;

  service_id: string;

  name: string;

  description?: string;

  calculation_type:
    | "FIXED"
    | "PERCENTAGE"
    | "PER_UNIT"
    | "RANGE"
    | "FORMULA";

  base_field_id?: string | null;

  priority: number;

  execution_order: number;

  min_value?: string | null;

  max_value?: string | null;

  amount?: string | null;

  percentage?: string | null;

  measurement_unit_id?: string | null;

  minimum_amount?: string | null;

  maximum_amount?: string | null;

  formula?: string | null;

  conditions: Condition[];

  rounding_rule:
    | "NONE"
    | "ROUND_UP"
    | "ROUND_DOWN"
    | "NEAREST";

  is_active: boolean;
}

/*
|--------------------------------------------------------------------------
| Update Payload
|--------------------------------------------------------------------------
*/

export type UpdateTariffRulePayload =
  Partial<CreateTariffRulePayload>;

/*
|--------------------------------------------------------------------------
| Form -> API Payload
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This function is the only place that converts:
|
|   serviceId       -> service_id
|   tariffVersionId -> tariff_version_id
|   calculationType -> calculation_type
|   baseFieldId     -> base_field_id
|
| It also guarantees calculation_type is valid.
|
*/

export function mapFormToTariffRulePayload(
  form: TariffRuleFormType,
  tariffVersionId: string
): CreateTariffRulePayload {
  /*
  |--------------------------------------------------------------------------
  | Validate calculation type
  |--------------------------------------------------------------------------
  */

  if (
    form.calculationType !== "FIXED" &&
    form.calculationType !== "PERCENTAGE" &&
    form.calculationType !== "PER_UNIT" &&
    form.calculationType !== "RANGE" &&
    form.calculationType !== "FORMULA"
  ) {
    throw new Error(
      "Calculation type is required"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Return API payload
  |--------------------------------------------------------------------------
  */

  return {
    tariff_version_id: tariffVersionId,

    service_id: form.serviceId,

    name: form.name,

    description: form.description,

    calculation_type:
      form.calculationType,

    base_field_id:
      form.baseFieldId || null,

    priority: form.priority,

    execution_order:
      form.executionOrder,

    min_value:
      form.minValue || null,

    max_value:
      form.maxValue || null,

    amount:
      form.amount || null,

    percentage:
      form.percentage || null,

    measurement_unit_id:
      form.measurementUnitId || null,

    minimum_amount:
      form.minimumAmount || null,

    maximum_amount:
      form.maximumAmount || null,

    formula:
      form.formula || null,

    conditions:
      form.conditions ?? [],

    rounding_rule:
      form.roundingRule,

    is_active:
      form.isActive,
  };
}

/*
|--------------------------------------------------------------------------
| Base Field Data Type
|--------------------------------------------------------------------------
*/

export type BaseFieldDataType =
  | "NUMBER"
  | "DECIMAL"
  | "TEXT"
  | "BOOLEAN"
  | "DATE";

/*
|--------------------------------------------------------------------------
| Condition Operators
|--------------------------------------------------------------------------
*/

export const CONDITION_OPERATORS: Record<
  BaseFieldDataType,
  {
    value: Condition["operator"];
    label: string;
  }[]
> = {
  NUMBER: [
    {
      value: "equals",
      label: "Equals",
    },
    {
      value: "not_equals",
      label: "Not Equals",
    },
    {
      value: "greater_than",
      label: "Greater Than",
    },
    {
      value: "greater_than_or_equal",
      label: "Greater Than or Equal",
    },
    {
      value: "less_than",
      label: "Less Than",
    },
    {
      value: "less_than_or_equal",
      label: "Less Than or Equal",
    },
  ],

  DECIMAL: [
    {
      value: "equals",
      label: "Equals",
    },
    {
      value: "not_equals",
      label: "Not Equals",
    },
    {
      value: "greater_than",
      label: "Greater Than",
    },
    {
      value: "greater_than_or_equal",
      label: "Greater Than or Equal",
    },
    {
      value: "less_than",
      label: "Less Than",
    },
    {
      value: "less_than_or_equal",
      label: "Less Than or Equal",
    },
  ],

  TEXT: [
    {
      value: "equals",
      label: "Equals",
    },
    {
      value: "not_equals",
      label: "Not Equals",
    },
    {
      value: "contains",
      label: "Contains",
    },
  ],

  BOOLEAN: [
    {
      value: "equals",
      label: "Equals",
    },
    {
      value: "not_equals",
      label: "Not Equals",
    },
  ],

  DATE: [
    {
      value: "equals",
      label: "Equals",
    },
    {
      value: "not_equals",
      label: "Not Equals",
    },
    {
      value: "greater_than",
      label: "After",
    },
    {
      value: "greater_than_or_equal",
      label: "On or After",
    },
    {
      value: "less_than",
      label: "Before",
    },
    {
      value: "less_than_or_equal",
      label: "On or Before",
    },
  ],
};

/*
|--------------------------------------------------------------------------
| Get Base Field Data Type
|--------------------------------------------------------------------------
*/

export function getFieldDataType(
  field?: BaseField | null
): BaseFieldDataType {
  const type = field?.data_type;

  switch (type) {
    case "NUMBER":
      return "NUMBER";

    case "DECIMAL":
      return "DECIMAL";

    case "BOOLEAN":
      return "BOOLEAN";

    case "DATE":
      return "DATE";

    case "TEXT":
    default:
      return "TEXT";
  }
}