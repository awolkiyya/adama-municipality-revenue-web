"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";

import SummaryCard from "@/components/cards/summary-card";
import AppFilterBar from "@/components/app-filter-bar";

import { useLeaseAmendments } from "@/hooks/revenue/use-lease-amendments";

import type {
LeaseAmendmentStatus,
LeaseAmendmentType,
LeaseAmendmentSummary,
LeaseAmendmentFilters,
LeaseAmendment
} from "@/types/assessment/lease-amendment";

import {
AlertCircle,
CheckCircle2,
ClipboardCheck,
Clock,
FileText,
Loader2,
RefreshCw,
XCircle,
MoreHorizontal,
Eye,
Pencil,

Ban,
FilePenLine,
} from "lucide-react";
import AppDataTableLayout from "@/components/app-data-table-layout";



import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { FloatingParticles } from "@/components/design/FloatingParticles";



// const canView =
//   hasPermission("lease-amendments.view");

// const canEdit =
//   hasPermission("lease-amendments.update") &&
//   status === "DRAFT";

// const canApprove =
//   hasPermission("lease-amendments.approve") &&
//   status === "PENDING_APPROVAL";

// const canReject =
//   hasPermission("lease-amendments.reject") &&
//   status === "PENDING_APPROVAL";

// const canCancel =
//   hasPermission("lease-amendments.cancel") &&
//   ["DRAFT", "PENDING_APPROVAL", "APPROVED"].includes(status);

// const hasAnyAction =
//   canView || canEdit || canApprove || canReject || canCancel;




const statusStyles: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PENDING_APPROVAL:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  APPROVED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  APPLIED:
    "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  REJECTED:
    "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  CANCELLED: "bg-muted text-muted-foreground",
};

const formatLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ")

// --------------------------------------------------
// Types
// --------------------------------------------------

// type LeaseAmendment = {
// id: string;
// amendment_number?: string | null;
// amendmentNumber?: string | null;
// amendment_type?: LeaseAmendmentType | string | null;
// amendmentType?: LeaseAmendmentType | string | null;
// status?: LeaseAmendmentStatus | string | null;
// };



// --------------------------------------------------
// Page
// --------------------------------------------------

function LeaseAmendmentsPage() {
// --------------------------------------------------
// Search
// --------------------------------------------------

const [search, setSearch] = useState("");
const [appliedSearch, setAppliedSearch] = useState("");

// --------------------------------------------------
// Pagination
// --------------------------------------------------

const [page, setPage] = useState<number>(1);
const [pageSize, setPageSize] = useState<number>(10);

// --------------------------------------------------
// Draft filters
// Values currently being edited in the filter sheet
// --------------------------------------------------

const [draftFilters, setDraftFilters] = useState<LeaseAmendmentFilters>({
status: "",
amendment_type: "",
});

// --------------------------------------------------
// Applied filters
// Values currently used by the API
// --------------------------------------------------

const [appliedFilters, setAppliedFilters] = useState<LeaseAmendmentFilters>({
status: "",
amendment_type: "",
});

// --------------------------------------------------
// Fetch data
// --------------------------------------------------

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

const amendments: LeaseAmendment[] = data?.data ?? [];
const meta = data?.meta;

// --------------------------------------------------
// Summary
// --------------------------------------------------

const summary: LeaseAmendmentSummary = {
total_amendments: meta?.summary?.total_amendments ?? 0,
pending_approval: meta?.summary?.pending_approval ?? 0,
approved: meta?.summary?.approved ?? 0,
applied: meta?.summary?.applied ?? 0,
rejected: meta?.summary?.rejected ?? 0,
};

// --------------------------------------------------
// Filter helpers
// --------------------------------------------------

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

// --------------------------------------------------
// Apply filters
// --------------------------------------------------

const applyFilters = () => {
setPage(1);
setAppliedSearch(search.trim());
setAppliedFilters({ ...draftFilters });
};

// --------------------------------------------------
// Clear filters
// --------------------------------------------------

const clearFilters = () => {
const emptyFilters: LeaseAmendmentFilters = {
status: "",
amendment_type: "",
};

setSearch("");
setAppliedSearch("");
setDraftFilters(emptyFilters);
setAppliedFilters(emptyFilters);
setPage(1);

};

// --------------------------------------------------
// Pagination handlers
// --------------------------------------------------

const handlePageChange = (nextPage: number) => {
setPage(nextPage);
};

const handlePageSizeChange = (nextPageSize: number) => {
setPageSize(nextPageSize);
setPage(1);
};

// --------------------------------------------------
// Loading state
// --------------------------------------------------

if (isLoading) {
return ( <div className="flex min-h-[300px] flex-col items-center justify-center gap-3"> <Loader2 className="h-7 w-7 animate-spin text-primary" />

    <div className="space-y-1 text-center">
      <p className="font-medium">Loading lease amendments</p>

      <p className="text-sm text-muted-foreground">
        Please wait while we retrieve your data.
      </p>
    </div>
  </div>
);

}

// --------------------------------------------------
// Error state
// --------------------------------------------------

if (isError) {
return ( <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-6 text-center"> <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10"> <AlertCircle className="h-6 w-6 text-destructive" /> </div>

    <div className="space-y-1">
      <h2 className="font-semibold">
        Unable to load lease amendments
      </h2>

      <p className="max-w-md text-sm text-muted-foreground">
        {error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."}
      </p>
    </div>

    <Button
      variant="outline"
      size="sm"
      onClick={() => refetch()}
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

// --------------------------------------------------
// Main UI
// --------------------------------------------------

return (
<div className="space-y-6">

{/* ======================================================
    HEADER
====================================================== */}


<Banner
  title="Lease Amendments"
  description="Review and manage lease amendments, track approval decisions, and apply approved changes to lease agreements."
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
  overlayClassName="bg-transparant"
  actions={
    <Button
      variant="default"
      size="sm"
      onClick={() => refetch()}
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
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
      description="Changes applied successfully"
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
  </div>

  {/* Search and filter sheet */}
  <AppFilterBar
    search={search}
    onSearchChange={setSearch}
    searchPlaceholder="Search lease amendments..."
    searchLabel="Search lease amendments"
    title="Filter lease amendments"
    description="Choose the criteria to narrow down amendment requests."
    activeFilterCount={activeFilterCount}
    hasFilters={hasAppliedFilters || hasPendingChanges}
    onApply={applyFilters}
    onClear={clearFilters}
  >
    {/* Status filter */}
    <div className="space-y-2">
      <label className="text-sm font-medium">Status</label>

      <Select
        value={draftFilters.status || "ALL"}
        onValueChange={(value) =>
          setDraftFilters((current) => ({
            ...current,
            status:
              value === "ALL"
                ? ""
                : (value as LeaseAmendmentStatus),
          }))
        }
      >
        <SelectTrigger className="w-full py-5">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          <SelectItem value="DRAFT">Draft</SelectItem>
          <SelectItem value="PENDING_APPROVAL">
            Pending approval
          </SelectItem>
          <SelectItem value="APPROVED">Approved</SelectItem>
          <SelectItem value="REJECTED">Rejected</SelectItem>
          <SelectItem value="APPLIED">Applied</SelectItem>
          <SelectItem value="CANCELLED">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Amendment type filter */}
    <div className="space-y-2">
      <label className="text-sm font-medium">Amendment type</label>

      <Select
        value={draftFilters.amendment_type || "ALL"}
        onValueChange={(value) =>
          setDraftFilters((current) => ({
            ...current,
            amendmentType:
              value === "ALL"
                ? ""
                : (value as LeaseAmendmentType),
          }))
        }
      >
        <SelectTrigger className="w-full py-5">
          <SelectValue placeholder="All amendment types" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="ALL">All types</SelectItem>
          <SelectItem value="NAME_TRANSFER">
            Name transfer
          </SelectItem>
          <SelectItem value="LAND_AREA_CHANGE">
            Land area change
          </SelectItem>
          <SelectItem value="PARTIAL_TRANSFER">
            Partial transfer
          </SelectItem>
          <SelectItem value="MERGE">Merge</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </AppFilterBar>

  {/* Results layout */}
  <AppDataTableLayout
    isEmpty={amendments.length !== 0}
    hasFilters={hasAppliedFilters}
    onClearFilters={clearFilters}
    emptyTitle="No lease amendments found"
    emptyDescription="Amendment requests will appear here when available."
    filteredEmptyDescription="Try adjusting your search or filters."
    page={page}
    pageSize={pageSize}
    total={meta?.total ?? 0}
    onPageChange={handlePageChange}
    onPageSizeChange={handlePageSizeChange}
  >
 

 <div className="min-w-full">
  {(() => {
    const mockAmendments: LeaseAmendment[] = [
      {
        id: "amendment-001",
        amendment_number: "LAM-2026-0001",
        lease_agreement_id: "lease-001",
        amendment_type: "NAME_TRANSFER",
        effective_date: "2026-10-01",
        status: "PENDING_APPROVAL",
        previous_citizen_id: "citizen-001",
        new_citizen_id: "citizen-002",
        previous_land_area: null,
        new_land_area: null,
        measurement_unit_id: null,
        reason: "Transfer of lease ownership",
        document_path: null,
        document_number: "DOC-001",
        submitted_at: "2026-10-01T08:30:00Z",
        decided_by: null,
        decision_notes: null,
        decided_at: null,
        approved_at: null,
        rejected_at: null,
        applied_by: null,
        applied_at: null,
        previous_assessment_id: null,
        new_assessment_id: null,
        metadata: null,
        created_by: "user-001",
        updated_by: null,
        created_at: "2026-09-28T08:30:00Z",
        updated_at: "2026-10-01T08:30:00Z",
        deleted_at: null,
      },
      {
        id: "amendment-002",
        amendment_number: "LAM-2026-0002",
        lease_agreement_id: "lease-002",
        amendment_type: "LAND_AREA_CHANGE",
        effective_date: "2026-10-05",
        status: "APPROVED",
        previous_citizen_id: "citizen-003",
        new_citizen_id: null,
        previous_land_area: 250,
        new_land_area: 300,
        measurement_unit_id: "unit-sqm",
        reason: "Correction of registered land area",
        document_path: null,
        document_number: "DOC-002",
        submitted_at: "2026-09-25T09:00:00Z",
        decided_by: "user-002",
        decision_notes: "Approved after document verification",
        decided_at: "2026-09-29T10:00:00Z",
        approved_at: "2026-09-29T10:00:00Z",
        rejected_at: null,
        applied_by: null,
        applied_at: null,
        previous_assessment_id: "assessment-001",
        new_assessment_id: null,
        metadata: null,
        created_by: "user-001",
        updated_by: "user-002",
        created_at: "2026-09-24T09:00:00Z",
        updated_at: "2026-09-29T10:00:00Z",
        deleted_at: null,
      },
      {
        id: "amendment-003",
        amendment_number: "LAM-2026-0003",
        lease_agreement_id: "lease-003",
        amendment_type: "LAND_PARTIAL_TRANSFER",
        effective_date: "2026-11-01",
        status: "DRAFT",
        previous_citizen_id: "citizen-004",
        new_citizen_id: "citizen-005",
        previous_land_area: 500,
        new_land_area: 200,
        measurement_unit_id: "unit-sqm",
        reason: "Partial transfer of leased land",
        document_path: null,
        document_number: null,
        submitted_at: null,
        decided_by: null,
        decision_notes: null,
        decided_at: null,
        approved_at: null,
        rejected_at: null,
        applied_by: null,
        applied_at: null,
        previous_assessment_id: null,
        new_assessment_id: null,
        metadata: null,
        created_by: "user-003",
        updated_by: null,
        created_at: "2026-10-02T11:00:00Z",
        updated_at: "2026-10-02T11:00:00Z",
        deleted_at: null,
      },
      {
        id: "amendment-004",
        amendment_number: "LAM-2026-0004",
        lease_agreement_id: "lease-004",
        amendment_type: "LAND_MERGE",
        effective_date: "2026-09-20",
        status: "APPLIED",
        previous_citizen_id: "citizen-006",
        new_citizen_id: null,
        previous_land_area: 400,
        new_land_area: 650,
        measurement_unit_id: "unit-sqm",
        reason: "Merge of adjacent leased plots",
        document_path: null,
        document_number: "DOC-004",
        submitted_at: "2026-09-01T08:00:00Z",
        decided_by: "user-002",
        decision_notes: "Approved after review",
        decided_at: "2026-09-10T08:00:00Z",
        approved_at: "2026-09-10T08:00:00Z",
        rejected_at: null,
        applied_by: "user-004",
        applied_at: "2026-09-20T08:00:00Z",
        previous_assessment_id: "assessment-004",
        new_assessment_id: "assessment-005",
        metadata: null,
        created_by: "user-001",
        updated_by: "user-004",
        created_at: "2026-09-01T08:00:00Z",
        updated_at: "2026-09-20T08:00:00Z",
        deleted_at: null,
      },
      {
        id: "amendment-005",
        amendment_number: "LAM-2026-0005",
        lease_agreement_id: "lease-005",
        amendment_type: "NAME_TRANSFER",
        effective_date: "2026-10-15",
        status: "REJECTED",
        previous_citizen_id: "citizen-007",
        new_citizen_id: "citizen-008",
        previous_land_area: null,
        new_land_area: null,
        measurement_unit_id: null,
        reason: "Requested lease ownership transfer",
        document_path: null,
        document_number: "DOC-005",
        submitted_at: "2026-09-15T08:00:00Z",
        decided_by: "user-002",
        decision_notes: "Required supporting documents were missing",
        decided_at: "2026-09-18T08:00:00Z",
        approved_at: null,
        rejected_at: "2026-09-18T08:00:00Z",
        applied_by: null,
        applied_at: null,
        previous_assessment_id: null,
        new_assessment_id: null,
        metadata: null,
        created_by: "user-003",
        updated_by: "user-002",
        created_at: "2026-09-15T08:00:00Z",
        updated_at: "2026-09-18T08:00:00Z",
        deleted_at: null,
      },
      {
        id: "amendment-006",
        amendment_number: "LAM-2026-0006",
        lease_agreement_id: "lease-006",
        amendment_type: "LAND_AREA_CHANGE",
        effective_date: "2026-11-15",
        status: "PENDING_APPROVAL",
        previous_citizen_id: "citizen-009",
        new_citizen_id: null,
        previous_land_area: 180,
        new_land_area: 210,
        measurement_unit_id: "unit-sqm",
        reason: "Land area adjustment",
        document_path: null,
        document_number: "DOC-006",
        submitted_at: "2026-10-06T09:00:00Z",
        decided_by: null,
        decision_notes: null,
        decided_at: null,
        approved_at: null,
        rejected_at: null,
        applied_by: null,
        applied_at: null,
        previous_assessment_id: null,
        new_assessment_id: null,
        metadata: null,
        created_by: "user-003",
        updated_by: null,
        created_at: "2026-10-04T09:00:00Z",
        updated_at: "2026-10-06T09:00:00Z",
        deleted_at: null,
      },
      {
        id: "amendment-007",
        amendment_number: "LAM-2026-0007",
        lease_agreement_id: "lease-007",
        amendment_type: "LAND_PARTIAL_TRANSFER",
        effective_date: "2026-10-20",
        status: "CANCELLED",
        previous_citizen_id: "citizen-010",
        new_citizen_id: "citizen-011",
        previous_land_area: 350,
        new_land_area: 150,
        measurement_unit_id: "unit-sqm",
        reason: "Partial transfer withdrawn",
        document_path: null,
        document_number: null,
        submitted_at: null,
        decided_by: null,
        decision_notes: null,
        decided_at: null,
        approved_at: null,
        rejected_at: null,
        applied_by: null,
        applied_at: null,
        previous_assessment_id: null,
        new_assessment_id: null,
        metadata: null,
        created_by: "user-001",
        updated_by: "user-001",
        created_at: "2026-10-03T09:00:00Z",
        updated_at: "2026-10-04T09:00:00Z",
        deleted_at: null,
      },
      {
        id: "amendment-008",
        amendment_number: "LAM-2026-0008",
        lease_agreement_id: "lease-008",
        amendment_type: "LAND_MERGE",
        effective_date: "2026-12-01",
        status: "APPROVED",
        previous_citizen_id: "citizen-012",
        new_citizen_id: null,
        previous_land_area: 600,
        new_land_area: 900,
        measurement_unit_id: "unit-sqm",
        reason: "Consolidation of adjoining plots",
        document_path: null,
        document_number: "DOC-008",
        submitted_at: "2026-10-01T10:00:00Z",
        decided_by: "user-002",
        decision_notes: "Approved subject to updated assessment",
        decided_at: "2026-10-05T10:00:00Z",
        approved_at: "2026-10-05T10:00:00Z",
        rejected_at: null,
        applied_by: null,
        applied_at: null,
        previous_assessment_id: "assessment-008",
        new_assessment_id: null,
        metadata: null,
        created_by: "user-001",
        updated_by: "user-002",
        created_at: "2026-10-01T10:00:00Z",
        updated_at: "2026-10-05T10:00:00Z",
        deleted_at: null,
      },
    ];

    const statusStyles: Record<LeaseAmendmentStatus, string> = {
      DRAFT: "bg-muted text-muted-foreground",
      PENDING_APPROVAL:
        "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
      APPROVED:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
      APPLIED:
        "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
      REJECTED:
        "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
      CANCELLED: "bg-muted text-muted-foreground",
    };

    const formatLabel = (value: string) =>
      value
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    return (
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="bg-muted/50">
            <th className="h-12 w-16 px-4 text-center align-middle font-medium text-muted-foreground">
              No.
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Amendment Number
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Amendment Type
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Effective Date
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Status
            </th>
            <th className="h-12 w-20 px-4 text-right align-middle font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="[&_tr:last-child]:border-0">
          {mockAmendments.map((amendment, index) => {
            const status = amendment.status;

            // Replace hasPermission with your application's actual
            // permission helper or hook.
            const canView = false;

            const canEdit =true;

            const canApprove =false;

            const canReject =true;

            const canApply =true;

            const canCancel =true;

            const hasAnyAction =
              canView ||
              canEdit ||
              canApprove ||
              canReject ||
              canApply ||
              canCancel;

            return (
                <tr
                  key={amendment.id}
                  className="border-b text-sm transition-colors hover:bg-muted/30"
                >
                  <td className="px-3 py-2 text-center align-middle text-xs text-muted-foreground">
                    {index + 1}
                  </td>

                  <td className="px-3 py-2 align-middle">
                    <span className="font-medium text-sm">
                      {amendment.amendment_number}
                    </span>
                  </td>

                  <td className="px-3 py-2 align-middle text-sm text-foreground">
                    {formatLabel(amendment.amendment_type)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-2 align-middle text-sm text-muted-foreground">
                    {amendment.effective_date}
                  </td>

                  <td className="px-3 py-2 align-middle">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyles[status]}`}
                    >
                      {formatLabel(status)}
                    </span>
                  </td>

                  <td className="px-3 py-2 text-right align-middle">
                    {hasAnyAction ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label={`Actions for ${amendment.amendment_number}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-xs font-semibold">
                            Amendment actions
                          </DropdownMenuLabel>

                          <DropdownMenuSeparator />

                          {canView && (
                            <DropdownMenuItem
                              onSelect={() => {}}
                              className="text-sm"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View details
                            </DropdownMenuItem>
                          )}

                          {canEdit && (
                            <DropdownMenuItem
                              onSelect={() => {}}
                              className="text-sm"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit amendment
                            </DropdownMenuItem>
                          )}

                          {canApprove && (
                            <DropdownMenuItem
                              onSelect={() => {}}
                              className="text-sm"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                          )}

                          {canReject && (
                            <DropdownMenuItem
                              onSelect={() => {}}
                              className="text-sm text-destructive focus:text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          )}

                          {canApply && (
                            <DropdownMenuItem
                              onSelect={() => {}}
                              className="text-sm"
                            >
                              <ClipboardCheck className="mr-2 h-4 w-4" />
                              Apply amendment
                            </DropdownMenuItem>
                          )}

                          {canCancel && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => {}}
                                className="text-sm text-destructive focus:text-destructive"
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Cancel amendment
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
    );
  })()}
</div>
  </AppDataTableLayout>
</div>

);
}

export default LeaseAmendmentsPage;
