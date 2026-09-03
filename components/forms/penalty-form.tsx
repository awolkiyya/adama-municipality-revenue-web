"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  FileText,
  Info,
  Landmark,
  Loader2,
  Percent,
  Save,
  Scale,
  ShieldAlert,
  Sparkles,
  ToggleLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

/* ================================================================
   TYPES
================================================================ */

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

export type PenaltyFormProps = {
  mode: "create" | "edit";

  initialValues: PenaltyFormValues;

  isSubmitting?: boolean;

  onSubmit: (
    values: PenaltyFormValues,
  ) => void | Promise<void>;

  onCancel?: () => void;
};

/* ================================================================
   CONSTANTS
================================================================ */

const DEFAULT_INITIAL_RATE = "5";
const DEFAULT_INCREMENT_RATE = "2";
const DEFAULT_MAXIMUM_RATE = "25";
const DEFAULT_START_TYPE: StartType =
  "FIXED_FISCAL_MONTH";
const DEFAULT_START_FISCAL_MONTH = "7";

/* ================================================================
   SMALL UI COMPONENTS
================================================================ */

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

function RateCard({
  icon: Icon,
  title,
  value,
  description,
  onChange,
  disabled,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  description: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-xl border bg-background p-4 transition-colors hover:bg-muted/20">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        <Label className="text-sm font-medium">
          {title}
        </Label>
      </div>

      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-11 pr-10 text-lg font-semibold"
          disabled={disabled}
        />

        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
          %
        </span>
      </div>

      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/* ================================================================
   COMPONENT
================================================================ */

export function PenaltyForm({
  mode,
  initialValues,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: PenaltyFormProps) {
  const [form, setForm] =
    useState<PenaltyFormValues>(initialValues);

  const [error, setError] =
    useState<string | null>(null);

  /* ==============================================================
     SYNC INITIAL VALUES
  ============================================================== */

  useEffect(() => {
    setForm({
      ...initialValues,

      initial_rate:
        initialValues.initial_rate ||
        DEFAULT_INITIAL_RATE,

      increment_rate:
        initialValues.increment_rate ||
        DEFAULT_INCREMENT_RATE,

      maximum_rate:
        initialValues.maximum_rate ||
        DEFAULT_MAXIMUM_RATE,

      start_type:
        initialValues.start_type ||
        DEFAULT_START_TYPE,

      start_fiscal_month:
        initialValues.start_fiscal_month ||
        DEFAULT_START_FISCAL_MONTH,

      increment_period: "MONTH",
    });

    setError(null);
  }, [initialValues]);

  /* ==============================================================
     FIELD UPDATE
  ============================================================== */

  const updateField = <
    K extends keyof PenaltyFormValues,
  >(
    field: K,
    value: PenaltyFormValues[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError(null);
  };

  /* ==============================================================
     LIVE PENALTY PREVIEW
  ============================================================== */

  const penaltyPreview = useMemo(() => {
    const initial = Number(form.initial_rate);
    const increment = Number(form.increment_rate);
    const maximum = Number(form.maximum_rate);

    if (
      !Number.isFinite(initial) ||
      !Number.isFinite(increment) ||
      !Number.isFinite(maximum)
    ) {
      return [];
    }

    return Array.from(
      { length: 10 },
      (_, index) => {
        const month = index + 1;

        return Math.min(
          initial + (month - 1) * increment,
          maximum,
        );
      },
    );
  }, [
    form.initial_rate,
    form.increment_rate,
    form.maximum_rate,
  ]);

  /* ==============================================================
     VALIDATION HELPERS
  ============================================================== */

  const isValidNonNegativeNumber = (
    value: string,
  ): boolean => {
    if (!value.trim()) {
      return false;
    }

    const number = Number(value);

    return (
      Number.isFinite(number) &&
      number >= 0
    );
  };

  const isValidPositiveInteger = (
    value: string,
  ): boolean => {
    if (!value.trim()) {
      return false;
    }

    const number = Number(value);

    return (
      Number.isInteger(number) &&
      number >= 1
    );
  };

  /* ==============================================================
     SUBMIT
  ============================================================== */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError(null);

    /* ------------------------------------------------------------
       BASIC VALIDATION
    ------------------------------------------------------------ */

    if (!form.name.trim()) {
      setError(
        "Penalty name is required.",
      );
      return;
    }

    if (!form.effective_from) {
      setError(
        "Effective from date is required.",
      );
      return;
    }

    if (
      form.effective_to &&
      form.effective_to < form.effective_from
    ) {
      setError(
        "Effective to date cannot be before effective from date.",
      );
      return;
    }

    /* ------------------------------------------------------------
       RATE VALIDATION
    ------------------------------------------------------------ */

    if (
      !isValidNonNegativeNumber(
        form.initial_rate,
      )
    ) {
      setError(
        "A valid non-negative initial rate is required.",
      );
      return;
    }

    if (
      !isValidNonNegativeNumber(
        form.increment_rate,
      )
    ) {
      setError(
        "A valid non-negative increment rate is required.",
      );
      return;
    }

    if (
      !isValidNonNegativeNumber(
        form.maximum_rate,
      )
    ) {
      setError(
        "A valid non-negative maximum rate is required.",
      );
      return;
    }

    const initialRate = Number(
      form.initial_rate,
    );

    const incrementRate = Number(
      form.increment_rate,
    );

    const maximumRate = Number(
      form.maximum_rate,
    );

    if (maximumRate < initialRate) {
      setError(
        "Maximum rate cannot be lower than the initial rate.",
      );
      return;
    }

    if (incrementRate < 0) {
      setError(
        "Increment rate cannot be negative.",
      );
      return;
    }

    /* ------------------------------------------------------------
       START RULE VALIDATION
    ------------------------------------------------------------ */

    if (
      form.start_type ===
      "FIXED_FISCAL_MONTH"
    ) {
      if (
        !isValidPositiveInteger(
          form.start_fiscal_month,
        )
      ) {
        setError(
          "A valid Ethiopian fiscal month is required.",
        );
        return;
      }

      const fiscalMonth = Number(
        form.start_fiscal_month,
      );

      if (
        fiscalMonth < 1 ||
        fiscalMonth > 13
      ) {
        setError(
          "Fiscal month must be between 1 and 13.",
        );
        return;
      }
    }

    /* ------------------------------------------------------------
       NORMALIZE PAYLOAD
    ------------------------------------------------------------ */

    const payload: PenaltyFormValues = {
      ...form,

      start_fiscal_month:
        form.start_type ===
        "FIXED_FISCAL_MONTH"
          ? form.start_fiscal_month
          : "",

      increment_period: "MONTH",
    };

    await onSubmit(payload);
  };

  /* ================================================================
     RENDER
  ================================================================ */

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-5xl space-y-6 pb-8"
    >
      {/* ============================================================
          PAGE HEADER
      ============================================================ */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-muted/50">
            <ShieldAlert className="h-5 w-5 text-foreground" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {mode === "create"
                  ? "Create Penalty Rule"
                  : "Update Penalty Rule"}
              </h1>

              <span className="rounded-full border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                Global Rule
              </span>
            </div>

            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Configure the late-payment penalty policy
              used by the assessment engine.
            </p>
          </div>
        </div>

        {/* STATUS BADGE */}

        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
            form.is_active
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              form.is_active
                ? "bg-emerald-500"
                : "bg-muted-foreground"
            }`}
          />

          {form.is_active
            ? "Active"
            : "Inactive"}
        </div>
      </div>

      {/* ============================================================
          ERROR
      ============================================================ */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />

          <div className="min-w-0">
            <p className="font-medium text-destructive">
              Unable to save penalty rule
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* ============================================================
          RULE SUMMARY / HERO
      ============================================================ */}

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b bg-muted/20 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />

            <p className="text-sm font-semibold">
              Penalty Policy Preview
            </p>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[1fr_auto_1fr]">
          {/* START */}

          <div className="p-5 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Starts
            </p>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">
                {form.start_type ===
                "FIXED_FISCAL_MONTH"
                  ? `Month ${form.start_fiscal_month || "—"}`
                  : "Agreement"}
              </span>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {form.start_type ===
              "FIXED_FISCAL_MONTH"
                ? "Ethiopian fiscal calendar"
                : "Agreement date"}
            </p>
          </div>

          {/* DIVIDER */}

          <div className="hidden items-center md:flex">
            <div className="h-12 w-px bg-border" />
          </div>

          {/* PROGRESSION */}

          <div className="border-t p-5 md:border-t-0 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Progression
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {penaltyPreview
                .slice(0, 6)
                .map((rate, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2"
                  >
                    <span className="rounded-md border bg-muted/40 px-2 py-1 text-sm font-semibold">
                      {rate}%
                    </span>

                    {index < 5 && (
                      <span className="text-muted-foreground">
                        →
                      </span>
                    )}
                  </div>
                ))}
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Monthly increase, capped at{" "}
              {form.maximum_rate || "25"}%.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          BASIC INFORMATION
      ============================================================ */}

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <SectionHeader
          icon={FileText}
          title="Basic Information"
          description="Identify and describe the penalty policy."
        />

        <div className="mt-6 space-y-5">
          {/* NAME */}

          <div className="space-y-2">
            <Label htmlFor="name">
              Penalty Name{" "}
              <span className="text-destructive">
                *
              </span>
            </Label>

            <Input
              id="name"
              value={form.name}
              onChange={(event) =>
                updateField(
                  "name",
                  event.target.value,
                )
              }
              placeholder="e.g. Late Payment Penalty"
              className="h-11"
              disabled={isSubmitting}
            />

            <p className="text-xs text-muted-foreground">
              Use a clear administrative name that
              identifies this penalty policy.
            </p>
          </div>

          {/* DESCRIPTION */}

          <div className="space-y-2">
            <Label htmlFor="description">
              Description
            </Label>

            <Textarea
              id="description"
              value={form.description}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value,
                )
              }
              placeholder="Describe the purpose and application of this penalty rule..."
              rows={4}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </section>

      {/* ============================================================
          PENALTY PROGRESSION
      ============================================================ */}

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <SectionHeader
          icon={Percent}
          title="Penalty Progression"
          description="Define how the penalty increases during late payment."
        />

        {/* BUSINESS RULE */}

        <div className="mt-6 rounded-xl border bg-muted/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-background">
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>

            <div>
              <p className="text-sm font-medium">
                Standard progression
              </p>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                The penalty starts at{" "}
                <strong className="text-foreground">
                  {form.initial_rate || "5"}%
                </strong>
                , increases by{" "}
                <strong className="text-foreground">
                  {form.increment_rate || "2"} percentage
                  points
                </strong>{" "}
                for each late-payment month, and stops at{" "}
                <strong className="text-foreground">
                  {form.maximum_rate || "25"}%
                </strong>
                .
              </p>
            </div>
          </div>
        </div>

        {/* RATE CARDS */}

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <RateCard
            icon={Percent}
            title="Initial Rate"
            value={form.initial_rate}
            onChange={(value) =>
              updateField(
                "initial_rate",
                value,
              )
            }
            description="Penalty applied during the first penalty period."
            disabled={isSubmitting}
          />

          <RateCard
            icon={Clock3}
            title="Monthly Increment"
            value={form.increment_rate}
            onChange={(value) =>
              updateField(
                "increment_rate",
                value,
              )
            }
            description="Percentage-point increase for each late-payment month."
            disabled={isSubmitting}
          />

          <RateCard
            icon={Scale}
            title="Maximum Rate"
            value={form.maximum_rate}
            onChange={(value) =>
              updateField(
                "maximum_rate",
                value,
              )
            }
            description="Highest penalty rate allowed by this policy."
            disabled={isSubmitting}
          />
        </div>

        {/* CALCULATION CONFIGURATION */}

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {/* PERIOD */}

          <div className="rounded-xl border bg-background p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />

              <Label>
                Increment Period
              </Label>
            </div>

            <div className="mt-3">
              <Select
                value="MONTH"
                disabled
              >
                <SelectTrigger className="h-11 w-full py-5">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="MONTH">
                    Monthly
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              The penalty progression is calculated once
              for every late-payment month.
            </p>
          </div>

          {/* BASIS */}

          <div className="rounded-xl border bg-background p-4">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />

              <Label>
                Calculation Basis
              </Label>
            </div>

            <div className="mt-3">
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
                <SelectTrigger className="h-11 w-full py-5">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="PRINCIPAL">
                    Principal
                  </SelectItem>

                  <SelectItem value="OUTSTANDING">
                    Outstanding Balance
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Determines the amount to which the penalty
              percentage is applied.
            </p>
          </div>
        </div>

        {/* LIVE TABLE */}

        {penaltyPreview.length > 0 && (
          <div className="mt-5 overflow-hidden rounded-xl border">
            <div className="border-b bg-muted/20 px-4 py-3">
              <p className="text-sm font-medium">
                Monthly Rate Preview
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="grid min-w-[640px] grid-cols-10 divide-x">
                {penaltyPreview.map(
                  (rate, index) => (
                    <div
                      key={index}
                      className="p-3 text-center"
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Month {index + 1}
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {rate}%
                      </p>

                      {rate ===
                        Number(
                          form.maximum_rate,
                        ) && (
                        <p className="mt-1 text-[9px] text-muted-foreground">
                          CAP
                        </p>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ============================================================
          PENALTY START
      ============================================================ */}

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <SectionHeader
          icon={Landmark}
          title="Penalty Commencement"
          description="Define the point from which late-payment penalty calculation begins."
        />

        <div className="mt-6">
          <Label>
            Commencement Method
          </Label>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {/* FISCAL MONTH */}

            <button
              type="button"
              onClick={() =>
                updateField(
                  "start_type",
                  "FIXED_FISCAL_MONTH",
                )
              }
              disabled={isSubmitting}
              className={`group relative rounded-xl border p-4 text-left transition-all ${
                form.start_type ===
                "FIXED_FISCAL_MONTH"
                  ? "border-foreground bg-muted/40 shadow-sm"
                  : "hover:bg-muted/20"
              }`}
            >
              {form.start_type ===
                "FIXED_FISCAL_MONTH" && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                  <Check className="h-3 w-3" />
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                  <CalendarDays className="h-4 w-4" />
                </div>

                <div>
                  <p className="font-medium">
                    Ethiopian Fiscal Month
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Start penalty calculation from a
                    defined Ethiopian fiscal month.
                  </p>
                </div>
              </div>
            </button>

            {/* AGREEMENT */}

            <button
              type="button"
              onClick={() =>
                updateField(
                  "start_type",
                  "AGREEMENT_DATE",
                )
              }
              disabled={isSubmitting}
              className={`group relative rounded-xl border p-4 text-left transition-all ${
                form.start_type ===
                "AGREEMENT_DATE"
                  ? "border-foreground bg-muted/40 shadow-sm"
                  : "hover:bg-muted/20"
              }`}
            >
              {form.start_type ===
                "AGREEMENT_DATE" && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                  <Check className="h-3 w-3" />
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                  <FileText className="h-4 w-4" />
                </div>

                <div>
                  <p className="font-medium">
                    Agreement Date
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Start penalty calculation based on
                    the applicable agreement date.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* FISCAL MONTH CONFIG */}

        {form.start_type ===
          "FIXED_FISCAL_MONTH" && (
          <div className="mt-5 rounded-xl border bg-muted/20 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium">
                  Fiscal Month
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Select the Ethiopian fiscal month when
                  penalty commencement begins.
                </p>
              </div>

              <div className="flex h-8 items-center gap-2 rounded-full border bg-background px-3 text-xs font-medium">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />

                Ethiopian Fiscal Calendar
              </div>
            </div>

            <div className="mt-4 max-w-sm">
              <Select
                value={
                  form.start_fiscal_month ||
                  DEFAULT_START_FISCAL_MONTH
                }
                onValueChange={(value) =>
                  updateField(
                    "start_fiscal_month",
                    value,
                  )
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-11 bg-background w-full py-5">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {Array.from(
                    { length: 13 },
                    (_, index) => {
                      const month =
                        index + 1;

                      return (
                        <SelectItem
                          key={month}
                          value={String(month)}
                        >
                          <div className="flex items-center gap-2">
                            <span>
                              Fiscal Month {month}
                            </span>

                            {month === 7 && (
                              <span className="text-xs text-muted-foreground">
                                (Standard)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    },
                  )}
                </SelectContent>
              </Select>
            </div>

            {form.start_fiscal_month ===
              "7" && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border bg-background p-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

                <p className="text-xs leading-5 text-muted-foreground">
                  Fiscal month 7 is the standard penalty
                  commencement month.
                </p>
              </div>
            )}
          </div>
        )}

        {/* AGREEMENT CONFIG */}

        {form.start_type ===
          "AGREEMENT_DATE" && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border bg-muted/20 p-4 sm:p-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>

            <div>
              <p className="font-medium">
                Agreement-Based Commencement
              </p>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                The penalty engine will use the applicable
                agreement date from the assessment or
                transaction context. No fixed fiscal month
                is stored for this commencement method.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ============================================================
          EFFECTIVE PERIOD
      ============================================================ */}

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <SectionHeader
          icon={CalendarDays}
          title="Effective Period"
          description="Control when this penalty configuration is legally active."
        />

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {/* FROM */}

          <div className="space-y-2">
            <Label htmlFor="effective_from">
              Effective From{" "}
              <span className="text-destructive">
                *
              </span>
            </Label>

            <Input
              id="effective_from"
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

            <p className="text-xs text-muted-foreground">
              The date from which the rule can be applied.
            </p>
          </div>

          {/* TO */}

          <div className="space-y-2">
            <Label htmlFor="effective_to">
              Effective To
            </Label>

            <Input
              id="effective_to"
              type="date"
              value={form.effective_to}
              onChange={(event) =>
                updateField(
                  "effective_to",
                  event.target.value,
                )
              }
              className="h-11"
              disabled={isSubmitting}
            />

            <p className="text-xs text-muted-foreground">
              Leave empty when the rule has no planned
              expiration date.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          LEGAL INFORMATION
      ============================================================ */}

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <SectionHeader
          icon={Scale}
          title="Legal Information"
          description="Record the legal or regulatory authority supporting this policy."
        />

        <div className="mt-6 space-y-2">
          <Label htmlFor="legal_reference">
            Legal Reference
          </Label>

          <Input
            id="legal_reference"
            value={form.legal_reference}
            onChange={(event) =>
              updateField(
                "legal_reference",
                event.target.value,
              )
            }
            placeholder="e.g. Revenue Regulation No. ..."
            className="h-11"
            disabled={isSubmitting}
          />

          <p className="text-xs text-muted-foreground">
            Enter the applicable proclamation,
            regulation, directive, or other legal reference.
          </p>
        </div>
      </section>

      {/* ============================================================
          STATUS
      ============================================================ */}

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
            </div>

            <div>
              <p className="font-medium">
                Rule Status
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Only active rules within their effective
                period can be selected by the assessment
                engine.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-medium ${
                form.is_active
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {form.is_active
                ? "Active"
                : "Inactive"}
            </span>

            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) =>
                updateField(
                  "is_active",
                  checked,
                )
              }
              disabled={isSubmitting}
            />
          </div>
        </div>
      </section>

      {/* ============================================================
          FINAL SUMMARY
      ============================================================ */}

      <section className="rounded-xl border bg-muted/20 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
            <ShieldAlert className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="font-medium">
              Configuration Summary
            </p>

            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Initial
                </p>

                <p className="mt-0.5 font-semibold">
                  {form.initial_rate || "—"}%
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Monthly Increase
                </p>

                <p className="mt-0.5 font-semibold">
                  +{form.increment_rate || "—"}%
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Maximum
                </p>

                <p className="mt-0.5 font-semibold">
                  {form.maximum_rate || "—"}%
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Commencement
                </p>

                <p className="mt-0.5 font-semibold">
                  {form.start_type ===
                  "FIXED_FISCAL_MONTH"
                    ? `Fiscal Month ${
                        form.start_fiscal_month ||
                        "—"
                      }`
                    : "Agreement Date"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          ACTIONS
      ============================================================ */}

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
            className="h-10 min-w-[150px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />

                {mode === "create"
                  ? "Create Penalty Rule"
                  : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}