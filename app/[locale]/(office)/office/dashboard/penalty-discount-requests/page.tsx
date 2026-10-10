"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  XCircle,
  CircleDollarSign,
  Send,
  Ban,
  Scale,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Can from "@/components/access/Can";
import { usePermission } from "@/hooks/usePermission";

import SummaryCard from "@/components/cards/summary-card";
import AppFilterBar from "@/components/app-filter-bar";
import AppDataTableLayout from "@/components/app-data-table-layout";
import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";

import {
  usePenaltyDiscountRequests,
  useSubmitPenaltyDiscountRequest,
  useApplyPenaltyDiscountRequest,
  useCancelPenaltyDiscountRequest,
} from "@/hooks/revenue/use-penalty-discount-requests";

import type {
  PenaltyDiscountRequest,
  PenaltyDiscountRequestFilters,
  PenaltyDiscountRequestStatus,
  PenaltyDiscountRequestSummary,
  PenaltyDiscountDecision,
} from "@/types/revenue/penalty-discount-request";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type PaginationInfo = {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

type RequestPageData = {
  data?: PenaltyDiscountRequest[];
  summary?: PenaltyDiscountRequestSummary;
  requests?: {
    data?: PenaltyDiscountRequest[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    meta?: PaginationInfo;
  };
  meta?: PaginationInfo & {
    summary?: PenaltyDiscountRequestSummary;
    pagination?: PaginationInfo;
  };
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

type RequestApiResult = RequestPageData & {
  success?: boolean;
  message?: string;
  data?: PenaltyDiscountRequest[] | RequestPageData;
};

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const RESOURCE = "penalty_discount_requests";

const EMPTY_FILTERS: PenaltyDiscountRequestFilters = {
  status: "",
  decision: "",
};

const EMPTY_SUMMARY: PenaltyDiscountRequestSummary = {
  total_requests: 0,
  pending_decision: 0,
  approved_requests: 0,
  applied_requests: 0,
  approved_amount: 0,
};

const STATUS_STYLES: Record<
  PenaltyDiscountRequestStatus,
  string
> = {
  DRAFT:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",

  SUBMITTED:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",

  APPROVED:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",

  APPLIED:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300",

  REJECTED:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300",

  CANCELLED:
    "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const STATUS_DOT_STYLES: Record<
  PenaltyDiscountRequestStatus,
  string
> = {
  DRAFT: "bg-slate-500",
  SUBMITTED: "bg-amber-500",
  APPROVED: "bg-emerald-500",
  APPLIED: "bg-blue-500",
  REJECTED: "bg-red-500",
  CANCELLED: "bg-slate-400",
};

const STATUS_OPTIONS: PenaltyDiscountRequestStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "APPLIED",
  "REJECTED",
  "CANCELLED",
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatLabel = (value: string): string =>
  value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");

const formatDate = (
  value: string | null | undefined,
): string => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
};

const formatCurrency = (
  value: number | string | null | undefined,
): string => {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  return error instanceof Error ? error.message : fallback;
};

const isRequestPageData = (
  value: unknown,
): value is RequestPageData => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
};

/**
 * Supports both the nested Laravel response:
 *
 * data: {
 *   summary: {...},
 *   requests: {data: [...], ...}
 * }
 *
 * and a directly returned paginated resource.
 */
function normalizeListResult(
  input: unknown,
): {
  requests: PenaltyDiscountRequest[];
  summary: PenaltyDiscountRequestSummary;
  pagination: PaginationInfo;
} {
  const root = isRequestPageData(input) ? input : {};

  const outerData = isRequestPageData(root.data)
    ? root.data
    : undefined;

  const result = outerData ?? root;

  const nestedRequests = isRequestPageData(result.requests)
    ? result.requests
    : undefined;

  const directRequests = Array.isArray(result.data)
    ? (result.data as PenaltyDiscountRequest[])
    : [];

  const requests =
    nestedRequests?.data ??
    directRequests;

  const summary =
    result.summary ??
    result.meta?.summary ??
    root.meta?.summary ??
    EMPTY_SUMMARY;

  const pagination =
    nestedRequests?.meta ??
    {
      current_page:
        nestedRequests?.current_page ??
        result.meta?.pagination?.current_page ??
        result.meta?.current_page ??
        result.current_page,

      last_page:
        nestedRequests?.last_page ??
        result.meta?.pagination?.last_page ??
        result.meta?.last_page ??
        result.last_page,

      per_page:
        nestedRequests?.per_page ??
        result.meta?.pagination?.per_page ??
        result.meta?.per_page ??
        result.per_page,

      total:
        nestedRequests?.total ??
        result.meta?.pagination?.total ??
        result.meta?.total ??
        result.total,
    };

  return {
    requests,
    summary,
    pagination,
  };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function PenaltyDiscountRequestsPage() {
  const locale = useLocale();
  const { can } = usePermission();

  /* ------------------------------------------------------------------------ */
  /* Search and filters                                                       */
  /* ------------------------------------------------------------------------ */

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [draftFilters, setDraftFilters] =
    useState<PenaltyDiscountRequestFilters>(EMPTY_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState<PenaltyDiscountRequestFilters>(EMPTY_FILTERS);

  /* ------------------------------------------------------------------------ */
  /* Pagination                                                               */
  /* ------------------------------------------------------------------------ */

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ------------------------------------------------------------------------ */
  /* Permissions                                                              */
  /* ------------------------------------------------------------------------ */

  const canRead = can(RESOURCE, "read");
  const canSubmit = can(RESOURCE, "submit");
  const canDecide = can(RESOURCE, "decide");
  const canApply = can(RESOURCE, "apply");
  const canCancel = can(RESOURCE, "cancel");

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
  /* Query                                                                    */
  /* ------------------------------------------------------------------------ */

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePenaltyDiscountRequests({
    search: appliedSearch || undefined,
    status: appliedFilters.status || undefined,
    decision: appliedFilters.decision || undefined,
    page,
    per_page: pageSize,
  });

  const normalized = useMemo(
    () => normalizeListResult(data),
    [data],
  );

  const requests = normalized.requests;
  const summary = normalized.summary;
  const pagination = normalized.pagination;

  const total =
    pagination.total ??
    requests.length;

  /* ------------------------------------------------------------------------ */
  /* Filter helpers                                                           */
  /* ------------------------------------------------------------------------ */

  const hasAppliedFilters = Boolean(
    appliedSearch ||
      appliedFilters.status ||
      appliedFilters.decision,
  );

  const activeFilterCount =
    Number(Boolean(appliedFilters.status)) +
    Number(Boolean(appliedFilters.decision));

  const hasPendingChanges =
    search !== appliedSearch ||
    draftFilters.status !== appliedFilters.status ||
    draftFilters.decision !== appliedFilters.decision;

  /* ------------------------------------------------------------------------ */
  /* Routes                                                                   */
  /* ------------------------------------------------------------------------ */

  const getViewUrl = (id: string) =>
    `/${locale}/office/dashboard/penalty-discount-requests/${encodeURIComponent(id)}`;

  const getInvoiceUrl = (id: string) =>
    `/${locale}/office/dashboard/invoices/${encodeURIComponent(id)}`;

  /* ------------------------------------------------------------------------ */
  /* Filter handlers                                                          */
  /* ------------------------------------------------------------------------ */

  const applyFilters = () => {
    setPage(1);
    setAppliedSearch(search.trim());
    setAppliedFilters({ ...draftFilters });
  };

  const clearFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setDraftFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
    setPage(1);
  };

  /* ------------------------------------------------------------------------ */
  /* Loading state                                                            */
  /* ------------------------------------------------------------------------ */

  if (isLoading) {
    return (
      <div
        className="flex min-h-[320px] flex-col items-center justify-center gap-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-muted/50">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>

        <div className="space-y-1 text-center">
          <p className="font-medium">
            Loading penalty discount requests
          </p>

          <p className="text-sm text-muted-foreground">
            Retrieving requests, invoice information, and workflow status.
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Error state                                                              */
  /* ------------------------------------------------------------------------ */

  if (isError) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>

        <div className="space-y-1">
          <h2 className="font-semibold">
            Unable to load penalty discount requests
          </h2>

          <p className="max-w-md text-sm text-muted-foreground">
            {getErrorMessage(
              error,
              "An unexpected error occurred. Please try again.",
            )}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Try again
        </Button>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Main UI                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-6">
      {/* Page header */}
      <Banner
        title="Penalty Discount Requests"
        description="Monitor penalty discount requests, review approval decisions, and track discounts applied to municipal invoices."
        icon={<Scale className="h-4 w-4" />}
        background={
          <FloatingParticles
            color="#0B3784"
            count={35}
            speed={0.2}
            connectDistance={100}
            position="bottom-right"
          />
        }
        overlayClassName="bg-transparent"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Create New Request */}
            <Can
              resource={RESOURCE}
              action="create"
            >
              <Button asChild size="sm">
                <Link
                  href={`/${locale}/office/dashboard/penalty-discount-requests/create`}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Create New Request
                </Link>
              </Button>
            </Can>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
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
        }
      />


      {/* Summary cards */}
      <section
        aria-label="Penalty discount request summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <SummaryCard
          label="Total Requests"
          value={summary.total_requests}
          description="All discount requests"
          icon={FileText}
          tone="primary"
          loading={isFetching}
        />

        <SummaryCard
          label="Pending Decision"
          value={summary.pending_decision}
          description="Awaiting approval or rejection"
          icon={Clock}
          tone="warning"
          attention={summary.pending_decision > 0}
          loading={isFetching}
        />

        <SummaryCard
          label="Approved"
          value={summary.approved_requests}
          description="Approved requests"
          icon={CheckCircle2}
          tone="success"
          loading={isFetching}
        />

        <SummaryCard
          label="Applied"
          value={summary.applied_requests}
          description="Discounts applied to invoices"
          icon={ClipboardCheck}
          tone="info"
          loading={isFetching}
        />

        <SummaryCard
          label="Approved Amount"
          value={formatCurrency(summary.approved_amount)}
          description="Total approved discount amount"
          icon={CircleDollarSign}
          tone="primary"
          loading={isFetching}
        />
      </section>

      {/* Search and filters */}
      <AppFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by invoice, citizen, or reason..."
        searchLabel="Search penalty discount requests"
        title="Find discount requests"
        description="Filter requests by workflow status or decision."
        activeFilterCount={activeFilterCount}
        hasFilters={hasAppliedFilters || hasPendingChanges}
        onApply={applyFilters}
        onClear={clearFilters}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Request status
          </label>

          <Select
            value={draftFilters.status || "ALL"}
            onValueChange={(value) => {
              setDraftFilters((current) => ({
                ...current,
                status:
                  value === "ALL"
                    ? ""
                    : (value as PenaltyDiscountRequestStatus),
              }));
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>

              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Decision
          </label>

          <Select
            value={draftFilters.decision || "ALL"}
            onValueChange={(value) => {
              setDraftFilters((current) => ({
                ...current,
                decision:
                  value === "ALL"
                    ? ""
                    : (value as PenaltyDiscountDecision),
              }));
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All decisions" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">All decisions</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AppFilterBar>

      {/* Results */}
      <section
        aria-label="Penalty discount request records"
        className="min-w-0 space-y-3"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Penalty discount register
            </h2>

            <p className="text-sm text-muted-foreground">
              {total.toLocaleString()}{" "}
              {total === 1 ? "request" : "requests"} found
            </p>
          </div>

          {isFetching && (
            <span
              className="inline-flex items-center gap-2 text-xs text-muted-foreground"
              role="status"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating records…
            </span>
          )}
        </div>

        <AppDataTableLayout
          isEmpty={requests.length === 0}
          hasFilters={hasAppliedFilters}
          onClearFilters={clearFilters}
          emptyTitle="No penalty discount requests found"
          emptyDescription="Penalty discount requests will appear here when records are created."
          filteredEmptyDescription="Try changing your search terms or filters."
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        >
          <div className="w-full overflow-hidden rounded-xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th
                      scope="col"
                      className="h-12 w-16 px-4 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      No.
                    </th>

                    <th
                      scope="col"
                      className="h-12 px-5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Request / Invoice
                    </th>


                    <th
                      scope="col"
                      className="h-12 px-5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Requested
                    </th>

                    <th
                      scope="col"
                      className="h-12 px-5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Approved
                    </th>

                    <th
                      scope="col"
                      className="h-12 px-5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Submitted
                    </th>

                    <th
                      scope="col"
                      className="h-12 px-5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Status
                    </th>

                    <th
                      scope="col"
                      className="h-12 w-20 px-5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {requests.map((request, index) => {
                    const status = request.status;

                    const submittedDate =
                      request.submitted_at ??
                      request.created_at;

                    const rowNumber =
                      (page - 1) * pageSize + index + 1;

                    const isDraft = status === "DRAFT";
                    const isSubmitted = status === "SUBMITTED";
                    const isApproved = status === "APPROVED";

                    const canCancelRequest =
                      canCancel &&
                      ["DRAFT", "SUBMITTED", "APPROVED"].includes(
                        status,
                      ) &&
                      !request.applied_to_invoice &&
                      !request.applied_at;

                    const canSubmitRequest =
                      canSubmit && isDraft;

                    const canReviewRequest =
                      canDecide && isSubmitted;

                    const canApplyRequest =
                      canApply &&
                      isApproved &&
                      Number(request.approved_amount ?? 0) > 0 &&
                      !request.applied_to_invoice &&
                      !request.applied_at;

                    const hasActions =
                      canRead ||
                      canSubmitRequest ||
                      canReviewRequest ||
                      canApplyRequest ||
                      canCancelRequest;

                    return (
                      <tr
                        key={request.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        {/* Row number */}
                        <td className="px-4 py-4 text-center align-middle">
                          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-muted px-2 text-xs font-medium tabular-nums text-muted-foreground">
                            {rowNumber}
                          </span>
                        </td>

                        {/* Request and invoice */}
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground">
                              <FileText className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 space-y-1.5">
                              <Link
                                href={getViewUrl(request.id)}
                                className="font-semibold tracking-tight text-foreground hover:text-primary hover:underline"
                              >
                                {request.id}
                              </Link>

                              {request.invoice ? (
                                <Link
                                  href={getInvoiceUrl(
                                    request.invoice.id,
                                  )}
                                  className="flex max-w-[220px] items-center gap-1.5 text-xs text-primary hover:underline"
                                  title="View invoice"
                                >
                                  <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />

                                  <span className="truncate">
                                    {request.invoice.invoice_number ??
                                      request.invoice.id}
                                  </span>

                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                </Link>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Invoice: {request.invoice_id}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Requested amount */}
                        <td className="whitespace-nowrap px-5 py-4 text-right align-middle">
                          <span className="font-semibold tabular-nums text-foreground">
                            {formatCurrency(request.requested_amount)}
                          </span>
                        </td>

                        {/* Approved amount */}
                        <td className="whitespace-nowrap px-5 py-4 text-right align-middle">
                          {request.approved_amount != null ? (
                            <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                              {formatCurrency(request.approved_amount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>

                        {/* Submission date */}
                        <td className="whitespace-nowrap px-5 py-4 align-middle">
                          <div className="flex items-start gap-2">
                            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                            <div>
                              <p className="font-medium text-foreground">
                                {formatDate(submittedDate)}
                              </p>

                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {request.submitted_at
                                  ? "Submitted for review"
                                  : "Creation date"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 align-middle">
                          <div className="flex flex-col items-start gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                                STATUS_STYLES[status]
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  STATUS_DOT_STYLES[status]
                                }`}
                              />

                              {formatLabel(status)}
                            </span>

                            {status === "SUBMITTED" && (
                              <span className="text-xs text-muted-foreground">
                                Awaiting decision
                              </span>
                            )}

                            {status === "APPROVED" && (
                              <span className="text-xs text-muted-foreground">
                                Ready to apply
                              </span>
                            )}

                            {status === "APPLIED" && (
                              <span className="text-xs text-muted-foreground">
                                Discount applied
                              </span>
                            )}

                            {status === "REJECTED" &&
                              request.decision_reason && (
                                <span
                                  className="max-w-[160px] truncate text-xs text-muted-foreground"
                                  title={request.decision_reason}
                                >
                                  {request.decision_reason}
                                </span>
                              )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right align-middle">
                          {hasActions ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9"
                                  aria-label={`Actions for request ${request.id}`}
                                  disabled={isActionPending}
                                >
                                  {isActionPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent
                                align="end"
                                className="w-56"
                              >
                                {canRead && (
                                  <Can
                                    resource={RESOURCE}
                                    action="read"
                                  >
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={getViewUrl(request.id)}
                                        className="flex w-full cursor-pointer items-center"
                                      >
                                        <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                                        View request
                                      </Link>
                                    </DropdownMenuItem>
                                  </Can>
                                )}

                                {canSubmitRequest && (
                                  <>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                      disabled={isActionPending}
                                      onSelect={() =>
                                        submitMutation.mutate(
                                          request.id,
                                        )
                                      }
                                    >
                                      <Send className="mr-2 h-4 w-4 text-muted-foreground" />
                                      Submit for approval
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {canReviewRequest && (
                                  <>
                                    <DropdownMenuSeparator />

                                    <Can
                                      resource={RESOURCE}
                                      action="decide"
                                    >
                                      <DropdownMenuItem asChild>
                                        <Link
                                          href={getViewUrl(request.id)}
                                          className="flex w-full cursor-pointer items-center"
                                        >
                                          <Scale className="mr-2 h-4 w-4 text-muted-foreground" />
                                          Review decision
                                        </Link>
                                      </DropdownMenuItem>
                                    </Can>
                                  </>
                                )}

                                {canApplyRequest && (
                                  <>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                      disabled={isActionPending}
                                      onSelect={() =>
                                        applyMutation.mutate(
                                          request.id,
                                        )
                                      }
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                                      Apply discount
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {canCancelRequest && (
                                  <>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                      disabled={isActionPending}
                                      className="text-destructive focus:text-destructive"
                                      onSelect={() =>
                                        cancelMutation.mutate(
                                          request.id,
                                        )
                                      }
                                    >
                                      <Ban className="mr-2 h-4 w-4" />
                                      Cancel request
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No available actions
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {isFetching && !isLoading && (
              <div className="flex items-center justify-center gap-2 border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating penalty discount requests…
              </div>
            )}
          </div>
        </AppDataTableLayout>
      </section>
    </div>
  );
}

