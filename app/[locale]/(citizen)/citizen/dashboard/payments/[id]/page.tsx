"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  Ban,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Headphones,
  Info,
  LoaderCircle,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type PaymentStatus =
  | "SUCCESS"
  | "PENDING"
  | "PROCESSING"
  | "FAILED"
  | "CANCELLED";

type MockPayment = {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceDescription: string;
  sourceType: string;
  status: PaymentStatus;
  paymentMethod: string;
  paymentProvider: string;
  transactionReference: string;
  providerReference: string | null;
  amount: number;
  invoiceTotal: number;
  previouslyPaid: number;
  balanceBeforePayment: number;
  balanceAfterPayment: number;
  currency: string;
  createdAt: string;
  completedAt: string | null;
  verifiedAt: string | null;
  failureReason: string | null;
};

// -----------------------------------------------------------------------------
// Mock data
//
// Replace this section later with your usePayment(id) hook.
// Route IDs below let you preview each possible payment state.
// -----------------------------------------------------------------------------

const MOCK_PAYMENTS: Record<string, MockPayment> = {
  "pay-success-001": {
    id: "pay-success-001",
    paymentNumber: "PAY-2026-000123",
    invoiceId: "invoice-001",
    invoiceNumber: "INV-2026-000124",
    invoiceDescription: "Annual property tax",
    sourceType: "PROPERTY_TAX",
    status: "SUCCESS",
    paymentMethod: "Online payment",
    paymentProvider: "CHAPA",
    transactionReference: "TXN-ADAMA-2026-000123",
    providerReference: "chapa_demo_7f3e9c2a",
    amount: 1500,
    invoiceTotal: 5000,
    previouslyPaid: 2000,
    balanceBeforePayment: 3000,
    balanceAfterPayment: 1500,
    currency: "ETB",
    createdAt: "2026-09-28T10:22:00+03:00",
    completedAt: "2026-09-28T10:24:00+03:00",
    verifiedAt: "2026-09-28T10:25:00+03:00",
    failureReason: null,
  },

  "pay-pending-001": {
    id: "pay-pending-001",
    paymentNumber: "PAY-2026-000124",
    invoiceId: "invoice-002",
    invoiceNumber: "INV-2026-000125",
    invoiceDescription: "Business license fee",
    sourceType: "DIRECT",
    status: "PENDING",
    paymentMethod: "Online payment",
    paymentProvider: "CHAPA",
    transactionReference: "TXN-ADAMA-2026-000124",
    providerReference: null,
    amount: 2000,
    invoiceTotal: 2000,
    previouslyPaid: 0,
    balanceBeforePayment: 2000,
    balanceAfterPayment: 2000,
    currency: "ETB",
    createdAt: "2026-09-29T09:15:00+03:00",
    completedAt: null,
    verifiedAt: null,
    failureReason: null,
  },

  "pay-processing-001": {
    id: "pay-processing-001",
    paymentNumber: "PAY-2026-000125",
    invoiceId: "invoice-003",
    invoiceNumber: "INV-2026-000126",
    invoiceDescription: "Commercial property tax",
    sourceType: "ASSESSMENT",
    status: "PROCESSING",
    paymentMethod: "Online payment",
    paymentProvider: "CHAPA",
    transactionReference: "TXN-ADAMA-2026-000125",
    providerReference: "chapa_demo_processing",
    amount: 1200,
    invoiceTotal: 4000,
    previouslyPaid: 1000,
    balanceBeforePayment: 3000,
    balanceAfterPayment: 3000,
    currency: "ETB",
    createdAt: "2026-09-29T11:30:00+03:00",
    completedAt: null,
    verifiedAt: null,
    failureReason: null,
  },

  "pay-failed-001": {
    id: "pay-failed-001",
    paymentNumber: "PAY-2026-000126",
    invoiceId: "invoice-004",
    invoiceNumber: "INV-2026-000127",
    invoiceDescription: "Commercial service fee",
    sourceType: "DIRECT",
    status: "FAILED",
    paymentMethod: "Online payment",
    paymentProvider: "CHAPA",
    transactionReference: "TXN-ADAMA-2026-000126",
    providerReference: "chapa_demo_failed",
    amount: 3000,
    invoiceTotal: 3000,
    previouslyPaid: 0,
    balanceBeforePayment: 3000,
    balanceAfterPayment: 3000,
    currency: "ETB",
    createdAt: "2026-09-29T13:45:00+03:00",
    completedAt: null,
    verifiedAt: "2026-09-29T13:46:00+03:00",
    failureReason:
      "The payment provider could not complete this transaction. Please try again.",
  },

  "pay-cancelled-001": {
    id: "pay-cancelled-001",
    paymentNumber: "PAY-2026-000127",
    invoiceId: "invoice-005",
    invoiceNumber: "INV-2026-000128",
    invoiceDescription: "Property service fee",
    sourceType: "ASSESSMENT",
    status: "CANCELLED",
    paymentMethod: "Online payment",
    paymentProvider: "CHAPA",
    transactionReference: "TXN-ADAMA-2026-000127",
    providerReference: null,
    amount: 1000,
    invoiceTotal: 1000,
    previouslyPaid: 0,
    balanceBeforePayment: 1000,
    balanceAfterPayment: 1000,
    currency: "ETB",
    createdAt: "2026-09-29T14:20:00+03:00",
    completedAt: null,
    verifiedAt: null,
    failureReason: null,
  },
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatMoney(amount: number, currency = "ETB") {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-ET", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Addis_Ababa",
  }).format(date);
}

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-ET", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Africa/Addis_Ababa",
  }).format(date);
}

function getStatusLabel(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    SUCCESS: "Payment successful",
    PENDING: "Payment pending",
    PROCESSING: "Payment processing",
    FAILED: "Payment failed",
    CANCELLED: "Payment cancelled",
  };

  return labels[status];
}

function getStatusDescription(status: PaymentStatus) {
  const descriptions: Record<PaymentStatus, string> = {
    SUCCESS:
      "Your payment has been verified. Keep your payment reference for future enquiries.",
    PENDING:
      "Your payment request has been created. We are waiting for confirmation from the payment provider.",
    PROCESSING:
      "Your transaction is being processed. Please wait for confirmation before attempting another payment.",
    FAILED:
      "Your payment was not completed. Check the details below and retry if your invoice still has an outstanding balance.",
    CANCELLED:
      "This payment attempt was cancelled. You can return to your invoice and start another payment if a balance remains.",
  };

  return descriptions[status];
}

function getStatusStyles(status: PaymentStatus) {
  const styles: Record<
    PaymentStatus,
    {
      container: string;
      iconContainer: string;
      icon: typeof CheckCircle2;
      badge: string;
    }
  > = {
    SUCCESS: {
      container: "border-emerald-200 bg-emerald-50/70",
      iconContainer: "bg-emerald-100",
      icon: CheckCircle2,
      badge:
        "border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
    },
    PENDING: {
      container: "border-amber-200 bg-amber-50/70",
      iconContainer: "bg-amber-100",
      icon: Clock3,
      badge:
        "border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100",
    },
    PROCESSING: {
      container: "border-blue-200 bg-blue-50/70",
      iconContainer: "bg-blue-100",
      icon: LoaderCircle,
      badge:
        "border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-100",
    },
    FAILED: {
      container: "border-red-200 bg-red-50/70",
      iconContainer: "bg-red-100",
      icon: XCircle,
      badge:
        "border-red-200 bg-red-100 text-red-800 hover:bg-red-100",
    },
    CANCELLED: {
      container: "border-slate-200 bg-slate-50",
      iconContainer: "bg-slate-200",
      icon: Ban,
      badge:
        "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100",
    },
  };

  return styles[status];
}

// -----------------------------------------------------------------------------
// Reusable components
// -----------------------------------------------------------------------------

function DetailRow({
  label,
  value,
  icon: Icon,
  action,
}: {
  label: string;
  value: React.ReactNode;
  icon?: typeof ReceiptText;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      {Icon ? (
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/70">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-1 break-words text-sm font-medium">
          {value}
        </div>
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function TimelineItem({
  title,
  description,
  completed,
  current,
  last = false,
}: {
  title: string;
  description: string;
  completed: boolean;
  current?: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={[
            "z-10 flex size-7 shrink-0 items-center justify-center rounded-full border",
            completed
              ? "border-emerald-600 bg-emerald-600 text-white"
              : current
                ? "border-blue-600 bg-blue-50 text-blue-600"
                : "border-muted-foreground/30 bg-background text-muted-foreground",
          ].join(" ")}
        >
          {completed ? (
            <Check className="size-4" />
          ) : current ? (
            <Clock3 className="size-4" />
          ) : (
            <span className="size-2 rounded-full bg-current" />
          )}
        </div>

        {!last ? (
          <div
            className={[
              "my-1 min-h-7 w-px flex-1",
              completed ? "bg-emerald-300" : "bg-border",
            ].join(" ")}
          />
        ) : null}
      </div>

      <div className="min-w-0 pb-6">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function PaymentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const paymentId = Array.isArray(params.id) ? params.id[0] : params.id;

  const initialPayment = useMemo(() => {
    return (
      MOCK_PAYMENTS[paymentId] ??
      MOCK_PAYMENTS["pay-success-001"]
    );
  }, [paymentId]);

  const [payment, setPayment] = useState<MockPayment>(initialPayment);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedReference, setCopiedReference] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");

  const statusStyles = getStatusStyles(payment.status);
  const StatusIcon = statusStyles.icon;

  const isSuccessful = payment.status === "SUCCESS";
  const isPending =
    payment.status === "PENDING" ||
    payment.status === "PROCESSING";
  const canRetry =
    payment.status === "FAILED" ||
    payment.status === "CANCELLED";

  const remainingBalance =
    payment.status === "SUCCESS"
      ? payment.balanceAfterPayment
      : payment.balanceBeforePayment;

  const hasOutstandingBalance = remainingBalance > 0;

  const timeline = useMemo(() => {
    const items: {
      title: string;
      description: string;
      completed: boolean;
      current?: boolean;
    }[] = [
      {
        title: "Payment initiated",
        description: formatDateTime(payment.createdAt),
        completed: true,
      },
      {
        title: "Payment provider",
        description:
          payment.providerReference
            ? `Reference: ${payment.providerReference}`
            : "Awaiting provider confirmation",
        completed: Boolean(payment.providerReference),
        current: !payment.providerReference && isPending,
      },
      {
        title:
          payment.status === "FAILED"
            ? "Payment failed"
            : payment.status === "CANCELLED"
              ? "Payment cancelled"
              : "Transaction completed",
        description: payment.completedAt
          ? formatDateTime(payment.completedAt)
          : payment.status === "FAILED"
            ? payment.failureReason ?? "Transaction was not completed."
            : payment.status === "CANCELLED"
              ? "Checkout was cancelled."
              : "Awaiting transaction confirmation",
        completed: isSuccessful,
        current: isPending,
      },
      {
        title: "Payment verification",
        description: payment.verifiedAt
          ? formatDateTime(payment.verifiedAt)
          : "Verification has not been confirmed yet",
        completed: isSuccessful && Boolean(payment.verifiedAt),
        current: isPending,
      },
    ];

    return items;
  }, [payment, isPending, isSuccessful]);

  // In this mock-only version, refresh simulates a provider confirmation.
  // Replace this with a refetch of the real payment status API later.
  async function handleRefreshStatus() {
    if (isRefreshing) return;

    setIsRefreshing(true);
    setRefreshMessage("");

    await new Promise((resolve) => setTimeout(resolve, 900));

    if (payment.status === "PENDING" || payment.status === "PROCESSING") {
      const completedAt = new Date().toISOString();

      setPayment((current) => ({
        ...current,
        status: "SUCCESS",
        completedAt,
        verifiedAt: completedAt,
        providerReference:
          current.providerReference ?? `CHAPA-MOCK-${current.id}`,
        balanceAfterPayment: Math.max(
          current.balanceBeforePayment - current.amount,
          0,
        ),
      }));

      setRefreshMessage(
        "Mock confirmation received. The payment is now marked successful for preview purposes.",
      );
    } else {
      setRefreshMessage("Payment status is up to date in this mock preview.");
    }

    setIsRefreshing(false);
  }

  async function handleCopyReference() {
    try {
      await navigator.clipboard.writeText(payment.transactionReference);
      setCopiedReference(true);

      window.setTimeout(() => {
        setCopiedReference(false);
      }, 1800);
    } catch {
      setRefreshMessage(
        "Copy was not available in this browser. Select the transaction reference and copy it manually.",
      );
    }
  }

  function handleDownloadReceipt() {
    if (!isSuccessful) return;

    window.print();
  }

  function handleRetryPayment() {
    router.push(
      `/citizen/dashboard/invoices/${encodeURIComponent(payment.invoiceId)}/pay`,
    );
  }

  function handleViewInvoice() {
    router.push(
      `/citizen/dashboard/invoices/${encodeURIComponent(payment.invoiceId)}`,
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground print:hidden"
      >
        <button
          type="button"
          onClick={() => router.push("/citizen/dashboard")}
          className="transition-colors hover:text-foreground"
        >
          Dashboard
        </button>

        <ChevronRight className="size-4" />

        <button
          type="button"
          onClick={() => router.push("/citizen/dashboard/payments")}
          className="transition-colors hover:text-foreground"
        >
          Payments
        </button>

        <ChevronRight className="size-4" />

        <span className="font-medium text-foreground">Payment details</span>
      </nav>

      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-3 mb-1 text-muted-foreground print:hidden"
            onClick={() => router.push("/citizen/dashboard/payments")}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to payments
          </Button>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Payment details
          </h1>

          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Review your transaction, check its status, and access your receipt.
          </p>
        </div>

        <Badge
          variant="outline"
          className={`${statusStyles.badge} w-fit px-3 py-1.5 text-sm`}
        >
          <StatusIcon
            className={`mr-2 size-4 ${
              payment.status === "PROCESSING" && isPending
                ? "animate-spin"
                : ""
            }`}
          />
          {getStatusLabel(payment.status)}
        </Badge>
      </div>

      {/* Main status banner */}
      <Card className={`overflow-hidden border ${statusStyles.container}`}>
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-background/80">
              <StatusIcon
                className={`size-6 ${
                  payment.status === "SUCCESS"
                    ? "text-emerald-600"
                    : payment.status === "PENDING"
                      ? "text-amber-600"
                      : payment.status === "PROCESSING"
                        ? "animate-spin text-blue-600"
                        : payment.status === "FAILED"
                          ? "text-red-600"
                          : "text-slate-600"
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">
                {getStatusLabel(payment.status)}
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                {getStatusDescription(payment.status)}
              </p>

              {payment.status === "FAILED" && payment.failureReason ? (
                <Alert className="mt-4 border-red-200 bg-background/70">
                  <CircleAlert className="size-4 text-red-600" />
                  <AlertTitle>Reason for failure</AlertTitle>
                  <AlertDescription>
                    {payment.failureReason}
                  </AlertDescription>
                </Alert>
              ) : null}

              {isPending ? (
                <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="mt-0.5 size-4 shrink-0" />
                  <p>
                    Avoid starting another payment for the same amount until
                    this transaction is confirmed.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 print:hidden">
              {isPending ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRefreshStatus}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`mr-2 size-4 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  {isRefreshing ? "Checking..." : "Refresh status"}
                </Button>
              ) : null}

              {isSuccessful ? (
                <Button type="button" onClick={handleDownloadReceipt}>
                  <Download className="mr-2 size-4" />
                  Print receipt
                </Button>
              ) : null}

              {canRetry && hasOutstandingBalance ? (
                <Button type="button" onClick={handleRetryPayment}>
                  <RefreshCw className="mr-2 size-4" />
                  Try payment again
                </Button>
              ) : null}
            </div>
          </div>

          {refreshMessage ? (
            <div className="border-t bg-background/70 px-5 py-3 text-sm text-muted-foreground sm:px-6">
              {refreshMessage}
            </div>
          ) : null}

          <Separator className="bg-border/70" />

          {/* Payment summary */}
          <div className="grid grid-cols-1 gap-4 bg-background/80 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
            <SummaryItem
              label="Payment number"
              value={payment.paymentNumber}
            />
            <SummaryItem
              label="Transaction date"
              value={formatDateTime(payment.createdAt)}
            />
            <SummaryItem
              label="Amount paid"
              value={formatMoney(payment.amount, payment.currency)}
              emphasized
            />
            <SummaryItem
              label="Payment provider"
              value={payment.paymentProvider}
            />
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ReceiptText className="size-5 text-primary" />
                Transaction information
              </CardTitle>
              <CardDescription>
                The identifying details associated with this payment.
              </CardDescription>
            </CardHeader>

            <CardContent className="divide-y">
              <DetailRow
                label="Payment ID"
                value={<span className="font-mono text-xs">{payment.id}</span>}
                icon={CreditCard}
              />

              <DetailRow
                label="Transaction reference"
                value={
                  <span className="font-mono text-xs">
                    {payment.transactionReference}
                  </span>
                }
                icon={Copy}
                action={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 print:hidden"
                    aria-label="Copy transaction reference"
                    onClick={handleCopyReference}
                  >
                    {copiedReference ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                }
              />

              <DetailRow
                label="Provider reference"
                value={
                  payment.providerReference ? (
                    <span className="font-mono text-xs">
                      {payment.providerReference}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Not yet provided
                    </span>
                  )
                }
                icon={ExternalLink}
              />

              <DetailRow
                label="Payment method"
                value={payment.paymentMethod}
                icon={Wallet}
              />

              <DetailRow
                label="Payment provider"
                value={payment.paymentProvider}
                icon={Building2}
              />

              <DetailRow
                label="Payment initiated"
                value={formatDateTime(payment.createdAt)}
                icon={CalendarDays}
              />

              <DetailRow
                label="Completed at"
                value={formatDateTime(payment.completedAt)}
                icon={CheckCircle2}
              />

              <DetailRow
                label="Verified at"
                value={formatDateTime(payment.verifiedAt)}
                icon={ShieldCheck}
              />
            </CardContent>
          </Card>

          {/* Invoice information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-5 text-primary" />
                Related invoice
              </CardTitle>
              <CardDescription>
                The invoice this transaction was intended to pay.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <ReceiptText className="size-5 text-primary" />
                  </div>

                  <div className="min-w-0">
                    <p className="break-all font-semibold">
                      {payment.invoiceNumber}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {payment.invoiceDescription}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Source: {payment.sourceType.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 print:hidden"
                  onClick={handleViewInvoice}
                >
                  View invoice
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <AmountRow
                  label="Invoice total"
                  amount={payment.invoiceTotal}
                  currency={payment.currency}
                />
                <AmountRow
                  label="Previously paid"
                  amount={payment.previouslyPaid}
                  currency={payment.currency}
                />
                <AmountRow
                  label="This payment"
                  amount={payment.amount}
                  currency={payment.currency}
                  highlight
                />
                <AmountRow
                  label="Remaining balance"
                  amount={remainingBalance}
                  currency={payment.currency}
                  highlight={remainingBalance === 0}
                />
              </div>

              {payment.status === "SUCCESS" ? (
                <Alert>
                  <Info className="size-4" />
                  <AlertDescription>
                    {remainingBalance === 0
                      ? "The invoice balance is fully settled based on this mock transaction."
                      : `This was a partial payment. ${formatMoney(
                          remainingBalance,
                          payment.currency,
                        )} remains outstanding in this mock example.`}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Info className="size-4" />
                  <AlertDescription>
                    The figures above are mock data. An unsuccessful or
                    unverified payment must not reduce the invoice balance.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock3 className="size-5 text-primary" />
                Payment timeline
              </CardTitle>
              <CardDescription>
                Follow the progress of your transaction.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-2">
              {timeline.map((item, index) => (
                <TimelineItem
                  key={item.title}
                  title={item.title}
                  description={item.description}
                  completed={item.completed}
                  current={item.current}
                  last={index === timeline.length - 1}
                />
              ))}
            </CardContent>
          </Card>

          {/* Receipt */}
          <Card>
            <CardHeader>
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
                <ReceiptText className="size-5 text-primary" />
              </div>

              <CardTitle className="text-base">Payment receipt</CardTitle>
              <CardDescription>
                {isSuccessful
                  ? "Your payment has been verified. You can print a receipt for your records."
                  : "A confirmed receipt becomes available after the payment is verified successfully."}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Button
                type="button"
                className="w-full print:hidden"
                variant={isSuccessful ? "default" : "outline"}
                disabled={!isSuccessful}
                onClick={handleDownloadReceipt}
              >
                <Download className="mr-2 size-4" />
                {isSuccessful ? "Print payment receipt" : "Receipt unavailable"}
              </Button>

              {isSuccessful ? (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Use your browser's print dialog to save this page as a PDF.
                </p>
              ) : null}
            </CardContent>
          </Card>

          {/* Security note */}
          <Alert>
            <ShieldCheck className="size-4" />
            <AlertTitle>Payment security</AlertTitle>
            <AlertDescription>
              A payment is considered successful only after the payment
              provider's transaction has been verified by the municipal
              revenue system.
            </AlertDescription>
          </Alert>

          {/* Support */}
          <Card>
            <CardContent className="p-5">
              <div className="flex gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Headphones className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">Need help?</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    If you have a question about this transaction, contact
                    the municipal revenue support team and provide your
                    payment reference.
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => {
                      window.location.href =
                        "mailto:support@adamacity.gov.et" +
                        `?subject=${encodeURIComponent(
                          `Payment enquiry: ${payment.paymentNumber}`,
                        )}` +
                        `&body=${encodeURIComponent(
                          `Hello Support Team,\n\nI need help with my payment.\nPayment number: ${payment.paymentNumber}\nTransaction reference: ${payment.transactionReference}\nInvoice number: ${payment.invoiceNumber}\nStatus: ${payment.status}\n\nPlease assist me.\n`,
                        )}`;
                    }}
                  >
                    <Headphones className="mr-2 size-4" />
                    Contact support
                  </Button>

                  <p className="mt-2 text-xs text-muted-foreground">
                    Replace the support email with your municipality's
                    confirmed support address before deployment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <p className="text-xs text-muted-foreground">
          Mock preview only. Transaction data is not connected to the backend.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/citizen/dashboard/invoices")}
          >
            <ArrowDownLeft className="mr-2 size-4" />
            My invoices
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/citizen/dashboard/payments")}
          >
            All payments
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      </div>

      {/* Demo shortcuts: remove before production */}
      <Card className="border-dashed print:hidden">
        <CardHeader>
          <CardTitle className="text-sm">Mock preview controls</CardTitle>
          <CardDescription>
            Switch between sample transaction states to test the interface.
            These buttons only change local mock data.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-wrap gap-2">
          {(
            [
              ["pay-success-001", "Success"],
              ["pay-pending-001", "Pending"],
              ["pay-processing-001", "Processing"],
              ["pay-failed-001", "Failed"],
              ["pay-cancelled-001", "Cancelled"],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={payment.id === id ? "default" : "outline"}
              onClick={() =>
                router.push(`/citizen/dashboard/payments/${id}`)
              }
            >
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}

// -----------------------------------------------------------------------------
// Small presentational components
// -----------------------------------------------------------------------------

function SummaryItem({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p
        className={[
          "mt-2 break-words text-sm",
          emphasized
            ? "text-lg font-semibold tracking-tight text-primary"
            : "font-medium",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function AmountRow({
  label,
  amount,
  currency,
  highlight = false,
}: {
  label: string;
  amount: number;
  currency: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-lg border p-3",
        highlight ? "bg-muted/40" : "bg-background",
      ].join(" ")}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold tabular-nums">
        {formatMoney(amount, currency)}
      </p>
    </div>
  );
}