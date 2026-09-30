"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTaxpayerDashboard } from "@/hooks/taxpayer/use-taxpayer-dashboard";
import type {
  TaxpayerDashboardInvoice,
} from "@/types/taxpayer/dashboard";

/* ========================================================================
 * DASHBOARD
 * ====================================================================== */

/**
 * Taxpayer Dashboard
 *
 * Data flow:
 *
 * TaxpayerDashboard
 *       ↓
 * useTaxpayerDashboard()
 *       ↓
 * taxpayerDashboardService
 *       ↓
 * Laravel Taxpayer Dashboard API
 *
 * Financial/business calculations remain backend-owned.
 *
 * The frontend is responsible only for:
 *
 * - presentation
 * - formatting
 * - navigation
 * - loading/error states
 * - display-only aggregation of already-provided invoices
 *
 * Backend-provided fields such as:
 *
 * - total_outstanding
 * - outstanding_invoices
 * - is_overdue
 * - is_fully_paid
 *
 * are treated as authoritative.
 */
export function TaxpayerDashboard() {
  const t = useTranslations("taxpayer.dashboard");

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useTaxpayerDashboard();

  /* ======================================================================
   * LOADING
   * ==================================================================== */

  if (isLoading) {
    return <TaxpayerDashboardSkeleton />;
  }

  /* ======================================================================
   * ERROR
   * ==================================================================== */

  if (isError || !data) {
    return (
      <TaxpayerDashboardError
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  /* ======================================================================
   * DATA
   * ==================================================================== */

  const { summary } = data;

  const currency = summary.currency;

  const money = (value: string | number) =>
    `${currency} ${formatAmount(value)}`;

  /*
   * Backend-provided invoice classifications.
   *
   * Do not independently calculate overdue status here.
   */
  const overdue = data.overdue_invoices;

  const dueSoon = data.due_soon_invoices;

  /*
   * The backend currently provides:
   *
   * - overdue_invoices
   * - due_soon_invoices
   * - recent_invoices
   *
   * If the dedicated overdue/due-soon collections are populated,
   * use them first.
   *
   * The current API response has both collections empty while there
   * are outstanding invoices, so recent outstanding invoices are used
   * as the dashboard fallback.
   *
   * This is intentionally limited to recent_invoices. It does NOT
   * claim to represent every outstanding invoice.
   */
  const classifiedInvoices = mergeUniqueInvoices(
    overdue,
    dueSoon
  );

  const recentOutstandingInvoices =
    data.recent_invoices.filter(
      (invoice) =>
        !invoice.is_fully_paid &&
        Number(invoice.balance_due) > 0
    );

  const invoicesToShow =
    classifiedInvoices.length > 0
      ? classifiedInvoices
      : recentOutstandingInvoices;

  /*
   * Display-only overdue total.
   *
   * This is not used for accounting, payment calculation, or
   * determining invoice state.
   *
   * The backend remains authoritative.
   */
  const overdueTotal = overdue.reduce(
    (sum, invoice) => sum + Number(invoice.balance_due),
    0
  );

  /*
   * Find the first due-soon invoice that actually has a due date.
   *
   * This avoids unsafe non-null assertions such as:
   *
   * nextDue.due_date!
   */
  const nextDue =
    dueSoon.find(
      (invoice) => invoice.due_date !== null
    ) ?? null;

  /*
   * Outstanding balance is the backend-provided amount still owed.
   */
  const hasOutstanding =
    Number(summary.total_outstanding) > 0;

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
          <p className="text-sm text-muted-foreground">
            {t("welcome")}
          </p>

          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>

          {isFetching && !isLoading && (
            <p className="text-xs text-muted-foreground">
              Updating dashboard...
            </p>
          )}
        </header>

        {/* ================================================================
            OVERDUE NOTICE
        ================================================================ */}

        {overdue.length > 0 && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />

              <div>
                <p className="text-sm font-medium">
                  {overdue.length === 1
                    ? "1 invoice is overdue"
                    : `${overdue.length} invoices are overdue`}
                </p>

                <p className="text-sm text-muted-foreground">
                  {money(overdueTotal)} remains outstanding on
                  overdue invoices.
                </p>
              </div>
            </div>

            <Button
              asChild
              size="sm"
              variant="destructive"
              className="shrink-0"
            >
              <Link href="/dashboard/taxpayer/invoices">
                View overdue
              </Link>
            </Button>
          </div>
        )}

        {/* ================================================================
            BALANCE + KEY FIGURES
        ================================================================ */}

        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  {t("balance.title")}
                </p>

                <p className="mt-1 break-words text-4xl font-semibold tracking-tight tabular-nums">
                  <span className="mr-2 text-xl font-medium text-muted-foreground">
                    {currency}
                  </span>

                  {formatAmount(
                    summary.total_outstanding
                  )}
                </p>

                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  {hasOutstanding ? (
                    nextDue ? (
                      <>
                        Next invoice due{" "}
                        {formatDate(nextDue.due_date!)}
                      </>
                    ) : overdue.length > 0 ? (
                      <>
                        <AlertCircle className="size-4 text-destructive" />
                        An invoice is overdue.
                      </>
                    ) : (
                      <>
                        Outstanding invoices require
                        payment.
                      </>
                    )
                  ) : (
                    <>
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      You&apos;re all paid up.
                    </>
                  )}
                </p>
              </div>

              {hasOutstanding && (
                <Button
                  asChild
                  size="lg"
                  className="w-full md:w-auto"
                >
                  <Link href="/citizen/dashboard/invoices">
                    {t("balance.payNow")}

                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              )}
            </div>

            {/* ============================================================
                SUMMARY STATS
            ============================================================ */}

            <dl className="grid grid-cols-3 divide-x border-t">
              <Stat
                label="Total paid"
                value={money(summary.total_paid)}
              />

              <Stat
                label="Unpaid invoices"
                value={String(
                  summary.outstanding_invoices
                )}
              />

              <Stat
                label="Settled"
                value={`${summary.paid_invoices} of ${summary.total_invoices}`}
              />
            </dl>
          </CardContent>
        </Card>

        {/* ================================================================
            INVOICES + PAYMENTS
        ================================================================ */}

        <div className="grid gap-6 lg:grid-cols-5">
          {/* ==============================================================
              INVOICES
          ============================================================== */}

          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">
                {classifiedInvoices.length > 0
                  ? "Invoices requiring attention"
                  : "Recent outstanding invoices"}
              </CardTitle>

              <Button
                asChild
                variant="ghost"
                size="sm"
              >
                <Link href="/citizen/dashboard/invoices">
                  {t("viewAll")}

                  <ChevronRight className="ml-1 size-4" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="pt-0">
              {invoicesToShow.length > 0 ? (
                <ul className="divide-y">
                  {invoicesToShow
                    .slice(0, 4)
                    .map((invoice) => (
                      <InvoiceRow
                        key={invoice.id}
                        invoice={invoice}
                        currency={currency}
                      />
                    ))}
                </ul>
              ) : (
                <Empty
                  title="No outstanding invoices"
                  description="New invoices will appear here when they are issued."
                />
              )}
            </CardContent>
          </Card>

          {/* ==============================================================
              RECENT PAYMENTS
          ============================================================== */}

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">
                Recent payments
              </CardTitle>

              <Button
                asChild
                variant="ghost"
                size="sm"
              >
                <Link href="/dashboard/taxpayer/payments">
                  {t("viewAll")}

                  <ChevronRight className="ml-1 size-4" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="pt-0">
              {data.recent_payments.length > 0 ? (
                <ul className="divide-y">
                  {data.recent_payments
                    .slice(0, 4)
                    .map((payment) => (
                      <li key={payment.id}>
                        <Link
                          href={`/dashboard/taxpayer/payments/${payment.id}`}
                          className="flex items-center justify-between gap-3 py-3 hover:opacity-80"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {payment.payment_number}
                            </p>

                            <p className="truncate text-xs text-muted-foreground">
                              {payment.invoice_number ??
                                "Payment"}
                              {" · "}
                              {payment.paid_at
                                ? formatDate(
                                    payment.paid_at
                                  )
                                : "Date unavailable"}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-medium tabular-nums">
                            {money(payment.amount)}
                          </p>
                        </Link>
                      </li>
                    ))}
                </ul>
              ) : (
                <Empty
                  title="No payments yet"
                  description="Your payment receipts will appear here."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
 * INVOICE MERGING
 * ====================================================================== */

/**
 * Combines backend invoice collections while removing duplicate
 * invoice IDs.
 *
 * Priority:
 *
 * 1. overdue invoices
 * 2. due-soon invoices
 */
function mergeUniqueInvoices(
  ...collections: TaxpayerDashboardInvoice[][]
): TaxpayerDashboardInvoice[] {
  const seen = new Set<string>();

  const result: TaxpayerDashboardInvoice[] = [];

  for (const collection of collections) {
    for (const invoice of collection) {
      if (seen.has(invoice.id)) {
        continue;
      }

      seen.add(invoice.id);
      result.push(invoice);
    }
  }

  return result;
}

/* ========================================================================
 * STAT
 * ====================================================================== */

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="px-4 py-4 sm:px-6">
      <dt className="text-xs text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 truncate text-sm font-semibold tabular-nums sm:text-base">
        {value}
      </dd>
    </div>
  );
}

/* ========================================================================
 * INVOICE ROW
 * ====================================================================== */

/**
 * Displays one taxpayer invoice.
 *
 * Important:
 *
 * The frontend does NOT determine whether the invoice is overdue.
 * Laravel already provides `is_overdue`.
 *
 * The frontend only presents that backend classification.
 */
function InvoiceRow({
  invoice,
  currency,
}: {
  invoice: TaxpayerDashboardInvoice;
  currency: string;
}) {
  return (
    <li>
      <Link
        href={`/citizen/dashboard/invoices/${invoice.id}`}
        className="flex items-center justify-between gap-3 py-3 hover:opacity-80"
      >
        {/* ==============================================================
            LEFT
        ============================================================== */}

        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Receipt className="size-4" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {invoice.invoice_number}
            </p>

            <p className="truncate text-xs text-muted-foreground">
              {formatInvoiceStatus(invoice)}
            </p>
          </div>
        </div>

        {/* ==============================================================
            RIGHT
        ============================================================== */}

        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums">
            {currency}{" "}
            {formatAmount(invoice.balance_due)}
          </p>

          <p
            className={
              invoice.is_overdue
                ? "text-xs font-medium text-destructive"
                : "text-xs text-muted-foreground"
            }
          >
            {invoice.is_overdue
              ? "Overdue"
              : invoice.due_date
                ? `Due ${formatDate(
                    invoice.due_date
                  )}`
                : "Due date unavailable"}

            {invoice.status === "PARTIALLY_PAID" &&
              " · Partly paid"}
          </p>
        </div>
      </Link>
    </li>
  );
}

/* ========================================================================
 * INVOICE STATUS
 * ====================================================================== */

/**
 * Converts internal backend status values into taxpayer-friendly
 * display labels.
 *
 * This does not change the underlying invoice status.
 */
function formatInvoiceStatus(
  invoice: TaxpayerDashboardInvoice
): string {
  if (invoice.is_overdue) {
    return "Overdue";
  }

  if (invoice.is_fully_paid) {
    return "Paid";
  }

  switch (invoice.status) {
    case "PARTIALLY_PAID":
      return "Partially paid";

    case "ISSUED":
      return "Issued";

    case "DRAFT":
      return "Draft";

    case "CANCELLED":
      return "Cancelled";

    case "PAID":
      return "Paid";

    case "OVERDUE":
      return "Overdue";

    default:
      return invoice.status;
  }
}

/* ========================================================================
 * EMPTY STATE
 * ====================================================================== */

function Empty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm font-medium">
        {title}
      </p>

      <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/* ========================================================================
 * LOADING STATE
 * ====================================================================== */

function TaxpayerDashboardSkeleton() {
  return (
    <div className="min-w-0">
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}

        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />

          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </div>

        {/* Balance card */}

        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />

            <div className="h-10 w-56 animate-pulse rounded bg-muted" />

            <div className="h-4 w-64 animate-pulse rounded bg-muted" />

            <div className="grid grid-cols-3 gap-4 border-t pt-4">
              <div className="h-12 animate-pulse rounded bg-muted" />

              <div className="h-12 animate-pulse rounded bg-muted" />

              <div className="h-12 animate-pulse rounded bg-muted" />
            </div>
          </CardContent>
        </Card>

        {/* Lower cards */}

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardContent className="space-y-4 p-6">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />

              <div className="h-14 animate-pulse rounded bg-muted" />

              <div className="h-14 animate-pulse rounded bg-muted" />

              <div className="h-14 animate-pulse rounded bg-muted" />

              <div className="h-14 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent className="space-y-4 p-6">
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />

              <div className="h-14 animate-pulse rounded bg-muted" />

              <div className="h-14 animate-pulse rounded bg-muted" />

              <div className="h-14 animate-pulse rounded bg-muted" />

              <div className="h-14 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
 * ERROR STATE
 * ====================================================================== */

function TaxpayerDashboardError({
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
              <AlertCircle className="size-6 text-destructive" />
            </div>

            <div>
              <h2 className="text-base font-semibold">
                Unable to load dashboard
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                We couldn&apos;t retrieve your dashboard
                information. Please try again.
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
 * DATE
 * ====================================================================== */

/**
 * Converts:
 *
 * 2026-10-15
 *
 * to local midnight rather than UTC midnight.
 *
 * This prevents the common one-day date shift when displaying
 * date-only values returned by Laravel.
 */
function toDate(value: string): Date {
  return new Date(
    value.length === 10
      ? `${value}T00:00:00`
      : value
  );
}

/* ========================================================================
 * DATE FORMAT
 * ====================================================================== */

function formatDate(value: string): string {
  const date = toDate(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/* ========================================================================
 * MONEY
 * ====================================================================== */

function formatAmount(
  value: string | number
): string {
  const amount =
    typeof value === "number"
      ? value
      : Number(value);

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(
    Number.isFinite(amount) ? amount : 0
  );
}