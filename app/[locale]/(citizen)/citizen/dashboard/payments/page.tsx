"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Search,
} from "lucide-react";

import { useTaxpayerPayments } from "@/hooks/taxpayer/use-taxpayer-payments";
import type { Payment, PaymentFilters } from "@/types/payment";

import {
  CopyButton,
  INVOICES_BASE_PATH,
  StatusPill,
  formatCurrency,
  formatDateTime,
  formatLabel,
  getPaymentDate,
  getPaymentDetailHref,
  getProviderName,
  getRetryHref,
  getStatusHint,
  getStatusStyle,
} from "@/components/payment/payment-ui";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

type FilterKey = "ALL" | "COMPLETED" | "PENDING" | "PROCESSING" | "FAILED";

const PAGE_SIZE = 10;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "COMPLETED", label: "Completed" },
  { key: "PENDING", label: "Pending" },
  { key: "PROCESSING", label: "Processing" },
  { key: "FAILED", label: "Failed" },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function PaymentRow({ payment }: { payment: Payment }) {
  const style = getStatusStyle(payment.status);
  const Icon = style.icon;
  const provider = getProviderName(payment);
  const hint = getStatusHint(payment);
  const retryHref = getRetryHref(payment);
  const detailHref = getPaymentDetailHref(payment.id);

  const method = formatLabel(payment.payment_method);

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
      {/* Left: what was paid and how */}
      <div className="flex min-w-0 gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border",
            style.className,
          )}
          aria-hidden="true"
        >
          <Icon className="size-4" />
        </span>

        <div className="min-w-0">
          <Link
            href={detailHref}
            className="break-all font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {payment.invoice?.invoice_number ?? payment.payment_number}
          </Link>

          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
            <span>{payment.payment_number}</span>
            <span>{provider ? `${method} · ${provider}` : method}</span>
            <span>{formatDateTime(getPaymentDate(payment))}</span>
          </p>

          {hint && (
            <p
              className={cn(
                "mt-2 text-sm",
                payment.status === "FAILED"
                  ? "text-red-700 dark:text-red-300"
                  : "text-muted-foreground",
              )}
            >
              {hint}
            </p>
          )}

          {payment.transaction_reference && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <span className="shrink-0">Ref:</span>
              <span className="truncate">{payment.transaction_reference}</span>
              <CopyButton
                value={payment.transaction_reference}
                label="Copy transaction reference"
              />
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {retryHref && (
              <Button asChild size="sm">
                <Link href={retryHref}>Try payment again</Link>
              </Button>
            )}

            <Button asChild size="sm" variant="outline">
              <Link href={detailHref}>
                View details
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Right: amount and status */}
      <div className="flex items-center justify-between gap-3 pl-12 sm:flex-col sm:items-end sm:pl-0">
        <p className="font-semibold">
          {formatCurrency(payment.amount, payment.currency)}
        </p>

        <StatusPill status={payment.status} />
      </div>
    </li>
  );
}

function ListSkeleton() {
  return (
    <ul className="divide-y" aria-busy="true" aria-label="Loading payments">
      {Array.from({ length: 5 }).map((_, index) => (
        <li key={index} className="flex items-center gap-3 p-4 sm:p-5">
          <div className="size-9 shrink-0 animate-pulse rounded-full bg-muted" />

          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3 w-64 max-w-full animate-pulse rounded bg-muted/70" />
          </div>

          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-5 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
        <CreditCard className="size-7 text-muted-foreground" />
      </div>

      <h3 className="mt-4 text-base font-semibold">
        {hasFilters ? "No matching payments" : "No payments yet"}
      </h3>

      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? "Try a different status, or search by payment number, invoice number, or reference."
          : "When you pay an invoice, the payment will show up here."}
      </p>

      {hasFilters ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={onClear}
        >
          Clear search and filters
        </Button>
      ) : (
        <Button asChild className="mt-4">
          <Link href={INVOICES_BASE_PATH}>View invoices</Link>
        </Button>
      )}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-5 py-12 text-center">
      <AlertCircle className="size-10 text-destructive" />

      <h3 className="mt-4 text-base font-semibold">
        Unable to load payment history
      </h3>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>

      <Button type="button" className="mt-5" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function Pagination({
  page,
  lastPage,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  lastPage: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Payment pages"
      className="flex items-center justify-between gap-3 border-t p-4 sm:px-5"
    >
      <p className="text-sm text-muted-foreground">
        <span className="hidden sm:inline">
          Showing {from}–{to} of {total}
        </span>
        <span className="sm:hidden">
          Page {page} of {lastPage}
        </span>
      </p>

      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          Page {page} of {lastPage}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="mr-1 size-4" />
          Previous
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= lastPage}
          onClick={() => onChange(page + 1)}
        >
          Next
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function TaxpayerPaymentHistoryPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const cardRef = useRef<HTMLDivElement>(null);

  const search = useDebouncedValue(searchInput.trim());

  /*
   * Filtering, searching and pagination are handled by the API,
   * so every request only returns the current page of results.
   */
  const filters = useMemo<PaymentFilters>(
    () => ({
      page,
      per_page: PAGE_SIZE,
      ...(search ? { search } : {}),
      ...(activeFilter !== "ALL"
        ? { status: activeFilter as PaymentFilters["status"] }
        : {}),
    }),
    [page, search, activeFilter],
  );

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useTaxpayerPayments(filters);

  const payments: Payment[] = useMemo(
    () => (response && response.success ? response.data : []),
    [response],
  );

  const meta = response?.meta;

  const total = meta?.total ?? payments.length;
  const lastPage = Math.max(1, meta?.last_page ?? 1);
  const currentPage = Math.min(page, lastPage);

  const hasFilters = Boolean(search) || activeFilter !== "ALL";

  const hasError = isError || Boolean(response && !response.success);

  const errorMessage =
    error instanceof Error
      ? error.message
      : response && !response.success
        ? response.message
        : "Something went wrong while loading your payments.";

  /* Handlers: any change to search or status returns to page 1. */

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setPage(1);
  }

  function handleFilterChange(filter: FilterKey) {
    setActiveFilter(filter);
    setPage(1);
  }

  function clearFilters() {
    setSearchInput("");
    setActiveFilter("ALL");
    setPage(1);
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Payment history
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Track your payments and keep your references for support.
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href={INVOICES_BASE_PATH}>
            View invoices
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>

      <Card ref={cardRef} className="scroll-mt-4 overflow-hidden">
        <CardContent className="p-0">
          {/* Search and status filters stay visible while the list loads */}
          <div className="space-y-3 border-b p-4 sm:p-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={searchInput}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search by payment, invoice, or reference"
                className="pl-9"
                aria-label="Search payments"
              />
            </div>

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {FILTERS.map((filter) => (
                <Button
                  key={filter.key}
                  type="button"
                  size="sm"
                  variant={activeFilter === filter.key ? "default" : "outline"}
                  className="shrink-0 rounded-full"
                  aria-pressed={activeFilter === filter.key}
                  onClick={() => handleFilterChange(filter.key)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <ListSkeleton />
          ) : hasError ? (
            <ErrorState message={errorMessage} onRetry={() => refetch()} />
          ) : payments.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
          ) : (
            <>
              <ul
                className={cn(
                  "divide-y transition-opacity",
                  isFetching && "opacity-60",
                )}
                aria-busy={isFetching}
              >
                {payments.map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} />
                ))}
              </ul>

              <Pagination
                page={currentPage}
                lastPage={lastPage}
                total={total}
                pageSize={meta?.per_page ?? PAGE_SIZE}
                onChange={handlePageChange}
              />
            </>
          )}
        </CardContent>
      </Card>

      {payments.length > 0 && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Bank transfers can take a little time to be verified by the finance
          team. Keep your payment number and transaction reference if you need
          to contact support.
        </p>
      )}
    </div>
  );
}