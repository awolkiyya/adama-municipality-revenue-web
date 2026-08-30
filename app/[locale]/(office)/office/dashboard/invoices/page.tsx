// =====================================================
// INVOICES PAGE
// Billing / invoice management
// =====================================================

"use client";

import { useMemo, useState } from "react";

import {
  AlertTriangle,
  CalendarDays,
  CircleDot,
  Clock3,
  FileText,
  Loader2,
  Receipt,
  Search,
  Wallet,
} from "lucide-react";

import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { IconBadge } from "@/components/commen/icon-badge";

import { Input } from "@/components/ui/input";

import { Filters } from "@/components/commen/Filters";
import { Toolbar } from "@/components/commen/Toolbar";
import { ExportDropdown } from "@/components/commen/ExportDropdown";

import { CommenTable } from "@/components/table/CommenTable";
import { DataTablePagination } from "@/components/table/data-pagination";

import type {
  CommentType,
  DateRangeValue,
  FilterField,
} from "@/types/commen";

import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";

import { resolveActions } from "@/components/table/permissions/ResolveActions";
import { CommentTableRegistry } from "@/components/table/registry";

import type {
  Invoice,
  InvoiceFilters,
  InvoiceStatus,
} from "@/types/invoice/invoice";

import type { InvoiceSummary } from "@/types/invoice/invoice-summary";

import { useInvoices } from "@/hooks/invoice/useOffice.hook";


// =====================================================
// STATUS BADGE STYLES
// =====================================================

const STATUS_BADGE: Record<
  InvoiceStatus,
  string
> = {
  DRAFT:
    "bg-slate-100 text-slate-700",

  ISSUED:
    "bg-blue-100 text-blue-700",

  PARTIALLY_PAID:
    "bg-amber-100 text-amber-700",

  PAID:
    "bg-emerald-100 text-emerald-700",

  OVERDUE:
    "bg-red-100 text-red-700",

  CANCELLED:
    "bg-orange-100 text-orange-700",

  VOID:
    "bg-gray-100 text-gray-700",
};


// =====================================================
// FILTERS
// =====================================================

export const invoiceFilters: FilterField[] = [

  // ---------------------------------------------------
  // STATUS
  // ---------------------------------------------------

  {
    key: "status",

    label: "Status",

    type: "select",

    defaultValue: "ALL",

    icon: CircleDot,

    options: [

      {
        label: "All",
        value: "ALL",
      },

      {
        label: "Draft",
        value: "DRAFT",
      },

      {
        label: "Issued",
        value: "ISSUED",
      },

      {
        label: "Partially Paid",
        value: "PARTIALLY_PAID",
      },

      {
        label: "Paid",
        value: "PAID",
      },

      {
        label: "Overdue",
        value: "OVERDUE",
      },

      {
        label: "Cancelled",
        value: "CANCELLED",
      },

      {
        label: "Void",
        value: "VOID",
      },

    ],
  },


  // ---------------------------------------------------
  // ISSUE DATE
  // ---------------------------------------------------

  {
    key: "date",

    label: "Issue Date",

    type: "dateRange",

    defaultValue: null,

    icon: CalendarDays,
  },

];


// =====================================================
// INITIAL FILTERS
// =====================================================

const INITIAL_FILTERS: Record<
  string,
  any
> = {
  status: "ALL",

  date:
    null as DateRangeValue | null,
};


// =====================================================
// FORMAT CURRENCY
// =====================================================

const formatCurrency = (
  amount: number,
  currency: string = "ETB",
) => {

  return new Intl.NumberFormat(
    "en-ET",
    {
      style: "currency",

      currency,

      maximumFractionDigits: 0,
    },
  ).format(amount);
};


// =====================================================
// FORMAT DATE
// =====================================================

const formatDate = (
  iso: string | null,
) => {

  if (!iso) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",

      month: "short",

      year: "numeric",
    },
  ).format(
    new Date(iso),
  );
};


// =====================================================
// SUMMARY CARD TYPES
// =====================================================

type SummaryTone =
  | "primary"
  | "emerald"
  | "amber"
  | "red";


// =====================================================
// SUMMARY CARD STYLES
// =====================================================

const TONE_STYLES: Record<
  SummaryTone,
  {
    iconWrap: string;
    icon: string;
    ring: string;
  }
> = {

  primary: {

    iconWrap:
      "bg-primary/10",

    icon:
      "text-primary",

    ring:
      "hover:border-primary/40",
  },

  emerald: {

    iconWrap:
      "bg-emerald-100",

    icon:
      "text-emerald-600",

    ring:
      "hover:border-emerald-300",
  },

  amber: {

    iconWrap:
      "bg-amber-100",

    icon:
      "text-amber-600",

    ring:
      "hover:border-amber-300",
  },

  red: {

    iconWrap:
      "bg-red-100",

    icon:
      "text-red-600",

    ring:
      "hover:border-red-300",
  },

};


// =====================================================
// SEARCH INPUT
// =====================================================

export function SearchInput({
  className,
  ...props
}: React.ComponentProps<
  typeof Input
>) {

  return (

    <div className="relative w-full">

      <Search
        className="
          pointer-events-none
          absolute
          left-3
          top-1/2
          h-4
          w-4
          -translate-y-1/2
          text-muted-foreground
        "
      />

      <Input
        className={`
          w-full
          py-5
          pl-9
          ${className ?? ""}
        `}
        {...props}
      />

    </div>
  );
}


// =====================================================
// PAGE
// =====================================================

function InvoicesPage() {

  const user =
    useSelector(
      (
        state: RootState,
      ) =>
        state.auth.user,
    );


  // ===================================================
  // STATE
  // ===================================================

  const [
    search,
    setSearch,
  ] = useState("");


  const [
    filters,
    setFilters,
  ] =
    useState<
      Record<string, any>
    >(
      INITIAL_FILTERS,
    );


  const [
    page,
    setPage,
  ] = useState(1);


  const [
    pageSize,
    setPageSize,
  ] = useState(10);


  // ===================================================
  // API FILTERS
  // ===================================================
  //
  // IMPORTANT:
  //
  // No local invoice filtering.
  //
  // Laravel handles:
  //
  // - search
  // - status
  // - issue date
  // - pagination
  //
  // ===================================================

  const queryParams: InvoiceFilters = {

    page,

    per_page:
      pageSize,

    search:
      search.trim() || undefined,

    status:
      filters.status !== "ALL"
        ? filters.status
        : undefined,

    issued_from:
      filters.date?.from ||
      undefined,

    issued_to:
      filters.date?.to ||
      undefined,
  };


  // ===================================================
  // FETCH INVOICES
  // ===================================================

  const {
    data,
    isLoading,
    isFetching,
    isError,
  } =
    useInvoices({
      params:
        queryParams,
    });


  // ===================================================
  // PAGINATED INVOICES
  // ===================================================

  const invoices:
    Invoice[] =
    data?.data ?? [];


  // ===================================================
  // PAGINATION META
  // ===================================================

  const meta =
    data?.meta;


  // ===================================================
  // BACKEND SUMMARY
  // ===================================================
  //
  // Summary comes directly from:
  //
  // meta.summary
  //
  // We do NOT calculate financial values
  // from the current page.
  //
  // ===================================================

  const summary =
    data?.meta?.summary as
      | InvoiceSummary
      | undefined;


  // ===================================================
  // SUMMARY SAFE DEFAULT
  // ===================================================

  const summaryData:
    InvoiceSummary =
    summary ?? {

      total_invoices:
        0,

      subtotal:
        0,

      discount_amount:
        0,

      penalty_amount:
        0,

      total_amount:
        0,

      paid_amount:
        0,

      balance_due:
        0,

      status_counts: {

        DRAFT:
          0,

        ISSUED:
          0,

        PARTIALLY_PAID:
          0,

        PAID:
          0,

        OVERDUE:
          0,

        CANCELLED:
          0,

        VOID:
          0,
      },
    };


  // ===================================================
  // SUMMARY VALUES
  // ===================================================

  const outstandingAmount =
    summaryData.balance_due;


  const overdueCount =
    summaryData.status_counts
      .OVERDUE;


  /*
  |--------------------------------------------------------------------------
  | OVERDUE AMOUNT
  |--------------------------------------------------------------------------
  |
  | InvoiceSummary currently does not expose:
  |
  | overdue_amount
  |
  | Therefore we intentionally do not calculate it
  | from the paginated invoice data.
  |
  |--------------------------------------------------------------------------
  */

  const overdueAmount =
    0;


  // ===================================================
  // SUMMARY CARDS
  // ===================================================

  const summaryCards: {
    key: string;

    label: string;

    value: string;

    caption: string;

    icon: typeof Receipt;

    tone: SummaryTone;
  }[] = [

    // -------------------------------------------------
    // ALL
    // -------------------------------------------------

    {

      key:
        "all",

      label:
        "All Invoices",

      value:
        `${summaryData.total_invoices}`,

      caption:
        `${formatCurrency(
          summaryData.total_amount,
          "ETB",
        )} total billed`,

      icon:
        Receipt,

      tone:
        "primary",
    },


    // -------------------------------------------------
    // PAID
    // -------------------------------------------------

    {

      key:
        "paid",

      label:
        "Paid",

      value:
        formatCurrency(
          summaryData.paid_amount,
          "ETB",
        ),

      caption:
        `${summaryData.status_counts.PAID} paid invoices`,

      icon:
        Wallet,

      tone:
        "emerald",
    },


    // -------------------------------------------------
    // OUTSTANDING
    // -------------------------------------------------

    {

      key:
        "outstanding",

      label:
        "Outstanding",

      value:
        formatCurrency(
          outstandingAmount,
          "ETB",
        ),

      caption:
        `${
          summaryData.status_counts.ISSUED +
          summaryData.status_counts.PARTIALLY_PAID
        } awaiting payment`,

      icon:
        Clock3,

      tone:
        "amber",
    },


    // -------------------------------------------------
    // OVERDUE
    // -------------------------------------------------

    {

      key:
        "overdue",

      label:
        "Overdue",

      value:
        `${overdueCount}`,

      caption:
        overdueAmount > 0

          ? `${formatCurrency(
              overdueAmount,
              "ETB",
            )} past due`

          : "Invoices past due",

      icon:
        AlertTriangle,

      tone:
        "red",
    },

  ];


  // ===================================================
  // TABLE DATA
  // ===================================================
  //
  // Convert backend Invoice objects into the shape
  // consumed by CommenTable.
  //
  // ===================================================

  const tableData =
    useMemo(
      () => {

        return invoices.map(
          (
            invoice: Invoice,
          ) => {

            const citizen =
              invoice.citizen as
                | (
                    Record<
                      string,
                      unknown
                    >
                  )
                | null;

            const assessment =
              invoice.assessment as
                | (
                    Record<
                      string,
                      unknown
                    >
                  )
                | null;


            return {

              ...invoice,


              // ---------------------------------------
              // ID
              // ---------------------------------------

              id:
                invoice.id,


              // ---------------------------------------
              // INVOICE NUMBER
              // ---------------------------------------

              invoice_number:
                invoice.invoice_number,


              // ---------------------------------------
              // CITIZEN
              // ---------------------------------------

              citizen_name:
                citizen
                  ? (
                      citizen.name ??
                      citizen.full_name ??
                      "—"
                    ) as string

                  : "—",


              citizen_number:
                citizen
                  ? (
                      citizen.citizen_number ??
                      citizen.tin ??
                      "—"
                    ) as string

                  : "—",


              // ---------------------------------------
              // ASSESSMENT
              // ---------------------------------------

              assessment_number:
                assessment
                  ? (
                      assessment.assessment_number ??
                      "—"
                    ) as string

                  : "—",


              // ---------------------------------------
              // AMOUNTS
              // ---------------------------------------

              subtotal:
                formatCurrency(
                  Number(invoice.financial.subtotal),
                  invoice.currency,
                ),

              total_amount:
                formatCurrency(
                  Number(invoice.financial.total_amount),
                  invoice.currency,
                ),

              paid_amount:
                formatCurrency(
                  Number(invoice.financial.paid_amount),
                  invoice.currency,
                ),

              balance_due:
                formatCurrency(
                  Number(invoice.financial.balance_due),
                  invoice.currency,
                ),


              // ---------------------------------------
              // DATES
              // ---------------------------------------

              issued_at:
                formatDate(
                  invoice.dates.issued_at,
                ),

              due_date:
                formatDate(
                  invoice.dates.due_date,
                ),


              // ---------------------------------------
              // STATUS
              // ---------------------------------------

              status:
                invoice.status,

              status_badge_class:
                STATUS_BADGE[
                  invoice.status
                ],
            };
          },
        );

      },
      [
        invoices,
      ],
    );

     // ===================================================
  // PERMISSION LOADING
  // ===================================================

  if (!user?.role) {

    return (

      <div
        className="
          flex
          h-40
          flex-col
          items-center
          justify-center
          gap-3
          text-center
        "
      >

        <Loader2
          className="
            size-6
            animate-spin
            text-muted-foreground
          "
        />

        <div
          className="
            flex
            flex-col
            gap-0.5
          "
        >

          <p
            className="
              text-sm
              font-medium
              text-foreground
            "
          >
            Checking permissions
          </p>

          <p
            className="
              text-xs
              text-muted-foreground
            "
          >
            This will only take a moment
          </p>

        </div>

      </div>
    );
  }


  // ===================================================
  // ACTIONS
  // ===================================================
  //
  // IMPORTANT:
  //
  // CommenTable expects:
  //
  // Record<TableActionKey, boolean>
  //
  // Do NOT use [] as fallback.
  //
  // ===================================================

  const actions = resolveActions(
      CommentTableRegistry.invoice,
      user.role.name,
    );
 


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      className="
        relative
        min-h-full
        space-y-8
        pb-4
      "
    >

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <Banner

        badge={

          <IconBadge

            className="
              gap-2
              rounded-full
              bg-black/20
              p-3
              text-[10px]
              text-white
            "

            icon={
              <FileText
                className="h-4 w-4"
              />
            }
          >
            Billing
          </IconBadge>

        }


        description="
          Issue, track, and reconcile invoices raised against
          registered taxpayers within your sector.
        "


        background={

          <FloatingParticles
            color="#040404"
            count={35}
            speed={0.2}
            connectDistance={100}
            position="bottom-right"
          />

        }


        overlayClassName="
          bg-gradient-to-r
          from-primary/95
          via-primary/80
          to-primary/50
        "


        className="
          text-white
        "


        actions={

          <div
            className="
              flex
              justify-end
            "
          >

            <ExportDropdown />

          </div>

        }

      />


      {/* =================================================
          SUMMARY
      ================================================= */}

      <div
        className="
          grid
          gap-4
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >

        {summaryCards.map(
          ({
            key,
            label,
            value,
            caption,
            icon: Icon,
            tone,
          }) => {

            const styles =
              TONE_STYLES[tone];


            return (

              <div
                key={key}

                className={`
                  group
                  rounded-xl
                  border
                  bg-card
                  p-5
                  shadow-sm
                  transition-all
                  duration-150
                  ${styles.ring}
                  hover:shadow-md
                `}
              >

                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-3
                  "
                >

                  <div
                    className="
                      min-w-0
                    "
                  >

                    <p
                      className="
                        text-sm
                        font-medium
                        text-muted-foreground
                      "
                    >
                      {label}
                    </p>


                    <h3
                      className="
                        mt-2
                        truncate
                        text-2xl
                        font-bold
                        tracking-tight
                      "
                    >
                      {value}
                    </h3>

                  </div>


                  <div
                    className={`
                      shrink-0
                      rounded-lg
                      p-3
                      ${styles.iconWrap}
                    `}
                  >

                    <Icon
                      className={`
                        h-5
                        w-5
                        ${styles.icon}
                      `}
                    />

                  </div>

                </div>


                <p
                  className="
                    mt-4
                    text-xs
                    leading-relaxed
                    text-muted-foreground
                  "
                >
                  {caption}
                </p>

              </div>

            );
          },
        )}

      </div>


      {/* =================================================
          TABLE SECTION
      ================================================= */}

      <div
        className="
          rounded-xl
          border
          bg-card
          shadow-sm
        "
      >

        {/* ===============================================
            SECTION HEADER
        =============================================== */}

        <div
          className="
            flex
            flex-col
            gap-1
            border-b
            p-5
            sm:p-6
          "
        >

          <h2
            className="
              text-lg
              font-semibold
              tracking-tight
            "
          >
            Invoices
          </h2>


          <p
            className="
              text-sm
              text-muted-foreground
            "
          >
            Track billing status and payment activity
            for your sector.
          </p>

        </div>


        {/* ===============================================
            TOOLBAR
        =============================================== */}

        <div
          className="
            border-b
            bg-muted/30
            p-4
            sm:p-5
          "
        >

          <Toolbar

            search={

              <SearchInput

                placeholder="
                  Search by invoice number,
                  citizen number,
                  citizen name,
                  or assessment number...
                "

                value={
                  search
                }

                onChange={(
                  event,
                ) => {

                  setSearch(
                    event.target.value,
                  );

                  setPage(1);

                }}
              />

            }


            right={

              <div
                className="
                  flex
                  w-full
                  flex-col
                  gap-3
                  lg:flex-row
                  lg:items-center
                  lg:justify-end
                "
              >

                <div
                  className="
                    flex-1
                  "
                >

                  <Filters

                    schema={
                      invoiceFilters
                    }

                    value={
                      filters
                    }

                    onChange={(
                      value,
                    ) => {

                      setFilters(
                        value,
                      );

                      setPage(1);

                    }}

                    onReset={() => {

                      setFilters(
                        INITIAL_FILTERS,
                      );

                      setSearch("");

                      setPage(1);

                    }}

                  />

                </div>

              </div>

            }

          />

        </div>


        {/* ===============================================
            TABLE
        =============================================== */}

        <CommenTable

          type={
            "invoice" as CommentType
          }

          data={
            tableData
          }

          page={
            page
          }

          pageSize={
            pageSize
          }

          isLoading={
            isLoading ||
            isFetching
          }


          onView={(
            row,
          ) => {

            console.log(
              "view invoice",
              row,
            );

          }}


          onEdit={(
            row,
          ) => {

            console.log(
              "edit invoice",
              row,
            );

          }}


          onDelete={(
            id,
          ) => {

            console.log(
              "delete invoice",
              id,
            );

          }}


          actions={
            actions
          }

        />


        {/* ===============================================
            ERROR
        =============================================== */}

        {isError &&
          !isLoading && (

            <div
              className="
                flex
                items-center
                justify-center
                border-t
                p-6
                text-sm
                text-destructive
              "
            >
              Failed to load invoices.
            </div>

          )}


        {/* ===============================================
            PAGINATION
        =============================================== */}

        <div
          className="
            border-t
            p-4
            sm:p-5
          "
        >

          <DataTablePagination

            page={
              page
            }

            pageSize={
              pageSize
            }

            total={
              meta?.total ??
              0
            }


            onPageChange={(
              newPage,
            ) => {

              setPage(
                newPage,
              );

            }}


            onPageSizeChange={(
              size,
            ) => {

              setPageSize(
                size,
              );

              setPage(1);

            }}

          />

        </div>

      </div>

    </div>
  );
}


export default InvoicesPage;