"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  FileText,
  Landmark,
  ReceiptText,
  Smartphone,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/* =========================================================
   TYPES
   ========================================================= */

type PaymentMethod = "ONLINE" | "BANK_TRANSFER";

type PaymentStatus = "POSTED" | "PENDING_VERIFICATION";

type Payment = {
  id: string;
  paymentNumber: string;
  receiptNumber: string;
  invoiceNumber: string;

  taxpayer: {
    name: string;
    tin: string;
    phone: string;
  };

  amount: number;

  method: PaymentMethod;

  provider?: "TELEBIRR" | "CHAPA";
  bank?: string;
  reference?: string;

  status: PaymentStatus;

  date: string;
  time: string;

  processedBy: string;
  processedAt: string;
};

/* =========================================================
   MOCK DATA
   ========================================================= */

const MOCK_PAYMENT: Payment = {
  id: "PAY-00091",
  paymentNumber: "PAY-2026-00091",
  receiptNumber: "RCT-2026-00091",
  invoiceNumber: "INV-2026-00124",

  taxpayer: {
    name: "Abebe Trading PLC",
    tin: "0012345678",
    phone: "+251 911 234 567",
  },

  amount: 12500,

  method: "ONLINE",
  provider: "TELEBIRR",

  status: "POSTED",

  date: "2026-10-03",
  time: "14:32",

  processedBy: "Revenue Agent",
  processedAt: "2026-10-03 14:32",
};

/* =========================================================
   HELPERS
   ========================================================= */

function formatETB(amount: number) {
  return new Intl.NumberFormat("en-ET", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/* =========================================================
   STATUS BADGE
   ========================================================= */

function PaymentStatusBadge({
  status,
}: {
  status: PaymentStatus;
}) {
  const posted = status === "POSTED";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        posted
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700",
      ].join(" ")}
    >
      {posted ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <Clock3 className="h-3.5 w-3.5" />
      )}

      {posted ? "Posted" : "Pending verification"}
    </span>
  );
}

/* =========================================================
   INFO ROW
   ========================================================= */

function InfoRow({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b py-3 last:border-b-0">
      <dt className="shrink-0 text-sm text-slate-500">
        {label}
      </dt>

      <dd
        className={[
          "text-right text-sm font-medium text-slate-900",
          mono ? "font-mono text-xs" : "",
        ].join(" ")}
      >
        {children}
      </dd>
    </div>
  );
}

/* =========================================================
   INFO SECTION
   ========================================================= */

function InfoSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
            <Icon className="h-4.5 w-4.5 text-slate-600" />
          </div>

          <h2 className="text-sm font-semibold text-slate-900">
            {title}
          </h2>
        </div>

        <dl className="mt-4">{children}</dl>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   PAYMENT METHOD
   ========================================================= */

function PaymentMethod({
  payment,
}: {
  payment: Payment;
}) {
  const online = payment.method === "ONLINE";

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
        {online ? (
          <Smartphone className="h-5 w-5 text-slate-600" />
        ) : (
          <Landmark className="h-5 w-5 text-slate-600" />
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-900">
          {online ? "Online payment" : "Bank transfer"}
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          {online ? payment.provider : payment.bank}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
   ========================================================= */

export default function PaymentDetailPage() {
  const payment = MOCK_PAYMENT;

  const isPending =
    payment.status === "PENDING_VERIFICATION";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/revenue"
              className="hover:text-slate-900"
            >
              Revenue
            </Link>

            <span>/</span>

            <Link
              href="/revenue/payments"
              className="hover:text-slate-900"
            >
              Payments
            </Link>

            <span>/</span>

            <span className="text-slate-700">
              {payment.paymentNumber}
            </span>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  Payment {payment.paymentNumber}
                </h1>

                <PaymentStatusBadge
                  status={payment.status}
                />
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Payment record and transaction details
              </p>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
            >
              <Link href="/revenue/payments">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Payments
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
        {/* ===================================================
            PAYMENT SUMMARY
            =================================================== */}

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-[1.2fr_1fr]">
              {/* Amount */}
              <div className="p-6 sm:p-7">
                <p className="text-sm text-slate-500">
                  Payment amount
                </p>

                <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums sm:text-4xl">
                  ETB {formatETB(payment.amount)}
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                    <UserRound className="h-4 w-4 text-slate-600" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {payment.taxpayer.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      TIN {payment.taxpayer.tin}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="border-t bg-slate-50/70 p-6 md:border-l md:border-t-0 sm:p-7">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Invoice
                  </p>

                  <Link
                    href={`/revenue/invoices/${payment.invoiceNumber}`}
                    className="font-mono text-sm font-medium text-primary hover:underline"
                  >
                    {payment.invoiceNumber}
                  </Link>
                </div>

                <div className="mt-5">
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
                    Payment method
                  </p>

                  <PaymentMethod payment={payment} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===================================================
            PENDING NOTICE
            =================================================== */}

        {isPending && (
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

            <div>
              <p className="text-sm font-medium text-amber-900">
                Verification required
              </p>

              <p className="mt-0.5 text-xs leading-5 text-amber-800/80">
                The bank transfer must be verified before
                the payment is posted to the invoice.
              </p>
            </div>
          </div>
        )}

        {/* ===================================================
            DETAILS
            =================================================== */}

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Taxpayer */}

          <InfoSection
            icon={UserRound}
            title="Taxpayer"
          >
            <InfoRow label="Name">
              {payment.taxpayer.name}
            </InfoRow>

            <InfoRow label="TIN" mono>
              {payment.taxpayer.tin}
            </InfoRow>

            <InfoRow label="Phone">
              {payment.taxpayer.phone}
            </InfoRow>
          </InfoSection>

          {/* Payment */}

          <InfoSection
            icon={CreditCard}
            title="Transaction"
          >
            <InfoRow label="Method">
              {payment.method === "ONLINE"
                ? "Online payment"
                : "Bank transfer"}
            </InfoRow>

            {payment.method === "ONLINE" ? (
              <InfoRow label="Provider">
                {payment.provider}
              </InfoRow>
            ) : (
              <>
                <InfoRow label="Bank">
                  {payment.bank}
                </InfoRow>

                <InfoRow
                  label="Reference"
                  mono
                >
                  {payment.reference ?? "—"}
                </InfoRow>
              </>
            )}

            <InfoRow label="Date">
              {payment.date}
            </InfoRow>

            <InfoRow label="Time">
              {payment.time}
            </InfoRow>
          </InfoSection>

          {/* Invoice */}

          <InfoSection
            icon={FileText}
            title="Invoice"
          >
            <InfoRow label="Invoice number">
              <Link
                href={`/revenue/invoices/${payment.invoiceNumber}`}
                className="font-mono text-xs text-primary hover:underline"
              >
                {payment.invoiceNumber}
              </Link>
            </InfoRow>

            <InfoRow label="Amount">
              ETB {formatETB(payment.amount)}
            </InfoRow>
          </InfoSection>

          {/* Record */}

          <InfoSection
            icon={ReceiptText}
            title="Payment record"
          >
            <InfoRow label="Receipt number" mono>
              {payment.receiptNumber}
            </InfoRow>

            <InfoRow label="Payment number" mono>
              {payment.paymentNumber}
            </InfoRow>

            <InfoRow label="Processed by">
              {payment.processedBy}
            </InfoRow>

            <InfoRow label="Processed at">
              {payment.processedAt}
            </InfoRow>
          </InfoSection>
        </div>

        {/* ===================================================
            ACTIONS
            =================================================== */}

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button
            asChild
            variant="ghost"
            size="sm"
          >
            <Link href="/revenue/payments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to payments
            </Link>
          </Button>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigator.clipboard?.writeText(payment.id)
              }
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy payment ID
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log(
                  "View receipt:",
                  payment.receiptNumber,
                );
              }}
            >
              <ReceiptText className="mr-2 h-4 w-4" />
              View receipt
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}