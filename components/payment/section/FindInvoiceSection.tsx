"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Loader2,
  Search,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTablePagination } from "@/components/table/data-pagination";

import { useAgentPendingInvoices } from "@/hooks/agent/agent-invoice.hook";

import type {
  AgentPendingInvoice,
  AgentPendingInvoiceStatus,
} from "@/types/agent/agent-invoice";

/* =========================================================
   CONSTANTS
   ========================================================= */

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 350;

const PAD = "p-4 sm:p-6";
const PAD_X = "px-4 sm:px-6";

/* =========================================================
   TYPES
   ========================================================= */

interface FindInvoiceSectionProps {
  selectedInvoice: AgentPendingInvoice | null;
  onSelect: (invoice: AgentPendingInvoice) => void;
}

/* =========================================================
   STATUS
   ========================================================= */

const STATUS_STYLE: Record<
  AgentPendingInvoiceStatus,
  {
    label: string;
    dot: string;
  }
> = {
  ISSUED: {
    label: "Issued",
    dot: "bg-red-500",
  },

  PARTIALLY_PAID: {
    label: "Partially paid",
    dot: "bg-amber-500",
  },

  OVERDUE: {
    label: "Overdue",
    dot: "bg-red-600",
  },
};

/* =========================================================
   HELPERS
   ========================================================= */

function formatAmount(value: string | number): string {
  const amount =
    typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(amount)) {
    return "ETB 0.00";
  }

  return `ETB ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

/* =========================================================
   COMPONENT
   ========================================================= */

export function FindInvoiceSection({
  selectedInvoice,
  onSelect,
}: FindInvoiceSectionProps) {
  /* =======================================================
     STATE
     ======================================================= */

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(
    DEFAULT_PER_PAGE,
  );

  /* =======================================================
     SEARCH DEBOUNCE
     ======================================================= */

  useEffect(() => {
    /*
     * Any new search starts from the first page.
     */
    setPage(1);

    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  /* =======================================================
     INVOICE QUERY
     ======================================================= */

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useAgentPendingInvoices({
    search: debouncedSearch || undefined,
    page,
    per_page: perPage,
  });

  const invoices = response?.data ?? [];
  const pagination = response?.meta;

  /* =======================================================
     PAGINATION VALUES
     ======================================================= */

  const currentPage =
    pagination?.current_page ?? page;

  const pageSize =
    pagination?.per_page ?? perPage;

  const total =
    pagination?.total ?? 0;

  /* =======================================================
     ACTIONS
     ======================================================= */

  function handleSelect(
    invoice: AgentPendingInvoice,
  ) {
    onSelect(invoice);
  }

  function handleClearSearch() {
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  }

  function handlePageChange(nextPage: number) {
    if (nextPage < 1) {
      return;
    }

    if (
      pagination &&
      nextPage > pagination!.last_page!
    ) {
      return;
    }

    setPage(nextPage);
  }

  function handlePageSizeChange(
    nextPageSize: number,
  ) {
    if (nextPageSize < 1) {
      return;
    }

    /*
     * Changing page size always returns
     * the user to the first page.
     */
    setPerPage(nextPageSize);
    setPage(1);
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <Card>
      {/* ===================================================
          HEADER
          =================================================== */}

      <CardHeader
        className={`border-b py-4 ${PAD_X}`}
      >
        <div className="flex items-start gap-3">
          <Tile
            icon={Search}
            accent
          />

          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-tight">
              Find invoice
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Search for a pending invoice to process payment.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className={PAD}>
        {/* =================================================
            SEARCH
            ================================================= */}

        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Invoice number, taxpayer name, TIN, or phone"
            aria-label="Search pending invoices"
            className="h-11 pl-10 pr-10"
          />

          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear invoice search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X
                aria-hidden="true"
                className="h-4 w-4"
              />
            </button>
          )}
        </div>

        {/* =================================================
            SEARCH HINT
            ================================================= */}

        {!debouncedSearch &&
          !isLoading &&
          !isError && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Search
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0"
              />

              <span>
                Search by invoice number, taxpayer name,
                taxpayer number, or phone.
              </span>
            </div>
          )}

        {/* =================================================
            INITIAL LOADING
            ================================================= */}

        {isLoading && (
          <div
            role="status"
            className="mt-4 rounded-lg border bg-muted/20 px-4 py-6"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2
                aria-hidden="true"
                className="h-4 w-4 animate-spin"
              />

              <span>
                {debouncedSearch
                  ? "Searching invoices..."
                  : "Loading pending invoices..."}
              </span>
            </div>
          </div>
        )}

        {/* =================================================
            BACKGROUND FETCHING
            ================================================= */}

        {!isLoading &&
          isFetching &&
          invoices.length > 0 && (
            <div
              role="status"
              className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Loader2
                aria-hidden="true"
                className="h-3.5 w-3.5 animate-spin"
              />

              <span>Updating results...</span>
            </div>
          )}

        {/* =================================================
            ERROR
            ================================================= */}

        {isError && !isLoading && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  Could not load invoices
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Something went wrong while retrieving pending
                  invoices.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                Try again
              </Button>
            </div>
          </div>
        )}

        {/* =================================================
            RESULTS
            ================================================= */}

        {!isLoading &&
          !isError &&
          invoices.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-lg border">
              {/* Results header */}

              <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-2.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Pending invoices
                </p>

                <p className="text-xs text-muted-foreground">
                  {total}{" "}
                  {total === 1
                    ? "invoice"
                    : "invoices"}
                </p>
              </div>

              {/* Invoice list */}

              <ul>
                {invoices.map((invoice) => {
                  const selected =
                    selectedInvoice?.id === invoice.id;

                  return (
                    <li
                      key={invoice.id}
                      className="border-b last:border-b-0"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleSelect(invoice)
                        }
                        aria-pressed={selected}
                        className={`group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                          selected
                            ? "bg-primary/5"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        {/* Invoice icon */}

                        <Tile
                          icon={FileText}
                          accent={selected}
                        />

                        {/* Invoice information */}

                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-sm font-semibold">
                              {invoice.invoice_number}
                            </p>

                            <StatusBadge
                              status={invoice.status}
                            />
                          </div>

                          <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                            <UserRound
                              aria-hidden="true"
                              className="h-3.5 w-3.5 shrink-0"
                            />

                            <span className="truncate">
                              {invoice.taxpayer?.name ??
                                "Taxpayer unavailable"}
                            </span>

                            {invoice.taxpayer
                              ?.taxpayer_number && (
                              <>
                                <span aria-hidden="true">
                                  ·
                                </span>

                                <span className="shrink-0">
                                  {
                                    invoice.taxpayer
                                      .taxpayer_number
                                  }
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Balance */}

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold tabular-nums">
                            {formatAmount(
                              invoice.balance_amount,
                            )}
                          </p>

                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Balance due
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

        {/* =================================================
            EMPTY INITIAL STATE
            ================================================= */}

        {!isLoading &&
          !isError &&
          !debouncedSearch &&
          invoices.length === 0 && (
            <EmptyState
              title="No pending invoices"
              description="There are currently no invoices available for agent-assisted payment."
            />
          )}

        {/* =================================================
            EMPTY SEARCH STATE
            ================================================= */}

        {!isLoading &&
          !isError &&
          debouncedSearch &&
          invoices.length === 0 && (
            <EmptyState
              title="No matching invoice"
              description="No pending invoice matched your search. Check the invoice number or taxpayer details and try again."
            />
          )}

        {/* =================================================
            PAGINATION
            ================================================= */}

        {!isLoading &&
          !isError &&
          invoices.length > 0 &&
          pagination &&
          pagination!.last_page! > 1 && (
            <div className="mt-4">
              <DataTablePagination
                page={currentPage}
                pageSize={pageSize}
                total={total}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
      </CardContent>
    </Card>
  );
}

/* =========================================================
   EMPTY STATE
   ========================================================= */

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-4 rounded-lg border border-dashed px-6 py-9 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Search
          aria-hidden="true"
          className="h-4 w-4 text-muted-foreground"
        />
      </div>

      <p className="mt-3 text-sm font-medium">
        {title}
      </p>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   TILE
   ========================================================= */

function Tile({
  icon: Icon,
  accent = false,
}: {
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
        accent
          ? "border bg-background text-foreground"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

/* =========================================================
   STATUS BADGE
   ========================================================= */

function StatusBadge({
  status,
}: {
  status: AgentPendingInvoiceStatus;
}) {
  const style = STATUS_STYLE[status];

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium">
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
      />

      {style.label}
    </span>
  );
}