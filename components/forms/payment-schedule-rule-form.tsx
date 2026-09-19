"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Info,
  Save,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import type { RevenueCode } from "@/types/revenue/revenue-code";
import type { PaymentScheduleRuleFormValues } from "@/types/revenue/payment-schedule-rule";
import { RevenueCodeDropdown } from "../input/RevenuCodeDropDown";

type PaymentScheduleRuleFormProps = {
  mode: "create" | "edit";
  initialValues?: Partial<PaymentScheduleRuleFormValues>;
  onSubmit?: (values: PaymentScheduleRuleFormValues) => void;
  isSubmitting?: boolean;
};

// Common installment splits an operator can apply in one click.
const QUICK_PERCENTAGES = [10, 20, 25, 33, 50];

export default function PaymentScheduleRuleForm({
  mode,
  initialValues,
  onSubmit,
  isSubmitting = false,
}: PaymentScheduleRuleFormProps) {
  /*
  |--------------------------------------------------------------------------
  | FORM STATE
  |--------------------------------------------------------------------------
  */

  const [revenueCodeId, setRevenueCodeId] = useState<string>(
    initialValues?.revenueCodeId ?? "",
  );

  const [selectedRevenueCode, setSelectedRevenueCode] =
    useState<RevenueCode | null>(null);

  const [isEnabled, setIsEnabled] = useState<boolean>(
    initialValues?.isEnabled ?? true,
  );

  const [firstInstallmentPercentage, setFirstInstallmentPercentage] =
    useState<string>(initialValues?.firstInstallmentPercentage ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});

  /*
  |--------------------------------------------------------------------------
  | DERIVED VALUES
  |--------------------------------------------------------------------------
  */

  const parsedPercentage = useMemo(() => {
    const trimmed = firstInstallmentPercentage.trim();
    if (!trimmed) return null;

    const value = Number(trimmed);
    if (!Number.isFinite(value) || value <= 0 || value > 100) return null;

    return value;
  }, [firstInstallmentPercentage]);

  const isDirty =
    revenueCodeId !== (initialValues?.revenueCodeId ?? "") ||
    isEnabled !== (initialValues?.isEnabled ?? true) ||
    firstInstallmentPercentage !==
      (initialValues?.firstInstallmentPercentage ?? "");

  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!revenueCodeId) {
      nextErrors.revenueCodeId = "Select a revenue code to continue.";
    }

    // First installment percentage is optional — only validate when present.
    if (firstInstallmentPercentage.trim()) {
      const percentage = Number(firstInstallmentPercentage);

      if (!Number.isFinite(percentage)) {
        nextErrors.firstInstallmentPercentage = "Enter a valid percentage.";
      } else if (percentage <= 0 || percentage > 100) {
        nextErrors.firstInstallmentPercentage =
          "Percentage must be greater than 0 and no more than 100.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /*
  |--------------------------------------------------------------------------
  | HANDLERS
  |--------------------------------------------------------------------------
  */

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    onSubmit?.({
      revenueCodeId,
      isEnabled,
      firstInstallmentPercentage: firstInstallmentPercentage.trim(),
    });
  };

  const handleRevenueCodeChange = (value: string, item: RevenueCode) => {
    setRevenueCodeId(value);
    setSelectedRevenueCode(item);

    if (errors.revenueCodeId) {
      setErrors((current) => {
        const next = { ...current };
        delete next.revenueCodeId;
        return next;
      });
    }
  };

  const handlePercentageChange = (value: string) => {
    setFirstInstallmentPercentage(value);

    if (errors.firstInstallmentPercentage) {
      setErrors((current) => {
        const next = { ...current };
        delete next.firstInstallmentPercentage;
        return next;
      });
    }
  };

  const handleQuickPercentage = (value: number) => {
    handlePercentageChange(String(value));
  };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <form onSubmit={handleSubmit} className="space-y-6 ">


      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        {/* ================================================================ */}
        {/* MAIN COLUMN */}
        {/* ================================================================ */}

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <CalendarClock className="size-4.5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Revenue code</CardTitle>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    The rule applies to every assessment billed under this
                    code.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="revenue-code">
                  Revenue code <span className="text-destructive">*</span>
                </Label>

                <RevenueCodeDropdown
                  value={revenueCodeId || null}
                  onChange={handleRevenueCodeChange}
                  disabled={mode === "edit"}
                />

                {errors.revenueCodeId ? (
                  <p className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertCircle className="size-3.5" />
                    {errors.revenueCodeId}
                  </p>
                ) : mode === "edit" ? (
                  <p className="text-xs text-muted-foreground">
                    The revenue code can't be changed after a rule is
                    created — create a new rule instead.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scheduling</CardTitle>
              <p className="text-sm text-muted-foreground">
                Turn payment scheduling on or off, and set the split for the
                first installment.
              </p>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* ---------------------------------------------------------- */}
              {/* ENABLE TOGGLE */}
              {/* ---------------------------------------------------------- */}

              <div className="flex items-center justify-between gap-6 rounded-lg border p-4">
                <div className="space-y-1">
                  <Label
                    htmlFor="payment-scheduling-enabled"
                    className="cursor-pointer font-medium"
                  >
                    Payment scheduling
                  </Label>
                  <p className="max-w-md text-sm text-muted-foreground">
                    When on, assessments using this revenue code can have
                    payment schedules generated during approval.
                  </p>
                </div>

                <Switch
                  id="payment-scheduling-enabled"
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                  disabled={isSubmitting}
                />
              </div>

              {/* ---------------------------------------------------------- */}
              {/* FIRST INSTALLMENT */}
              {/* ---------------------------------------------------------- */}

              {isEnabled ? (
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="first-installment" className="font-medium">
                      First installment percentage
                    </Label>
                    <Badge variant="secondary" className="font-normal">
                      Optional
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-32">
                      <Input
                        id="first-installment"
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={firstInstallmentPercentage}
                        onChange={(event) =>
                          handlePercentageChange(event.target.value)
                        }
                        placeholder="20"
                        disabled={isSubmitting}
                        aria-invalid={Boolean(
                          errors.firstInstallmentPercentage,
                        )}
                        className={`pr-7 ${
                          errors.firstInstallmentPercentage
                            ? "border-destructive"
                            : ""
                        }`}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {QUICK_PERCENTAGES.map((value) => (
                        <Button
                          key={value}
                          type="button"
                          size="sm"
                          variant={
                            parsedPercentage === value ? "default" : "outline"
                          }
                          disabled={isSubmitting}
                          onClick={() => handleQuickPercentage(value)}
                          className="h-7 px-2.5 text-xs"
                        >
                          {value}%
                        </Button>
                      ))}
                    </div>
                  </div>

                  {errors.firstInstallmentPercentage && (
                    <p className="flex items-center gap-1.5 text-sm text-destructive">
                      <AlertCircle className="size-3.5" />
                      {errors.firstInstallmentPercentage}
                    </p>
                  )}

                  {parsedPercentage ? (
                    <InstallmentSplitBar percentage={parsedPercentage} />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Leave blank if this revenue code doesn't require a
                      fixed first-installment percentage — assessments can
                      still use scheduling without one.
                    </p>
                  )}
                </div>
              ) : (
                <Alert>
                  <Info className="size-4" />
                  <AlertTitle>Scheduling is off</AlertTitle>
                  <AlertDescription>
                    Assessments using this revenue code won't automatically
                    receive payment schedules while this rule is inactive.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Actions live under the fields on small screens */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end lg:hidden">
            <FormActions
              mode={mode}
              isSubmitting={isSubmitting}
              isDirty={isDirty}
            />
          </div>
        </div>

        {/* ================================================================ */}
        {/* SUMMARY SIDEBAR */}
        {/* ================================================================ */}

        <div className="lg:sticky lg:top-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">Summary</CardTitle>
              {isEnabled ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                >
                  <CheckCircle2 className="mr-1 size-3.5" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </CardHeader>

            <CardContent>
              {!selectedRevenueCode ? (
                <div className="flex items-start gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {mode === "edit"
                      ? "Loading revenue code details…"
                      : "Select a revenue code to see how this rule will apply."}
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Revenue code
                    </span>
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-mono font-semibold">
                        {selectedRevenueCode.code}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {selectedRevenueCode.name}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <dl className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Scheduling</dt>
                      <dd className="font-medium">
                        {isEnabled ? "Enabled" : "Disabled"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">
                        First installment
                      </dt>
                      <dd className="font-medium">
                        {parsedPercentage
                          ? `${parsedPercentage}%`
                          : "Not set"}
                      </dd>
                    </div>
                  
                  </dl>

                  {isEnabled && !parsedPercentage && (
                    <>
                      <Separator />
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <Info className="mt-0.5 size-3.5 shrink-0" />
                        <p>
                          No first-installment percentage is set. Scheduling
                          will still apply without a fixed split.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions sit beside the summary on larger screens */}
          <div className="mt-6 hidden flex-col-reverse gap-3 sm:flex-row sm:justify-end lg:flex">
            <FormActions
              mode={mode}
              isSubmitting={isSubmitting}
              isDirty={isDirty}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

/*
|------------------------------------------------------------------------------
| SUB-COMPONENTS
|------------------------------------------------------------------------------
*/

function InstallmentSplitBar({ percentage }: { percentage: number }) {
  const remaining = 100 - percentage;

  return (
    <div className="space-y-1.5">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>First installment · {percentage}%</span>
        <span>Remaining · {remaining}%</span>
      </div>
    </div>
  );
}

function FormActions({
  mode,
  isSubmitting,
  isDirty,
}: {
  mode: "create" | "edit";
  isSubmitting: boolean;
  isDirty: boolean;
}) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={isSubmitting}
        onClick={() => window.history.back()}
      >
        Cancel
      </Button>

      <Button type="submit" disabled={isSubmitting || !isDirty}>
        <Save className="mr-2 size-4" />
        {isSubmitting
          ? "Saving…"
          : mode === "create"
            ? "Create rule"
            : "Save changes"}
      </Button>
    </>
  );
}