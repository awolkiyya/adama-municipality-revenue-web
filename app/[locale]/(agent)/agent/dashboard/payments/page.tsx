"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Landmark,
  Loader2,
  RefreshCw,
  Search,
  Smartphone,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import type { Payment } from "@/types/payment/payment";
import { useAgentPayments } from "@/hooks/agent/agent-payment.hook";

/* =========================================================
   CONFIGURATION
   ========================================================= */

const PAGE_SIZE = 20;

const STATUS_TABS = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REVERSED", label: "Reversed" },
] as const;

type StatusFilter = (typeof STATUS_TABS)[number]["value"];

const METHOD_OPTIONS = [
  { value: "ALL", label: "All methods" },
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "ONLINE", label: "Online" },
] as const;

type MethodFilter = (typeof METHOD_OPTIONS)[number]["value"];

const STATUS_STYLES: Record<
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

const METHOD_STYLES: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  CASH: { label: "Cash", icon: Banknote },
  BANK_TRANSFER: { label: "Bank transfer", icon: Landmark },
  ONLINE: { label: "Online", icon: Smartphone },
};

/* =========================================================
   HELPERS
   ========================================================= */

function humanize(value: string): string {
  return value ? value.replaceAll("_", " ") : "Unknown";
}

function formatAmount(amount: number | string | null | undefined): string {
  const numeric = Number(amount ?? 0);

  return new Intl.NumberFormat("en-ET", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-ET", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatus(payment: Payment): string {
  return String(payment.status ?? "").toUpperCase();
}

function getMethod(payment: Payment): string {
  return String(payment.payment_method ?? "").toUpperCase();
}

function getPaymentNumber(payment: Payment): string {
  return (
    payment.receipt?.receipt_number ||
    payment.payment_number ||
    payment.transaction_reference ||
    payment.id
  );
}

function getInvoiceNumber(payment: Payment): string {
  return payment.invoice?.invoice_number || "No invoice";
}

function getTaxpayerName(payment: Payment): string {
  const citizen = payment.citizen ?? payment.invoice?.citizen;

  return (
    citizen?.full_name ||
    citizen?.name ||
    payment.payer?.name ||
    "Unknown taxpayer"
  );
}

function getTaxpayerId(payment: Payment): string | null {
  const citizen = (payment.citizen ?? payment.invoice?.citizen) as unknown as
    | { citizen_uid?: string | null; taxpayer_number?: string | null }
    | undefined;

  return citizen?.citizen_uid || citizen?.taxpayer_number || null;
}

/** Second line under the method: provider, bank reference, or nothing. */
function getMethodDetail(payment: Payment): string | null {
  const method = getMethod(payment);

  if (method === "ONLINE" && payment.payment_provider) {
    return humanize(String(payment.payment_provider));
  }

  if (method === "BANK_TRANSFER") {
    const reference =
      payment.provider_reference || payment.transaction_reference;
    return reference ? `Ref ${reference}` : null;
  }

  return null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong while loading payments. Try again.";
}

function isStatusFilter(value: string | null): value is StatusFilter {
  return STATUS_TABS.some((tab) => tab.value === value);
}

/* =========================================================
   PAGE (Suspense wrapper is required for useSearchParams)
   ========================================================= */

export default function PaymentsPage() {
  return (
    <Suspense fallback={null}>
      <PaymentsContent />
    </Suspense>
  );
}

function PaymentsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The dashboard links here with ?status=PENDING, so start from the URL.
  const urlStatus = searchParams.get("status")?.toUpperCase() ?? null;
  const initialStatus: StatusFilter = isStatusFilter(urlStatus)
    ? urlStatus
    : "ALL";

  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [method, setMethod] = useState<MethodFilter>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Search as you type, without calling the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const changeStatus = (next: StatusFilter) => {
    setStatus(next);
    setPage(1);

    const params = new URLSearchParams(searchParams.toString());
    if (next === "ALL") params.delete("status");
    else params.set("status", next);

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  const changeMethod = (next: MethodFilter) => {
    setMethod(next);
    setPage(1);
  };

  const filters = useMemo(
    () => ({
      page,
      per_page: PAGE_SIZE,
      search: search || undefined,
      status: status === "ALL" ? undefined : status,
      payment_method: method === "ALL" ? undefined : method,
    }),
    [page, search, status, method],
  );

  const query = useAgentPayments(filters);

  const payments = query.data?.items ?? [];
  const total = query.data?.pagination?.total ?? payments.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const isLoading = query.isLoading;
  const isError = query.isError && !isLoading;

  const hasFilters = status !== "ALL" || method !== "ALL" || !!search;

  const clearAll = () => {
    setSearchInput("");
    setSearch("");
    setMethod("ALL");
    changeStatus("ALL");
  };

  // Totals for the rows currently loaded (not the whole history).
  const summary = useMemo(() => {
    let completed = 0;
    let open = 0;

    for (const payment of payments) {
      const amount = Number(payment.amount || 0);
      const s = getStatus(payment);

      if (s === "COMPLETED") completed += amount;
      if (s === "PENDING" || s === "PROCESSING") open += amount;
    }

    return { completed, open };
  }, [payments]);

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* ---------- Header ---------- */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search, filter and review the payments you have processed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void query.refetch()}
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

      {/* ---------- Summary strip ---------- */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <SummaryItem
            label="Completed"
            value={`ETB ${formatAmount(summary.completed)}`}
            loading={isLoading}
          />
          <SummaryItem
            label="Pending or processing"
            value={`ETB ${formatAmount(summary.open)}`}
            loading={isLoading}
            highlight={summary.open > 0}
          />
          <SummaryItem
            label="Matching payments"
            value={total.toLocaleString("en-ET")}
            loading={isLoading}
          />
        </div>

        <p className="border-t bg-muted/30 px-5 py-2 text-xs text-muted-foreground">
          Amounts cover the {payments.length} payment
          {payments.length === 1 ? "" : "s"} on this page.
        </p>
      </Card>

      {/* ---------- Payments list ---------- */}
      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="space-y-4 border-b p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by payment, invoice or taxpayer"
                className="pl-9 pr-9"
                aria-label="Search payments"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <select
              value={method}
              onChange={(event) =>
                changeMethod(event.target.value as MethodFilter)
              }
              aria-label="Filter by payment method"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-44"
            >
              {METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status tabs */}
          <div
            role="tablist"
            aria-label="Filter by status"
            className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5"
          >
            {STATUS_TABS.map((tab) => {
              const active = status === tab.value;

              return (
                <button
                  key={tab.value}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => changeStatus(tab.value)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        {isLoading ? (
          <StateMessage
            icon={<Loader2 className="h-6 w-6 animate-spin" />}
            title="Loading payments"
          />
        ) : isError ? (
          <StateMessage
            icon={<AlertCircle className="h-6 w-6" />}
            title="Couldn't load payments"
            description={getErrorMessage(query.error)}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
              >
                Try again
              </Button>
            }
          />
        ) : payments.length === 0 ? (
          <StateMessage
            icon={<Search className="h-6 w-6" />}
            title={hasFilters ? "No matching payments" : "No payments yet"}
            description={
              hasFilters
                ? "Try a different search or clear the filters."
                : "Payments you process will appear here."
            }
            action={
              hasFilters ? (
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Clear filters
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link href="/agent/dashboard/payments/process">
                    Process payment
                  </Link>
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
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
                    <th className="w-10 px-3 py-3">
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <PaymentRow
                      key={payment.id}
                      payment={payment}
                      onOpen={() =>
                        router.push(
                          `/agent/dashboard/payments/${payment.id}`,
                        )
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="divide-y md:hidden">
              {payments.map((payment) => (
                <PaymentListItem key={payment.id} payment={payment} />
              ))}
            </ul>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {from}–{to}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">{total}</span>
                {query.isFetching && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating…
                  </span>
                )}
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || query.isFetching}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>

                  <span className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page >= totalPages || query.isFetching}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

/* =========================================================
   TABLE ROW (desktop)
   ========================================================= */

function PaymentRow({
  payment,
  onOpen,
}: {
  payment: Payment;
  onOpen: () => void;
}) {
  const detail = getMethodDetail(payment);
  const taxpayerId = getTaxpayerId(payment);

  return (
    <tr
      onClick={onOpen}
      className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/30"
    >
      <td className="px-5 py-4">
        <Link
          href={`/agent/dashboard/payments/${payment.id}`}
          onClick={(event) => event.stopPropagation()}
          className="font-medium hover:text-primary"
        >
          {getPaymentNumber(payment)}
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {getInvoiceNumber(payment)} · {formatDateTime(payment.created_at)}
        </p>
      </td>

      <td className="px-5 py-4">
        <div className="max-w-52">
          <p className="truncate font-medium">{getTaxpayerName(payment)}</p>
          {taxpayerId && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              ID {taxpayerId}
            </p>
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <MethodCell payment={payment} detail={detail} />
      </td>

      <td className="whitespace-nowrap px-5 py-4 text-right font-medium tabular-nums">
        {payment.currency || "ETB"} {formatAmount(payment.amount)}
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={getStatus(payment)} />
      </td>

      <td className="px-3 py-4 text-muted-foreground">
        <ChevronRight className="h-4 w-4" />
      </td>
    </tr>
  );
}

/* =========================================================
   LIST ITEM (mobile)
   ========================================================= */

function PaymentListItem({ payment }: { payment: Payment }) {
  const method = METHOD_STYLES[getMethod(payment)];

  return (
    <li>
      <Link
        href={`/agent/dashboard/payments/${payment.id}`}
        className="block space-y-2 px-4 py-4 transition-colors hover:bg-muted/30"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">
              {getPaymentNumber(payment)}
            </p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {getTaxpayerName(payment)}
            </p>
          </div>

          <p className="shrink-0 font-medium tabular-nums">
            {payment.currency || "ETB"} {formatAmount(payment.amount)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <StatusBadge status={getStatus(payment)} />

          <p className="truncate text-xs text-muted-foreground">
            {method?.label ?? humanize(getMethod(payment))} ·{" "}
            {formatDateTime(payment.created_at)}
          </p>
        </div>
      </Link>
    </li>
  );
}

/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    label: humanize(status),
    className: "bg-muted text-muted-foreground ring-border",
    icon: AlertCircle,
  };

  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style.className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {style.label}
    </span>
  );
}

function MethodCell({
  payment,
  detail,
}: {
  payment: Payment;
  detail: string | null;
}) {
  const key = getMethod(payment);
  const config = METHOD_STYLES[key];
  const Icon = config?.icon ?? CreditCard;

  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />

      <div className="min-w-0">
        <p>{config?.label ?? humanize(key)}</p>
        {detail && (
          <p className="max-w-40 truncate text-xs text-muted-foreground">
            {detail}
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  loading,
  highlight = false,
}: {
  label: string;
  value: string;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>

      <div className="mt-1.5 flex min-h-8 items-center">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <p
            className={`text-2xl font-semibold tracking-tight tabular-nums ${
              highlight ? "text-amber-600 dark:text-amber-300" : ""
            }`}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function StateMessage({
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
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="rounded-xl bg-muted p-3 text-muted-foreground">
        {icon}
      </div>

      <div>
        <h3 className="font-medium">{title}</h3>
        {description && (
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}