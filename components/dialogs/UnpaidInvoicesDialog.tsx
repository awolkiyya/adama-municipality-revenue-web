
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FileText,
  Hash,
  ListFilter,
  Loader2,
  Search,
  SearchX,
  User,
  X,
  type LucideIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { cn, formatETB } from "@/lib/utils";
import { useUnpaidInvoices } from "@/hooks/invoice/useInvoice.hook";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const UNPAID_STATUSES = [
  "ISSUED",
  "PARTIALLY_PAID",
  "OVERDUE",
] as const;

const INVOICES_PER_PAGE = 30;
const MIN_SEARCH_LENGTH = 2;
const INVOICE_STALE_TIME = 15_000;

/* -------------------------------------------------------------------------- */
/* Invoice types and helpers                                                  */
/* -------------------------------------------------------------------------- */

type InvoiceRecord = Record<string, unknown> & {
  id?: string;
  uuid?: string;
  invoice_number?: string;
  number?: string;
  status?: string;
};

type PaginationInfo = {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  from: number | null;
  to: number | null;
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return undefined;
}

function amountValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function positiveInteger(value: unknown, fallback: number): number {
  const parsed = amountValue(value);

  return parsed !== undefined && Number.isInteger(parsed) && parsed > 0
    ? parsed
    : fallback;
}

function getInvoiceStatus(invoice: InvoiceRecord): string {
  return firstString(invoice.status)?.toUpperCase() ?? "UNKNOWN";
}

function getInvoiceNumber(invoice: InvoiceRecord): string {
  return firstString(invoice.invoice_number, invoice.number) ?? "Invoice";
}

function getCustomer(invoice: InvoiceRecord) {
  return (
    asRecord(invoice.citizen) ??
    asRecord(invoice.taxpayer) ??
    asRecord(invoice.customer)
  );
}

function getTaxpayerName(invoice: InvoiceRecord): string {
  const customer = getCustomer(invoice);

  const fullName = firstString(
    customer?.full_name,
    customer?.name,
    customer?.display_name,
  );

  if (fullName) {
    return fullName;
  }

  const parts = [
    customer?.first_name,
    customer?.middle_name,
    customer?.last_name,
  ].filter(
    (part): part is string =>
      typeof part === "string" && part.trim() !== "",
  );

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return (
    firstString(
      invoice.taxpayer_name,
      invoice.citizen_name,
      invoice.customer_name,
    ) ?? "Taxpayer not specified"
  );
}

function getTaxpayerId(invoice: InvoiceRecord): string | undefined {
  const customer = getCustomer(invoice);

  return firstString(
    customer?.taxpayer_number,
    customer?.taxpayer_id_number,
    customer?.citizen_number,
    invoice.taxpayer_number,
    invoice.citizen_number,
  );
}

function getTaxpayerPhone(invoice: InvoiceRecord): string | undefined {
  const customer = getCustomer(invoice);

  return firstString(
    customer?.phone,
    customer?.phone_number,
    customer?.mobile,
    invoice.phone,
    invoice.phone_number,
  );
}

function getNationalId(invoice: InvoiceRecord): string | undefined {
  const customer = getCustomer(invoice);

  return firstString(
    customer?.national_id,
    customer?.national_id_number,
    invoice.national_id,
  );
}

function getInvoiceDescription(invoice: InvoiceRecord): string {
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const firstItem = asRecord(items[0]);
  const assessment = asRecord(invoice.assessment);
  const service = asRecord(firstItem?.service);

  return (
    firstString(
      invoice.service_name,
      invoice.revenue_service_name,
      service?.name,
      firstItem?.service_name,
      firstItem?.description,
      assessment?.assessment_number,
      invoice.assessment_number,
    ) ?? "Revenue invoice"
  );
}

function getInvoiceDueDate(invoice: InvoiceRecord): string | undefined {
  const dates = asRecord(invoice.dates);

  return firstString(
    invoice.due_date,
    dates?.due_date,
    invoice.payment_due_date,
  );
}

function formatDueDate(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInvoiceBalance(invoice: InvoiceRecord): number {
  const financial = asRecord(invoice.financial);
  const totals = asRecord(invoice.totals);

  const balance = amountValue(
    invoice.balance_due ??
      invoice.outstanding_amount ??
      invoice.remaining_amount ??
      financial?.balance_due ??
      financial?.outstanding_amount ??
      totals?.balance_due,
  );

  if (balance !== undefined) {
    return Math.max(0, balance);
  }

  const total = amountValue(
    invoice.total_amount ??
      invoice.grand_total ??
      invoice.total ??
      financial?.total_amount ??
      financial?.grand_total ??
      totals?.total_amount,
  );

  const paid = amountValue(
    invoice.paid_amount ??
      invoice.amount_paid ??
      financial?.paid_amount ??
      financial?.amount_paid ??
      totals?.paid_amount,
  );

  return total !== undefined
    ? Math.max(0, total - (paid ?? 0))
    : 0;
}

function getInvoiceStatusLabel(status: string): string {
  switch (status) {
    case "ISSUED":
      return "Issued";

    case "PARTIALLY_PAID":
      return "Partially paid";

    case "OVERDUE":
      return "Overdue";

    default:
      return status.replaceAll("_", " ").toLowerCase();
  }
}

function getInvoiceStatusClass(status: string): string {
  switch (status) {
    case "OVERDUE":
      return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400";

    case "PARTIALLY_PAID":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400";

    case "ISSUED":
      return "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400";

    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function getInvoiceHref(invoice: InvoiceRecord): string | undefined {
  const id = firstString(invoice.id, invoice.uuid);

  return id ? `/invoices/${encodeURIComponent(id)}` : undefined;
}

/**
 * Supports both common response structures:
 *
 * 1. { data: [...], meta: {...} }
 * 2. { data: { data: [...], meta: {...}, links: {...} } }
 */
function getQueryInvoices(result: unknown): InvoiceRecord[] {
  const root = asRecord(result);
  const rootData = root?.data;

  if (Array.isArray(rootData)) {
    return rootData as InvoiceRecord[];
  }

  const nestedData = asRecord(rootData)?.data;

  return Array.isArray(nestedData)
    ? (nestedData as InvoiceRecord[])
    : [];
}

function getPaginationInfo(
  result: unknown,
  requestedPage: number,
  perPage: number,
): PaginationInfo {
  const root = asRecord(result);
  const rootData = asRecord(root?.data);

  // Laravel resource collections may put meta inside data.
  const meta =
    asRecord(rootData?.meta) ??
    asRecord(root?.meta);

  const links =
    asRecord(rootData?.links) ??
    asRecord(root?.links);

  const currentPage = positiveInteger(
    meta?.current_page ?? meta?.currentPage,
    requestedPage,
  );

  const resolvedPerPage = positiveInteger(
    meta?.per_page ?? meta?.perPage,
    perPage,
  );

  const total = Math.max(
    0,
    amountValue(meta?.total) ?? getQueryInvoices(result).length,
  );

  const lastPage = positiveInteger(
    meta?.last_page ?? meta?.lastPage,
    Math.max(1, Math.ceil(total / resolvedPerPage)),
  );

  const fromValue = amountValue(meta?.from);
  const toValue = amountValue(meta?.to);

  const records = getQueryInvoices(result);

  return {
    currentPage,
    lastPage,
    perPage: resolvedPerPage,
    total,
    from:
      fromValue !== undefined
        ? fromValue
        : records.length > 0
          ? (currentPage - 1) * resolvedPerPage + 1
          : null,
    to:
      toValue !== undefined
        ? toValue
        : records.length > 0
          ? (currentPage - 1) * resolvedPerPage + records.length
          : null,
  };
}

/* -------------------------------------------------------------------------- */
/* Dialog configuration                                                       */
/* -------------------------------------------------------------------------- */

type StatusFilter =
  | "ALL"
  | "OVERDUE"
  | "PARTIALLY_PAID"
  | "ISSUED";

const STATUS_FILTERS: {
  value: StatusFilter;
  label: string;
}[] = [
  { value: "ALL", label: "All" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PARTIALLY_PAID", label: "Partially paid" },
  { value: "ISSUED", label: "Issued" },
];

const STATUS_PRIORITY: Record<string, number> = {
  OVERDUE: 0,
  PARTIALLY_PAID: 1,
  ISSUED: 2,
};

const ROW_GRID =
  "lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_6.5rem_7.5rem_9rem_5.5rem] lg:items-center lg:gap-x-4";

const SEARCH_HINTS: {
  icon: LucideIcon;
  label: string;
}[] = [
  { icon: User, label: "Taxpayer name" },
  { icon: FileText, label: "Invoice number" },
  { icon: Hash, label: "Taxpayer number" },
  { icon: FileText, label: "Assessment number" },
];

/* -------------------------------------------------------------------------- */
/* Debounced search                                                           */
/* -------------------------------------------------------------------------- */

function useDebouncedValue(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebounced(value),
      delay,
    );

    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return [debounced, setDebounced] as const;
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

function EmptyMessage({
  icon: Icon = SearchX,
  title,
  text,
  tips,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  text?: ReactNode;
  tips?: string[];
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div
      role="status"
      className="flex h-full min-h-64 flex-col items-center justify-center gap-5 px-6 py-10 text-center"
    >
      <div className="flex size-14 items-center justify-center rounded-full border bg-muted/40 text-muted-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <p className="text-base font-semibold tracking-tight">
          {title}
        </p>

        {text ? (
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {text}
          </p>
        ) : null}
      </div>

      {tips && tips.length > 0 ? (
        <ul className="w-full max-w-sm space-y-2 rounded-xl border bg-muted/20 p-4 text-left text-sm text-muted-foreground">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2.5">
              <span
                className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50"
                aria-hidden="true"
              />
              {tip}
            </li>
          ))}
        </ul>
      ) : null}

      {action ? (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Unpaid invoices dialog                                                     */
/* -------------------------------------------------------------------------- */

export default function UnpaidInvoicesDialog() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [debouncedSearch, setDebouncedSearch] =
    useDebouncedValue(search.trim());

  const trimmed = search.trim();

  const canSearch =
    debouncedSearch.length >= MIN_SEARCH_LENGTH;

  const enabled = open && canSearch;

  const isWaitingForTyping =
    trimmed.length >= MIN_SEARCH_LENGTH &&
    trimmed !== debouncedSearch;

  /* ---------------------------------------------------------------------- */
  /* Unpaid invoices query                                                  */
  /* ---------------------------------------------------------------------- */

  const unpaidQuery = useUnpaidInvoices({
    params: {
      search: debouncedSearch,
      page,
      per_page: INVOICES_PER_PAGE,
    },
    enabled,
    staleTime: INVOICE_STALE_TIME,
  });

  const isLoading =
    enabled && unpaidQuery.isPending;

  const isError =
    enabled && unpaidQuery.isError;

  const isRefreshing =
    enabled &&
    !isLoading &&
    unpaidQuery.isFetching;

  const isStale =
    enabled && unpaidQuery.isPlaceholderData;

  /* ---------------------------------------------------------------------- */
  /* Pagination metadata                                                    */
  /* ---------------------------------------------------------------------- */

  const pagination = useMemo(
    () =>
      getPaginationInfo(
        unpaidQuery.data,
        page,
        INVOICES_PER_PAGE,
      ),
    [unpaidQuery.data, page],
  );

  const currentPage = pagination.currentPage;
  const lastPage = pagination.lastPage;

  const hasPreviousPage = page > 1;
  const hasNextPage = page < lastPage;

  /* ---------------------------------------------------------------------- */
  /* Invoices                                                               */
  /* ---------------------------------------------------------------------- */

  const invoices = useMemo(() => {
    if (!enabled) {
      return [];
    }

    const records = getQueryInvoices(unpaidQuery.data);

    return records
      .filter((invoice) => {
        const status = getInvoiceStatus(invoice);

        return (
          UNPAID_STATUSES.includes(
            status as (typeof UNPAID_STATUSES)[number],
          ) &&
          getInvoiceBalance(invoice) > 0
        );
      })
      .sort((a, b) => {
        const diff =
          (STATUS_PRIORITY[getInvoiceStatus(a)] ?? 3) -
          (STATUS_PRIORITY[getInvoiceStatus(b)] ?? 3);

        return diff !== 0
          ? diff
          : getInvoiceNumber(a).localeCompare(
              getInvoiceNumber(b),
            );
      });
  }, [enabled, unpaidQuery.data]);

  /* ---------------------------------------------------------------------- */
  /* Status counts                                                          */
  /* ---------------------------------------------------------------------- */

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      ALL: invoices.length,
      OVERDUE: 0,
      PARTIALLY_PAID: 0,
      ISSUED: 0,
    };

    for (const invoice of invoices) {
      const status = getInvoiceStatus(invoice) as StatusFilter;

      if (status in counts) {
        counts[status] += 1;
      }
    }

    return counts;
  }, [invoices]);

  /* ---------------------------------------------------------------------- */
  /* Visible invoices                                                       */
  /* ---------------------------------------------------------------------- */

  const visibleInvoices = useMemo(
    () =>
      statusFilter === "ALL"
        ? invoices
        : invoices.filter(
            (invoice) =>
              getInvoiceStatus(invoice) === statusFilter,
          ),
    [invoices, statusFilter],
  );

  /* ---------------------------------------------------------------------- */
  /* Outstanding total                                                      */
  /* ---------------------------------------------------------------------- */

  const totalOutstanding = useMemo(
    () =>
      visibleInvoices.reduce(
        (sum, invoice) =>
          sum + getInvoiceBalance(invoice),
        0,
      ),
    [visibleInvoices],
  );

  const hasResults =
    canSearch &&
    !isLoading &&
    !isError &&
    visibleInvoices.length > 0;

  /* ---------------------------------------------------------------------- */
  /* Event handlers                                                         */
  /* ---------------------------------------------------------------------- */

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    setStatusFilter("ALL");
  }

  function handlePageChange(nextPage: number) {
    if (
      nextPage < 1 ||
      nextPage > lastPage ||
      nextPage === page ||
      unpaidQuery.isFetching
    ) {
      return;
    }

    setPage(nextPage);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setSearch("");
      setDebouncedSearch("");
      setPage(1);
      setStatusFilter("ALL");
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Search className="size-4" aria-hidden="true" />
        Check unpaid invoices
      </Button>

      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
      >
        <DialogContent
          style={{
            maxWidth: "min(64rem, calc(100vw - 1.5rem))",
          }}
          className="flex h-[min(46rem,92dvh)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
        >
          {/* Header and search --------------------------------------------- */}

          <DialogHeader className="space-y-4 border-b px-5 pb-4 pt-5 pr-12 text-left sm:px-6">
            <div className="space-y-1">
              <DialogTitle className="text-lg">
                Check unpaid invoices
              </DialogTitle>

              <DialogDescription>
                Find what a taxpayer still owes. Overdue invoices are listed
                first.
              </DialogDescription>
            </div>

            <div className="relative">
              <label
                htmlFor="unpaid-invoice-search"
                className="sr-only"
              >
                Search unpaid invoices
              </label>

              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <Input
                id="unpaid-invoice-search"
                type="search"
                value={search}
                onChange={(event) =>
                  handleSearchChange(event.target.value)
                }
                placeholder="Taxpayer name, invoice number, taxpayer number, or assessment number"
                className="h-12 pl-10 pr-11 text-base sm:text-sm [&::-webkit-search-cancel-button]:hidden"
                autoComplete="off"
                autoFocus
              />

              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                {isWaitingForTyping ||
                isLoading ||
                isRefreshing ? (
                  <Loader2
                    className="size-4 animate-spin text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : search ? (
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
                    className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Clear search"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Status filters */}

            {canSearch &&
            !isLoading &&
            !isError &&
            invoices.length > 0 ? (
              <div
                role="group"
                aria-label="Filter by status"
                className="flex flex-wrap gap-2"
              >
                {STATUS_FILTERS.map(({ value, label }) => {
                  const active = statusFilter === value;
                  const count = statusCounts[value];

                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      disabled={
                        value !== "ALL" && count === 0
                      }
                      onClick={() => setStatusFilter(value)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "disabled:cursor-not-allowed disabled:opacity-40",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {label}

                      <span className="tabular-nums opacity-80">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </DialogHeader>

          {/* Body ---------------------------------------------------------- */}

          <div
            className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6"
            aria-live="polite"
          >
            {!canSearch ? (
              <div className="flex h-full flex-col items-center justify-center gap-6 py-4">
                <div className="space-y-1 text-center">
                  <p className="text-sm font-medium">
                    {trimmed.length > 0
                      ? `Keep typing — at least ${MIN_SEARCH_LENGTH} characters`
                      : "Start typing to find unpaid invoices"}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Search by any one of these details:
                  </p>
                </div>

                <ul className="flex w-full max-w-2xl flex-wrap justify-center gap-2.5">
                  {SEARCH_HINTS.map(({ icon: Icon, label }) => (
                    <li
                      key={label}
                      className="inline-flex items-center gap-2 rounded-full border bg-muted/20 px-3.5 py-2 text-sm"
                    >
                      <Icon
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : isLoading ? (
              <div
                className="space-y-2"
                aria-label="Searching unpaid invoices"
                aria-busy="true"
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4 rounded-xl border p-4"
                  >
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>

                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <Alert variant="destructive">
                <AlertCircle
                  className="size-4"
                  aria-hidden="true"
                />

                <AlertTitle>
                  Couldn’t search invoices
                </AlertTitle>

                <AlertDescription className="mt-2 space-y-3">
                  <p>
                    Check your connection, then try again.
                  </p>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void unpaidQuery.refetch();
                    }}
                  >
                    Try again
                  </Button>
                </AlertDescription>
              </Alert>
            ) : visibleInvoices.length === 0 ? (
              invoices.length === 0 ? (
                <EmptyMessage
                  title="No unpaid invoices found"
                  text={
                    <>
                      Nothing outstanding matches{" "}
                      <span className="break-all font-medium text-foreground">
                        “{debouncedSearch}”
                      </span>
                      .
                    </>
                  }
                  tips={[
                    "Check the spelling of the taxpayer name",
                    "Try the invoice number or taxpayer number",
                    "Try the assessment number",
                  ]}
                  action={{
                    label: "Clear search",
                    onClick: () => handleSearchChange(""),
                  }}
                />
              ) : (
                <EmptyMessage
                  icon={ListFilter}
                  title={`No ${getInvoiceStatusLabel(
                    statusFilter,
                  ).toLowerCase()} invoices on this page`}
                  text="Other unpaid invoices on this page match your search. Show all statuses to see them."
                  action={{
                    label: "Show all statuses",
                    onClick: () => setStatusFilter("ALL"),
                  }}
                />
              )
            ) : (
              <div
                className={cn(
                  "space-y-4 transition-opacity",
                  isStale && "pointer-events-none opacity-50",
                )}
                aria-busy={isStale}
              >
                <div className="overflow-hidden rounded-xl border bg-card">
                  {/* Column header */}

                  <div
                    className={cn(
                      "hidden border-b bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground",
                      ROW_GRID,
                    )}
                    aria-hidden="true"
                  >
                    <span>Invoice</span>
                    <span>Taxpayer</span>
                    <span>Due date</span>
                    <span>Status</span>
                    <span className="text-right">
                      Balance due
                    </span>
                    <span />
                  </div>

                  {/* Invoice rows */}

                  <ul className="divide-y">
                    {visibleInvoices.map((invoice) => {
                      const id = firstString(
                        invoice.id,
                        invoice.uuid,
                      );

                      const invoiceNumber =
                        getInvoiceNumber(invoice);

                      const taxpayerName =
                        getTaxpayerName(invoice);

                      const taxpayerId =
                        getTaxpayerId(invoice);

                      const taxpayerPhone =
                        getTaxpayerPhone(invoice);

                      const nationalId =
                        getNationalId(invoice);

                      const taxpayerMeta = [
                        taxpayerId && `ID ${taxpayerId}`,
                        taxpayerPhone,
                        nationalId && `National ID ${nationalId}`,
                      ]
                        .filter(Boolean)
                        .join(" · ");

                      const description =
                        getInvoiceDescription(invoice);

                      const dueDate = formatDueDate(
                        getInvoiceDueDate(invoice),
                      );

                      const status =
                        getInvoiceStatus(invoice);

                      const balance =
                        getInvoiceBalance(invoice);

                      const href =
                        getInvoiceHref(invoice);

                      return (
                        <li
                          key={id ?? invoiceNumber}
                          className={cn(
                            "space-y-3 border-l-2 px-4 py-3.5 transition-colors hover:bg-muted/30 lg:space-y-0",
                            ROW_GRID,
                            status === "OVERDUE"
                              ? "border-l-red-500"
                              : "border-l-transparent",
                          )}
                        >
                          {/* Invoice */}

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold tracking-tight">
                                {invoiceNumber}
                              </span>

                              <Badge
                                variant="outline"
                                className={cn(
                                  "lg:hidden",
                                  getInvoiceStatusClass(status),
                                )}
                              >
                                {getInvoiceStatusLabel(status)}
                              </Badge>
                            </div>

                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {description}
                            </p>
                          </div>

                          {/* Taxpayer */}

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {taxpayerName}
                            </p>

                            {taxpayerMeta ? (
                              <p
                                className="mt-0.5 truncate text-xs text-muted-foreground"
                                title={taxpayerMeta}
                              >
                                {taxpayerMeta}
                              </p>
                            ) : null}
                          </div>

                          {/* Due date */}

                          <p className="text-sm text-muted-foreground">
                            <span className="lg:hidden">
                              Due{" "}
                            </span>
                            {dueDate ?? "—"}
                          </p>

                          {/* Desktop status */}

                          <div className="hidden lg:block">
                            <Badge
                              variant="outline"
                              className={getInvoiceStatusClass(status)}
                            >
                              {getInvoiceStatusLabel(status)}
                            </Badge>
                          </div>

                          {/* Balance and action */}

                          <div className="flex items-center justify-between gap-4 lg:contents">
                            <div className="lg:text-right">
                              <p className="text-xs text-muted-foreground lg:hidden">
                                Balance due
                              </p>

                              <p className="text-base font-semibold tabular-nums">
                                {formatETB(balance)}
                              </p>
                            </div>

                            <div className="lg:text-right">
                              {href ? (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                >
                                  <Link
                                    href={href}
                                    onClick={() => setOpen(false)}
                                  >
                                    View

                                    <span className="sr-only">
                                      {" "}
                                      invoice {invoiceNumber}
                                    </span>

                                    <ArrowRight
                                      className="size-3.5"
                                      aria-hidden="true"
                                    />
                                  </Link>
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Pagination */}

                {pagination.total > 0 ? (
                  <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      Showing{" "}
                      <span className="font-medium text-foreground tabular-nums">
                        {pagination.from ?? 0}
                      </span>
                      {"–"}
                      <span className="font-medium text-foreground tabular-nums">
                        {pagination.to ?? 0}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium text-foreground tabular-nums">
                        {pagination.total}
                      </span>{" "}
                      unpaid invoices
                    </p>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <p className="whitespace-nowrap text-xs text-muted-foreground">
                        Page{" "}
                        <span className="font-medium text-foreground tabular-nums">
                          {page}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium text-foreground tabular-nums">
                          {lastPage}
                        </span>
                      </p>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            !hasPreviousPage ||
                            unpaidQuery.isFetching
                          }
                          onClick={() =>
                            handlePageChange(page - 1)
                          }
                        >
                          <ArrowLeft
                            className="mr-1 size-3.5"
                            aria-hidden="true"
                          />
                          Previous
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            !hasNextPage ||
                            unpaidQuery.isFetching
                          }
                          onClick={() =>
                            handlePageChange(page + 1)
                          }
                        >
                          Next
                          <ArrowRight
                            className="ml-1 size-3.5"
                            aria-hidden="true"
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Footer -------------------------------------------------------- */}

          <div className="flex items-center justify-between gap-3 border-t bg-muted/20 px-5 py-3 sm:px-6">
            {hasResults ? (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {visibleInvoices.length}
                </span>{" "}
                {visibleInvoices.length === 1
                  ? "invoice"
                  : "invoices"}{" "}
                on this page · Outstanding{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {formatETB(totalOutstanding)}
                </span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Balances come from live invoice records.
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
