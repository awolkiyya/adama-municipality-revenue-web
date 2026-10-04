"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  Landmark,
  Smartphone,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/* =========================================================
   TYPES
   ========================================================= */

type PaymentMethod = "ONLINE" | "BANK_TRANSFER";

type PaymentStatus = "POSTED" | "PENDING_VERIFICATION";

type RecentPayment = {
  id: string;
  receiptNumber: string;
  invoiceNumber: string;
  taxpayerName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
};

/* =========================================================
   MOCK DATA
   ========================================================= */

const MOCK_RECENT_PAYMENTS: RecentPayment[] = [
  {
    id: "payment-001",
    receiptNumber: "RCT-2026-00091",
    invoiceNumber: "INV-2026-000021",
    taxpayerName: "Abebe Kebede",
    amount: 2500,
    method: "ONLINE",
    status: "POSTED",
    createdAt: "Today, 10:32 AM",
  },
  {
    id: "payment-002",
    receiptNumber: "RCT-2026-00090",
    invoiceNumber: "INV-2026-000022",
    taxpayerName: "Hana Mohammed",
    amount: 3500,
    method: "BANK_TRANSFER",
    status: "PENDING_VERIFICATION",
    createdAt: "Today, 09:48 AM",
  },
  {
    id: "payment-003",
    receiptNumber: "RCT-2026-00089",
    invoiceNumber: "INV-2026-000023",
    taxpayerName: "Mohammed Ali",
    amount: 1900,
    method: "ONLINE",
    status: "POSTED",
    createdAt: "Yesterday, 04:21 PM",
  },
  {
    id: "payment-004",
    receiptNumber: "RCT-2026-00088",
    invoiceNumber: "INV-2026-000024",
    taxpayerName: "Abebe Kebede",
    amount: 4200,
    method: "BANK_TRANSFER",
    status: "POSTED",
    createdAt: "Yesterday, 02:14 PM",
  },
];

/* =========================================================
   CONFIGURATION
   ========================================================= */

const METHOD_CONFIG: Record<
  PaymentMethod,
  {
    label: string;
    icon: React.ElementType;
  }
> = {
  ONLINE: {
    label: "Online",
    icon: Smartphone,
  },

  BANK_TRANSFER: {
    label: "Bank transfer",
    icon: Landmark,
  },
};

const STATUS_CONFIG: Record<
  PaymentStatus,
  {
    label: string;
    className: string;
    icon: React.ElementType;
  }
> = {
  POSTED: {
    label: "Posted",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    icon: CheckCircle2,
  },

  PENDING_VERIFICATION: {
    label: "Pending verification",
    className:
      "bg-amber-50 text-amber-700 ring-amber-600/20",
    icon: Clock3,
  },
};

/* =========================================================
   HELPERS
   ========================================================= */

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/* =========================================================
   PAGE
   ========================================================= */

export default function AgentDashboardPage() {
  const todayPayments = MOCK_RECENT_PAYMENTS.filter((payment) =>
    payment.createdAt.startsWith("Today"),
  );

  const postedToday = todayPayments
    .filter((payment) => payment.status === "POSTED")
    .reduce((total, payment) => total + payment.amount, 0);

  const transactionsToday = todayPayments.length;

  const pendingPayments = MOCK_RECENT_PAYMENTS.filter(
    (payment) => payment.status === "PENDING_VERIFICATION",
  );

  const pendingCount = pendingPayments.length;

  const pendingAmount = pendingPayments.reduce(
    (total, payment) => total + payment.amount,
    0,
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-7">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <WalletCards className="h-3.5 w-3.5" />
            <span>Revenue</span>
            <span className="text-border">/</span>
            <span className="text-foreground">
              Agent Dashboard
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Agent Dashboard
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Process taxpayer payments and monitor your activity.
          </p>
        </div>

        <Button asChild>
          <Link href="/agent/dashboard/payments/process">
            Process payment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </header>

      {/* =====================================================
          KEY METRICS
          ===================================================== */}

      <section aria-label="Payment activity">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            icon={Banknote}
            label="Posted today"
            value={`ETB ${formatCurrency(postedToday)}`}
            description="Successfully posted payments"
          />

          <MetricCard
            icon={CreditCard}
            label="Transactions today"
            value={transactionsToday.toString()}
            description="Payments processed today"
          />

          <MetricCard
            icon={Clock3}
            label="Pending verification"
            value={pendingCount.toString()}
            description={
              pendingCount > 0
                ? `ETB ${formatCurrency(
                    pendingAmount,
                  )} awaiting verification`
                : "Nothing requires verification"
            }
            href={
              pendingCount > 0
                ? "/agent/dashboard/payments?status=PENDING_VERIFICATION"
                : undefined
            }
            attention={pendingCount > 0}
          />
        </div>
      </section>
      {/* =====================================================
          RECENT PAYMENTS
          ===================================================== */}

      <section>
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">
                Recent payments
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Your latest payment activity.
              </p>
            </div>

            <Button asChild variant="ghost" size="sm">
              <Link href="/agent/dashboard/payments">
                View all
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">
                    Payment
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">
                    Taxpayer
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">
                    Method
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {MOCK_RECENT_PAYMENTS.map((payment) => {
                  const method = METHOD_CONFIG[payment.method];
                  const status = STATUS_CONFIG[payment.status];

                  const MethodIcon = method.icon;
                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={payment.id}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      {/* Payment */}
                      <td className="px-5 py-4">
                        <Link
                          href={`/agent/dashboard/payments/${payment.id}`}
                          className="group inline-block"
                        >
                          <p className="font-medium text-foreground group-hover:text-primary">
                            {payment.receiptNumber}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {payment.invoiceNumber}
                          </p>
                        </Link>
                      </td>

                      {/* Taxpayer */}
                      <td className="px-5 py-4">
                        <span className="font-medium">
                          {payment.taxpayerName}
                        </span>
                      </td>

                      {/* Method */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MethodIcon className="h-4 w-4 shrink-0" />

                          <span>{method.label}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 text-right">
                        <span className="font-medium tabular-nums">
                          ETB {formatCurrency(payment.amount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`
                            inline-flex
                            items-center
                            gap-1.5
                            whitespace-nowrap
                            rounded-full
                            px-2.5
                            py-1
                            text-xs
                            font-medium
                            ring-1
                            ring-inset
                            ${status.className}
                          `}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-right text-muted-foreground">
                        {payment.createdAt}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}

/* =========================================================
   METRIC CARD
   ========================================================= */

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  href,
  attention = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
  href?: string;
  attention?: boolean;
}) {
  const content = (
    <Card
      className={
        href
          ? "transition-colors hover:border-foreground/20 hover:bg-muted/20"
          : undefined
      }
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              {label}
            </p>

            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
              {value}
            </p>

            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          </div>

          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              attention ? "bg-amber-50" : "bg-muted",
            ].join(" ")}
          >
            <Icon
              className={[
                "h-5 w-5",
                attention
                  ? "text-amber-600"
                  : "text-muted-foreground",
              ].join(" ")}
            />
          </div>
        </div>

        {href && (
          <div className="mt-4 flex items-center text-xs font-medium text-primary">
            Review pending payments
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}