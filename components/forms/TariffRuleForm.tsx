"use client";

import { useMemo, useState } from "react";

import {
  FileText,
  Calculator,
  Filter,
  Settings,
  CheckCircle2,
  Coins,
  Percent,
  Hash,
  Layers,
  FunctionSquare,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  ArrowRight,
  Check,
  Landmark,
  Wand2,
  Receipt,
  AlertTriangle,
  CircleDot,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import ServiceDropdown from "@/components/input/ServiceDropDown";
import { RevenueService } from "@/types/revenue/revenu-service";

import { MeasurementUnitDropdown } from "@/components/input/MeasurmentUnitDropDown";
import { BaseField } from "@/types/revenue/revenue-baseField";
import { MeasurementUnit } from "@/types/revenue/revenue-unit";

import {
  BaseFieldDataType,
  CalculationType,
  Condition,
  CONDITION_OPERATORS,
  ExistingRule,
  getFieldDataType,
  RoundingRule,
  TariffRuleFormType,
} from "@/types/revenue/tariff-form";

import { TariffVersion } from "@/types/revenue/tariff-version";
import { BaseFieldDropdown } from "@/components/input/BasefieldDropDown";
// ---------------------------------------------------------------------------
// Condition value input
// ---------------------------------------------------------------------------

interface ConditionValueInputProps {
  fieldType: BaseFieldDataType;
  value: string;
  onChange: (value: string) => void;
}

function ConditionValueInput({
  fieldType,
  value,
  onChange,
}: ConditionValueInputProps) {
  switch (fieldType) {
    case "NUMBER":
      return (
        <Input
          type="number"
          step={1}
          placeholder="Enter number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="py-5"
        />
      );

    case "DECIMAL":
      return (
        <Input
          type="number"
          step="0.01"
          placeholder="Enter value"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="py-5"

        />
      );

    case "BOOLEAN":
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full py-5">
            <SelectValue placeholder="Select value" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      );

    case "DATE":
      return (
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="py-5"

        />
      );

    case "TEXT":
    default:
      return (
        <Input
          type="text"
          placeholder="Enter value"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="py-5"

        />
      );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPositiveInt(value: string): number {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

// ---------------------------------------------------------------------------
// Static reference data
// ---------------------------------------------------------------------------

const steps = [
  { title: "Rule Information", description: "Identity and service", icon: FileText },
  { title: "Calculation Logic", description: "Pricing engine", icon: Calculator },
  { title: "Conditions", description: "Rule matching", icon: Filter },
  { title: "Financial Controls", description: "Limits and rounding", icon: Settings },
  { title: "Review", description: "Validate rule", icon: CheckCircle2 },
] as const;

const calculationOptions: {
  value: CalculationType;
  label: string;
  description: string;
  icon: typeof Coins;
}[] = [
  { value: "FIXED", label: "Fixed Amount", description: "Apply a fixed charge", icon: Coins },
  { value: "PERCENTAGE", label: "Percentage", description: "Calculate from a base value", icon: Percent },
  { value: "PER_UNIT", label: "Per Unit", description: "Quantity multiplied by rate", icon: Hash },
  { value: "RANGE", label: "Range", description: "Tier based calculation", icon: Layers },
  { value: "FORMULA", label: "Formula", description: "Custom calculation", icon: FunctionSquare },
];

// ---------------------------------------------------------------------------
// Formula reference
//
// NOTE: Formula does not depend on baseFieldId.
// Formula variables are managed independently through TariffFormulaVariable.
// ---------------------------------------------------------------------------

const DEFAULT_FORMULA_EXAMPLE = "base_value * rate + adjustment";

const DEFAULT_FORMULA_VARIABLES = ["base_value", "rate", "adjustment"];

const DEFAULT_SAMPLE_VALUES: Record<string, number> = {
  base_value: 1000,
  rate: 0.1,
  adjustment: 0,
};

// ---------------------------------------------------------------------------
// Formula helpers
// ---------------------------------------------------------------------------

function tokenizeFormula(formula: string): string[] {
  return formula.match(/[a-zA-Z_][a-zA-Z0-9_]*|\d+\.?\d*|[+\-*/()]|\s+/g) ?? [];
}

function safeEvaluateFormula(
  formula: string,
  values: Record<string, number>
): number | null {
  if (!formula.trim()) return null;

  let expression = formula;

  const keys = Object.keys(values).sort((a, b) => b.length - a.length);

  for (const key of keys) {
    expression = expression.replace(new RegExp(`\\b${key}\\b`, "g"), String(values[key]));
  }

  if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
    return null;
  }

  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expression});`)();
    return typeof result === "number" && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const OPERATOR_LABELS: Record<Condition["operator"], string> = {
  equals: "is",
  not_equals: "is not",
  contains: "contains",
  greater_than: "is greater than",
  greater_than_or_equal: "is greater than or equal to",
  less_than: "is less than",
  less_than_or_equal: "is less than or equal to",
};

const ROUNDING_LABELS: Record<RoundingRule, string> = {
  NONE: "Exact amount — no rounding applied",
  ROUND_UP: "Rounded up to the nearest whole unit",
  ROUND_DOWN: "Rounded down to the nearest whole unit",
  NEAREST: "Rounded to the nearest whole unit",
};

function formatCurrency(value: string | number): string {
  if (value === "" || value === undefined || value === null) {
    return "—";
  }

  const n = typeof value === "number" ? value : Number(value);

  if (Number.isNaN(n)) {
    return String(value);
  }

  return `ETB ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Summary types
// ---------------------------------------------------------------------------

type BaseFieldSummary = Pick<BaseField, "id" | "name">;
type MeasurementUnitSummary = Pick<MeasurementUnit, "id" | "name">;
type RevenueServiceSummary = Pick<RevenueService, "id" | "name">;

// ---------------------------------------------------------------------------
// Calculation description
// ---------------------------------------------------------------------------

function baseFieldLabel(field?: BaseFieldSummary | null): string {
  return field ? field.name.toLowerCase() : "the assessed base";
}

function calculationSentence(
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
      return `${formatCurrency(form.amount)} per ${unit?.name ?? "unit"} of ${baseFieldLabel(baseField)}`;

    case "RANGE":
      return `${formatCurrency(form.amount)} when ${baseFieldLabel(baseField)} is between ${
        form.minValue || "—"
      } and ${form.maxValue || "—"}`;

    case "FORMULA":
      return form.formula ? `the formula ${form.formula}` : "a custom formula";

    default:
      return "no calculation method selected yet";
  }
}

// ---------------------------------------------------------------------------
// Calculation validation
// ---------------------------------------------------------------------------

function calculationConfigComplete(form: TariffRuleFormType): boolean {
  switch (form.calculationType) {
    case "FIXED":
      return !!form.amount;

    case "PERCENTAGE":
      return !!form.percentage && !!form.baseFieldId;

    case "PER_UNIT":
      return !!form.amount && !!form.measurementUnitId && !!form.baseFieldId;

    case "RANGE":
      return !!form.amount && !!form.minValue && !!form.maxValue && !!form.baseFieldId;

    // Formula does NOT require baseFieldId — variables are handled
    // separately via TariffFormulaVariable.
    case "FORMULA":
      return !!form.formula?.trim();

    default:
      return false;
  }
}

function conditionsComplete(conditions: Condition[]): boolean {
  return conditions.every((c) => c.fieldId.trim() && c.value.trim());
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_EXISTING_RULES: ExistingRule[] = [
  { name: "Base Fee", priority: 1, executionOrder: 1 },
  { name: "Late Penalty", priority: 1, executionOrder: 2 },
  { name: "VAT", priority: 1, executionOrder: 3 },
];

const DEFAULT_FORM: TariffRuleFormType = {
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TariffRuleFormProps {
  mode: "create" | "update";

  initialData?: Partial<TariffRuleFormType>;

  initialSelections?: {
    baseField?: BaseFieldSummary | null;
    unit?: MeasurementUnitSummary | null;
    service?: RevenueServiceSummary | null;
  };

  existingRules?: ExistingRule[];

  isSubmitting?: boolean;

  onSubmit: (form: TariffRuleFormType) => void | Promise<void>;

  onSaveDraft?: (form: TariffRuleFormType) => void | Promise<void>;

  tariffVersion?: TariffVersion;

  tariffVersionId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TariffRuleForm({
  mode,
  initialData,
  initialSelections,
  existingRules = DEFAULT_EXISTING_RULES,
  isSubmitting = false,
  onSubmit,
  onSaveDraft,
  tariffVersion,
  tariffVersionId,
}: TariffRuleFormProps) {
  const [activeStep, setActiveStep] = useState(0);

  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));

  const [publishState, setPublishState] = useState<"idle" | "success" | "error">("idle");
  const [publishError, setPublishError] = useState<string | null>(null);

  const [selectedBaseField, setSelectedBaseField] = useState<BaseFieldSummary | null>(
    initialSelections?.baseField ?? null
  );

  const [selectedUnit, setSelectedUnit] = useState<MeasurementUnitSummary | null>(
    initialSelections?.unit ?? null
  );

  const [selectedService, setSelectedService] = useState<RevenueServiceSummary | null>(
    initialSelections?.service ?? null
  );

  // Tracks the full BaseField object picked for each condition row (keyed by
  // index) so we can derive the correct data type / operators / value input
  // for that specific condition. Condition itself only stores fieldId, which
  // is not enough to know NUMBER vs TEXT vs DATE etc.
  const [conditionFieldMeta, setConditionFieldMeta] = useState<
    Record<number, BaseField | null>
  >({});

  // -------------------------------------------------------------------------
  // Form initialization
  // -------------------------------------------------------------------------

  const [form, setForm] = useState<TariffRuleFormType>(() => ({
    ...DEFAULT_FORM,
    tariffVersionId: tariffVersionId ?? tariffVersion?.id ?? "",
    ...initialData,
  }));

  const copy =
    mode === "create"
      ? {
          title: "Create Tariff Rule",
          subtitle: "Configure automated revenue calculation logic for a service",
          publishLabel: "Publish Rule",
          publishingLabel: "Publishing...",
          publishedLabel: "Rule published",
          incompleteHint: "Complete rule information and calculation logic to publish.",
        }
      : {
          title: "Edit Tariff Rule",
          subtitle: "Update the calculation logic for this service",
          publishLabel: "Save Changes",
          publishingLabel: "Saving...",
          publishedLabel: "Changes saved",
          incompleteHint: "Complete rule information and calculation logic to save.",
        };

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  const goToStep = (index: number) => {
    setActiveStep(index);
    setVisitedSteps((prev) => new Set(prev).add(index));
  };

  // -------------------------------------------------------------------------
  // Form updates
  // -------------------------------------------------------------------------

  const updateField = <K extends keyof TariffRuleFormType>(
    key: K,
    value: TariffRuleFormType[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // -------------------------------------------------------------------------
  // Conditions
  // -------------------------------------------------------------------------

  const addCondition = () => {
    setForm((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { fieldId: "", operator: "equals", value: "" }],
    }));
  };

  const updateCondition = <K extends keyof Condition>(
    index: number,
    key: K,
    value: Condition[K]
  ) => {
    setForm((prev) => {
      const conditions = [...prev.conditions];
      conditions[index] = { ...conditions[index], [key]: value };
      return { ...prev, conditions };
    });
  };

  // Updates the cached BaseField object for a condition row (used to derive
  // its data type) without touching the rest of the form state.
  const setConditionFieldForRow = (index: number, field: BaseField | null) => {
    setConditionFieldMeta((prev) => ({ ...prev, [index]: field }));
  };

  const removeCondition = (index: number) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));

    // Re-index the field-metadata map so it stays aligned with the
    // conditions array after a row in the middle is removed.
    setConditionFieldMeta((prev) => {
      const next: Record<number, BaseField | null> = {};

      Object.entries(prev).forEach(([key, value]) => {
        const i = Number(key);

        if (i < index) {
          next[i] = value;
        } else if (i > index) {
          next[i - 1] = value;
        }
        // entry at `index` is dropped
      });

      return next;
    });
  };

  // -------------------------------------------------------------------------
  // Formula
  // -------------------------------------------------------------------------

  const insertFormulaToken = (token: string) => {
    setForm((prev) => ({
      ...prev,
      formula: prev.formula ? `${prev.formula} ${token}` : token,
    }));
  };

  const useFormulaExample = () => {
    updateField("formula", DEFAULT_FORMULA_EXAMPLE);
  };

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  const calculationComplete = useMemo(() => calculationConfigComplete(form), [form]);

  const rangeIsValid =
    form.calculationType !== "RANGE" ||
    !form.minValue ||
    !form.maxValue ||
    Number(form.minValue) < Number(form.maxValue);

  const isStepComplete = (index: number): boolean => {
    if (index === 0) {
      return form.name.trim().length > 0;
    }

    if (index === 1) {
      return !!form.calculationType && calculationComplete && rangeIsValid;
    }

    if (index === 2) {
      return visitedSteps.has(2) && conditionsComplete(form.conditions);
    }

    if (index === 3) {
      return visitedSteps.has(3);
    }

    return false;
  };

  const completedStepCount = steps.filter((_, i) => isStepComplete(i)).length;

  const canPublish = isStepComplete(0) && isStepComplete(1) && conditionsComplete(form.conditions);

  // -------------------------------------------------------------------------
  // Labels
  // -------------------------------------------------------------------------

  const serviceLabel = selectedService?.name ?? "No service selected";

  const versionLabel = tariffVersion
    ? `${tariffVersion.name} (Version ${tariffVersion.version})`
    : form.tariffVersionId || "No tariff version";

  // -------------------------------------------------------------------------
  // Existing rule conflicts
  // -------------------------------------------------------------------------

  const priorityCollision = existingRules.find((r) => r.priority === form.priority);

  const executionOrderCollision = existingRules.find(
    (r) => r.executionOrder === form.executionOrder
  );

  // -------------------------------------------------------------------------
  // Conditions sentence
  // -------------------------------------------------------------------------

  const conditionsSentence =
    form.conditions.length === 0
      ? "Applies to every matching transaction"
      : form.conditions
          .map(
            (c) =>
              `${c.fieldId || "field"} ${OPERATOR_LABELS[c.operator]} ${c.value || "value"}`
          )
          .join(", and ");

  // -------------------------------------------------------------------------
  // Financial controls
  // -------------------------------------------------------------------------

  const controlLines = useMemo(() => {
    const lines: string[] = [];

    if (form.minimumAmount) {
      lines.push(`Minimum charge of ${formatCurrency(form.minimumAmount)}`);
    }

    if (form.maximumAmount) {
      lines.push(`Capped at ${formatCurrency(form.maximumAmount)}`);
    }

    lines.push(ROUNDING_LABELS[form.roundingRule]);

    return lines;
  }, [form.minimumAmount, form.maximumAmount, form.roundingRule]);

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  const handlePublish = async () => {
    if (!canPublish || isSubmitting) {
      return;
    }

    setPublishError(null);

    try {
      await onSubmit(form);

      setPublishState("success");

      setTimeout(() => {
        setPublishState("idle");
      }, 2500);
    } catch (err) {
      setPublishState("error");
      setPublishError(
        err instanceof Error ? err.message : "Something went wrong while saving this rule."
      );
    }
  };

  const handleSaveDraft = () => {
    onSaveDraft?.(form);
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      {/* HEADER */}

      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{serviceLabel}</Badge>
          <Badge variant="outline">{versionLabel}</Badge>

          <Badge
            className={
              form.isActive
                ? "bg-emerald-600 hover:bg-emerald-600"
                : "bg-muted text-muted-foreground hover:bg-muted"
            }
          >
            {form.isActive ? "Active" : "Draft"}
          </Badge>
        </div>
      </div>

      {/* PROGRESS OVERVIEW */}

      <div className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${(completedStepCount / steps.length) * 100}%` }}
          />
        </div>

        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {completedStepCount} of {steps.length} steps complete
        </span>
      </div>

      {/* MOBILE STEP BAR */}

      <div
        className="flex items-center gap-2 overflow-x-auto pb-1 lg:hidden"
        role="tablist"
        aria-label="Form steps"
      >
        {steps.map((step, index) => {
          const complete = isStepComplete(index);

          return (
            <button
              key={step.title}
              role="tab"
              aria-selected={activeStep === index}
              onClick={() => goToStep(index)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                activeStep === index
                  ? "border-primary bg-primary text-primary-foreground"
                  : complete
                    ? "border-emerald-600 text-emerald-700"
                    : "border-border text-muted-foreground"
              }`}
            >
              {complete && activeStep !== index ? (
                <Check className="h-3 w-3" />
              ) : (
                <span>{index + 1}</span>
              )}

              {step.title}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT STEPS */}

        <Card className="hidden h-fit lg:sticky lg:top-6 lg:col-span-3 lg:block">
          <CardContent className="space-y-1.5 p-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const complete = isStepComplete(index);
              const active = activeStep === index;

              return (
                <button
                  key={step.title}
                  onClick={() => goToStep(index)}
                  aria-current={active}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    active ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                      active
                        ? "border-primary-foreground/40"
                        : complete
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-border text-muted-foreground"
                    }`}
                  >
                    {complete && !active ? <Check className="h-4 w-4" /> : index + 1}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{step.title}</p>
                    <p
                      className={`truncate text-xs ${
                        active ? "opacity-80" : "text-muted-foreground"
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>

                  <Icon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* MAIN CONTENT */}

        <Card className="lg:col-span-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{steps[activeStep].title}</CardTitle>

              <span className="text-xs text-muted-foreground">
                Step {activeStep + 1} of {steps.length}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* ========================================================= */}
            {/* STEP 0 */}
            {/* ========================================================= */}

            {activeStep === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rule-name">
                    Rule Name <span className="text-destructive">*</span>
                  </Label>

                  <Input
                    id="rule-name"
                    placeholder="Commercial Property Tax"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full py-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule-description">Description</Label>

                  <Textarea
                    id="rule-description"
                    placeholder="Describe when this rule applies"
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Service</Label>

                  <ServiceDropdown
                    value={form.serviceId || null}
                    onChange={(value, item) => {
                      updateField("serviceId", value);
                      setSelectedService(item);
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>

                    <Input
                      id="priority"
                      type="number"
                      min={1}
                      step={1}
                      value={form.priority}
                      onChange={(e) => updateField("priority", toPositiveInt(e.target.value))}
                      className="w-full py-4"
                    />

                    <p className="text-xs text-muted-foreground">
                      Lower numbers match first — e.g. 1 for a specific rule, 10 for a general
                      fallback.
                    </p>

                    {priorityCollision && (
                      <p className="flex items-start gap-1.5 text-xs text-amber-700">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        Priority {form.priority} is already used by {priorityCollision.name}.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="font-medium">Rule Active</p>
                    <p className="text-sm text-muted-foreground">Enable tariff calculation</p>
                  </div>

                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => updateField("isActive", v)}
                  />
                </div>
              </>
            )}

            {/* ========================================================= */}
            {/* STEP 1 */}
            {/* ========================================================= */}

            {activeStep === 1 && (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {calculationOptions.map((option) => {
                    const Icon = option.icon;
                    const selected = form.calculationType === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField("calculationType", option.value)}
                        aria-pressed={selected}
                        className={`rounded-xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                          selected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex gap-3">
                          <Icon
                            className={`h-5 w-5 shrink-0 ${
                              selected ? "text-primary" : "text-muted-foreground"
                            }`}
                          />

                          <div>
                            <p className="font-semibold">{option.label}</p>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </div>

                          {selected && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {form.calculationType && (
                  <div className="space-y-5 rounded-xl border bg-muted/20 p-5">
                    <h3 className="font-semibold">Calculation Configuration</h3>

                    {/* Base field — not shown for FORMULA, which uses its
                        own independent variable set. */}

                    {["PERCENTAGE", "PER_UNIT", "RANGE"].includes(form.calculationType) && (
                      <div className="space-y-2">
                        <Label>Base Field</Label>

                        <BaseFieldDropdown
                          value={form.baseFieldId}
                          onChange={(value, item) => {
                            updateField("baseFieldId", value);
                            setSelectedBaseField(item);
                          }}
                        />
                      </div>
                    )}

                    {/* FIXED */}

                    {form.calculationType === "FIXED" && (
                      <div className="space-y-2">
                        <Label htmlFor="fixed-amount">Fixed Amount (ETB)</Label>

                        <Input
                          id="fixed-amount"
                          type="number"
                          min={0}
                          placeholder="500"
                          value={form.amount}
                          onChange={(e) => updateField("amount", e.target.value)}
                          className="w-full py-4"
                        />
                      </div>
                    )}

                    {/* PERCENTAGE */}

                    {form.calculationType === "PERCENTAGE" && (
                      <div className="space-y-2">
                        <Label htmlFor="percentage-rate">Percentage Rate (%)</Label>

                        <Input
                          id="percentage-rate"
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          placeholder="2.5"
                          value={form.percentage}
                          onChange={(e) => updateField("percentage", e.target.value)}
                          className="w-full py-4"
                        />
                      </div>
                    )}

                    {/* PER UNIT */}

                    {form.calculationType === "PER_UNIT" && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="per-unit-amount">Rate Amount</Label>

                          <Input
                            id="per-unit-amount"
                            type="number"
                            min={0}
                            placeholder="50"
                            value={form.amount}
                            onChange={(e) => updateField("amount", e.target.value)}
                            className="w-full py-4"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Unit</Label>

                          <MeasurementUnitDropdown
                            value={form.measurementUnitId}
                            onChange={(value, item) => {
                              updateField("measurementUnitId", value);
                              setSelectedUnit(item);
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* RANGE */}

                    {form.calculationType === "RANGE" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="range-min">Minimum Value</Label>

                            <Input
                              id="range-min"
                              type="number"
                              value={form.minValue}
                              onChange={(e) => updateField("minValue", e.target.value)}
                              className="w-full py-4"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="range-max">Maximum Value</Label>

                            <Input
                              id="range-max"
                              type="number"
                              value={form.maxValue}
                              onChange={(e) => updateField("maxValue", e.target.value)}
                              className="w-full py-4"
                            />
                          </div>
                        </div>

                        {!rangeIsValid && (
                          <p className="flex items-start gap-1.5 text-xs text-destructive">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            Minimum value must be less than the maximum value.
                          </p>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="range-amount">Range Amount</Label>

                          <Input
                            id="range-amount"
                            type="number"
                            min={0}
                            value={form.amount}
                            onChange={(e) => updateField("amount", e.target.value)}
                            className="w-full py-4"
                          />
                        </div>
                      </div>
                    )}

                    {/* FORMULA — no base field selector, no baseFieldId
                        validation; variables are independent. */}

                    {form.calculationType === "FORMULA" &&
                      (() => {
                        const variables = DEFAULT_FORMULA_VARIABLES;
                        const sampleValues = DEFAULT_SAMPLE_VALUES;
                        const exampleFormula = DEFAULT_FORMULA_EXAMPLE;
                        const displayFormula = form.formula || exampleFormula;
                        const isPlaceholder = !form.formula;

                        const previewResult = safeEvaluateFormula(displayFormula, sampleValues);

                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="formula-expression">Formula Expression</Label>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1.5 text-xs"
                                onClick={useFormulaExample}
                              >
                                <Wand2 className="h-3.5 w-3.5" />
                                Use example
                              </Button>
                            </div>

                            <Textarea
                              id="formula-expression"
                              className="font-mono"
                              placeholder={exampleFormula}
                              value={form.formula}
                              onChange={(e) => updateField("formula", e.target.value)}
                            />

                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">Insert:</span>

                              {variables.map((token) => (
                                <button
                                  key={token}
                                  type="button"
                                  onClick={() => insertFormulaToken(token)}
                                  className="rounded-md border bg-background px-2 py-0.5 font-mono text-xs text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                  {token}
                                </button>
                              ))}
                            </div>

                            <div className="space-y-3 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-4">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                  Formula Preview
                                </p>

                                <Receipt className="h-4 w-4 text-emerald-700" />
                              </div>

                              <p
                                className={`break-all font-mono text-base leading-relaxed ${
                                  isPlaceholder ? "opacity-60" : ""
                                }`}
                              >
                                {tokenizeFormula(displayFormula).map((token, i) => {
                                  if (variables.includes(token)) {
                                    return (
                                      <span key={i} className="font-semibold text-emerald-700">
                                        {token}
                                      </span>
                                    );
                                  }

                                  if (/^\d+\.?\d*$/.test(token)) {
                                    return (
                                      <span key={i} className="text-amber-700">
                                        {token}
                                      </span>
                                    );
                                  }

                                  if (/^[+\-*/()]$/.test(token)) {
                                    return (
                                      <span key={i} className="text-muted-foreground">
                                        {token}
                                      </span>
                                    );
                                  }

                                  return (
                                    <span key={i} className="font-semibold text-emerald-700">
                                      {token}
                                    </span>
                                  );
                                })}
                              </p>

                              {isPlaceholder && (
                                <p className="text-xs text-muted-foreground">
                                  Use the variables above to build your formula.
                                </p>
                              )}

                              <Separator className="border-dashed border-emerald-200" />

                              <div className="space-y-3">
                                {Object.entries(sampleValues).map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex items-center justify-between text-xs text-muted-foreground"
                                  >
                                    <span className="font-mono">{key}</span>
                                    <span className="font-mono">{value.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="flex items-center justify-between border-t border-dashed border-emerald-300 pt-2">
                                <span className="text-sm font-medium">Example result</span>

                                <span className="font-mono text-lg font-semibold text-emerald-700">
                                  {previewResult !== null
                                    ? formatCurrency(previewResult.toFixed(2))
                                    : "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                )}
              </>
            )}

            {/* ========================================================= */}
            {/* STEP 2 — CONDITIONS */}
            {/* ========================================================= */}

            {activeStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Define when this tariff rule should be applied. Leave empty to apply it to
                  every matching transaction.
                </p>

                {form.conditions.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
                    <Filter className="h-6 w-6 text-muted-foreground" />

                    <p className="text-sm text-muted-foreground">
                      No conditions yet — this rule applies universally.
                    </p>

                    <Button variant="outline" onClick={addCondition}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Condition
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {form.conditions.map((condition, index) => {
                        // Derive the real data type from the cached BaseField
                        // object for this row, not just the fieldId string.
                        const selectedField = conditionFieldMeta[index] ?? null;
                        const fieldType: BaseFieldDataType = getFieldDataType(selectedField);
                        const operators = CONDITION_OPERATORS[fieldType];

                        const incomplete =
                          !condition.fieldId.trim() || !condition.value.trim();

                        return (
                          <div key={index} className="space-y-3 rounded-lg border p-3">
                            {/* CONDITION HEADER */}

                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-muted-foreground">
                                {index === 0 ? "IF" : "AND"}
                              </span>

                              {incomplete && (
                                <span className="flex items-center gap-1 text-xs text-amber-700">
                                  <CircleDot className="h-3 w-3" />
                                  Incomplete
                                </span>
                              )}
                            </div>

                            {/* CONDITION INPUTS */}

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                              {/* BASE FIELD */}

                              <div className="sm:col-span-4">
                                <BaseFieldDropdown
                                  value={condition.fieldId || null}
                                  onChange={(value, item) => {
                                    const nextFieldId = value ?? "";

                                    updateCondition(index, "fieldId", nextFieldId);

                                    // The old value/operator may not be valid
                                    // for the new field's data type, so reset
                                    // them whenever the field changes.
                                    updateCondition(index, "value", "");
                                    updateCondition(index, "operator", "equals");

                                    setConditionFieldForRow(index, item ?? null);
                                  }}
                                />
                              </div>

                              {/* OPERATOR */}

                              <Select
                                value={condition.operator}
                                onValueChange={(value) =>
                                  updateCondition(
                                    index,
                                    "operator",
                                    value as Condition["operator"]
                                  )
                                }
                              >
                                <SelectTrigger className="sm:col-span-4 w-full py-5">
                                  <SelectValue placeholder="Select operator" />
                                </SelectTrigger>

                                <SelectContent>
                                  {operators.map((operator) => (
                                    <SelectItem key={operator.value} value={operator.value}>
                                      {operator.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {/* VALUE */}

                              <div className="sm:col-span-3">
                                <ConditionValueInput
                                  fieldType={fieldType}
                                  value={condition.value}
                                  onChange={(value) => updateCondition(index, "value", value)}
                                />
                              </div>

                              {/* REMOVE */}

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="sm:col-span-1"
                                aria-label="Remove condition"
                                onClick={() => removeCondition(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>

                            {/* HUMAN READABLE PREVIEW */}

                            <p className="inline-block rounded bg-emerald-50 px-2 py-1 font-mono text-xs text-emerald-700">
                              {selectedField?.name || condition.fieldId || "field"}{" "}
                              {OPERATOR_LABELS[condition.operator]}{" "}
                              {condition.value || "value"}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <Button variant="outline" onClick={addCondition}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Condition
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 3 */}
            {/* ========================================================= */}

            {activeStep === 3 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="min-charge">Minimum Charge</Label>

                    <Input
                      id="min-charge"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={form.minimumAmount}
                      onChange={(e) => updateField("minimumAmount", e.target.value)}
                      className="py-5"

                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-charge">Maximum Charge</Label>

                    <Input
                      id="max-charge"
                      type="number"
                      min={0}
                      placeholder="50000"
                      value={form.maximumAmount}
                      onChange={(e) => updateField("maximumAmount", e.target.value)}
                      className="py-5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rounding Rule</Label>

                  <Select
                    value={form.roundingRule}
                    onValueChange={(v) => updateField("roundingRule", v as RoundingRule)}
                  >
                    <SelectTrigger className="w-full py-5">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="ROUND_UP">Round Up</SelectItem>
                      <SelectItem value="ROUND_DOWN">Round Down</SelectItem>
                      <SelectItem value="NEAREST">Nearest</SelectItem>
                    </SelectContent>
                  </Select>

                  <p className="text-xs text-muted-foreground">
                    {ROUNDING_LABELS[form.roundingRule]}
                  </p>
                </div>

                {(form.minimumAmount || form.maximumAmount) && (
                  <div className="rounded-lg bg-muted p-4 text-sm">
                    Every charge from this rule will stay
                    {form.minimumAmount && (
                      <>
                        {" "}
                        at or above{" "}
                        <span className="font-mono text-emerald-700">
                          {formatCurrency(form.minimumAmount)}
                        </span>
                      </>
                    )}
                    {form.minimumAmount && form.maximumAmount && " and"}
                    {form.maximumAmount && (
                      <>
                        {" "}
                        at or below{" "}
                        <span className="font-mono text-emerald-700">
                          {formatCurrency(form.maximumAmount)}
                        </span>
                      </>
                    )}
                    .
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 4 */}
            {/* ========================================================= */}

            {activeStep === 4 && (
              <div className="space-y-5">
                {!canPublish && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

                    <span>
                      This rule isn't ready to {mode === "create" ? "publish" : "save"} yet.
                      Check that the rule name, calculation method, and any conditions you've
                      started are complete.
                    </span>
                  </div>
                )}

                {publishState === "error" && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{publishError ?? "Failed to save this rule. Please try again."}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Rule Name</p>
                    <p className="font-semibold">{form.name || "—"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Service</p>
                    <p className="font-semibold">{serviceLabel}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Calculation</p>
                    <Badge>{form.calculationType || "Not selected"}</Badge>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="outline">{form.isActive ? "Active" : "Draft"}</Badge>
                  </div>
                </div>

                <Separator />

                <div className="rounded-lg bg-muted p-4">
                  <p className="mb-1 font-medium">Calculation</p>

                  <p className="text-sm">
                    This rule charges{" "}
                    {calculationSentence(form, selectedBaseField, selectedUnit)}.
                  </p>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <p className="mb-2 font-medium">Conditions</p>

                  {form.conditions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No conditions</p>
                  ) : (
                    form.conditions.map((c, i) => (
                      <p key={i} className="font-mono text-sm">
                        {i === 0 ? "IF" : "AND"} {c.fieldId || "field"}{" "}
                        {OPERATOR_LABELS[c.operator]} {c.value || "value"}
                      </p>
                    ))
                  )}
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <p className="mb-2 font-medium">Financial Controls</p>

                  {controlLines.map((line, i) => (
                    <p key={i} className="text-sm">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============================================================= */}
        {/* LIVE RULE PREVIEW */}
        {/* ============================================================= */}

        <Card className="h-fit lg:sticky lg:top-6 lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-emerald-700" />

              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Live Rule Preview
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{serviceLabel}</p>
              <p className="font-semibold">{form.name || "Untitled rule"}</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Priority &amp; Order
              </p>

              <p>
                Priority {form.priority} · Step {form.executionOrder}
              </p>

              {priorityCollision && (
                <p className="mt-1 flex items-start gap-1 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  Shares priority with {priorityCollision.name}
                </p>
              )}

              {executionOrderCollision && (
                <p className="mt-1 flex items-start gap-1 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  Conflicts with {executionOrderCollision.name} at this step
                </p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Calculation</p>

              <p>
                Charges {calculationSentence(form, selectedBaseField, selectedUnit)}.
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Applies when</p>
              <p>{conditionsSentence}.</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Controls</p>

              <ul className="space-y-1">
                {controlLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =============================================================== */}
      {/* FOOTER */}
      {/* =============================================================== */}

      <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t pt-5 sm:flex-row sm:items-center">
        <Button
          variant="outline"
          onClick={() => goToStep(Math.max(0, activeStep - 1))}
          disabled={activeStep === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {publishState === "success" && (
            <span className="flex items-center justify-center gap-1 text-sm text-emerald-700">
              <Check className="h-4 w-4" />
              {copy.publishedLabel}
            </span>
          )}

          {publishState === "idle" && !canPublish && activeStep === steps.length - 1 && (
            <span className="text-center text-xs text-muted-foreground sm:text-left">
              {copy.incompleteHint}
            </span>
          )}

          {onSaveDraft && (
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
          )}

          {activeStep < steps.length - 1 ? (
            <Button onClick={() => goToStep(activeStep + 1)}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={!canPublish || isSubmitting}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isSubmitting ? copy.publishingLabel : copy.publishLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}