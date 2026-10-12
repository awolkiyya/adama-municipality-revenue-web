import { CollectionRecord, CollectionStatus, OptionalInvoiceFields, OptionalItemFields } from "@/types/field-collection"
import { FileView, PaymentView } from "@/types/payment/ui"
import type {
    DirectCollectionInvoice,
  } from "@/types/revenue/direct-collection"
  

  
  export function toNumber(
    value: unknown,
  ): number {
    if (typeof value === "number") {
      return Number.isFinite(value)
        ? value
        : 0
    }
  
    if (
      typeof value === "string" &&
      value.trim() !== ""
    ) {
      const parsed = Number(value)
  
      return Number.isFinite(parsed)
        ? parsed
        : 0
    }
  
    return 0
  }
  
  export function formatCurrency(
    amount: number,
  ): string {
    return new Intl.NumberFormat(
      "en-ET",
      {
        style: "currency",
        currency: "ETB",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(amount)
  }
  
  export function formatDate(
    value: string | null | undefined,
  ): string {
    if (!value) {
      return "—"
    }
  
    const date = new Date(value)
  
    if (Number.isNaN(date.getTime())) {
      return value
    }
  
    return new Intl.DateTimeFormat(
      "en-ET",
      {
        year: "numeric",
        month: "short",
        day: "2-digit",
      },
    ).format(date)
  }
  
  export function resolveCollectionStatus(
    collection: DirectCollectionInvoice,
  ): CollectionStatus {
    const status = String(
      collection.invoice?.status ?? "",
    ).toUpperCase()
  
    switch (status) {
      case "PAID":
      case "COLLECTED":
        return "COLLECTED"
  
      case "PARTIALLY_PAID":
        return "PARTIALLY_PAID"
  
      case "CANCELLED":
      case "CANCELED":
        return "CANCELLED"
  
      case "ISSUED":
      case "PENDING":
      case "DRAFT":
      default:
        return "PENDING"
    }
  }
  
  export function resolveApiStatus(
    status: string,
  ): string | undefined {
    switch (status) {
      case "PENDING":
        return "ISSUED"
  
      case "PARTIALLY_PAID":
        return "PARTIALLY_PAID"
  
      case "COLLECTED":
        return "PAID"
  
      case "CANCELLED":
        return "CANCELLED"
  
      default:
        return undefined
    }
  }
  
  export function getInvoiceFields(
    collection: DirectCollectionInvoice,
  ): OptionalInvoiceFields {
    return (
      collection.invoice as
        | OptionalInvoiceFields
        | null
        | undefined
    ) ?? {}
  }
  
  export function getFirstItem(
    collection: DirectCollectionInvoice,
  ): OptionalItemFields {
    const item = collection.items?.[0]
  
    if (!item) {
      return {}
    }
  
    return item as typeof item &
      OptionalItemFields
  }
  
  export function mapDirectCollection(
    collection: DirectCollectionInvoice,
  ): CollectionRecord {
    const invoice =
      getInvoiceFields(collection)
  
    const item =
      getFirstItem(collection)
  
    const service =
      item.service ?? null
  
    const invoiceId =
      invoice.id ??
      collection.id
  
    const amount =
      toNumber(
        invoice.total_amount ??
          invoice.amount ??
          item.amount ??
          0,
      )
  
    const status =
      resolveCollectionStatus(collection)
  
    let paidAmount =
      toNumber(
        invoice.paid_amount ??
          invoice.amount_paid ??
          0,
      )
  
    if (
      String(invoice.status ?? "").toUpperCase() ===
        "PAID" &&
      paidAmount === 0
    ) {
      paidAmount = amount
    }
  
    const calculatedBalance =
      Math.max(
        amount - paidAmount,
        0,
      )
  
    const explicitBalance =
      invoice.balance_due ??
      invoice.balance
  
    const reportedBalance =
      explicitBalance !== null &&
      explicitBalance !== undefined
        ? Math.max(
            toNumber(explicitBalance),
            0,
          )
        : 0
  
    const balance =
      calculatedBalance === 0
        ? 0
        : reportedBalance > 0
          ? Math.min(
              reportedBalance,
              calculatedBalance,
            )
          : calculatedBalance
  
    const serviceId =
      item.service_id ??
      collection.revenue_service_id ??
      ""
  
    return {
      id: collection.id,
  
      invoiceId,
  
      invoiceNumber:
        invoice.invoice_number ?? "—",
  
      taxpayerId:
        collection.taxpayer_id ??
        collection.taxpayer?.id ??
        "",
  
      taxpayerName:
        collection.taxpayer?.name ??
        "Unknown taxpayer",
  
      taxpayerPhone:
        collection.taxpayer?.phone ??
        "—",
  
      serviceId,
  
      serviceName:
        item.service_name ??
        service?.name ??
        "—",
  
      revenueDomain:
        service?.revenue_domain ??
        service?.domain ??
        "—",
  
      tariffCode:
        item.tariff_code ??
        item.tariff_rule_id ??
        "—",
  
      tariffName:
        item.tariff_name ??
        "—",
  
      tariffUnit:
        item.unit ??
        service?.unit ??
        "—",
  
      tariffRate:
        toNumber(item.unit_price),
  
      quantity:
        toNumber(item.quantity ?? 1),
  
      amount,
  
      paidAmount,
  
      balance,
  
      dueDate:
        invoice.due_date ?? null,
  
      status,
  
      createdAt:
        invoice.created_at ?? null,
    }
  }
  
  export function getStatusLabel(
    status: CollectionStatus,
  ): string {
    switch (status) {
      case "PENDING":
        return "Pending"
  
      case "PARTIALLY_PAID":
        return "Partially Paid"
  
      case "COLLECTED":
        return "Collected"
  
      case "CANCELLED":
        return "Cancelled"
    }
  }
  
  export function getStatusClassName(
    status: CollectionStatus,
  ): string {
    switch (status) {
      case "PENDING":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20"
  
      case "PARTIALLY_PAID":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20"
  
      case "COLLECTED":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
  
      case "CANCELLED":
        return "bg-red-500/10 text-red-700 border-red-500/20"
  
      default:
        return ""
    }
  }



export const TERMINAL_FAILURES = ["FAILED", "CANCELLED", "EXPIRED"];

export const errorMessage = (e: unknown) =>
  e && typeof e === "object" && "message" in e && typeof e.message === "string"
    ? e.message
    : "Something went wrong. Please try again.";

export const label = (v?: string | null) =>
  v
    ? v
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

export function money(amount: number | string | null | undefined, currency = "ETB") {
  if (amount == null || amount === "") return null;
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)} ${currency}`;
}


export function fileMeta(f: FileView) {
  const type = !f.mime_type
    ? "Document"
    : f.mime_type === "application/pdf"
      ? "PDF"
      : f.mime_type.startsWith("image/")
        ? "Image"
        : f.mime_type;
  const size = f.size
    ? f.size < 1024 * 1024
      ? `${(f.size / 1024).toFixed(1)} KB`
      : `${(f.size / 1024 / 1024).toFixed(1)} MB`
    : null;
  return [type, size, formatDate(f.created_at)].filter(Boolean).join(" · ");
}

export const METHOD_LABEL: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank transfer",
  ONLINE: "Online",
  OTHER: "Other",
};

export const PROVIDER_LABEL: Record<string, string> = {
  CBE: "Commercial Bank of Ethiopia",
  TELEBIRR: "Telebirr",
  CHAPA: "Chapa",
};

export const providerName = (v?: string | null) =>
  v ? (PROVIDER_LABEL[v] ?? label(v)) : null;

/** Status → icon + theme-aware colours (light and dark). */
export const STATUS_STYLE: Record<string, string> = {
  COMPLETED:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  PENDING:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  PROCESSING: "border-primary/30 bg-primary/10 text-primary",
  FAILED: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function statusMessage(p: PaymentView) {
  switch (p.status) {
    case "PENDING":
      return p.payment_method === "CASH"
        ? "Waiting for the cash to be collected and confirmed."
        : p.payment_method === "BANK_TRANSFER"
          ? "Waiting for the bank transfer to be verified."
          : "Waiting to be processed.";
    case "PROCESSING":
      return "The payment is being processed.";
    case "COMPLETED":
      return p.receipt
        ? "Payment completed. The official receipt is the confirmation."
        : "Payment completed. The receipt is being issued.";
    case "FAILED":
      return p.failure_reason || "The payment attempt failed.";
    case "CANCELLED":
      return "This payment was cancelled.";
    case "EXPIRED":
      return "This payment attempt expired.";
    default:
      return label(p.status) ?? "";
  }
}

export function methodDescription(p: PaymentView) {
  const base = METHOD_LABEL[p.payment_method] ?? label(p.payment_method) ?? "";
  const detail =
    p.payment_method === "CASH"
      ? "Municipal office"
      : p.payment_method === "BANK_TRANSFER"
        ? p.bank_transfer_details?.bank_account?.bank_name
        : p.payment_method === "ONLINE"
          ? (p.online_details?.payment_provider?.name ??
            providerName(p.payment_provider))
          : null;
  return detail ? `${base} · ${detail}` : base;
}

export function paymentDate(p: PaymentView) {
  switch (p.payment_method) {
    case "CASH":
      return p.cash_details?.cash_received_at ?? p.created_at;
    case "BANK_TRANSFER":
      return p.bank_transfer_details?.transfer_date ?? p.created_at;
    case "ONLINE":
      return p.online_details?.paid_at ?? p.created_at;
    default:
      return p.created_at;
  }
}

export function serviceSummary(p: PaymentView) {
  const items = p.invoice?.items ?? [];
  if (items.length === 0) return "Revenue payment";
  if (items.length === 1)
    return items[0].service?.name || items[0].description || "Revenue service";
  return `${items.length} billed services`;
}

export function taxpayerName(p: PaymentView) {
  return (
    p.citizen?.full_name ||
    p.citizen?.name ||
    p.invoice?.citizen?.full_name ||
    p.invoice?.citizen?.name ||
    p.payer?.name ||
    "Name not available"
  );
}