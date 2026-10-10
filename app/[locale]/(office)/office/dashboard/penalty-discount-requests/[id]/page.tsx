"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  ReceiptText,
  RefreshCw,
  Scale,
  Send,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { usePermission } from "@/hooks/usePermission";
import { useOpenFile } from "@/hooks/use-open-file";

import {
  usePenaltyDiscountRequest,
  useSubmitPenaltyDiscountRequest,
  useApplyPenaltyDiscountRequest,
  useCancelPenaltyDiscountRequest,
} from "@/hooks/revenue/use-penalty-discount-requests";

import Can from "@/components/access/Can";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type DetailRecord = Record<string, unknown>;

type ProgressState = "completed" | "current" | "upcoming" | "failed";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const RESOURCE = "penalty_discount_requests";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function asRecord(value: unknown): DetailRecord {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as DetailRecord)
    : {};
}

function asText(value: unknown, fallback = "—"): string {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function formatMoney(value: unknown): string {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: unknown): string {
  if (typeof value !== "string" || !value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-ET", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusStyle(status: string): string {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300";

    case "APPLIED":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300";

    case "CANCELLED":
      return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

    case "SUBMITTED":
    case "PENDING":
    case "PENDING_APPROVAL":
    case "UNDER_REVIEW":
    case "IN_REVIEW":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300";

    case "DRAFT":
      return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

    default:
      return "border-border bg-muted text-foreground";
  }
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="break-words text-sm font-medium">{value}</p>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;

    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }

    const errors = record.errors;

    if (errors && typeof errors === "object") {
      const firstError = Object.values(
        errors as Record<string, unknown>,
      ).flat()[0];

      if (typeof firstError === "string") {
        return firstError;
      }
    }
  }

  return "The operation failed. Please try again.";
}

/* -------------------------------------------------------------------------- */
/* Workflow progress component                                                */
/* -------------------------------------------------------------------------- */

function ProgressStep({
  title,
  description,
  state,
  date,
  isLast = false,
}: {
  title: string;
  description: string;
  state: ProgressState;
  date?: string;
  isLast?: boolean;
}) {
  const isCompleted = state === "completed";
  const isCurrent = state === "current";
  const isFailed = state === "failed";

  return (
    <div className="flex gap-3">
      <div className="flex w-7 shrink-0 flex-col items-center">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full border ${
            isCompleted
              ? "border-emerald-600 bg-emerald-600 text-white"
              : isCurrent
                ? "border-primary bg-primary/10 text-primary"
                : isFailed
                  ? "border-red-500 bg-red-50 text-red-600 dark:bg-red-950/50"
                  : "border-muted-foreground/25 bg-background text-muted-foreground"
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : isFailed ? (
            <XCircle className="h-4 w-4" />
          ) : isCurrent ? (
            <Clock3 className="h-4 w-4" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-current" />
          )}
        </div>

        {!isLast && (
          <div
            className={`my-1 min-h-7 w-px flex-1 ${
              isCompleted ? "bg-emerald-500" : "bg-border"
            }`}
          />
        )}
      </div>

      <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`text-sm font-semibold ${
              isFailed ? "text-red-700 dark:text-red-400" : ""
            }`}
          >
            {title}
          </p>

          {isCurrent && (
            <Badge variant="outline" className="text-xs">
              Current
            </Badge>
          )}

          {isFailed && (
            <Badge
              variant="outline"
              className="border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
            >
              {title === "Review and decision" ? "Rejected" : "Stopped"}
            </Badge>
          )}
        </div>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>

        {date && (
          <p className="mt-1 text-xs text-muted-foreground">{date}</p>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function PenaltyDiscountRequestDetailPage() {
  const router = useRouter();
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { can } = usePermission();
  const { openFile, isOpening } = useOpenFile();

  /* ------------------------------------------------------------------------ */
  /* Permissions                                                              */
  /* ------------------------------------------------------------------------ */

  const canRead = can(RESOURCE, "read");
  const canUpdate = can(RESOURCE, "update");
  const canSubmit = can(RESOURCE, "submit");
  const canDecide = can(RESOURCE, "decide");
  const canApply = can(RESOURCE, "apply");
  const canCancel = can(RESOURCE, "cancel");

  /* ------------------------------------------------------------------------ */
  /* Query                                                                    */
  /* ------------------------------------------------------------------------ */

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePenaltyDiscountRequest(id, Boolean(id));

  /* ------------------------------------------------------------------------ */
  /* Mutations                                                                */
  /* ------------------------------------------------------------------------ */

  const submitMutation = useSubmitPenaltyDiscountRequest();
  const applyMutation = useApplyPenaltyDiscountRequest();
  const cancelMutation = useCancelPenaltyDiscountRequest();

  const isActionPending =
    submitMutation.isPending ||
    applyMutation.isPending ||
    cancelMutation.isPending;

  /* ------------------------------------------------------------------------ */
  /* Routes                                                                   */
  /* ------------------------------------------------------------------------ */

  const requestsUrl =
    `/${locale}/office/dashboard/penalty-discount-requests`;

  const invoiceUrl = (invoiceId: string) =>
    `/${locale}/office/dashboard/invoices/${encodeURIComponent(invoiceId)}`;

  const editUrl =
    `/${locale}/office/dashboard/penalty-discount-requests/${encodeURIComponent(id)}/edit`;

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-8">
        <div className="h-8 w-52 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Error and access state                                                   */
  /* ------------------------------------------------------------------------ */

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <Button
          variant="ghost"
          onClick={() => router.push(requestsUrl)}
          className="mb-5 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to requests
        </Button>

        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <XCircle className="h-9 w-9 text-destructive" />

            <h2 className="font-semibold">
              {isError ? "Unable to load request" : "Request not found"}
            </h2>

            <p className="max-w-md text-sm text-muted-foreground">
              {isError
                ? getErrorMessage(error)
                : "This request could not be found or you do not have permission to view it."}
            </p>

            {isError && (
              <Button
                variant="outline"
                onClick={() => void refetch()}
                disabled={isFetching}
                className="gap-2"
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Try again
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canRead) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Ban className="h-9 w-9 text-destructive" />
            <h2 className="font-semibold">Access denied</h2>
            <p className="text-sm text-muted-foreground">
              You do not have permission to view penalty discount requests.
            </p>
            <Button variant="outline" onClick={() => router.push(requestsUrl)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to requests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Normalize request                                                        */
  /* ------------------------------------------------------------------------ */

  const request = asRecord(data);
  const invoice = asRecord(request.invoice);

  const status = asText(request.status, "UNKNOWN");
  const normalizedStatus = status.toUpperCase();
  const requestId = asText(request.id, id);

  const isDraft = normalizedStatus === "DRAFT";
  const isSubmitted = normalizedStatus === "SUBMITTED";
  const isRejected = normalizedStatus === "REJECTED";
  const isCancelled = normalizedStatus === "CANCELLED";
  const isApplied = normalizedStatus === "APPLIED" ||
    request.applied_to_invoice === true ||
    Boolean(request.applied_at);

  const isApproved = normalizedStatus === "APPROVED" || isApplied;

  const isReviewPending = [
    "SUBMITTED",
    "PENDING",
    "PENDING_APPROVAL",
    "UNDER_REVIEW",
    "IN_REVIEW",
  ].includes(normalizedStatus);

  const approvedAmount = Number(request.approved_amount ?? 0);

  const canSubmitRequest = canSubmit && isDraft;

  const canReviewRequest = canDecide && isReviewPending;

  const canApplyRequest =
    canApply &&
    normalizedStatus === "APPROVED" &&
    !isApplied &&
    Number.isFinite(approvedAmount) &&
    approvedAmount > 0;

  const canCancelRequest =
    canCancel &&
    ["DRAFT", "SUBMITTED", "APPROVED"].includes(normalizedStatus) &&
    !isApplied;

  const canEditDraft = canUpdate && isDraft;

  const hasWorkflowActions =
    canEditDraft ||
    canSubmitRequest ||
    canReviewRequest ||
    canApplyRequest ||
    canCancelRequest;

  const files = Array.isArray(request.supporting_files)
    ? request.supporting_files.map(asRecord)
    : [];

  const requestReference = asText(
    request.request_number ?? request.reference_number,
    requestId.slice(0, 8).toUpperCase(),
  );

  const createdDate = formatDate(request.created_at);
  const submittedDate = formatDate(request.submitted_at);
  const decidedDate = formatDate(request.decided_at);
  const appliedDate = formatDate(request.applied_at);

  const invoiceId = asText(invoice.id, "");

  const progressMessage = isDraft
    ? "Submit this draft before it can be reviewed."
    : isRejected
      ? "The request was rejected. Check the decision remarks."
      : isCancelled
        ? "This request was cancelled."
        : isApplied
          ? "The discount has been applied to the invoice."
          : isApproved
            ? "Approved and awaiting invoice application."
            : "Waiting for an authorized officer's decision.";

  /* ------------------------------------------------------------------------ */
  /* Handlers                                                                 */
  /* ------------------------------------------------------------------------ */

  async function copyRequestId() {
    try {
      await navigator.clipboard.writeText(requestId);
      toast.success("Request ID copied.");
    } catch {
      toast.error("Unable to copy request ID.");
    }
  }

  function handleSubmit() {
    if (!canSubmitRequest || isActionPending) return;

    const confirmed = window.confirm(
      "Submit this penalty discount request for approval?",
    );

    if (!confirmed) return;

    submitMutation.mutate(requestId, {
      onSuccess: () => {
        toast.success("Penalty discount request submitted successfully.");
        void refetch();
      },
      onError: (mutationError) => {
        toast.error(getErrorMessage(mutationError));
      },
    });
  }

  function handleApply() {
    if (!canApplyRequest || isActionPending) return;

    const confirmed = window.confirm(
      `Apply the approved penalty discount of ${formatMoney(
        approvedAmount,
      )} to the linked invoice?`,
    );

    if (!confirmed) return;

    applyMutation.mutate(requestId, {
      onSuccess: () => {
        toast.success("Penalty discount applied successfully.");
        void refetch();
      },
      onError: (mutationError) => {
        toast.error(getErrorMessage(mutationError));
      },
    });
  }

  function handleCancel() {
    if (!canCancelRequest || isActionPending) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this penalty discount request? This action may not be reversible.",
    );

    if (!confirmed) return;

    cancelMutation.mutate(requestId, {
      onSuccess: () => {
        toast.success("Penalty discount request cancelled.");
        void refetch();
      },
      onError: (mutationError) => {
        toast.error(getErrorMessage(mutationError));
      },
    });
  }

  function handleRefresh() {
    void refetch();
  }

  function handleReview() {
    document.getElementById("request-details")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Main UI                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(requestsUrl)}
              aria-label="Back to requests"
              className="shrink-0 bg-background"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight">
                Penalty Discount Request
              </h1>
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {requestReference}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getStatusStyle(status)}>
              {formatStatus(status)}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Request actions"
                  disabled={isActionPending}
                >
                  {isActionPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem onSelect={() => void copyRequestId()}>
                  <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
                  Copy request ID
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={handleRefresh}
                  disabled={isFetching}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 text-muted-foreground ${
                      isFetching ? "animate-spin" : ""
                    }`}
                  />
                  Refresh details
                </DropdownMenuItem>

                {canEditDraft && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => router.push(editUrl)}
                    >
                      <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                      Edit draft
                    </DropdownMenuItem>
                  </>
                )}

                {canSubmitRequest && (
                  <>
                    <DropdownMenuSeparator />
                    <Can resource={RESOURCE} action="submit">
                      <DropdownMenuItem
                        disabled={isActionPending}
                        onSelect={handleSubmit}
                      >
                        <Send className="mr-2 h-4 w-4 text-muted-foreground" />
                        Submit for approval
                      </DropdownMenuItem>
                    </Can>
                  </>
                )}

                {canReviewRequest && (
                  <>
                    <DropdownMenuSeparator />
                    <Can resource={RESOURCE} action="decide">
                      <DropdownMenuItem onSelect={handleReview}>
                        <Scale className="mr-2 h-4 w-4 text-muted-foreground" />
                        Review request
                      </DropdownMenuItem>
                    </Can>
                  </>
                )}

                {canApplyRequest && (
                  <>
                    <DropdownMenuSeparator />
                    <Can resource={RESOURCE} action="apply">
                      <DropdownMenuItem
                        disabled={isActionPending}
                        onSelect={handleApply}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                        Apply discount
                      </DropdownMenuItem>
                    </Can>
                  </>
                )}

                {canCancelRequest && (
                  <>
                    <DropdownMenuSeparator />
                    <Can resource={RESOURCE} action="cancel">
                      <DropdownMenuItem
                        disabled={isActionPending}
                        onSelect={handleCancel}
                        className="text-destructive focus:text-destructive"
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Cancel request
                      </DropdownMenuItem>
                    </Can>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-3">
          {/* Main column */}
          <div className="min-w-0 space-y-5 lg:col-span-2">
            {/* Available actions */}
            {hasWorkflowActions && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Available actions
                  </CardTitle>
                  <CardDescription>
                    Actions available for your permissions and the current
                    request status.
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-wrap gap-2">
                  {canEditDraft && (
                    <Button
                      variant="outline"
                      onClick={() => router.push(editUrl)}
                      disabled={isActionPending}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Edit draft
                    </Button>
                  )}

                  {canSubmitRequest && (
                    <Can resource={RESOURCE} action="submit">
                      <Button
                        onClick={handleSubmit}
                        disabled={isActionPending}
                      >
                        {submitMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Submit for approval
                      </Button>
                    </Can>
                  )}

                  {canReviewRequest && (
                    <Can resource={RESOURCE} action="decide">
                      <Button variant="outline" onClick={handleReview}>
                        <Scale className="mr-2 h-4 w-4" />
                        Review request
                      </Button>
                    </Can>
                  )}

                  {canApplyRequest && (
                    <Can resource={RESOURCE} action="apply">
                      <Button
                        onClick={handleApply}
                        disabled={isActionPending}
                      >
                        {applyMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        Apply discount
                      </Button>
                    </Can>
                  )}

                  {canCancelRequest && (
                    <Can resource={RESOURCE} action="cancel">
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isActionPending}
                        className="text-destructive hover:text-destructive"
                      >
                        {cancelMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Ban className="mr-2 h-4 w-4" />
                        )}
                        Cancel request
                      </Button>
                    </Can>
                  )}

                  {isActionPending && (
                    <span
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground"
                      role="status"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing request…
                    </span>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Amount summary */}
            <Card>
              <CardContent className="grid gap-5 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Requested discount
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">
                    {formatMoney(request.requested_amount)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Approved discount
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatMoney(request.approved_amount)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Request details */}
            <Card id="request-details">
              <CardHeader>
                <CardTitle className="text-base">Request details</CardTitle>
                <CardDescription>
                  Request information, submission status, and decision
                  remarks.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoItem
                    label="Request reference"
                    value={requestReference}
                  />
                  <InfoItem label="Status" value={formatStatus(status)} />
                  <InfoItem label="Created on" value={createdDate} />
                  <InfoItem label="Submitted on" value={submittedDate} />
                  <InfoItem label="Decision date" value={decidedDate} />
                  <InfoItem label="Applied date" value={appliedDate} />
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Reason for penalty discount
                  </p>
                  <p className="whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-4 text-sm leading-6">
                    {asText(request.reason, "No reason provided.")}
                  </p>
                </div>

                {typeof request.decision_reason === "string" &&
                  request.decision_reason.trim() && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Decision remarks</p>
                      <p className="whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-4 text-sm leading-6">
                        {request.decision_reason}
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Supporting documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Supporting documents
                  {files.length > 0 && (
                    <Badge variant="secondary">{files.length}</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Open the supporting documents attached to this request.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {files.length > 0 ? (
                  <div className="space-y-3">
                    {files.map((file, index) => {
                      const fileId = asText(file.id, "");
                      const opening = fileId ? isOpening(fileId) : false;
                      const openableFile = file as Parameters<
                        typeof openFile
                      >[0];

                      return (
                        <div
                          key={fileId || `file-${index}`}
                          className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-3"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="break-words text-sm font-medium">
                                {asText(
                                  file.original_name ??
                                    file.name ??
                                    file.file_name,
                                  "Supporting document",
                                )}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {asText(
                                  file.mime_type ?? file.file_type,
                                  "Document",
                                )}
                                {file.size != null &&
                                Number.isFinite(Number(file.size))
                                  ? ` · ${(Number(file.size) / 1024).toFixed(1)} KB`
                                  : ""}
                              </p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            disabled={!fileId || opening}
                            onClick={() => void openFile(openableFile)}
                          >
                            {opening ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="mr-2 h-4 w-4" />
                            )}
                            {opening ? "Opening..." : "View document"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed px-4 py-7 text-center">
                    <FileText className="mx-auto mb-2 h-7 w-7 text-muted-foreground/60" />
                    <p className="text-sm font-medium">
                      No supporting documents
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      No files are attached to this request.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ReceiptText className="h-4 w-4" />
                  Invoice summary
                </CardTitle>
                <CardDescription>
                  Invoice linked to this penalty discount request.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Invoice number
                    </p>
                    <p className="mt-1 break-all font-semibold">
                      {asText(invoice.invoice_number, invoiceId || "—")}
                    </p>
                  </div>

                  {invoiceId && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={invoiceUrl(invoiceId)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View invoice
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>

                <Separator />

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Invoice status
                  </p>
                  <Badge variant="outline">
                    {formatStatus(asText(invoice.status, "UNKNOWN"))}
                  </Badge>
                </div>

                <InfoItem
                  label="Invoice total"
                  value={formatMoney(invoice.total_amount)}
                />
                <InfoItem
                  label="Penalty amount"
                  value={formatMoney(invoice.penalty_amount)}
                />
                <InfoItem
                  label="Penalty discount applied"
                  value={formatMoney(invoice.penalty_discount_amount)}
                />
                <InfoItem
                  label="Outstanding balance"
                  value={formatMoney(invoice.balance_due)}
                />
                <InfoItem
                  label="Due date"
                  value={formatDate(invoice.due_date)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <aside className="min-w-0 space-y-5 lg:sticky lg:top-6">
            {/* Workflow progress */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    Request progress
                  </CardTitle>

                  {isApplied ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600">
                      Completed
                    </Badge>
                  ) : isRejected || isCancelled ? (
                    <Badge
                      variant="outline"
                      className={getStatusStyle(status)}
                    >
                      {isRejected ? "Rejected" : "Cancelled"}
                    </Badge>
                  ) : isApproved ? (
                    <Badge
                      variant="outline"
                      className={getStatusStyle("APPROVED")}
                    >
                      Approved
                    </Badge>
                  ) : isDraft ? (
                    <Badge variant="secondary">Draft</Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className={getStatusStyle("SUBMITTED")}
                    >
                      In progress
                    </Badge>
                  )}
                </div>

                <CardDescription>
                  Current workflow status and next steps.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ProgressStep
                  title="Request created"
                  description="Request record created."
                  state="completed"
                  date={createdDate !== "—" ? createdDate : undefined}
                />

                <ProgressStep
                  title="Submission"
                  description={
                    isDraft
                      ? "Waiting for submission."
                      : "Request submitted."
                  }
                  state={isDraft ? "current" : "completed"}
                  date={
                    !isDraft && submittedDate !== "—"
                      ? submittedDate
                      : undefined
                  }
                />

                <ProgressStep
                  title="Review and decision"
                  description={
                    isRejected
                      ? "The request was rejected."
                      : isCancelled
                        ? "The request was cancelled."
                        : isApproved
                          ? "The request was approved."
                          : isDraft
                            ? "Review starts after submission."
                            : "Awaiting an authorized officer's decision."
                  }
                  state={
                    isRejected || isCancelled
                      ? "failed"
                      : isApproved
                        ? "completed"
                        : isReviewPending
                          ? "current"
                          : "upcoming"
                  }
                  date={
                    (isApproved || isRejected) && decidedDate !== "—"
                      ? decidedDate
                      : undefined
                  }
                />

                <ProgressStep
                  title="Invoice application"
                  description={
                    isApplied
                      ? "Discount applied to invoice."
                      : isRejected
                        ? "Not available for a rejected request."
                        : isCancelled
                          ? "Not available for a cancelled request."
                          : isApproved
                            ? "Approved; application is pending."
                            : "Available after approval."
                  }
                  state={
                    isApplied
                      ? "completed"
                      : isRejected || isCancelled
                        ? "failed"
                        : isApproved
                          ? "current"
                          : "upcoming"
                  }
                  date={
                    isApplied && appliedDate !== "—"
                      ? appliedDate
                      : undefined
                  }
                  isLast
                />

                <Separator className="my-4" />

                <p className="text-sm leading-5 text-muted-foreground">
                  {progressMessage}
                </p>
              </CardContent>
            </Card>

            {/* Current status */}
            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                {isApplied ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                ) : isRejected || isCancelled ? (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                ) : (
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                )}

                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {isApplied
                      ? "Discount applied"
                      : isApproved
                        ? "Awaiting application"
                        : isRejected
                          ? "Request rejected"
                          : isCancelled
                            ? "Request cancelled"
                            : isDraft
                              ? "Draft request"
                              : "Awaiting decision"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {progressMessage}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick links</CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => void copyRequestId()}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy request ID
                </Button>

                {invoiceId && (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link href={invoiceUrl(invoiceId)}>
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Open linked invoice
                    </Link>
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleRefresh}
                  disabled={isFetching}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${
                      isFetching ? "animate-spin" : ""
                    }`}
                  />
                  Refresh details
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => router.push(requestsUrl)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to requests
          </Button>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                isFetching ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>
      </div>
    </main>
  );
}