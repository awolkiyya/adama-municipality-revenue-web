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
  CreditCard,
  FileText,
  Printer,
  XCircle,
} from "lucide-react";

import type {
  InvoiceDetail,
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
  {
    label: string;
    className: string;
  }
> = {
  DRAFT: {
    label: "Draft",
    className:
      "bg-slate-50 text-slate-700 border-slate-200",
  },

  ISSUED: {
    label: "Issued",
    className:
      "bg-blue-50 text-blue-700 border-blue-200",
  },

  PARTIALLY_PAID: {
    label: "Partially paid",
    className:
      "bg-amber-50 text-amber-700 border-amber-200",
  },

  PAID: {
    label: "Paid",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
  },

  OVERDUE: {
    label: "Overdue",
    className:
      "bg-red-50 text-red-700 border-red-200",
  },

  CANCELLED: {
    label: "Cancelled",
    className:
      "bg-orange-50 text-orange-700 border-orange-200",
  },

  VOID: {
    label: "Void",
    className:
      "bg-gray-50 text-gray-700 border-gray-200",
  },
};

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  {
    label: string;
    dot: string;
  }
> = {
  PENDING: {
    label: "Pending",
    dot: "bg-amber-500",
  },

  SUCCESS: {
    label: "Successful",
    dot: "bg-emerald-500",
  },

  FAILED: {
    label: "Failed",
    dot: "bg-red-500",
  },

  CANCELLED: {
    label: "Cancelled",
    dot: "bg-gray-500",
  },

  REFUNDED: {
    label: "Refunded",
    dot: "bg-orange-500",
  },
};

const SOURCE_LABEL: Record<
  InvoiceSourceType,
  string
> = {
  ASSESSMENT: "Assessment",
  DIRECT_COLLECTION: "Direct collection",
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const toNumber = (
  value: number | string | null | undefined,
): number => {
  const number = Number(value ?? 0);

  return Number.isFinite(number)
    ? number
    : 0;
};

const formatCurrency = (
  amount: number | string,
  currency = "ETB",
) =>
  `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(amount))} ${currency}`;

const formatDate = (
  value: string | null,
) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(value))
    : "—";

const formatDateTime = (
  value: string | null,
) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "—";

/**
 * Whole days from today to the due date.
 *
 * Negative = past due.
 * Zero = due today.
 * Positive = days remaining.
 */
const daysUntil = (
  value: string | null,
): number | null => {
  if (!value) {
    return null;
  }

  const start = new Date();

  start.setHours(0, 0, 0, 0);

  const due = new Date(value);

  due.setHours(0, 0, 0, 0);

  return Math.round(
    (due.getTime() - start.getTime()) /
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
    <div className="flex-1 px-5 py-4">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p
        className={cn(
          "mt-1 text-xl font-semibold tracking-tight",
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
          <dt className="text-sm text-muted-foreground">
            {row.label}
          </dt>

          <dd className="text-right text-sm font-medium">
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
        "flex items-center justify-between py-1.5 text-sm",
        bold && "text-base font-semibold",
      )}
    >
      <span
        className={cn(
          !bold && "text-muted-foreground",
        )}
      >
        {label}
      </span>

      <span
        className={cn(
          negative &&
            numericAmount > 0 &&
            "text-emerald-600",
        )}
      >
        {negative && numericAmount > 0
          ? "−"
          : ""}

        {formatCurrency(
          numericAmount,
          currency,
        )}
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
    orange:
      "border-orange-200 bg-orange-50 text-orange-800",

    gray:
      "border-gray-200 bg-gray-50 text-gray-800",

    red:
      "border-red-200 bg-red-50 text-red-800",
  }[tone];

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border p-4",
        styles,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

      <div>
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-0.5 text-sm opacity-90">
          {children}
        </p>
      </div>
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
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />

          <div className="space-y-2">
            <div className="h-7 w-64 animate-pulse rounded bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          </div>
        </div>

        <div className="h-28 animate-pulse rounded-lg bg-muted" />

        <div className="h-10 w-96 animate-pulse rounded-lg bg-muted" />

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
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
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto flex min-h-[60vh] w-full max-w-6xl items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <XCircle className="h-10 w-10 text-red-500" />

            <div>
              <h2 className="font-semibold">
                Unable to load invoice
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {message}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  window.history.back()
                }
              >
                Go back
              </Button>

              <Button onClick={onRetry}>
                Try again
              </Button>
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

const PAGE_SIZES = [
  5,
  10,
  20,
  50,
];

function usePagination<T>(
  rows: T[],
  initialSize = 10,
) {
  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSizeState] =
    useState(initialSize);

  const total = rows.length;

  const pageCount = Math.max(
    1,
    Math.ceil(total / pageSize),
  );

  const currentPage = Math.min(
    page,
    pageCount,
  );

  const pageRows = useMemo(
    () =>
      rows.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      ),
    [
      rows,
      currentPage,
      pageSize,
    ],
  );

  return {
    page: currentPage,

    pageSize,

    pageCount,

    total,

    pageRows,

    setPage,

    setPageSize: (
      size: number,
    ) => {
      setPageSizeState(size);
      setPage(1);
    },
  };
}

/**
 * Generate:
 *
 * 1 2 3 4 5 6 7
 *
 * or:
 *
 * 1 … 4 5 6 … 12
 */
function getPageList(
  page: number,
  count: number,
): (number | "gap")[] {
  if (count <= 7) {
    return Array.from(
      { length: count },
      (_, i) => i + 1,
    );
  }

  const pages = new Set([
    1,
    count,
    page - 1,
    page,
    page + 1,
  ]);

  const sorted = [
    ...pages,
  ]
    .filter(
      (n) =>
        n >= 1 &&
        n <= count,
    )
    .sort(
      (a, b) => a - b,
    );

  const result: (
    | number
    | "gap"
  )[] = [];

  sorted.forEach(
    (
      n,
      i,
    ) => {
      if (
        i > 0 &&
        n - sorted[i - 1] > 1
      ) {
        result.push("gap");
      }

      result.push(n);
    },
  );

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
  onPageChange: (
    page: number,
  ) => void;
  onPageSizeChange: (
    size: number,
  ) => void;
}) {
  const from =
    total === 0
      ? 0
      : (page - 1) *
          pageSize +
        1;

  const to = Math.min(
    page * pageSize,
    total,
  );

  return (
    <div className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
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
            onValueChange={(
              value,
            ) =>
              onPageSizeChange(
                Number(value),
              )
            }
          >
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {PAGE_SIZES.map(
                (size) => (
                  <SelectItem
                    key={size}
                    value={String(
                      size,
                    )}
                  >
                    {size}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <nav
          className="flex items-center gap-1"
          aria-label="Pagination"
        >
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={page <= 1}
            onClick={() =>
              onPageChange(
                page - 1,
              )
            }
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>

          {getPageList(
            page,
            pageCount,
          ).map(
            (
              item,
              index,
            ) =>
              item ===
              "gap" ? (
                <span
                  key={`gap-${index}`}
                  className="px-1 text-sm text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  variant={
                    item === page
                      ? "default"
                      : "ghost"
                  }
                  size="icon"
                  className="size-8 text-sm"
                  onClick={() =>
                    onPageChange(
                      item,
                    )
                  }
                  aria-label={`Page ${item}`}
                  aria-current={
                    item === page
                      ? "page"
                      : undefined
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
            disabled={
              page >=
              pageCount
            }
            onClick={() =>
              onPageChange(
                page + 1,
              )
            }
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
  const params =
    useParams<{
      id: string;
    }>();

  const invoiceId =
    params.id;

  const {
    data: invoice,
    isLoading,
    isError,
    error,
    refetch,
  } = useInvoice(
    invoiceId,
  );

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (isLoading) {
    return (
      <InvoiceDetailLoading />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (
    isError ||
    !invoice
  ) {
    return (
      <InvoiceDetailError
        message={
          error instanceof Error
            ? error.message
            : "Failed to load invoice."
        }
        onRetry={() =>
          refetch()
        }
      />
    );
  }

  return (
    <InvoiceDetailView
      invoice={invoice.data!}
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
  const router =
    useRouter();

  const [
    tab,
    setTab,
  ] = useState(
    "overview",
  );

  const {
    financial,
    currency,
  } = invoice;

  const status =
    STATUS_CONFIG[
      invoice.status
    ];

  /*
  |--------------------------------------------------------------------------
  | Financial Progress
  |--------------------------------------------------------------------------
  */

  const totalAmount =
    toNumber(
      financial.total_amount,
    );

  const paidAmount =
    toNumber(
      financial.paid_amount,
    );

  const balanceDue =
    toNumber(
      financial.balance_due,
    );

  const progress =
    totalAmount > 0
      ? Math.min(
          100,
          Math.round(
            (paidAmount /
              totalAmount) *
              100,
          ),
        )
      : 0;

  /*
  |--------------------------------------------------------------------------
  | Payment Action
  |--------------------------------------------------------------------------
  */

  const canCollect =
    ![
      "PAID",
      "CANCELLED",
      "VOID",
      "DRAFT",
    ].includes(
      invoice.status,
    ) &&
    balanceDue > 0;

  /*
  |--------------------------------------------------------------------------
  | Due Date
  |--------------------------------------------------------------------------
  */

  const dueIn =
    daysUntil(
      invoice.dates.due_date,
    );

  const isSettled = [
    "PAID",
    "CANCELLED",
    "VOID",
  ].includes(
    invoice.status,
  );

  const dueCaption =
    isSettled ||
    dueIn === null
      ? undefined
      : dueIn < 0
        ? `${Math.abs(
            dueIn,
          )} days overdue`
        : dueIn === 0
          ? "Due today"
          : `Due in ${dueIn} days`;

  const dueTone =
    !isSettled &&
    dueIn !== null &&
    dueIn < 0
      ? "text-red-600"
      : undefined;

  /*
  |--------------------------------------------------------------------------
  | Payment Summary
  |--------------------------------------------------------------------------
  |
  | Only SUCCESS payments contribute to received money.
  |
  */

  const successfulPayments =
    useMemo(
      () =>
        invoice.payments.filter(
          (payment) =>
            payment.status ===
            "SUCCESS",
        ),
      [invoice.payments],
    );

  const successfulPaymentTotal =
    useMemo(
      () =>
        successfulPayments.reduce(
          (
            sum,
            payment,
          ) =>
            sum +
            toNumber(
              payment.amount,
            ),
          0,
        ),
      [successfulPayments],
    );

  const pendingPayments =
    useMemo(
      () =>
        invoice.payments.filter(
          (payment) =>
            payment.status ===
            "PENDING",
        ),
      [invoice.payments],
    );

  const failedPayments =
    useMemo(
      () =>
        invoice.payments.filter(
          (payment) =>
            payment.status ===
            "FAILED",
        ),
      [invoice.payments],
    );

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const itemsPage =
    usePagination(
      invoice.items,
      10,
    );

  const paymentsPage =
    usePagination(
      invoice.payments,
      10,
    );

  /*
  |--------------------------------------------------------------------------
  | Activity Timeline
  |--------------------------------------------------------------------------
  */

  const activity =
    useMemo(() => {
      const events: {
        id: string;
        at: string;
        title: string;
        detail?: string;
        tone?:
          | "default"
          | "success"
          | "warning"
          | "danger";
      }[] = [];

      /*
      |--------------------------------------------------------------------------
      | Invoice Created
      |--------------------------------------------------------------------------
      */

      if (
        invoice.audit.created_at
      ) {
        events.push({
          id: "created",
          at: invoice.audit.created_at,
          title:
            "Invoice created",
          detail:
            invoice.audit
              .created_by
              ? `By ${invoice.audit.created_by.name}`
              : undefined,
          tone: "default",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Invoice Issued
      |--------------------------------------------------------------------------
      */

      if (
        invoice.dates
          .issued_at
      ) {
        events.push({
          id: "issued",
          at: invoice.dates.issued_at,
          title:
            "Invoice issued",
          detail:
            invoice.audit
              .issued_by
              ? `By ${invoice.audit.issued_by.name}`
              : undefined,
          tone: "default",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Payments
      |--------------------------------------------------------------------------
      */

      invoice.payments.forEach(
        (
          payment,
        ) => {
          if (
            !payment.payment_date
          ) {
            return;
          }

          const paymentStatus =
            PAYMENT_STATUS_CONFIG[
              payment.status
            ];

          const receivedBy =
            payment
              .received_by
              ?.name;

          const verifiedBy =
            payment
              .verified_by
              ?.name;

          let detail =
            `${formatCurrency(
              payment.amount,
              payment.currency ||
                currency,
            )} via ${
              payment.payment_method
            } · ${
              paymentStatus.label
            }`;

          if (
            receivedBy
          ) {
            detail += ` · received by ${receivedBy}`;
          }

          if (
            verifiedBy &&
            payment.status !==
              "PENDING"
          ) {
            detail += ` · reviewed by ${verifiedBy}`;
          }

          events.push({
            id: payment.id,
            at: payment.payment_date,
            title: `Payment ${payment.payment_number}`,
            detail,
            tone:
              payment.status ===
              "SUCCESS"
                ? "success"
                : payment.status ===
                    "FAILED"
                  ? "danger"
                  : payment.status ===
                      "PENDING"
                    ? "warning"
                    : "default",
          });
        },
      );

      /*
      |--------------------------------------------------------------------------
      | Invoice Fully Paid
      |--------------------------------------------------------------------------
      */

      if (
        invoice.dates.paid_at
      ) {
        events.push({
          id: "paid",
          at: invoice.dates.paid_at,
          title:
            "Invoice fully paid",
          detail:
            "The invoice balance has been fully settled.",
          tone: "success",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Invoice Cancelled
      |--------------------------------------------------------------------------
      */

      if (
        invoice.dates
          .cancelled_at
      ) {
        events.push({
          id: "cancelled",
          at: invoice.dates.cancelled_at,
          title:
            "Invoice cancelled",
          detail:
            invoice.cancellation
              .cancelled_by
              ? `By ${invoice.cancellation.cancelled_by.name}`
              : invoice.cancellation
                    .reason ||
                undefined,
          tone: "warning",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Invoice Voided
      |--------------------------------------------------------------------------
      */

      if (
        invoice.dates
          .voided_at
      ) {
        events.push({
          id: "voided",
          at: invoice.dates.voided_at,
          title:
            "Invoice voided",
          detail:
            invoice.void
              .voided_by
              ? `By ${invoice.void.voided_by.name}`
              : invoice.void.reason ||
                undefined,
          tone: "danger",
        });
      }

      return events.sort(
        (a, b) =>
          new Date(
            b.at,
          ).getTime() -
          new Date(
            a.at,
          ).getTime(),
      );
    }, [
      invoice,
      currency,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6">

        {/*
        |--------------------------------------------------------------------------
        | HEADER
        |--------------------------------------------------------------------------
        */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">

            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                router.back()
              }
              aria-label="Go back"
              className="mt-0.5"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div>
              <div className="flex flex-wrap items-center gap-3">

                <h1 className="text-2xl font-semibold tracking-tight">
                  {
                    invoice.invoice_number
                  }
                </h1>

                <Badge
                  variant="outline"
                  className={
                    status.className
                  }
                >
                  {
                    status.label
                  }
                </Badge>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {
                  invoice.citizen
                    ?.name ??
                  "Unknown citizen"
                }{" "}
                ·{" "}
                {
                  SOURCE_LABEL[
                    invoice
                      .source_type
                  ]
                }{" "}
                invoice
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">

            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/office/dashboard/invoices/${encodeURIComponent(
                    invoice.id,
                  )}/print`,
                )
              }
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>

            {/* {canCollect && (
              <Button
                onClick={() =>
                  router.push(
                    `/office/dashboard/payments/create?invoice_id=${encodeURIComponent(
                      invoice.id,
                    )}`,
                  )
                }
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Record payment
              </Button>
            )} */}

          </div>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | STATE CALLOUTS
        |--------------------------------------------------------------------------
        */}

        {invoice.cancellation
          .reason && (
          <Callout
            tone="orange"
            title="This invoice was cancelled"
          >
            {
              invoice
                .cancellation
                .reason
            }
          </Callout>
        )}

        {invoice.void.reason && (
          <Callout
            tone="gray"
            title="This invoice was voided"
          >
            {
              invoice.void
                .reason
            }
          </Callout>
        )}

        {/*
        |--------------------------------------------------------------------------
        | KEY FACTS
        |--------------------------------------------------------------------------
        */}

        <Card className="overflow-hidden">
          <div className="flex flex-col divide-y sm:flex-row sm:divide-x sm:divide-y-0">

            <KeyFact
              label="Total"
              value={formatCurrency(
                financial.total_amount,
                currency,
              )}
            />

            <KeyFact
              label="Paid"
              value={formatCurrency(
                financial.paid_amount,
                currency,
              )}
              valueClassName="text-emerald-600"
              caption={`${progress}% of total`}
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
                  : undefined
              }
            />

            <KeyFact
              label="Due date"
              value={formatDate(
                invoice.dates
                  .due_date,
              )}
              valueClassName={
                dueTone
              }
              caption={
                dueCaption
              }
            />

          </div>

          <Progress
            value={progress}
            className="h-1 rounded-none"
          />
        </Card>

        {/*
        |--------------------------------------------------------------------------
        | TABS
        |--------------------------------------------------------------------------
        */}

        <Tabs
          value={tab}
          onValueChange={
            setTab
          }
          className="space-y-4"
        >

          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto sm:w-auto">

            <TabsTrigger value="overview">
              Overview
            </TabsTrigger>

            <TabsTrigger value="items">
              Items

              <span className="ml-1.5 text-xs text-muted-foreground">
                {
                  invoice.items
                    .length
                }
              </span>
            </TabsTrigger>

            <TabsTrigger value="payments">
              Payments

              <span className="ml-1.5 text-xs text-muted-foreground">
                {
                  invoice
                    .payments
                    .length
                }
              </span>
            </TabsTrigger>

            <TabsTrigger value="activity">
              Activity
            </TabsTrigger>

          </TabsList>

          {/*
          |--------------------------------------------------------------------------
          | OVERVIEW
          |--------------------------------------------------------------------------
          */}

          <TabsContent
            value="overview"
            className="space-y-6"
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

              <div className="space-y-6">

                {/*
                |--------------------------------------------------------------------------
                | TAXPAYER
                |--------------------------------------------------------------------------
                */}

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
                          label:
                            "Name",
                          value:
                            invoice
                              .citizen
                              ?.name ??
                            "—",
                        },

                        {
                          label:
                            "Citizen no.",
                          value:
                            invoice
                              .citizen
                              ?.citizen_number ??
                            "—",
                        },

                        {
                          label:
                            "Phone",
                          value:
                            invoice
                              .citizen
                              ?.phone ??
                            "—",
                        },

                        {
                          label:
                            "Email",
                          value:
                            invoice
                              .citizen
                              ?.email ??
                            "—",
                        },
                      ]}
                    />
                  </CardContent>
                </Card>

                {/*
                |--------------------------------------------------------------------------
                | INVOICE DETAILS
                |--------------------------------------------------------------------------
                */}

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
                          label:
                            "Invoice no.",
                          value:
                            invoice.invoice_number,
                        },

                        {
                          label:
                            "Source",
                          value:
                            SOURCE_LABEL[
                              invoice
                                .source_type
                            ],
                        },

                        {
                          label:
                            "Administrative unit",
                          value:
                            invoice
                              .administrative_unit
                              ? `${invoice.administrative_unit.name} (${invoice.administrative_unit.code})`
                              : "—",
                        },

                        ...(invoice.source_type ===
                        "ASSESSMENT"
                          ? [
                              {
                                label:
                                  "Assessment",
                                value:
                                  invoice
                                    .assessment
                                    ? `${invoice.assessment.assessment_number} · ${invoice.assessment.status}`
                                    : "—",
                              },
                            ]
                          : []),

                        {
                          label:
                            "Issued",
                          value:
                            formatDate(
                              invoice
                                .dates
                                .issued_at,
                            ),
                        },

                        {
                          label:
                            "Due date",
                          value:
                            formatDate(
                              invoice
                                .dates
                                .due_date,
                            ),
                        },
                      ]}
                    />

                    {invoice.source_type ===
                      "DIRECT_COLLECTION" && (
                      <p className="mt-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                        Created during direct collection. Not linked to an assessment.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/*
                |--------------------------------------------------------------------------
                | PAYMENT SUMMARY
                |--------------------------------------------------------------------------
                */}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Payment activity
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-3">

                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">
                          Successful
                        </p>

                        <p className="mt-1 text-lg font-semibold text-emerald-600">
                          {
                            successfulPayments.length
                          }
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(
                            successfulPaymentTotal,
                            currency,
                          )}
                        </p>
                      </div>

                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">
                          Pending
                        </p>

                        <p className="mt-1 text-lg font-semibold text-amber-600">
                          {
                            pendingPayments.length
                          }
                        </p>
                      </div>

                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">
                          Failed
                        </p>

                        <p className="mt-1 text-lg font-semibold text-red-600">
                          {
                            failedPayments.length
                          }
                        </p>
                      </div>

                    </div>
                  </CardContent>
                </Card>

                {/*
                |--------------------------------------------------------------------------
                | NOTES
                |--------------------------------------------------------------------------
                */}

                {invoice.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Notes
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {
                          invoice.notes
                        }
                      </p>
                    </CardContent>
                  </Card>
                )}

              </div>

              {/*
              |--------------------------------------------------------------------------
              | FINANCIAL SUMMARY
              |--------------------------------------------------------------------------
              */}

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-base">
                    Financial summary
                  </CardTitle>
                </CardHeader>

                <CardContent>

                  <SummaryLine
                    label="Subtotal"
                    amount={
                      financial.subtotal
                    }
                    currency={
                      currency
                    }
                  />

                  <SummaryLine
                    label="Discount"
                    amount={
                      financial.discount_amount
                    }
                    currency={
                      currency
                    }
                    negative
                  />

                  <SummaryLine
                    label="Penalty"
                    amount={
                      financial.penalty_amount
                    }
                    currency={
                      currency
                    }
                  />

                  <SummaryLine
                    label="Interest"
                    amount={
                      financial.interest_amount
                    }
                    currency={
                      currency
                    }
                  />

                  <Separator className="my-3" />

                  <SummaryLine
                    label="Invoice total"
                    amount={
                      financial.total_amount
                    }
                    currency={
                      currency
                    }
                    bold
                  />

                  <SummaryLine
                    label="Paid"
                    amount={
                      financial.paid_amount
                    }
                    currency={
                      currency
                    }
                    negative
                  />

                  <Separator className="my-3" />

                  <SummaryLine
                    label="Balance due"
                    amount={
                      financial.balance_due
                    }
                    currency={
                      currency
                    }
                    bold
                  />

                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/*
          |--------------------------------------------------------------------------
          | ITEMS
          |--------------------------------------------------------------------------
          */}

          <TabsContent value="items">
            <Card>
              <CardContent className="p-0">

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
                      {itemsPage.pageRows.map(
                        (
                          item,
                        ) => (
                          <tr
                            key={
                              item.id
                            }
                            className="border-b transition-colors last:border-0 hover:bg-muted/30"
                          >

                            <td className="px-5 py-4 text-muted-foreground">
                              {
                                item.line_number
                              }
                            </td>

                            <td className="px-5 py-4">

                              <p className="font-medium">
                                {
                                  item.description
                                }
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {
                                  item.service
                                    ?.name ??
                                  "—"
                                }

                                {item.service
                                  ?.code && (
                                  <>
                                    {" "}
                                    ·{" "}
                                    {
                                      item
                                        .service
                                        .code
                                    }
                                  </>
                                )}
                              </p>

                            </td>

                            <td className="px-5 py-4 text-right">
                              {
                                item.quantity ??
                                "—"
                              }

                              {item.unit && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  {
                                    item.unit
                                  }
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4 text-right">
                              {item.unit_price !==
                              null
                                ? formatCurrency(
                                    item.unit_price,
                                    item.currency,
                                  )
                                : "—"}
                            </td>

                            <td className="px-5 py-4 text-right text-emerald-600">
                              {toNumber(
                                item.discount_amount,
                              ) >
                              0
                                ? `−${formatCurrency(
                                    item.discount_amount,
                                    item.currency,
                                  )}`
                                : "—"}
                            </td>

                            <td className="px-5 py-4 text-right">
                              {toNumber(
                                item.penalty_amount,
                              ) >
                              0
                                ? formatCurrency(
                                    item.penalty_amount,
                                    item.currency,
                                  )
                                : "—"}
                            </td>

                            <td className="px-5 py-4 text-right">
                              {toNumber(
                                item.interest_amount,
                              ) >
                              0
                                ? formatCurrency(
                                    item.interest_amount,
                                    item.currency,
                                  )
                                : "—"}
                            </td>

                            <td className="px-5 py-4 text-right font-medium">
                              {formatCurrency(
                                item.total_amount,
                                item.currency,
                              )}
                            </td>

                          </tr>
                        ),
                      )}
                    </tbody>

                    <tfoot>
                      <tr className="border-t bg-muted/40">

                        <td
                          colSpan={
                            7
                          }
                          className="px-5 py-3 text-right font-medium"
                        >
                          Invoice total
                        </td>

                        <td className="px-5 py-3 text-right font-semibold">
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
                  page={
                    itemsPage.page
                  }
                  pageSize={
                    itemsPage.pageSize
                  }
                  pageCount={
                    itemsPage.pageCount
                  }
                  total={
                    itemsPage.total
                  }
                  noun="items"
                  onPageChange={
                    itemsPage.setPage
                  }
                  onPageSizeChange={
                    itemsPage.setPageSize
                  }
                />

              </CardContent>
            </Card>
          </TabsContent>

          {/*
          |--------------------------------------------------------------------------
          | PAYMENTS
          |--------------------------------------------------------------------------
          */}

          <TabsContent value="payments">
            <Card>
              <CardContent className="p-0">

                {invoice.payments
                  .length ===
                0 ? (
                  <div className="flex flex-col items-center gap-2 p-10 text-center">

                    <Banknote className="h-8 w-8 text-muted-foreground" />

                    <p className="font-medium">
                      No payments yet
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Payments made against this invoice will appear here.
                    </p>

                  </div>
                ) : (

                  <div className="overflow-x-auto">

                    <table className="w-full text-sm tabular-nums">

                      <thead>
                        <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">

                          <th className="px-5 py-3 font-medium">
                            Payment no.
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

                        {paymentsPage.pageRows.map(
                          (
                            payment,
                          ) => {

                            const paymentStatus =
                              PAYMENT_STATUS_CONFIG[
                                payment.status
                              ];

                            const isSuccessful =
                              payment.status ===
                              "SUCCESS";

                            return (
                              <tr
                                key={
                                  payment.id
                                }
                                className="border-b transition-colors last:border-0 hover:bg-muted/30"
                              >

                                <td className="px-5 py-4 font-medium">
                                  {
                                    payment.payment_number
                                  }
                                </td>

                                <td className="px-5 py-4">
                                  {formatDateTime(
                                    payment.payment_date,
                                  )}
                                </td>

                                <td className="px-5 py-4">
                                  {
                                    payment.payment_method
                                  }
                                </td>

                                <td className="px-5 py-4">
                                  {
                                    payment.payment_provider
                                  }
                                </td>

                                <td className="px-5 py-4">

                                  <div>
                                    <p className="font-medium">
                                      {
                                        payment.transaction_reference ??
                                        "—"
                                      }
                                    </p>

                                    {payment.provider_reference && (
                                      <p className="mt-0.5 text-xs text-muted-foreground">
                                        Provider:{" "}
                                        {
                                          payment.provider_reference
                                        }
                                      </p>
                                    )}
                                  </div>

                                </td>

                                <td className="px-5 py-4">
                                  {
                                    payment
                                      .received_by
                                      ?.name ??
                                    "—"
                                  }
                                </td>

                                <td className="px-5 py-4">

                                  <span className="inline-flex items-center gap-1.5">

                                    <span
                                      className={cn(
                                        "size-1.5 rounded-full",
                                        paymentStatus.dot,
                                      )}
                                    />

                                    {
                                      paymentStatus.label
                                    }

                                  </span>

                                </td>

                                <td
                                  className={cn(
                                    "px-5 py-4 text-right font-semibold",
                                    !isSuccessful &&
                                      "text-muted-foreground",
                                    payment.status ===
                                      "REFUNDED" &&
                                      "line-through",
                                  )}
                                >
                                  {formatCurrency(
                                    payment.amount,
                                    payment.currency ||
                                      currency,
                                  )}
                                </td>

                              </tr>
                            );
                          },
                        )}

                      </tbody>

                      <tfoot>
                        <tr className="border-t bg-muted/40">

                          <td
                            colSpan={
                              7
                            }
                            className="px-5 py-3 text-right font-medium"
                          >
                            Total received (
                            {
                              successfulPayments.length
                            }{" "}
                            successful)
                          </td>

                          <td className="px-5 py-3 text-right font-semibold">

                            {formatCurrency(
                              successfulPaymentTotal,
                              currency,
                            )}

                          </td>

                        </tr>
                      </tfoot>

                    </table>

                  </div>
                )}

                {invoice.payments
                  .length >
                  0 && (
                  <TablePagination
                    page={
                      paymentsPage.page
                    }
                    pageSize={
                      paymentsPage.pageSize
                    }
                    pageCount={
                      paymentsPage.pageCount
                    }
                    total={
                      paymentsPage.total
                    }
                    noun="payments"
                    onPageChange={
                      paymentsPage.setPage
                    }
                    onPageSizeChange={
                      paymentsPage.setPageSize
                    }
                  />
                )}

              </CardContent>
            </Card>
          </TabsContent>

          {/*
          |--------------------------------------------------------------------------
          | ACTIVITY
          |--------------------------------------------------------------------------
          */}

          <TabsContent value="activity">

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

              <Card>

                <CardHeader>
                  <CardTitle className="text-base">
                    Timeline
                  </CardTitle>
                </CardHeader>

                <CardContent>

                  {activity.length ===
                  0 ? (
                    <p className="text-sm text-muted-foreground">
                      No activity recorded.
                    </p>
                  ) : (

                    <ol className="relative space-y-6 border-l pl-6">

                      {activity.map(
                        (
                          event,
                        ) => {

                          const Icon =
                            event.tone ===
                            "success"
                              ? CheckCircle2
                              : event.tone ===
                                  "danger"
                                ? XCircle
                                : event.tone ===
                                    "warning"
                                  ? AlertCircle
                                  : FileText;

                          return (
                            <li
                              key={
                                event.id
                              }
                              className="relative"
                            >

                              <span className="absolute -left-[31px] top-0.5 flex size-5 items-center justify-center rounded-full border bg-background">

                                <Icon
                                  className={cn(
                                    "size-3",
                                    event.tone ===
                                      "success" &&
                                      "text-emerald-600",
                                    event.tone ===
                                      "danger" &&
                                      "text-red-600",
                                    event.tone ===
                                      "warning" &&
                                      "text-amber-600",
                                    event.tone ===
                                      "default" &&
                                      "text-muted-foreground",
                                  )}
                                />

                              </span>

                              <p className="text-sm font-medium">
                                {
                                  event.title
                                }
                              </p>

                              {event.detail && (
                                <p className="text-sm text-muted-foreground">
                                  {
                                    event.detail
                                  }
                                </p>
                              )}

                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {formatDateTime(
                                  event.at,
                                )}
                              </p>

                            </li>
                          );
                        },
                      )}

                    </ol>
                  )}

                </CardContent>

              </Card>

              <Card className="h-fit">

                <CardHeader>
                  <CardTitle className="text-base">
                    Audit
                  </CardTitle>
                </CardHeader>

                <CardContent>

                  <DetailList
                    rows={[
                      {
                        label:
                          "Created by",
                        value:
                          invoice
                            .audit
                            .created_by
                            ?.name ??
                          "—",
                      },

                      {
                        label:
                          "Issued by",
                        value:
                          invoice
                            .audit
                            .issued_by
                            ?.name ??
                          "—",
                      },

                      {
                        label:
                          "Created",
                        value:
                          formatDateTime(
                            invoice
                              .audit
                              .created_at,
                          ),
                      },

                      {
                        label:
                          "Last updated",
                        value:
                          formatDateTime(
                            invoice
                              .audit
                              .updated_at,
                          ),
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