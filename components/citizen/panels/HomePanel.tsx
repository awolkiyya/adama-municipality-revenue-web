"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  User,
  WalletCards,
} from "lucide-react";

import { useSelector } from "react-redux";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { RootState } from "@/lib/store/store";

import {
  IconTile,
  SectionCard,
  DataRow,
  StatusPill,
} from "../primitives";

import {
  INVOICES,
  PAYMENTS,
} from "../data";

import {
  formatAmount,
  formatDate,
} from "../utils";

import type { TabKey, Tone } from "../types";

/*
|--------------------------------------------------------------------------
| Home Panel
|--------------------------------------------------------------------------
|
| Citizen-facing dashboard.
|
| Main goals:
|
| 1. Show outstanding balance immediately.
| 2. Show a single, non-repeated account overview.
| 3. Show recent activity.
|
| Navigation lives in the bottom nav (mobile) / sidebar (web), so no
| quick-actions block is needed here.
|
*/

interface HomePanelProps {
  onNavigate: (key: TabKey) => void;
  totalOutstanding: number;
  unpaidCount: number;
  paidCount: number;
  totalInvoiceCount: number;
}

export function HomePanel({
  onNavigate,
  totalOutstanding,
  unpaidCount,
  paidCount,
  totalInvoiceCount,
}: HomePanelProps) {
  /*
  |--------------------------------------------------------------------------
  | Auth State
  |--------------------------------------------------------------------------
  */

  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  const citizen = user?.citizen;

  const fullName =
    citizen?.full_name || user?.name || "Citizen";

  const citizenId =
    citizen?.citizen_uid || "Not available";

  const isActive = user?.is_active;

  /*
  |--------------------------------------------------------------------------
  | Derived Values
  |--------------------------------------------------------------------------
  */

  const clearance =
    totalInvoiceCount === 0
      ? 100
      : Math.round(
          (paidCount / totalInvoiceCount) * 100
        );

  const recentInvoices = INVOICES.slice(0, 4);

  const recentPayments = PAYMENTS
    .filter(
      (payment) =>
        payment.status === "SUCCESS"
    )
    .slice(0, 3);

  const hasOutstanding =
    unpaidCount > 0 &&
    totalOutstanding > 0;

  /*
  |--------------------------------------------------------------------------
  | Auth Guard
  |--------------------------------------------------------------------------
  |
  | Mirrors the loading guard in ProfilePanel — don't try to render the
  | welcome card until the authenticated user is available.
  |
  */

  if (!user) {
    return (
      <div className="space-y-5">
        <Card className="rounded-[22px] border-[var(--galii-border)]">
          <CardContent className="p-5 md:p-6 space-y-3">
            <div className="h-6 w-56 rounded bg-[var(--galii-surface-muted)] animate-pulse" />
            <div className="h-4 w-32 rounded bg-[var(--galii-surface-muted)] animate-pulse" />
          </CardContent>
        </Card>

        <Card className="rounded-[20px] border-[var(--galii-border)]">
          <CardContent className="p-5 md:p-6">
            <div className="h-9 w-40 rounded bg-[var(--galii-surface-muted)] animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-5">
      {/* ==============================================================
          WELCOME
      ============================================================== */}

      <Card className="overflow-hidden rounded-[22px] border-[var(--galii-border)] bg-[var(--galii-primary)] text-white shadow-sm">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <User className="h-4 w-4" />
                </div>

                <p className="text-[11px] font-medium text-white/65">
                  Citizen account
                </p>
              </div>

              <h1 className="mt-3 truncate text-[23px] font-bold leading-tight galii-serif">
                Welcome, {fullName}
              </h1>

              <p className="mt-1.5 text-[11px] text-white/60 galii-mono">
                {citizenId}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-2">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--galii-gold-light)]" />

              <span className="text-[11px] font-semibold">
                {isActive
                  ? "Active account"
                  : "Inactive account"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==============================================================
          AMOUNT DUE
      ============================================================== */}

      <Card
        className={`
          rounded-[20px]
          border
          ${
            hasOutstanding
              ? "border-[var(--galii-danger)]/20"
              : "border-[var(--galii-success)]/20"
          }
          bg-[var(--galii-surface)]
          shadow-sm
        `}
      >
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <IconTile
                icon={
                  hasOutstanding
                    ? WalletCards
                    : CheckCircle2
                }
                tone={
                  hasOutstanding
                    ? "danger"
                    : "success"
                }
                size={11}
              />

              <div>
                <p className="text-[12px] font-medium text-[var(--galii-text-muted)]">
                  {hasOutstanding
                    ? "Amount outstanding"
                    : "No outstanding balance"}
                </p>

                <p
                  className={`
                    mt-1
                    text-[28px]
                    font-bold
                    leading-none
                    galii-serif
                    ${
                      hasOutstanding
                        ? "text-[var(--galii-text)]"
                        : "text-[var(--galii-success)]"
                    }
                  `}
                >
                  {formatAmount(
                    totalOutstanding,"ETB"
                  )}
                </p>

                <p className="mt-2 text-[11px] text-[var(--galii-text-faint)]">
                  {hasOutstanding
                    ? `${unpaidCount} unpaid ${
                        unpaidCount === 1
                          ? "invoice"
                          : "invoices"
                      }`
                    : "All your recorded invoices are settled"}
                </p>
              </div>
            </div>

            {hasOutstanding && (
              <button
                type="button"
                onClick={() =>
                  onNavigate("invoices")
                }
                className="
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  gap-2
                  rounded-[11px]
                  bg-[var(--galii-primary)]
                  px-4
                  text-[11.5px]
                  font-semibold
                  text-white
                  transition
                  hover:opacity-90
                "
              >
                View invoices
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ==============================================================
          ACCOUNT OVERVIEW
          (single source of truth for invoice/paid/unpaid counts —
          previously duplicated in a separate 3-card grid above this)
      ============================================================== */}

      <SectionCard title="Account overview">
        <div className="grid gap-6 md:grid-cols-[120px_1fr] md:items-center">
          <ProgressRing percent={clearance} />

          <div className="space-y-1">
            <DataRow
              label="Total invoices"
              value={String(
                totalInvoiceCount
              )}
              mono
            />

            <DataRow
              label="Paid invoices"
              value={String(paidCount)}
              mono
            />

            <DataRow
              label="Outstanding invoices"
              value={String(unpaidCount)}
              mono
            />

            <DataRow
              label="Outstanding amount"
              value={formatAmount(
                totalOutstanding,"ETB"
              )}
              mono
              last
            />
          </div>
        </div>
      </SectionCard>

      {/* ==============================================================
          RECENT ACTIVITY
      ============================================================== */}

      <SectionCard
        title="Recent activity"
        action={
          <button
            type="button"
            onClick={() =>
              onNavigate("payments")
            }
            className="
              inline-flex
              items-center
              gap-1
              text-[11px]
              font-semibold
              text-[var(--galii-primary)]
              hover:opacity-80
            "
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </button>
        }
      >
        {recentInvoices.length > 0 ? (
          <div>
            {recentInvoices.map(
              (invoice, index) => (
                <div key={invoice.id}>
                  <ActivityRow
                    icon={
                      invoice.status ===
                      "PAID"
                        ? CheckCircle2
                        : FileText
                    }
                    tone={
                      invoice.status ===
                      "PAID"
                        ? "success"
                        : "primary"
                    }
                    title={
                      invoice.id
                    }
                    meta={`${invoice.invoice_number} · ${formatDate(
                      invoice.issued_at
                    )}`}
                    badge={
                      <StatusPill
                        status={
                          invoice.status
                        }
                      />
                    }
                  />

                  {index <
                    recentInvoices.length -
                      1 && (
                    <Separator className="bg-[var(--galii-border)]" />
                  )}
                </div>
              )
            )}
          </div>
        ) : (
          <EmptyActivity />
        )}
      </SectionCard>

      {/* ==============================================================
          RECENT PAYMENTS
      ============================================================== */}

      {recentPayments.length > 0 && (
        <SectionCard
          title="Recent payments"
          action={
            <button
              type="button"
              onClick={() =>
                onNavigate("payments")
              }
              className="
                inline-flex
                items-center
                gap-1
                text-[11px]
                font-semibold
                text-[var(--galii-primary)]
              "
            >
              Payment history
              <ArrowRight className="h-3 w-3" />
            </button>
          }
        >
          <div>
            {recentPayments.map(
              (payment, index) => (
                <div key={payment.id}>
                  <PaymentActivityRow
                    payment={payment}
                  />

                  {index <
                    recentPayments.length -
                      1 && (
                    <Separator className="bg-[var(--galii-border)]" />
                  )}
                </div>
              )
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* =====================================================================
   ACTIVITY ROW
===================================================================== */

function ActivityRow({
  icon,
  tone,
  title,
  meta,
  badge,
}: {
  icon: LucideIcon;
  tone?: Extract<
    Tone,
    "primary" | "success" | "danger"
  >;
  title: string;
  meta: string;
  badge: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <IconTile
        icon={icon}
        tone={tone}
        size={9}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[10.5px] text-[var(--galii-text-faint)] galii-mono">
          {meta}
        </p>
      </div>

      <div className="shrink-0">
        {badge}
      </div>
    </div>
  );
}

/* =====================================================================
   PAYMENT ACTIVITY
===================================================================== */

function PaymentActivityRow({
  payment,
}: {
  payment: (typeof PAYMENTS)[number];
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <IconTile
        icon={CheckCircle2}
        tone="success"
        size={9}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold">
          Payment completed
        </p>

        <p className="mt-0.5 truncate text-[10.5px] text-[var(--galii-text-faint)] galii-mono">
          {payment.transaction_number}
        </p>

        <p className="mt-0.5 text-[10.5px] text-[var(--galii-text-muted)]">
          {payment.method} ·{" "}
          {payment.paid_at}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="galii-mono text-[12px] font-semibold">
          {formatAmount(
            payment.amount,"ETB"
          )}
        </p>

        <p className="mt-1 text-[9.5px] font-medium text-[var(--galii-success)]">
          Paid
        </p>
      </div>
    </div>
  );
}

/* =====================================================================
   PROGRESS RING
===================================================================== */

function ProgressRing({
  percent,
}: {
  percent: number;
}) {
  const safePercent = Math.min(
    100,
    Math.max(0, percent)
  );

  const radius = 40;
  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference *
    (1 - safePercent / 100);

  return (
    <div className="relative mx-auto h-24 w-24">
      <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="var(--galii-surface-muted)"
          strokeWidth="9"
        />

        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="var(--galii-primary)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition:
              "stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[19px] font-bold leading-none text-[var(--galii-primary)] galii-serif">
          {safePercent}%
        </span>

        <span className="mt-1 text-[8.5px] font-semibold tracking-wide text-[var(--galii-text-faint)]">
          PAID
        </span>
      </div>
    </div>
  );
}

/* =====================================================================
   EMPTY ACTIVITY
===================================================================== */

function EmptyActivity() {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--galii-surface-muted)]">
        <FileText className="h-4 w-4 text-[var(--galii-text-faint)]" />
      </div>

      <p className="mt-3 text-[12px] font-semibold">
        No recent activity
      </p>

      <p className="mt-1 text-[10.5px] text-[var(--galii-text-faint)]">
        Your invoice activity will appear here.
      </p>
    </div>
  );
}