"use client";

import { useState } from "react";

import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  Info,
  Landmark,
  Percent,
  Scale,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  CalculationBasis,
  InterestRuleFormValues,
} from "@/types/revenue/interestRule";

import {
  EMPTY_INTEREST_RULE_FORM,
} from "@/types/revenue/interestRule";

// =====================================================
// TYPES
// =====================================================

type InterestRuleFormProps = {
  mode: "create" | "edit";

  initialValues?: InterestRuleFormValues;

  isSubmitting?: boolean;

  onSubmit: (
    values: InterestRuleFormValues,
  ) => void | Promise<void>;

  onCancel?: () => void;
};

// =====================================================
// CONSTANTS
// =====================================================

const FIXED_RATE_PERIOD = "YEAR";
const FIXED_CALCULATION_METHOD = "SIMPLE";
const FIXED_ACCRUAL_PERIOD = "MONTH";

// =====================================================
// SMALL UI COMPONENTS
// =====================================================

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div>
        <h2 className="text-base font-semibold tracking-tight">
          {title}
        </h2>

        <p className="mt-0.5 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function RuleBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <Check className="h-3 w-3" />
      {children}
    </span>
  );
}

// =====================================================
// COMPONENT
// =====================================================

export function InterestRuleForm({
  mode,
  initialValues,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: InterestRuleFormProps) {
  const [form, setForm] =
    useState<InterestRuleFormValues>({
      ...EMPTY_INTEREST_RULE_FORM,
      ...(initialValues ?? {}),
      rate_period: FIXED_RATE_PERIOD,
      calculation_method:
        FIXED_CALCULATION_METHOD,
    });

  const [errors, setErrors] = useState<
    Partial<
      Record<
        keyof InterestRuleFormValues,
        string
      >
    >
  >({});

  // ===================================================
  // UPDATE FIELD
  // ===================================================

  const updateField = <
    K extends keyof InterestRuleFormValues,
  >(
    field: K,
    value: InterestRuleFormValues[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  // ===================================================
  // VALIDATION
  // ===================================================

  const validate = () => {
    const nextErrors: Partial<
      Record<
        keyof InterestRuleFormValues,
        string
      >
    > = {};

    const rate = Number(form.rate);

    if (!form.rate.trim()) {
      nextErrors.rate =
        "Annual bank interest rate is required.";
    } else if (
      !Number.isFinite(rate) ||
      rate < 0
    ) {
      nextErrors.rate =
        "Enter a valid non-negative annual interest rate.";
    }

    if (!form.effective_from) {
      nextErrors.effective_from =
        "Effective from date is required.";
    }

    if (
      form.effective_to &&
      form.effective_from &&
      form.effective_to <
        form.effective_from
    ) {
      nextErrors.effective_to =
        "Effective to cannot be before effective from.";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0
    );
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    /*
     * These values are fixed by the business rule.
     * Do not allow the UI to submit another period or
     * calculation method.
     */
    const payload: InterestRuleFormValues = {
      ...form,
      rate_period: FIXED_RATE_PERIOD,
      calculation_method:
        FIXED_CALCULATION_METHOD,
    };

    await onSubmit(payload);
  };

  // ===================================================
  // DERIVED PREVIEW
  // ===================================================

  const annualRate = Number(form.rate);

  const monthlyRate =
    Number.isFinite(annualRate)
      ? annualRate / 12
      : 0;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-5xl space-y-6 pb-8"
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() =>{}
            // router.back()
          }
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-muted/50">
            <Landmark className="h-5 w-5 text-foreground" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {mode === "create"
                  ? "Create Interest Rule"
                  : "Update Interest Rule"}
              </h1>

              <span className="rounded-full border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                Global Rule
              </span>
            </div>

            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Configure the annual bank interest rate used
              across all revenue services for overdue
              obligations.
            </p>
          </div>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Global Interest Policy
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {Object.keys(errors).length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />

          <div>
            <p className="font-medium text-destructive">
              Please review the interest rule
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Some required information is missing or
              invalid.
            </p>
          </div>
        </div>
      )}

      {/* =================================================
          POLICY SUMMARY
      ================================================= */}

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b bg-muted/20 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />

            <p className="text-sm font-semibold">
              Interest Policy
            </p>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-3">
          {/* Annual */}

          <div className="p-5 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Annual Bank Rate
            </p>

            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">
                {form.rate || "—"}
              </span>

              <span className="text-sm font-medium text-muted-foreground">
                %
              </span>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Legally applicable annual rate
            </p>
          </div>

          {/* Monthly */}

          <div className="border-t p-5 md:border-l md:border-t-0 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Monthly Equivalent
            </p>

            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">
                {Number.isFinite(monthlyRate)
                  ? monthlyRate.toFixed(4)
                  : "—"}
              </span>

              <span className="text-sm font-medium text-muted-foreground">
                %
              </span>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Annual rate ÷ 12
            </p>
          </div>

          {/* Accrual */}

          <div className="border-t p-5 md:border-l md:border-t-0 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Accrual
            </p>

            <div className="mt-2 flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-muted-foreground" />

              <span className="text-2xl font-bold tracking-tight">
                Monthly
              </span>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Based on months of late payment
            </p>
          </div>
        </div>
      </section>

      {/* =================================================
          RATE CONFIGURATION
      ================================================= */}

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <SectionHeader
          icon={Percent}
          title="Annual Bank Rate"
          description="Configure the single annual interest rate applied globally across all revenue services."
        />

        <div className="mt-6">
          <div className="rounded-xl border bg-muted/20 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </div>

              <div>
                <p className="font-medium">
                  Global Annual Bank Rate
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  This rate is not associated with an
                  individual revenue service. The same annual
                  bank rate is used for all applicable
                  overdue revenue obligations.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {/* Rate */}

            <div className="grid gap-2">
              <label
                htmlFor="interest-rate"
                className="text-sm font-medium"
              >
                Annual Interest Rate (%)
                <span className="ml-1 text-destructive">
                  *
                </span>
              </label>

              <div className="relative">
                <Input
                  id="interest-rate"
                  type="number"
                  inputMode="decimal"
                  step="0.0001"
                  min="0"
                  value={form.rate}
                  onChange={(event) =>
                    updateField(
                      "rate",
                      event.target.value,
                    )
                  }
                  placeholder="24.7250"
                  className="h-11 pr-10 text-lg font-semibold"
                  disabled={isSubmitting}
                />

                <Percent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              {errors.rate ? (
                <p className="text-xs text-destructive">
                  {errors.rate}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Example: 24.7250 represents an annual
                  interest rate of 24.725%.
                </p>
              )}
            </div>

            {/* Fixed Rate Period */}

            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Rate Period
              </label>

              <div className="flex h-11 items-center justify-between rounded-md border bg-muted/30 px-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />

                  <span className="text-sm font-medium">
                    Annual
                  </span>
                </div>

                <RuleBadge>
                  Fixed
                </RuleBadge>
              </div>

              <p className="text-xs text-muted-foreground">
                The bank rate is stored as an annual rate.
                Monthly interest is derived by the calculation
                engine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          CALCULATION CONFIGURATION
      ================================================= */}

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <SectionHeader
          icon={Scale}
          title="Interest Calculation"
          description="Define the monetary basis used when calculating interest for months of late payment."
        />

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {/* Fixed Calculation Method */}

          <div className="rounded-xl border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-muted-foreground" />

                <label className="text-sm font-medium">
                  Calculation Method
                </label>
              </div>

              <RuleBadge>
                Fixed
              </RuleBadge>
            </div>

            <div className="mt-3">
              <div className="flex h-11 items-center rounded-md border bg-muted/30 px-3">
                <span className="text-sm font-medium">
                  Simple Interest
                </span>
              </div>
            </div>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Interest is calculated from the applicable
              annual rate and the number of late-payment
              months. Compound interest is not configurable
              for this policy.
            </p>
          </div>

          {/* Fixed Accrual Period */}

          <div className="rounded-xl border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-muted-foreground" />

                <label className="text-sm font-medium">
                  Accrual Period
                </label>
              </div>

              <RuleBadge>
                Fixed
              </RuleBadge>
            </div>

            <div className="mt-3">
              <div className="flex h-11 items-center rounded-md border bg-muted/30 px-3">
                <span className="text-sm font-medium">
                  Monthly
                </span>
              </div>
            </div>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              The engine applies the annual rate according to
              the number of months the payment is overdue.
            </p>
          </div>
        </div>

        {/* Calculation Basis */}

        <div className="mt-5 rounded-xl border bg-background p-4">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-muted-foreground" />

            <label className="text-sm font-medium">
              Calculation Basis
            </label>
          </div>

          <div className="mt-3 max-w-md">
            <Select
              value={form.calculation_basis}
              onValueChange={(value) =>
                updateField(
                  "calculation_basis",
                  value as CalculationBasis,
                )
              }
              disabled={isSubmitting}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="PRINCIPAL">
                  Principal Amount
                </SelectItem>

                <SelectItem value="OUTSTANDING">
                  Outstanding Amount
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Determines the monetary amount to which the
            calculated interest rate is applied.
          </p>
        </div>

        {/* Calculation Explanation */}

        <div className="mt-5 rounded-xl border bg-muted/20 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-background">
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>

            <div>
              <p className="text-sm font-medium">
                How the interest engine uses this rule
              </p>

              <div className="mt-2 text-sm leading-6 text-muted-foreground">
                <p>
                  <strong className="text-foreground">
                    Annual rate
                  </strong>{" "}
                  → derive monthly rate → determine the
                  number of late-payment months → calculate
                  interest on the configured basis.
                </p>

                <p className="mt-2">
                  The number of late-payment months is
                  determined by the calculation engine from
                  the applicable payment dates. It is not
                  entered in this form.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          EFFECTIVE PERIOD
      ================================================= */}

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <SectionHeader
          icon={CalendarDays}
          title="Effective Period"
          description="Control when this annual bank interest policy is legally applicable."
        />

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {/* From */}

          <div className="grid gap-2">
            <label
              htmlFor="effective-from"
              className="text-sm font-medium"
            >
              Effective From
              <span className="ml-1 text-destructive">
                *
              </span>
            </label>

            <Input
              id="effective-from"
              type="date"
              value={form.effective_from}
              onChange={(event) =>
                updateField(
                  "effective_from",
                  event.target.value,
                )
              }
              className="h-11"
              disabled={isSubmitting}
            />

            {errors.effective_from ? (
              <p className="text-xs text-destructive">
                {errors.effective_from}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                First date on which this bank rate can be
                applied.
              </p>
            )}
          </div>

          {/* To */}

          <div className="grid gap-2">
            <label
              htmlFor="effective-to"
              className="text-sm font-medium"
            >
              Effective To
            </label>

            <Input
              id="effective-to"
              type="date"
              value={form.effective_to}
              min={
                form.effective_from ||
                undefined
              }
              onChange={(event) =>
                updateField(
                  "effective_to",
                  event.target.value,
                )
              }
              className="h-11"
              disabled={isSubmitting}
            />

            {errors.effective_to ? (
              <p className="text-xs text-destructive">
                {errors.effective_to}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Leave empty when the rate remains effective
                until replaced by another rule.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* =================================================
          LEGAL INFORMATION
      ================================================= */}

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <SectionHeader
          icon={FileText}
          title="Legal Information"
          description="Record the legal or regulatory authority supporting this bank interest rate."
        />

        <div className="mt-6 space-y-5">
          {/* Legal Reference */}

          <div className="grid gap-2">
            <label
              htmlFor="legal-reference"
              className="text-sm font-medium"
            >
              Legal Reference
            </label>

            <Input
              id="legal-reference"
              value={form.legal_reference}
              onChange={(event) =>
                updateField(
                  "legal_reference",
                  event.target.value,
                )
              }
              placeholder="e.g. Revenue Regulation 2026, Article 18"
              className="h-11"
              disabled={isSubmitting}
            />

            <p className="text-xs text-muted-foreground">
              Law, regulation, directive, article, bank
              directive, or other legal authority establishing
              the applicable rate.
            </p>
          </div>

          {/* Description */}

          <div className="grid gap-2">
            <label
              htmlFor="description"
              className="text-sm font-medium"
            >
              Description
            </label>

            <textarea
              id="description"
              value={form.description}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value,
                )
              }
              placeholder="Describe the legal and operational purpose of this interest policy..."
              rows={4}
              disabled={isSubmitting}
              className="
                min-h-[120px]
                w-full
                rounded-md
                border
                bg-background
                px-3
                py-2
                text-sm
                outline-none
                ring-offset-background
                placeholder:text-muted-foreground
                focus-visible:ring-2
                focus-visible:ring-ring
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            />
          </div>
        </div>
      </section>

      {/* =================================================
          FINAL SUMMARY
      ================================================= */}

      <section className="rounded-xl border bg-muted/20 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
            <ShieldCheck className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-medium">
              Configuration Summary
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              This rule represents one global annual bank
              interest policy for all applicable revenue
              services.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <p className="text-xs text-muted-foreground">
                  Annual Rate
                </p>

                <p className="mt-0.5 font-semibold">
                  {form.rate || "—"}%
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Monthly Equivalent
                </p>

                <p className="mt-0.5 font-semibold">
                  {Number.isFinite(monthlyRate)
                    ? monthlyRate.toFixed(4)
                    : "—"}
                  %
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Method
                </p>

                <p className="mt-0.5 font-semibold">
                  Simple
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Accrual
                </p>

                <p className="mt-0.5 font-semibold">
                  Monthly
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Basis
                </p>

                <p className="mt-0.5 font-semibold">
                  {form.calculation_basis ===
                  "OUTSTANDING"
                    ? "Outstanding"
                    : "Principal"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="sticky bottom-0 z-10 -mx-1 border-t bg-background/95 px-1 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-10"
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 min-w-[160px]"
          >
            {isSubmitting
              ? "Saving..."
              : mode === "create"
                ? "Create Interest Rule"
                : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}