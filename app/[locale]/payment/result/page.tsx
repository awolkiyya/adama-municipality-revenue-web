"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

// /payment/result?payment_id=...&tx_ref=...&return_to=/en/invoices/123

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const POLL_INTERVAL = 5000;
const MAX_POLLING_DURATION = 10 * 60 * 1000;

type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "REVERSED";

interface PaymentResult {
  id: string;
  payment_number: string;
  transaction_reference: string | null;
  amount: string;
  currency: string;
  status: PaymentStatus;
  payment_method: string | null;
  payment_provider: string | null;
}

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

const PROCESSING_STATUSES: PaymentStatus[] = [
  "PENDING",
  "PROCESSING",
];

function isProcessingStatus(status: PaymentStatus): boolean {
  return PROCESSING_STATUSES.includes(status);
}

function formatAmount(
  amount: string,
  currency: string
): string {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return `${amount} ${currency}`;
  }

  return `${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount)} ${currency}`;
}

function formatLabel(
  value: string | null | undefined
): string {
  if (!value) {
    return "—";
  }

  return value
    .replace(/[_-]/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getProviderLabel(
  provider: string | null
): string {
  if (!provider) {
    return "—";
  }

  switch (provider.toUpperCase()) {
    case "CHAPA":
      return "Chapa";

    case "TELEBIRR":
      return "Telebirr";

    case "CBE":
      return "CBE";

    default:
      return formatLabel(provider);
  }
}

function getStatusConfig(status: PaymentStatus) {
  switch (status) {
    case "COMPLETED":
      return {
        title: "Payment successful",
        description:
          "Your payment has been successfully confirmed.",
        icon: CheckCircle2,
        iconClass: "text-emerald-600",
        iconBackground: "bg-emerald-50",
      };

    case "PENDING":
      return {
        title: "Payment pending",
        description:
          "Your payment is being verified. This page will update automatically.",
        icon: Clock3,
        iconClass: "text-amber-600",
        iconBackground: "bg-amber-50",
      };

    case "PROCESSING":
      return {
        title: "Payment processing",
        description:
          "We are waiting for confirmation from the payment provider.",
        icon: Clock3,
        iconClass: "text-amber-600",
        iconBackground: "bg-amber-50",
      };

    case "FAILED":
      return {
        title: "Payment failed",
        description:
          "The payment could not be completed. Please try again.",
        icon: XCircle,
        iconClass: "text-red-600",
        iconBackground: "bg-red-50",
      };

    case "CANCELLED":
      return {
        title: "Payment cancelled",
        description:
          "The payment was cancelled before completion.",
        icon: XCircle,
        iconClass: "text-slate-500",
        iconBackground: "bg-slate-100",
      };

    case "EXPIRED":
      return {
        title: "Payment expired",
        description:
          "The payment session expired before the payment was completed.",
        icon: AlertCircle,
        iconClass: "text-orange-600",
        iconBackground: "bg-orange-50",
      };

    case "REVERSED":
      return {
        title: "Payment reversed",
        description:
          "The payment was reversed. Please contact the revenue office if you need assistance.",
        icon: AlertCircle,
        iconClass: "text-red-600",
        iconBackground: "bg-red-50",
      };

    default:
      return {
        title: "Payment status",
        description:
          "Your payment status has been retrieved.",
        icon: AlertCircle,
        iconClass: "text-slate-500",
        iconBackground: "bg-slate-100",
      };
  }
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span className="max-w-[60%] text-right text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function CopyReferenceButton({
  reference,
}: {
  reference: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reference);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Clipboard may not be available.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Copy transaction reference"
    >
      <Copy className="h-3.5 w-3.5" />

      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function PaymentResultPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const paymentId = searchParams.get("payment_id");
  const txRef = searchParams.get("tx_ref");



    const handleBack = () => {
      router.back();
    };

  const [payment, setPayment] =
    useState<PaymentResult | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const pollingStartedAtRef =
    useRef<number | null>(null);

  /*
   * Browser window.setTimeout() returns a number.
   *
   * Using number here avoids the NodeJS.Timeout
   * type conflict in Next.js TypeScript projects.
   */
  const timeoutRef =
    useRef<number | null>(null);

  const mountedRef =
    useRef(true);

  const fetchPaymentResult = useCallback(
    async (
      isPolling = false
    ): Promise<PaymentResult | null> => {
      if (!paymentId) {
        setError("Payment reference is missing.");
        setLoading(false);

        return null;
      }

      if (isPolling) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        /*
         * Laravel backend route:
         *
         * GET /api/v1/online-payments/{payment}/result
         */
        const url =
          `${API_BASE_URL}/api/v1/payments/` +
          `${encodeURIComponent(paymentId)}/result`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        const body:
          | ApiResponse<PaymentResult>
          | null =
          await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            body?.message ||
            (response.status === 429
              ? "Too many requests. Please wait a moment and try again."
              : "Unable to retrieve the payment status.");

          throw new Error(message);
        }

        const result = body?.data;

        if (!result) {
          throw new Error(
            "The payment result was not returned by the server."
          );
        }

        /*
         * tx_ref is only used as a consistency check.
         *
         * The backend/database remains authoritative.
         */
        if (
          txRef &&
          result.transaction_reference &&
          txRef !== result.transaction_reference
        ) {
          throw new Error(
            "The payment reference does not match the transaction."
          );
        }

        if (!mountedRef.current) {
          return result;
        }

        setPayment(result);
        setError(null);

        return result;
      } catch (err) {
        if (!mountedRef.current) {
          return null;
        }

        const message =
          err instanceof Error
            ? err.message
            : "Unable to retrieve the payment status.";

        setError(message);

        return null;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [paymentId, txRef]
  );

  useEffect(() => {
    mountedRef.current = true;

    pollingStartedAtRef.current =
      Date.now();

    const startPolling = async () => {
      const result =
        await fetchPaymentResult(false);

      if (
        !mountedRef.current ||
        !result
      ) {
        return;
      }

      /*
       * If payment is already terminal,
       * there is nothing to poll.
       */
      if (
        !isProcessingStatus(result.status)
      ) {
        return;
      }

      const poll = async () => {
        if (!mountedRef.current) {
          return;
        }

        const startedAt =
          pollingStartedAtRef.current;

        /*
         * Stop polling after 10 minutes.
         */
        if (
          startedAt !== null &&
          Date.now() - startedAt >=
            MAX_POLLING_DURATION
        ) {
          return;
        }

        const latest =
          await fetchPaymentResult(true);

        if (
          !mountedRef.current ||
          !latest
        ) {
          return;
        }

        /*
         * Stop immediately when the payment
         * reaches a terminal state.
         */
        if (
          !isProcessingStatus(
            latest.status
          )
        ) {
          return;
        }

        /*
         * window.setTimeout returns number.
         */
        timeoutRef.current =
          window.setTimeout(
            poll,
            POLL_INTERVAL
          );
      };

      timeoutRef.current =
        window.setTimeout(
          poll,
          POLL_INTERVAL
        );
    };

    startPolling();

    return () => {
      mountedRef.current = false;

      if (
        timeoutRef.current !== null
      ) {
        window.clearTimeout(
          timeoutRef.current
        );

        timeoutRef.current = null;
      }
    };
  }, [fetchPaymentResult]);

  /*
   * ---------------------------------------------------------
   * Missing payment ID
   * ---------------------------------------------------------
   */
  if (!paymentId) {
    return (
      <main className="min-h-screen bg-muted/30 px-4 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <div className="w-full rounded-xl border bg-background p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <h1 className="font-semibold">
                  Payment reference missing
                </h1>

                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  We could not identify the payment
                  you are trying to view.
                </p>

                <button
                  type="button"
                  onClick={handleBack}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * Initial loading
   * ---------------------------------------------------------
   */
  if (loading && !payment) {
    return (
      <main className="min-h-screen bg-muted/30 px-4 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <div className="w-full rounded-xl border bg-background p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />

              <div>
                <p className="text-sm font-medium">
                  Checking payment status
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Please wait...
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * Error without payment result
   * ---------------------------------------------------------
   */
  if (error && !payment) {
    return (
      <main className="min-h-screen bg-muted/30 px-4 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <div className="w-full rounded-xl border bg-background p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>

              <div className="min-w-0">
                <h1 className="font-semibold">
                  Unable to load payment
                </h1>

                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {error}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      fetchPaymentResult(false)
                    }
                    className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    Try again
                  </button>

                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!payment) {
    return null;
  }

  const statusConfig =
    getStatusConfig(payment.status);

  const StatusIcon =
    statusConfig.icon;

  const isProcessing =
    isProcessingStatus(
      payment.status
    );

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-lg">
        {/* Header */}
        <header className="mb-6 text-center">
          <p className="text-sm font-semibold tracking-tight">
            Adama City Administration
          </p>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Municipal Revenue
          </p>
        </header>

        {/* Payment Card */}
        <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
          {/* Status */}
          <div className="px-6 pt-8 text-center sm:px-8">
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${statusConfig.iconBackground}`}
            >
              <StatusIcon
                className={`h-7 w-7 ${statusConfig.iconClass}`}
                strokeWidth={2}
              />
            </div>

            <h1 className="mt-4 text-xl font-semibold tracking-tight">
              {statusConfig.title}
            </h1>

            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-5 text-muted-foreground">
              {statusConfig.description}
            </p>
          </div>

          {/* Amount */}
          <div className="px-6 py-8 text-center sm:px-8">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {payment.status === "COMPLETED"
                ? "Amount paid"
                : "Payment amount"}
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {formatAmount(
                payment.amount,
                payment.currency
              )}
            </p>

            {isProcessing && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />

                Updating automatically
              </div>
            )}
          </div>

          {/* Details */}
          <div className="border-t px-6 sm:px-8">
            <div className="py-2">
              <DetailRow
                label="Payment number"
                value={
                  payment.payment_number
                }
              />

              <DetailRow
                label="Payment method"
                value={formatLabel(
                  payment.payment_method
                )}
              />

              <DetailRow
                label="Provider"
                value={getProviderLabel(
                  payment.payment_provider
                )}
              />

              <DetailRow
                label="Status"
                value={formatLabel(
                  payment.status
                )}
              />

              {payment.transaction_reference && (
                <div className="flex items-center justify-between gap-4 border-t py-3">
                  <span className="text-sm text-muted-foreground">
                    Transaction reference
                  </span>

                  <div className="flex max-w-[65%] items-center gap-1">
                    <span className="break-all text-right font-mono text-xs font-medium text-foreground sm:text-sm">
                      {
                        payment.transaction_reference
                      }
                    </span>

                    <CopyReferenceButton
                      reference={
                        payment.transaction_reference
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Verification */}
          <div className="border-t bg-muted/20 px-6 py-4 sm:px-8">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

              <p className="text-xs leading-5 text-muted-foreground">
                Payment status is confirmed against
                the municipal payment system. The
                provider redirect alone is not proof of
                payment.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-4 py-6 text-center">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>

          <p className="mt-4 text-xs text-muted-foreground">
            Keep your payment number and transaction
            reference for your records.
          </p>

          {isRefreshing && (
            <p className="mt-1 text-[11px] text-muted-foreground/70">
              Checking for updates...
            </p>
          )}
        </footer>
      </div>
    </main>
  );
}
