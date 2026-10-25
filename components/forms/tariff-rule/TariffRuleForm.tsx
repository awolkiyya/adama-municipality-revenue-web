"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  Calculator,
  Filter,
  Settings,
  CheckCircle2,
  Check,
  Landmark,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Save,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import type { BaseField } from "@/types/revenue/revenue-baseField";
import type { MeasurementUnit } from "@/types/revenue/revenue-unit";
import type { RevenueService } from "@/types/revenue/revenu-service";
import type {
  Condition,
  ExistingRule,
  TariffRuleFormType,
} from "@/types/revenue/tariff-form";
import type { TariffVersion } from "@/types/revenue/tariff-version";

import RuleInformationStep from "./RuleInformationStep";
import CalculationStep from "./CalculationStep";
import ConditionsStep from "./ConditionsStep";
import FinancialControlsStep from "./FinancialControlsStep";
import ReviewStep from "./ReviewStep";

import {
  calculationSentence,
  conditionsComplete,
  calculationConfigComplete,
  formatCurrency,
  OPERATOR_LABELS,
  ROUNDING_LABELS,
} from "./tariffRuleForm.helpers";


// ---------------------------------------------------------------------------
// Static reference data
// ---------------------------------------------------------------------------

const steps = [
  {
    title: "Rule Information",
    description: "Identity and service",
    icon: FileText,
  },
  {
    title: "Calculation Logic",
    description: "Pricing engine",
    icon: Calculator,
  },
  {
    title: "Conditions",
    description: "Rule matching",
    icon: Filter,
  },
  {
    title: "Financial Controls",
    description: "Limits and rounding",
    icon: Settings,
  },
  {
    title: "Review",
    description: "Validate rule",
    icon: CheckCircle2,
  },
] as const;

// ---------------------------------------------------------------------------
// Summary types
// ---------------------------------------------------------------------------

type BaseFieldSummary = Pick<BaseField, "id" | "name">;
type MeasurementUnitSummary = Pick<MeasurementUnit, "id" | "name">;
type RevenueServiceSummary = Pick<RevenueService, "id" | "name">;

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

  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(
    new Set([0]),
  );

  const [publishState, setPublishState] = useState<
    "idle" | "success" | "error"
  >("idle");

  const [publishError, setPublishError] = useState<string | null>(null);

  const [selectedBaseField, setSelectedBaseField] =
    useState<BaseFieldSummary | null>(
      initialSelections?.baseField ?? null,
    );

  const [selectedUnit, setSelectedUnit] =
    useState<MeasurementUnitSummary | null>(
      initialSelections?.unit ?? null,
    );

  const [selectedService, setSelectedService] =
    useState<RevenueServiceSummary | null>(
      initialSelections?.service ?? null,
    );

  // Retain full BaseField metadata for condition rows.
  const [conditionFieldMeta, setConditionFieldMeta] = useState<
    Record<number, BaseField | null>
  >({});

  const [form, setForm] = useState<TariffRuleFormType>(() => ({
    ...DEFAULT_FORM,
    ...initialData,
    tariffVersionId:
      initialData?.tariffVersionId ??
      tariffVersionId ??
      tariffVersion?.id ??
      "",
  }));

  const copy =
    mode === "create"
      ? {
          title: "Create Tariff Rule",
          subtitle:
            "Configure automated revenue calculation logic for a service",
          publishLabel: "Publish Rule",
          publishingLabel: "Publishing...",
          publishedLabel: "Rule published",
          incompleteHint:
            "Complete rule information and calculation logic to publish.",
        }
      : {
          title: "Edit Tariff Rule",
          subtitle: "Update the calculation logic for this service",
          publishLabel: "Save Changes",
          publishingLabel: "Saving...",
          publishedLabel: "Changes saved",
          incompleteHint:
            "Complete rule information and calculation logic to save.",
        };

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  const goToStep = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, steps.length - 1));

    setActiveStep(safeIndex);
    setVisitedSteps((previous) => new Set(previous).add(safeIndex));
  };

  // -------------------------------------------------------------------------
  // Form updates
  // -------------------------------------------------------------------------

  const updateField = <K extends keyof TariffRuleFormType>(
    key: K,
    value: TariffRuleFormType[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // -------------------------------------------------------------------------
  // Conditions
  // -------------------------------------------------------------------------

  const addCondition = () => {
    setForm((previous) => ({
      ...previous,
      conditions: [
        ...previous.conditions,
        {
          fieldId: "",
          fieldName: "",
          operator: "equals",
          value: "",
        },
      ],
    }));
  };

  const updateCondition = <K extends keyof Condition>(
    index: number,
    key: K,
    value: Condition[K],
  ) => {
    setForm((previous) => {
      const conditions = [...previous.conditions];

      if (!conditions[index]) {
        return previous;
      }

      conditions[index] = {
        ...conditions[index],
        [key]: value,
      };

      return {
        ...previous,
        conditions,
      };
    });
  };

  const setConditionFieldForRow = (
    index: number,
    field: BaseField | null,
  ) => {
    setConditionFieldMeta((previous) => ({
      ...previous,
      [index]: field,
    }));
  };

  const removeCondition = (index: number) => {
    setForm((previous) => ({
      ...previous,
      conditions: previous.conditions.filter(
        (_, conditionIndex) => conditionIndex !== index,
      ),
    }));

    // Keep cached field metadata aligned with remaining condition rows.
    setConditionFieldMeta((previous) => {
      const next: Record<number, BaseField | null> = {};

      Object.entries(previous).forEach(([key, value]) => {
        const currentIndex = Number(key);

        if (currentIndex < index) {
          next[currentIndex] = value;
        } else if (currentIndex > index) {
          next[currentIndex - 1] = value;
        }
      });

      return next;
    });
  };

  // -------------------------------------------------------------------------
  // Formula
  // -------------------------------------------------------------------------

  const insertFormulaToken = (token: string) => {
    setForm((previous) => ({
      ...previous,
      formula: previous.formula
        ? `${previous.formula} ${token}`
        : token,
    }));
  };

  const useFormulaExample = () => {
    updateField("formula", "base_value * rate + adjustment");
  };

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  const calculationComplete = useMemo(
    () => calculationConfigComplete(form),
    [form],
  );

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
      return (
        Boolean(form.calculationType) &&
        calculationComplete &&
        rangeIsValid
      );
    }

    if (index === 2) {
      return (
        visitedSteps.has(2) &&
        conditionsComplete(form.conditions)
      );
    }

    if (index === 3) {
      return visitedSteps.has(3);
    }

    if (index === 4) {
      // Review is complete when the requirements to publish are satisfied.
      // Do not reference canPublish here: that would create a circular
      // dependency and can trigger a temporal dead zone error.
      return (
        isStepComplete(0) &&
        isStepComplete(1) &&
        conditionsComplete(form.conditions)
      );
    }

    return false;
  };

  const completedStepCount = steps.filter((_, index) =>
    isStepComplete(index),
  ).length;

  const canPublish =
    isStepComplete(0) &&
    isStepComplete(1) &&
    conditionsComplete(form.conditions);

  // -------------------------------------------------------------------------
  // Labels
  // -------------------------------------------------------------------------

  const serviceLabel =
    selectedService?.name ?? "No service selected";

  const versionLabel = tariffVersion
    ? `${tariffVersion.name} (Version ${tariffVersion.version})`
    : form.tariffVersionId || "No tariff version";

  // -------------------------------------------------------------------------
  // Existing rule conflicts
  // -------------------------------------------------------------------------

  const priorityCollision = existingRules.find(
    (rule) => rule.priority === form.priority,
  );

  // -------------------------------------------------------------------------
  // Conditions summary
  // -------------------------------------------------------------------------

  const conditionsSentence =
    form.conditions.length === 0
      ? "Applies to every matching transaction"
      : form.conditions
          .map(
            (condition) =>
              `${condition.fieldName || "field"} ${
                OPERATOR_LABELS[condition.operator] ??
                condition.operator
              } ${condition.value || "value"}`,
          )
          .join(", and ");

  // -------------------------------------------------------------------------
  // Financial controls summary
  // -------------------------------------------------------------------------

  const controlLines = useMemo(() => {
    const lines: string[] = [];

    if (form.minimumAmount !== "") {
      lines.push(
        `Minimum charge of ${formatCurrency(form.minimumAmount)}`,
      );
    }

    if (form.maximumAmount !== "") {
      lines.push(
        `Capped at ${formatCurrency(form.maximumAmount)}`,
      );
    }

    lines.push(
      ROUNDING_LABELS[form.roundingRule] ?? form.roundingRule,
    );

    return lines;
  }, [
    form.minimumAmount,
    form.maximumAmount,
    form.roundingRule,
  ]);

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  const handlePublish = async () => {
    if (!canPublish || isSubmitting) {
      return;
    }

    setPublishError(null);
    setPublishState("idle");

    try {
      await onSubmit(form);

      setPublishState("success");

      setTimeout(() => {
        setPublishState("idle");
      }, 2500);
    } catch (error) {
      setPublishState("error");

      setPublishError(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving this rule.",
      );
    }
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) {
      return;
    }

    try {
      setPublishError(null);
      await onSaveDraft(form);
    } catch (error) {
      setPublishState("error");

      setPublishError(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the draft.",
      );
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      {/* HEADER */}

      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {copy.title}
          </h1>

          <p className="text-sm text-muted-foreground">
            {copy.subtitle}
          </p>
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

      {/* PROGRESS */}

      <div className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all duration-300"
            style={{
              width: `${(completedStepCount / steps.length) * 100}%`,
            }}
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
              type="button"
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
        {/* LEFT STEP NAVIGATION */}

        <Card className="hidden h-fit lg:sticky lg:top-6 lg:col-span-3 lg:block">
          <CardContent className="space-y-1.5 p-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const complete = isStepComplete(index);
              const active = activeStep === index;

              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => goToStep(index)}
                  aria-current={active ? "step" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted"
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
                    {complete && !active ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {step.title}
                    </p>

                    <p
                      className={`truncate text-xs ${
                        active
                          ? "opacity-80"
                          : "text-muted-foreground"
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
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{steps[activeStep].title}</CardTitle>

              <span className="shrink-0 text-xs text-muted-foreground">
                Step {activeStep + 1} of {steps.length}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {activeStep === 0 && (
              <RuleInformationStep
                form={form}
                updateField={updateField}
                selectedService={selectedService}
                setSelectedService={setSelectedService}
                priorityCollision={priorityCollision}
              />
            )}

            {activeStep === 1 && (
              <CalculationStep
                form={form}
                updateField={updateField}
                selectedBaseField={selectedBaseField}
                setSelectedBaseField={setSelectedBaseField}
                selectedUnit={selectedUnit}
                setSelectedUnit={setSelectedUnit}
                rangeIsValid={rangeIsValid}
                insertFormulaToken={insertFormulaToken}
                useFormulaExample={useFormulaExample}
              />
            )}

            {activeStep === 2 && (
              <ConditionsStep
                conditions={form.conditions}
                conditionFieldMeta={conditionFieldMeta}
                updateCondition={updateCondition}
                setConditionFieldForRow={setConditionFieldForRow}
                addCondition={addCondition}
                removeCondition={removeCondition}
              />
            )}

            {activeStep === 3 && (
              <FinancialControlsStep
                form={form}
                updateField={updateField}
              />
            )}

            {activeStep === 4 && (
              <ReviewStep
                form={form}
                selectedService={selectedService}
                selectedBaseField={selectedBaseField}
                selectedUnit={selectedUnit}
              />
            )}
          </CardContent>
        </Card>

        {/* LIVE RULE PREVIEW */}

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
              <p className="text-xs text-muted-foreground">
                {serviceLabel}
              </p>

              <p className="font-semibold">
                {form.name || "Untitled rule"}
              </p>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Priority &amp; Order
              </p>

              <p>Priority {form.priority}</p>

              {priorityCollision && (
                <p className="mt-1 flex items-start gap-1 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  Shares priority with {priorityCollision.name}
                </p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Calculation
              </p>

              <p>
                Charges{" "}
                {calculationSentence(
                  form,
                  selectedBaseField,
                  selectedUnit,
                )}
                .
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Applies when
              </p>

              <p>{conditionsSentence}.</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Controls
              </p>

              <ul className="space-y-1">
                {controlLines.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FOOTER */}

      <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t pt-5 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          onClick={() => goToStep(activeStep - 1)}
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

          {publishState === "error" && (
            <span className="text-sm text-destructive">
              {publishError ??
                "Failed to save this rule. Please try again."}
            </span>
          )}

          {publishState === "idle" &&
            !canPublish &&
            activeStep === steps.length - 1 && (
              <span className="text-center text-xs text-muted-foreground sm:text-left">
                {copy.incompleteHint}
              </span>
            )}

          {onSaveDraft && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
          )}

          {activeStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={() => goToStep(activeStep + 1)}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handlePublish}
              disabled={!canPublish || isSubmitting}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isSubmitting
                ? copy.publishingLabel
                : copy.publishLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
