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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { BaseFieldDropdown } from "@/components/input/BasefieldDropDown";
import { MeasurementUnitDropdown } from "@/components/input/MeasurmentUnitDropDown";
import { BaseField } from "@/types/revenue/revenue-baseField";
import { MeasurementUnit } from "@/types/revenue/revenue-unit";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CalculationType = "FIXED" | "PERCENTAGE" | "PER_UNIT" | "RANGE" | "FORMULA";

type RoundingRule = "NONE" | "ROUND_UP" | "ROUND_DOWN" | "NEAREST";

interface Condition {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "greater_than"
    | "greater_than_or_equal"
    | "less_than"
    | "less_than_or_equal";
  value: string;
}

interface TariffRuleForm {
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

// Another rule already saved for this service — passed in so this form can
// warn about priority/execution-order conflicts instead of letting two rules
// silently collide at save time.
interface ExistingRule {
  name: string;
  priority: number;
  executionOrder: number;
}

// Stand-in for what would normally be fetched for the selected service.
// Replace with real data (e.g. loaded by serviceId) when wiring this up.
const DEFAULT_EXISTING_RULES: ExistingRule[] = [
  { name: "Base Fee", priority: 1, executionOrder: 1 },
  { name: "Late Penalty", priority: 1, executionOrder: 2 },
  { name: "VAT", priority: 1, executionOrder: 3 },
];

// Clamps free-typed input to a whole number of at least 1 — priority and
// execution order are step positions, so 0, negative, or fractional values
// have no meaningful interpretation here.
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

const SERVICE_OPTIONS = [
  { value: "property_tax", label: "Property Tax" },
  { value: "business_license", label: "Business License Fee" },
  { value: "vehicle_registration", label: "Vehicle Registration" },
  { value: "waste_management", label: "Waste Management Levy" },
];

const VERSION_OPTIONS = [
  { value: "2026-v1", label: "2026 · v1 (Active)" },
  { value: "2025-v2", label: "2025 · v2 (Archived)" },
  { value: "2024-v1", label: "2024 · v1 (Archived)" },
];

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

// Formula placeholders and quick-insert variables change with the selected
// base field, so the example always matches a field that actually exists.
const FORMULA_EXAMPLES: Record<string, string> = {
  property_value: "property_value * 0.025 + base_fee",
  area: "area * rate_per_sqm",
  employee_count: "employee_count * levy_per_employee",
  vehicle_count: "vehicle_count * annual_fee",
  "": "base * rate + adjustment",
};

const FORMULA_VARIABLES: Record<string, string[]> = {
  property_value: ["property_value", "base_fee", "tax_rate"],
  area: ["area", "rate_per_sqm", "penalty"],
  employee_count: ["employee_count", "levy_per_employee"],
  vehicle_count: ["vehicle_count", "annual_fee"],
  "": ["base", "rate", "adjustment"],
};

// Sample assessment values used purely to render a worked example inside the
// Formula Preview container — never sent anywhere, just illustrative.
const SAMPLE_VALUES: Record<string, Record<string, number>> = {
  property_value: { property_value: 1_200_000, base_fee: 200, tax_rate: 0.025 },
  area: { area: 120, rate_per_sqm: 25, penalty: 0 },
  employee_count: { employee_count: 15, levy_per_employee: 150 },
  vehicle_count: { vehicle_count: 3, annual_fee: 800 },
  "": { base: 1000, rate: 0.1, adjustment: 0 },
};

// Splits a formula into tokens so variables, numbers, and operators can each
// be styled distinctly in the preview — turning the raw string into
// something that reads like an actual calculation, not just typed text.
function tokenizeFormula(formula: string): string[] {
  return formula.match(/[a-zA-Z_][a-zA-Z0-9_]*|\d+\.?\d*|[+\-*/()]|\s+/g) ?? [];
}

// Substitutes sample values into the formula and evaluates the arithmetic.
// Only digits, decimal points, parentheses, whitespace, and + - * / survive
// the substitution — anything else causes it to bail out to null rather than
// risk evaluating arbitrary text.
function safeEvaluateFormula(formula: string, values: Record<string, number>): number | null {
  if (!formula.trim()) return null;

  let expression = formula;
  const keys = Object.keys(values).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    expression = expression.replace(new RegExp(`\\b${key}\\b`, "g"), String(values[key]));
  }

  if (!/^[0-9+\-*/().\s]+$/.test(expression)) return null;

  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expression});`)();
    return typeof result === "number" && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

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
  if (value === "" || value === undefined || value === null) return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return `ETB ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function baseFieldLabel(field?: BaseField | null): string {
  return field ? field.name.toLowerCase() : "the assessed base";
}

function calculationSentence(
  form: TariffRuleForm,
  baseField?: BaseField | null,
  unit?: MeasurementUnit | null
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
      return form.formula
        ? `the formula ${form.formula}`
        : `a formula based on ${baseFieldLabel(baseField)} (not written yet)`;

    default:
      return "no calculation method selected yet";
  }
}

function calculationConfigComplete(form: TariffRuleForm): boolean {
  switch (form.calculationType) {
    case "FIXED":
      return !!form.amount;

    case "PERCENTAGE":
      return !!form.percentage && !!form.baseFieldId;

    case "PER_UNIT":
      return !!form.amount && !!form.measurementUnitId && !!form.baseFieldId;

    case "RANGE":
      return !!form.amount && !!form.minValue && !!form.maxValue && !!form.baseFieldId;

    case "FORMULA":
      return !!form.formula && !!form.baseFieldId;

    default:
      return false;
  }
}

// A condition only means something once every field on it is filled in —
// partially typed rows shouldn't silently count as "done".
function conditionsComplete(conditions: Condition[]): boolean {
  return conditions.every((c) => c.field.trim() && c.value.trim());
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CreateTariffRulePage({
  existingRules = DEFAULT_EXISTING_RULES,
  tariffVersionId = "2026-v1",
}: {
  existingRules?: ExistingRule[];
  tariffVersionId?: string;
} = {}) {
  const [activeStep, setActiveStep] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
  const [publishState, setPublishState] = useState<"idle" | "success">("idle");

  const [form, setForm] = useState<TariffRuleForm>({
    name: "",
    description: "",

    serviceId: "",
    tariffVersionId,

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
  });

  const [selectedBaseField, setSelectedBaseField] = useState<BaseField | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<MeasurementUnit | null>(null);
  const [selectedService, setSelectedService] = useState<RevenueService | null>(null);

  const goToStep = (index: number) => {
    setActiveStep(index);
    setVisitedSteps((prev) => new Set(prev).add(index));
  };

  const updateField = <K extends keyof TariffRuleForm>(key: K, value: TariffRuleForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addCondition = () => {
    setForm((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { field: "", operator: "equals", value: "" }],
    }));
  };

  const updateCondition = <K extends keyof Condition>(index: number, key: K, value: Condition[K]) => {
    setForm((prev) => {
      const conditions = [...prev.conditions];
      conditions[index] = { ...conditions[index], [key]: value };
      return { ...prev, conditions };
    });
  };

  const removeCondition = (index: number) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const insertFormulaToken = (token: string) => {
    setForm((prev) => ({
      ...prev,
      formula: prev.formula ? `${prev.formula} ${token}` : token,
    }));
  };

  const useFormulaExample = () => {
    const example = FORMULA_EXAMPLES[form.baseFieldId!] ?? FORMULA_EXAMPLES[""];
    updateField("formula", example);
  };

  const calculationComplete = useMemo(() => calculationConfigComplete(form), [form]);
  const rangeIsValid =
    form.calculationType !== "RANGE" ||
    !form.minValue ||
    !form.maxValue ||
    Number(form.minValue) < Number(form.maxValue);

  const isStepComplete = (index: number): boolean => {
    if (index === 0) return form.name.trim().length > 0;
    if (index === 1) return !!form.calculationType && calculationComplete && rangeIsValid;
    if (index === 2) return visitedSteps.has(2) && conditionsComplete(form.conditions);
    if (index === 3) return visitedSteps.has(3);
    return false;
  };

  const completedStepCount = steps.filter((_, i) => isStepComplete(i)).length;
  const canPublish = isStepComplete(0) && isStepComplete(1) && conditionsComplete(form.conditions);

  const serviceLabel = SERVICE_OPTIONS.find((s) => s.value === form.serviceId)?.label ?? "No service selected";
  const versionLabel = VERSION_OPTIONS.find((v) => v.value === form.tariffVersionId)?.label ?? "No version selected";

  const priorityCollision = existingRules.find((r) => r.priority === form.priority);
  const executionOrderCollision = existingRules.find((r) => r.executionOrder === form.executionOrder);

  const conditionsSentence =
    form.conditions.length === 0
      ? "Applies to every matching transaction"
      : form.conditions
          .map((c) => `${c.field || "field"} ${OPERATOR_LABELS[c.operator]} ${c.value || "value"}`)
          .join(", and ");

  const controlLines = useMemo(() => {
    const lines: string[] = [];
    if (form.minimumAmount) lines.push(`Minimum charge of ${formatCurrency(form.minimumAmount)}`);
    if (form.maximumAmount) lines.push(`Capped at ${formatCurrency(form.maximumAmount)}`);
    lines.push(ROUNDING_LABELS[form.roundingRule]);
    return lines;
  }, [form.minimumAmount, form.maximumAmount, form.roundingRule]);

  const handlePublish = () => {
    if (!canPublish) return;
    console.log(form);
    setPublishState("success");
    setTimeout(() => setPublishState("idle"), 2500);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6">
        {/* HEADER */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Tariff Rule</h1>
            <p className="mt-1 text-muted-foreground">
              Configure automated revenue calculation logic for a service
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
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:hidden" role="tablist" aria-label="Form steps">
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
                {complete && activeStep !== index ? <Check className="h-3 w-3" /> : <span>{index + 1}</span>}
                {step.title}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT STEPS — desktop only */}
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
                      <p className={`truncate text-xs ${active ? "opacity-80" : "text-muted-foreground"}`}>
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
              {/* STEP 0 — RULE INFORMATION */}
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

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        Lower numbers match first — e.g. 1 for a specific rule, 10 for a general fallback.
                      </p>
                      {priorityCollision && (
                        <p className="flex items-start gap-1.5 text-xs text-amber-700">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          Priority {form.priority} is already used by {priorityCollision.name}. Fine if
                          they can never match the same case — otherwise pick a different value.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="execution-order">Execution Order</Label>
                      <Input
                        id="execution-order"
                        type="number"
                        min={1}
                        step={1}
                        value={form.executionOrder}
                        onChange={(e) => updateField("executionOrder", toPositiveInt(e.target.value))}
                        className="w-full py-4"
                      />
                      <p className="text-xs text-muted-foreground">
                        Sequence when rules stack — e.g. 1 base fee, 2 penalty, 3 VAT.
                      </p>
                      {executionOrderCollision && (
                        <p className="flex items-start gap-1.5 text-xs text-amber-700">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          Step {form.executionOrder} is already used by {executionOrderCollision.name}.
                          Two rules can't safely share one step — choose a different order.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="font-medium">Rule Active</p>
                      <p className="text-sm text-muted-foreground">Enable tariff calculation</p>
                    </div>
                    <Switch checked={form.isActive} onCheckedChange={(v) => updateField("isActive", v)} />
                  </div>
                </>
              )}

              {/* STEP 1 — CALCULATION METHOD */}
              {activeStep === 1 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {calculationOptions.map((option) => {
                    const Icon = option.icon;
                    const selected = form.calculationType === option.value;

                    return (
                      <button
                        key={option.value}
                        onClick={() => updateField("calculationType", option.value)}
                        aria-pressed={selected}
                        className={`rounded-xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                          selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex gap-3">
                          <Icon className={`h-5 w-5 shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
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
              )}

              {/* STEP 1 — CALCULATION CONFIGURATION */}
              {activeStep === 1 && form.calculationType && (
                <div className="space-y-5 rounded-xl border bg-muted/20 p-5">
                  <h3 className="font-semibold">Calculation Configuration</h3>

                  {["PERCENTAGE", "PER_UNIT", "RANGE", "FORMULA"].includes(form.calculationType) && (
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

                  {form.calculationType === "FORMULA" && (() => {
                    const variables = FORMULA_VARIABLES[form.baseFieldId!] ?? FORMULA_VARIABLES[""];
                    const sampleValues = SAMPLE_VALUES[form.baseFieldId!] ?? SAMPLE_VALUES[""];
                    const exampleFormula = FORMULA_EXAMPLES[form.baseFieldId!] ?? FORMULA_EXAMPLES[""];
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

                        {/* <div className="flex flex-wrap items-center gap-1.5">
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
                        </div> */}

                        {/* FORMULA PREVIEW — a receipt-style container that renders the
                            formula as a real calculation: variables and numbers are
                            highlighted, and a worked example shows what it actually
                            produces, using either the typed formula or, until one is
                            entered, the example for the selected base field. */}
                        <div className="space-y-3 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                              Formula Preview
                            </p>
                            <Receipt className="h-4 w-4 text-emerald-700" />
                          </div>

                          <p className={`break-all font-mono text-base leading-relaxed ${isPlaceholder ? "opacity-60" : ""}`}>
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
                              return <span className="font-semibold text-emerald-700" key={i}>{token}</span>;
                            })}
                          </p>

                          {isPlaceholder && (
                            <p className="text-xs text-muted-foreground">
                              Showing the example for {baseFieldLabel(selectedBaseField)} — type your own
                              formula above to replace it.
                            </p>
                          )}

                          <Separator className="border-dashed border-emerald-200" />

                          {/* <div className="space-y-1">
                            {Object.entries(sampleValues)
                              .filter(([key]) => variables.includes(key))
                              .map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span className="font-mono">{key}</span>
                                  <span className="font-mono">{value.toLocaleString()}</span>
                                </div>
                              ))}
                          </div> */}

                          {/* <div className="flex items-center justify-between border-t border-dashed border-emerald-300 pt-2">
                            <span className="text-sm font-medium">Example result</span>
                            <span className="font-mono text-lg font-semibold text-emerald-700">
                              {previewResult !== null ? formatCurrency(previewResult.toFixed(2)) : "—"}
                            </span>
                          </div> */}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* STEP 2 — CONDITIONS */}
              {activeStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Define when this tariff rule should be applied. Leave empty to apply it to every
                    matching transaction.
                  </p>

                  {form.conditions.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
                      <Filter className="h-6 w-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No conditions yet — this rule applies universally.</p>
                      <Button variant="outline" onClick={addCondition}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Condition
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {form.conditions.map((condition, index) => {
                          const incomplete = !condition.field.trim() || !condition.value.trim();
                          return (
                            <div key={index} className="space-y-2 rounded-lg border p-3">
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

                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                                <Input
                                  className="sm:col-span-4"
                                  placeholder="field"
                                  aria-label="Condition field"
                                  value={condition.field}
                                  onChange={(e) => updateCondition(index, "field", e.target.value)}
                                />

                                <Select
                                  value={condition.operator}
                                  onValueChange={(v) => updateCondition(index, "operator", v as Condition["operator"])}
                                >
                                  <SelectTrigger className="sm:col-span-4" aria-label="Condition operator">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="equals">Equals</SelectItem>
                                    <SelectItem value="not_equals">Not Equals</SelectItem>
                                    <SelectItem value="contains">Contains</SelectItem>
                                    <SelectItem value="greater_than">Greater Than</SelectItem>
                                    <SelectItem value="greater_than_or_equal">Greater Than or Equal</SelectItem>
                                    <SelectItem value="less_than">Less Than</SelectItem>
                                    <SelectItem value="less_than_or_equal">Less Than or Equal</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Input
                                  className="sm:col-span-3"
                                  placeholder="value"
                                  aria-label="Condition value"
                                  value={condition.value}
                                  onChange={(e) => updateCondition(index, "value", e.target.value)}
                                />

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="sm:col-span-1"
                                  aria-label="Remove condition"
                                  onClick={() => removeCondition(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>

                              <p className="inline-block rounded bg-emerald-50 px-2 py-1 font-mono text-xs text-emerald-700">
                                {condition.field || "field"} {OPERATOR_LABELS[condition.operator]}{" "}
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

              {/* STEP 3 — FINANCIAL CONTROLS */}
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
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Rounding Rule</Label>
                    <Select value={form.roundingRule} onValueChange={(v) => updateField("roundingRule", v as RoundingRule)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">None</SelectItem>
                        <SelectItem value="ROUND_UP">Round Up</SelectItem>
                        <SelectItem value="ROUND_DOWN">Round Down</SelectItem>
                        <SelectItem value="NEAREST">Nearest</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{ROUNDING_LABELS[form.roundingRule]}</p>
                  </div>

                  {(form.minimumAmount || form.maximumAmount) && (
                    <div className="rounded-lg bg-muted p-4 text-sm">
                      Every charge from this rule will stay
                      {form.minimumAmount && (
                        <>
                          {" "}
                          at or above <span className="font-mono text-emerald-700">{formatCurrency(form.minimumAmount)}</span>
                        </>
                      )}
                      {form.minimumAmount && form.maximumAmount && " and"}
                      {form.maximumAmount && (
                        <>
                          {" "}
                          at or below <span className="font-mono text-emerald-700">{formatCurrency(form.maximumAmount)}</span>
                        </>
                      )}
                      .
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4 — REVIEW */}
              {activeStep === 4 && (
                <div className="space-y-5">
                  {!canPublish && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        This rule isn't ready to publish yet. Check that the rule name, calculation method,
                        and any conditions you've started are complete.
                      </span>
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
                    <p className="text-sm">This rule charges {calculationSentence(form, selectedBaseField, selectedUnit)}.</p>
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <p className="mb-2 font-medium">Conditions</p>
                    {form.conditions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No conditions</p>
                    ) : (
                      form.conditions.map((c, i) => (
                        <p key={i} className="font-mono text-sm">
                          {i === 0 ? "IF" : "AND"} {c.field || "field"} {OPERATOR_LABELS[c.operator]} {c.value || "value"}
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
                <p className="text-xs text-muted-foreground">{serviceLabel}</p>
                <p className="font-semibold">{form.name || "Untitled rule"}</p>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Priority &amp; Order</p>
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
                <p>Charges {calculationSentence(form, selectedBaseField, selectedUnit)}.</p>
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

        {/* FOOTER */}
        <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t pt-5 sm:flex-row sm:items-center">
          <Button variant="outline" onClick={() => goToStep(Math.max(0, activeStep - 1))} disabled={activeStep === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            {publishState === "success" && (
              <span className="flex items-center justify-center gap-1 text-sm text-emerald-700">
                <Check className="h-4 w-4" />
                Rule published
              </span>
            )}
            {publishState === "idle" && !canPublish && activeStep === steps.length - 1 && (
              <span className="text-center text-xs text-muted-foreground sm:text-left">
                Complete rule information and calculation logic to publish.
              </span>
            )}

            <Button variant="outline" onClick={() => console.log("draft saved", form)}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>

            {activeStep < steps.length - 1 ? (
              <Button onClick={() => goToStep(activeStep + 1)}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handlePublish} disabled={!canPublish}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Publish Rule
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}