"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ClipboardCheck,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  XCircle,
  CircleDollarSign,
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
  data?: PenaltyDiscountRequest[] | RequestPageData;
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
};

type NormalizedRequestResult = {
  requests: PenaltyDiscountRequest[];
  summary: PenaltyDiscountRequestSummary;
  pagination: PaginationInfo;
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

const STATUS_OPTIONS: PenaltyDiscountRequestStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "APPLIED",
  "REJECTED",
  "CANCELLED",
];

const STATUS_STYLES: Record<PenaltyDiscountRequestStatus, string> = {
  DRAFT:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
  SUBMITTED:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  APPROVED:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  APPLIED:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  REJECTED:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
  CANCELLED:
    "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const STATUS_DOT_STYLES: Record<PenaltyDiscountRequestStatus, string> = {
  DRAFT: "bg-slate-500",
  SUBMITTED: "bg-amber-500",
  APPROVED: "bg-emerald-500",
  APPLIED: "bg-blue-500",
  REJECTED: "bg-red-500",
  CANCELLED: "bg-slate-400",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatCurrency(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatNumber(value: number | undefined): string {
  return new Intl.NumberFormat().format(value ?? 0);
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function isRequestPageData(value: unknown): value is RequestPageData {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isRequestArray(
  value: unknown,
): value is PenaltyDiscountRequest[] {
  return Array.isArray(value);
}

/**
 * Supports:
 * 1. { data: { summary, requests: { data, meta } } }
 * 2. { data: { data: [...], meta: {...} } }
 * 3. { data: [...], meta: {...} }
 * 4. Direct paginated results.
 */
function normalizeListResult(input: unknown): NormalizedRequestResult {
  const root = isRequestPageData(input) ? input : {};

  const result =
    isRequestPageData(root.data) ? root.data : root;

  const nestedRequests = isRequestPageData(result.requests)
    ? result.requests
    : undefined;

  const directRequests = isRequestArray(result.data)
    ? result.data
    : [];

  const requests = nestedRequests?.data ?? directRequests;

  const summary =
    result.summary ??
    result.meta?.summary ??
    root.meta?.summary ??
    EMPTY_SUMMARY;

  const pagination: PaginationInfo = {
    current_page:
      nestedRequests?.current_page ??
      nestedRequests?.meta?.current_page ??
      result.meta?.pagination?.current_page ??
      result.meta?.current_page ??
      result.current_page,

    last_page:
      nestedRequests?.last_page ??
      nestedRequests?.meta?.last_page ??
      result.meta?.pagination?.last_page ??
      result.meta?.last_page ??
      result.last_page,

    per_page:
      nestedRequests?.per_page ??
      nestedRequests?.meta?.per_page ??
      result.meta?.pagination?.per_page ??
      result.meta?.per_page ??
      result.per_page,

    total:
      nestedRequests?.total ??
      nestedRequests?.meta?.total ??
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

function getStatusDescription(status: PenaltyDiscountRequestStatus) {
  const descriptions: Record<PenaltyDiscountRequestStatus, string> = {
    DRAFT: "Not yet submitted",
    SUBMITTED: "Awaiting decision",
    APPROVED: "Ready to apply",
    APPLIED: "Discount applied",
    REJECTED: "Request rejected",
    CANCELLED: "Request cancelled",
  };

  return descriptions[status] ?? formatLabel(status);
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function PenaltyDiscountRequestsPage() {
  const locale = useLocale();
  const { can } = usePermission();

  /* Search and filters */

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [draftFilters, setDraftFilters] =
    useState<PenaltyDiscountRequestFilters>(EMPTY_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState<PenaltyDiscountRequestFilters>(EMPTY_FILTERS);

  /* Pagination */

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* Permissions */

  const canRead = can(RESOURCE, "read");
  const canCreate = can(RESOURCE, "create");
  const canSubmit = can(RESOURCE, "submit");
  const canDecide = can(RESOURCE, "decide");
  const canApply = can(RESOURCE, "apply");
  const canCancel = can(RESOURCE, "cancel");

  /* Mutations */

  const submitMutation = useSubmitPenaltyDiscountRequest();
  const applyMutation = useApplyPenaltyDiscountRequest();
  const cancelMutation = useCancelPenaltyDiscountRequest();

  const isActionPending =
    submitMutation.isPending ||
    applyMutation.isPending ||
    cancelMutation.isPending;

  /* Query */

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

  const { requests, summary, pagination } = normalized;

  const total = pagination.total ?? requests.length;
  const lastPage = pagination.last_page;

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

  /* Routes */

  const getViewUrl = (id: string) =>
    `/${locale}/office/dashboard/penalty-discount-requests/${encodeURIComponent(id)}`;

  const getInvoiceUrl = (id: string) =>
    `/${locale}/office/dashboard/invoices/${encodeURIComponent(id)}`;

  /* Filter handlers */

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

  /* Loading */

  if (isLoading) {
    return (
      <div
        className="flex min-h-[360px] flex-col items-center justify-center gap-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-card shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>

        <div className="space-y-1 text-center">
          <p className="font-semibold">
            Loading discount requests
          </p>
          <p className="text-sm text-muted-foreground">
            Retrieving requests and workflow information.
          </p>
        </div>
      </div>
    );
  }

  /* Error */

  if (isError) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-card p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>

        <div className="max-w-md space-y-1.5">
          <h2 className="font-semibold tracking-tight">
            Unable to load penalty discount requests
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {getErrorMessage(
              error,
              "An unexpected error occurred. Please try again.",
            )}
          </p>
        </div>

        <Button
          variant="outline"
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

  /* Main UI */

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-6 pb-8">
      {/* Page header */}

      <Banner
        title="Penalty Discount Requests"
        description="Manage penalty discount requests, track approval decisions, and monitor discounts applied to municipal invoices."
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
            {canCreate && (
              <Can resource={RESOURCE} action="create">
                <Button asChild size="sm">
                  <Link
                    href={`/${locale}/office/dashboard/penalty-discount-requests/create`}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Create request
                  </Link>
                </Button>
              </Can>
            )}

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

      {/* Summary */}

      <section
        aria-label="Penalty discount request summary"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5"
      >
        <SummaryCard
          label="Total requests"
          value={formatNumber(summary.total_requests)}
          description="All recorded requests"
          icon={FileText}
          tone="primary"
          loading={isFetching}
        />

        <SummaryCard
          label="Pending decision"
          value={formatNumber(summary.pending_decision)}
          description="Awaiting review"
          icon={Clock3}
          tone="warning"
          attention={summary.pending_decision > 0}
          loading={isFetching}
        />

        <SummaryCard
          label="Approved"
          value={formatNumber(summary.approved_requests)}
          description="Approved requests"
          icon={CheckCircle2}
          tone="success"
          loading={isFetching}
        />

        <SummaryCard
          label="Applied"
          value={formatNumber(summary.applied_requests)}
          description="Applied to invoices"
          icon={ClipboardCheck}
          tone="info"
          loading={isFetching}
        />

        <SummaryCard
          label="Approved amount"
          value={formatCurrency(summary.approved_amount)}
          description="Total approved discounts"
          icon={CircleDollarSign}
          tone="primary"
          loading={isFetching}
        />
      </section>

      {/* Filters */}

      <AppFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by request ID, invoice, or reason..."
        searchLabel="Search penalty discount requests"
        title="Search and filter"
        description="Narrow the register by request status or decision."
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

      {/* Register */}

      <section
        aria-label="Penalty discount request records"
        className="min-w-0 space-y-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight">
                Discount request register
              </h2>

              {hasAppliedFilters && (
                <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                  <Filter className="h-3 w-3" />
                  Filtered
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              Showing {formatNumber(requests.length)} of{" "}
              {formatNumber(total)}{" "}
              {total === 1 ? "request" : "requests"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isFetching && (
              <span
                className="inline-flex items-center gap-2 text-xs text-muted-foreground"
                role="status"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating records
              </span>
            )}

            {hasAppliedFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Clear filters
              </Button>
            )}
          </div>
        </div>

        <AppDataTableLayout
          isEmpty={requests.length === 0}
          hasFilters={hasAppliedFilters}
          onClearFilters={clearFilters}
          emptyTitle="No discount requests found"
          emptyDescription="Created penalty discount requests will appear here."
          filteredEmptyDescription="Try a different search term or adjust the filters."
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        >
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th
                      scope="col"
                      className="h-11 w-14 px-4 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      #
                    </th>

                    <th
                      scope="col"
                      className="h-11 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Request / invoice
                    </th>

                    <th
                      scope="col"
                      className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Requested
                    </th>

                    <th
                      scope="col"
                      className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Approved
                    </th>

                    <th
                      scope="col"
                      className="h-11 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Submitted
                    </th>

                    <th
                      scope="col"
                      className="h-11 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Status
                    </th>

                    <th
                      scope="col"
                      className="h-11 w-16 px-4 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {requests.map((request, index) => {
                    const status = request.status;
                    const submittedDate =
                      request.submitted_at ?? request.created_at;

                    const rowNumber =
                      (page - 1) * pageSize + index + 1;

                    const isDraft = status === "DRAFT";
                    const isSubmitted = status === "SUBMITTED";
                    const isApproved = status === "APPROVED";

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

                    const canCancelRequest =
                      canCancel &&
                      ["DRAFT", "SUBMITTED", "APPROVED"].includes(
                        status,
                      ) &&
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
                        className="group transition-colors hover:bg-muted/30"
                      >
                        {/* Number */}

                        <td className="px-4 py-4 text-center align-middle">
                          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-muted px-2 text-xs font-medium tabular-nums text-muted-foreground">
                            {rowNumber}
                          </span>
                        </td>

                        {/* Request and invoice */}

                        <td className="px-4 py-4 align-middle">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">
                              <FileText className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 space-y-1.5">
                              <Link
                                href={getViewUrl(request.id)}
                                className="inline-flex max-w-[280px] items-center gap-1 font-semibold tracking-tight text-foreground hover:text-primary hover:underline"
                                title={request.id}
                              >
                                <span className="truncate">
                                  {request.id}
                                </span>
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                              </Link>

                              {request.invoice ? (
                                <Link
                                  href={getInvoiceUrl(
                                    request.invoice.id,
                                  )}
                                  className="flex max-w-[260px] items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
                                  title="Open invoice"
                                >
                                  <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">
                                    {request.invoice.invoice_number ??
                                      request.invoice.id}
                                  </span>
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                </Link>
                              ) : (
                                <p className="max-w-[260px] truncate text-xs text-muted-foreground">
                                  Invoice: {request.invoice_id || "—"}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Requested amount */}

                        <td className="whitespace-nowrap px-4 py-4 text-right align-middle">
                          <span className="font-semibold tabular-nums">
                            {formatCurrency(request.requested_amount)}
                          </span>
                        </td>

                        {/* Approved amount */}

                        <td className="whitespace-nowrap px-4 py-4 text-right align-middle">
                          {request.approved_amount != null ? (
                            <div className="inline-flex flex-col items-end gap-1">
                              <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                                {formatCurrency(
                                  request.approved_amount,
                                )}
                              </span>
                              {Number(request.approved_amount) > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                                  <ArrowDownRight className="h-3 w-3" />
                                  Discount
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>

                        {/* Submitted date */}

                        <td className="whitespace-nowrap px-4 py-4 align-middle">
                          <div className="flex items-start gap-2">
                            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                            <div className="space-y-1">
                              <p className="font-medium">
                                {formatDate(submittedDate)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {request.submitted_at
                                  ? "Submitted for review"
                                  : "Created date"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}

                        <td className="px-4 py-4 align-middle">
                          <div className="flex flex-col items-start gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_STYLES[status]}`}
                              />
                              {formatLabel(status)}
                            </span>

                            <span className="text-xs text-muted-foreground">
                              {getStatusDescription(status)}
                            </span>

                            {status === "REJECTED" &&
                              request.decision_reason && (
                                <span
                                  className="max-w-[180px] truncate text-xs text-red-600 dark:text-red-400"
                                  title={request.decision_reason}
                                >
                                  Reason: {request.decision_reason}
                                </span>
                              )}
                          </div>
                        </td>

                        {/* Actions */}

                        <td className="px-4 py-4 text-right align-middle">
                          {hasActions ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 rounded-lg border border-transparent hover:border-border hover:bg-background"
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
                                        submitMutation.mutate(request.id)
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
                                        applyMutation.mutate(request.id)
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
                                        cancelMutation.mutate(request.id)
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
                              No actions
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {isFetching && (
              <div className="flex items-center justify-center gap-2 border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating request register…
              </div>
            )}
          </div>
        </AppDataTableLayout>
      </section>
    </div>
  );
}
