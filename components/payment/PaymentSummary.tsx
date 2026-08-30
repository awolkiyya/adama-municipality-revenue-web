"use client";

import {
  CalendarDays,
  CreditCard,
  FileText,
  Hash,
  Mail,
  User,
} from "lucide-react";

export interface PaymentSummaryData {
  transactionReference: string;
  invoiceNumber?: string;
  amount: number;
  currency: string;
  provider: string;
  method: string;
  customerName?: string;
  customerEmail?: string;
  date?: string;
}

interface PaymentSummaryProps {
  payment: PaymentSummaryData;
}

function formatAmount(
  amount: number,
  currency: string
): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ` ${currency}`;
}

function SummaryItem({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p
          className={[
            "mt-1 break-words text-sm font-semibold text-slate-800",
            mono ? "font-mono text-xs sm:text-sm" : "",
          ].join(" ")}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function PaymentSummary({
  payment,
}: PaymentSummaryProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Amount */}
      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-6 text-center sm:px-8">
        <p className="text-sm font-medium text-slate-500">
          Amount Paid
        </p>

        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {formatAmount(
            payment.amount,
            payment.currency
          )}
        </p>

        <div className="mt-3 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {payment.provider}
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-8">
        <SummaryItem
          icon={Hash}
          label="Payment Reference"
          value={payment.transactionReference}
          mono
        />

        {payment.invoiceNumber && (
          <SummaryItem
            icon={FileText}
            label="Invoice"
            value={payment.invoiceNumber}
          />
        )}

        <SummaryItem
          icon={CreditCard}
          label="Payment Method"
          value={payment.method}
        />

        {payment.date && (
          <SummaryItem
            icon={CalendarDays}
            label="Date"
            value={payment.date}
          />
        )}

        {payment.customerName && (
          <SummaryItem
            icon={User}
            label="Customer"
            value={payment.customerName}
          />
        )}

        {payment.customerEmail && (
          <SummaryItem
            icon={Mail}
            label="Email"
            value={payment.customerEmail}
          />
        )}
      </div>
    </section>
  );
}