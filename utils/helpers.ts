import { CollectionRecord, CollectionStatus, OptionalInvoiceFields, OptionalItemFields } from "@/types/field-collection"
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