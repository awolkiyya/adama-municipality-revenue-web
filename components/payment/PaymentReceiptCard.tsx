"use client";

import {
  CheckCircle2,
  Copy,
  FileCheck2,
} from "lucide-react";
import { useState } from "react";

interface PaymentReceiptCardProps {
  paymentReference: string;
  invoiceNumber?: string;
  amount: number;
  currency: string;
  provider: string;
}

export default function PaymentReceiptCard({
  paymentReference,
  invoiceNumber,
  amount,
  currency,
  provider,
}: PaymentReceiptCardProps) {
  const [copied, setCopied] =
    useState(false);

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(
        paymentReference
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Clipboard may not be available.
    }
  };

  const formattedAmount =
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
      {/* Top accent */}
      <div className="h-1.5 bg-emerald-500" />

      <div className="p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <FileCheck2 className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Payment Receipt
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Keep this reference for your records.
            </p>
          </div>
        </div>

        <div className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between gap-4 px-4 py-4">
            <span className="text-sm text-slate-500">
              Amount
            </span>

            <span className="text-sm font-bold text-slate-900">
              {formattedAmount} {currency}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-4">
            <span className="text-sm text-slate-500">
              Provider
            </span>

            <span className="text-sm font-semibold text-slate-800">
              {provider}
            </span>
          </div>

          {invoiceNumber && (
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <span className="text-sm text-slate-500">
                Invoice
              </span>

              <span className="text-sm font-semibold text-slate-800">
                {invoiceNumber}
              </span>
            </div>
          )}

          <div className="px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500">
                Payment Reference
              </span>

              <button
                type="button"
                onClick={copyReference}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>

            <p className="mt-2 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
              {paymentReference}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}