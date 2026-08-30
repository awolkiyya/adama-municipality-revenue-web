import { InvoiceStatus } from "./citizen/types";

const STATUS_STYLES: Record<InvoiceStatus, { label: string; className: string }> = {
    ISSUED: {
      label: "Unpaid",
      className: "bg-[var(--galii-warning-bg)] text-[var(--galii-warning)]",
    },
    PARTIALLY_PAID: {
      label: "Partial",
      className: "bg-[var(--galii-info-bg)] text-[var(--galii-info)]",
    },
    PAID: {
      label: "Paid",
      className: "bg-[var(--galii-success-bg)] text-[var(--galii-success)]",
    },
    OVERDUE: {
      label: "Overdue",
      className: "bg-[var(--galii-danger-bg)] text-[var(--galii-danger)]",
    },
    VOID: {
      label: "Void",
      className: "bg-[var(--galii-border)] text-[var(--galii-text-faint)]",
    },
  };
  
  export function StatusPill({ status }: { status: InvoiceStatus }) {
    const { label, className } = STATUS_STYLES[status];
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold shrink-0 ${className}`}>
        {label}
      </span>
    );
  }