
"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  Info,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  Pencil,
  Scale,
  Send,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";

import { toast } from "sonner";

import { usePermission } from "@/hooks/usePermission";

import type {
  CashReconciliation,
  CashReconciliationEvidence,
} from "@/types/cash-reconciliation";

import CashReconciliationEvidenceSection from "@/components/CashReconciliationEvidenceSection";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  formatDate,
  formatDateTime,
  formatMoney,
  getCollectorName,
  getDifferenceLabel,
  getStatusLabel,
  getStatusVariant,
} from "@/utils/cash-reconciliation-utils";

// ============================================================
// CONSTANTS
// ============================================================

const CASH_RECONCILIATION_RESOURCE = "cash_reconciliations";

type DetailsTab = "overview" | "evidence" | "notes" | "activity";

const DEFAULT_TAB: DetailsTab = "overview";

// ============================================================
// PROPS
// ============================================================

interface CashReconciliationDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  record: CashReconciliation | null;

  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;

  onEdit: (record: CashReconciliation) => void;
  onSubmitClosing: (record: CashReconciliation) => void;
  onReview: (record: CashReconciliation) => void;

  onPreviewEvidence: (
    file: CashReconciliationEvidence,
  ) => void | Promise<void>;

  isLoadingEvidence?: boolean;
}

// ============================================================
// HELPERS
// ============================================================

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "?";

  return (
    (parts[0][0] ?? "") +
    (parts.length > 1 ? parts[parts.length - 1][0] : "")
  ).toUpperCase();
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}

function isEditableStatus(
  status: CashReconciliation["status"] | undefined,
): boolean {
  return status === "DRAFT" || status === "RETURNED";
}

function getVarianceState(difference: number | null) {
  if (difference === null || !Number.isFinite(difference)) {
    return {
      label: "Not counted",
      description: "Physical cash count has not been completed.",
      color: "text-muted-foreground",
      background: "bg-muted/50",
      border: "border-border",
      icon: <Clock3 className="size-5" />,
    };
  }

  if (difference === 0) {
    return {
      label: "Balanced",
      description: "Physical cash matches the expected amount.",
      color: "text-emerald-600 dark:text-emerald-400",
      background: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: <CheckCircle2 className="size-5" />,
    };
  }

  if (difference < 0) {
    return {
      label: "Cash shortage",
      description: "Counted cash is below the expected amount.",
      color: "text-destructive",
      background: "bg-destructive/10",
      border: "border-destructive/20",
      icon: <ArrowDownRight className="size-5" />,
    };
  }

  return {
    label: "Cash excess",
    description: "Counted cash exceeds the expected amount.",
    color: "text-amber-600 dark:text-amber-400",
    background: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: <ArrowUpRight className="size-5" />,
  };
}

// ============================================================
// SMALL COMPONENTS
// ============================================================

function Section({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            {icon && (
              <span className="text-muted-foreground">{icon}</span>
            )}
            {title}
          </h3>

          {description && (
            <p className="mt-1 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

function TabLabel({
  icon,
  label,
  count,
  dot = false,
}: {
  icon: ReactNode;
  label: string;
  count?: number;
  dot?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="hidden sm:inline-flex">{icon}</span>
      <span>{label}</span>

      {typeof count === "number" && count > 0 && (
        <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold leading-4 text-primary">
          {count}
        </span>
      )}

      {dot && (
        <span className="size-1.5 rounded-full bg-primary" />
      )}
    </span>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon,
  emphasis = false,
}: {
  label: string;
  value: string;
  description?: string;
  icon: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl border p-4 ${
        emphasis ? "bg-muted/30" : "bg-background"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          {label}
        </p>

        <span className="text-muted-foreground">{icon}</span>
      </div>

      <p className="mt-2 break-words text-xl font-bold tabular-nums tracking-tight">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

type TimelineStep = {
  label: string;
  detail: string;
  done: boolean;
  current?: boolean;
};

function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <li
            key={step.label}
            className="relative flex gap-3 pb-6 last:pb-0"
          >
            {!isLast && (
              <span
                aria-hidden="true"
                className={`absolute left-3 top-7 h-[calc(100%-1.75rem)] w-px ${
                  step.done ? "bg-primary/40" : "bg-border"
                }`}
              />
            )}

            <span
              className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border ${
                step.done
                  ? "border-primary bg-primary text-primary-foreground"
                  : step.current
                    ? "border-primary bg-background text-primary"
                    : "border-border bg-background text-muted-foreground"
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="size-3.5" />
              ) : step.current ? (
                <span className="size-2 rounded-full bg-primary" />
              ) : (
                <span className="size-1.5 rounded-full bg-muted-foreground/40" />
              )}
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={`text-sm font-medium ${
                    step.done || step.current
                      ? ""
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>

                {step.current && (
                  <Badge variant="secondary" className="text-[10px]">
                    Current stage
                  </Badge>
                )}
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {step.detail}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function EmptyNote({ message }: { message: string }) {
  return (
    <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed p-4 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="h-10 animate-pulse rounded-lg bg-muted" />

      <div className="h-28 animate-pulse rounded-xl bg-muted" />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
      </div>

      <div className="h-36 animate-pulse rounded-xl bg-muted" />

      <span className="sr-only">Loading reconciliation details...</span>
    </div>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export function CashReconciliationDetailsSheet(
  props: CashReconciliationDetailsSheetProps,
) {
  const { open, onOpenChange, record, ...rest } = props;

  return (
    <CashReconciliationDetailsSheetContent
      key={record?.id ?? "no-record"}
      open={open}
      onOpenChange={onOpenChange}
      record={record}
      {...rest}
    />
  );
}

// ============================================================
// SHEET CONTENT
// ============================================================

function CashReconciliationDetailsSheetContent({
  open,
  onOpenChange,
  record,
  isLoading,
  isError,
  onRetry,
  onEdit,
  onSubmitClosing,
  onReview,
  onPreviewEvidence,
  isLoadingEvidence = false,
}: CashReconciliationDetailsSheetProps) {
  // ==========================================================
  // STATE
  // ==========================================================

  const [activeTab, setActiveTab] =
    useState<DetailsTab>(DEFAULT_TAB);

  // ==========================================================
  // PERMISSIONS
  // ==========================================================

  const { can } = usePermission();

  const hasUpdatePermission = can(
    CASH_RECONCILIATION_RESOURCE,
    "update",
  );

  const hasReviewPermission = can(
    CASH_RECONCILIATION_RESOURCE,
    "review",
  );

  // ==========================================================
  // WORKFLOW
  // ==========================================================

  const canEditStatus = isEditableStatus(record?.status);

  const canEdit = Boolean(
    record && canEditStatus && hasUpdatePermission,
  );

  const canSubmit = Boolean(
    record && canEditStatus && hasUpdatePermission,
  );

  const canReview = Boolean(
    record &&
      record.status === "PENDING_REVIEW" &&
      hasReviewPermission,
  );

  const evidenceFiles = record?.evidence ?? [];

  // ==========================================================
  // EVIDENCE
  // ==========================================================

  async function handlePreviewEvidence(
    file: CashReconciliationEvidence,
  ): Promise<void> {
    try {
      await onPreviewEvidence(file);
    } catch (error) {
      console.error("Evidence preview failed:", error);
      toast.error("Unable to preview this evidence file.");
    }
  }

  // ==========================================================
  // COPY REFERENCE
  // ==========================================================

  async function copyReference(): Promise<void> {
    if (!record) return;

    try {
      await navigator.clipboard.writeText(String(record.id));
      toast.success("Reference copied.");
    } catch {
      toast.error("Unable to copy the reference.");
    }
  }

  // ==========================================================
  // ACTIONS
  // ==========================================================

  function handleEdit(): void {
    if (!record) return;

    if (!hasUpdatePermission) {
      toast.error(
        "You do not have permission to edit cash reconciliations.",
      );
      return;
    }

    if (!isEditableStatus(record.status)) {
      toast.error(
        "Only draft or returned reconciliations can be edited.",
      );
      return;
    }

    onEdit(record);
  }

  function handleSubmit(): void {
    if (!record) return;

    if (!hasUpdatePermission) {
      toast.error(
        "You do not have permission to submit cash reconciliations.",
      );
      return;
    }

    if (!isEditableStatus(record.status)) {
      toast.error(
        "Only draft or returned reconciliations can be submitted.",
      );
      return;
    }

    onSubmitClosing(record);
  }

  function handleReview(): void {
    if (!record) return;

    if (!hasReviewPermission) {
      toast.error(
        "You do not have permission to review cash reconciliations.",
      );
      return;
    }

    if (record.status !== "PENDING_REVIEW") {
      toast.error(
        "Only pending-review reconciliations can be reviewed.",
      );
      return;
    }

    onReview(record);
  }

  // ==========================================================
  // DERIVED VALUES
  // ==========================================================

  const collectorName = record
    ? getCollectorName(record)
    : "";

  const reviewerName = record
    ? (
        record.reviewer?.full_name ??
        record.reviewer?.name ??
        record.reviewed_by ??
        null
      )
    : null;

  const hasCount = record
    ? hasValue(record.actual_amount)
    : false;

  const difference =
    record && hasValue(record.difference_amount)
      ? Number.isFinite(Number(record.difference_amount))
        ? Number(record.difference_amount)
        : null
      : null;

  const variance = getVarianceState(difference);

  const hasNotes = Boolean(
    record?.collector_notes || record?.review_notes,
  );

  const timeline = useMemo<TimelineStep[]>(() => {
    if (!record) return [];

    const isDraft = record.status === "DRAFT";
    const isReturned = record.status === "RETURNED";
    const isPending = record.status === "PENDING_REVIEW";
    const isApproved = record.status === "RECONCILED";

    return [
      {
        label: "Closing created",
        detail: formatDateTime(record.created_at),
        done: true,
      },
      {
        label: "Submitted for review",
        detail: record.submitted_at
          ? formatDateTime(record.submitted_at)
          : isDraft
            ? "Waiting for collector submission"
            : "Submission date unavailable",
        done: Boolean(record.submitted_at),
        current: isDraft,
      },
      {
        label: "Finance review",
        detail: record.reviewed_at
          ? `${formatDateTime(record.reviewed_at)}${
              reviewerName ? ` by ${reviewerName}` : ""
            }`
          : isPending
            ? "Awaiting finance review"
            : isReturned
              ? "Returned for correction"
              : isApproved
                ? "Review completion date unavailable"
                : "Not reviewed yet",
        done: Boolean(record.reviewed_at) || isReturned,
        current: isPending || isReturned,
      },
    ];
  }, [record, reviewerName]);

  const showFooter =
    Boolean(record) &&
    !isLoading &&
    !isError &&
    (canEdit || canSubmit || canReview);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl lg:max-w-3xl"
      >
        {/* HEADER */}

        <SheetHeader className="space-y-4 border-b px-5 py-5 text-left sm:px-6">
          {record && !isLoading && !isError ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(record.status)}>
                    {getStatusLabel(record.status)}
                  </Badge>

                  <span className="text-xs text-muted-foreground">
                    Cash reconciliation
                  </span>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void copyReference()}
                  className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
                >
                  <Copy className="size-3.5" />
                  Copy reference
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {getInitials(collectorName)}
                </div>

                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate text-xl">
                    {collectorName}
                  </SheetTitle>

                  <SheetDescription className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate">
                      {record.collector?.email ?? "Cash collector"}
                    </span>

                    <span aria-hidden="true">·</span>

                    <span>Closing period</span>
                  </SheetDescription>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {formatDate(record.period_start)} –{" "}
                  {formatDate(record.period_end)}
                </span>

                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-3.5" />
                  Updated {formatDateTime(record.updated_at)}
                </span>
              </div>
            </>
          ) : (
            <>
              <SheetTitle className="text-xl">
                Cash Reconciliation
              </SheetTitle>

              <SheetDescription>
                Financial closing, evidence, and review information.
              </SheetDescription>
            </>
          )}
        </SheetHeader>

        {/* CONTENT */}

        {isLoading ? (
          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
            <LoadingSkeleton />
          </div>
        ) : isError || !record ? (
          <div className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-6 sm:px-6">
            <div className="w-full max-w-md space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="size-5" />
              </div>

              <div>
                <h3 className="font-semibold">
                  Unable to load reconciliation
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  We could not retrieve this closing. Check your
                  connection and try again.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
              >
                Try again
              </Button>
            </div>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as DetailsTab)
            }
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* TAB NAVIGATION */}

            <div className="border-b bg-background px-4 py-3 sm:px-6">
              <TabsList className="grid h-10 w-full grid-cols-4">
                <TabsTrigger
                  value="overview"
                  className="min-w-0 text-xs sm:text-sm"
                >
                  <TabLabel
                    icon={<LayoutDashboard className="size-4" />}
                    label="Overview"
                    dot={difference !== null && difference !== 0}
                  />
                </TabsTrigger>

                <TabsTrigger
                  value="evidence"
                  className="min-w-0 text-xs sm:text-sm"
                >
                  <TabLabel
                    icon={<FileText className="size-4" />}
                    label="Evidence"
                    count={evidenceFiles.length}
                  />
                </TabsTrigger>

                <TabsTrigger
                  value="notes"
                  className="min-w-0 text-xs sm:text-sm"
                >
                  <TabLabel
                    icon={<MessageSquare className="size-4" />}
                    label="Notes"
                    dot={hasNotes}
                  />
                </TabsTrigger>

                <TabsTrigger
                  value="activity"
                  className="min-w-0 text-xs sm:text-sm"
                >
                  <TabLabel
                    icon={<ShieldCheck className="size-4" />}
                    label="Activity"
                  />
                </TabsTrigger>
              </TabsList>
            </div>

            {/* SCROLLABLE CONTENT */}

            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
              {/* WORKFLOW ALERTS */}

              {record.status === "RETURNED" && (
                <div className="mb-6 flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-500">
                      Returned for correction
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Finance has returned this closing. Review
                      the feedback, correct the information, and
                      submit it again.
                    </p>

                    {record.review_notes && (
                      <div className="mt-3 rounded-lg border border-amber-500/20 bg-background/70 p-3">
                        <p className="text-xs font-semibold">
                          Finance feedback
                        </p>

                        <p className="mt-1 whitespace-pre-wrap text-sm">
                          {record.review_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {record.status === "PENDING_REVIEW" && (
                <div className="mb-6 flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <Clock3 className="mt-0.5 size-5 shrink-0 text-blue-600" />

                  <div>
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                      Awaiting finance review
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      This closing has been submitted and is
                      awaiting verification by the finance team.
                    </p>
                  </div>
                </div>
              )}

              {record.status === "RECONCILED" && (
                <div className="mb-6 flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />

                  <div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      Reconciliation approved
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Finance has completed its review of this closing.
                    </p>
                  </div>
                </div>
              )}

              {/* OVERVIEW */}

              <TabsContent
                value="overview"
                className="mt-0 space-y-8"
              >
                <Section
                  title="Financial summary"
                  description="Comparison between expected revenue and physical cash counted."
                  icon={<Scale className="size-4" />}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <MetricCard
                      label="Expected cash"
                      value={formatMoney(record.expected_amount)}
                      description="Total cash expected from collections"
                      icon={<Wallet className="size-4" />}
                    />

                    <MetricCard
                      label="Counted cash"
                      value={
                        hasCount
                          ? formatMoney(record.actual_amount)
                          : "Not counted"
                      }
                      description="Physical cash declared by collector"
                      icon={<FileText className="size-4" />}
                    />
                  </div>

                  <div
                    className={`rounded-xl border p-4 sm:p-5 ${variance.background} ${variance.border}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={variance.color}>
                          {variance.icon}
                        </span>

                        <div>
                          <p className={`text-sm font-semibold ${variance.color}`}>
                            {variance.label}
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {variance.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] text-muted-foreground">
                          Variance amount
                        </p>

                        <p className={`mt-1 text-xl font-bold tabular-nums sm:text-2xl ${variance.color}`}>
                          {difference === null
                            ? "—"
                            : formatMoney(record.difference_amount)}
                        </p>
                      </div>
                    </div>

                    {difference !== null && difference !== 0 && (
                      <div className="mt-4 border-t border-current/10 pt-3">
                        <p className="text-xs text-muted-foreground">
                          {getDifferenceLabel(record.difference_amount)}
                        </p>
                      </div>
                    )}
                  </div>
                </Section>

                {/* CLOSING INFORMATION */}

                <Section
                  title="Closing information"
                  description="Key details associated with this cash closing."
                  icon={<Info className="size-4" />}
                >
                  <div className="divide-y rounded-xl border">
                    <div className="flex items-center justify-between gap-4 p-3.5">
                      <span className="text-xs text-muted-foreground">
                        Collector
                      </span>

                      <span className="text-right text-sm font-medium">
                        {collectorName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3.5">
                      <span className="text-xs text-muted-foreground">
                        Closing period
                      </span>

                      <span className="text-right text-sm font-medium">
                        {formatDate(record.period_start)} –{" "}
                        {formatDate(record.period_end)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3.5">
                      <span className="text-xs text-muted-foreground">
                        Evidence files
                      </span>

                      <button
                        type="button"
                        onClick={() => setActiveTab("evidence")}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {evidenceFiles.length} attached
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3.5">
                      <span className="text-xs text-muted-foreground">
                        Created
                      </span>

                      <span className="text-right text-sm font-medium">
                        {formatDateTime(record.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3.5">
                      <span className="text-xs text-muted-foreground">
                        Last updated
                      </span>

                      <span className="text-right text-sm font-medium">
                        {formatDateTime(record.updated_at)}
                      </span>
                    </div>
                  </div>
                </Section>

                {/* REVIEWER */}

                {(reviewerName || record.reviewed_at) && (
                  <Section
                    title="Review information"
                    icon={<ShieldCheck className="size-4" />}
                  >
                    <div className="flex items-center gap-3 rounded-xl border p-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        <UserRound className="size-5 text-muted-foreground" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {reviewerName || "Finance reviewer"}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {record.reviewed_at
                            ? formatDateTime(record.reviewed_at)
                            : "Review date unavailable"}
                        </p>
                      </div>
                    </div>
                  </Section>
                )}

                {/* QUICK NAVIGATION */}

                <Section
                  title="Supporting information"
                  description="Open additional reconciliation records."
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("evidence")}
                      className="rounded-xl border p-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <FileText className="size-4 text-muted-foreground" />

                      <p className="mt-3 text-sm font-semibold">
                        Evidence
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {evidenceFiles.length} files
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("notes")}
                      className="rounded-xl border p-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <MessageSquare className="size-4 text-muted-foreground" />

                      <p className="mt-3 text-sm font-semibold">
                        Notes
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {hasNotes ? "Notes available" : "No notes"}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("activity")}
                      className="rounded-xl border p-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ShieldCheck className="size-4 text-muted-foreground" />

                      <p className="mt-3 text-sm font-semibold">
                        Activity
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Review history
                      </p>
                    </button>
                  </div>
                </Section>
              </TabsContent>

              {/* EVIDENCE */}

              <TabsContent
                value="evidence"
                className="mt-0 space-y-5"
              >
                <Section
                  title="Supporting evidence"
                  description="Documents and files submitted to support this cash reconciliation."
                  icon={<FileText className="size-4" />}
                  action={
                    <Badge variant="secondary">
                      {evidenceFiles.length} files
                    </Badge>
                  }
                >
                  <CashReconciliationEvidenceSection
                    files={evidenceFiles}
                    isEditable={false}
                    isLoading={isLoadingEvidence}
                    onUpload={async () => {}}
                    onRemove={async () => {}}
                    onPreview={handlePreviewEvidence}
                  />
                </Section>
              </TabsContent>

              {/* NOTES */}

              <TabsContent
                value="notes"
                className="mt-0 space-y-6"
              >
                <Section
                  title="Reconciliation notes"
                  description="Explanations provided by the collector and finance reviewer."
                  icon={<MessageSquare className="size-4" />}
                >
                  <div className="space-y-4">
                    <div className="rounded-xl border p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <UserRound className="size-4" />
                        </div>

                        <div>
                          <p className="text-sm font-semibold">
                            Collector explanation
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Submitted with the cash closing
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        {record.collector_notes ? (
                          <p className="whitespace-pre-wrap text-sm leading-6">
                            {record.collector_notes}
                          </p>
                        ) : (
                          <EmptyNote message="No explanation was provided by the collector." />
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                          <ShieldCheck className="size-4 text-muted-foreground" />
                        </div>

                        <div>
                          <p className="text-sm font-semibold">
                            Finance feedback
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Comments from the reviewing team
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        {record.review_notes ? (
                          <p className="whitespace-pre-wrap text-sm leading-6">
                            {record.review_notes}
                          </p>
                        ) : (
                          <EmptyNote message="No finance feedback has been recorded." />
                        )}
                      </div>
                    </div>
                  </div>
                </Section>
              </TabsContent>

              {/* ACTIVITY */}

              <TabsContent
                value="activity"
                className="mt-0 space-y-6"
              >
                <Section
                  title="Workflow history"
                  description="Track the progression of this reconciliation."
                  icon={<ShieldCheck className="size-4" />}
                >
                  <div className="rounded-xl border p-4 sm:p-5">
                    <Timeline steps={timeline} />
                  </div>
                </Section>

                <Section
                  title="Record timestamps"
                  description="System-recorded reconciliation timestamps."
                  icon={<Clock3 className="size-4" />}
                >
                  <div className="divide-y rounded-xl border">
                    <div className="flex items-center justify-between gap-4 p-3.5">
                      <span className="text-xs text-muted-foreground">
                        Created
                      </span>

                      <span className="text-right text-xs font-medium">
                        {formatDateTime(record.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3.5">
                      <span className="text-xs text-muted-foreground">
                        Submitted
                      </span>

                      <span className="text-right text-xs font-medium">
                        {record.submitted_at
                          ? formatDateTime(record.submitted_at)
                          : "Not submitted"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3.5">
                      <span className="text-xs text-muted-foreground">
                        Reviewed
                      </span>

                      <span className="text-right text-xs font-medium">
                        {record.reviewed_at
                          ? formatDateTime(record.reviewed_at)
                          : "Not reviewed"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3.5">
                      <span className="text-xs text-muted-foreground">
                        Last updated
                      </span>

                      <span className="text-right text-xs font-medium">
                        {formatDateTime(record.updated_at)}
                      </span>
                    </div>
                  </div>
                </Section>
              </TabsContent>
            </div>
          </Tabs>
        )}

        {/* FOOTER ACTIONS */}

        {showFooter && record && (
          <SheetFooter className="shrink-0 gap-2 border-t bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="hidden text-xs text-muted-foreground sm:block">
              {record.status === "DRAFT"
                ? "Review the closing before submission."
                : record.status === "RETURNED"
                  ? "Make the requested corrections before resubmitting."
                  : "Finance review is required."}
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {canEdit && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEdit}
                >
                  <Pencil className="mr-2 size-4" />
                  {record.status === "DRAFT"
                    ? "Edit draft"
                    : "Edit closing"}
                </Button>
              )}

              {canSubmit && (
                <Button
                  type="button"
                  onClick={handleSubmit}
                >
                  <Send className="mr-2 size-4" />
                  {record.status === "RETURNED"
                    ? "Resubmit closing"
                    : "Submit for review"}
                </Button>
              )}

              {canReview && (
                <Button
                  type="button"
                  onClick={handleReview}
                >
                  <ShieldCheck className="mr-2 size-4" />
                  Review closing
                </Button>
              )}
            </div>
          </SheetFooter>
        )}

        {/* LOADING INDICATOR */}

        {isLoading && (
          <div className="flex shrink-0 items-center justify-center gap-2 border-t px-6 py-3 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Loading reconciliation...
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
