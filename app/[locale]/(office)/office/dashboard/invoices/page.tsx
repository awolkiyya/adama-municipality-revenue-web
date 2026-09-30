"use client";

// =====================================================
// INVOICES PAGE
// Billing / invoice management
// =====================================================

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

import {
  CalendarDays,
  FileText,
  Filter,
  Loader2,
  Search,
  X,
} from "lucide-react";

import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { IconBadge } from "@/components/commen/icon-badge";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Filters } from "@/components/commen/Filters";
import { Toolbar } from "@/components/commen/Toolbar";
import { ExportDropdown } from "@/components/commen/ExportDropdown";

import { CommenTable } from "@/components/table/CommenTable";
import { DataTablePagination } from "@/components/table/data-pagination";
import { resolveActions } from "@/components/table/permissions/ResolveActions";
import { CommentTableRegistry } from "@/components/table/registry";

import type {
  CommentType,
  DateRangeValue,
  FilterField,
} from "@/types/commen";

import type {
  Invoice,
  InvoiceFilters,
  InvoiceSourceType,
  InvoiceStatus,
} from "@/types/invoice/invoice";

import type { InvoiceSummary } from "@/types/invoice/invoice-summary";

import type { RootState } from "@/lib/store/store";

import { cn } from "@/lib/utils";
import { useInvoices } from "@/hooks/invoice/useInvoice.hook";

// =====================================================
// CONFIG
// =====================================================

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ISSUED: "bg-blue-100 text-blue-700",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-orange-100 text-orange-700",
  VOID: "bg-gray-100 text-gray-700",
};

const STATUS_TABS: {
  value: "ALL" | InvoiceStatus;
  label: string;
}[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "ISSUED", label: "Issued" },
  { value: "PARTIALLY_PAID", label: "Partially paid" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "VOID", label: "Void" },
];

// =====================================================
// SOURCE TYPE CONFIG
// =====================================================

const INVOICE_SOURCE_TABS: {
  value: "ALL" | InvoiceSourceType;
  label: string;
  description: string;
}[] = [
  {
    value: "ALL",
    label: "All sources",
    description: "Invoices from every revenue workflow",
  },
  {
    value: "ASSESSMENT",
    label: "Assessment",
    description: "Invoices generated from approved assessments",
  },
  {
    value: "EXISTING_LIZZ",
    label: "Existing LIZZ",
    description: "Invoices generated from existing LIZZ records",
  },
  {
    value: "DIRECT_COLLECTION",
    label: "Direct collection",
    description: "Invoices created directly during collection",
  },
];

// =====================================================
// DATE FILTER
// =====================================================

export const invoiceFilters: FilterField[] = [
  {
    key: "date",
    label: "Issue date",
    type: "dateRange",
    defaultValue: null,
    icon: CalendarDays,
  },
];

// =====================================================
// INITIAL FILTERS
// =====================================================

type InvoicePageFilters = {
  status: "ALL" | InvoiceStatus;
  source_type: "ALL" | InvoiceSourceType;
  date: DateRangeValue | null;
};

const INITIAL_FILTERS: InvoicePageFilters = {
  status: "ALL",
  source_type: "ALL",
  date: null,
};

// =====================================================
// EMPTY SUMMARY
// =====================================================

const EMPTY_SUMMARY: InvoiceSummary = {
  total_invoices: 0,
  subtotal: 0,
  discount_amount: 0,
  penalty_amount: 0,
  total_amount: 0,
  paid_amount: 0,
  balance_due: 0,

  status_counts: {
    DRAFT: 0,
    ISSUED: 0,
    PARTIALLY_PAID: 0,
    PAID: 0,
    OVERDUE: 0,
    CANCELLED: 0,
    VOID: 0,
  },
};

// =====================================================
// HELPERS
// =====================================================

const formatCurrency = (
  amount: number,
  currency: string = "ETB",
) =>
  new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (iso: string | null) => {
  if (!iso) return "—";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const statusLabel = (value: string) =>
  STATUS_TABS.find((tab) => tab.value === value)?.label ?? value;

const sourceLabel = (value: string) =>
  INVOICE_SOURCE_TABS.find((source) => source.value === value)?.label ??
  value;

// =====================================================
// SEARCH INPUT
// =====================================================

export function SearchInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      <Input
        className={cn("w-full py-5 pl-9", className)}
        {...props}
      />
    </div>
  );
}

// =====================================================
// SUMMARY STAT
// =====================================================

function Stat({
  label,
  value,
  caption,
  valueClassName,
  onClick,
  active,
}: {
  label: string;
  value: string;
  caption: string;
  valueClassName?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const content = (
    <>
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p
        className={cn(
          "mt-1 truncate text-2xl font-semibold tracking-tight",
          valueClassName,
        )}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {caption}
      </p>
    </>
  );

  const base = "flex-1 px-5 py-4 text-left";

  if (!onClick) {
    return <div className={base}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        base,
        "transition-colors hover:bg-muted/50",
        active && "bg-muted/60",
      )}
    >
      {content}
    </button>
  );
}

// =====================================================
// PAGE
// =====================================================

function InvoicesPage() {
  const router = useRouter();

  const user = useSelector(
    (state: RootState) => state.auth.user,
  );

  // ===================================================
  // STATE
  // ===================================================

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [filters, setFilters] =
    useState<InvoicePageFilters>(INITIAL_FILTERS);

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);

  // ===================================================
  // DEBOUNCED SEARCH
  // ===================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // ===================================================
  // FILTER STATE
  // ===================================================

  const hasStatusFilter =
    filters.status !== "ALL";

  const hasSourceFilter =
    filters.source_type !== "ALL";

  const hasDateFilter =
    Boolean(
      filters.date?.from ||
        filters.date?.to,
    );

  const hasSearchFilter =
    search !== "";

  const hasActiveFilters =
    hasStatusFilter ||
    hasSourceFilter ||
    hasDateFilter ||
    hasSearchFilter;

  // ===================================================
  // STATUS
  // ===================================================

  const setStatus = (
    status: "ALL" | InvoiceStatus,
  ) => {
    setFilters((current) => ({
      ...current,
      status,
    }));

    setPage(1);
  };

  // ===================================================
  // SOURCE
  // ===================================================

  const setSourceType = (
    source_type:
      | "ALL"
      | InvoiceSourceType,
  ) => {
    setFilters((current) => ({
      ...current,
      source_type,
    }));

    setPage(1);
  };

  // ===================================================
  // DATE
  // ===================================================

  const clearDate = () => {
    setFilters((current) => ({
      ...current,
      date: null,
    }));

    setPage(1);
  };

  // ===================================================
  // CLEAR ALL
  // ===================================================

  const clearAll = () => {
    setSearchInput("");
    setSearch("");

    setFilters({
      ...INITIAL_FILTERS,
    });

    setPage(1);
  };

  // ===================================================
  // PAYMENT
  // ===================================================

  const handleRecordPayment = (
    invoice: Invoice,
  ) => {
    router.push(
      `/office/dashboard/payments/create?invoice_id=${invoice.id}`,
    );
  };

  // ===================================================
  // API QUERY
  // ===================================================

  const queryParams: InvoiceFilters = {
    page,
    per_page: pageSize,

    search:
      search || undefined,

    status:
      hasStatusFilter
        ? filters.status
        : undefined,

    source_type:
      hasSourceFilter
        ? filters.source_type
        : undefined,

    issued_from:
      filters.date?.from || undefined,

    issued_to:
      filters.date?.to || undefined,
  };

  const {
    data,
    isLoading,
    isFetching,
    isError,
  } = useInvoices({
    params: queryParams,
  });

  // ===================================================
  // API DATA
  // ===================================================

  const invoices: Invoice[] =
    data?.data ?? [];

  const meta = data?.meta;

  const summary: InvoiceSummary =
    (data?.meta?.summary as
      | InvoiceSummary
      | undefined) ??
    EMPTY_SUMMARY;

  const awaitingPayment =
    summary.status_counts.ISSUED +
    summary.status_counts.PARTIALLY_PAID;

  // ===================================================
  // TABLE DATA
  // ===================================================

  const tableData = useMemo(
    () =>
      invoices.map(
        (invoice: Invoice) => {
          const citizen =
            invoice.citizen as
              | Record<string, unknown>
              | null;

          const assessment =
            invoice.assessment as
              | Record<string, unknown>
              | null;

          return {
            ...invoice,

            // -----------------------------------------
            // Citizen
            // -----------------------------------------

            citizen_name: citizen
              ? ((citizen.name ??
                  citizen.full_name ??
                  "—") as string)
              : "—",

            citizen_number: citizen
              ? ((citizen.citizen_number ??
                  citizen.tin ??
                  "—") as string)
              : "—",

            // -----------------------------------------
            // Assessment
            // -----------------------------------------

            assessment_number:
              assessment
                ? ((assessment.assessment_number ??
                    "—") as string)
                : "—",

            // -----------------------------------------
            // Source
            // -----------------------------------------

            source_type_label:
              sourceLabel(
                invoice.source_type,
              ),

            // -----------------------------------------
            // Financial
            // -----------------------------------------

            subtotal:
              formatCurrency(
                Number(
                  invoice.financial.subtotal,
                ),
                invoice.currency,
              ),

            total_amount:
              formatCurrency(
                Number(
                  invoice.financial.total_amount,
                ),
                invoice.currency,
              ),

            paid_amount:
              formatCurrency(
                Number(
                  invoice.financial.paid_amount,
                ),
                invoice.currency,
              ),

            balance_due:
              formatCurrency(
                Number(
                  invoice.financial.balance_due,
                ),
                invoice.currency,
              ),

            // -----------------------------------------
            // Dates
            // -----------------------------------------

            issued_at:
              formatDate(
                invoice.dates.issued_at,
              ),

            due_date:
              formatDate(
                invoice.dates.due_date,
              ),

            // -----------------------------------------
            // Status
            // -----------------------------------------

            status_badge_class:
              STATUS_BADGE[
                invoice.status
              ],
          };
        },
      ),
    [invoices],
  );

  // ===================================================
  // PERMISSIONS
  // ===================================================

  if (!user?.role) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />

        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium text-foreground">
            Checking permissions
          </p>

          <p className="text-xs text-muted-foreground">
            This will only take a moment
          </p>
        </div>
      </div>
    );
  }

  const actions = resolveActions(
    CommentTableRegistry.invoice,
    user.permissions,
  );

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="relative min-h-full space-y-6 pb-4">

      {/* =================================================
          HEADER
      ================================================= */}

      <Banner
        badge={
          <IconBadge
            className="gap-2 rounded-full bg-black/20 p-3 text-[10px] text-white"
            icon={
              <FileText className="h-4 w-4" />
            }
          >
            Billing
          </IconBadge>
        }
        description="Issue, track, and reconcile invoices raised against registered taxpayers within your sector."
        background={
          <FloatingParticles
            color="#040404"
            count={35}
            speed={0.2}
            connectDistance={100}
            position="bottom-right"
          />
        }
        overlayClassName="bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50"
        className="text-white"
        actions={
          <div className="flex justify-end">
            <ExportDropdown />
          </div>
        }
      />

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col divide-y sm:flex-row sm:divide-x sm:divide-y-0">

          <Stat
            label="All invoices"
            value={`${summary.total_invoices}`}
            caption={`${formatCurrency(summary.total_amount)} billed`}
            onClick={() =>
              setStatus("ALL")
            }
            active={
              filters.status === "ALL"
            }
          />

          <Stat
            label="Paid"
            value={formatCurrency(
              summary.paid_amount,
            )}
            valueClassName="text-emerald-600"
            caption={`${summary.status_counts.PAID} invoices`}
            onClick={() =>
              setStatus("PAID")
            }
            active={
              filters.status === "PAID"
            }
          />

          <Stat
            label="Outstanding"
            value={formatCurrency(
              summary.balance_due,
            )}
            valueClassName="text-amber-600"
            caption={`${awaitingPayment} awaiting payment`}
          />

          <Stat
            label="Overdue"
            value={`${summary.status_counts.OVERDUE}`}
            valueClassName={
              summary.status_counts.OVERDUE >
              0
                ? "text-red-600"
                : undefined
            }
            caption="Invoices past due"
            onClick={() =>
              setStatus("OVERDUE")
            }
            active={
              filters.status === "OVERDUE"
            }
          />

        </div>
      </div>

      {/* =================================================
          LIST
      ================================================= */}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">

        {/* =================================================
            STATUS TABS
        ================================================= */}

        <div className="border-b px-4 pt-4 sm:px-5">
          <div className="flex gap-1 overflow-x-auto pb-3">

            {STATUS_TABS.map(
              (tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() =>
                    setStatus(
                      tab.value,
                    )
                  }
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",

                    filters.status ===
                      tab.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              ),
            )}

          </div>
        </div>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="p-4 sm:p-5">

          <Toolbar
            search={
              <SearchInput
                placeholder="Search invoice, citizen, assessment number, or citizen name"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
              />
            }
            right={
              <div className="flex w-full items-center justify-end gap-2">

                {/* =========================================
                    FILTER SHEET
                ========================================= */}

                <Sheet>

                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 gap-2"
                    >
                      <Filter className="h-4 w-4" />

                      <span>
                        Filters
                      </span>

                      {hasActiveFilters && (
                        <span className="size-2 rounded-full bg-primary" />
                      )}
                    </Button>
                  </SheetTrigger>

                  <SheetContent
                    side="right"
                    className="flex w-full flex-col p-5 sm:max-w-md"
                  >

                    <SheetHeader>
                      <SheetTitle>
                        Filter invoices
                      </SheetTitle>

                      <SheetDescription>
                        Filter invoices by source,
                        status, and issue date.
                      </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-1 py-6">

                      {/* =================================
                          SOURCE TYPE
                      ================================= */}

                      <div className="space-y-3">

                        <div>
                          <p className="text-sm font-medium">
                            Invoice source
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Select where the invoice
                            originated.
                          </p>
                        </div>

                        <div className="space-y-2">

                          {INVOICE_SOURCE_TABS.map(
                            (source) => (
                              <button
                                key={
                                  source.value
                                }
                                type="button"
                                onClick={() =>
                                  setSourceType(
                                    source.value,
                                  )
                                }
                                className={cn(
                                  "w-full rounded-lg border p-3 text-left transition-colors",

                                  filters.source_type ===
                                    source.value
                                    ? "border-primary bg-primary/5"
                                    : "hover:bg-muted",
                                )}
                              >

                                <div className="flex items-center justify-between">

                                  <span
                                    className={cn(
                                      "text-sm font-medium",

                                      filters.source_type ===
                                        source.value
                                        ? "text-primary"
                                        : "text-foreground",
                                    )}
                                  >
                                    {
                                      source.label
                                    }
                                  </span>

                                  {filters.source_type ===
                                    source.value && (
                                    <span className="size-2 rounded-full bg-primary" />
                                  )}

                                </div>

                                <p className="mt-1 text-xs text-muted-foreground">
                                  {
                                    source.description
                                  }
                                </p>

                              </button>
                            ),
                          )}

                        </div>
                      </div>

                      {/* =================================
                          SEPARATOR
                      ================================= */}

                      <div className="my-6 border-t" />

                      {/* =================================
                          ISSUE DATE
                      ================================= */}

                      <div className="space-y-3">

                        <div>
                          <p className="text-sm font-medium">
                            Issue date
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Show invoices issued within
                            a specific date range.
                          </p>
                        </div>

                        <Filters
                          schema={
                            invoiceFilters
                          }
                          value={{
                            date: filters.date,
                          }}
                          onChange={(
                            value,
                          ) => {
                            setFilters(
                              (current) => ({
                                ...current,
                                date:
                                  value.date ??
                                  null,
                              }),
                            );

                            setPage(1);
                          }}
                          layout="column"
                          resetPosition="end"
                        />

                      </div>

                    </div>

                    {/* =================================
                        SHEET FOOTER
                    ================================= */}

                    <SheetFooter className="border-t pt-4">

                      <Button
                        type="button"
                        variant="outline"
                        onClick={
                          clearAll
                        }
                      >
                        Clear all
                      </Button>

                      <SheetClose asChild>
                        <Button type="button">
                          Done
                        </Button>
                      </SheetClose>

                    </SheetFooter>

                  </SheetContent>

                </Sheet>

              </div>
            }
          />

          {/* =================================================
              ACTIVE FILTER CHIPS
          ================================================= */}

          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2">

              {/* SEARCH */}

              {hasSearchFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                >
                  Search:{" "}
                  <span className="max-w-[180px] truncate">
                    {search}
                  </span>

                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}

              {/* STATUS */}

              {hasStatusFilter && (
                <button
                  type="button"
                  onClick={() =>
                    setStatus("ALL")
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                >
                  Status:{" "}
                  {statusLabel(
                    filters.status,
                  )}

                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}

              {/* SOURCE */}

              {hasSourceFilter && (
                <button
                  type="button"
                  onClick={() =>
                    setSourceType("ALL")
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                >
                  Source:{" "}
                  {sourceLabel(
                    filters.source_type,
                  )}

                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}

              {/* DATE */}

              {hasDateFilter && (
                <button
                  type="button"
                  onClick={clearDate}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                >
                  Issued{" "}
                  {filters.date?.from
                    ? formatDate(
                        filters.date.from,
                      )
                    : "…"}

                  {" – "}

                  {filters.date?.to
                    ? formatDate(
                        filters.date.to,
                      )
                    : "…"}

                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}

              {/* CLEAR */}

              <button
                type="button"
                onClick={clearAll}
                className="ml-auto text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Clear all
              </button>

            </div>
          )}

        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="border-t">

          <CommenTable
            type={"invoice" as CommentType}
            data={tableData}
            page={page}
            pageSize={pageSize}
            isLoading={
              isLoading ||
              isFetching
            }
            onView={(row) => {
              const invoice = row as Invoice;
          
              router.push(
                `/office/dashboard/invoices/${invoice.id}/view`,
              );
            }}
            onEdit={(row) => {
              console.log(
                "edit invoice",
                row,
              );
            }}
            onDelete={(id) => {
              console.log(
                "delete invoice",
                id,
              );
            }}
            onPay={(row) =>
              handleRecordPayment(
                row as Invoice,
              )
            }
            actions={actions}
          />

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {isError &&
          !isLoading && (
            <div className="flex items-center justify-center border-t p-6 text-sm text-destructive">
              Couldn&apos;t load invoices.
              Check your connection and
              try again.
            </div>
          )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!isError &&
          !isLoading &&
          !isFetching &&
          tableData.length === 0 && (
            <div className="flex flex-col items-center gap-2 border-t p-10 text-center">

              <p className="text-sm font-medium">
                {hasActiveFilters
                  ? "No invoices match your filters"
                  : "No invoices yet"}
              </p>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                >
                  Clear filters
                </Button>
              )}

            </div>
          )}

        {/* =================================================
            PAGINATION
        ================================================= */}

        <div className="border-t p-4 sm:p-5">

          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={meta?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />

        </div>

      </div>
    </div>
  );
}

export default InvoicesPage;