"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
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

export type StartType = "FIXED_FISCAL_MONTH" | "AGREEMENT_DATE";

export type CalculationBasis = "PRINCIPAL" | "OUTSTANDING";

export type PenaltyFormValues = {
  name: string;
  initial_rate: string;
  increment_rate: string;
  maximum_rate: string;
  start_type: StartType;
  start_fiscal_month: string;
  increment_period: "MONTH";
  calculation_basis: CalculationBasis;
  /** Stored/submitted as Gregorian YYYY-MM-DD. Displayed through EthiopianDatePicker. */
  effective_from: string;
  /** Stored/submitted as Gregorian YYYY-MM-DD. Empty string means no expiration. */
  effective_to: string;
  legal_reference: string;
  description: string;
  is_active: boolean;
};

export type PenaltyFormProps = {
  mode: "create" | "edit";
  initialValues: PenaltyFormValues;
  isSubmitting?: boolean;
  onSubmit: (values: PenaltyFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

/* ================================================================
   CONSTANTS
================================================================ */

const DEFAULT_INITIAL_RATE = "5";
const DEFAULT_INCREMENT_RATE = "2";
const DEFAULT_MAXIMUM_RATE = "25";
const DEFAULT_START_TYPE: StartType = "FIXED_FISCAL_MONTH";
const DEFAULT_START_FISCAL_MONTH = "7";

/* ================================================================
   DATE HELPERS
================================================================ */

/**
 * Convert an API date (YYYY-MM-DD) into a local JavaScript Date.
 * Avoids `new Date("YYYY-MM-DD")`, which can shift the date across timezones.
 */
function stringToLocalDate(value?: string | null): Date | undefined {
  if (!value) return undefined;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  // Reject invalid dates such as 2026-02-31.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

/** Convert a JavaScript Date into the canonical API format: YYYY-MM-DD. */
function localDateToString(date?: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

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
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
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
      <Label className="text-xs text-muted-foreground">{label}</Label>
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
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 text-base font-medium ${prefix ? "pl-7" : ""} pr-8`}
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
  const [form, setForm] = useState<PenaltyFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      ...initialValues,
      initial_rate: initialValues.initial_rate || DEFAULT_INITIAL_RATE,
      increment_rate: initialValues.increment_rate || DEFAULT_INCREMENT_RATE,
      maximum_rate: initialValues.maximum_rate || DEFAULT_MAXIMUM_RATE,
      start_type: initialValues.start_type || DEFAULT_START_TYPE,
      start_fiscal_month:
        initialValues.start_fiscal_month || DEFAULT_START_FISCAL_MONTH,
      increment_period: "MONTH",
    });
    setError(null);
  }, [initialValues]);

  const updateField = <K extends keyof PenaltyFormValues>(
    field: K,
    value: PenaltyFormValues[K],
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError(null);
  };

  /* ==============================================================
     VALIDATION HELPERS
  ============================================================== */

  const isValidNonNegativeNumber = (value: string): boolean => {
    if (!value.trim()) return false;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0;
  };

  const isValidPositiveInteger = (value: string): boolean => {
    if (!value.trim()) return false;
    const number = Number(value);
    return Number.isInteger(number) && number >= 1;
  };

  /* ==============================================================
     LIVE, PLAIN-LANGUAGE PREVIEW OF THE THREE RATE NUMBERS
  ============================================================== */

  const ratesLookValid = useMemo(() => {
    return (
      isValidNonNegativeNumber(form.initial_rate) &&
      isValidNonNegativeNumber(form.increment_rate) &&
      isValidNonNegativeNumber(form.maximum_rate) &&
      Number(form.maximum_rate) >= Number(form.initial_rate)
    );
  }, [form.initial_rate, form.increment_rate, form.maximum_rate]);

  /* ==============================================================
     DATE VALUES FOR ETHIOPIAN DATE PICKERS
  ============================================================== */

  const effectiveFromDate = useMemo(
    () => stringToLocalDate(form.effective_from),
    [form.effective_from],
  );

  const effectiveToDate = useMemo(
    () => stringToLocalDate(form.effective_to),
    [form.effective_to],
  );

  /* ==============================================================
     SUBMIT
  ============================================================== */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Give this penalty rule a name.");
      return;
    }

    if (!form.effective_from) {
      setError("Choose a date this rule becomes effective from.");
      return;
    }

    if (form.effective_to && form.effective_to < form.effective_from) {
      setError("The end date can't be before the start date.");
      return;
    }

    if (!isValidNonNegativeNumber(form.initial_rate)) {
      setError("Enter a valid initial rate.");
      return;
    }

    if (!isValidNonNegativeNumber(form.increment_rate)) {
      setError("Enter a valid monthly increment.");
      return;
    }

    if (!isValidNonNegativeNumber(form.maximum_rate)) {
      setError("Enter a valid maximum rate.");
      return;
    }

    if (Number(form.maximum_rate) < Number(form.initial_rate)) {
      setError("The maximum rate can't be lower than the initial rate.");
      return;
    }

    if (form.start_type === "FIXED_FISCAL_MONTH") {
      if (!isValidPositiveInteger(form.start_fiscal_month)) {
        setError("Choose a valid fiscal month.");
        return;
      }

      const fiscalMonth = Number(form.start_fiscal_month);
      if (fiscalMonth < 1 || fiscalMonth > 13) {
        setError("Fiscal month must be between 1 and 13.");
        return;
      }
    }

    const payload: PenaltyFormValues = {
      ...form,
      start_fiscal_month:
        form.start_type === "FIXED_FISCAL_MONTH"
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
      className="mx-auto w-full max-w-2xl space-y-8 pb-8"
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {mode === "create" ? "New penalty rule" : "Edit penalty rule"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sets how the late-payment penalty grows over time.
          </p>
        </div>

        <label className="flex shrink-0 items-center gap-2 pt-1 text-sm">
          <span className="text-muted-foreground">
            {form.is_active ? "Active" : "Inactive"}
          </span>
          <Switch
            checked={form.is_active}
            onCheckedChange={(checked) => updateField("is_active", checked)}
            disabled={isSubmitting}
          />
        </label>
      </div>

      {/* ERROR */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3.5"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* NAME + DESCRIPTION */}
      <div className="space-y-5">
        <Field label="Name" required>
          <Input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="e.g. Late Payment Penalty"
            className="h-11"
            disabled={isSubmitting}
          />
        </Field>

        <Field label="Description" hint="Optional, for internal reference.">
          <Textarea
            value={form.description}
            onChange={(event) =>
              updateField("description", event.target.value)
            }
            placeholder="What this rule is for and when it applies..."
            rows={3}
            disabled={isSubmitting}
          />
        </Field>
      </div>

      {/* RATE PROGRESSION */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Penalty rate</h2>
          <p className="text-xs text-muted-foreground">
            How the penalty starts, grows each month, and where it caps.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <RateInput
            label="Starts at"
            value={form.initial_rate}
            onChange={(value) => updateField("initial_rate", value)}
            disabled={isSubmitting}
          />
          <RateInput
            label="+ Each month"
            value={form.increment_rate}
            onChange={(value) => updateField("increment_rate", value)}
            disabled={isSubmitting}
          />
          <RateInput
            label="Caps at"
            value={form.maximum_rate}
            onChange={(value) => updateField("maximum_rate", value)}
            disabled={isSubmitting}
          />
        </div>

        {ratesLookValid && (
          <p className="text-xs leading-5 text-muted-foreground">
            Starts at <span className="font-medium text-foreground">{form.initial_rate}%</span>, adds{" "}
            <span className="font-medium text-foreground">{form.increment_rate} pts</span> for every late month, up to a cap of{" "}
            <span className="font-medium text-foreground">{form.maximum_rate}%</span>.
          </p>
        )}

        <Field
          label="Calculated on"
          hint="The amount the penalty percentage is applied to."
        >
          <Select
            value={form.calculation_basis}
            onValueChange={(value) =>
              updateField("calculation_basis", value as CalculationBasis)
            }
            disabled={isSubmitting}
          >
            <SelectTrigger className="h-11 w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRINCIPAL">Principal</SelectItem>
              <SelectItem value="OUTSTANDING">Outstanding balance</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* COMMENCEMENT */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">When the penalty starts</h2>
        </div>

        <div className="inline-flex rounded-lg border p-1">
          <button
            type="button"
            onClick={() => updateField("start_type", "FIXED_FISCAL_MONTH")}
            disabled={isSubmitting}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              form.start_type === "FIXED_FISCAL_MONTH"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Fixed fiscal month
          </button>
          <button
            type="button"
            onClick={() => updateField("start_type", "AGREEMENT_DATE")}
            disabled={isSubmitting}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              form.start_type === "AGREEMENT_DATE"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Agreement date
          </button>
        </div>

        {form.start_type === "FIXED_FISCAL_MONTH" ? (
          <div className="max-w-xs">
            <Select
              value={form.start_fiscal_month || DEFAULT_START_FISCAL_MONTH}
              onValueChange={(value) =>
                updateField("start_fiscal_month", value)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 13 }, (_, index) => {
                  const month = index + 1;
                  return (
                    <SelectItem key={month} value={String(month)}>
                      Fiscal month {month}
                      {month === 7 ? " (standard)" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">
            The penalty engine will use the agreement date from the
            relevant assessment or transaction.
          </p>
        )}
      </div>

      {/* EFFECTIVE PERIOD */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Effective period</h2>
          <p className="text-xs text-muted-foreground">
            Ethiopian calendar dates, converted to Gregorian automatically.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="From" required>
            <EthiopianDatePicker
              value={effectiveFromDate}
              onChange={(date) =>
                updateField("effective_from", localDateToString(date))
              }
              placeholder="Select start date"
              disabled={isSubmitting}
              searchable
              yearMode="FULL"
            />
          </Field>

          <Field label="To" hint="Leave empty for no expiration.">
            <EthiopianDatePicker
              value={effectiveToDate}
              onChange={(date) =>
                updateField("effective_to", localDateToString(date))
              }
              placeholder="No expiration"
              disabled={isSubmitting}
              searchable
              yearMode="FULL"
              // minDate={effectiveFromDate}
            />
          </Field>
        </div>
      </div>

      {/* LEGAL REFERENCE */}
      <Field
        label="Legal reference"
        hint="The proclamation, regulation, or directive this rule is based on."
      >
        <Input
          value={form.legal_reference}
          onChange={(event) =>
            updateField("legal_reference", event.target.value)
          }
          placeholder="e.g. Revenue Regulation No. ..."
          className="h-11"
          disabled={isSubmitting}
        />
      </Field>

      {/* ACTIONS */}
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
                {mode === "create" ? "Create rule" : "Save changes"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}