
import type {
    CashReconciliation,
    CashReconciliationStatus,
    CashReconciliationReviewDecision,
  } from "@/types/cash-reconciliation";
  
  export const STATUS_OPTIONS: {
    value: CashReconciliationStatus;
    label: string;
  }[] = [
    { value: "DRAFT", label: "Draft" },
    { value: "PENDING_REVIEW", label: "Pending Review" },
    { value: "RECONCILED", label: "Reconciled" },
    { value: "DISCREPANCY", label: "Discrepancy" },
    { value: "RETURNED", label: "Returned" },
    { value: "CANCELLED", label: "Cancelled" },
  ];
  
  export const REVIEW_ACTIONS: {
    value: CashReconciliationReviewDecision;
    label: string;
    description: string;
  }[] = [
    {
      value: "RECONCILED",
      label: "Reconcile",
      description:
        "Confirm the closing after the backend validates the reconciliation.",
    },
    {
      value: "DISCREPANCY",
      label: "Flag discrepancy",
      description:
        "Record a shortage or surplus that requires further investigation.",
    },
    {
      value: "RETURNED",
      label: "Return for correction",
      description:
        "Return the closing to the collector for correction or additional evidence.",
    },
  ];
  
  export function toApiDateBoundary(
    date: Date,
    endOfDay = false,
  ): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const time = endOfDay ? "23:59:59" : "00:00:00";
  
    return `${year}-${month}-${day} ${time}`;
  }
  
  export function parseApiDate(
    value: string | null | undefined,
  ): Date | undefined {
    if (!value) return undefined;
  
    const datePart = value.slice(0, 10);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  
    if (!match) {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }
  
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(year, month - 1, day);
  
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return undefined;
    }
  
    return parsed;
  }
  
  export function sameCalendarDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
  
  export function formatMoney(
    value: string | number | null | undefined,
  ): string {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
  
    const amount = Number(value);
  
    if (!Number.isFinite(amount)) return "—";
  
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  
  export function formatDate(
    value: string | null | undefined,
  ): string {
    if (!value) return "—";
  
    const date = parseApiDate(value);
  
    if (!date) return value;
  
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }
  
  export function formatDateTime(
    value: string | null | undefined,
  ): string {
    if (!value) return "—";
  
    const date = new Date(
      value.includes("T") ? value : value.replace(" ", "T"),
    );
  
    if (Number.isNaN(date.getTime())) return value;
  
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }
  
  export function getStatusLabel(
    status: CashReconciliationStatus,
  ): string {
    return (
      STATUS_OPTIONS.find((option) => option.value === status)?.label ??
      status.replaceAll("_", " ")
    );
  }
  
  export function getStatusVariant(
    status: CashReconciliationStatus,
  ): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case "RECONCILED":
        return "default";
      case "DISCREPANCY":
        return "destructive";
      case "PENDING_REVIEW":
        return "secondary";
      case "RETURNED":
      case "CANCELLED":
        return "outline";
      case "DRAFT":
      default:
        return "secondary";
    }
  }
  
  export function getDifferenceLabel(
    value: string | number | null | undefined,
  ): string {
    if (value === null || value === undefined || value === "") {
      return "Not recorded";
    }
  
    const difference = Number(value);
  
    if (!Number.isFinite(difference)) return "Not recorded";
    if (difference > 0) return "Cash surplus";
    if (difference < 0) return "Cash shortage";
  
    return "Balanced";
  }
  
  export function getCollectorName(record: CashReconciliation): string {
    return (
      record.collector?.full_name ||
      record.collector?.name ||
      record.collector?.email ||
      record.collector_id
    );
  }
  