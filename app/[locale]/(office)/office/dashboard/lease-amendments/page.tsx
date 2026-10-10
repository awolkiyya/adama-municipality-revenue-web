"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FilePenLine,
  FileText,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  XCircle,
  ClipboardCheck,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Can from "@/components/access/Can";
import { usePermission } from "@/hooks/usePermission";

import SummaryCard from "@/components/cards/summary-card";
import AppFilterBar from "@/components/app-filter-bar";
import AppDataTableLayout from "@/components/app-data-table-layout";
import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";

import { useLeaseAmendments } from "@/hooks/revenue/use-lease-amendments";

import type {
  AmendmentType,
  LeaseAmendment,
  LeaseAmendmentStatus,
  LeaseAmendmentFilters,
  LeaseAmendmentSummary,
} from "@/types/assessment/lease-amendment";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type LeaseAmendmentListResult = {
  data?: LeaseAmendment[];
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    summary?: LeaseAmendmentSummary;
  };
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  summary?: LeaseAmendmentSummary;
};

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const RESOURCE = "lease_amendments";

const EMPTY_FILTERS: LeaseAmendmentFilters = {
  status: "",
  amendment_type: "",
};

const EMPTY_SUMMARY: LeaseAmendmentSummary = {
  total_amendments: 0,
  pending_approval: 0,
  approved: 0,
  applied: 0,
  rejected: 0,
};

const STATUS_STYLES: Record<LeaseAmendmentStatus, string> = {
  DRAFT:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
  PENDING_APPROVAL:
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

const STATUS_DOT_STYLES: Record<LeaseAmendmentStatus, string> = {
  DRAFT: "bg-slate-500",
  PENDING_APPROVAL: "bg-amber-500",
  APPROVED: "bg-emerald-500",
  APPLIED: "bg-blue-500",
  REJECTED: "bg-red-500",
  CANCELLED: "bg-slate-400",
};

const AMENDMENT_TYPE_LABELS: Record<AmendmentType, string> = {
  OWNERSHIP_TRANSFER: "Ownership Transfer",
  LAND_AREA_CHANGE: "Land Area Change",
  PARTIAL_TRANSFER: "Partial Land Transfer",
  LAND_MERGE: "Land Merge",
  OTHER: "Other Change"
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatLabel = (value: string): string =>
  value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
};

const getErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  return error instanceof Error ? error.message : fallback;
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function LeaseAmendmentsPage() {
  const locale = useLocale();
  const { can } = usePermission();

  /* ------------------------------------------------------------------------ */
  /* Search and filters                                                       */
  /* ------------------------------------------------------------------------ */

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [draftFilters, setDraftFilters] =
    useState<LeaseAmendmentFilters>(EMPTY_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState<LeaseAmendmentFilters>(EMPTY_FILTERS);

  /* ------------------------------------------------------------------------ */
  /* Pagination                                                               */
  /* ------------------------------------------------------------------------ */

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ------------------------------------------------------------------------ */
  /* Permissions                                                              */
  /* ------------------------------------------------------------------------ */

  const canRead = can(RESOURCE, "read");

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
  } = useLeaseAmendments({
    search: appliedSearch || undefined,
    status: appliedFilters.status || undefined,
    amendment_type: appliedFilters.amendment_type || undefined,
    page,
    per_page: pageSize,
  });

  const result =
    data as unknown as LeaseAmendmentListResult | undefined;

  const amendments = result?.data ?? [];
  const meta = result?.meta;

  const total = meta?.total ?? result?.total ?? amendments.length;

  const summary: LeaseAmendmentSummary =
    meta?.summary ?? result?.summary ?? EMPTY_SUMMARY;

  /* ------------------------------------------------------------------------ */
  /* Filter helpers                                                           */
  /* ------------------------------------------------------------------------ */

  const hasAppliedFilters = Boolean(
    appliedSearch ||
      appliedFilters.status ||
      appliedFilters.amendment_type,
  );

  const activeFilterCount =
    Number(Boolean(appliedFilters.status)) +
    Number(Boolean(appliedFilters.amendment_type));

  const hasPendingChanges =
    search !== appliedSearch ||
    draftFilters.status !== appliedFilters.status ||
    draftFilters.amendment_type !== appliedFilters.amendment_type;

  /* ------------------------------------------------------------------------ */
  /* Routes                                                                   */
  /* ------------------------------------------------------------------------ */

  const getViewUrl = (id: string) =>
    `/${locale}/office/dashboard/lease-amendments/${id}`;

  const getAssessmentUrl = (id: string) =>
    `/${locale}/office/dashboard/lease-amendments/${id}`;

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
          <p className="font-medium">Loading lease amendments</p>
          <p className="text-sm text-muted-foreground">
            Retrieving amendment records and workflow status.
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
            Unable to load lease amendments
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
        title="Lease Amendments"
        description="Review lease amendment requests and monitor decisions and changes to lease records."
        icon={<FilePenLine className="h-4 w-4" />}
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
        }
      />

      {/* Summary cards */}
      <section
        aria-label="Lease amendment summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <SummaryCard
          label="Total Amendments"
          value={summary.total_amendments}
          description="All amendment requests"
          icon={FileText}
          tone="primary"
          loading={isFetching}
        />

        <SummaryCard
          label="Pending Approval"
          value={summary.pending_approval}
          description="Awaiting a decision"
          icon={Clock}
          tone="warning"
          attention={summary.pending_approval > 0}
          loading={isFetching}
        />

        <SummaryCard
          label="Approved"
          value={summary.approved}
          description="Approved requests"
          icon={CheckCircle2}
          tone="success"
          loading={isFetching}
        />

        <SummaryCard
          label="Applied"
          value={summary.applied}
          description="Changes applied"
          icon={ClipboardCheck}
          tone="info"
          loading={isFetching}
        />

        <SummaryCard
          label="Rejected"
          value={summary.rejected}
          description="Rejected requests"
          icon={XCircle}
          tone="danger"
          loading={isFetching}
        />
      </section>

      {/* Search and filters */}
      <AppFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by amendment number or keyword..."
        searchLabel="Search lease amendments"
        title="Find amendment records"
        description="Filter records by workflow status and amendment type."
        activeFilterCount={activeFilterCount}
        hasFilters={hasAppliedFilters || hasPendingChanges}
        onApply={applyFilters}
        onClear={clearFilters}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>

          <Select
            value={draftFilters.status || "ALL"}
            onValueChange={(value) => {
              setDraftFilters((current) => ({
                ...current,
                status:
                  value === "ALL"
                    ? ""
                    : (value as LeaseAmendmentStatus),
              }));
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PENDING_APPROVAL">
                Pending approval
              </SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="APPLIED">Applied</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Amendment type
          </label>

          <Select
            value={draftFilters.amendment_type || "ALL"}
            onValueChange={(value) => {
              setDraftFilters((current) => ({
                ...current,
                amendment_type:
                  value === "ALL" ? "" : (value as AmendmentType),
              }));
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All amendment types" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="NAME_TRANSFER">
                Ownership transfer
              </SelectItem>
              <SelectItem value="LAND_AREA_CHANGE">
                Land area change
              </SelectItem>
              <SelectItem value="PARTIAL_TRANSFER">
                Partial land transfer
              </SelectItem>
              <SelectItem value="MERGE">Land merge</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AppFilterBar>

      {/* Results */}
      <section
        aria-label="Lease amendment records"
        className="min-w-0 space-y-3"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Amendment register
            </h2>
            <p className="text-sm text-muted-foreground">
              {total.toLocaleString()}{" "}
              {total === 1 ? "record" : "records"} found
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
          isEmpty={amendments.length === 0}
          hasFilters={hasAppliedFilters}
          onClearFilters={clearFilters}
          emptyTitle="No lease amendments found"
          emptyDescription="Amendment requests will appear here when records are available."
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
              <table className="w-full min-w-[1100px] border-collapse text-sm">
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
                      Amendment reference
                    </th>

                    <th
                      scope="col"
                      className="h-12 px-5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Amendment details
                    </th>

                    <th
                      scope="col"
                      className="h-12 px-5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Original assessment
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
                  {amendments.map((amendment, index) => {
                    const status = amendment.status;

                    const submittedDate =
                      amendment.submitted_at ??
                      amendment.created_at;

                    const rowNumber =
                      (page - 1) * pageSize + index + 1;

                    const assessmentId =
                      amendment.previous_assessment_id;

                    return (
                      <tr
                        key={amendment.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        {/* Row number */}
                        <td className="px-4 py-4 text-center align-middle">
                          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-muted px-2 text-xs font-medium tabular-nums text-muted-foreground">
                            {rowNumber}
                          </span>
                        </td>

                        {/* Amendment reference */}
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground">
                              <FileText className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 space-y-1">
                              <p className="font-semibold tracking-tight text-foreground">
                                {amendment.amendment_number}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                Lease amendment
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Type and reason */}
                        <td className="max-w-[280px] px-5 py-4 align-middle">
                          <div className="space-y-1.5">
                            <p className="font-medium text-foreground">
                              {AMENDMENT_TYPE_LABELS[
                                amendment.amendment_type
                              ] ??
                                formatLabel(
                                  amendment.amendment_type,
                                )}
                            </p>

                            {amendment.reason ? (
                              <p
                                className="line-clamp-2 text-xs leading-5 text-muted-foreground"
                                title={amendment.reason}
                              >
                                {amendment.reason}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No reason provided
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Original assessment */}
                        <td className="px-5 py-4 align-middle">
                          {assessmentId ? (
                            <Link
                              href={getAssessmentUrl(assessmentId)}
                              title="View original assessment"
                              className="group/link inline-flex max-w-[240px] items-center gap-2 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-primary/20 hover:bg-primary/5"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover/link:bg-primary/10 group-hover/link:text-primary">
                                <ClipboardCheck className="h-4 w-4" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="max-w-[160px] truncate font-medium text-primary">
                                  {assessmentId}
                                </p>

                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  View assessment
                                </p>
                              </div>

                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover/link:text-primary" />
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No assessment linked
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
                                {amendment.submitted_at
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
                                STATUS_STYLES[status] ??
                                "border-muted bg-muted text-muted-foreground"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  STATUS_DOT_STYLES[status] ??
                                  "bg-current opacity-60"
                                }`}
                              />
                              {formatLabel(status)}
                            </span>

                            {status === "PENDING_APPROVAL" && (
                              <span className="text-xs text-muted-foreground">
                                Awaiting decision
                              </span>
                            )}

                            {status === "APPROVED" && (
                              <span className="text-xs text-muted-foreground">
                                Ready for application
                              </span>
                            )}

                            {status === "APPLIED" && (
                              <span className="text-xs text-muted-foreground">
                                Processing completed
                              </span>
                            )}
                          </div>
                        </td>

                        {/* View-only action */}
                        <td className="px-5 py-4 text-right align-middle">
                          {canRead ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9"
                                  aria-label={`View ${amendment.amendment_number}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent
                                align="end"
                                className="w-48"
                              >
                                <Can
                                  resource={RESOURCE}
                                  action="read"
                                >
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={getViewUrl(amendment.id)}
                                      className="flex w-full cursor-pointer items-center"
                                    >
                                      <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                                      View amendment
                                    </Link>
                                  </DropdownMenuItem>
                                </Can>
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
                Updating amendment records…
              </div>
            )}
          </div>
        </AppDataTableLayout>
      </section>
    </div>
  );
}
