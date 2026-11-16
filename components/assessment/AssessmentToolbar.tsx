
"use client";

// =====================================================
// ASSESSMENT TOOLBAR
// =====================================================

import { useEffect, useState } from "react";

import {
  CalendarDays,
  CircleDot,
  Layers,
} from "lucide-react";

import Can from "../access/Can";

import { Filters } from "@/components/commen/Filters";
import { ExportDropdown } from "@/components/commen/ExportDropdown";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  DateRangeValue,
  FilterField,
} from "@/types/commen";

import type {
  AssessmentConfig,
  AssessmentStatus,
} from "./assessment.config";

import AppFilterBar from "../app-filter-bar";

// =====================================================
// TYPES
// =====================================================

export type AssessmentSourceType =
  | "ALL"
  | "EXISTING_LIZZ"
  | "NEW";

export type AssessmentFilters = {
  status: AssessmentStatus;
  source_type: AssessmentSourceType;
  date: DateRangeValue | null;
};

// =====================================================
// PROPS
// =====================================================

type AssessmentToolbarProps = {
  config: AssessmentConfig;
  search: string;
  setSearch: (value: string) => void;
  filters: AssessmentFilters;
  setFilters: (value: AssessmentFilters) => void;
  reset: () => void;
  onPageReset: () => void;
};

// =====================================================
// STATUS OPTIONS
// =====================================================

const STATUS_LABELS: Record<AssessmentStatus, string> = {
  ALL: "All",
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  RETURNED: "Returned",
  CANCELLED: "Cancelled",
};

// =====================================================
// SOURCE TYPE OPTIONS
// =====================================================

const SOURCE_TYPE_LABELS: Record<
  Exclude<AssessmentSourceType, "ALL">,
  string
> = {
  EXISTING_LIZZ: "Existing Lizz",
  NEW: "New",
};

// =====================================================
// DATE FILTER
// =====================================================

function buildDateFilter(): FilterField {
  return {
    key: "date",
    label: "Assessment Date",
    type: "dateRange",
    defaultValue: null,
    icon: CalendarDays,
    width: "100%",
    minWidth: "100%",
    maxWidth: "100%",
  } as FilterField;
}

// =====================================================
// DEFAULT FILTERS
// =====================================================

function getDefaultFilters(): AssessmentFilters {
  return {
    status: "ALL",
    source_type: "ALL",
    date: null,
  };
}

// =====================================================
// FILTER COMPARISON
// =====================================================

function hasSameFilters(
  first: AssessmentFilters,
  second: AssessmentFilters,
): boolean {
  return (
    first.status === second.status &&
    first.source_type === second.source_type &&
    JSON.stringify(first.date) ===
      JSON.stringify(second.date)
  );
}

// =====================================================
// COMPONENT
// =====================================================

export function AssessmentToolbar({
  config,
  search,
  setSearch,
  filters,
  setFilters,
  reset,
  onPageReset,
}: AssessmentToolbarProps) {
  // ===================================================
  // DRAFT FILTERS
  // ===================================================

  const [draftFilters, setDraftFilters] =
    useState<AssessmentFilters>(filters);

  // ===================================================
  // SYNCHRONIZE DRAFT FILTERS
  // ===================================================

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  // ===================================================
  // FILTER SCHEMA
  // ===================================================

  const dateFilterSchema: FilterField[] = [
    buildDateFilter(),
  ];

  // ===================================================
  // FILTER STATE
  // ===================================================

  const hasPendingChanges =
    !hasSameFilters(draftFilters, filters);

  // ===================================================
  // APPLIED FILTERS
  // ===================================================

  const hasAppliedFilters =
    filters.status !== "ALL" ||
    filters.source_type !== "ALL" ||
    filters.date !== null;

  // ===================================================
  // ACTIVE FILTER COUNT
  // ===================================================
  //
  // Always display at least 1 badge.
  //
  // No selection:       1
  // One selected:       1
  // Two selected:       2
  // Three selected:     3
  //
  // ===================================================

  const activeFilterCount = Math.max(
    1,
    (filters.status !== "ALL" ? 1 : 0) +
      (filters.source_type !== "ALL" ? 1 : 0) +
      (filters.date !== null ? 1 : 0),
  );

  // ===================================================
  // APPLY FILTERS
  // ===================================================

  const applyFilters = () => {
    setFilters(draftFilters);
    onPageReset();
  };

  // ===================================================
  // CLEAR FILTERS
  // ===================================================

  const clearFilters = () => {
    const defaultFilters = getDefaultFilters();

    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);

    reset();
    onPageReset();
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="w-full min-w-0 border-b bg-muted/30 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4">
      {/* =================================================
          SEARCH AND FILTERS
          ================================================= */}

      <AppFilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          onPageReset();
        }}
        searchPlaceholder="Search by taxpayer name, assessment number, citizen ID or national ID..."
        searchLabel="Search assessments"
        title="Search and filter"
        description="Find assessments and narrow the results using the available filters."
        activeFilterCount={activeFilterCount}
        hasFilters={true}
        onApply={applyFilters}
        onClear={clearFilters}
      >
        {/* =================================================
            STATUS FILTER
            ================================================= */}

        <div className="space-y-2">
          <label
            className="flex items-center gap-2 text-sm font-medium"
            htmlFor="assessment-status"
          >
            <CircleDot className="size-4 text-muted-foreground" />
            Assessment status
          </label>

          <Select
            value={draftFilters.status || "ALL"}
            onValueChange={(value) => {
              setDraftFilters((current) => ({
                ...current,
                status: value as AssessmentStatus,
              }));
            }}
          >
            <SelectTrigger
              id="assessment-status"
              className="w-full"
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">
                All statuses
              </SelectItem>

              {config.allowedStatuses
                .filter((status) => status !== "ALL")
                .map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                  >
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* =================================================
            ASSESSMENT SOURCE TYPE FILTER
            ================================================= */}

        <div className="space-y-2">
          <label
            className="flex items-center gap-2 text-sm font-medium"
            htmlFor="assessment-source-type"
          >
            <Layers className="size-4 text-muted-foreground" />
            Assessment source
          </label>

          <Select
            value={draftFilters.source_type || "ALL"}
            onValueChange={(value) => {
              setDraftFilters((current) => ({
                ...current,
                source_type: value as AssessmentSourceType,
              }));
            }}
          >
            <SelectTrigger
              id="assessment-source-type"
              className="w-full"
            >
              <SelectValue placeholder="All sources" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">
                All sources
              </SelectItem>

              <SelectItem value="EXISTING_LIZZ">
                {SOURCE_TYPE_LABELS.EXISTING_LIZZ}
              </SelectItem>

              <SelectItem value="NEW">
                {SOURCE_TYPE_LABELS.NEW}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* =================================================
            ASSESSMENT DATE FILTER
            ================================================= */}

        <div className="space-y-2">
          <Filters<AssessmentFilters>
            schema={dateFilterSchema}
            value={draftFilters}
            onChange={(value) => {
              setDraftFilters((current) => ({
                ...current,
                date: value.date,
              }));
            }}
            onReset={() => {
              setDraftFilters((current) => ({
                ...current,
                date: null,
              }));
            }}
            layout="column"
            resetPosition="end"
          />
        </div>

        {/* =================================================
            EXPORT
            ================================================= */}

        <Can
          resource="assessment"
          action="export"
        >
          <div className="border-t pt-3">
            <ExportDropdown />
          </div>
        </Can>
      </AppFilterBar>
    </div>
  );
}
