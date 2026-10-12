
"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Printer,
  XCircle,
} from "lucide-react";

import type {
  InvoiceDetail,
  Payment,
  PaymentStatus,
  InvoiceSourceType,
  InvoiceStatus,
} from "@/types/invoice/invoice-detail";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useInvoice } from "@/hooks/invoice/useInvoice.hook";

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
  ISSUED: {
    label: "Issued",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  PARTIALLY_PAID: {
    label: "Partially paid",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  PAID: {
    label: "Paid",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  OVERDUE: {
    label: "Overdue",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  VOID: {
    label: "Void",
    className: "border-gray-200 bg-gray-50 text-gray-700",
  },
};

type PaymentStatusView = {
  label: string;
  dot: string;
  className: string;
};

const DEFAULT_PAYMENT_STATUS: PaymentStatusView = {
  label: "Unknown",
  dot: "bg-gray-400",
  className: "text-muted-foreground",
};

const PAYMENT_STATUS_CONFIG: Partial<
  Record<PaymentStatus, PaymentStatusView>
> = {
  PENDING: {
    label: "Pending",
    dot: "bg-amber-500",
    className: "text-amber-700",
  },
  PROCESSING: {
    label: "Processing",
    dot: "bg-blue-500",
    className: "text-blue-700",
  },
  COMPLETED: {
    label: "Completed",
    dot: "bg-emerald-500",
    className: "text-emerald-700",
  },
  SUCCESS: {
    label: "Successful",
    dot: "bg-emerald-500",
    className: "text-emerald-700",
  },
  FAILED: {
    label: "Failed",
    dot: "bg-red-500",
    className: "text-red-700",
  },
  CANCELLED: {
    label: "Cancelled",
    dot: "bg-gray-500",
    className: "text-gray-600",
  },
  EXPIRED: {
    label: "Expired",
    dot: "bg-gray-500",
    className: "text-gray-600",
  },
  REFUNDED: {
    label: "Refunded",
    dot: "bg-orange-500",
    className: "text-orange-700",
  },
  PENDING_VERIFICATION: {
    label: "Pending verification",
    dot: "bg-amber-500",
    className: "text-amber-700",
  },
  VERIFIED: {
    label: "Verified",
    dot: "bg-blue-500",
    className: "text-blue-700",
  },
  POSTED: {
    label: "Posted",
    dot: "bg-emerald-500",
    className: "text-emerald-700",
  },
  REJECTED: {
    label: "Rejected",
    dot: "bg-red-500",
    className: "text-red-700",
  },
};

const SOURCE_LABEL: Record<InvoiceSourceType, string> = {
  ASSESSMENT: "Assessment",
  DIRECT_COLLECTION: "Direct collection",
};

const PAGE_SIZES = [5, 10, 20, 50];

const SETTLED_INVOICE_STATUSES: InvoiceStatus[] = [
  "PAID",
  "CANCELLED",
  "VOID",
];

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const toNumber = (
  value: number | string | null | undefined,
): number => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const result = Number(value);

  return Number.isFinite(result) ? result : 0;
};

const formatCurrency = (
  amount: number | string | null | undefined,
  currency = "ETB",
) => {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(amount));

  return `${formatted} ${currency || "ETB"}`;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
};

const formatDateTime = (
  value: string | null | undefined,
) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getPaymentStatus = (
  status: PaymentStatus,
): PaymentStatusView =>
  PAYMENT_STATUS_CONFIG[status] ?? {
    ...DEFAULT_PAYMENT_STATUS,
    label: String(status).replaceAll("_", " "),
  };

const isSuccessfulPayment = (payment: Payment) =>
  payment.status === "COMPLETED" ||
  payment.status === "SUCCESS" ||
  payment.status === "POSTED";

const isPendingPayment = (payment: Payment) =>
  payment.status === "PENDING" ||
  payment.status === "PROCESSING" ||
  payment.status === "PENDING_VERIFICATION" ||
  payment.status === "VERIFIED";

const getPaymentDate = (payment: Payment) =>
  payment.payment_date || payment.created_at || null;

/**
 * Calendar days between today and the due date.
 * Negative: overdue.
 * Zero: due today.
 * Positive: days remaining.
 */
const daysUntil = (
  value: string | null | undefined,
): number | null => {
  if (!value) return null;

  const due = new Date(value);

  if (Number.isNaN(due.getTime())) return null;

  const today = new Date();

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const startOfDueDate = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate(),
  );

  return Math.round(
    (startOfDueDate.getTime() - startOfToday.getTime()) /
      86_400_000,
  );
};

/*
|--------------------------------------------------------------------------
| SMALL COMPONENTS
|--------------------------------------------------------------------------
*/

function KeyFact({
  label,
  value,
  caption,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  caption?: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0 flex-1 px-5 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>

      <p
        className={cn(
          "mt-1 break-words text-xl font-semibold tracking-tight",
          valueClassName,
        )}
      >
        {value}
      </p>

      {caption && (
        <p className="mt-1 text-xs text-muted-foreground">
          {caption}
        </p>
      )}
    </div>
  );
}

function DetailList({
  rows,
}: {
  rows: {
    label: string;
    value: React.ReactNode;
  }[];
}) {
  return (
    <dl className="divide-y">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-start justify-between gap-6 py-3"
        >
          <dt className="shrink-0 text-sm text-muted-foreground">
            {row.label}
          </dt>

          <dd className="min-w-0 break-words text-right text-sm font-medium">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function SummaryLine({
  label,
  amount,
  currency,
  negative = false,
  bold = false,
}: {
  label: string;
  amount: number | string;
  currency: string;
  negative?: boolean;
  bold?: boolean;
}) {
  const numericAmount = toNumber(amount);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-1.5 text-sm",
        bold && "text-base font-semibold",
      )}
    >
      <span
        className={cn(
          "min-w-0",
          !bold && "text-muted-foreground",
        )}
      >
        {label}
      </span>

      <span
        className={cn(
          "shrink-0 tabular-nums",
          negative && numericAmount > 0 && "text-emerald-600",
        )}
      >
        {negative && numericAmount > 0 ? "−" : ""}
        {formatCurrency(numericAmount, currency)}
      </span>
    </div>
  );
}

function Callout({
  tone,
  title,
  children,
}: {
  tone: "orange" | "gray" | "red";
  title: string;
  children: React.ReactNode;
}) {
  const styles = {
    orange: "border-orange-200 bg-orange-50 text-orange-900",
    gray: "border-gray-200 bg-gray-50 text-gray-800",
    red: "border-red-200 bg-red-50 text-red-900",
  }[tone];

  return (
    <div
      role="status"
      className={cn(
        "flex gap-3 rounded-lg border p-4",
        styles,
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />

      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 break-words text-sm opacity-90">
          {children}
        </p>
      </div>
    </div>
  );
}

function SectionEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <FileText className="size-8 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| LOADING STATE
|--------------------------------------------------------------------------
*/

function InvoiceDetailLoading() {
  return (
    <div
      className="min-h-screen bg-muted/20"
      aria-label="Loading invoice"
      aria-busy="true"
    >
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="size-9 animate-pulse rounded-md bg-muted" />

          <div className="space-y-2">
            <div className="h-7 w-64 animate-pulse rounded bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          </div>
        </div>

        <div className="h-28 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-muted" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <div className="h-48 animate-pulse rounded-lg bg-muted" />
            <div className="h-64 animate-pulse rounded-lg bg-muted" />
            <div className="h-40 animate-pulse rounded-lg bg-muted" />
          </div>

          <div className="h-80 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| ERROR STATE
|--------------------------------------------------------------------------
*/

function InvoiceDetailError({
  message,
  onRetry,
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <XCircle className="size-10 text-red-500" />

            <div>
              <h2 className="font-semibold">
                Unable to load invoice
              </h2>

              <p className="mt-1 break-words text-sm text-muted-foreground">
                {message}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={onBack}>
                Go back
              </Button>

              <Button onClick={onRetry}>Try again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| PAGINATION
|--------------------------------------------------------------------------
*/

function usePagination<T>(rows: T[], initialSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialSize);

  const total = rows.length;

  const pageCount = Math.max(
    1,
    Math.ceil(total / pageSize),
  );

  const currentPage = Math.min(page, pageCount);

  const pageRows = useMemo(
    () =>
      rows.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      ),
    [rows, currentPage, pageSize],
  );

  return {
    page: currentPage,
    pageSize,
    pageCount,
    total,
    pageRows,
    setPage: (nextPage: number) => {
      setPage(
        Math.max(1, Math.min(nextPage, pageCount)),
      );
    },
    setPageSize: (size: number) => {
      if (!PAGE_SIZES.includes(size)) return;

      setPageSizeState(size);
      setPage(1);
    },
  };
}

function getPageList(
  page: number,
  count: number,
): (number | "gap")[] {
  if (count <= 7) {
    return Array.from(
      { length: count },
      (_, index) => index + 1,
    );
  }

  const pages = new Set([
    1,
    count,
    page - 1,
    page,
    page + 1,
  ]);

  const sorted = [...pages]
    .filter((number) => number >= 1 && number <= count)
    .sort((a, b) => a - b);

  const result: (number | "gap")[] = [];

  sorted.forEach((number, index) => {
    if (
      index > 0 &&
      number - sorted[index - 1] > 1
    ) {
      result.push("gap");
    }

    result.push(number);
  });

  return result;
}

function TablePagination({
  page,
  pageSize,
  pageCount,
  total,
  noun,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  noun: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const from =
    total === 0 ? 0 : (page - 1) * pageSize + 1;

  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {from}–{to}
        </span>{" "}
        of{" "}
        <span className="font-medium text-foreground">
          {total}
        </span>{" "}
        {noun}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Rows
          </span>

          <Select
            value={String(pageSize)}
            onValueChange={(value) =>
              onPageSizeChange(Number(value))
            }
          >
            <SelectTrigger
              className="h-8 w-[76px]"
              aria-label={`Rows per page for ${noun}`}
            >
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem
                  key={size}
                  value={String(size)}
                >
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <nav
          className="flex items-center gap-1"
          aria-label={`${noun} pagination`}
        >
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>

          {getPageList(page, pageCount).map(
            (item, index) =>
              item === "gap" ? (
                <span
                  key={`gap-${index}`}
                  className="px-1 text-sm text-muted-foreground"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  variant={item === page ? "default" : "ghost"}
                  size="icon"
                  className="size-8 text-sm"
                  onClick={() => onPageChange(item)}
                  aria-label={`Page ${item}`}
                  aria-current={
                    item === page ? "page" : undefined
                  }
                >
                  {item}
                </Button>
              ),
          )}

          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const invoiceId = params.id;

  const {
    data: invoiceResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useInvoice(invoiceId);

  if (isLoading) {
    return <InvoiceDetailLoading />;
  }

  if (isError || !invoiceResponse?.data) {
    return (
      <InvoiceDetailError
        message={
          error instanceof Error
            ? error.message
            : "Failed to load invoice. Please try again."
        }
        onBack={() => router.back()}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <InvoiceDetailView
      key={invoiceResponse.data.id}
      invoice={invoiceResponse.data}
    />
  );
}

/*
|--------------------------------------------------------------------------
| INVOICE DETAIL VIEW
|--------------------------------------------------------------------------
*/

function InvoiceDetailView({
  invoice,
}: {
  invoice: InvoiceDetail;
}) {
  const router = useRouter();

  const [tab, setTab] = useState("overview");

  const { financial, currency } = invoice;

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE API COLLECTIONS
  |--------------------------------------------------------------------------
  */

  const payments = Array.isArray(invoice.payments)
    ? invoice.payments
    : [];

  const items = Array.isArray(invoice.items)
    ? invoice.items
    : [];

  const status =
    STATUS_CONFIG[invoice.status] ?? {
      label: String(invoice.status),
      className: "border-gray-200 bg-gray-50 text-gray-700",
    };

  /*
  |--------------------------------------------------------------------------
  | FINANCIAL SUMMARY
  |--------------------------------------------------------------------------
  |
  | Invoice totals remain authoritative. Payment history is used for
  | transaction-level reporting, not to recalculate invoice balances.
  |--------------------------------------------------------------------------
  */

  const totalAmount = toNumber(financial.total_amount);
  const paidAmount = toNumber(financial.paid_amount);
  const balanceDue = toNumber(financial.balance_due);

  const progress =
    totalAmount > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round((paidAmount / totalAmount) * 100),
          ),
        )
      : 0;

  /*
  |--------------------------------------------------------------------------
  | DUE DATE
  |--------------------------------------------------------------------------
  */

  const dueIn = daysUntil(invoice.dates.due_date);

  const isSettled = SETTLED_INVOICE_STATUSES.includes(
    invoice.status,
  );

  const dueCaption =
    isSettled || dueIn === null
      ? undefined
      : dueIn < 0
        ? `${Math.abs(dueIn)} calendar day${Math.abs(dueIn) === 1 ? "" : "s"} overdue`
        : dueIn === 0
          ? "Due today"
          : `${dueIn} day${dueIn === 1 ? "" : "s"} remaining`;

  const dueTone =
    !isSettled && dueIn !== null && dueIn < 0
      ? "text-red-600"
      : undefined;

  /*
  |--------------------------------------------------------------------------
  | PAYMENT SUMMARY
  |--------------------------------------------------------------------------
  */

  const successfulPayments = useMemo(
    () => payments.filter(isSuccessfulPayment),
    [payments],
  );

  const successfulPaymentTotal = useMemo(
    () =>
      successfulPayments.reduce(
        (sum, payment) =>
          sum + toNumber(payment.amount),
        0,
      ),
    [successfulPayments],
  );

  const pendingPayments = useMemo(
    () => payments.filter(isPendingPayment),
    [payments],
  );

  const failedPayments = useMemo(
    () =>
      payments.filter(
        (payment) =>
          payment.status === "FAILED" ||
          payment.status === "REJECTED" ||
          payment.status === "EXPIRED",
      ),
    [payments],
  );

  const refundedPayments = useMemo(
    () =>
      payments.filter(
        (payment) => payment.status === "REFUNDED",
      ),
    [payments],
  );

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const itemsPage = usePagination(items, 10);
  const paymentsPage = usePagination(payments, 10);

  /*
  |--------------------------------------------------------------------------
  | ACTIVITY TIMELINE
  |--------------------------------------------------------------------------
  */

  const activity = useMemo(() => {
    type ActivityTone =
      | "default"
      | "success"
      | "warning"
      | "danger";

    type ActivityEvent = {
      id: string;
      at: string;
      title: string;
      detail?: string;
      tone: ActivityTone;
    };

    const events: ActivityEvent[] = [];

    if (invoice.audit?.created_at) {
      events.push({
        id: "created",
        at: invoice.audit.created_at,
        title: "Invoice created",
        detail: invoice.audit.created_by?.name
          ? `Created by ${invoice.audit.created_by.name}`
          : undefined,
        tone: "default",
      });
    }

    if (invoice.dates?.issued_at) {
      events.push({
        id: "issued",
        at: invoice.dates.issued_at,
        title: "Invoice issued",
        detail: invoice.audit.issued_by?.name
          ? `Issued by ${invoice.audit.issued_by.name}`
          : undefined,
        tone: "default",
      });
    }

    payments.forEach((payment) => {
      const occurredAt = getPaymentDate(payment);

      if (!occurredAt) return;

      const paymentStatus = getPaymentStatus(
        payment.status,
      );

      const detailParts = [
        formatCurrency(
          payment.amount,
          payment.currency || currency,
        ),
        payment.payment_method,
        paymentStatus.label,
      ];

      if (payment.received_by?.name) {
        detailParts.push(
          `Received by ${payment.received_by.name}`,
        );
      }

      if (
        payment.verified_by?.name &&
        payment.status !== "PENDING" &&
        payment.status !== "PENDING_VERIFICATION" &&
        payment.status !== "PROCESSING"
      ) {
        detailParts.push(
          `Reviewed by ${payment.verified_by.name}`,
        );
      }

      events.push({
        id: `payment-${payment.id}`,
        at: occurredAt,
        title: `Payment ${payment.payment_number}`,
        detail: detailParts.join(" · "),
        tone: isSuccessfulPayment(payment)
          ? "success"
          : failedPayments.some(
                (failed) => failed.id === payment.id,
              )
            ? "danger"
            : isPendingPayment(payment)
              ? "warning"
              : "default",
      });
    });

    if (invoice.dates?.paid_at) {
      events.push({
        id: "paid",
        at: invoice.dates.paid_at,
        title: "Invoice fully paid",
        detail: "The invoice balance has been fully settled.",
        tone: "success",
      });
    }

    if (invoice.dates?.cancelled_at) {
      events.push({
        id: "cancelled",
        at: invoice.dates.cancelled_at,
        title: "Invoice cancelled",
        detail: invoice.cancellation?.cancelled_by?.name
          ? `Cancelled by ${invoice.cancellation.cancelled_by.name}`
          : invoice.cancellation?.reason || undefined,
        tone: "warning",
      });
    }

    if (invoice.dates?.voided_at) {
      events.push({
        id: "voided",
        at: invoice.dates.voided_at,
        title: "Invoice voided",
        detail: invoice.void?.voided_by?.name
          ? `Voided by ${invoice.void.voided_by.name}`
          : invoice.void?.reason || undefined,
        tone: "danger",
      });
    }

    return events.sort(
      (a, b) =>
        new Date(b.at).getTime() -
        new Date(a.at).getTime(),
    );
  }, [invoice, currency, payments, failedPayments]);

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
        {/* HEADER */}

        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              aria-label="Go back"
              className="mt-0.5 shrink-0"
            >
              <ArrowLeft className="size-5" />
            </Button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="break-all text-2xl font-semibold tracking-tight">
                  {invoice.invoice_number}
                </h1>

                <Badge
                  variant="outline"
                  className={status.className}
                >
                  {status.label}
                </Badge>
              </div>

              <p className="mt-1 break-words text-sm text-muted-foreground">
                {invoice.citizen?.name || "Unknown taxpayer"}
                {" · "}
                {SOURCE_LABEL[invoice.source_type]}
                {" invoice"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/office/dashboard/invoices/${encodeURIComponent(invoice.id)}/print`,
                )
              }
            >
              <Printer className="mr-2 size-4" />
              Print invoice
            </Button>
          </div>
        </header>

        {/* STATE CALLOUTS */}

        {invoice.cancellation?.reason && (
          <Callout
            tone="orange"
            title="This invoice was cancelled"
          >
            {invoice.cancellation.reason}
          </Callout>
        )}

        {invoice.void?.reason && (
          <Callout
            tone="gray"
            title="This invoice was voided"
          >
            {invoice.void.reason}
          </Callout>
        )}

        {invoice.status === "OVERDUE" &&
          balanceDue > 0 &&
          !isSettled && (
            <Callout
              tone="red"
              title="Outstanding invoice"
            >
              This invoice has an outstanding balance of{" "}
              {formatCurrency(balanceDue, currency)}.
              {dueCaption ? ` ${dueCaption}.` : ""}
            </Callout>
          )}

        {/* KEY FINANCIAL FACTS */}

        <Card className="overflow-hidden">
          <div className="grid divide-y sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
            <KeyFact
              label="Invoice total"
              value={formatCurrency(
                financial.total_amount,
                currency,
              )}
            />

            <KeyFact
              label="Amount paid"
              value={formatCurrency(
                financial.paid_amount,
                currency,
              )}
              valueClassName="text-emerald-600"
              caption={`${progress}% of invoice total`}
            />

            <KeyFact
              label="Balance due"
              value={formatCurrency(
                financial.balance_due,
                currency,
              )}
              valueClassName={
                balanceDue > 0
                  ? "text-amber-600"
                  : "text-emerald-600"
              }
            />

            <KeyFact
              label="Due date"
              value={formatDate(invoice.dates.due_date)}
              valueClassName={dueTone}
              caption={dueCaption}
            />
          </div>

          <Progress
            value={progress}
            className="h-1.5 rounded-none"
            aria-label={`Invoice payment progress: ${progress}%`}
          />
        </Card>

        {/* TABS */}

        <Tabs
          value={tab}
          onValueChange={setTab}
          className="space-y-4"
        >
          <div className="overflow-x-auto pb-1">
            <TabsList className="inline-flex h-auto min-w-max justify-start gap-1">
              <TabsTrigger value="overview">
                Overview
              </TabsTrigger>

              <TabsTrigger value="items">
                Items
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {items.length}
                </span>
              </TabsTrigger>

              <TabsTrigger value="payments">
                Payments
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {payments.length}
                </span>
              </TabsTrigger>

              <TabsTrigger value="activity">
                Activity
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {activity.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* OVERVIEW */}

          <TabsContent
            value="overview"
            className="space-y-6"
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 space-y-6">
                {/* TAXPAYER */}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Taxpayer
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <DetailList
                      rows={[
                        {
                          label: "Name",
                          value:
                            invoice.citizen?.name ||
                            "Not available",
                        },
                        {
                          label: "Citizen number",
                          value:
                            invoice.citizen?.citizen_number ||
                            "—",
                        },
                        {
                          label: "Phone",
                          value:
                            invoice.citizen?.phone || "—",
                        },
                        {
                          label: "Email",
                          value:
                            invoice.citizen?.email || "—",
                        },
                      ]}
                    />
                  </CardContent>
                </Card>

                {/* INVOICE DETAILS */}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Invoice details
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <DetailList
                      rows={[
                        {
                          label: "Invoice number",
                          value: invoice.invoice_number,
                        },
                        {
                          label: "Invoice status",
                          value: status.label,
                        },
                        {
                          label: "Source",
                          value: SOURCE_LABEL[invoice.source_type],
                        },
                        {
                          label: "Administrative unit",
                          value: invoice.administrative_unit
                            ? [
                                invoice.administrative_unit.name,
                                invoice.administrative_unit.code,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "—"
                            : "—",
                        },
                        ...(invoice.source_type === "ASSESSMENT"
                          ? [
                              {
                                label: "Assessment number",
                                value:
                                  invoice.assessment
                                    ?.assessment_number || "—",
                              },
                              {
                                label: "Assessment status",
                                value:
                                  invoice.assessment?.status || "—",
                              },
                            ]
                          : []),
                        {
                          label: "Issued date",
                          value: formatDate(
                            invoice.dates.issued_at,
                          ),
                        },
                        {
                          label: "Due date",
                          value: formatDate(
                            invoice.dates.due_date,
                          ),
                        },
                        {
                          label: "Fully paid date",
                          value: formatDate(
                            invoice.dates.paid_at,
                          ),
                        },
                      ]}
                    />

                    {invoice.source_type ===
                      "DIRECT_COLLECTION" && (
                      <p className="mt-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                        This invoice was created through direct
                        collection and is not linked to an
                        assessment.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* PAYMENT SUMMARY */}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Payment activity
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">
                          Completed payments
                        </p>

                        <p className="mt-1 text-xl font-semibold text-emerald-600">
                          {successfulPayments.length}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatCurrency(
                            successfulPaymentTotal,
                            currency,
                          )}
                        </p>
                      </div>

                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">
                          Pending / processing
                        </p>

                        <p className="mt-1 text-xl font-semibold text-amber-600">
                          {pendingPayments.length}
                        </p>
                      </div>

                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">
                          Failed / rejected
                        </p>

                        <p className="mt-1 text-xl font-semibold text-red-600">
                          {failedPayments.length}
                        </p>
                      </div>

                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">
                          Refunded
                        </p>

                        <p className="mt-1 text-xl font-semibold text-orange-600">
                          {refundedPayments.length}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-muted-foreground">
                      The invoice financial summary is authoritative.
                      Payment history shows individual transactions and
                      their processing status.
                    </p>
                  </CardContent>
                </Card>

                {/* NOTES */}

                {invoice.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Notes
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {invoice.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* FINANCIAL SUMMARY */}

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-base">
                    Financial summary
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <SummaryLine
                    label="Subtotal"
                    amount={financial.subtotal}
                    currency={currency}
                  />

                  <SummaryLine
                    label="Discount"
                    amount={financial.discount_amount}
                    currency={currency}
                    negative
                  />

                  <SummaryLine
                    label="Penalty"
                    amount={financial.penalty_amount}
                    currency={currency}
                  />

                  <SummaryLine
                    label="Interest"
                    amount={financial.interest_amount}
                    currency={currency}
                  />

                  <Separator className="my-3" />

                  <SummaryLine
                    label="Invoice total"
                    amount={financial.total_amount}
                    currency={currency}
                    bold
                  />

                  <SummaryLine
                    label="Amount paid"
                    amount={financial.paid_amount}
                    currency={currency}
                    negative
                  />

                  <Separator className="my-3" />

                  <SummaryLine
                    label="Balance due"
                    amount={financial.balance_due}
                    currency={currency}
                    bold
                  />

                  <div className="mt-4 rounded-lg bg-muted/40 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">
                        Payment progress
                      </span>

                      <span className="text-xs font-semibold">
                        {progress}%
                      </span>
                    </div>

                    <Progress value={progress} />

                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatCurrency(
                        financial.balance_due,
                        currency,
                      )}{" "}
                      remains outstanding.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ITEMS */}

          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Invoice items
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                {items.length === 0 ? (
                  <SectionEmptyState
                    title="No invoice items"
                    description="No invoice line items were returned by the API."
                  />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm tabular-nums">
                        <thead>
                          <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                            <th className="px-5 py-3 font-medium">
                              #
                            </th>
                            <th className="px-5 py-3 font-medium">
                              Description
                            </th>
                            <th className="px-5 py-3 text-right font-medium">
                              Qty
                            </th>
                            <th className="px-5 py-3 text-right font-medium">
                              Unit price
                            </th>
                            <th className="px-5 py-3 text-right font-medium">
                              Discount
                            </th>
                            <th className="px-5 py-3 text-right font-medium">
                              Penalty
                            </th>
                            <th className="px-5 py-3 text-right font-medium">
                              Interest
                            </th>
                            <th className="px-5 py-3 text-right font-medium">
                              Total
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {itemsPage.pageRows.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b transition-colors last:border-0 hover:bg-muted/30"
                            >
                              <td className="px-5 py-4 text-muted-foreground">
                                {item.line_number}
                              </td>

                              <td className="min-w-[220px] px-5 py-4">
                                <p className="font-medium">
                                  {item.description}
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                  {item.service?.name || "Service unavailable"}
                                  {item.service?.code && (
                                    <> · {item.service.code}</>
                                  )}
                                </p>
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-right">
                                {item.quantity ?? "—"}
                                {item.unit && (
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    {item.unit}
                                  </span>
                                )}
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-right">
                                {item.unit_price != null
                                  ? formatCurrency(
                                      item.unit_price,
                                      item.currency,
                                    )
                                  : "—"}
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-right text-emerald-600">
                                {toNumber(item.discount_amount) > 0
                                  ? `−${formatCurrency(
                                      item.discount_amount,
                                      item.currency,
                                    )}`
                                  : "—"}
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-right">
                                {toNumber(item.penalty_amount) > 0
                                  ? formatCurrency(
                                      item.penalty_amount,
                                      item.currency,
                                    )
                                  : "—"}
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-right">
                                {toNumber(item.interest_amount) > 0
                                  ? formatCurrency(
                                      item.interest_amount,
                                      item.currency,
                                    )
                                  : "—"}
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-right font-medium">
                                {formatCurrency(
                                  item.total_amount,
                                  item.currency || currency,
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>

                        <tfoot>
                          <tr className="border-t bg-muted/40">
                            <td
                              colSpan={7}
                              className="px-5 py-3 text-right font-medium"
                            >
                              Invoice total
                            </td>

                            <td className="whitespace-nowrap px-5 py-3 text-right font-semibold">
                              {formatCurrency(
                                financial.total_amount,
                                currency,
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <TablePagination
                      page={itemsPage.page}
                      pageSize={itemsPage.pageSize}
                      pageCount={itemsPage.pageCount}
                      total={itemsPage.total}
                      noun="items"
                      onPageChange={itemsPage.setPage}
                      onPageSizeChange={itemsPage.setPageSize}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PAYMENTS */}

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base">
                    Payment history
                  </CardTitle>

                  <p className="text-sm text-muted-foreground">
                    {payments.length} transaction
                    {payments.length === 1 ? "" : "s"}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {payments.length === 0 ? (
                  <SectionEmptyState
                    title="No payments recorded"
                    description="Payments made against this invoice will appear here."
                  />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm tabular-nums">
                        <thead>
                          <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                            <th className="px-5 py-3 font-medium">
                              Payment number
                            </th>
                            <th className="px-5 py-3 font-medium">
                              Date
                            </th>
                            <th className="px-5 py-3 font-medium">
                              Method
                            </th>
                            <th className="px-5 py-3 font-medium">
                              Provider
                            </th>
                            <th className="px-5 py-3 font-medium">
                              Reference
                            </th>
                            <th className="px-5 py-3 font-medium">
                              Received by
                            </th>
                            <th className="px-5 py-3 font-medium">
                              Status
                            </th>
                            <th className="px-5 py-3 text-right font-medium">
                              Amount
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {paymentsPage.pageRows.map((payment) => {
                            const paymentStatus = getPaymentStatus(
                              payment.status,
                            );

                            const completed = isSuccessfulPayment(
                              payment,
                            );

                            return (
                              <tr
                                key={payment.id}
                                className="border-b transition-colors last:border-0 hover:bg-muted/30"
                              >
                                <td className="whitespace-nowrap px-5 py-4 font-medium">
                                  {payment.payment_number}
                                </td>

                                <td className="whitespace-nowrap px-5 py-4">
                                  {formatDateTime(
                                    getPaymentDate(payment),
                                  )}
                                </td>

                                <td className="whitespace-nowrap px-5 py-4">
                                  {String(
                                    payment.payment_method || "—",
                                  ).replaceAll("_", " ")}
                                </td>

                                <td className="whitespace-nowrap px-5 py-4">
                                  {payment.payment_provider
                                    ? String(
                                        payment.payment_provider,
                                      ).replaceAll("_", " ")
                                    : "—"}
                                </td>

                                <td className="min-w-[180px] px-5 py-4">
                                  <p className="break-all font-medium">
                                    {payment.transaction_reference ||
                                      "—"}
                                  </p>

                                  {payment.provider_reference && (
                                    <p className="mt-1 break-all text-xs text-muted-foreground">
                                      Provider:{" "}
                                      {payment.provider_reference}
                                    </p>
                                  )}
                                </td>

                                <td className="whitespace-nowrap px-5 py-4">
                                  {payment.received_by?.name || "—"}
                                </td>

                                <td className="whitespace-nowrap px-5 py-4">
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1.5",
                                      paymentStatus.className,
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "size-1.5 rounded-full",
                                        paymentStatus.dot,
                                      )}
                                    />

                                    {paymentStatus.label}
                                  </span>
                                </td>

                                <td
                                  className={cn(
                                    "whitespace-nowrap px-5 py-4 text-right font-semibold",
                                    !completed &&
                                      "text-muted-foreground",
                                    payment.status === "REFUNDED" &&
                                      "line-through",
                                  )}
                                >
                                  {formatCurrency(
                                    payment.amount,
                                    payment.currency || currency,
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>

                        <tfoot>
                          <tr className="border-t bg-muted/40">
                            <td
                              colSpan={7}
                              className="px-5 py-3 text-right font-medium"
                            >
                              Completed transaction total (
                              {successfulPayments.length})
                            </td>

                            <td className="whitespace-nowrap px-5 py-3 text-right font-semibold">
                              {formatCurrency(
                                successfulPaymentTotal,
                                currency,
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <TablePagination
                      page={paymentsPage.page}
                      pageSize={paymentsPage.pageSize}
                      pageCount={paymentsPage.pageCount}
                      total={paymentsPage.total}
                      noun="payments"
                      onPageChange={paymentsPage.setPage}
                      onPageSizeChange={paymentsPage.setPageSize}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACTIVITY */}

          <TabsContent value="activity">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Invoice timeline
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {activity.length === 0 ? (
                    <SectionEmptyState
                      title="No activity recorded"
                      description="Invoice creation, issuance, payments, and status changes will appear here when timestamps are available."
                    />
                  ) : (
                    <ol className="relative space-y-6 border-l pl-6">
                      {activity.map((event) => {
                        const Icon =
                          event.tone === "success"
                            ? CheckCircle2
                            : event.tone === "danger"
                              ? XCircle
                              : event.tone === "warning"
                                ? AlertCircle
                                : FileText;

                        return (
                          <li
                            key={event.id}
                            className="relative min-w-0"
                          >
                            <span className="absolute -left-[31px] top-0.5 flex size-5 items-center justify-center rounded-full border bg-background">
                              <Icon
                                className={cn(
                                  "size-3",
                                  event.tone === "success" &&
                                    "text-emerald-600",
                                  event.tone === "danger" &&
                                    "text-red-600",
                                  event.tone === "warning" &&
                                    "text-amber-600",
                                  event.tone === "default" &&
                                    "text-muted-foreground",
                                )}
                              />
                            </span>

                            <p className="text-sm font-medium">
                              {event.title}
                            </p>

                            {event.detail && (
                              <p className="mt-1 break-words text-sm text-muted-foreground">
                                {event.detail}
                              </p>
                            )}

                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDateTime(event.at)}
                            </p>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-base">
                    Audit information
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <DetailList
                    rows={[
                      {
                        label: "Created by",
                        value:
                          invoice.audit?.created_by?.name || "—",
                      },
                      {
                        label: "Issued by",
                        value:
                          invoice.audit?.issued_by?.name || "—",
                      },
                      {
                        label: "Created",
                        value: formatDateTime(
                          invoice.audit?.created_at,
                        ),
                      },
                      {
                        label: "Last updated",
                        value: formatDateTime(
                          invoice.audit?.updated_at,
                        ),
                      },
                      {
                        label: "Cancelled by",
                        value:
                          invoice.cancellation?.cancelled_by?.name ||
                          "—",
                      },
                      {
                        label: "Voided by",
                        value:
                          invoice.void?.voided_by?.name || "—",
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}