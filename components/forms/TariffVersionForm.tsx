
"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import {
  AlertCircle,
  AlertTriangle,
  Loader2,
  CalendarClock,
  Sparkles,
  X,
  ArrowLeft,
} from "lucide-react";

import { EthiopianDatePicker } from "../input/EthiopianDatePicker";

// ============================================================================
// FORM TYPES
// ============================================================================

export interface TariffVersionFormValues {
  year: string;
  name: string;
  description: string;
  effective_from: string;
  effective_to: string;
  isActive: boolean;
}

export interface TariffVersionFormInitialValues {
  year?: string;
  name?: string;
  description?: string;
  effective_from?: string;
  effective_to?: string;
  isActive?: boolean;
}

type FormErrors = Partial<
  Record<
    "year" | "name" | "effectiveFrom" | "effectiveTo" | "submit",
    string
  >
>;

// ============================================================================
// DATE HELPERS
// ============================================================================

/**
 * Parse a Gregorian YYYY-MM-DD string into a local Date.
 * ISO datetime strings are supported by extracting the date portion.
 */
function parseDate(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.substring(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);

  if (!match) {
    return undefined;
  }

  const [, yearString, monthString, dayString] = match;

  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  const date = new Date(year, month - 1, day);

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
 * Convert a local Date to Gregorian YYYY-MM-DD.
 * Avoid toISOString() to prevent timezone-related date changes.
 */
function formatDateForForm(date?: Date): string {
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeDate(value?: string | null): string {
  return value ? value.substring(0, 10) : "";
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

function buildDefaultValues(
  existingYears: number[],
): TariffVersionFormValues {
  const validYears = existingYears.filter(
    (year) =>
      Number.isInteger(year) &&
      year >= 1900 &&
      year <= 3000,
  );

  const latestYear =
    validYears.length > 0
      ? Math.max(...validYears)
      : new Date().getFullYear();

  const suggestedYear = Math.min(latestYear + 1, 3000);

  return {
    year: String(suggestedYear),
    name: `${suggestedYear} Standard Tariff`,
    description: "",
    effective_from: `${suggestedYear}-01-01`,
    effective_to: "",
    isActive: false,
  };
}

function buildInitialValues(
  initialValues?: TariffVersionFormInitialValues,
  existingYears: number[] = [],
): TariffVersionFormValues {
  if (!initialValues) {
    return buildDefaultValues(existingYears);
  }

  const year = initialValues.year ?? "";

  return {
    year,
    name: initialValues.name ?? (
      year ? `${year} Standard Tariff` : ""
    ),
    description: initialValues.description ?? "",
    effective_from: normalizeDate(initialValues.effective_from),
    effective_to: normalizeDate(initialValues.effective_to),
    isActive: initialValues.isActive ?? false,
  };
}

// ============================================================================
// PROPS
// ============================================================================

export interface TariffVersionFormProps {
  /**
   * Existing tariff years.
   * On edit, the parent should exclude the current version's year.
   */
  existingYears: number[];

  /**
   * Whether another tariff version is currently active.
   */
  hasActiveVersion: boolean;

  /**
   * Existing values when editing.
   * Undefined means CREATE mode.
   */
  initialValues?: TariffVersionFormInitialValues;

  /**
   * Shared create/update submit handler.
   */
  onSubmit: (values: TariffVersionFormValues) => Promise<void>;

  /**
   * Return to the tariff version list or previous page.
   */
  onCancel: () => void;

  /**
   * Optional page-level loading state.
   */
  isLoading?: boolean;
}


// ============================================================================
// COMPONENT
// ============================================================================

export function TariffVersionForm({
  existingYears,
  hasActiveVersion,
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: TariffVersionFormProps) {
  const isEditMode = Boolean(initialValues);

  const [values, setValues] = useState<TariffVersionFormValues>(() =>
    buildInitialValues(initialValues, existingYears),
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  /*
   * Use primitive dependencies below instead of the initialValues object
   * itself. This prevents a parent creating a new object on every render
   * from resetting fields while the user is typing.
   */
  const initialYear = initialValues?.year;
  const initialName = initialValues?.name;
  const initialDescription = initialValues?.description;
  const initialEffectiveFrom = initialValues?.effective_from;
  const initialEffectiveTo = initialValues?.effective_to;
  const initialIsActive = initialValues?.isActive;

  const existingYearsKey = existingYears.join(",");

  // ==========================================================================
  // SET FIELD
  // ==========================================================================

  const setField = <K extends keyof TariffVersionFormValues>(
    key: K,
    value: TariffVersionFormValues[K],
  ) => {
    setValues((previous) => ({
      ...previous,
      [key]: value,
    }));

    setErrors((previous) => {
      const next = { ...previous };

      if (key === "year") {
        delete next.year;
      } else if (key === "name") {
        delete next.name;
      } else if (key === "effective_from") {
        delete next.effectiveFrom;
        delete next.effectiveTo;
      } else if (key === "effective_to") {
        delete next.effectiveTo;
      }

      delete next.submit;

      return next;
    });
  };

  // ==========================================================================
  // INITIALIZE FORM
  // ==========================================================================

  useEffect(() => {
    const nextInitialValues: TariffVersionFormInitialValues | undefined =
      initialValues
        ? {
            year: initialYear,
            name: initialName,
            description: initialDescription,
            effective_from: initialEffectiveFrom,
            effective_to: initialEffectiveTo,
            isActive: initialIsActive,
          }
        : undefined;

    setValues(
      buildInitialValues(
        nextInitialValues,
        existingYearsKey
          ? existingYearsKey
              .split(",")
              .filter(Boolean)
              .map(Number)
          : [],
      ),
    );

    setNameTouched(Boolean(initialName));
    setErrors({});
  }, [
    initialYear,
    initialName,
    initialDescription,
    initialEffectiveFrom,
    initialEffectiveTo,
    initialIsActive,
    existingYearsKey,
  ]);

  // ==========================================================================
  // YEAR CHANGE
  // ==========================================================================

  const handleYearChange = (year: string) => {
    setValues((previous) => {
      const isFourDigitYear = /^\d{4}$/.test(year);

      const shouldUpdateStartDate =
        isFourDigitYear &&
        previous.effective_from.endsWith("-01-01");

      return {
        ...previous,
        year,
        name:
          !nameTouched && isFourDigitYear
            ? `${year} Standard Tariff`
            : previous.name,
        effective_from: shouldUpdateStartDate
          ? `${year}-01-01`
          : previous.effective_from,
      };
    });

    setErrors((previous) => {
      const next = { ...previous };
      delete next.year;
      delete next.submit;
      return next;
    });
  };

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  const validate = (): boolean => {
    const next: FormErrors = {};

    // Year

    const trimmedYear = values.year.trim();
    const numericYear = Number(trimmedYear);

    if (!trimmedYear) {
      next.year = "Year is required.";
    } else if (!/^\d{4}$/.test(trimmedYear)) {
      next.year = "Year must be a valid four-digit year.";
    } else if (
      !Number.isInteger(numericYear) ||
      numericYear < 1900 ||
      numericYear > 3000
    ) {
      next.year = "Please enter a valid year between 1900 and 3000.";
    } else if (existingYears.includes(numericYear)) {
      next.year = "A tariff version for this year already exists.";
    }

    // Name

    if (!values.name.trim()) {
      next.name = "Name is required.";
    }

    // Effective from

    const startDate = parseDate(values.effective_from);

    if (!values.effective_from) {
      next.effectiveFrom = "Start date is required.";
    } else if (!startDate) {
      next.effectiveFrom = "Please select a valid start date.";
    }

    // Effective to

    if (values.effective_to) {
      const endDate = parseDate(values.effective_to);

      if (!endDate) {
        next.effectiveTo = "Please select a valid end date.";
      } else if (
        startDate &&
        formatDateForForm(endDate) < formatDateForForm(startDate)
      ) {
        next.effectiveTo =
          "End date must be on or after the start date.";
      }
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  // ==========================================================================
  // SUBMIT
  // ==========================================================================

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting || isLoading || !validate()) {
      return;
    }

    setIsSubmitting(true);

    setErrors((previous) => {
      const next = { ...previous };
      delete next.submit;
      return next;
    });

    try {
      await onSubmit({
        year: values.year.trim(),
        name: values.name.trim(),
        description: values.description.trim(),
        effective_from: values.effective_from,
        effective_to: values.effective_to,
        isActive: values.isActive,
      });
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        submit:
          error instanceof Error
            ? error.message
            : "Unable to save this tariff version. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const isBusy = isSubmitting || isLoading;

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-5xl space-y-6 pb-8"
      noValidate
    >
      {/* Page heading */}

      <header className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isBusy}
          className="-ml-3 w-fit text-muted-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to tariff versions
        </Button>

        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarClock className="h-5 w-5" />
          </div>

          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {isEditMode
                ? "Edit Tariff Version"
                : "Create Tariff Version"}
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {isEditMode
                ? "Update the tariff version details and effective period."
                : "Create a yearly tariff version. You can configure its individual pricing rules afterward."}
            </p>
          </div>
        </div>
      </header>

      {/* Form content */}

      <div className="space-y-6">
        {/* Version details */}

        <section className="space-y-5 rounded-xl border bg-card p-4 sm:p-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">
              Version details
            </h2>

            <p className="text-sm text-muted-foreground">
              Identify the tariff version and provide an optional description.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[140px_1fr]">
              {/* Year */}

              <div className="space-y-1.5">
                <Label htmlFor="tariff-year">
                  Year <span className="text-red-500">*</span>
                </Label>

                <Input
                  id="tariff-year"
                  type="number"
                  min={1900}
                  max={3000}
                  step={1}
                  value={values.year}
                  onChange={(event) =>
                    handleYearChange(event.target.value)
                  }
                  placeholder="2027"
                  disabled={isBusy}
                  aria-invalid={Boolean(errors.year)}
                  aria-describedby={
                    errors.year ? "tariff-year-error" : undefined
                  }
                  className={
                    errors.year
                      ? "border-red-400 focus-visible:ring-red-400"
                      : ""
                  }
                />

                {errors.year && (
                  <p
                    id="tariff-year-error"
                    className="flex items-start gap-1.5 text-xs text-red-500"
                  >
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {errors.year}
                  </p>
                )}
              </div>

              {/* Name */}

              <div className="space-y-1.5">
                <Label htmlFor="tariff-name">
                  Name <span className="text-red-500">*</span>
                </Label>

                <Input
                  id="tariff-name"
                  value={values.name}
                  onChange={(event) => {
                    setNameTouched(true);
                    setField("name", event.target.value);
                  }}
                  placeholder={`${values.year || new Date().getFullYear() + 1} Standard Tariff`}
                  disabled={isBusy}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name ? "tariff-name-error" : undefined
                  }
                  className={
                    errors.name
                      ? "border-red-400 focus-visible:ring-red-400"
                      : ""
                  }
                />

                {errors.name && (
                  <p
                    id="tariff-name-error"
                    className="flex items-start gap-1.5 text-xs text-red-500"
                  >
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {errors.name}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}

            <div className="space-y-1.5">
              <Label htmlFor="tariff-description">
                Description{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>

              <Textarea
                id="tariff-description"
                value={values.description}
                onChange={(event) =>
                  setField("description", event.target.value)
                }
                placeholder="Describe the purpose or changes in this tariff version..."
                rows={4}
                disabled={isBusy}
                className="resize-y"
              />
            </div>
          </div>
        </section>

        {/* Effective period */}

        <section className="space-y-5 rounded-xl border bg-card p-4 sm:p-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">
              Effective period
            </h2>

            <p className="text-sm text-muted-foreground">
              Define when this tariff version becomes applicable and, optionally,
              when it stops being effective.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Effective from */}

            <div className="space-y-2">
              <Label>
                Effective From{" "}
                <span className="text-red-500">*</span>
              </Label>

              <EthiopianDatePicker
                value={parseDate(values.effective_from)}
                onChange={(date: Date) =>
                  setField(
                    "effective_from",
                    formatDateForForm(date),
                  )
                }
                placeholder="Select start date"
                disabled={isBusy}
                searchable
                yearMode="FULL"
                minYear={1900}
                maxYear={2200}
              />

              {errors.effectiveFrom && (
                <p className="flex items-start gap-1.5 text-xs text-red-500">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {errors.effectiveFrom}
                </p>
              )}
            </div>

            {/* Effective to */}

            <div className="space-y-2">
              <div className="flex min-h-5 items-center justify-between gap-2">
                <Label>
                  Effective To{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>

                {values.effective_to && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={() => setField("effective_to", "")}
                    disabled={isBusy}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Clear
                  </Button>
                )}
              </div>

              <EthiopianDatePicker
                value={parseDate(values.effective_to)}
                onChange={(date: Date) =>
                  setField(
                    "effective_to",
                    formatDateForForm(date),
                  )
                }
                placeholder="Select end date"
                disabled={isBusy}
                searchable
                yearMode="FULL"
                minYear={1900}
                maxYear={2200}
              />

              {errors.effectiveTo ? (
                <p className="flex items-start gap-1.5 text-xs text-red-500">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {errors.effectiveTo}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Leave blank if the version has no defined end date.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Status */}

        <section className="space-y-5 rounded-xl border bg-card p-4 sm:p-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">
              Status
            </h2>

            <p className="text-sm text-muted-foreground">
              Choose whether this tariff version should be active.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>

              <div className="min-w-0 space-y-1">
                <Label
                  htmlFor="tariff-is-active"
                  className="text-sm font-medium"
                >
                  Set as active version
                </Label>

                <p className="text-xs leading-5 text-muted-foreground">
                  New assessments may use this versions pricing once the
                  server accepts the activation.
                </p>
              </div>
            </div>

            <Switch
              id="tariff-is-active"
              checked={values.isActive}
              onCheckedChange={(checked) =>
                setField("isActive", checked)
              }
              disabled={isBusy}
            />
          </div>

          {values.isActive && hasActiveVersion && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Another version is currently active
                </p>

                <p className="text-xs leading-5 text-amber-800 dark:text-amber-300">
                  The server must validate activation and enforce the rule
                  for how many tariff versions may be active.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Submission error */}

        {errors.submit && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{errors.submit}</p>
          </div>
        )}
      </div>

      {/* Actions */}

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          <span className="text-red-500">*</span> Required fields
        </p>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isBusy}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isBusy}
            className="min-w-36"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                {isEditMode ? "Update Version" : "Create Version"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
