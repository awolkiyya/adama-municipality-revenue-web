"use client";

import {
  ArrowLeft,
  Download,
  FileText,
  Home,
  RefreshCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { PaymentResultStatus } from "./PaymentStatusIcon";

interface PaymentActionsProps {
  status: PaymentResultStatus;

  invoiceUrl?: string;
  dashboardUrl?: string;

  onRetry?: () => void;
  onDownloadReceipt?: () => void;
}

export default function PaymentActions({
  status,
  invoiceUrl = "/invoices",
  dashboardUrl = "/",
  onRetry,
  onDownloadReceipt,
}: PaymentActionsProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleDashboard = () => {
    router.push(dashboardUrl);
  };

  const handleInvoice = () => {
    router.push(invoiceUrl);
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      return;
    }

    handleInvoice();
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
      {status === "success" && (
        <>
          <button
            type="button"
            onClick={onDownloadReceipt}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            <Download className="h-4 w-4" />
            Download Receipt
          </button>

          <button
            type="button"
            onClick={handleInvoice}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          >
            <FileText className="h-4 w-4" />
            View Invoice
          </button>
        </>
      )}

      {status === "failed" && (
        <>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Try Payment Again
          </button>

          <button
            type="button"
            onClick={handleInvoice}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" />
            View Invoice
          </button>
        </>
      )}

      {status === "pending" && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <RefreshCcw className="h-4 w-4" />
          Check Again
        </button>
      )}

      <button
        type="button"
        onClick={handleDashboard}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <Home className="h-4 w-4" />
        Dashboard
      </button>

      <button
        type="button"
        onClick={handleBack}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Go Back
      </button>
    </div>
  );
}