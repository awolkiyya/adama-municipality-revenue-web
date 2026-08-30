"use client";

import { useRouter } from "next/navigation";

import PaymentActions from "./PaymentActions";
import PaymentReceiptCard from "./PaymentReceiptCard";
import PaymentResultHeader from "./PaymentResultHeader";
import PaymentSummary, {
  PaymentSummaryData,
} from "./PaymentSummary";
import { PaymentResultStatus } from "./PaymentStatusIcon";

interface PaymentResultPageProps {
  status: PaymentResultStatus;

  payment: PaymentSummaryData;

  title?: string;
  description?: string;

  invoiceUrl?: string;
  dashboardUrl?: string;

  showReceipt?: boolean;

  onRetry?: () => void;
  onDownloadReceipt?: () => void;
}

export default function PaymentResultPage({
  status,
  payment,
  title,
  description,
  invoiceUrl = "/citizen/dashboard/invoices",
  dashboardUrl = "/citizen/dashboard",
  showReceipt = true,
  onRetry,
  onDownloadReceipt,
}: PaymentResultPageProps) {
  const router = useRouter();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      return;
    }

    router.push(invoiceUrl);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* Header */}
        <PaymentResultHeader
          status={status}
          title={title}
          description={description}
        />

        {/* Content */}
        <div className="mt-10 space-y-5 sm:mt-12">
          {/* Main payment information */}
          <PaymentSummary
            payment={payment}
          />

          {/* Receipt */}
          {showReceipt &&
            status === "success" && (
              <PaymentReceiptCard
                paymentReference={
                  payment.transactionReference
                }
                invoiceNumber={
                  payment.invoiceNumber
                }
                amount={payment.amount}
                currency={payment.currency}
                provider={payment.provider}
              />
            )}

          {/* Pending information */}
          {status === "pending" && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <div className="flex gap-3">
                <div className="mt-0.5 shrink-0">
                  <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-amber-900">
                    Payment verification in progress
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-amber-800/80">
                    Your payment has been submitted, but
                    we have not received final confirmation
                    yet. Please wait before attempting
                    another payment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Failed information */}
          {status === "failed" && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <div className="flex gap-3">
                <div className="mt-0.5 shrink-0">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-red-900">
                    No successful payment was recorded
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-red-800/80">
                    If money was deducted from your account,
                    please do not pay again immediately.
                    Contact support and provide your payment
                    reference.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3">
            <PaymentActions
              status={status}
              invoiceUrl={invoiceUrl}
              dashboardUrl={dashboardUrl}
              onRetry={handleRetry}
              onDownloadReceipt={
                onDownloadReceipt
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs leading-5 text-slate-400">
            Keep your payment reference for future
            communication with the municipal revenue
            office.
          </p>
        </div>
      </div>
    </main>
  );
}