// =====================================================
// ASSESSMENT TOOLBAR
// =====================================================

"use client";

import {
  CalendarDays,
  CircleDot,
  Search,
} from "lucide-react";

import {
  Input,
} from "@/components/ui/input";

import {
  Filters,
} from "@/components/commen/Filters";

import {
  Toolbar,
} from "@/components/commen/Toolbar";

import {
  ExportDropdown,
} from "@/components/commen/ExportDropdown";

import type {
  DateRangeValue,
  FilterField,
} from "@/types/commen";

import type {
  AssessmentConfig,
  AssessmentStatus,
} from "./assessment.config";


// =====================================================
// TYPES
// =====================================================

export type AssessmentFilters = {
  status: AssessmentStatus;

  date:
    DateRangeValue |
    null;
};


// =====================================================
// PROPS
// =====================================================

type AssessmentToolbarProps = {

  config:
    AssessmentConfig;

  search:
    string;

  setSearch:
    (
      value: string,
    ) => void;

  filters:
    AssessmentFilters;

  setFilters:
    (
      value: AssessmentFilters,
    ) => void;

  reset:
    () => void;

  onPageReset:
    () => void;
};


// =====================================================
// SEARCH INPUT
// =====================================================

function SearchInput({
  ...props
}: React.ComponentProps<typeof Input>) {

  return (

    <div
      className="
        relative
        w-full
        min-w-0
      "
    >

      <Search
        className="
          pointer-events-none
          absolute
          left-3
          top-1/2
          z-0
          size-4
          -translate-y-1/2
          text-muted-foreground
        "
      />

      <Input
        className="
          h-10
          w-full
          min-w-0
          pl-9
          pr-3
        "
        {...props}
      />

    </div>

  );
}


// =====================================================
// STATUS FILTER
// =====================================================

function buildStatusFilter(
  statuses:
    AssessmentStatus[],
): FilterField {

  const labels:
    Record<
      AssessmentStatus,
      string
    > = {

    ALL:
      "All",

    DRAFT:
      "Draft",

    PENDING_APPROVAL:
      "Pending Approval",

    APPROVED:
      "Approved",

    RETURNED:
      "Returned",

    CANCELLED:
      "Cancelled",

  };


  return {

    key:
      "status",

    label:
      "Status",

    type:
      "select",

    defaultValue:
      "ALL",

    icon:
      CircleDot,

    /*
     * These optional layout properties are
     * consumed by the shared Filters component.
     */
    width:
      "180px",

    minWidth:
      "180px",

    maxWidth:
      "180px",

    options:
      statuses.map(
        (
          status,
        ) => ({

          label:
            labels[
              status
            ],

          value:
            status,

        }),
      ),

  } as FilterField;

}


// =====================================================
// DATE FILTER
// =====================================================

function buildDateFilter(): FilterField {

  return {

    key:
      "date",

    label:
      "Assessment Date",

    type:
      "dateRange",

    defaultValue:
      null,

    icon:
      CalendarDays,

    /*
     * Keep the date filter controlled.
     *
     * This prevents it from consuming all
     * available toolbar width.
     */
    width:
      "440px",

    minWidth:
      "380px",

    maxWidth:
      "500px",

  } as FilterField;

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
  // PENDING QUEUE
  // ===================================================
  //
  // Decision officers only work with:
  //
  // PENDING_APPROVAL
  //
  // Therefore Status is not a user filter here.
  //
  // The backend receives:
  //
  // pending=true
  //
  // and applies:
  //
  // status=PENDING_APPROVAL
  //
  // ===================================================

  const isPendingQueue =
    config.role ===
    "REVENUE_DECISION_OFFICER";


  // ===================================================
  // FILTER SCHEMA
  // ===================================================

  const filtersSchema:
    FilterField[] = [];


  // ===================================================
  // STATUS
  // ===================================================

  if (!isPendingQueue) {

    filtersSchema.push(
      buildStatusFilter(
        config.allowedStatuses,
      ),
    );

  }


  // ===================================================
  // DATE
  // ===================================================

  filtersSchema.push(
    buildDateFilter(),
  );


  // ===================================================
  // SEARCH PLACEHOLDER
  // ===================================================

  const searchPlaceholder =
    isPendingQueue

      ? "Search by reference, taxpayer or national ID..."

      : "Search by reference, taxpayer name or national ID...";


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      className="
        w-full
        min-w-0
        border-b
        bg-muted/30

        px-3
        py-3

        sm:px-4
        sm:py-4

        lg:px-5
        lg:py-4
      "
    >

      <Toolbar

        // =================================================
        // SEARCH
        // =================================================

        search={

          <div
            className="
              w-full
              min-w-0

              sm:w-full

              lg:w-[360px]
              lg:min-w-[280px]
              lg:max-w-[420px]
              lg:shrink-0
            "
          >

            <SearchInput

              placeholder={
                searchPlaceholder
              }

              value={
                search
              }

              onChange={
                (
                  event,
                ) => {

                  setSearch(
                    event.target.value,
                  );

                  onPageReset();

                }
              }

            />

          </div>

        }


        // =================================================
        // RIGHT SIDE
        // =================================================

        right={

          <div
            className="
              flex
              w-full
              min-w-0
              flex-col
              gap-3

              sm:w-full
              sm:flex-row
              sm:flex-wrap
              sm:items-end

              lg:w-auto
              lg:min-w-0
              lg:flex-1
              lg:flex-nowrap
              lg:items-end
              lg:justify-end
              lg:gap-3
            "
          >

            {/* =================================================
                FILTERS
                ================================================= */}

            <div
              className="
                w-full
                min-w-0

                sm:w-full

                lg:w-auto
                lg:min-w-0
                lg:shrink
              "
            >

              <Filters<AssessmentFilters>

                schema={
                  filtersSchema
                }

                value={
                  filters
                }

                onChange={
                  (
                    value,
                  ) => {

                    setFilters(
                      value,
                    );

                    onPageReset();

                  }
                }

                onReset={
                  reset
                }

              />

            </div>


            {/* =================================================
                EXPORT
                ================================================= */}

            {config.canExport && (

              <div
                className="
                  flex
                  w-full
                  shrink-0
                  items-center

                  sm:w-auto
                  sm:self-end

                  lg:w-auto
                  lg:shrink-0
                "
              >

                <ExportDropdown />

              </div>

            )}

          </div>

        }

      />

    </div>

  );

}