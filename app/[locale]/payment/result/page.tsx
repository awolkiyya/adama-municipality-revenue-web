"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  Loader2,
  ReceiptText,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REVERSED";

interface PaymentResult {
  id: string;
  payment_number: string;
  transaction_reference: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  payment_provider: string | null;
}

const MOCK_PAYMENT: PaymentResult = {
  id: "01a11326-2a7c-70e8-ac30-f8c74f274d0a",
  payment_number: "PAY-2019-000026",
  transaction_reference: "PAY-01M49JCAKM9PBFV5M6XB1KZZH6",
  amount: "29,423.05",
  currency: "ETB",
  status: "COMPLETED",
  payment_method: "ONLINE",
  payment_provider: "CHAPA",
};

export default function PaymentResultPage() {
  const searchParams = useSearchParams();

  const paymentId = searchParams.get("payment_id");
  const txRef = searchParams.get("tx_ref");

  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  /*
   * ------------------------------------------------------------
   * MOCK MODE
   * ------------------------------------------------------------
   *
   * Change this to false when the real API is ready.
   */
  const USE_MOCK_DATA = true;

  useEffect(() => {
    if (USE_MOCK_DATA) {
      const timer = setTimeout(() => {
        setPayment({
          ...MOCK_PAYMENT,
          id: paymentId || MOCK_PAYMENT.id,
          transaction_reference:
            txRef || MOCK_PAYMENT.transaction_reference,
        });

        setLoading(false);
      }, 800);

      return () => clearTimeout(timer);
    }

    // Real API implementation will go here later.
    setLoading(false);
  }, [paymentId, txRef]);

  const copyReference = async () => {
    if (!payment) return;

    await navigator.clipboard.writeText(
      payment.transaction_reference
    );

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <div className="w-full max-w-md rounded-2xl border bg-background p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>

            <h1 className="text-xl font-semibold">
              Checking payment status
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Please wait while we confirm your payment.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!payment) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <div className="w-full max-w-md rounded-2xl border bg-background p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>

            <h1 className="text-xl font-semibold">
              Payment not found
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              We could not find the requested payment.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const isCompleted = payment.status === "COMPLETED";

  const isFailed =
    payment.status === "FAILED" ||
    payment.status === "CANCELLED" ||
    payment.status === "REVERSED";

  const isProcessing =
    payment.status === "PENDING" ||
    payment.status === "PROCESSING";

  const statusConfig = isCompleted
    ? {
        icon: CheckCircle2,
        title: "Payment Successful",
        description:
          "Your payment has been successfully confirmed.",
      }
    : isFailed
      ? {
          icon: XCircle,
          title: "Payment Failed",
          description:
            "Your payment was not completed. Please try again.",
        }
      : {
          icon: Clock3,
          title: "Payment Processing",
          description:
            "Your payment is being confirmed. Please wait.",
        };

  const StatusIcon = statusConfig.icon;

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full ${
              isCompleted
                ? "bg-emerald-100 dark:bg-emerald-950/40"
                : isFailed
                  ? "bg-destructive/10"
                  : "bg-amber-100 dark:bg-amber-950/40"
            }`}
          >
            <StatusIcon
              className={`h-10 w-10 ${
                isCompleted
                  ? "text-emerald-600"
                  : isFailed
                    ? "text-destructive"
                    : "text-amber-600"
              }`}
            />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            {statusConfig.title}
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            {statusConfig.description}
          </p>
        </div>

        {/* Payment Card */}
        <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
          {/* Amount */}
          <div className="border-b px-6 py-8 text-center sm:px-8">
            <p className="text-sm text-muted-foreground">
              Amount Paid
            </p>

            <div className="mt-2 text-4xl font-bold tracking-tight">
              {payment.amount}
              <span className="ml-2 text-xl font-medium text-muted-foreground">
                {payment.currency}
              </span>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
              <CreditCard className="h-3.5 w-3.5" />
              {payment.payment_provider ?? payment.payment_method}
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-6 sm:px-8">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold">
              <ReceiptText className="h-4 w-4" />
              Payment Details
            </h2>

            <div className="space-y-4">
              <DetailRow
                label="Payment Number"
                value={payment.payment_number}
              />

              <DetailRow
                label="Payment Method"
                value={payment.payment_method}
              />

              <DetailRow
                label="Payment Provider"
                value={payment.payment_provider ?? "-"}
              />

              <DetailRow
                label="Status"
                value={payment.status}
                valueClassName={
                  isCompleted
                    ? "text-emerald-600"
                    : isFailed
                      ? "text-destructive"
                      : "text-amber-600"
                }
              />

              <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-muted-foreground">
                  Transaction Reference
                </span>

                <div className="flex items-center gap-2">
                  <code className="max-w-[250px] truncate rounded-md bg-muted px-2 py-1 text-xs">
                    {payment.transaction_reference}
                  </code>

                  <button
                    type="button"
                    onClick={copyReference}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:bg-muted"
                    title="Copy transaction reference"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div className="border-t bg-muted/30 px-6 py-5 sm:px-8">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="text-sm font-medium">
                  Payment verification
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {isCompleted
                    ? "This payment has been confirmed by the municipal payment system."
                    : isProcessing
                      ? "The payment is waiting for confirmation from the payment provider."
                      : "This payment was not successfully completed."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Adama City Administration • Municipal Revenue Payment
        </p>
      </div>
    </main>
  );
}

function DetailRow({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b pb-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span
        className={`text-sm font-medium sm:text-right ${valueClassName}`}
      >
        {value}
      </span>
    </div>
  );
}