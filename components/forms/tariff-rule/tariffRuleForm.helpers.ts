
import {
    Coins,
    Percent,
    Hash,
    Layers,
    FunctionSquare,
  } from "lucide-react";
  
  import type { BaseField } from "@/types/revenue/revenue-baseField";
  import type { MeasurementUnit } from "@/types/revenue/revenue-unit";
  import type { RevenueService } from "@/types/revenue/revenu-service";
  
  import type {
    CalculationType,
    Condition,
    ExistingRule,
    RoundingRule,
    TariffRuleFormType,
  } from "@/types/revenue/tariff-form";
  
  // -----------------------------------------------------------------------------
  // Summary types
  // -----------------------------------------------------------------------------
  
  export type BaseFieldSummary = Pick<BaseField, "id" | "name">;
  
  export type MeasurementUnitSummary = Pick<MeasurementUnit, "id" | "name">;
  
  export type RevenueServiceSummary = Pick<RevenueService, "id" | "name">;
  
  // -----------------------------------------------------------------------------
  // Form defaults
  // -----------------------------------------------------------------------------
  
  export const DEFAULT_FORM: TariffRuleFormType = {
    name: "",
    description: "",
    serviceId: "",
    tariffVersionId: "",
    calculationType: "",
    baseFieldId: "",
    priority: 1,
    executionOrder: 1,
    minValue: "",
    maxValue: "",
    amount: "",
    percentage: "",
    measurementUnitId: "",
    minimumAmount: "",
    maximumAmount: "",
    formula: "",
    conditions: [],
    roundingRule: "NONE",
    isActive: true,
  };
  
  export const DEFAULT_EXISTING_RULES: ExistingRule[] = [
    { name: "Base Fee", priority: 1, executionOrder: 1 },
    { name: "Late Penalty", priority: 1, executionOrder: 2 },
    { name: "VAT", priority: 1, executionOrder: 3 },
  ];
  
  // -----------------------------------------------------------------------------
  // Wizard steps
  // -----------------------------------------------------------------------------
  
  export const steps = [
    {
      title: "Rule Information",
      description: "Identity and service",
    },
    {
      title: "Calculation Logic",
      description: "Pricing engine",
    },
    {
      title: "Conditions",
      description: "Rule matching",
    },
    {
      title: "Financial Controls",
      description: "Limits and rounding",
    },
    {
      title: "Review",
      description: "Validate rule",
    },
  ] as const;
  
  // -----------------------------------------------------------------------------
  // Calculation options
  // -----------------------------------------------------------------------------
  
  export const calculationOptions: {
    value: CalculationType;
    label: string;
    description: string;
    icon: typeof Coins;
  }[] = [
    {
      value: "FIXED",
      label: "Fixed Amount",
      description: "Apply a fixed charge",
      icon: Coins,
    },
    {
      value: "PERCENTAGE",
      label: "Percentage",
      description: "Calculate from a base value",
      icon: Percent,
    },
    {
      value: "PER_UNIT",
      label: "Per Unit",
      description: "Quantity multiplied by rate",
      icon: Hash,
    },
    {
      value: "RANGE",
      label: "Range",
      description: "Tier-based calculation",
      icon: Layers,
    },
    {
      value: "FORMULA",
      label: "Formula",
      description: "Custom calculation",
      icon: FunctionSquare,
    },
  ];
  
  // -----------------------------------------------------------------------------
  // Formula preview
  // -----------------------------------------------------------------------------
  
  export const DEFAULT_FORMULA_EXAMPLE =
    "base_value * rate + adjustment";
  
  export const DEFAULT_FORMULA_VARIABLES = [
    "base_value",
    "rate",
    "adjustment",
  ];
  
  export const DEFAULT_SAMPLE_VALUES: Record<string, number> = {
    base_value: 1000,
    rate: 0.1,
    adjustment: 0,
  };
  
  export function tokenizeFormula(formula: string): string[] {
    return (
      formula.match(
        /[a-zA-Z_][a-zA-Z0-9_]*|\d+\.?\d*|[+\-*/()]|\s+/g
      ) ?? []
    );
  }
  
  /**
   * Client-side preview only.
   * Never use this function as the authoritative tariff calculation.
   */
  export function safeEvaluateFormula(
    formula: string,
    values: Record<string, number>
  ): number | null {
    if (!formula.trim()) {
      return null;
    }
  
    let expression = formula;
  
    const keys = Object.keys(values).sort(
      (a, b) => b.length - a.length
    );
  
    for (const key of keys) {
      expression = expression.replace(
        new RegExp(`\\b${key}\\b`, "g"),
        String(values[key])
      );
    }
  
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
      return null;
    }
  
    try {
      // eslint-disable-next-line no-new-func
      const result = Function(
        `"use strict"; return (${expression});`
      )();
  
      return typeof result === "number" && Number.isFinite(result)
        ? result
        : null;
    } catch {
      return null;
    }
  }
  
  // -----------------------------------------------------------------------------
  // Labels
  // -----------------------------------------------------------------------------
  
  export const OPERATOR_LABELS: Record<
    Condition["operator"],
    string
  > = {
    equals: "is",
    not_equals: "is not",
    contains: "contains",
    greater_than: "is greater than",
    greater_than_or_equal: "is greater than or equal to",
    less_than: "is less than",
    less_than_or_equal: "is less than or equal to",
  };
  
  export const ROUNDING_LABELS: Record<RoundingRule, string> = {
    NONE: "Exact amount — no rounding applied",
    ROUND_UP: "Rounded up to the nearest whole unit",
    ROUND_DOWN: "Rounded down to the nearest whole unit",
    NEAREST: "Rounded to the nearest whole unit",
  };
  
  // -----------------------------------------------------------------------------
  // Formatting
  // -----------------------------------------------------------------------------
  
  export function toPositiveInt(value: string): number {
    const number = Math.round(Number(value));
  
    return Number.isFinite(number) && number > 0
      ? number
      : 1;
  }
  
  export function formatCurrency(
    value: string | number | null | undefined
  ): string {
    if (value === "" || value === undefined || value === null) {
      return "—";
    }
  
    const number = typeof value === "number" ? value : Number(value);
  
    if (!Number.isFinite(number)) {
      return String(value);
    }
  
    return `ETB ${number.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
  }
  
  // -----------------------------------------------------------------------------
  // Calculation description
  // -----------------------------------------------------------------------------
  
  function baseFieldLabel(
    field?: BaseFieldSummary | null
  ): string {
    return field ? field.name.toLowerCase() : "the assessed base";
  }
  
  export function calculationSentence(
    form: TariffRuleFormType,
    baseField?: BaseFieldSummary | null,
    unit?: MeasurementUnitSummary | null
  ): string {
    switch (form.calculationType) {
      case "FIXED":
        return `a fixed charge of ${formatCurrency(form.amount)}`;
  
      case "PERCENTAGE":
        return `${form.percentage || "—"}% of ${baseFieldLabel(baseField)}`;
  
      case "PER_UNIT":
        return `${formatCurrency(form.amount)} per ${
          unit?.name ?? "unit"
        } of ${baseFieldLabel(baseField)}`;
  
      case "RANGE":
        return `${formatCurrency(form.amount)} when ${
          baseFieldLabel(baseField)
        } is between ${form.minValue || "—"} and ${
          form.maxValue || "—"
        }`;
  
      case "FORMULA":
        return form.formula
          ? `the formula ${form.formula}`
          : "a custom formula";
  
      default:
        return "no calculation method selected yet";
    }
  }
  
  // -----------------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------------
  
  export function calculationConfigComplete(
    form: TariffRuleFormType
  ): boolean {
    switch (form.calculationType) {
      case "FIXED":
        return form.amount.trim() !== "";
  
      case "PERCENTAGE":
        return (
          form.percentage.trim() !== "" &&
          !!form.baseFieldId
        );
  
      case "PER_UNIT":
        return (
          form.amount.trim() !== "" &&
          !!form.measurementUnitId &&
          !!form.baseFieldId
        );
  
      case "RANGE":
        return (
          form.amount.trim() !== "" &&
          form.minValue.trim() !== "" &&
          form.maxValue.trim() !== "" &&
          !!form.baseFieldId
        );
  
      case "FORMULA":
        return !!form.formula.trim();
  
      default:
        return false;
    }
  }
  
  export function conditionsComplete(
    conditions: Condition[]
  ): boolean {
    return conditions.every(
      (condition) =>
        !!condition.fieldId.trim() &&
        !!condition.value.trim()
    );
  }
  
  export function rangeIsValid(
    form: TariffRuleFormType
  ): boolean {
    if (
      form.calculationType !== "RANGE" ||
      !form.minValue.trim() ||
      !form.maxValue.trim()
    ) {
      return true;
    }
  
    return Number(form.minValue) < Number(form.maxValue);
  }
  