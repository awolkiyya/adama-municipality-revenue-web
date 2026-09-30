"use client";

import {
  FileText,
  Search,
} from "lucide-react";
import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  useTaxpayerInvoices,
} from "@/hooks/taxpayer/use-taxpayer-invoices";

import type {
  TaxpayerInvoice,
  TaxpayerInvoiceStatus,
} from "@/types/taxpayer/invoice";

/* ========================================================================
 * CONSTANTS
 * ====================================================================== */

const PAGE_SIZE = 6;

/**
 * Invoice statuses that can have an outstanding payable balance.
 *
 * The backend remains authoritative for the financial state.
 * This function only controls whether the taxpayer UI exposes
 * the payment action.
 */
const PAYABLE_STATUSES: TaxpayerInvoiceStatus[] = [
  "ISSUED",
  "PARTIALLY_PAID",
  "OVERDUE",
];

/* ========================================================================
 * FILTERS
 * ====================================================================== */

type FilterKey =
  | "all"
  | "unpaid"
  | "overdue"
  | "paid";

interface InvoiceFilter {
  key: FilterKey;
  label: string;
  match: (invoice: TaxpayerInvoice) => boolean;
}

const FILTERS: InvoiceFilter[] = [
  {
    key: "all",
    label: "All",
    match: () => true,
  },
  {
    key: "unpaid",
    label: "Unpaid",
    match: (invoice) => isPayable(invoice),
  },
  {
    key: "overdue",
    label: "Overdue",
    match: (invoice) => invoice.is_overdue,
  },
  {
    key: "paid",
    label: "Paid",
    match: (invoice) => invoice.is_fully_paid,
  },
];

/* ========================================================================
 * SOURCE LABELS
 * ====================================================================== */

const SOURCE_LABELS: Record<string, string> = {
  ASSESSMENT: "Assessment",
  EXISTING_LIZZ: "Existing LIZZ",
};

/* ========================================================================
 * PAGE
 * ====================================================================== */

export default function TaxpayerInvoicesPage() {
  /* ======================================================================
   * DATA
   *
   * All hooks are intentionally declared before conditional rendering.
   *
   * This prevents:
   *
   * "Rendered more hooks than during the previous render."
   * ==================================================================== */

  const {
    data: invoiceData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useTaxpayerInvoices();

  /**
   * Normalize undefined data to an empty array.
   */
  const invoices = invoiceData ?? [];

  /* ======================================================================
   * STATE
   * ==================================================================== */

  const [filter, setFilter] =
    useState<FilterKey>("all");

  const [query, setQuery] =
    useState("");

  const [page, setPage] =
    useState(1);

  /* ======================================================================
   * FILTER COUNTS
   *
   * Presentation counts only.
   *
   * No financial calculations happen here.
   * ==================================================================== */

  const counts = useMemo(() => {
    return Object.fromEntries(
      FILTERS.map((invoiceFilter) => [
        invoiceFilter.key,
        invoices.filter(invoiceFilter.match).length,
      ])
    ) as Record<FilterKey, number>;
  }, [invoices]);

  /* ======================================================================
   * FILTER + SEARCH
   *
   * Search intentionally remains simple:
   *
   * - Invoice number
   * - Invoice source
   *
   * Invoice line items are available on the detail page.
   * ==================================================================== */

  const filteredInvoices = useMemo(() => {
    const activeFilter =
      FILTERS.find(
        (item) => item.key === filter
      );

    const search =
      query.trim().toLowerCase();

    return [...invoices]
      .filter(
        activeFilter
          ? activeFilter.match
          : () => true
      )
      .filter((invoice) => {
        if (!search) {
          return true;
        }

        const invoiceNumber =
          invoice.invoice_number.toLowerCase();

        const source =
          getSourceLabel(
            invoice.source_type
          ).toLowerCase();

        return (
          invoiceNumber.includes(search) ||
          source.includes(search)
        );
      })
      .sort(
        (a, b) =>
          getTimestamp(b.issued_at) -
          getTimestamp(a.issued_at)
      );
  }, [
    invoices,
    filter,
    query,
  ]);

  /* ======================================================================
   * PAGINATION
   * ==================================================================== */

  const pageCount = Math.max(
    1,
    Math.ceil(
      filteredInvoices.length /
        PAGE_SIZE
    )
  );

  const currentPage = Math.min(
    Math.max(page, 1),
    pageCount
  );

  const startIndex =
    (currentPage - 1) * PAGE_SIZE;

  const rows =
    filteredInvoices.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );

  const showingFrom =
    filteredInvoices.length === 0
      ? 0
      : startIndex + 1;

  const showingTo = Math.min(
    startIndex + PAGE_SIZE,
    filteredInvoices.length
  );

  /* ======================================================================
   * ACTIONS
   * ==================================================================== */

  const clearFilters = () => {
    setFilter("all");
    setQuery("");
    setPage(1);
  };

  const handleFilterChange = (
    nextFilter: FilterKey
  ) => {
    setFilter(nextFilter);
    setPage(1);
  };

  const handleSearchChange = (
    value: string
  ) => {
    setQuery(value);
    setPage(1);
  };

  /* ======================================================================
   * LOADING
   * ==================================================================== */

  if (isLoading) {
    return (
      <TaxpayerInvoicesSkeleton />
    );
  }

  /* ======================================================================
   * ERROR
   * ==================================================================== */

  if (isError) {
    return (
      <TaxpayerInvoicesError
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  /* ======================================================================
   * RENDER
   * ==================================================================== */

  return (
    <div className="min-w-0">
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">

        {/* ================================================================
            HEADER
        ================================================================ */}

        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Invoices
            </h1>

            {isFetching && (
              <span
                className="text-xs text-muted-foreground"
                aria-live="polite"
              >
                Updating...
              </span>
            )}
          </div>

          <p className="max-w-2xl text-sm text-muted-foreground">
            View your municipal invoices,
            check outstanding balances,
            and make payments.
          </p>
        </header>

        {/* ================================================================
            FILTERS + SEARCH
        ================================================================ */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          {/* Filters */}

          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filter invoices"
          >
            {FILTERS.map(
              (invoiceFilter) => {
                const active =
                  filter ===
                  invoiceFilter.key;

                return (
                  <button
                    key={
                      invoiceFilter.key
                    }
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      handleFilterChange(
                        invoiceFilter.key
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {
                      invoiceFilter.label
                    }

                    <span className="ml-1.5 tabular-nums opacity-70">
                      {
                        counts[
                          invoiceFilter.key
                        ]
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>

          {/* Search */}

          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(event) =>
                handleSearchChange(
                  event.target.value
                )
              }
              placeholder="Search invoice number or source"
              aria-label="Search invoices"
              className="pl-9"
            />
          </div>
        </div>

        {/* ================================================================
            INVOICE LIST
        ================================================================ */}

        <Card className="overflow-hidden">
          {rows.length === 0 ? (
            <InvoiceEmptyState
              filter={filter}
              query={query}
              onClear={clearFilters}
            />
          ) : (
            <>
              {/* ==========================================================
                  DESKTOP TABLE
              ========================================================== */}

              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">

                      {/* Number */}

                      <th className="w-14 px-4 py-3 text-center font-medium">
                        No.
                      </th>

                      {/* Invoice */}

                      <th className="px-3 py-3 font-medium">
                        Invoice
                      </th>

                      {/* Issued */}

                      <th className="px-3 py-3 font-medium">
                        Issued
                      </th>

                      {/* Due */}

                      <th className="px-3 py-3 font-medium">
                        Due date
                      </th>

                      {/* Total */}

                      <th className="px-3 py-3 text-right font-medium">
                        Total
                      </th>

                      {/* Balance */}

                      <th className="px-3 py-3 text-right font-medium">
                        Balance due
                      </th>

                      {/* Status */}

                      <th className="px-3 py-3 font-medium">
                        Status
                      </th>

                      {/* Actions */}

                      <th
                        className="py-3 pr-4 text-right font-medium"
                        aria-label="Actions"
                      />
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {rows.map(
                      (invoice, index) => {
                        /**
                         * Sequence number across the complete
                         * filtered result set, not just the page.
                         *
                         * Example:
                         * Page 1 => 1-6
                         * Page 2 => 7-12
                         */
                        const rowNumber =
                          startIndex +
                          index +
                          1;

                        return (
                          <tr
                            key={
                              invoice.id
                            }
                            className="transition-colors hover:bg-muted/30"
                          >

                            {/* ==================================================
                                NUMBER
                            ================================================== */}

                            <td className="px-4 py-3.5 text-center text-muted-foreground tabular-nums">
                              {rowNumber}
                            </td>

                            {/* ==================================================
                                INVOICE
                            ================================================== */}

                            <td className="px-3 py-3.5">
                              <Link
                                href={`/citizen/dashboard/invoices/${invoice.id}`}
                                className="group block w-fit"
                              >
                                <p className="font-medium group-hover:underline">
                                  {
                                    invoice.invoice_number
                                  }
                                </p>

                                <p className="text-xs text-muted-foreground">
                                  {getSourceLabel(
                                    invoice.source_type
                                  )}
                                </p>
                              </Link>
                            </td>

                            {/* ==================================================
                                ISSUED
                            ================================================== */}

                            <td className="px-3 py-3.5 text-muted-foreground">
                              {formatDate(
                                invoice.issued_at
                              )}
                            </td>

                            {/* ==================================================
                                DUE
                            ================================================== */}

                            <td className="px-3 py-3.5">
                              <p>
                                {formatDate(
                                  invoice.due_date
                                )}
                              </p>

                              <DueHint
                                invoice={
                                  invoice
                                }
                              />
                            </td>

                            {/* ==================================================
                                TOTAL
                            ================================================== */}

                            <td className="px-3 py-3.5 text-right tabular-nums">
                              {formatMoney(
                                invoice.currency,
                                invoice.total_amount
                              )}
                            </td>

                            {/* ==================================================
                                BALANCE
                            ================================================== */}

                            <td
                              className={cn(
                                "px-3 py-3.5 text-right font-medium tabular-nums",
                                Number(
                                  invoice.balance_due
                                ) > 0 &&
                                  "text-foreground"
                              )}
                            >
                              {formatMoney(
                                invoice.currency,
                                invoice.balance_due
                              )}
                            </td>

                            {/* ==================================================
                                STATUS
                            ================================================== */}

                            <td className="px-3 py-3.5">
                              <StatusPill
                                invoice={
                                  invoice
                                }
                              />
                            </td>

                            {/* ==================================================
                                ACTIONS
                            ================================================== */}

                            <td className="py-3.5 pr-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                >
                                  <Link
                                    href={`/citizen/dashboard/invoices/${invoice.id}`}
                                  >
                                    View
                                  </Link>
                                </Button>

                                <PayButton
                                  invoice={
                                    invoice
                                  }
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {/* ==========================================================
                  MOBILE LIST
              ========================================================== */}

              <ul className="divide-y md:hidden">
                {rows.map(
                  (invoice, index) => {
                    const rowNumber =
                      startIndex +
                      index +
                      1;

                    return (
                      <li
                        key={
                          invoice.id
                        }
                        className="p-4"
                      >
                        <div className="space-y-4">

                          {/* ==================================================
                              HEADER
                          ================================================== */}

                          <div className="flex items-start justify-between gap-3">

                            <Link
                              href={`/citizen/dashboard/invoices/${invoice.id}`}
                              className="flex min-w-0 items-start gap-3"
                            >
                              <div className="flex shrink-0 items-start gap-2">

                                {/* Number */}

                                <span className="mt-2 w-5 text-center text-xs font-medium tabular-nums text-muted-foreground">
                                  {rowNumber}
                                </span>

                                {/* Icon */}

                                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                  <FileText className="size-4" />
                                </div>
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {
                                    invoice.invoice_number
                                  }
                                </p>

                                <p className="truncate text-xs text-muted-foreground">
                                  {getSourceLabel(
                                    invoice.source_type
                                  )}

                                  {" · "}

                                  {formatDate(
                                    invoice.issued_at
                                  )}
                                </p>
                              </div>
                            </Link>

                            <StatusPill
                              invoice={
                                invoice
                              }
                            />
                          </div>

                          {/* ==================================================
                              FINANCIAL SUMMARY
                          ================================================== */}

                          <div className="grid grid-cols-2 gap-4 rounded-md border bg-muted/20 p-3">

                            <div>
                              <p className="text-xs text-muted-foreground">
                                Total
                              </p>

                              <p className="mt-0.5 text-sm font-medium tabular-nums">
                                {formatMoney(
                                  invoice.currency,
                                  invoice.total_amount
                                )}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                Balance due
                              </p>

                              <p className="mt-0.5 text-sm font-semibold tabular-nums">
                                {formatMoney(
                                  invoice.currency,
                                  invoice.balance_due
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground">
                                Issued
                              </p>

                              <p className="mt-0.5 text-sm">
                                {formatDate(
                                  invoice.issued_at
                                )}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                Due
                              </p>

                              <p className="mt-0.5 text-sm">
                                {formatDate(
                                  invoice.due_date
                                )}
                              </p>

                              <DueHint
                                invoice={
                                  invoice
                                }
                              />
                            </div>
                          </div>

                          {/* ==================================================
                              ACTIONS
                          ================================================== */}

                          <div className="flex gap-2">
                            <Button
                              asChild
                              variant="outline"
                              className="flex-1"
                            >
                              <Link
                                href={`/citizen/dashboard/invoices/${invoice.id}`}
                              >
                                View invoice
                              </Link>
                            </Button>

                            <PayButton
                              invoice={
                                invoice
                              }
                              full
                            />
                          </div>
                        </div>
                      </li>
                    );
                  }
                )}
              </ul>

              {/* ==========================================================
                  PAGINATION
              ========================================================== */}

              {filteredInvoices.length >
                0 && (
                <div className="flex flex-col gap-3 border-t px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">

                  <span>
                    Showing{" "}
                    {showingFrom}–
                    {showingTo} of{" "}
                    {
                      filteredInvoices.length
                    }
                  </span>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        currentPage ===
                        1
                      }
                      onClick={() =>
                        setPage(
                          Math.max(
                            1,
                            currentPage -
                              1
                          )
                        )
                      }
                    >
                      Previous
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        currentPage ===
                        pageCount
                      }
                      onClick={() =>
                        setPage(
                          Math.min(
                            pageCount,
                            currentPage +
                              1
                          )
                        )
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ========================================================================
 * PAY BUTTON
 * ====================================================================== */

/**
 * Payment initiation belongs to the specific invoice.
 *
 * The backend remains responsible for validating:
 *
 * - invoice ownership
 * - invoice status
 * - remaining balance
 * - payment amount
 * - payment method
 * - payment processing
 */
function PayButton({
  invoice,
  full = false,
}: {
  invoice: TaxpayerInvoice;
  full?: boolean;
}) {
  if (!isPayable(invoice)) {
    return null;
  }

  return (
    <Button
      asChild
      size="sm"
      variant={
        invoice.is_overdue
          ? "destructive"
          : "default"
      }
      className={
        full
          ? "flex-1"
          : undefined
      }
    >
      <Link
        href={`/citizen/dashboard/invoices/${invoice.id}/pay`}
      >
        Pay{" "}
        {formatMoney(
          invoice.currency,
          invoice.balance_due
        )}
      </Link>
    </Button>
  );
}

/* ========================================================================
 * STATUS
 * ====================================================================== */

const STATUS_STYLE: Record<
  TaxpayerInvoiceStatus,
  {
    label: string;
    className: string;
  }
> = {
  DRAFT: {
    label: "Draft",
    className:
      "bg-muted text-muted-foreground",
  },

  ISSUED: {
    label: "Unpaid",
    className:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },

  PARTIALLY_PAID: {
    label: "Partially paid",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-500",
  },

  PAID: {
    label: "Paid",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },

  OVERDUE: {
    label: "Overdue",
    className:
      "bg-destructive/10 text-destructive",
  },

  CANCELLED: {
    label: "Cancelled",
    className:
      "bg-muted text-muted-foreground",
  },
};

function StatusPill({
  invoice,
}: {
  invoice: TaxpayerInvoice;
}) {
  const status =
    getDisplayStatus(invoice);

  const style =
    STATUS_STYLE[status];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        style.className
      )}
    >
      {style.label}
    </span>
  );
}

/* ========================================================================
 * DISPLAY STATUS
 * ====================================================================== */

/**
 * These flags come directly from the Laravel resource.
 *
 * They are presentation signals.
 *
 * The backend remains authoritative for financial state.
 */
function getDisplayStatus(
  invoice: TaxpayerInvoice
): TaxpayerInvoiceStatus {
  if (invoice.is_fully_paid) {
    return "PAID";
  }

  if (invoice.is_overdue) {
    return "OVERDUE";
  }

  return invoice.status;
}

/* ========================================================================
 * DUE HINT
 * ====================================================================== */

function DueHint({
  invoice,
}: {
  invoice: TaxpayerInvoice;
}) {
  if (
    !invoice.due_date ||
    !isPayable(invoice)
  ) {
    return null;
  }

  const today =
    startOfToday();

  const dueDate =
    toDate(invoice.due_date);

  if (
    Number.isNaN(
      dueDate.getTime()
    )
  ) {
    return null;
  }

  const days = Math.round(
    (dueDate.getTime() -
      today.getTime()) /
      86_400_000
  );

  let label: string;

  if (invoice.is_overdue) {
    const count =
      Math.abs(days);

    label =
      count === 0
        ? "Overdue"
        : `Overdue by ${count} ${
            count === 1
              ? "day"
              : "days"
          }`;
  } else if (days < 0) {
    const count =
      Math.abs(days);

    label = `Overdue by ${count} ${
      count === 1
        ? "day"
        : "days"
    }`;
  } else if (days === 0) {
    label = "Due today";
  } else if (days === 1) {
    label = "Due tomorrow";
  } else {
    label = `Due in ${days} days`;
  }

  return (
    <p
      className={cn(
        "text-xs",
        invoice.is_overdue ||
          days < 0
          ? "font-medium text-destructive"
          : "text-muted-foreground"
      )}
    >
      {label}
    </p>
  );
}

/* ========================================================================
 * PAYABLE
 * ====================================================================== */

/**
 * This function does NOT calculate the payable amount.
 *
 * It only decides whether the UI should expose the payment action.
 *
 * The actual balance and financial state come from Laravel.
 */
function isPayable(
  invoice: TaxpayerInvoice
): boolean {
  return (
    PAYABLE_STATUSES.includes(
      invoice.status
    ) &&
    !invoice.is_fully_paid &&
    Number(invoice.balance_due) > 0
  );
}

/* ========================================================================
 * EMPTY STATE
 * ====================================================================== */

function InvoiceEmptyState({
  filter,
  query,
  onClear,
}: {
  filter: FilterKey;
  query: string;
  onClear: () => void;
}) {
  const hasFilters =
    filter !== "all" ||
    query.trim().length > 0;

  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
        <FileText className="size-5 text-muted-foreground" />
      </div>

      <p className="mt-3 text-sm font-medium">
        No invoices found
      </p>

      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        {hasFilters
          ? "Try a different filter or search term."
          : "Your invoices will appear here when they are available."}
      </p>

      {hasFilters && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onClear}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}

/* ========================================================================
 * LOADING
 * ====================================================================== */

function TaxpayerInvoicesSkeleton() {
  return (
    <div className="min-w-0">
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">

        {/* Header */}

        <div className="space-y-2">
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />

          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted" />
        </div>

        {/* Filters */}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <div className="h-9 w-16 animate-pulse rounded-full bg-muted" />
            <div className="h-9 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-9 w-20 animate-pulse rounded-full bg-muted" />
          </div>

          <div className="h-10 w-full animate-pulse rounded-md bg-muted sm:w-80" />
        </div>

        {/* Table */}

        <Card className="overflow-hidden">
          <CardContent className="space-y-4 p-6">
            <div className="h-10 animate-pulse rounded bg-muted" />

            {Array.from({
              length: 6,
            }).map((_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded bg-muted"
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ========================================================================
 * ERROR
 * ====================================================================== */

function TaxpayerInvoicesError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className="min-w-0">
      <div className="mx-auto flex min-h-[400px] w-full max-w-6xl items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">

            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <FileText className="size-6 text-destructive" />
            </div>

            <div>
              <h2 className="text-base font-semibold">
                Unable to load invoices
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                We couldn&apos;t retrieve
                your invoices. Please try
                again.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onRetry}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ========================================================================
 * SOURCE
 * ====================================================================== */

function getSourceLabel(
  sourceType: string
): string {
  return (
    SOURCE_LABELS[sourceType] ??
    formatSourceType(sourceType)
  );
}

function formatSourceType(
  value: string
): string {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

/* ========================================================================
 * DATE
 * ====================================================================== */

/**
 * Laravel:
 *
 * issued_at / paid_at:
 * ISO datetime
 *
 * due_date:
 * YYYY-MM-DD
 *
 * Date-only values are parsed as local midnight so that the
 * displayed calendar date does not shift because of timezone conversion.
 */
function toDate(
  value: string
): Date {
  return new Date(
    value.length === 10
      ? `${value}T00:00:00`
      : value
  );
}

function formatDate(
  value: string | null
): string {
  if (!value) {
    return "—";
  }

  const date =
    toDate(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  ).format(date);
}

function startOfToday(): Date {
  const date =
    new Date();

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
}

/* ========================================================================
 * MONEY
 * ====================================================================== */

function formatMoney(
  currency: string,
  value: string | number
): string {
  const amount =
    formatAmount(value);

  if (amount === "—") {
    return "—";
  }

  return `${currency} ${amount}`;
}

function formatAmount(
  value: string | number
): string {
  const amount =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isFinite(
      amount
    )
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(amount);
}

/* ========================================================================
 * TIMESTAMP
 * ====================================================================== */

function getTimestamp(
  value: string | null
): number {
  if (!value) {
    return 0;
  }

  const timestamp =
    Date.parse(value);

  return Number.isFinite(
    timestamp
  )
    ? timestamp
    : 0;
}