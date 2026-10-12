"use client";

import { useState } from "react";
import { Check, CheckCircle2, Clock3, Copy, XCircle } from "lucide-react";

import type { Payment } from "@/types/payment";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Routes                                                                     */
/* -------------------------------------------------------------------------- */

/** Adjust if your payment pages live under a different path. */
export const PAYMENTS_BASE_PATH = "/citizen/dashboard/payments";
export const INVOICES_BASE_PATH = "/citizen/dashboard/invoices";

export function getPaymentDetailHref(paymentId: string): string {
  return `${PAYMENTS_BASE_PATH}/${paymentId}`;
}

/* -------------------------------------------------------------------------- */
/* Status styles                                                              */
/* -------------------------------------------------------------------------- */

export type StatusStyle = {
  label: string;
  className: string;
  icon: typeof CheckCircle2;
};

const MUTED_STYLE = "border-muted bg-muted/60 text-muted-foreground";

const STATUS_STYLES: Record<string, StatusStyle> = {
  COMPLETED: {
    label: "Completed",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  PENDING: {
    label: "Pending",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    icon: Clock3,
  },
  PROCESSING: {
    label: "Processing",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
    icon: Clock3,
  },
  FAILED: {
    label: "Failed",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
    icon: XCircle,
  },
  CANCELLED: { label: "Cancelled", className: MUTED_STYLE, icon: XCircle },
  EXPIRED: { label: "Expired", className: MUTED_STYLE, icon: Clock3 },
};

/* -------------------------------------------------------------------------- */
/* Formatting helpers                                                         */
/* -------------------------------------------------------------------------- */

export function formatLabel(value: string | null | undefined): string {
  if (!value) return "Unknown";

  const text = value.replace(/_/g, " ").toLowerCase();

  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatCurrency(
  amount: number | null | undefined,
  currency: string | null | undefined = "ETB",
): string {
  const value = Number(amount ?? 0);
  const safeValue = Number.isFinite(value) ? value : 0;
  const code = currency || "ETB";

  try {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeValue);
  } catch {
    return `${code} ${safeValue.toFixed(2)}`;
  }
}

function toValidDate(date: string | null | undefined): Date | null {
  if (!date) return null;

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateTime(date: string | null | undefined): string {
  const parsed = toValidDate(date);

  if (!parsed) return "—";

  return new Intl.DateTimeFormat("en-ET", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function formatDate(date: string | null | undefined): string {
  const parsed = toValidDate(date);

  if (!parsed) return "—";

  return new Intl.DateTimeFormat("en-ET", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

/* -------------------------------------------------------------------------- */
/* Payment helpers                                                            */
/* -------------------------------------------------------------------------- */

export function getStatusStyle(status: string): StatusStyle {
  return (
    STATUS_STYLES[status] ?? {
      label: formatLabel(status),
      className: MUTED_STYLE,
      icon: Clock3,
    }
  );
}

/**
 * The API returns payment_provider as a plain string ("CHAPA"),
 * while the shared type describes an object. Support both.
 */
export function getProviderName(payment: Payment): string | null {
  const provider = payment.payment_provider as unknown;

  if (!provider) return null;

  if (typeof provider === "string") return formatLabel(provider);

  if (typeof provider === "object" && "name" in provider) {
    const name = (provider as { name?: string | null }).name;

    return name ? name : null;
  }

  return null;
}

export function getPaymentDate(payment: Payment): string | null {
  return payment.status === "COMPLETED"
    ? (payment.verified_at ?? payment.created_at)
    : (payment.created_at ?? payment.verified_at);
}

export function getRetryHref(payment: Payment): string | null {
  return payment.status === "FAILED" && payment.invoice_id
    ? `${INVOICES_BASE_PATH}/${payment.invoice_id}/pay`
    : null;
}

/** A short, plain-language note that tells the user what is happening. */
export function getStatusHint(payment: Payment): string | null {
  switch (payment.status) {
    case "FAILED":
      return payment.failure_reason ?? "This payment did not go through.";
    case "PENDING":
    case "PROCESSING":
      return payment.payment_method === "BANK_TRANSFER"
        ? "Waiting for the finance team to verify your transfer."
        : "Waiting for confirmation from the payment provider.";
    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Shared components                                                          */
/* -------------------------------------------------------------------------- */

export function StatusPill({ status }: { status: string }) {
  const style = getStatusStyle(status);
  const Icon = style.icon;

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        style.className,
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      {style.label}
    </span>
  );
}

export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Clipboard may be unavailable (e.g. insecure context). */
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}