"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  ReceiptText,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useTaxpayerInvoice } from "@/hooks/taxpayer/use-taxpayer-invoices";
import type { TaxpayerInvoice } from "@/types/taxpayer/invoice";

/* ==========================================================================
 * PAGE
 * ======================================================================== */

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = params?.id;

  const {
    data: invoice,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useTaxpayerInvoice(invoiceId);

  if (isLoading) {
    return <InvoiceDetailSkeleton />;
  }

  if (isError || !invoice) {
    return (
      <InvoiceDetailError
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const payable = isInvoicePayable(invoice);
  const displayStatus = getDisplayStatus(invoice);

  return (
    <div className="min-w-0">
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* ==================================================================
         * HEADER
         * ================================================================== */}

        <header className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="mt-0.5 shrink-0"
              >
                <Link href="/citizen/dashboard/invoices">
                  <ArrowLeft className="size-4" />

                  <span className="sr-only">
                    Back to invoices
                  </span>
                </Link>
              </Button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="break-all text-2xl font-semibold tracking-tight">
                    {invoice.invoice_number}
                  </h1>

                  <InvoiceStatusBadge
                    status={displayStatus}
                  />
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  {getSourceLabel(invoice.source_type)}
                  {" · "}
                  Invoice details
                </p>
              </div>
            </div>

            {isFetching && !isLoading && (
              <span
                className="shrink-0 text-xs text-muted-foreground"
                aria-live="polite"
              >
                Updating...
              </span>
            )}
          </div>

          {/* Outstanding payment notice */}
          {payable && (
            <PaymentAttentionBanner
              invoice={invoice}
            />
          )}

          {/* Paid notice */}
          {invoice.is_fully_paid && (
            <PaidBanner invoice={invoice} />
          )}
        </header>

        {/* ==================================================================
         * INVOICE INFORMATION
         * ================================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard
            icon={<ReceiptText className="size-4" />}
            label="Invoice number"
            value={invoice.invoice_number}
          />

          <InfoCard
            icon={<FileText className="size-4" />}
            label="Source"
            value={getSourceLabel(invoice.source_type)}
          />

          <InfoCard
            icon={<CalendarDays className="size-4" />}
            label="Issued"
            value={formatDate(invoice.issued_at)}
          />

          <InfoCard
            icon={<CalendarDays className="size-4" />}
            label="Due date"
            value={formatDate(invoice.due_date)}
            hint={getDueHint(invoice)}
          />
        </div>

        {/* ==================================================================
         * MAIN CONTENT
         * ================================================================== */}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* =================================================================
           * INVOICE ITEMS
           * ================================================================= */}

          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    Invoice items
                  </CardTitle>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Charges included in this invoice
                  </p>
                </div>

                {invoice.items?.length ? (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {invoice.items.length}{" "}
                    {invoice.items.length === 1
                      ? "item"
                      : "items"}
                  </span>
                ) : null}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {invoice.items?.length ? (
                <>
                  {/* ==========================================================
                   * DESKTOP TABLE
                   * ======================================================== */}

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                          <th className="w-14 px-4 py-3 text-center font-medium">
                            No.
                          </th>

                          <th className="px-3 py-3 text-left font-medium">
                            Description
                          </th>

                          <th className="px-3 py-3 text-right font-medium">
                            Qty
                          </th>

                          <th className="px-3 py-3 text-right font-medium">
                            Unit price
                          </th>

                          <th className="px-4 py-3 text-right font-medium">
                            Amount
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y">
                        {invoice.items.map(
                          (item, index) => (
                            <tr
                              key={item.id}
                              className="transition-colors hover:bg-muted/20"
                            >
                              <td className="px-4 py-4 text-center tabular-nums text-muted-foreground">
                                {item.line_number ||
                                  index + 1}
                              </td>

                              <td className="min-w-[240px] px-3 py-4">
                                <div className="font-medium">
                                  {item.service_name ||
                                    item.description ||
                                    "Invoice item"}
                                </div>

                                {item.service_name &&
                                  item.description && (
                                    <div className="mt-1 max-w-lg text-xs leading-5 text-muted-foreground">
                                      {
                                        item.description
                                      }
                                    </div>
                                  )}
                              </td>

                              <td className="px-3 py-4 text-right tabular-nums text-muted-foreground">
                                {item.quantity ?? "—"}

                                {item.unit
                                  ? ` ${item.unit}`
                                  : ""}
                              </td>

                              <td className="px-3 py-4 text-right tabular-nums">
                                {item.unit_price !==
                                null
                                  ? formatMoney(
                                      item.currency ||
                                        invoice.currency,
                                      item.unit_price,
                                    )
                                  : "—"}
                              </td>

                              <td className="px-4 py-4 text-right font-medium tabular-nums">
                                {formatMoney(
                                  item.currency ||
                                    invoice.currency,
                                  item.total_amount,
                                )}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ==========================================================
                   * MOBILE ITEMS
                   * ======================================================== */}

                  <div className="divide-y md:hidden">
                    {invoice.items.map(
                      (item, index) => (
                        <div
                          key={item.id}
                          className="space-y-4 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium tabular-nums text-muted-foreground">
                              {item.line_number ||
                                index + 1}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="font-medium">
                                {item.service_name ||
                                  item.description ||
                                  "Invoice item"}
                              </p>

                              {item.service_name &&
                                item.description && (
                                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                    {
                                      item.description
                                    }
                                  </p>
                                )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/20 p-3">
                            <DetailValue
                              label="Quantity"
                              value={`${item.quantity ?? "—"}${
                                item.unit
                                  ? ` ${item.unit}`
                                  : ""
                              }`}
                            />

                            <DetailValue
                              label="Unit price"
                              value={
                                item.unit_price !==
                                null
                                  ? formatMoney(
                                      item.currency ||
                                        invoice.currency,
                                      item.unit_price,
                                    )
                                  : "—"
                              }
                              align="right"
                            />

                            <div className="col-span-2 flex items-center justify-between border-t pt-3">
                              <span className="text-sm text-muted-foreground">
                                Amount
                              </span>

                              <span className="text-sm font-semibold tabular-nums">
                                {formatMoney(
                                  item.currency ||
                                    invoice.currency,
                                  item.total_amount,
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </>
              ) : (
                <EmptyItems />
              )}
            </CardContent>
          </Card>

          {/* =================================================================
           * FINANCIAL SUMMARY
           * ================================================================= */}

          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader className="border-b">
              <CardTitle className="text-base">
                Amount summary
              </CardTitle>

              <p className="text-xs text-muted-foreground">
                Complete invoice calculation
              </p>
            </CardHeader>

            <CardContent className="space-y-4 pt-5">
              {/* Base amount */}
              <AmountRow
                label="Subtotal"
                value={formatMoney(
                  invoice.currency,
                  invoice.subtotal,
                )}
              />

              {/* Discount */}
              <AmountRow
                label="Discount"
                value={
                  Number(invoice.discount_amount) >
                  0
                    ? `- ${formatMoney(
                        invoice.currency,
                        invoice.discount_amount,
                      )}`
                    : formatMoney(
                        invoice.currency,
                        invoice.discount_amount,
                      )
                }
                valueClassName={
                  Number(invoice.discount_amount) >
                  0
                    ? "text-green-700"
                    : undefined
                }
              />

              {/* Penalty */}
              <AmountRow
                label="Penalty"
                value={formatMoney(
                  invoice.currency,
                  invoice.penalty_amount,
                )}
                valueClassName={
                  Number(invoice.penalty_amount) >
                  0
                    ? "text-red-600"
                    : undefined
                }
              />

              {/* Interest */}
              <AmountRow
                label="Interest"
                value={formatMoney(
                  invoice.currency,
                  invoice.interest_amount,
                )}
                valueClassName={
                  Number(invoice.interest_amount) >
                  0
                    ? "text-red-600"
                    : undefined
                }
              />

              {/* Total */}
              <div className="border-t pt-4">
                <AmountRow
                  label="Total invoice amount"
                  value={formatMoney(
                    invoice.currency,
                    invoice.total_amount,
                  )}
                  strong
                />
              </div>

              {/* Paid */}
              <AmountRow
                label="Paid amount"
                value={formatMoney(
                  invoice.currency,
                  invoice.paid_amount,
                )}
              />

              {/* Balance */}
              <div className="rounded-xl border bg-muted/40 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">
                      Balance due
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {invoice.is_fully_paid
                        ? "No remaining amount."
                        : "Amount remaining to be paid."}
                    </p>
                  </div>

                  <span className="text-lg font-bold tabular-nums">
                    {formatMoney(
                      invoice.currency,
                      invoice.balance_due,
                    )}
                  </span>
                </div>
              </div>

              {/* Payment */}
              {payable && (
                <Button
                  asChild
                  size="lg"
                  className="h-11 w-full"
                >
                  <Link
                    href={`/citizen/dashboard/invoices/${invoice.id}/pay`}
                  >
                    <CreditCard className="mr-2 size-4" />
                    Pay invoice
                  </Link>
                </Button>
              )}

              {/* Paid timestamp */}
              {invoice.paid_at && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-3.5" />

                  <span>
                    Paid on{" "}
                    {formatDateTime(
                      invoice.paid_at,
                    )}
                  </span>
                </div>
              )}

              {!payable &&
                !invoice.is_fully_paid &&
                invoice.status !== "CANCELLED" && (
                  <p className="text-center text-xs leading-5 text-muted-foreground">
                    This invoice currently cannot be
                    paid online.
                  </p>
                )}
            </CardContent>
          </Card>
        </div>

        {/* ==================================================================
         * FOOTER
         * ================================================================== */}

        <div className="border-t pt-4">
          <Button asChild variant="outline">
            <Link href="/citizen/dashboard/invoices">
              <ArrowLeft className="mr-2 size-4" />
              Back to invoices
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
 * PAYMENT ATTENTION BANNER
 * ======================================================================== */

function PaymentAttentionBanner({
  invoice,
}: {
  invoice: TaxpayerInvoice;
}) {
  const overdue = invoice.is_overdue;

  return (
    <div
      className={
        overdue
          ? "flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          : "flex flex-col gap-4 rounded-xl border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between"
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            overdue
              ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700"
              : "flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground"
          }
        >
          <CreditCard className="size-4" />
        </div>

        <div>
          <p
            className={
              overdue
                ? "text-sm font-semibold text-red-800"
                : "text-sm font-semibold"
            }
          >
            {overdue
              ? "Payment is overdue"
              : "Payment is outstanding"}
          </p>

          <p
            className={
              overdue
                ? "mt-1 text-xs leading-5 text-red-700"
                : "mt-1 text-xs leading-5 text-muted-foreground"
            }
          >
            {overdue
              ? "This invoice has an outstanding balance and is past its due date."
              : "This invoice has an outstanding balance that can be paid."}
          </p>
        </div>
      </div>

      <Button
        asChild
        variant={
          overdue ? "destructive" : "default"
        }
        className="w-full sm:w-auto"
      >
        <Link
          href={`/citizen/dashboard/invoices/${invoice.id}/pay`}
        >
          <CreditCard className="mr-2 size-4" />
          Pay{" "}
          {formatMoney(
            invoice.currency,
            invoice.balance_due,
          )}
        </Link>
      </Button>
    </div>
  );
}

/* ==========================================================================
 * PAID BANNER
 * ======================================================================== */

function PaidBanner({
  invoice,
}: {
  invoice: TaxpayerInvoice;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background">
        <CheckCircle2 className="size-4 text-muted-foreground" />
      </div>

      <div>
        <p className="text-sm font-semibold">
          Invoice fully paid
        </p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          This invoice has no remaining balance.
          {invoice.paid_at
            ? ` Payment completed on ${formatDateTime(
                invoice.paid_at,
              )}.`
            : ""}
        </p>
      </div>
    </div>
  );
}

/* ==========================================================================
 * INFO CARD
 * ======================================================================== */

function InfoCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {label}
          </p>

          <p className="mt-1 truncate text-sm font-medium">
            {value}
          </p>

          {hint && (
            <p className="mt-1 text-xs text-muted-foreground">
              {hint}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ==========================================================================
 * DETAIL VALUE
 * ======================================================================== */

function DetailValue({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={
        align === "right"
          ? "text-right"
          : undefined
      }
    >
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium tabular-nums">
        {value}
      </p>
    </div>
  );
}

/* ==========================================================================
 * AMOUNT ROW
 * ======================================================================== */

function AmountRow({
  label,
  value,
  strong = false,
  valueClassName,
}: {
  label: string;
  value: string;
  strong?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong
            ? "text-sm font-semibold"
            : "text-sm text-muted-foreground"
        }
      >
        {label}
      </span>

      <span
        className={[
          strong
            ? "text-sm font-semibold"
            : "text-sm font-medium",
          "tabular-nums",
          valueClassName ?? "",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

/* ==========================================================================
 * STATUS
 * ======================================================================== */

function InvoiceStatusBadge({
  status,
}: {
  status: string;
}) {
  const config: Record<
    string,
    {
      label: string;
      className?: string;
    }
  > = {
    DRAFT: {
      label: "Draft",
    },

    ISSUED: {
      label: "Unpaid",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    },

    PARTIALLY_PAID: {
      label: "Partially paid",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
    },

    PAID: {
      label: "Paid",
      className:
        "border-green-200 bg-green-50 text-green-700",
    },

    OVERDUE: {
      label: "Overdue",
      className:
        "border-red-200 bg-red-50 text-red-700",
    },

    CANCELLED: {
      label: "Cancelled",
      className:
        "border-muted bg-muted text-muted-foreground",
    },
  };

  const current = config[status] ?? {
    label: formatStatus(status),
  };

  return (
    <Badge
      variant="outline"
      className={current.className}
    >
      {current.label}
    </Badge>
  );
}

/* ==========================================================================
 * EMPTY ITEMS
 * ======================================================================== */

function EmptyItems() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <FileText className="size-5 text-muted-foreground" />
      </div>

      <p className="mt-4 text-sm font-medium">
        No invoice items
      </p>

      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        Item-level details are not available for
        this invoice.
      </p>
    </div>
  );
}

/* ==========================================================================
 * ERROR
 * ======================================================================== */

function InvoiceDetailError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[500px] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <FileText className="size-6 text-muted-foreground" />
          </div>

          <h2 className="mt-4 text-lg font-semibold">
            Unable to load invoice
          </h2>

          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            We could not load this invoice. Please try
            again.
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button onClick={onRetry}>
              Try again
            </Button>

            <Button asChild variant="outline">
              <Link href="/citizen/dashboard/invoices">
                Back to invoices
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ==========================================================================
 * LOADING
 * ======================================================================== */

function InvoiceDetailSkeleton() {
  return (
    <div className="min-w-0 animate-pulse">
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-md bg-muted" />

            <div className="space-y-2">
              <div className="h-7 w-56 rounded bg-muted" />
              <div className="h-4 w-72 rounded bg-muted" />
            </div>
          </div>

          <div className="h-20 w-full rounded-xl bg-muted" />
        </div>

        {/* Info */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <CardContent className="p-4">
                <div className="h-4 w-24 rounded bg-muted" />

                <div className="mt-3 h-5 w-36 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="h-5 w-32 rounded bg-muted" />

              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-12 w-full rounded bg-muted"
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="h-5 w-36 rounded bg-muted" />

              {[1, 2, 3, 4, 5, 6, 7].map(
                (item) => (
                  <div
                    key={item}
                    className="h-5 w-full rounded bg-muted"
                  />
                ),
              )}

              <div className="h-14 w-full rounded bg-muted" />

              <div className="h-11 w-full rounded bg-muted" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
 * BUSINESS LOGIC
 * ======================================================================== */

function isInvoicePayable(
  invoice: TaxpayerInvoice,
): boolean {
  return (
    !invoice.is_fully_paid &&
    Number(invoice.balance_due) > 0 &&
    [
      "ISSUED",
      "PARTIALLY_PAID",
      "OVERDUE",
    ].includes(invoice.status)
  );
}

function getDisplayStatus(
  invoice: TaxpayerInvoice,
): string {
  if (invoice.is_fully_paid) {
    return "PAID";
  }

  if (invoice.is_overdue) {
    return "OVERDUE";
  }

  return invoice.status;
}

function getDueHint(
  invoice: TaxpayerInvoice,
): string | undefined {
  if (!invoice.due_date) {
    return undefined;
  }

  if (invoice.is_fully_paid) {
    return "Payment completed";
  }

  if (invoice.is_overdue) {
    return "Payment overdue";
  }

  if (Number(invoice.balance_due) <= 0) {
    return "No balance remaining";
  }

  const dueDate = parseDate(invoice.due_date);

  if (!dueDate) {
    return undefined;
  }

  const today = startOfDay(new Date());

  const difference =
    dueDate.getTime() - today.getTime();

  const days = Math.round(
    difference / (1000 * 60 * 60 * 24),
  );

  if (days === 0) {
    return "Due today";
  }

  if (days === 1) {
    return "Due tomorrow";
  }

  if (days > 1 && days <= 30) {
    return `Due in ${days} days`;
  }

  return undefined;
}

/* ==========================================================================
 * SOURCE
 * ======================================================================== */

function getSourceLabel(
  sourceType: string,
): string {
  const labels: Record<string, string> = {
    ASSESSMENT: "Assessment",
    EXISTING_LIZZ: "Existing LIZZ",
  };

  return (
    labels[sourceType] ||
    formatStatus(sourceType)
  );
}

/* ==========================================================================
 * FORMATTING
 * ======================================================================== */

function formatStatus(
  value: string,
): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatMoney(
  currency: string,
  value: string | number,
): string {
  return `${currency} ${formatAmount(value)}`;
}

function formatAmount(
  value: string | number,
): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "—";
  }

  const date = parseDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function parseDate(
  value: string,
): Date | null {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}