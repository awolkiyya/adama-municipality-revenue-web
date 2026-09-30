"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  Search,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  useTaxpayerPayments,
} from "@/hooks/taxpayer/use-taxpayer-payments";
import { Payment } from "@/types/taxpayer/payment";



/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

type FilterKey =
  | "ALL"
  | "SUCCESS"
  | "PENDING"
  | "PROCESSING"
  | "FAILED"
  | "CANCELLED";

const FILTERS: {
  key: FilterKey;
  label: string;
}[] = [
  {
    key: "ALL",
    label: "All",
  },
  {
    key: "SUCCESS",
    label: "Successful",
  },
  {
    key: "PENDING",
    label: "Pending",
  },
  {
    key: "PROCESSING",
    label: "Processing",
  },
  {
    key: "FAILED",
    label: "Failed",
  },
  {
    key: "CANCELLED",
    label: "Cancelled",
  },
];

const METHOD_LABELS: Record<string, string> = {
  CHAPA: "Chapa",
  MOBILE_MONEY: "Mobile money",
  BANK_TRANSFER: "Bank transfer",
  CARD: "Card",
};

const PROVIDER_LABELS: Record<string, string> = {
  CHAPA: "Chapa",
  TELEBIRR: "Telebirr",
  CBE: "Commercial Bank of Ethiopia",
  CBE_BIRR: "CBE Birr",
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    className: string;
    icon: typeof CheckCircle2;
  }
> = {
  SUCCESS: {
    label: "Successful",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },

  PENDING: {
    label: "Pending",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    icon: Clock3,
  },

  PROCESSING: {
    label: "Processing",
    className:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    icon: Clock3,
  },

  FAILED: {
    label: "Failed",
    className:
      "bg-destructive/10 text-destructive",
    icon: XCircle,
  },

  CANCELLED: {
    label: "Cancelled",
    className:
      "bg-muted text-muted-foreground",
    icon: XCircle,
  },
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function TaxpayerPaymentsPage() {
  const [filter, setFilter] =
    useState<FilterKey>("ALL");

  const [query, setQuery] =
    useState("");

  /*
   * The backend currently supports a maximum of 100 records per page.
   *
   * This keeps the current page simple while still using real API data.
   * If payment history becomes large, server-side pagination/search should
   * be introduced instead of increasing this value.
   */
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useTaxpayerPayments({
    page: 1,
    per_page: 100,
  });

  const payments =
    data?.data ?? [];

  /* ---------------------------------------------------------------------- */
  /* Derived data                                                           */
  /* ---------------------------------------------------------------------- */

  const sortedPayments = useMemo(() => {
    return [...payments].sort(
      (a, b) =>
        timestamp(b.payment_date) -
        timestamp(a.payment_date),
    );
  }, [payments]);

  const currency =
    payments[0]?.currency ?? "ETB";

  const summary = useMemo(() => {
    const successful =
      payments.filter(
        (payment) =>
          payment.status === "SUCCESS",
      );

    const pending =
      payments.filter(
        (payment) =>
          payment.status === "PENDING" ||
          payment.status === "PROCESSING",
      );

    const failed =
      payments.filter(
        (payment) =>
          payment.status === "FAILED",
      );

    const totalPaid =
      successful.reduce(
        (total, payment) =>
          total +
          toNumber(payment.amount),
        0,
      );

    const pendingAmount =
      pending.reduce(
        (total, payment) =>
          total +
          toNumber(payment.amount),
        0,
      );

    const now =
      new Date();

    const paidThisMonth =
      successful
        .filter((payment) => {
          if (!payment.payment_date) {
            return false;
          }

          const date =
            new Date(
              payment.payment_date,
            );

          return (
            date.getFullYear() ===
              now.getFullYear() &&
            date.getMonth() ===
              now.getMonth()
          );
        })
        .reduce(
          (total, payment) =>
            total +
            toNumber(
              payment.amount,
            ),
          0,
        );

    return {
      totalPaid,
      paidThisMonth,
      pendingAmount,
      pendingCount:
        pending.length,
      failedCount:
        failed.length,
    };
  }, [payments]);

  const counts = useMemo(() => {
    return {
      ALL: payments.length,

      SUCCESS: payments.filter(
        (payment) =>
          payment.status ===
          "SUCCESS",
      ).length,

      PENDING: payments.filter(
        (payment) =>
          payment.status ===
          "PENDING",
      ).length,

      PROCESSING:
        payments.filter(
          (payment) =>
            payment.status ===
            "PROCESSING",
        ).length,

      FAILED: payments.filter(
        (payment) =>
          payment.status ===
          "FAILED",
      ).length,

      CANCELLED:
        payments.filter(
          (payment) =>
            payment.status ===
            "CANCELLED",
        ).length,
    };
  }, [payments]);

  /*
   * Show failed payments that still appear relevant.
   *
   * If a later payment attempt for the same invoice is PENDING,
   * PROCESSING, SUCCESS, or CANCELLED, the previous failed attempt
   * does not need to remain in the main attention banner.
   */
  const needsAttention = useMemo(() => {
    return sortedPayments.filter(
      (failedPayment) => {
        if (
          failedPayment.status !==
          "FAILED"
        ) {
          return false;
        }

        const failedTimestamp =
          timestamp(
            failedPayment.payment_date,
          );

        const hasLaterAttempt =
          payments.some(
            (payment) => {
              if (
                payment.id ===
                failedPayment.id
              ) {
                return false;
              }

              if (
                payment.invoice_id !==
                failedPayment.invoice_id
              ) {
                return false;
              }

              const paymentTimestamp =
                timestamp(
                  payment.payment_date,
                );

              return (
                paymentTimestamp >
                failedTimestamp
              );
            },
          );

        return !hasLaterAttempt;
      },
    );
  }, [
    payments,
    sortedPayments,
  ]);

  const filteredPayments =
    useMemo(() => {
      const normalizedQuery =
        query
          .trim()
          .toLowerCase();

      return sortedPayments.filter(
        (payment) => {
          const matchesStatus =
            filter === "ALL" ||
            payment.status ===
              filter;

          if (!matchesStatus) {
            return false;
          }

          if (!normalizedQuery) {
            return true;
          }

          return [
            payment.payment_number,
            payment.invoice_number,
            payment.transaction_reference,
            payment.provider_reference,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(
                  normalizedQuery,
                ),
            );
        },
      );
    }, [
      sortedPayments,
      filter,
      query,
    ]);

  const groupedPayments =
    useMemo(() => {
      const groups = new Map<
        string,
        Payment[]
      >();

      filteredPayments.forEach(
        (payment) => {
          const key =
            monthKey(
              payment.payment_date,
            );

          const existing =
            groups.get(key);

          if (existing) {
            existing.push(
              payment,
            );
          } else {
            groups.set(
              key,
              [payment],
            );
          }
        },
      );

      return Array.from(
        groups.entries(),
      ).map(
        ([key, items]) => ({
          key,
          items,
        }),
      );
    }, [filteredPayments]);

  const monthTotals =
    useMemo(() => {
      const totals =
        new Map<
          string,
          number
        >();

      filteredPayments.forEach(
        (payment) => {
          if (
            payment.status !==
            "SUCCESS"
          ) {
            return;
          }

          const key =
            monthKey(
              payment.payment_date,
            );

          totals.set(
            key,
            (totals.get(key) ?? 0) +
              toNumber(
                payment.amount,
              ),
          );
        },
      );

      return totals;
    }, [filteredPayments]);

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                */
  /* ---------------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="min-w-0">
        <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
          <PageHeader />

          <SummarySkeleton />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <div className="h-9 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
              <div className="h-9 w-20 animate-pulse rounded-full bg-muted" />
            </div>

            <div className="h-10 w-full animate-pulse rounded-md bg-muted sm:w-80" />
          </div>

          <Card className="overflow-hidden">
            <PaymentTableSkeleton />
          </Card>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Error                                                                  */
  /* ---------------------------------------------------------------------- */

  if (isError) {
    return (
      <div className="min-w-0">
        <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
          <PageHeader />

          <Card>
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="size-5 text-destructive" />
              </div>

              <h2 className="mt-4 text-base font-semibold">
                We couldn't load your payments
              </h2>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "Something went wrong while retrieving your payment history."}
              </p>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-5"
                onClick={() =>
                  refetch()
                }
              >
                Try again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Page                                                                    */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="min-w-0">
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <PageHeader />

        {/* ---------------------------------------------------------------- */}
        {/* Attention                                                         */}
        {/* ---------------------------------------------------------------- */}

        {needsAttention.length >
          0 && (
          <AttentionBanner
            payment={
              needsAttention.length ===
              1
                ? needsAttention[0]
                : null
            }
            count={
              needsAttention.length
            }
            onReview={() => {
              setFilter(
                "FAILED",
              );
              setQuery("");
            }}
          />
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Summary                                                           */}
        {/* ---------------------------------------------------------------- */}

        <Card>
          <dl className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <SummaryStat
              label="Total paid"
              value={`${currency} ${formatAmount(
                summary.totalPaid,
              )}`}
            />

            <SummaryStat
              label="Paid this month"
              value={`${currency} ${formatAmount(
                summary.paidThisMonth,
              )}`}
            />

            <SummaryStat
              label="Awaiting confirmation"
              value={
                summary.pendingCount >
                0
                  ? `${currency} ${formatAmount(
                      summary.pendingAmount,
                    )}`
                  : "None"
              }
              secondary={
                summary.pendingCount >
                0
                  ? `${summary.pendingCount} payment${
                      summary.pendingCount ===
                      1
                        ? ""
                        : "s"
                    }`
                  : undefined
              }
            />
          </dl>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* Filters                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filter payments"
          >
            {FILTERS.map(
              (item) => {
                const active =
                  filter ===
                  item.key;

                return (
                  <button
                    key={
                      item.key
                    }
                    type="button"
                    aria-pressed={
                      active
                    }
                    onClick={() =>
                      setFilter(
                        item.key,
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {
                      item.label
                    }

                    <span
                      className={cn(
                        "ml-1.5 tabular-nums",
                        active
                          ? "opacity-80"
                          : "opacity-60",
                      )}
                    >
                      {
                        counts[
                          item.key
                        ]
                      }
                    </span>
                  </button>
                );
              },
            )}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder="Search payment or invoice"
              aria-label="Search payments"
              className="pl-9"
            />
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Results                                                           */}
        {/* ---------------------------------------------------------------- */}

        <Card className="overflow-hidden">
          {filteredPayments.length ===
          0 ? (
            <EmptyState
              hasPayments={
                payments.length > 0
              }
              hasFilters={
                filter !== "ALL" ||
                Boolean(
                  query.trim(),
                )
              }
              onClear={() => {
                setFilter(
                  "ALL",
                );
                setQuery("");
              }}
            />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block">
                <PaymentTable
                  groups={
                    groupedPayments
                  }
                  monthTotals={
                    monthTotals
                  }
                  currency={
                    currency
                  }
                />
              </div>

              {/* Mobile */}
              <div className="md:hidden">
                <PaymentMobileList
                  groups={
                    groupedPayments
                  }
                  monthTotals={
                    monthTotals
                  }
                  currency={
                    currency
                  }
                />
              </div>

              <div className="border-t px-4 py-3 text-xs text-muted-foreground sm:px-6">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {
                    filteredPayments.length
                  }
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {
                    payments.length
                  }
                </span>{" "}
                payments
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page Header                                                                */
/* -------------------------------------------------------------------------- */

function PageHeader() {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">
        Payments
      </h1>

      <p className="text-sm text-muted-foreground">
        View your payment history and
        receipts.
      </p>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Attention Banner                                                           */
/* -------------------------------------------------------------------------- */

function AttentionBanner({
  payment,
  count,
  onReview,
}: {
  payment: Payment | null;
  count: number;
  onReview: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />

        <div className="min-w-0">
          <p className="text-sm font-medium">
            {count === 1
              ? `Payment for ${
                  payment?.invoice_number ??
                  "an invoice"
                } failed`
              : `${count} payments need attention`}
          </p>

          <p className="mt-0.5 text-sm text-muted-foreground">
            {count === 1
              ? payment?.failure_reason ??
                "The payment could not be completed."
              : "Review your failed payments and try again where necessary."}
          </p>
        </div>
      </div>

      {count === 1 &&
      payment ? (
        <Button
          asChild
          size="sm"
          variant="destructive"
          className="shrink-0"
        >
          <Link
            href={`/citizen/dashboard/invoices/${payment.invoice_id}/pay`}
          >
            Try again
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="shrink-0"
          onClick={
            onReview
          }
        >
          Review failed
          <ArrowRight className="ml-2 size-4" />
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary                                                                    */
/* -------------------------------------------------------------------------- */

function SummaryStat({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary?: string;
}) {
  return (
    <div className="px-4 py-4 sm:px-6">
      <dt className="text-xs text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 flex items-baseline gap-2">
        <span className="truncate text-base font-semibold tabular-nums">
          {value}
        </span>

        {secondary && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {secondary}
          </span>
        )}
      </dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Desktop Table                                                              */
/* -------------------------------------------------------------------------- */

function PaymentTable({
  groups,
  monthTotals,
  currency,
}: {
  groups: {
    key: string;
    items: Payment[];
  }[];
  monthTotals: Map<
    string,
    number
  >;
  currency: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="px-4 py-3 font-medium sm:px-6">
              Payment
            </th>

            <th className="px-3 py-3 font-medium">
              Date
            </th>

            <th className="px-3 py-3 font-medium">
              Method
            </th>

            <th className="px-3 py-3 text-right font-medium">
              Amount
            </th>

            <th className="px-3 py-3 font-medium">
              Status
            </th>

            <th className="py-3 pl-3 pr-4 text-right font-medium sm:pr-6">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {groups.map(
            (group) => (
              <PaymentGroup
                key={
                  group.key
                }
                group={
                  group
                }
                total={
                  monthTotals.get(
                    group.key,
                  )
                }
                currency={
                  currency
                }
              />
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Payment Group                                                              */
/* -------------------------------------------------------------------------- */

function PaymentGroup({
  group,
  total,
  currency,
}: {
  group: {
    key: string;
    items: Payment[];
  };
  total?: number;
  currency: string;
}) {
  return (
    <>
      <tr className="border-y bg-muted/20">
        <td
          colSpan={6}
          className="px-4 py-2 sm:px-6"
        >
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="font-medium">
              {monthLabel(
                group.key,
              )}
            </span>

            {total !==
              undefined && (
              <span className="tabular-nums text-muted-foreground">
                {currency}{" "}
                {formatAmount(
                  total,
                )}{" "}
                paid
              </span>
            )}
          </div>
        </td>
      </tr>

      {group.items.map(
        (payment) => (
          <PaymentTableRow
            key={
              payment.id
            }
            payment={
              payment
            }
          />
        ),
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Desktop Row                                                                */
/* -------------------------------------------------------------------------- */

function PaymentTableRow({
  payment,
}: {
  payment: Payment;
}) {
  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/20">
      <td className="px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="font-medium">
            {
              payment.payment_number
            }
          </p>

          <p className="mt-0.5 text-xs text-muted-foreground">
            {payment.invoice_number
              ? `Invoice ${payment.invoice_number}`
              : "Invoice unavailable"}
          </p>
        </div>
      </td>

      <td className="whitespace-nowrap px-3 py-4 text-muted-foreground">
        {formatDate(
          payment.payment_date,
        )}
      </td>

      <td className="px-3 py-4">
        <p>
          {label(
            METHOD_LABELS,
            payment.payment_method,
          )}
        </p>

        {payment.payment_provider && (
          <p className="mt-0.5 max-w-40 truncate text-xs text-muted-foreground">
            {label(
              PROVIDER_LABELS,
              payment.payment_provider,
            )}
          </p>
        )}
      </td>

      <td
        className={cn(
          "whitespace-nowrap px-3 py-4 text-right font-semibold tabular-nums",
          payment.status !==
            "SUCCESS" &&
            "text-muted-foreground",
        )}
      >
        {payment.currency}{" "}
        {formatAmount(
          payment.amount,
        )}
      </td>

      <td className="px-3 py-4">
        <StatusPill
          status={
            payment.status
          }
        />
      </td>

      <td className="py-4 pl-3 pr-4 text-right sm:pr-6">
        <Button
          asChild
          variant="ghost"
          size="sm"
        >
          <Link
            href={`/citizen/dashboard/payments/${payment.id}`}
          >
            View
            <ArrowRight className="ml-1.5 size-3.5" />
          </Link>
        </Button>
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile List                                                                */
/* -------------------------------------------------------------------------- */

function PaymentMobileList({
  groups,
  monthTotals,
  currency,
}: {
  groups: {
    key: string;
    items: Payment[];
  }[];
  monthTotals: Map<
    string,
    number
  >;
  currency: string;
}) {
  return (
    <div>
      {groups.map(
        (group) => (
          <section
            key={
              group.key
            }
          >
            <div className="flex items-center justify-between gap-4 border-b bg-muted/20 px-4 py-2">
              <span className="text-xs font-medium">
                {monthLabel(
                  group.key,
                )}
              </span>

              {monthTotals.has(
                group.key,
              ) && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {currency}{" "}
                  {formatAmount(
                    monthTotals.get(
                      group.key,
                    )!,
                  )}{" "}
                  paid
                </span>
              )}
            </div>

            <ul className="divide-y">
              {group.items.map(
                (
                  payment,
                ) => (
                  <PaymentMobileCard
                    key={
                      payment.id
                    }
                    payment={
                      payment
                    }
                  />
                ),
              )}
            </ul>
          </section>
        ),
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile Card                                                                */
/* -------------------------------------------------------------------------- */

function PaymentMobileCard({
  payment,
}: {
  payment: Payment;
}) {
  return (
    <li className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {
              payment.payment_number
            }
          </p>

          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {payment.invoice_number
              ? `Invoice ${payment.invoice_number}`
              : "Invoice unavailable"}
          </p>
        </div>

        <StatusPill
          status={
            payment.status
          }
        />
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p
            className={cn(
              "text-base font-semibold tabular-nums",
              payment.status !==
                "SUCCESS" &&
                "text-muted-foreground",
            )}
          >
            {
              payment.currency
            }{" "}
            {formatAmount(
              payment.amount,
            )}
          </p>

          <p className="mt-1 truncate text-xs text-muted-foreground">
            {formatDate(
              payment.payment_date,
            )}{" "}
            ·{" "}
            {label(
              METHOD_LABELS,
              payment.payment_method,
            )}
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="shrink-0"
        >
          <Link
            href={`/citizen/dashboard/payments/${payment.id}`}
          >
            View
            <ArrowRight className="ml-1.5 size-3.5" />
          </Link>
        </Button>
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

function StatusPill({
  status,
}: {
  status: PaymentStatus | string;
}) {
  const config =
    STATUS_CONFIG[
      status
    ] ?? {
      label: formatStatusLabel(
        status,
      ),
      className:
        "bg-muted text-muted-foreground",
      icon: Clock3,
    };

  const Icon =
    config.icon;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.className,
      )}
    >
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty State                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState({
  hasPayments,
  hasFilters,
  onClear,
}: {
  hasPayments: boolean;
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="flex size-11 items-center justify-center rounded-lg bg-muted">
        <CreditCard className="size-5 text-muted-foreground" />
      </div>

      <h2 className="mt-4 text-sm font-semibold">
        {hasPayments
          ? "No payments found"
          : "No payments yet"}
      </h2>

      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        {hasPayments
          ? "Try a different filter or search term."
          : "When you make a payment, your transaction history will appear here."}
      </p>

      {hasPayments &&
        hasFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-5"
            onClick={
              onClear
            }
          >
            Clear filters
          </Button>
        )}

      {!hasPayments && (
        <Button
          asChild
          size="sm"
          className="mt-5"
        >
          <Link href="/citizen/dashboard/invoices">
            View invoices
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading                                                                    */
/* -------------------------------------------------------------------------- */

function SummarySkeleton() {
  return (
    <Card>
      <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {Array.from({
          length: 3,
        }).map((_, index) => (
          <div
            key={index}
            className="px-4 py-4 sm:px-6"
          >
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />

            <div className="mt-2 h-5 w-32 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function PaymentTableSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({
        length: 7,
      }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 px-4 py-5 sm:px-6"
        >
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />

            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
          </div>

          <div className="hidden h-4 w-24 animate-pulse rounded bg-muted md:block" />

          <div className="hidden h-4 w-28 animate-pulse rounded bg-muted md:block" />

          <div className="h-4 w-20 animate-pulse rounded bg-muted" />

          <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />

          <div className="hidden h-8 w-16 animate-pulse rounded-md bg-muted md:block" />
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toNumber(
  value:
    | string
    | number
    | null
    | undefined,
): number {
  const number =
    typeof value ===
    "number"
      ? value
      : Number(value ?? 0);

  return Number.isFinite(
    number,
  )
    ? number
    : 0;
}

function formatAmount(
  value:
    | string
    | number,
): string {
  const amount =
    toNumber(value);

  return new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(amount);
}

function timestamp(
  value: string | null,
): number {
  if (!value) {
    return 0;
  }

  const valueTimestamp =
    new Date(
      value,
    ).getTime();

  return Number.isFinite(
    valueTimestamp,
  )
    ? valueTimestamp
    : 0;
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
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
    },
  ).format(date);
}

function monthKey(
  value: string | null,
): string {
  if (!value) {
    return "unknown";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "unknown";
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function monthLabel(
  key: string,
): string {
  if (key === "unknown") {
    return "Date unavailable";
  }

  const [
    year,
    month,
  ] = key
    .split("-")
    .map(Number);

  if (
    !year ||
    !month ||
    month < 1 ||
    month > 12
  ) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "long",
      year: "numeric",
    },
  ).format(
    new Date(
      year,
      month - 1,
      1,
    ),
  );
}

function label(
  map: Record<
    string,
    string
  >,
  key: string | null,
): string {
  if (!key) {
    return "—";
  }

  if (map[key]) {
    return map[key];
  }

  return formatStatusLabel(
    key,
  );
}

function formatStatusLabel(
  value: string,
): string {
  return value
    .toLowerCase()
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}