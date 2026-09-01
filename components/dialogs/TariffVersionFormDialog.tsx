"use client";

import { useEffect, useState } from "react";

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

// ============================================================================
// INITIAL VALUES
// ============================================================================

export interface TariffVersionFormInitialValues {
    year?: string;
    name?: string;
    description?: string;
    effective_from?: string;
    effective_to?: string;
    isActive?: boolean;
}

// ============================================================================
// DATE HELPERS
// ============================================================================

/**
 * Convert a YYYY-MM-DD string to a Date.
 *
 * EthiopianDatePicker works with Date objects while the form/API
 * boundary uses YYYY-MM-DD strings.
 */
function parseDate(
    value: string
): Date | undefined {
    if (!value) {
        return undefined;
    }

    /**
     * If the backend accidentally sends an ISO datetime such as:
     *
     * 2026-01-01T00:00:00.000Z
     *
     * normalize it to the date portion first.
     */
    const normalized =
        value.length >= 10
            ? value.substring(0, 10)
            : value;

    const parsed = new Date(
        `${normalized}T00:00:00`
    );

    return Number.isNaN(
        parsed.getTime()
    )
        ? undefined
        : parsed;
}

/**
 * Convert a Date object into YYYY-MM-DD.
 *
 * IMPORTANT:
 * We intentionally do not use toISOString() here because that can
 * shift the calendar date depending on timezone.
 */
function formatDateForForm(
    date: Date | undefined
): string {
    if (!date) {
        return "";
    }

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const nextYear =
    new Date().getFullYear() + 1;

const DEFAULT_VALUES:
    TariffVersionFormValues = {
    year: String(nextYear),

    name:
        `${nextYear} Standard Tariff`,

    description: "",

    effective_from:
        `${nextYear}-01-01`,

    effective_to: "",

    isActive: false,
};

// ============================================================================
// PROPS
// ============================================================================

interface TariffVersionFormSheetProps {
    open: boolean;

    onOpenChange: (
        open: boolean
    ) => void;

    /**
     * Existing tariff years.
     *
     * The parent excludes the currently edited version.
     */
    existingYears: number[];

    /**
     * Whether another tariff version is currently active.
     */
    hasActiveVersion: boolean;

    /**
     * Existing values when editing a tariff version.
     *
     * Undefined = CREATE mode.
     */
    initialValues?: TariffVersionFormInitialValues;

    /**
     * Submit handler used by both create and update.
     */
    onSubmit: (
        values: TariffVersionFormValues
    ) => Promise<void>;
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
    // --------------------------------------------------------------------------
    // Mode
    // --------------------------------------------------------------------------

    const isEditMode =
        Boolean(initialValues);

    // --------------------------------------------------------------------------
    // Form state
    // --------------------------------------------------------------------------

    const [values, setValues] =
        useState<TariffVersionFormValues>(
            DEFAULT_VALUES
        );

    // --------------------------------------------------------------------------
    // Validation
    // --------------------------------------------------------------------------

    const [errors, setErrors] =
        useState<
            Record<string, string>
        >({});

    // --------------------------------------------------------------------------
    // Submit state
    // --------------------------------------------------------------------------

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    // --------------------------------------------------------------------------
    // Name state
    // --------------------------------------------------------------------------

    /**
     * Once the user manually edits the name, automatic year-based
     * name generation stops.
     */
    const [nameTouched, setNameTouched] =
        useState(false);

    // ==========================================================================
    // SET FIELD
    // ==========================================================================

    const setField = <
        K extends keyof TariffVersionFormValues
    >(
        key: K,
        value: TariffVersionFormValues[K]
    ) => {
        setValues(
            (previous) => ({
                ...previous,
                [key]: value,
            })
        );

        setErrors(
            (previous) => ({
                ...previous,
                [key]: "",
            })
        );
    };

    // ==========================================================================
    // RESET FORM
    // ==========================================================================

    const resetForm = () => {
        setValues(
            DEFAULT_VALUES
        );

        setErrors({});

        setNameTouched(false);

        setIsSubmitting(false);
    };

    // ==========================================================================
    // CREATE DEFAULT VALUES
    // ==========================================================================

    const buildCreateValues =
        (): TariffVersionFormValues => {
            /**
             * existingYears already excludes the currently edited
             * version in the parent component.
             *
             * Therefore the maximum existing year can be used to
             * determine the next suggested year.
             */
            const latestYear =
                existingYears.length > 0
                    ? Math.max(
                          ...existingYears
                      )
                    : new Date().getFullYear();

            const suggestedYear =
                latestYear + 1;

            return {
                year:
                    String(
                        suggestedYear
                    ),

                name:
                    `${suggestedYear} Standard Tariff`,

                description: "",

                effective_from:
                    `${suggestedYear}-01-01`,

                effective_to: "",

                isActive: false,
            };
        };

    // ==========================================================================
    // INITIALIZE FORM
    // ==========================================================================

    useEffect(() => {
        if (!open) {
            return;
        }

        // ----------------------------------------------------------------------
        // EDIT MODE
        // ----------------------------------------------------------------------

        if (initialValues) {
            const year =
                initialValues.year ??
                "";

            setValues({
                year,

                name:
                    initialValues.name ??
                    (year
                        ? `${year} Standard Tariff`
                        : ""),

                description:
                    initialValues.description ??
                    "",

                effective_from:
                    initialValues.effective_from ??
                    "",

                effective_to:
                    initialValues.effective_to ??
                    "",

                isActive:
                    initialValues.isActive ??
                    false,
            });

            /**
             * Existing name is considered already touched so changing
             * the year while editing does not unexpectedly replace it.
             */
            setNameTouched(
                Boolean(
                    initialValues.name
                )
            );

            setErrors({});

            return;
        }

        // ----------------------------------------------------------------------
        // CREATE MODE
        // ----------------------------------------------------------------------

        setValues(
            buildCreateValues()
        );

        setNameTouched(false);

        setErrors({});
    }, [
        open,
        initialValues,
        existingYears,
    ]);

    // ==========================================================================
    // YEAR CHANGE
    // ==========================================================================

    const handleYearChange = (
        year: string
    ) => {
        setField(
            "year",
            year
        );

        /**
         * Only automatically generate the effective-from date when
         * the user has entered a complete 4-digit year.
         */
        if (
            year.length === 4 &&
            /^\d{4}$/.test(year)
        ) {
            setField(
                "effective_from",
                `${year}-01-01`
            );

            if (!nameTouched) {
                setField(
                    "name",
                    `${year} Standard Tariff`
                );
            }
        }
    };

    // ==========================================================================
    // VALIDATION
    // ==========================================================================

    const validate =
        (): boolean => {
            const next:
                Record<
                    string,
                    string
                > = {};

            // ------------------------------------------------------------------
            // Year
            // ------------------------------------------------------------------

            const numericYear =
                Number(values.year);

            if (
                !values.year.trim()
            ) {
                next.year =
                    "Year is required.";
            } else if (
                !Number.isInteger(
                    numericYear
                )
            ) {
                next.year =
                    "Year must be a valid whole number.";
            } else if (
                numericYear < 1900 ||
                numericYear > 3000
            ) {
                next.year =
                    "Please enter a valid year.";
            } else if (
                existingYears.includes(
                    numericYear
                )
            ) {
                next.year =
                    "A tariff version for this year already exists.";
            }

            // ------------------------------------------------------------------
            // Name
            // ------------------------------------------------------------------

            if (
                !values.name.trim()
            ) {
                next.name =
                    "Name is required.";
            }

            // ------------------------------------------------------------------
            // Effective from
            // ------------------------------------------------------------------

            if (
                !values.effective_from
            ) {
                next.effectiveFrom =
                    "Start date is required.";
            }

            // ------------------------------------------------------------------
            // Effective to
            // ------------------------------------------------------------------

            if (
                values.effective_to &&
                values.effective_from &&
                values.effective_to <
                    values.effective_from
            ) {
                next.effectiveTo =
                    "End date must be after the start date.";
            }

            // ------------------------------------------------------------------
            // Store errors
            // ------------------------------------------------------------------

            setErrors(next);

            return (
                Object.keys(
                    next
                ).length === 0
            );
        };

    // ==========================================================================
    // SUBMIT
    // ==========================================================================

    const handleSubmit =
        async () => {
            if (!validate()) {
                return;
            }

            setIsSubmitting(
                true
            );

            try {
                /**
                 * Always submit a clean object.
                 *
                 * This ensures no undefined properties are accidentally
                 * sent to the parent/API.
                 */
                await onSubmit({
                    year:
                        values.year.trim(),

                    name:
                        values.name.trim(),

                    description:
                        values.description.trim(),

                    effective_from:
                        values.effective_from,

                    effective_to:
                        values.effective_to,

                    isActive:
                        values.isActive,
                });

                /**
                 * Parent closes the sheet after successful mutation.
                 */
                resetForm();
            } finally {
                setIsSubmitting(
                    false
                );
            }
        };

    // ==========================================================================
    // SHEET OPEN CHANGE
    // ==========================================================================

    const handleOpenChange = (
        next: boolean
    ) => {
        /**
         * Do not allow the sheet to close while a request is running.
         */
        if (
            isSubmitting
        ) {
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
        <Sheet
            open={open}
            onOpenChange={
                handleOpenChange
            }
        >
            <SheetContent
                side="right"
                className="flex w-full flex-col sm:max-w-xl p-4"
            >
                {/* ================================================================= */}
                {/* Header */}
                {/* ================================================================= */}

                <SheetHeader className="border-b pb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CalendarClock className="h-5 w-5" />
                    </div>

                    <SheetTitle>
                        {isEditMode
                            ? "Edit Tariff Version"
                            : "New Tariff Version"}
                    </SheetTitle>

                    <SheetDescription>
                        {isEditMode
                            ? "Update the yearly tariff version and its effective period."
                            : "Create a new yearly pricing container. You can add individual pricing rules to it afterward."}
                    </SheetDescription>
                </SheetHeader>

                {/* ================================================================= */}
                {/* Scrollable Form */}
                {/* ================================================================= */}

                <div className="min-h-0 flex-1 overflow-y-auto px-1 py-4">
                    <div className="space-y-6">
                        {/* ========================================================= */}
                        {/* Version Details */}
                        {/* ========================================================= */}

                        <div className="space-y-3">
                            <SectionLabel icon={Layers}>
                                Version details
                            </SectionLabel>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[100px_1fr]">
                                {/* ------------------------------------------------- */}
                                {/* Year */}
                                {/* ------------------------------------------------- */}

                                <div className="space-y-1.5">
                                    <Label htmlFor="year">
                                        Year{" "}
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </Label>

                                    <Input
                                        id="year"
                                        type="number"
                                        value={
                                            values.year
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            handleYearChange(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="2027"
                                        disabled={
                                            isSubmitting
                                        }
                                        className={
                                            errors.year
                                                ? "border-red-400 focus-visible:ring-red-400"
                                                : ""
                                        }
                                    />
                                </div>

                                {/* ------------------------------------------------- */}
                                {/* Name */}
                                {/* ------------------------------------------------- */}

                                <div className="space-y-1.5">
                                    <Label htmlFor="name">
                                        Name{" "}
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </Label>

                                    <Input
                                        id="name"
                                        value={
                                            values.name
                                        }
                                        onChange={(
                                            event
                                        ) => {
                                            setNameTouched(
                                                true
                                            );

                                            setField(
                                                "name",
                                                event
                                                    .target
                                                    .value
                                            );
                                        }}
                                        placeholder={`${values.year || nextYear} Standard Tariff`}
                                        disabled={
                                            isSubmitting
                                        }
                                        className={
                                            errors.name
                                                ? "border-red-400 focus-visible:ring-red-400"
                                                : ""
                                        }
                                    />
                                </div>
                            </div>

                            {/* ----------------------------------------------------- */}
                            {/* Year / Name Errors */}
                            {/* ----------------------------------------------------- */}

                            {(errors.year ||
                                errors.name) && (
                                <div className="space-y-1">
                                    {errors.year && (
                                        <p className="flex items-center gap-1 text-xs text-red-500">
                                            <AlertCircle className="h-3 w-3" />

                                            {
                                                errors.year
                                            }
                                        </p>
                                    )}

                                    {errors.name && (
                                        <p className="flex items-center gap-1 text-xs text-red-500">
                                            <AlertCircle className="h-3 w-3" />

                                            {
                                                errors.name
                                            }
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* ----------------------------------------------------- */}
                            {/* Description */}
                            {/* ----------------------------------------------------- */}

                            <div className="space-y-1.5">
                                <Label htmlFor="description">
                                    Description{" "}
                                    <span className="text-muted-foreground">
                                        (optional)
                                    </span>
                                </Label>

                                <Textarea
                                    id="description"
                                    value={
                                        values.description
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setField(
                                            "description",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Internal note about what changed in this version…"
                                    rows={3}
                                    disabled={
                                        isSubmitting
                                    }
                                    className="resize-none"
                                />
                            </div>
                        </div>

                        {/* ========================================================= */}
                        {/* Effective Period */}
                        {/* ========================================================= */}

                        <div className="space-y-3">
                            <SectionLabel icon={CalendarRange}>
                                Effective period
                            </SectionLabel>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* ------------------------------------------------- */}
                                {/* Effective From */}
                                {/* ------------------------------------------------- */}

                                <div className="space-y-1.5">
                                    <Label htmlFor="effectiveFrom">
                                        Effective From{" "}
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </Label>

                                    <EthiopianDatePicker
                                        value={parseDate(
                                            values.effective_from
                                        )}
                                        onChange={(
                                            date: Date
                                        ) =>
                                            setField(
                                                "effective_from",
                                                formatDateForForm(
                                                    date
                                                )
                                            )
                                        }
                                    />

                                    {errors.effectiveFrom && (
                                        <p className="flex items-center gap-1 text-xs text-red-500">
                                            <AlertCircle className="h-3 w-3" />

                                            {
                                                errors.effectiveFrom
                                            }
                                        </p>
                                    )}
                                </div>

                                {/* ------------------------------------------------- */}
                                {/* Effective To */}
                                {/* ------------------------------------------------- */}

                                <div className="space-y-1.5">
                                    <Label htmlFor="effectiveTo">
                                        Effective To
                                    </Label>

                                    <EthiopianDatePicker
                                        value={parseDate(
                                            values.effective_to
                                        )}
                                        onChange={(
                                            date: Date
                                        ) =>
                                            setField(
                                                "effective_to",
                                                formatDateForForm(
                                                    date
                                                )
                                            )
                                        }
                                    />

                                    {errors.effectiveTo ? (
                                        <p className="flex items-center gap-1 text-xs text-red-500">
                                            <AlertCircle className="h-3 w-3" />

                                            {
                                                errors.effectiveTo
                                            }
                                        </p>
                                    ) : (
                                        <p className="text-[11px] text-muted-foreground">
                                            Leave blank for an open-ended version
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ========================================================= */}
                        {/* Status */}
                        {/* ========================================================= */}

                        <div className="space-y-3">
                            <SectionLabel icon={Sparkles}>
                                Status
                            </SectionLabel>

                            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                                <div className="min-w-0 pr-4">
                                    <Label
                                        htmlFor="isActive"
                                        className="text-sm"
                                    >
                                        Set as active version
                                    </Label>

                                    <p className="text-xs text-muted-foreground">
                                        New assessments will use this version&apos;s pricing
                                    </p>
                                </div>

                                <Switch
                                    id="isActive"
                                    checked={
                                        values.isActive
                                    }
                                    onCheckedChange={(
                                        checked
                                    ) =>
                                        setField(
                                            "isActive",
                                            checked
                                        )
                                    }
                                    disabled={
                                        isSubmitting
                                    }
                                />
                            </div>

                            {/* ----------------------------------------------------- */}
                            {/* Active warning */}
                            {/* ----------------------------------------------------- */}

                            {values.isActive &&
                                hasActiveVersion && (
                                    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />

                                        <p className="text-xs text-amber-800 dark:text-amber-300">
                                            Another version is currently active. Activating this one will automatically deactivate it.
                                        </p>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>

                {/* ================================================================= */}
                {/* Footer */}
                {/* ================================================================= */}

                <SheetFooter className="border-t pt-4">
                    {/* Cancel */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            handleOpenChange(
                                false
                            )
                        }
                        disabled={
                            isSubmitting
                        }
                    >
                        Cancel
                    </Button>

                    {/* Submit */}
                    <Button
                        type="button"
                        onClick={
                            handleSubmit
                        }
                        disabled={
                            isSubmitting
                        }
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                                {isEditMode
                                    ? "Updating..."
                                    : "Creating..."}
                            </>
                        ) : (
                            <>
                                {isEditMode
                                    ? "Update Version"
                                    : "Create Version"}
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}