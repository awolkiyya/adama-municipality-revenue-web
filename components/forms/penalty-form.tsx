"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Loader2,
  Save,
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

import { EthiopianDatePicker } from "../input/EthiopianDatePicker";

/* ================================================================
   TYPES
================================================================ */

export type StartType =
  | "FIXED_PAYMENT_DATE"
  | "AGREEMENT_DATE";

export type CalculationBasis =
  | "PRINCIPAL"
  | "OUTSTANDING";

export type PenaltyFormValues = {
  name: string;

  /**
   * Form fields intentionally use strings.
   *
   * HTML inputs return strings and this also allows
   * temporary input states such as:
   *
   *     ""
   *     "5."
   *     "5.25"
   *
   * The backend remains responsible for final numeric
   * validation and financial precision.
   */
  initial_rate: string;
  increment_rate: string;
  maximum_rate: string;

  /**
   * Determines how penalty commencement is resolved.
   *
   * FIXED_FISCAL_MONTH:
   *     Uses the global payment-period configuration from
   *     revenue settings.
   *
   * AGREEMENT_DATE:
   *     Uses the applicable agreement date.
   */
  start_type: StartType;

  /**
   * Current backend supports monthly progression only.
   */
  increment_period: "MONTH";

  /**
   * Amount against which the penalty percentage is calculated.
   */
  calculation_basis: CalculationBasis;

  /**
   * Stored/submitted as Gregorian YYYY-MM-DD.
   * Displayed through EthiopianDatePicker.
   */
  effective_from: string;

  /**
   * Stored/submitted as Gregorian YYYY-MM-DD.
   * Empty string means no expiration.
   */
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
    values: PenaltyFormValues
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
  "FIXED_PAYMENT_DATE";

/* ================================================================
   FORM NORMALIZATION
================================================================ */

/**
 * Normalize values received from the API into the exact
 * representation expected by the form.
 *
 * Laravel/PostgreSQL decimal values may arrive through JSON
 * as numbers, for example:
 *
 *     initial_rate: 5
 *
 * while the form requires:
 *
 *     initial_rate: "5"
 *
 * Keeping this normalization at the form boundary prevents
 * runtime errors such as:
 *
 *     value.trim is not a function
 */
function normalizePenaltyFormValues(
  values: PenaltyFormValues
): PenaltyFormValues {
  return {
    ...values,

    name:
      values.name == null
        ? ""
        : String(values.name),

    initial_rate:
      values.initial_rate == null ||
      values.initial_rate === ""
        ? DEFAULT_INITIAL_RATE
        : String(values.initial_rate),

    increment_rate:
      values.increment_rate == null ||
      values.increment_rate === ""
        ? DEFAULT_INCREMENT_RATE
        : String(values.increment_rate),

    maximum_rate:
      values.maximum_rate == null ||
      values.maximum_rate === ""
        ? DEFAULT_MAXIMUM_RATE
        : String(values.maximum_rate),

    start_type:
      values.start_type ||
      DEFAULT_START_TYPE,

    /*
    |--------------------------------------------------------------------------
    | increment_period is fixed by the backend.
    |--------------------------------------------------------------------------
    */

    increment_period: "MONTH",

    calculation_basis:
      values.calculation_basis ||
      "PRINCIPAL",

    effective_from:
      values.effective_from == null
        ? ""
        : String(values.effective_from),

    effective_to:
      values.effective_to == null
        ? ""
        : String(values.effective_to),

    legal_reference:
      values.legal_reference == null
        ? ""
        : String(values.legal_reference),

    description:
      values.description == null
        ? ""
        : String(values.description),

    is_active:
      Boolean(values.is_active),
  };
}

/* ================================================================
   DATE HELPERS
================================================================ */

/**
 * Convert an API date (YYYY-MM-DD) into a local JavaScript Date.
 *
 * Avoids:
 *
 *     new Date("YYYY-MM-DD")
 *
 * because JavaScript interprets that format as UTC,
 * which can shift the displayed date depending on timezone.
 */
function stringToLocalDate(
  value?: string | null
): Date | undefined {
  if (!value) {
    return undefined;
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return undefined;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    year,
    month - 1,
    day
  );

  /*
  |--------------------------------------------------------------------------
  | Reject invalid dates
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | 2026-02-31
  |
  */

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

/**
 * Convert a local JavaScript Date into the canonical
 * API date format:
 *
 *     YYYY-MM-DD
 */
function localDateToString(
  date?: Date | null
): string {
  if (
    !date ||
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* ================================================================
   SMALL UI COMPONENTS
================================================================ */

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}

        {required && (
          <span className="text-destructive">
            {" "}
            *
          </span>
        )}
      </Label>

      {children}

      {hint && (
        <p className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

function RateInput({
  label,
  value,
  onChange,
  disabled,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  prefix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
      </Label>

      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}

        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className={`h-11 text-base font-medium ${
            prefix ? "pl-7" : ""
          } pr-8`}
          disabled={disabled}
        />

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          %
        </span>
      </div>
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
    useState<PenaltyFormValues>(() =>
      normalizePenaltyFormValues(
        initialValues
      )
    );

  const [error, setError] =
    useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Synchronize Initial Values
  |--------------------------------------------------------------------------
  |
  | This is important for edit mode because API values can arrive
  | asynchronously and decimal fields may be numbers instead of
  | strings.
  |
  */

  useEffect(() => {
    setForm(
      normalizePenaltyFormValues(
        initialValues
      )
    );

    setError(null);
  }, [initialValues]);

  /*
  |--------------------------------------------------------------------------
  | Field Updater
  |--------------------------------------------------------------------------
  */

  const updateField = <
    K extends keyof PenaltyFormValues
  >(
    field: K,
    value: PenaltyFormValues[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError(null);
  };

  /* ==============================================================
     VALIDATION HELPERS
  ============================================================== */

  /**
   * Validate a non-negative numeric form value.
   *
   * String() is intentionally used defensively here.
   * The form itself stores strings, but this guarantees that
   * accidental numeric values from external data cannot cause:
   *
   *     value.trim is not a function
   */
  const isValidNonNegativeNumber = (
    value: string
  ): boolean => {
    const normalizedValue =
      String(value ?? "").trim();

    if (!normalizedValue) {
      return false;
    }

    const number =
      Number(normalizedValue);

    return (
      Number.isFinite(number) &&
      number >= 0
    );
  };

  /* ==============================================================
     RATE PREVIEW VALIDATION
  ============================================================== */

  const ratesLookValid = useMemo(() => {
    const initialRate =
      String(
        form.initial_rate ?? ""
      ).trim();

    const incrementRate =
      String(
        form.increment_rate ?? ""
      ).trim();

    const maximumRate =
      String(
        form.maximum_rate ?? ""
      ).trim();

    if (
      !isValidNonNegativeNumber(
        initialRate
      ) ||
      !isValidNonNegativeNumber(
        incrementRate
      ) ||
      !isValidNonNegativeNumber(
        maximumRate
      )
    ) {
      return false;
    }

    return (
      Number(maximumRate) >=
      Number(initialRate)
    );
  }, [
    form.initial_rate,
    form.increment_rate,
    form.maximum_rate,
  ]);

  /* ================================================================
     DATE VALUES
  ================================================================ */

  const effectiveFromDate = useMemo(
    () =>
      stringToLocalDate(
        form.effective_from
      ),
    [form.effective_from]
  );

  const effectiveToDate = useMemo(
    () =>
      stringToLocalDate(
        form.effective_to
      ),
    [form.effective_to]
  );

  /* ================================================================
     SUBMIT
  ================================================================ */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError(null);

    /*
    |--------------------------------------------------------------------------
    | Normalize form values one final time before validation.
    |--------------------------------------------------------------------------
    */

    const name =
      String(form.name ?? "").trim();

    const initialRate =
      String(
        form.initial_rate ?? ""
      ).trim();

    const incrementRate =
      String(
        form.increment_rate ?? ""
      ).trim();

    const maximumRate =
      String(
        form.maximum_rate ?? ""
      ).trim();

    const effectiveFrom =
      String(
        form.effective_from ?? ""
      ).trim();

    const effectiveTo =
      String(
        form.effective_to ?? ""
      ).trim();

    const legalReference =
      String(
        form.legal_reference ?? ""
      ).trim();

    const description =
      String(
        form.description ?? ""
      ).trim();

    /*
    |--------------------------------------------------------------------------
    | Name
    |--------------------------------------------------------------------------
    */

    if (!name) {
      setError(
        "Give this penalty rule a name."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Effective From
    |--------------------------------------------------------------------------
    */

    if (!effectiveFrom) {
      setError(
        "Choose a date this rule becomes effective from."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Effective To
    |--------------------------------------------------------------------------
    */

    if (
      effectiveTo &&
      effectiveTo < effectiveFrom
    ) {
      setError(
        "The end date can't be before the start date."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Initial Rate
    |--------------------------------------------------------------------------
    */

    if (
      !isValidNonNegativeNumber(
        initialRate
      )
    ) {
      setError(
        "Enter a valid initial rate."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Increment Rate
    |--------------------------------------------------------------------------
    */

    if (
      !isValidNonNegativeNumber(
        incrementRate
      )
    ) {
      setError(
        "Enter a valid monthly increment."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Maximum Rate
    |--------------------------------------------------------------------------
    */

    if (
      !isValidNonNegativeNumber(
        maximumRate
      )
    ) {
      setError(
        "Enter a valid maximum rate."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Rate Relationship
    |--------------------------------------------------------------------------
    */

    if (
      Number(maximumRate) <
      Number(initialRate)
    ) {
      setError(
        "The maximum rate can't be lower than the initial rate."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Backend-compatible rate limits
    |--------------------------------------------------------------------------
    |
    | The Laravel request also enforces 0–100.
    | Checking it here gives the user immediate feedback.
    |
    */

    if (
      Number(initialRate) > 100 ||
      Number(incrementRate) > 100 ||
      Number(maximumRate) > 100
    ) {
      setError(
        "Penalty rates must be between 0% and 100%."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Start Type
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | There is intentionally NO start_fiscal_month
    | validation here.
    |
    | When start_type is FIXED_PAYMENT_DATE,
    | the actual Ethiopian fiscal payment-period
    | start is resolved by the backend from:
    |
    |     revenue_settings.payment_start_month
    |     revenue_settings.payment_start_day
    |
    */

    if (
      form.start_type !==
        "FIXED_PAYMENT_DATE" &&
      form.start_type !==
        "AGREEMENT_DATE"
    ) {
      setError(
        "Choose a valid penalty commencement type."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Calculation Basis
    |--------------------------------------------------------------------------
    */

    if (
      form.calculation_basis !==
        "PRINCIPAL" &&
      form.calculation_basis !==
        "OUTSTANDING"
    ) {
      setError(
        "Choose a valid calculation basis."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Payload
    |--------------------------------------------------------------------------
    |
    | Keep rate values as strings.
    |
    | This avoids introducing JavaScript floating-point
    | conversion into financial data.
    |
    | Laravel validation + BCMath remains responsible for
    | final financial precision.
    |
    */

    const payload: PenaltyFormValues = {
      ...form,

      name,

      initial_rate: initialRate,

      increment_rate: incrementRate,

      maximum_rate: maximumRate,

      effective_from: effectiveFrom,

      effective_to: effectiveTo,

      legal_reference: legalReference,

      description,

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
      className="mx-auto w-full max-w-2xl space-y-8 pb-8"
    >
      {/* ============================================================
          HEADER
      ============================================================ */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {mode === "create"
              ? "New penalty rule"
              : "Edit penalty rule"}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Sets how the late-payment penalty
            grows over time.
          </p>
        </div>

        <label className="flex shrink-0 items-center gap-2 pt-1 text-sm">
          <span className="text-muted-foreground">
            {form.is_active
              ? "Active"
              : "Inactive"}
          </span>

          <Switch
            checked={form.is_active}
            onCheckedChange={(checked) =>
              updateField(
                "is_active",
                checked
              )
            }
            disabled={isSubmitting}
          />
        </label>
      </div>

      {/* ============================================================
          ERROR
      ============================================================ */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3.5"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />

          <p className="text-sm text-destructive">
            {error}
          </p>
        </div>
      )}

      {/* ============================================================
          NAME + DESCRIPTION
      ============================================================ */}

      <div className="space-y-5">
        <Field
          label="Name"
          required
        >
          <Input
            value={form.name}
            onChange={(event) =>
              updateField(
                "name",
                event.target.value
              )
            }
            placeholder="e.g. Late Payment Penalty"
            className="h-11"
            disabled={isSubmitting}
          />
        </Field>

        <Field
          label="Description"
          hint="Optional, for internal reference."
        >
          <Textarea
            value={form.description}
            onChange={(event) =>
              updateField(
                "description",
                event.target.value
              )
            }
            placeholder="What this rule is for and when it applies..."
            rows={3}
            disabled={isSubmitting}
          />
        </Field>
      </div>

      {/* ============================================================
          RATE PROGRESSION
      ============================================================ */}

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">
            Penalty rate
          </h2>

          <p className="text-xs text-muted-foreground">
            How the penalty starts, grows each
            month, and where it caps.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <RateInput
            label="Starts at"
            value={form.initial_rate}
            onChange={(value) =>
              updateField(
                "initial_rate",
                value
              )
            }
            disabled={isSubmitting}
          />

          <RateInput
            label="+ Each month"
            value={form.increment_rate}
            onChange={(value) =>
              updateField(
                "increment_rate",
                value
              )
            }
            disabled={isSubmitting}
          />

          <RateInput
            label="Caps at"
            value={form.maximum_rate}
            onChange={(value) =>
              updateField(
                "maximum_rate",
                value
              )
            }
            disabled={isSubmitting}
          />
        </div>

        {ratesLookValid && (
          <p className="text-xs leading-5 text-muted-foreground">
            Starts at{" "}
            <span className="font-medium text-foreground">
              {form.initial_rate}%
            </span>
            , adds{" "}
            <span className="font-medium text-foreground">
              {form.increment_rate} pts
            </span>{" "}
            for every late month, up to a
            cap of{" "}
            <span className="font-medium text-foreground">
              {form.maximum_rate}%
            </span>
            .
          </p>
        )}

        <Field
          label="Calculated on"
          hint="The amount the penalty percentage is applied to."
        >
          <Select
            value={form.calculation_basis}
            onValueChange={(value) =>
              updateField(
                "calculation_basis",
                value as CalculationBasis
              )
            }
            disabled={isSubmitting}
          >
            <SelectTrigger className="h-11 w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="PRINCIPAL">
                Principal
              </SelectItem>

              <SelectItem value="OUTSTANDING">
                Outstanding balance
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* ============================================================
          COMMENCEMENT
      ============================================================ */}

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">
            When the penalty starts
          </h2>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Choose how the penalty engine
            determines its commencement date.
          </p>
        </div>

        {/* ==========================================================
            START TYPE
        ========================================================== */}

        <div className="inline-flex rounded-lg border p-1">
          <button
            type="button"
            onClick={() =>
              updateField(
                "start_type",
                "FIXED_PAYMENT_DATE"
              )
            }
            disabled={isSubmitting}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              form.start_type ===
              "FIXED_PAYMENT_DATE"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Fixed fiscal month
          </button>

          <button
            type="button"
            onClick={() =>
              updateField(
                "start_type",
                "AGREEMENT_DATE"
              )
            }
            disabled={isSubmitting}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              form.start_type ===
              "AGREEMENT_DATE"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Agreement date
          </button>
        </div>

        {/* ==========================================================
            FIXED FISCAL MONTH
        ========================================================== */}

        {form.start_type ===
          "FIXED_PAYMENT_DATE" && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium">
              Global fiscal payment period
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              The penalty engine will use the
              global payment-period start
              configured in Revenue General
              Settings. The fiscal month and day
              are not configured separately for
              each penalty rule.
            </p>

            <div className="mt-3 rounded-md border bg-background px-3 py-2.5">
              <p className="text-xs font-medium text-muted-foreground">
                Source of configuration
              </p>

              <p className="mt-1 text-sm">
                Revenue General Settings
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Payment Start Month + Payment
                Start Day
              </p>
            </div>
          </div>
        )}

        {/* ==========================================================
            AGREEMENT DATE
        ========================================================== */}

        {form.start_type ===
          "AGREEMENT_DATE" && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium">
              Agreement date
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              The penalty engine will use the
              agreement date associated with the
              relevant revenue transaction or
              assessment.
            </p>
          </div>
        )}
      </div>

      {/* ============================================================
          EFFECTIVE PERIOD
      ============================================================ */}

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">
            Effective period
          </h2>

          <p className="text-xs text-muted-foreground">
            Ethiopian calendar dates, converted
            to Gregorian automatically.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* ========================================================
              EFFECTIVE FROM
          ======================================================== */}

          <Field
            label="From"
            required
          >
            <EthiopianDatePicker
              value={effectiveFromDate}
              onChange={(date) =>
                updateField(
                  "effective_from",
                  localDateToString(date)
                )
              }
              placeholder="Select start date"
              disabled={isSubmitting}
              searchable
              yearMode="FULL"
            />
          </Field>

          {/* ========================================================
              EFFECTIVE TO
          ======================================================== */}

          <Field
            label="To"
            hint="Leave empty for no expiration."
          >
            <EthiopianDatePicker
              value={effectiveToDate}
              onChange={(date) =>
                updateField(
                  "effective_to",
                  localDateToString(date)
                )
              }
              placeholder="No expiration"
              disabled={isSubmitting}
              searchable
              yearMode="FULL"
            />
          </Field>
        </div>
      </div>

      {/* ============================================================
          LEGAL REFERENCE
      ============================================================ */}

      <Field
        label="Legal reference"
        hint="The proclamation, regulation, or directive this rule is based on."
      >
        <Input
          value={form.legal_reference}
          onChange={(event) =>
            updateField(
              "legal_reference",
              event.target.value
            )
          }
          placeholder="e.g. Revenue Regulation No. ..."
          className="h-11"
          disabled={isSubmitting}
        />
      </Field>

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
                  ? "Create rule"
                  : "Save changes"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
