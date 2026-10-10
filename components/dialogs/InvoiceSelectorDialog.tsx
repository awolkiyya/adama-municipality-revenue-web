"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  FileText,
  Loader2,
  Phone,
  Search,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


import type { Invoice } from "@/types/invoice/invoice";
import { useInvoices } from "@/hooks/invoice/useInvoice.hook";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type InvoiceSelectorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInvoice: Invoice | null;
  onSelect: (invoice: Invoice) => void;
  getAvailablePenalty: (invoice: Invoice) => number;
  isBusy?: boolean;
};

type PaginationInfo = {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

type InvoiceResponseShape = {
  data?: unknown;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    pagination?: PaginationInfo;
  };
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 10;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-ET", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

function getStatusStyle(status: string): string {
  switch (status.toUpperCase()) {
    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";

    case "OVERDUE":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";

    case "PARTIALLY_PAID":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";

    case "ISSUED":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300";

    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function normalizeInvoiceResponse(input: unknown): {
  invoices: Invoice[];
  pagination: PaginationInfo;
} {
  if (!input || typeof input !== "object") {
    return {
      invoices: [],
      pagination: {},
    };
  }

  const response = input as InvoiceResponseShape;

  // Supports either { data: [...] } or
  // { data: { data: [...], current_page, ... } }.
  const nested =
    response.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
      ? (response.data as InvoiceResponseShape)
      : undefined;

  const invoices = Array.isArray(response.data)
    ? (response.data as Invoice[])
    : Array.isArray(nested?.data)
      ? (nested.data as Invoice[])
      : [];

  const meta =
    nested?.meta?.pagination ??
    nested?.meta ??
    response.meta?.pagination ??
    response.meta;

  return {
    invoices,
    pagination: {
      current_page:
        meta?.current_page ??
        nested?.current_page ??
        response.current_page ??
        1,

      last_page:
        meta?.last_page ??
        nested?.last_page ??
        response.last_page ??
        1,

      per_page:
        meta?.per_page ??
        nested?.per_page ??
        response.per_page ??
        PAGE_SIZE,

      total:
        meta?.total ??
        nested?.total ??
        response.total ??
        invoices.length,
    },
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred while loading invoices.";
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function InvoiceSelectorDialog({
  open,
  onOpenChange,
  selectedInvoice,
  onSelect,
  getAvailablePenalty,
  isBusy = false,
}: InvoiceSelectorDialogProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  /* ------------------------------------------------------------------------ */
  /* Debounced search                                                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  /* ------------------------------------------------------------------------ */
  /* Server-side invoice query                                                */
  /* ------------------------------------------------------------------------ */

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useInvoices({
    enabled: open,
    params: {
      search: debouncedSearch || undefined,
      page,
      per_page: PAGE_SIZE,
    },
  });

  const normalized = useMemo(
    () => normalizeInvoiceResponse(data),
    [data],
  );

  const invoices = normalized.invoices;
  const pagination = normalized.pagination;

  const currentPage = pagination.current_page ?? page;
  const lastPage = Math.max(
    pagination.last_page ?? 1,
    1,
  );
  const total = pagination.total ?? invoices.length;

  const eligibleCount = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          Number(getAvailablePenalty(invoice)) > 0,
      ).length,
    [invoices, getAvailablePenalty],
  );

  /* ------------------------------------------------------------------------ */
  /* Selection                                                                */
  /* ------------------------------------------------------------------------ */

  const handleSelect = (invoice: Invoice) => {
    if (isBusy) return;

    const available = Number(getAvailablePenalty(invoice));

    if (!Number.isFinite(available) || available <= 0) {
      return;
    }

    onSelect(invoice);
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isBusy) return;
    onOpenChange(nextOpen);
  };

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        {/* Header */}
        <DialogHeader className="border-b px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-primary/5 text-primary">
              <FileText className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg">
                Select an invoice
              </DialogTitle>

              <DialogDescription className="mt-1 leading-5">
                Find an invoice and select one with an
                available penalty balance for a discount request.
              </DialogDescription>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              autoFocus
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search invoice, taxpayer, or phone..."
              aria-label="Search invoices"
              className="h-11 pl-9 pr-9"
              disabled={isBusy}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                disabled={isBusy}
                aria-label="Clear invoice search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Result information */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {total.toLocaleString()}{" "}
              {total === 1 ? "invoice" : "invoices"} found
            </p>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {eligibleCount} eligible on this page
              </Badge>

              {isFetching && !isLoading && (
                <Loader2
                  className="h-4 w-4 animate-spin text-muted-foreground"
                  aria-label="Updating invoices"
                />
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Invoice list */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {/* Loading */}
          {isLoading && (
            <div
              className="flex min-h-52 flex-col items-center justify-center gap-3"
              role="status"
            >
              <Loader2 className="h-7 w-7 animate-spin text-primary" />

              <div className="text-center">
                <p className="text-sm font-medium">
                  Loading invoices
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Retrieving matching invoices and balances…
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {!isLoading && isError && (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>

              <div>
                <p className="font-medium">
                  Unable to load invoices
                </p>

                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  {getErrorMessage(error)}
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                {isFetching && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Try again
              </Button>
            </div>
          )}

          {/* Empty */}
          {!isLoading &&
            !isError &&
            invoices.length === 0 && (
              <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>

                <p className="mt-3 font-medium">
                  No invoices found
                </p>

                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {debouncedSearch
                    ? "Try another invoice number, taxpayer name, or phone number."
                    : "There are no invoices on this page matching the current query."}
                </p>

                {debouncedSearch && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setSearch("")}
                  >
                    Clear search
                  </Button>
                )}
              </div>
            )}

          {/* Results */}
          {!isLoading &&
            !isError &&
            invoices.length > 0 && (
              <div className="space-y-3">
                {invoices.map((invoice) => {
                  const available = Number(
                    getAvailablePenalty(invoice),
                  );

                  const eligible =
                    Number.isFinite(available) &&
                    available > 0;

                  const isSelected =
                    invoice.id === selectedInvoice?.id;

                  const citizen = invoice.citizen;

                  // Phone is optional because invoice citizen
                  // types may not expose it in every response.
                  const citizenPhone =
                    citizen &&
                    "phone" in citizen &&
                    typeof citizen.phone === "string"
                      ? citizen.phone
                      : null;

                  return (
                    <button
                      key={invoice.id}
                      type="button"
                      disabled={isBusy || !eligible}
                      onClick={() => handleSelect(invoice)}
                      aria-pressed={isSelected}
                      className={[
                        "group w-full rounded-xl border p-4 text-left transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted/30",
                        !eligible
                          ? "cursor-not-allowed opacity-70"
                          : "",
                      ].join(" ")}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Invoice details */}
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div
                            className={[
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                              isSelected
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "bg-muted/50 text-muted-foreground",
                            ].join(" ")}
                          >
                            {isSelected ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <FileText className="h-5 w-5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="break-all font-semibold tracking-tight">
                                {invoice.invoice_number ||
                                  invoice.id}
                              </p>

                              <Badge
                                variant="outline"
                                className={getStatusStyle(
                                  String(invoice.status ?? ""),
                                )}
                              >
                                {formatLabel(
                                  String(invoice.status ?? "UNKNOWN"),
                                )}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <UserRound className="h-4 w-4 shrink-0" />

                              <span className="truncate">
                                {citizen?.name ??
                                  "Taxpayer information unavailable"}
                              </span>
                            </div>

                            {citizenPhone && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="h-3.5 w-3.5 shrink-0" />
                                <span>{citizenPhone}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CalendarDays className="h-3.5 w-3.5 shrink-0" />

                              <span>
                                Due {formatDate(invoice.dates.due_date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Penalty amount */}
                        <div className="flex shrink-0 items-center justify-between gap-4 border-t pt-3 sm:min-w-44 sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                          <div className="sm:text-right">
                            <p className="text-xs text-muted-foreground">
                              Available penalty
                            </p>

                            <p
                              className={[
                                "mt-1 text-base font-bold tabular-nums",
                                eligible
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              ].join(" ")}
                            >
                              {formatCurrency(
                                Number.isFinite(available)
                                  ? available
                                  : 0,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {eligible
                                ? "Eligible for discount request"
                                : "No eligible penalty"}
                            </p>
                          </div>

                          {isSelected && (
                            <Badge className="shrink-0">
                              Selected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
        </div>

        {/* Pagination */}
        {!isLoading && !isError && total > 0 && (
          <div className="flex flex-col gap-3 border-t bg-muted/20 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-muted-foreground">
              Page {currentPage} of {lastPage}
              {" · "}
              {total.toLocaleString()} total
            </p>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  page <= 1 ||
                  isFetching ||
                  isBusy
                }
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1),
                  )
                }
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Previous
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  page >= lastPage ||
                  isFetching ||
                  isBusy
                }
                onClick={() =>
                  setPage((current) =>
                    Math.min(lastPage, current + 1),
                  )
                }
              >
                Next
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="border-t px-5 py-3 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isBusy}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
