
"use client";

import { useEffect, useRef, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
  Layers,
  CalendarRange,
  Sparkles,
  X,
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
    | "year"
    | "name"
    | "effectiveFrom"
    | "effectiveTo"
    | "submit",
    string
  >
>;

// ============================================================================
// DATE HELPERS
// ============================================================================

/**
 * Parse a Gregorian YYYY-MM-DD date into a local Date.
 *
 * ISO datetime strings are supported by extracting their date portion.
 * Local construction avoids UTC timezone shifts.
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
 *
 * The API stores Gregorian dates even though the UI displays
 * Ethiopian calendar dates.
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

/**
 * Normalize API date values to YYYY-MM-DD.
 */
function normalizeDate(value?: string | null): string {
  if (!value) {
    return "";
  }

  return value.substring(0, 10);
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

function buildDefaultValues(
  existingYears: number[],
): TariffVersionFormValues {
  const validYears = existingYears.filter(
    (year) => Number.isInteger(year) && year >= 1900 && year <= 3000,
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

interface TariffVersionFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  /**
   * Existing tariff years.
   * The parent excludes the currently edited version.
   */
  existingYears: number[];

  /**
   * Whether an active tariff version currently exists.
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
}

// ============================================================================
// SECTION LABEL
// ============================================================================

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: typeof Layers;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TariffVersionFormSheet({
  open,
  onOpenChange,
  existingYears,
  hasActiveVersion,
  initialValues,
  onSubmit,
}: TariffVersionFormSheetProps) {
  const isEditMode = Boolean(initialValues);

  const [values, setValues] = useState<TariffVersionFormValues>(() =>
    buildInitialValues(initialValues, existingYears),
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  /**
   * Track each open/edit session so changing array references during
   * ordinary renders cannot reset the user's unsaved form values.
   */
  const previousSessionRef = useRef<{
    open: boolean;
    initialValues: TariffVersionFormInitialValues | undefined;
  }>({
    open: false,
    initialValues: undefined,
  });

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
      delete next[key as keyof FormErrors];
      delete next.submit;

      if (key === "effective_from") {
        delete next.effectiveTo;
      }

      if (key === "year") {
        delete next.year;
      }

      return next;
    });
  };

  // ==========================================================================
  // RESET FORM
  // ==========================================================================

  const resetForm = () => {
    setValues(buildInitialValues(undefined, existingYears));
    setErrors({});
    setNameTouched(false);
  };

  // ==========================================================================
  // INITIALIZE FORM
  // ==========================================================================

  useEffect(() => {
    if (!open) {
      previousSessionRef.current = {
        open: false,
        initialValues,
      };

      return;
    }

    const previousSession = previousSessionRef.current;

    const isNewSession =
      !previousSession.open ||
      previousSession.initialValues !== initialValues;

    previousSessionRef.current = {
      open: true,
      initialValues,
    };

    if (!isNewSession) {
      return;
    }

    setValues(buildInitialValues(initialValues, existingYears));
    setNameTouched(Boolean(initialValues?.name));
    setErrors({});
  }, [open, initialValues, existingYears]);

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

  const handleSubmit = async () => {
    if (isSubmitting || !validate()) {
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

      resetForm();
    } catch (error) {
      // Keep the sheet open and preserve the entered values.
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
  // SHEET OPEN CHANGE
  // ==========================================================================

  const handleOpenChange = (next: boolean) => {
    if (isSubmitting) {
      return;
    }

    onOpenChange(next);

    if (!next) {
      resetForm();
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-4 sm:max-w-xl"
      >
        {/* Header */}

        <SheetHeader className="border-b pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarClock className="h-5 w-5" />
          </div>

          <SheetTitle>
            {isEditMode ? "Edit Tariff Version" : "New Tariff Version"}
          </SheetTitle>

          <SheetDescription>
            {isEditMode
              ? "Update the tariff version details and effective period."
              : "Create a yearly tariff version. Add its pricing rules and formulas afterward."}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable form */}

        <div className="min-h-0 flex-1 overflow-y-auto px-1 py-4">
          <div className="space-y-6">
            {/* Version details */}

            <section className="space-y-3">
              <SectionLabel icon={Layers}>
                Version details
              </SectionLabel>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[100px_1fr]">
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
                    disabled={isSubmitting}
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
                      className="flex items-center gap-1 text-xs text-red-500"
                    >
                      <AlertCircle className="h-3 w-3 shrink-0" />
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
                    disabled={isSubmitting}
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
                      className="flex items-center gap-1 text-xs text-red-500"
                    >
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}

              <div className="space-y-1.5">
                <Label htmlFor="tariff-description">
                  Description{" "}
                  <span className="text-muted-foreground">
                    (optional)
                  </span>
                </Label>

                <Textarea
                  id="tariff-description"
                  value={values.description}
                  onChange={(event) =>
                    setField("description", event.target.value)
                  }
                  placeholder="Internal note about this tariff version..."
                  rows={3}
                  disabled={isSubmitting}
                  className="resize-none"
                />
              </div>
            </section>

            {/* Effective period */}

            <section className="space-y-3">
              <SectionLabel icon={CalendarRange}>
                Effective period
              </SectionLabel>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Effective from */}

                <div className="space-y-1.5">
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
                    disabled={isSubmitting}
                    searchable
                    yearMode="FULL"
                    minYear={1900}
                    maxYear={2200}
                  />

                  {errors.effectiveFrom && (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.effectiveFrom}
                    </p>
                  )}
                </div>

                {/* Effective to */}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label>
                      Effective To{" "}
                      <span className="text-muted-foreground">
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
                        disabled={isSubmitting}
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Clear date
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
                    disabled={isSubmitting}
                    searchable
                    yearMode="FULL"
                    minYear={1900}
                    maxYear={2200}
                  />

                  {errors.effectiveTo ? (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.effectiveTo}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Leave blank for an open-ended version.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Status */}

            <section className="space-y-3">
              <SectionLabel icon={Sparkles}>
                Status
              </SectionLabel>

              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                <div className="min-w-0 pr-4">
                  <Label
                    htmlFor="tariff-is-active"
                    className="text-sm"
                  >
                    Set as active version
                  </Label>

                  <p className="text-xs text-muted-foreground">
                    New assessments may use this version's pricing once
                    activation is accepted by the server.
                  </p>
                </div>

                <Switch
                  id="tariff-is-active"
                  checked={values.isActive}
                  onCheckedChange={(checked) =>
                    setField("isActive", checked)
                  }
                  disabled={isSubmitting}
                />
              </div>

              {values.isActive && hasActiveVersion && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />

                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Another tariff version is currently active. The server
                    must validate activation and ensure only the permitted
                    version remains active.
                  </p>
                </div>
              )}
            </section>

            {/* Submission error */}

            {errors.submit && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{errors.submit}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}

        <SheetFooter className="border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditMode ? "Update Version" : "Create Version"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
