"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Hash,
  Loader2,
  ShieldCheck,
  User,
  Wallet,
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
  usePayment,
  usePostCashPayment,
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
  }).format(Number(amount))} ${currency}`;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
    case "POSTED":
      return (
        <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Posted
        </Badge>
      );

    case "RECORDED":
      return (
        <Badge
          variant="secondary"
          className="gap-1 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
        >
          <Clock3 className="h-3.5 w-3.5" />
          Recorded
        </Badge>
      );

    case "PENDING_VERIFICATION":
      return (
        <Badge
          variant="secondary"
          className="gap-1 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Pending verification
        </Badge>
      );

    case "VERIFIED":
      return (
        <Badge
          variant="secondary"
          className="gap-1 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Verified
        </Badge>
      );

    case "INITIATED":
      return (
        <Badge
          variant="secondary"
          className="gap-1"
        >
          <Clock3 className="h-3.5 w-3.5" />
          Initiated
        </Badge>
      );

    case "PENDING":
      return (
        <Badge
          variant="secondary"
          className="gap-1"
        >
          <Clock3 className="h-3.5 w-3.5" />
          Pending
        </Badge>
      );

    case "FAILED":
    case "REJECTED":
    case "CANCELLED":
    case "EXPIRED":
      return (
        <Badge variant="destructive">
          {getStatusLabel(status)}
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
    postDialogOpen,
    setPostDialogOpen,
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
  | POST CASH PAYMENT
  |--------------------------------------------------------------------------
  */

  const postCashPayment =
    usePostCashPayment();

  const payment =
    response?.data as PaymentDetail | undefined;

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
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
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

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

  /**
   * Cash workflow:
   *
   * RECORDED → POSTED
   */
  const canPostCash =
    payment.payment_method === "CASH" &&
    payment.status === "RECORDED";

  const isPosted =
    payment.status === "POSTED";

  const isRecorded =
    payment.status === "RECORDED";

  const isPosting =
    postCashPayment.isPending;

  /*
  |--------------------------------------------------------------------------
  | POST CASH PAYMENT
  |--------------------------------------------------------------------------
  */

  async function handlePostPayment() {
    if (!payment?.id) {
      return;
    }

    try {
      await postCashPayment.mutateAsync(
        payment.id,
      );

      setPostDialogOpen(false);
    } catch {
      /*
       * Keep dialog open.
       *
       * The mutation error is displayed
       * inside the dialog so the user can retry.
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

      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

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
                Payment for{" "}
                {payment.service?.name ??
                  "Revenue service"}
              </p>

            </div>

            {canPostCash && (
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() =>
                  setPostDialogOpen(true)
                }
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Post Payment
              </Button>
            )}

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
                  Amount received
                </p>

                <p className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {formatCurrency(
                    payment.amount,
                    payment.currency,
                  )}
                </p>

                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">

                  <Wallet className="h-4 w-4" />

                  {payment.payment_method ===
                  "CASH"
                    ? "Cash payment"
                    : payment.payment_method ===
                        "BANK_TRANSFER"
                      ? "Bank transfer"
                      : "Online payment"}

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

                <p className="mt-2 max-w-xs text-xs leading-5 text-muted-foreground sm:ml-auto">

                  {isPosted
                    ? "Payment has been officially posted and recognized."
                    : isRecorded
                      ? "Cash has been recorded and is waiting to be posted."
                      : payment.status ===
                          "AWAITING_VERIFICATION"
                        ? "Payment is waiting for municipal verification."
                        : payment.status ===
                            "VERIFIED"
                          ? "Payment has been verified and is waiting to be posted."
                          : `Payment is ${getStatusLabel(
                              payment.status,
                            ).toLowerCase()}.`}

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
                    href={`/office/dashboard/invoices/${payment.invoice.id}`}
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
                    payment.payment_date,
                  )}
                </p>

              </div>

              {/* Receipt */}

              <div className="p-4 sm:px-6">

                <p className="text-xs text-muted-foreground">
                  Receipt
                </p>

                <p className="mt-1 text-sm font-medium">
                  {payment.receipt_number ??
                    "Not generated"}
                </p>

              </div>

            </div>

          </CardContent>
        </Card>

        {/* ============================================================
            PAYMENT + TAXPAYER
        ============================================================ */}

        <div className="grid gap-6 md:grid-cols-2">

          {/* Payment information */}

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
                  payment.payment_number
                }
                icon={
                  <Hash className="h-4 w-4" />
                }
              />

              <Separator />

              <DetailRow
                label="Method"
                value={
                  payment.payment_method ===
                  "BANK_TRANSFER"
                    ? "Bank transfer"
                    : payment.payment_method ===
                        "ONLINE"
                      ? "Online"
                      : "Cash"
                }
                icon={
                  <Wallet className="h-4 w-4" />
                }
              />

              <Separator />

              <DetailRow
                label="Provider"
                value={
                  payment.payment_provider
                }
              />

              <Separator />

              <DetailRow
                label="Payment date"
                value={formatDateTime(
                  payment.payment_date,
                )}
                icon={
                  <CalendarDays className="h-4 w-4" />
                }
              />

              <Separator />

              <DetailRow
                label="Transaction reference"
                value={
                  <span className="max-w-48 break-all font-mono text-xs">
                    {payment.transaction_reference ||
                      "—"}
                  </span>
                }
                icon={
                  <Hash className="h-4 w-4" />
                }
              />

              {payment.provider_reference && (
                <>
                  <Separator />

                  <DetailRow
                    label="Provider reference"
                    value={
                      <span className="max-w-48 break-all font-mono text-xs">
                        {
                          payment.provider_reference
                        }
                      </span>
                    }
                  />
                </>
              )}

            </CardContent>
          </Card>

          {/* Taxpayer */}

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

            </CardContent>
          </Card>

        </div>

        {/* ============================================================
            COLLECTION
        ============================================================ */}

        <Card className="mt-6">

          <CardHeader className="pb-3">

            <CardTitle className="text-base">
              Collection
            </CardTitle>

          </CardHeader>

          <CardContent>

            <DetailRow
              label="Collected by"
              value={
                payment.received_by ? (
                  <div>

                    <p>
                      {
                        payment.received_by
                          .name
                      }
                    </p>

                    {payment.received_by
                      .role && (
                      <p className="text-xs font-normal text-muted-foreground">
                        {
                          payment.received_by
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

            <Separator />

            <DetailRow
              label="Collected at"
              value={formatDateTime(
                payment.payment_date,
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

            {payment.posted_by && (
              <>
                <Separator />

                <DetailRow
                  label="Posted by"
                  value={
                    payment.posted_by.name
                  }
                />
              </>
            )}

            {payment.posted_at && (
              <>
                <Separator />

                <DetailRow
                  label="Posted at"
                  value={formatDateTime(
                    payment.posted_at,
                  )}
                />
              </>
            )}

          </CardContent>
        </Card>

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
              Updated{" "}
              {formatDateTime(
                payment.updated_at,
              )}
            </div>

          </div>

        </div>

      </div>

      {/* ==============================================================
          POST CASH PAYMENT DIALOG
      ============================================================== */}

      <Dialog
        open={postDialogOpen}
        onOpenChange={(open) => {
          if (!isPosting) {
            setPostDialogOpen(open);
          }
        }}
      >

        <DialogContent className="sm:max-w-md">

          <DialogHeader>

            <DialogTitle>
              Post cash payment
            </DialogTitle>

            <DialogDescription>
              Confirm that the physical cash has
              been received and the recorded
              amount matches this payment record.
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
                    ?.invoice_number ??
                    "—"}
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

              <div className="mt-3 flex items-center justify-between gap-4">

                <span className="text-sm text-muted-foreground">
                  Collected by
                </span>

                <span className="text-right text-sm font-medium">
                  {payment.received_by
                    ?.name ?? "—"}
                </span>

              </div>

            </div>

            {/* Posting warning */}

            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">

              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />

              <p className="leading-5">

                Posting will change this payment
                from{" "}
                <span className="font-semibold">
                  Recorded
                </span>{" "}
                to{" "}
                <span className="font-semibold">
                  Posted
                </span>
                . The payment will then be
                officially recognized by the
                municipality and applied to the
                invoice balance.

              </p>

            </div>

            {/* Mutation error */}

            {postCashPayment.isError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {getErrorMessage(
                  postCashPayment.error,
                )}
              </div>
            )}

          </div>

          <DialogFooter className="gap-2 sm:gap-0">

            <Button
              type="button"
              variant="outline"
              disabled={isPosting}
              onClick={() =>
                setPostDialogOpen(false)
              }
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={isPosting}
              onClick={handlePostPayment}
            >

              {isPosting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Post Payment
                </>
              )}

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>
  );
}