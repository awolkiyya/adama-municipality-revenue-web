"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  Landmark,
  Loader2,
  RefreshCw,
  Smartphone,
  WalletCards,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { Payment } from "@/types/payment/payment";
import { useAgentPaymentDashboard } from "@/hooks/agent/agent-payment.hook";

/* =========================================================
   CONFIGURATION
   ========================================================= */

const METHOD_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  CASH: { label: "Cash", icon: Banknote },
  BANK_TRANSFER: { label: "Bank transfer", icon: Landmark },
  ONLINE: { label: "Online", icon: Smartphone },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  COMPLETED: {
    label: "Completed",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  PENDING: {
    label: "Pending",
    className:
      "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300",
    icon: Clock3,
  },
  PROCESSING: {
    label: "Processing",
    className:
      "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-300",
    icon: RefreshCw,
  },
  FAILED: {
    label: "Failed",
    className:
      "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-300",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground ring-border",
    icon: XCircle,
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-muted text-muted-foreground ring-border",
    icon: Clock3,
  },
  REVERSED: {
    label: "Reversed",
    className:
      "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-950/40 dark:text-orange-300",
    icon: RefreshCw,
  },
};

/* =========================================================
   HELPERS
   ========================================================= */

function formatCurrency(
  amount: number | string | null | undefined,
  currency = "ETB",
): string {
  const numeric = Number(amount ?? 0);

  return `${currency} ${new Intl.NumberFormat("en-ET", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numeric) ? numeric : 0)}`;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-ET", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function humanize(value: string): string {
  return value ? value.replaceAll("_", " ") : "Unknown";
}

function getPaymentMethod(method?: string | null) {
  const key = (method ?? "").toUpperCase();
  return (
    METHOD_CONFIG[key] ?? { label: humanize(key), icon: CreditCard }
  );
}

function getPaymentStatus(status?: string | null) {
  const key = (status ?? "").toUpperCase();
  return (
    STATUS_CONFIG[key] ?? {
      label: humanize(key),
      className: "bg-muted text-muted-foreground ring-border",
      icon: Clock3,
    }
  );
}

function getTaxpayerName(payment: Payment): string {
  return (
    payment.citizen?.full_name ||
    payment.citizen?.name ||
    payment.payer?.name ||
    "Unknown taxpayer"
  );
}

function getInvoiceNumber(payment: Payment): string {
  return payment.invoice?.invoice_number || "No invoice";
}

function getReceiptNumber(payment: Payment): string {
  return (
    payment.receipt?.receipt_number || payment.payment_number || "Payment"
  );
}

/* =========================================================
   PAGE
   ========================================================= */

export default function AgentDashboardPage() {
  const query = useAgentPaymentDashboard(5);

  const dashboard = query.data;
  const overall = dashboard?.overall;
  const today = dashboard?.today;
  const recentPayments = dashboard?.recent_payments ?? [];

  const isLoading = query.isPending && !query.data;
  const isError = query.isError && !query.data;
  const pendingToday = today?.pending_count ?? 0;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* ---------- Header ---------- */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            Agent dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your payment activity and latest transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                query.isFetching ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>

          <Button asChild>
            <Link href="/agent/dashboard/payments/process">
              Process payment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* ---------- Error ---------- */}
      {isError && (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="font-medium">Couldn&apos;t load the dashboard</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {query.error?.message ||
                    "Something went wrong while loading your payments. Try again."}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ---------- Today ---------- */}
      <StatsSection
        title="Today"
        meta={dashboard?.date}
        loading={isLoading}
        stats={[
          {
            label: "Collected",
            value: formatCurrency(
              today?.total_collected,
              today?.currency ?? "ETB",
            ),
            hint: "Completed payments",
            icon: Banknote,
          },
          {
            label: "Transactions",
            value: String(today?.total_payments ?? 0),
            hint: "All statuses",
            icon: CreditCard,
          },
          {
            label: "Pending",
            value: String(pendingToday),
            hint:
              pendingToday > 0 ? "View pending payments" : "Nothing waiting",
            icon: Clock3,
            attention: pendingToday > 0,
            href:
              pendingToday > 0
                ? "/agent/dashboard/payments?status=PENDING"
                : undefined,
          },
          {
            label: "Completed",
            value: String(today?.completed_count ?? 0),
            hint: "Successfully paid",
            icon: CheckCircle2,
          },
        ]}
      />

      {/* ---------- Overall ---------- */}
      <StatsSection
        title="All time"
        loading={isLoading}
        action={
          <Link
            href="/agent/dashboard/payments"
            className="text-sm font-medium text-primary hover:underline"
          >
            Payment history
          </Link>
        }
        stats={[
          {
            label: "Total payments",
            value: String(overall?.total_payments ?? 0),
            hint: "Processed by you",
            icon: WalletCards,
          },
          {
            label: "Total collected",
            value: formatCurrency(
              overall?.total_collected,
              overall?.currency ?? "ETB",
            ),
            hint: "Completed payments",
            icon: Banknote,
          },
          {
            label: "Processing",
            value: String(overall?.processing_count ?? 0),
            hint: "In progress",
            icon: RefreshCw,
          },
          {
            label: "Failed",
            value: String(overall?.failed_count ?? 0),
            hint: "Need follow-up",
            icon: XCircle,
          },
        ]}
      />

      {/* ---------- Recent payments ---------- */}
      <section aria-label="Recent payments">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">Recent payments</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Your latest transactions.
              </p>
            </div>

            <Button asChild variant="ghost" size="sm">
              <Link href="/agent/dashboard/payments">
                View all
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <EmptyState
              icon={<Loader2 className="h-6 w-6 animate-spin" />}
              title="Loading payments"
            />
          ) : isError ? (
            <EmptyState
              icon={<XCircle className="h-6 w-6" />}
              title="Payments unavailable"
              description="Use Refresh to try loading them again."
            />
          ) : recentPayments.length === 0 ? (
            <EmptyState
              icon={<WalletCards className="h-6 w-6" />}
              title="No payments yet"
              description="Payments you process will appear here."
              action={
                <Button asChild size="sm">
                  <Link href="/agent/dashboard/payments/process">
                    Process payment
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                    <th className="px-5 py-3 text-left font-medium">Payment</th>
                    <th className="px-5 py-3 text-left font-medium">
                      Taxpayer
                    </th>
                    <th className="px-5 py-3 text-left font-medium">Method</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recentPayments.map((payment) => {
                    const method = getPaymentMethod(payment.payment_method);
                    const status = getPaymentStatus(payment.status);
                    const MethodIcon = method.icon;
                    const StatusIcon = status.icon;

                    return (
                      <tr
                        key={payment.id}
                        className="border-b transition-colors last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-5 py-4">
                          <Link
                            href={`/agent/dashboard/payments/${payment.id}`}
                            className="group inline-block"
                          >
                            <p className="font-medium group-hover:text-primary">
                              {getReceiptNumber(payment)}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {getInvoiceNumber(payment)}
                            </p>
                          </Link>
                        </td>

                        <td className="px-5 py-4">
                          <div className="max-w-52">
                            <p className="truncate font-medium">
                              {getTaxpayerName(payment)}
                            </p>
                            {payment.payer?.phone && (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {payment.payer.phone}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MethodIcon className="h-4 w-4 shrink-0" />
                            <span>{method.label}</span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right font-medium tabular-nums">
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${status.className}`}
                          >
                            <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                            {status.label}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-muted-foreground">
                          {formatDate(payment.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {query.isFetching && dashboard && (
            <div className="flex items-center justify-center gap-2 border-t px-5 py-2.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating…
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

/* =========================================================
   STATS SECTION
   One card, four cells separated by dividers.
   ========================================================= */

type Stat = {
  label: string;
  value: string;
  hint: string;
  icon: React.ElementType;
  href?: string;
  attention?: boolean;
};

function StatsSection({
  title,
  meta,
  action,
  stats,
  loading,
}: {
  title: string;
  meta?: string | null;
  action?: React.ReactNode;
  stats: Stat[];
  loading: boolean;
}) {
  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold">{title}</h2>
          {meta && (
            <span className="text-xs text-muted-foreground">{meta}</span>
          )}
        </div>
        {action}
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 xl:divide-x">
          {stats.map((stat, index) => (
            <StatCell
              key={stat.label}
              stat={stat}
              loading={loading}
              className={
                // Horizontal divider between rows on the 2-column layout
                index >= 2 ? "sm:border-t xl:border-t-0" : ""
              }
            />
          ))}
        </div>
      </Card>
    </section>
  );
}

function StatCell({
  stat,
  loading,
  className = "",
}: {
  stat: Stat;
  loading: boolean;
  className?: string;
}) {
  const { icon: Icon, label, value, hint, href, attention } = stat;

  const body = (
    <div
      className={`flex h-full items-start justify-between gap-4 p-5 transition-colors ${
        href ? "hover:bg-muted/30" : ""
      } ${className}`}
    >
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>

        <div className="mt-1.5 flex min-h-8 items-center">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <p className="break-words text-2xl font-semibold tracking-tight tabular-nums">
              {value}
            </p>
          )}
        </div>

        <p
          className={`mt-1 flex items-center text-xs ${
            href ? "font-medium text-primary" : "text-muted-foreground"
          }`}
        >
          {hint}
          {href && <ArrowRight className="ml-1 h-3 w-3" />}
        </p>
      </div>

      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          attention ? "bg-amber-50 dark:bg-amber-950/40" : "bg-muted"
        }`}
      >
        <Icon
          className={`h-4 w-4 ${
            attention
              ? "text-amber-600 dark:text-amber-300"
              : "text-muted-foreground"
          }`}
        />
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

/* =========================================================
   EMPTY STATE
   ========================================================= */

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="rounded-xl bg-muted p-3 text-muted-foreground">
        {icon}
      </div>

      <div>
        <h3 className="font-medium">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {action}
    </div>
  );
}