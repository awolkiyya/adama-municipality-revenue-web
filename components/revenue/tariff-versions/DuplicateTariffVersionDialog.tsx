
"use client";

import { useState } from "react";
import { Copy, Loader2, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useDuplicateTariffVersion } from "@/hooks/revenue/revenueVersion.hook";
import type { TariffVersion } from "@/types/revenue/tariff-version";
import { EthiopianDatePicker } from "@/components/input/EthiopianDatePicker";

// =====================================================
// TYPES
// =====================================================

interface DuplicateTariffVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceVersion: TariffVersion | null;
}

interface DuplicateTariffVersionFormValues {
  year: string;
  effective_from: string;
  effective_to: string;
}

// =====================================================
// DATE HELPERS
// =====================================================

/**
 * Parse a Gregorian YYYY-MM-DD string into a local Date.
 * Using local date parts avoids UTC timezone date shifts.
 */
function parseLocalDate(value: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return undefined;
  }

  const [, year, month, day] = match;

  const parsedYear = Number(year);
  const parsedMonth = Number(month);
  const parsedDay = Number(day);

  const date = new Date(
    parsedYear,
    parsedMonth - 1,
    parsedDay
  );

  if (
    date.getFullYear() !== parsedYear ||
    date.getMonth() !== parsedMonth - 1 ||
    date.getDate() !== parsedDay
  ) {
    return undefined;
  }

  return date;
}

/**
 * Convert a Date into the Gregorian YYYY-MM-DD format expected by the API.
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =====================================================
// INITIAL VALUES
// =====================================================

function getInitialValues(
  sourceVersion: TariffVersion | null
): DuplicateTariffVersionFormValues {
  const currentYear = new Date().getFullYear();

  const targetYear = sourceVersion
    ? Math.max(currentYear, sourceVersion.year + 1)
    : currentYear;

  return {
    year: String(targetYear),
    effective_from: `${targetYear}-01-01`,
    effective_to: "",
  };
}

function versionDisplayName(year: number): string {
  return `${year} Standard Tariff`;
}

// =====================================================
// PUBLIC DIALOG COMPONENT
// =====================================================

export function DuplicateTariffVersionDialog({
  open,
  onOpenChange,
  sourceVersion,
}: DuplicateTariffVersionDialogProps) {
  /*
   * Remount the inner dialog content when:
   * - The dialog opens or closes.
   * - A different source version is selected.
   * - The source version's relevant data changes.
   *
   * This resets the form without using an effect.
   */
  const dialogKey = JSON.stringify([
    open,
    sourceVersion?.id ?? null,
    sourceVersion?.year ?? null,
    sourceVersion?.name ?? null,
    sourceVersion?.version ?? null,
    sourceVersion?.tariffRulesCount ?? null,
  ]);

  return (
    <DuplicateTariffVersionDialogContent
      key={dialogKey}
      open={open}
      onOpenChange={onOpenChange}
      sourceVersion={sourceVersion}
    />
  );
}

// =====================================================
// DIALOG CONTENT
// =====================================================

function DuplicateTariffVersionDialogContent({
  open,
  onOpenChange,
  sourceVersion,
}: DuplicateTariffVersionDialogProps) {
  const duplicateMutation = useDuplicateTariffVersion();

  // Initialize the form from the selected source version.
  // The keyed parent handles subsequent resets.
  const [values, setValues] =
    useState<DuplicateTariffVersionFormValues>(() =>
      getInitialValues(sourceVersion)
    );

  // =====================================================
  // DERIVED VALUES
  // =====================================================

  const targetYear = Number(values.year);

  const validYear =
    /^\d{4}$/.test(values.year) &&
    Number.isInteger(targetYear) &&
    targetYear > 0;

  const effectiveFromDate = parseLocalDate(
    values.effective_from
  );

  const effectiveToDate = parseLocalDate(
    values.effective_to
  );

  const validDates =
    Boolean(effectiveFromDate) &&
    (!values.effective_to ||
      (Boolean(effectiveToDate) &&
        values.effective_to >= values.effective_from));

  const isPending = duplicateMutation.isPending;

  // =====================================================
  // ACTIONS
  // =====================================================

  const handleClose = (nextOpen: boolean) => {
    if (isPending) {
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleYearChange = (year: string) => {
    setValues((current) => {
      const shouldUpdateStartDate =
        /^\d{4}$/.test(year) &&
        current.effective_from.endsWith("-01-01");

      return {
        ...current,
        year,
        effective_from: shouldUpdateStartDate
          ? `${year}-01-01`
          : current.effective_from,
      };
    });
  };

  const handleStartDateChange = (date: Date) => {
    setValues((current) => ({
      ...current,
      effective_from: formatLocalDate(date),
    }));
  };

  const handleEndDateChange = (date: Date) => {
    setValues((current) => ({
      ...current,
      effective_to: formatLocalDate(date),
    }));
  };

  const handleClearEndDate = () => {
    setValues((current) => ({
      ...current,
      effective_to: "",
    }));
  };

  // =====================================================
  // DUPLICATE
  // =====================================================

  const handleDuplicate = async () => {
    if (!sourceVersion || !validYear || !validDates || isPending) {
      return;
    }

    try {
      await duplicateMutation.mutateAsync({
        id: sourceVersion.id,
        data: {
          year: targetYear,
          name: versionDisplayName(targetYear),
          effective_from: values.effective_from,
          effective_to: values.effective_to || null,
        },
      });

      onOpenChange(false);
    } catch {
      // The mutation hook handles the error toast.
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate Tariff Version
          </DialogTitle>

          <DialogDescription>
            Create an independent copy of the selected tariff
            configuration. Its rules and formulas will be copied
            by the backend. The source version remains unchanged.
          </DialogDescription>
        </DialogHeader>

        {sourceVersion && (
          <div className="space-y-5">
            {/* Source version */}

            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                Source version
              </p>

              <p className="mt-1 text-sm font-semibold">
                {sourceVersion.name ||
                  versionDisplayName(sourceVersion.year)}
              </p>

              <p className="text-xs text-muted-foreground">
                Year {sourceVersion.year} · v
                {sourceVersion.version ?? 1} ·{" "}
                {sourceVersion.tariffRulesCount ?? 0} rules
              </p>
            </div>

            {/* Target year */}

            <div className="space-y-2">
              <Label htmlFor="duplicate-year">
                Target year
              </Label>

              <Input
                id="duplicate-year"
                type="number"
                min={1}
                max={9999}
                step={1}
                value={values.year}
                onChange={(event) =>
                  handleYearChange(event.target.value)
                }
                disabled={isPending}
                required
              />

              <p className="text-xs text-muted-foreground">
                The backend should assign the correct version number
                for this year.
              </p>
            </div>

            {/* Effective start date */}

            <div className="space-y-2">
              <Label>Effective from</Label>

              <EthiopianDatePicker
                value={effectiveFromDate}
                onChange={handleStartDateChange}
                placeholder="Select effective start date"
                yearMode="FULL"
                minYear={1900}
                maxYear={2200}
                searchable
                disabled={isPending}
              />

              {!effectiveFromDate && values.effective_from && (
                <p className="text-xs text-destructive">
                  Select a valid start date.
                </p>
              )}
            </div>

            {/* Effective end date */}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Effective to (optional)</Label>

                {values.effective_to && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={handleClearEndDate}
                    disabled={isPending}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Clear date
                  </Button>
                )}
              </div>

              <EthiopianDatePicker
                value={effectiveToDate}
                onChange={handleEndDateChange}
                placeholder="Select effective end date"
                yearMode="FULL"
                minYear={1900}
                maxYear={2200}
                searchable
                disabled={isPending}
              />

              <p className="text-xs text-muted-foreground">
                Leave blank if the end date has not been determined.
              </p>

              {values.effective_to && !effectiveToDate && (
                <p className="text-xs text-destructive">
                  Select a valid end date.
                </p>
              )}

              {effectiveFromDate &&
                effectiveToDate &&
                values.effective_to < values.effective_from && (
                  <p className="text-xs text-destructive">
                    The end date must be on or after the start date.
                  </p>
                )}
            </div>

            {/* Important behavior */}

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                The duplicated version should remain inactive and
                unapproved until its copied rules and formulas have
                been reviewed and approved. Duplication must not
                change existing assessments or invoices.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleDuplicate}
            disabled={
              isPending ||
              !sourceVersion ||
              !validYear ||
              !validDates
            }
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Duplicating...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Rules and Formulas
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
