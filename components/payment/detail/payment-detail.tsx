"use client";

import {
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { cn } from "@/lib/utils";

import type {
  PaymentDetailViewModel,
  PaymentStatus,
  PaymentTimelineEvent,
} from "@/types/payment/detail";

import PaymentStatusBadge from "./payment-status-badge";
import PaymentReceiptActions from "./payment-receipt-actions";
import PaymentMethodDetails from "./payment-method-details";
import PaymentDetailSkeleton from "./payment-detail-skeleton";
import PaymentStatusBanner from "./payment-status-banner";
import PaymentTimeline from "./payment-timeline";
import PaymentAmountSummary from "./payment-amount-summary";

type PaymentDetailProps = {
  payment: PaymentDetailViewModel | null;
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onBack?: () => void;
  onViewReceipt?: () => void;
  onDownloadReceipt?: () => void;
  onPrintReceipt?: () => void;
  onRetry?: () => void;
  className?: string;
};

function formatCurrency(
  amount: number,
  currency = "ETB",
): string {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-ET", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function toFiniteNumber(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function toTimelineStatus(
  status: PaymentTimelineEvent["status"],
): "completed" | "current" | "pending" | "failed" {
  return status ?? "pending";
}

export function PaymentDetail({
  payment,
  isLoading = false,
  isRefreshing = false,
  error,
  onRefresh,
  onBack,
  onViewReceipt,
  onDownloadReceipt,
  onPrintReceipt,
  onRetry,
  className,
}: PaymentDetailProps) {
  if (isLoading && !payment) {
    return <PaymentDetailSkeleton className={className} />;
  }

  if (error && !payment) {
    return (
      <Card className={cn("border-destructive/30", className)}>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </div>

          <div className="space-y-1">
            <h2 className="font-semibold">
              Unable to load payment
            </h2>

            <p className="max-w-lg text-sm text-muted-foreground">
              {error}
            </p>
          </div>

          {onRetry && (
            <Button
              type="button"
              onClick={onRetry}
              variant="outline"
            >
              <RefreshCw className="mr-2 size-4" />
              Try again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!payment) {
    return (
      <Card className={className}>
        <CardContent className="py-10 text-center">
          <p className="font-medium">Payment not found</p>

          <p className="mt-1 text-sm text-muted-foreground">
            The requested payment could not be found.
          </p>

          {onBack && (
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="mt-4"
            >
              <ArrowLeft className="mr-2 size-4" />
              Go back
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const amount = toFiniteNumber(payment.amount) ?? 0;
  const invoiceAmount = toFiniteNumber(
    payment.amountSummary.invoiceAmount,
  );
  const previouslyPaid = toFiniteNumber(
    payment.amountSummary.previouslyPaid,
  );
  const remainingBalance = toFiniteNumber(
    payment.amountSummary.remainingBalance,
  );
  const fees = toFiniteNumber(payment.amountSummary.fees);

  const currency = payment.currency || "ETB";

  const methodDetails = payment.methodDetails;

  const timelineEvents = payment.timeline.map((event) => ({
    ...event,
    status: toTimelineStatus(event.status),
  }));

  const receiptStatus: PaymentStatus = payment.status;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {onBack && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onBack}
              aria-label="Go back"
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Payment details
              </h1>

              <PaymentStatusBadge status={payment.status} />
            </div>

            <p className="break-all text-sm text-muted-foreground">
              {payment.paymentNumber || `Payment #${payment.id}`}
              {payment.invoiceNumber
                ? ` · Invoice ${payment.invoiceNumber}`
                : ""}
            </p>
          </div>
        </div>

        {onRefresh && (
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto"
          >
            <RefreshCw
              className={cn(
                "mr-2 size-4",
                isRefreshing && "animate-spin",
              )}
            />
            Refresh
          </Button>
        )}
      </div>

      {/* Background refresh error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              Could not refresh payment details
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {error}
            </p>
          </div>

          {onRetry && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onRetry}
            >
              Retry
            </Button>
          )}
        </div>
      )}

      {/* Payment status */}
      <PaymentStatusBanner status={payment.status} />

      {/* Payment overview */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Payment amount
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="break-words text-2xl font-bold tabular-nums">
              {formatCurrency(amount, currency)}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Recorded payment amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Payment method
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-lg font-semibold">
              {payment.method.replaceAll("_", " ")}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Recorded payment channel
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Created at
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-base font-semibold">
              {formatDate(payment.createdAt)}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Payment initiation date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed at
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-base font-semibold">
              {formatDate(payment.completedAt)}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Confirmed completion date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed payment information */}
      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-6 xl:col-span-2">
          <PaymentMethodDetails payment={methodDetails} />

          <PaymentTimeline events={timelineEvents} />
        </div>

        <div className="min-w-0 space-y-6">
          <PaymentAmountSummary
            amount={amount}
            currency={currency}
            invoiceAmount={invoiceAmount}
            previouslyPaid={previouslyPaid}
            remainingBalance={remainingBalance}
            fees={fees}
          />

          <PaymentReceiptActions
            status={receiptStatus}
            receiptAvailable={payment.receiptAvailable}
            receiptNumber={payment.receiptNumber}
            isLoading={isLoading}
            onViewReceipt={onViewReceipt}
            onDownloadReceipt={onDownloadReceipt}
            onPrintReceipt={onPrintReceipt}
          />
        </div>
      </div>
    </div>
  );
}

export default PaymentDetail;