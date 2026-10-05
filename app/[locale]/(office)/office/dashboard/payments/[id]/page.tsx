"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Hash,
  Loader2,
  Printer,
  ShieldCheck,
  Smartphone,
  User,
  Wallet,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { PaymentDetail } from "@/types/payment";

import {
  useCompleteCashPayment,
  usePayment,
} from "@/hooks/payment/payment.hook";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function formatCurrency(
  amount: string | number,
  currency = "ETB",
) {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0))} ${currency}`;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function getPaymentMethodLabel(
  method: PaymentDetail["payment_method"],
) {
  switch (method) {
    case "CASH":
      return "Cash";

    case "BANK_TRANSFER":
      return "Bank transfer";

    case "ONLINE":
      return "Online payment";

    default:
      return method;
  }
}

function getPaymentDate(
  payment: PaymentDetail,
): string | null {
  switch (payment.payment_method) {
    case "CASH":
      return (
        payment.cash_details?.cash_received_at ??
        payment.created_at ??
        null
      );

    case "BANK_TRANSFER":
      return (
        payment.bank_transfer_details?.transfer_date ??
        payment.created_at ??
        null
      );

    case "ONLINE":
      return (
        payment.online_details?.paid_at ??
        payment.created_at ??
        null
      );

    default:
      return payment.created_at ?? null;
  }
}

function getMethodDescription(
  payment: PaymentDetail,
) {
  switch (payment.payment_method) {
    case "CASH":
      return "Municipal office collection";

    case "BANK_TRANSFER":
      return (
        payment.bank_transfer_details?.bank_account
          ?.bank_name ?? "Bank transfer"
      );

    case "ONLINE":
      return (
        payment.online_details?.payment_provider
          ?.name ?? "Online provider"
      );

    default:
      return getPaymentMethodLabel(
        payment.payment_method,
      );
  }
}

/*
|--------------------------------------------------------------------------
| RECEIPT URLS
|--------------------------------------------------------------------------
*/

function getReceiptPath(paymentId: string) {
  return `/office/dashboard/payments/${encodeURIComponent(
    paymentId,
  )}/receipt`;
}

function getPrintReceiptPath(paymentId: string) {
  return `${getReceiptPath(paymentId)}?print=1`;
}

/*
|--------------------------------------------------------------------------
| PAYMENT STATUS
|--------------------------------------------------------------------------
*/

function PaymentStatus({
  status,
}: {
  status: string;
}) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Completed
        </Badge>
      );

    case "PENDING":
      return (
        <Badge
          variant="secondary"
          className="gap-1 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
        >
          <Clock3 className="h-3.5 w-3.5" />
          Pending
        </Badge>
      );

    case "PROCESSING":
      return (
        <Badge
          variant="secondary"
          className="gap-1 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50"
        >
          <Loader2 className="h-3.5 w-3.5" />
          Processing
        </Badge>
      );

    case "FAILED":
      return (
        <Badge
          variant="destructive"
          className="gap-1"
        >
          <XCircle className="h-3.5 w-3.5" />
          Failed
        </Badge>
      );

    case "CANCELLED":
      return (
        <Badge
          variant="secondary"
          className="gap-1 border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-50"
        >
          Cancelled
        </Badge>
      );

    case "EXPIRED":
      return (
        <Badge
          variant="secondary"
          className="gap-1 border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-50"
        >
          Expired
        </Badge>
      );

    case "REVERSED":
      return (
        <Badge
          variant="secondary"
          className="gap-1 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-50"
        >
          Reversed
        </Badge>
      );

    default:
      return (
        <Badge variant="secondary">
          {getStatusLabel(status)}
        </Badge>
      );
  }
}

/*
|--------------------------------------------------------------------------
| PAYMENT STATUS DESCRIPTION
|--------------------------------------------------------------------------
*/

function getStatusDescription(
  payment: PaymentDetail,
) {
  switch (payment.status) {
    case "PENDING":
      if (payment.payment_method === "CASH") {
        return "The cash payment has been recorded and is waiting for completion.";
      }

      if (
        payment.payment_method ===
        "BANK_TRANSFER"
      ) {
        return "The bank transfer is waiting for municipal verification.";
      }

      return "The payment is waiting for processing.";

    case "PROCESSING":
      return "The payment is currently being processed.";

    case "COMPLETED":
      return "Payment has been completed, applied to the invoice, and the official receipt has been generated.";

    case "FAILED":
      return (
        payment.failure_reason ??
        "The payment attempt failed."
      );

    case "CANCELLED":
      return "The payment has been cancelled.";

    case "EXPIRED":
      return "The payment attempt has expired.";

    case "REVERSED":
      return "The payment was completed previously but has since been reversed.";

    default:
      return `Payment is ${getStatusLabel(
        payment.status,
      ).toLowerCase()}.`;
  }
}

/*
|--------------------------------------------------------------------------
| PAYMENT ICON
|--------------------------------------------------------------------------
*/

function PaymentMethodIcon({
  method,
}: {
  method: PaymentDetail["payment_method"];
}) {
  switch (method) {
    case "CASH":
      return (
        <Wallet className="h-4 w-4" />
      );

    case "BANK_TRANSFER":
      return (
        <Building2 className="h-4 w-4" />
      );

    case "ONLINE":
      return (
        <Smartphone className="h-4 w-4" />
      );

    default:
      return (
        <CreditCard className="h-4 w-4" />
      );
  }
}

/*
|--------------------------------------------------------------------------
| DETAIL ROW
|--------------------------------------------------------------------------
*/

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-6">
      <div className="flex min-w-0 items-center gap-2.5 text-sm text-muted-foreground">
        {icon && (
          <span className="shrink-0 text-muted-foreground/70">
            {icon}
          </span>
        )}

        <span>{label}</span>
      </div>

      <div className="min-w-0 text-right text-sm font-medium text-foreground">
        {value}
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function PaymentDetailPage() {
  const params = useParams();

  const paymentId =
    typeof params.id === "string"
      ? params.id
      : "";

  const [
    completeDialogOpen,
    setCompleteDialogOpen,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | GET PAYMENT
  |--------------------------------------------------------------------------
  */

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = usePayment(
    paymentId,
    !!paymentId,
  );

  /*
  |--------------------------------------------------------------------------
  | COMPLETE CASH PAYMENT
  |--------------------------------------------------------------------------
  */

  const completeCashPayment =
    useCompleteCashPayment();

  const payment =
    response?.data as
      | PaymentDetail
      | undefined;

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading payment...
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR / NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (isError || !payment) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ml-2 mb-6"
          >
            <Link href="/office/dashboard/payments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Payments
            </Link>
          </Button>

          <Card>
            <CardContent className="flex min-h-48 flex-col items-center justify-center gap-4 text-center">
              <div>
                <h2 className="text-base font-semibold">
                  Payment not found
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {getErrorMessage(error)}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                >
                  Try again
                </Button>

                <Button asChild>
                  <Link href="/office/dashboard/payments">
                    Back to payments
                  </Link>
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
  | DERIVED STATE
  |--------------------------------------------------------------------------
  */

  const canCompleteCash =
    payment.payment_method === "CASH" &&
    payment.status === "PENDING";

  const isCompleted =
    payment.status === "COMPLETED";

  const isCompleting =
    completeCashPayment.isPending;

  const paymentDate =
    getPaymentDate(payment);

  const receiptPath =
    getReceiptPath(payment.id);

  const printReceiptPath =
    getPrintReceiptPath(payment.id);

  /*
  |--------------------------------------------------------------------------
  | METHOD-SPECIFIC INFORMATION
  |--------------------------------------------------------------------------
  */

  const bankDetails =
    payment.payment_method ===
    "BANK_TRANSFER"
      ? payment.bank_transfer_details
      : null;

  const onlineDetails =
    payment.payment_method === "ONLINE"
      ? payment.online_details
      : null;

  const cashDetails =
    payment.payment_method === "CASH"
      ? payment.cash_details
      : null;

  /*
  |--------------------------------------------------------------------------
  | COMPLETE CASH PAYMENT
  |--------------------------------------------------------------------------
  */

  async function handleCompletePayment() {
    if (!payment.id) {
      return;
    }

    try {
      await completeCashPayment.mutateAsync(
        payment.id,
      );

      setCompleteDialogOpen(false);
    } catch {
      /*
       * Keep dialog open so the user can
       * review the error and retry.
       */
    }
  }

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ============================================================
            HEADER
        ============================================================ */}

        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ml-2 mb-4"
          >
            <Link href="/office/dashboard/payments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Payments
            </Link>
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {payment.payment_number}
                </h1>

                <PaymentStatus
                  status={payment.status}
                />
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {payment.service?.name ??
                  "Revenue payment"}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Transaction{" "}
                <span className="font-mono">
                  {payment.transaction_reference}
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {/* ======================================================
                  COMPLETED PAYMENT RECEIPT ACTIONS
              ====================================================== */}

              {isCompleted && (
                <>
                  <Button
                    variant="outline"
                    asChild
                  >
                    <Link href={receiptPath}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Receipt
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    asChild
                  >
                    <Link
                      href={printReceiptPath}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print Receipt
                    </Link>
                  </Button>
                </>
              )}

              {/* ======================================================
                  COMPLETE CASH PAYMENT
              ====================================================== */}

              {canCompleteCash && (
                <Button
                  type="button"
                  onClick={() =>
                    setCompleteDialogOpen(true)
                  }
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Complete Payment
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================
            PRIMARY PAYMENT SUMMARY
        ============================================================ */}

        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
              {/* Amount */}

              <div>
                <p className="text-sm text-muted-foreground">
                  Payment amount
                </p>

                <p className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {formatCurrency(
                    payment.amount,
                    payment.currency,
                  )}
                </p>

                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <PaymentMethodIcon
                    method={
                      payment.payment_method
                    }
                  />

                  <span>
                    {getPaymentMethodLabel(
                      payment.payment_method,
                    )}
                  </span>

                  <span className="text-muted-foreground/50">
                    ·
                  </span>

                  <span>
                    {getMethodDescription(
                      payment,
                    )}
                  </span>
                </div>
              </div>

              {/* Status */}

              <div className="sm:text-right">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </p>

                <PaymentStatus
                  status={payment.status}
                />

                <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground sm:ml-auto">
                  {getStatusDescription(
                    payment,
                  )}
                </p>
              </div>
            </div>

            <Separator />

            {/* Quick facts */}

            <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {/* Invoice */}

              <div className="p-4 sm:px-6">
                <p className="text-xs text-muted-foreground">
                  Invoice
                </p>

                {payment.invoice?.id ? (
                  <Link
                    href={`/office/dashboard/invoices/${encodeURIComponent(
                      payment.invoice.id,
                    )}`}
                    className="mt-1 block text-sm font-medium text-primary hover:underline"
                  >
                    {
                      payment.invoice
                        .invoice_number
                    }
                  </Link>
                ) : (
                  <p className="mt-1 text-sm font-medium">
                    —
                  </p>
                )}
              </div>

              {/* Payment date */}

              <div className="p-4 sm:px-6">
                <p className="text-xs text-muted-foreground">
                  Payment date
                </p>

                <p className="mt-1 text-sm font-medium">
                  {formatDateTime(
                    paymentDate,
                  )}
                </p>
              </div>

              {/* Receipt */}

              <div className="p-4 sm:px-6">
                <p className="text-xs text-muted-foreground">
                  Receipt
                </p>

                {isCompleted ? (
                  <Link
                    href={receiptPath}
                    className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {payment.receipt
                      ?.receipt_number ??
                      "View receipt"}

                    <FileText className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    Not available
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============================================================
            PAYMENT + TAXPAYER
        ============================================================ */}

        <div className="grid gap-6 md:grid-cols-2">
          {/* ==========================================================
              PAYMENT INFORMATION
          ========================================================== */}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Payment information
              </CardTitle>
            </CardHeader>

            <CardContent>
              <DetailRow
                label="Payment number"
                value={
                  <span className="font-mono text-xs">
                    {payment.payment_number}
                  </span>
                }
                icon={
                  <Hash className="h-4 w-4" />
                }
              />

              <Separator />

              <DetailRow
                label="Method"
                value={getPaymentMethodLabel(
                  payment.payment_method,
                )}
                icon={
                  <PaymentMethodIcon
                    method={
                      payment.payment_method
                    }
                  />
                }
              />

              <Separator />

              <DetailRow
                label="Source"
                value={
                  payment.payment_source
                    ?.replaceAll("_", " ")
                    .toLowerCase()
                    .replace(
                      /\b\w/g,
                      (char) =>
                        char.toUpperCase(),
                    ) ?? "—"
                }
              />

              <Separator />

              <DetailRow
                label="Payment date"
                value={formatDateTime(
                  paymentDate,
                )}
                icon={
                  <CalendarDays className="h-4 w-4"
                />
                }
              />

              <Separator />

              <DetailRow
                label="Transaction reference"
                value={
                  <span className="max-w-52 break-all font-mono text-xs">
                    {payment.transaction_reference ||
                      "—"}
                  </span>
                }
                icon={
                  <Hash className="h-4 w-4" />
                }
              />

              {/* =====================================================
                  BANK TRANSFER DETAILS
              ===================================================== */}

              {bankDetails && (
                <>
                  <Separator />

                  <DetailRow
                    label="Bank"
                    value={
                      bankDetails
                        .bank_account
                        ?.bank_name ??
                      "—"
                    }
                    icon={
                      <Building2 className="h-4 w-4" />
                    }
                  />

                  <Separator />

                  <DetailRow
                    label="Bank account"
                    value={
                      bankDetails
                        .bank_account
                        ?.account_name ??
                      "—"
                    }
                  />

                  {bankDetails
                    .transfer_reference && (
                    <>
                      <Separator />

                      <DetailRow
                        label="Transfer reference"
                        value={
                          <span className="max-w-52 break-all font-mono text-xs">
                            {
                              bankDetails.transfer_reference
                            }
                          </span>
                        }
                      />
                    </>
                  )}

                  {bankDetails
                    .sender_name && (
                    <>
                      <Separator />

                      <DetailRow
                        label="Sender"
                        value={
                          bankDetails.sender_name
                        }
                      />
                    </>
                  )}
                </>
              )}

              {/* =====================================================
                  ONLINE PAYMENT DETAILS
              ===================================================== */}

              {onlineDetails && (
                <>
                  <Separator />

                  <DetailRow
                    label="Provider"
                    value={
                      onlineDetails
                        .payment_provider
                        ?.name ??
                      "—"
                    }
                    icon={
                      <Smartphone className="h-4 w-4" />
                    }
                  />

                  {onlineDetails
                    .checkout_reference && (
                    <>
                      <Separator />

                      <DetailRow
                        label="Checkout reference"
                        value={
                          <span className="max-w-52 break-all font-mono text-xs">
                            {
                              onlineDetails.checkout_reference
                            }
                          </span>
                        }
                      />
                    </>
                  )}

                  {onlineDetails
                    .provider_transaction_id && (
                    <>
                      <Separator />

                      <DetailRow
                        label="Provider transaction"
                        value={
                          <span className="max-w-52 break-all font-mono text-xs">
                            {
                              onlineDetails.provider_transaction_id
                            }
                          </span>
                        }
                      />
                    </>
                  )}
                </>
              )}

              {/* =====================================================
                  FAILURE REASON
              ===================================================== */}

              {payment.failure_reason && (
                <>
                  <Separator />

                  <DetailRow
                    label="Failure reason"
                    value={
                      <span className="max-w-56 text-red-600">
                        {
                          payment.failure_reason
                        }
                      </span>
                    }
                    icon={
                      <XCircle className="h-4 w-4 text-red-600" />
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* ==========================================================
              TAXPAYER
          ========================================================== */}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Taxpayer
              </CardTitle>
            </CardHeader>

            <CardContent>
              <DetailRow
                label="Name"
                value={
                  payment.citizen?.name ||
                  payment.payer_name ||
                  "—"
                }
                icon={
                  <User className="h-4 w-4" />
                }
              />

              <Separator />

              <DetailRow
                label="Phone"
                value={
                  payment.citizen?.phone ||
                  payment.payer_phone ||
                  "—"
                }
              />

              <Separator />

              <DetailRow
                label="Email"
                value={
                  <span className="max-w-52 truncate">
                    {payment.citizen?.email ||
                      payment.payer_email ||
                      "—"}
                  </span>
                }
              />

              <Separator />

              <DetailRow
                label="Service"
                value={
                  payment.service?.name ||
                  "—"
                }
                icon={
                  <FileText className="h-4 w-4" />
                }
              />

              <Separator />

              <DetailRow
                label="Service code"
                value={
                  payment.service?.code ??
                  "—"
                }
              />

              {payment.assessment && (
                <>
                  <Separator />

                  <DetailRow
                    label="Assessment"
                    value={
                      <Link
                        href={`/office/dashboard/assessments/${encodeURIComponent(
                          payment.assessment.id,
                        )}`}
                        className="text-primary hover:underline"
                      >
                        {
                          payment.assessment
                            .assessment_number
                        }
                      </Link>
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ============================================================
            COLLECTION & VERIFICATION
        ============================================================ */}

        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Processing & verification
            </CardTitle>
          </CardHeader>

          <CardContent>
            <DetailRow
              label="Processed by"
              value={
                payment.processed_by ? (
                  <div>
                    <p>
                      {
                        payment.processed_by
                          .name
                      }
                    </p>

                    {payment.processed_by
                      .role && (
                      <p className="text-xs font-normal text-muted-foreground">
                        {
                          payment.processed_by
                            .role
                        }
                      </p>
                    )}
                  </div>
                ) : (
                  "—"
                )
              }
              icon={
                <User className="h-4 w-4" />
              }
            />

            {/* Cash-specific collector */}

            {cashDetails?.received_by && (
              <>
                <Separator />

                <DetailRow
                  label="Cash received by"
                  value={
                    <div>
                      <p>
                        {
                          cashDetails
                            .received_by.name
                        }
                      </p>

                      {cashDetails
                        .received_by.role && (
                        <p className="text-xs font-normal text-muted-foreground">
                          {
                            cashDetails
                              .received_by.role
                          }
                        </p>
                      )}
                    </div>
                  }
                  icon={
                    <Wallet className="h-4 w-4" />
                  }
                />
              </>
            )}

            <Separator />

            <DetailRow
              label="Processed at"
              value={formatDateTime(
                payment.created_at,
              )}
              icon={
                <CalendarDays className="h-4 w-4" />
              }
            />

            <Separator />

            <DetailRow
              label="Verified by"
              value={
                payment.verified_by?.name ??
                (
                  <span className="font-normal text-muted-foreground">
                    Not verified
                  </span>
                )
              }
              icon={
                <ShieldCheck className="h-4 w-4" />
              }
            />

            <Separator />

            <DetailRow
              label="Verified at"
              value={
                payment.verified_at
                  ? formatDateTime(
                      payment.verified_at,
                    )
                  : (
                    <span className="font-normal text-muted-foreground">
                      Not verified
                    </span>
                  )
              }
            />

            {/* ========================================================
                CASH RECEIVED TIME
            ======================================================== */}

            {cashDetails
              ?.cash_received_at && (
              <>
                <Separator />

                <DetailRow
                  label="Cash received at"
                  value={formatDateTime(
                    cashDetails.cash_received_at,
                  )}
                  icon={
                    <CalendarDays className="h-4 w-4" />
                  }
                />
              </>
            )}

            {/* ========================================================
                BANK TRANSFER DATE
            ======================================================== */}

            {bankDetails
              ?.transfer_date && (
              <>
                <Separator />

                <DetailRow
                  label="Transfer date"
                  value={formatDateTime(
                    bankDetails.transfer_date,
                  )}
                  icon={
                    <CalendarDays className="h-4 w-4" />
                  }
                />
              </>
            )}

            {/* ========================================================
                ONLINE PAID TIME
            ======================================================== */}

            {onlineDetails?.paid_at && (
              <>
                <Separator />

                <DetailRow
                  label="Provider paid at"
                  value={formatDateTime(
                    onlineDetails.paid_at,
                  )}
                  icon={
                    <CalendarDays className="h-4 w-4"
                  />
                  }
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* ============================================================
            RECEIPT
        ============================================================ */}

        {isCompleted && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Official receipt
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      {payment.receipt
                        ?.receipt_number ??
                        "Official receipt"}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Official receipt generated for
                      this completed payment.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    asChild
                  >
                    <Link href={receiptPath}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Receipt
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    asChild
                  >
                    <Link
                      href={printReceiptPath}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print Receipt
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============================================================
            NOTES
        ============================================================ */}

        {payment.metadata?.notes != null && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Notes
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                {String(
                  payment.metadata.notes,
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ============================================================
            AUDIT
        ============================================================ */}

        <div className="mt-6 border-t pt-5">
          <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Hash className="h-3.5 w-3.5" />

              <span className="font-mono">
                {payment.id}
              </span>
            </div>

            <div>
              Created{" "}
              {formatDateTime(
                payment.created_at,
              )}
              {" · "}
              Updated{" "}
              {formatDateTime(
                payment.updated_at,
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==============================================================
          COMPLETE CASH PAYMENT DIALOG
      ============================================================== */}

      <Dialog
        open={completeDialogOpen}
        onOpenChange={(open) => {
          if (!isCompleting) {
            setCompleteDialogOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Complete cash payment
            </DialogTitle>

            <DialogDescription>
              Confirm that the cash has been received
              and the recorded amount is correct.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Payment summary */}

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Payment
                </span>

                <span className="text-sm font-medium">
                  {payment.payment_number}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Amount
                </span>

                <span className="text-lg font-semibold">
                  {formatCurrency(
                    payment.amount,
                    payment.currency,
                  )}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Invoice
                </span>

                <span className="text-sm font-medium">
                  {payment.invoice
                    ?.invoice_number ?? "—"}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Taxpayer
                </span>

                <span className="text-right text-sm font-medium">
                  {payment.citizen?.name ||
                    payment.payer_name ||
                    "—"}
                </span>
              </div>

              {cashDetails?.received_by && (
                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    Cash received by
                  </span>

                  <span className="text-right text-sm font-medium">
                    {
                      cashDetails
                        .received_by.name
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Completion warning */}

            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />

              <p className="leading-5">
                Completing this payment will mark
                it as{" "}
                <span className="font-semibold">
                  Completed
                </span>
                , apply the amount to the invoice
                balance, and generate the official
                receipt.
              </p>
            </div>

            {/* Mutation error */}

            {completeCashPayment.isError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {getErrorMessage(
                  completeCashPayment.error,
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isCompleting}
              onClick={() =>
                setCompleteDialogOpen(false)
              }
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={isCompleting}
              onClick={
                handleCompletePayment
              }
            >
              {isCompleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Complete Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}