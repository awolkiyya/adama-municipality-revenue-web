"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CalendarClock,
  Car,
  ChevronDown,
  FileText,
  Landmark,
  MoreVertical,
  Paperclip,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useOpenFile } from "@/hooks/use-open-file";
import { formatAmount } from "@/lib/format";
import { formatEthiopianDate } from "@/lib/utils";
import { AssessmentService } from "@/types/revenue/assessment";

import { EvidenceFileRow } from "./evidence-file-row";
import { FieldRow } from "./field-row";
import { StatusBadge } from "./status-badge";

/*
|--------------------------------------------------------------------------
| SERVICE ICONS
|--------------------------------------------------------------------------
*/

const SERVICE_ICON_RULES: Array<{
  match: RegExp;
  icon: LucideIcon;
}> = [
  {
    match: /land|property|real estate|cadastr/i,
    icon: Landmark,
  },
  {
    match: /vehicle|car|transport|plate/i,
    icon: Car,
  },
  {
    match: /business|trade|license|licence/i,
    icon: Briefcase,
  },
  {
    match: /building|construction|permit/i,
    icon: Building2,
  },
  {
    match: /income|salary|payroll|wage/i,
    icon: Wallet,
  },
];

function getServiceIcon(
  name?: string | null,
): LucideIcon {
  if (!name) {
    return FileText;
  }

  return (
    SERVICE_ICON_RULES.find(
      (rule) => rule.match.test(name),
    )?.icon ?? FileText
  );
}

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface AssessmentServiceCardProps {
  service: AssessmentService;

  /**
   * Existing LIZZ represents historical financial data,
   * not a newly calculated assessment.
   */
  isExistingLizz?: boolean;

  /**
   * Parent owns navigation / sheet state.
   *
   * The card only reports the selected assessment service.
   */
  onManageScheduledPayments?: (
    service: AssessmentService,
  ) => void;
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function AssessmentServiceCard({
  service,
  isExistingLizz = false,
  onManageScheduledPayments,
}: AssessmentServiceCardProps) {
  const {
    openFile,
    isOpening,
  } = useOpenFile();

  /*
   * ============================================================
   * STATE
   * ============================================================
   */

  const hasError =
    !isExistingLizz &&
    Boolean(service.calculationError);

  const [open, setOpen] =
    useState(hasError);

  /*
   * ============================================================
   * DERIVED DATA
   * ============================================================
   */

  const computedAmount =
    service.computedAmount;

  const originalObligation =
    service.originalObligation;

  const paidAmount =
    service.paidAmount;

  const remainingAmount =
    service.remainingAmount;

  /*
   * The backend is authoritative.
   *
   * ONE_TIME  → one-time payment
   * SCHEDULED → payment schedule applies
   */
  const hasScheduledPayments =
    service.paymentPlanType ===
    "SCHEDULED";

  const paymentPlanLabel =
    hasScheduledPayments
      ? "Scheduled"
      : "One-time";

  const paymentPlanDescription =
    hasScheduledPayments
      ? "Payment can be managed through a payment schedule."
      : "This service is payable as a one-time obligation.";

  const files =
    service.values?.flatMap(
      (value) =>
        value.files ?? [],
    ) ?? [];

  const fieldCount =
    service.values?.length ?? 0;

  const title =
    service.service?.name ??
    service.serviceCode ??
    service.serviceId;

  const Icon =
    getServiceIcon(
      service.service?.name ??
        service.serviceCode,
    );

  /*
   * For Existing LIZZ, the remaining balance
   * represents the current collectible position.
   *
   * For normal assessments, computedAmount
   * represents the current assessment result.
   */
  const displayBalance =
    isExistingLizz
      ? remainingAmount
      : computedAmount;

  /*
   * ============================================================
   * HANDLERS
   * ============================================================
   */

  const handleToggle = () => {
    setOpen(
      (value) => !value,
    );
  };

  const handleViewPaymentSchedule = () => {
    if (!hasScheduledPayments) {
      return;
    }

    onManageScheduledPayments?.(
      service,
    );
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <Card
      className={
        hasError
          ? "border-destructive/40"
          : undefined
      }
    >
      <CardHeader className="select-none pb-4">
        <div className="flex items-start gap-3">
          {/* ==================================================
              SERVICE ICON
              ================================================== */}

          <div className="relative shrink-0">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                hasError
                  ? "border-destructive/30 bg-destructive/10"
                  : "border-border bg-muted/40"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  hasError
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              />
            </div>

            {hasError && (
              <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                <AlertTriangle className="h-2.5 w-2.5" />
              </div>
            )}
          </div>

          {/* ==================================================
              TITLE + SUMMARY
              ================================================== */}

          <div
            role="button"
            tabIndex={0}
            onClick={handleToggle}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                event.preventDefault();
                handleToggle();
              }
            }}
            className="min-w-0 flex-1 cursor-pointer rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {/* TITLE */}

            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold leading-tight">
                {title}
              </h3>

              <StatusBadge
                status={service.status}
              />
            </div>

            {/* SERVICE CODE */}

            {service.service?.code && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {service.service.code}
              </p>
            )}

            {/* SUMMARY */}

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              {/* FINANCIAL SUMMARY */}

              {isExistingLizz ? (
                <>
                  {originalObligation !==
                    null &&
                    originalObligation !==
                      undefined && (
                      <span className="font-medium text-foreground">
                        Original{" "}
                        {formatAmount(
                          Number(
                            originalObligation,
                          ),
                          service.currencyCode ??
                            "",
                        )}
                      </span>
                    )}

                  {remainingAmount !==
                    null &&
                    remainingAmount !==
                      undefined && (
                      <span>
                        Remaining{" "}
                        {formatAmount(
                          Number(
                            remainingAmount,
                          ),
                          service.currencyCode ??
                            "",
                        )}
                      </span>
                    )}
                </>
              ) : (
                computedAmount !==
                  null &&
                computedAmount !==
                  undefined && (
                  <span className="font-medium text-foreground">
                    {formatAmount(
                      Number(
                        computedAmount,
                      ),
                      service.currencyCode ??
                        "",
                    )}
                  </span>
                )
              )}

              {/* CAPTURED FIELDS */}

              {fieldCount > 0 && (
                <span>
                  {fieldCount} field
                  {fieldCount === 1
                    ? ""
                    : "s"}
                </span>
              )}

              {/* FILES */}

              {files.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  {files.length}
                </span>
              )}

              {/* PAYMENT PLAN */}

              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                {hasScheduledPayments ? (
                  <CalendarClock className="h-3 w-3" />
                ) : (
                  <Wallet className="h-3 w-3" />
                )}

                {paymentPlanLabel}
              </span>

              {/* CALCULATION ERROR */}

              {hasError && (
                <span className="inline-flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  Calculation error
                </span>
              )}
            </div>
          </div>

          {/* ==================================================
              ACTIONS
              ================================================== */}

          <div className="flex shrink-0 items-center gap-1">
            {/* ACTION MENU */}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label={`Actions for ${title}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-60"
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                {/* SCHEDULED PAYMENT */}

                {hasScheduledPayments && (
                  <DropdownMenuItem
                    onSelect={
                      handleViewPaymentSchedule
                    }
                  >
                    <CalendarClock className="mr-2 h-4 w-4" />

                    <div className="flex flex-col">
                      <span>
                        View Payment Schedule
                      </span>

                      <span className="text-xs text-muted-foreground">
                        Manage scheduled payments
                      </span>
                    </div>
                  </DropdownMenuItem>
                )}

                {/* ONE-TIME */}

                {!hasScheduledPayments && (
                  <DropdownMenuItem disabled>
                    <Wallet className="mr-2 h-4 w-4" />

                    <div className="flex flex-col">
                      <span>
                        One-time Payment
                      </span>

                      <span className="text-xs text-muted-foreground">
                        No payment schedule
                      </span>
                    </div>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* COLLAPSE / EXPAND */}

            <button
              type="button"
              onClick={handleToggle}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={
                open
                  ? "Collapse service"
                  : "Expand service"
              }
              aria-expanded={open}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  open
                    ? "rotate-180"
                    : ""
                }`}
              />
            </button>
          </div>
        </div>
      </CardHeader>

      {/* ======================================================
          EXPANDED CONTENT
          ====================================================== */}

      {open && (
        <CardContent className="pt-0">
          {/* ==================================================
              PAYMENT PLAN SUMMARY
              ================================================== */}

          <div className="mb-5 rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {hasScheduledPayments ? (
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  )}

                  <p className="text-sm font-semibold">
                    Payment Plan
                  </p>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {paymentPlanDescription}
                </p>
              </div>

              {/* SCHEDULE ACTION */}

              {hasScheduledPayments &&
                onManageScheduledPayments && (
                  <button
                    type="button"
                    onClick={
                      handleViewPaymentSchedule
                    }
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <CalendarClock className="h-4 w-4" />

                    <span>
                      View Schedule
                    </span>
                  </button>
                )}
            </div>

            {/* PAYMENT PLAN DETAILS */}

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {/* BALANCE */}

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {isExistingLizz
                    ? "Remaining Balance"
                    : "Calculated Amount"}
                </p>

                <p className="mt-1 text-base font-bold">
                  {displayBalance !==
                    null &&
                  displayBalance !==
                    undefined
                    ? formatAmount(
                        Number(
                          displayBalance,
                        ),
                        service.currencyCode ??
                          "",
                      )
                    : "—"}
                </p>
              </div>

              {/* PAYMENT TYPE */}

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Payment Type
                </p>

                <p className="mt-1 text-base font-semibold">
                  {paymentPlanLabel}
                </p>
              </div>

              {/* DATE */}

              {isExistingLizz ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Balance As Of
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {service.balanceAsOfDate
                      ? formatEthiopianDate(
                          service.balanceAsOfDate,
                        )
                      : "—"}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Calculated
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {service.calculatedAt
                      ? formatEthiopianDate(
                          service.calculatedAt,
                        )
                      : "—"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ==================================================
              EXISTING LIZZ
              HISTORICAL FINANCIAL POSITION
              ================================================== */}

          {isExistingLizz ? (
            <div className="mb-5 rounded-lg border bg-muted/30 p-4">
              <div className="mb-4">
                <h4 className="text-sm font-semibold">
                  Historical Financial Position
                </h4>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Existing obligation and payments recorded
                  before this assessment.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* ORIGINAL OBLIGATION */}

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Original Obligation
                  </p>

                  <p className="mt-1 text-lg font-bold">
                    {originalObligation !==
                      null &&
                    originalObligation !==
                      undefined
                      ? formatAmount(
                          Number(
                            originalObligation,
                          ),
                          service.currencyCode ??
                            "",
                        )
                      : "—"}
                  </p>
                </div>

                {/* ALREADY PAID */}

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Already Paid
                  </p>

                  <p className="mt-1 text-lg font-bold">
                    {paidAmount !==
                      null &&
                    paidAmount !==
                      undefined
                      ? formatAmount(
                          Number(
                            paidAmount,
                          ),
                          service.currencyCode ??
                            "",
                        )
                      : "—"}
                  </p>
                </div>

                {/* REMAINING BALANCE */}

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Remaining Balance
                  </p>

                  <p className="mt-1 text-lg font-bold">
                    {remainingAmount !==
                      null &&
                    remainingAmount !==
                      undefined
                      ? formatAmount(
                          Number(
                            remainingAmount,
                          ),
                          service.currencyCode ??
                            "",
                        )
                      : "—"}
                  </p>
                </div>
              </div>

              {/* BALANCE DATE */}

              {service.balanceAsOfDate && (
                <div className="mt-4 border-t pt-3">
                  <p className="text-xs text-muted-foreground">
                    Financial Position As Of
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {formatEthiopianDate(
                      service.balanceAsOfDate,
                    )}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* =================================================
               NORMAL ASSESSMENT
               CURRENT TARIFF CALCULATION
               ================================================= */

            computedAmount !== null &&
            computedAmount !==
              undefined && (
              <div className="mb-5 rounded-lg border bg-muted/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Calculated Amount
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {formatAmount(
                        Number(
                          computedAmount,
                        ),
                        service.currencyCode ??
                          "",
                      )}
                    </p>
                  </div>

                  {service.calculatedAt && (
                    <p className="text-xs text-muted-foreground">
                      Calculated{" "}
                      {formatEthiopianDate(
                        service.calculatedAt,
                      )}
                    </p>
                  )}
                </div>

                {/* CALCULATION ERROR */}

                {service.calculationError && (
                  <p className="mt-3 flex items-start gap-2 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

                    <span>
                      {service.calculationError}
                    </span>
                  </p>
                )}
              </div>
            )
          )}

          {/* ==================================================
              SERVICE DESCRIPTION
              ================================================== */}

          {service.service?.description && (
            <div className="mb-5">
              <h4 className="mb-1 text-sm font-semibold">
                Service Description
              </h4>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {service.service.description}
              </p>
            </div>
          )}

          {/* ==================================================
              CAPTURED INFORMATION
              ================================================== */}

          {service.values?.length ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">
                    Captured Information
                  </h4>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Information submitted for this service.
                  </p>
                </div>

                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                  {fieldCount}
                </span>
              </div>

              <div className="space-y-1">
                {service.values.map(
                  (value) => (
                    <FieldRow
                      key={value.id}
                      value={value}
                    />
                  ),
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-4">
              <p className="text-sm text-muted-foreground">
                No captured values.
              </p>
            </div>
          )}

          {/* ==================================================
              EVIDENCE FILES
              ================================================== */}

          {files.length > 0 && (
            <div className="mt-5 border-t pt-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">
                    Evidence Files
                  </h4>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Supporting documents submitted with
                    this service.
                  </p>
                </div>

                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                  {files.length}
                </span>
              </div>

              <div className="space-y-2">
                {service.values?.flatMap(
                  (value) =>
                    value.files?.map(
                      (file) => (
                        <EvidenceFileRow
                          key={file.id}
                          file={file}
                          isOpening={isOpening(
                            file.id,
                          )}
                          onOpen={
                            openFile
                          }
                        />
                      ),
                    ) ?? [],
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}