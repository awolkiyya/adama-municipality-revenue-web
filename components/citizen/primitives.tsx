"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { InvoiceStatus, PaymentStatus, Tone } from "./types";

/* =====================================================================
   ICON TILE
===================================================================== */

interface IconTileProps {
  icon: LucideIcon;
  tone?: Tone;
  size?: number; // multiplied by 4px, e.g. 10 -> 40px
}

const TONE_CLASSES: Record<Tone, string> = {
  primary: "bg-[var(--galii-surface-muted)] text-[var(--galii-primary)]",
  success: "bg-[var(--galii-success-bg)] text-[var(--galii-success)]",
  danger: "bg-[var(--galii-danger-bg)] text-[var(--galii-danger)]",
  gold: "bg-[var(--galii-gold)]/15 text-[var(--galii-gold-dark)]",
  muted: "bg-[var(--galii-surface-muted)] text-[var(--galii-text-muted)]",
};

export function IconTile({ icon: Icon, tone = "primary", size = 10 }: IconTileProps) {
  return (
    <div
      className={cn("rounded-[12px] flex items-center justify-center shrink-0", TONE_CLASSES[tone])}
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    >
      <Icon className="h-[45%] w-[45%]" strokeWidth={2} />
    </div>
  );
}

/* =====================================================================
   STATUS PILL
===================================================================== */

type StatusValue = InvoiceStatus | PaymentStatus;

const STATUS_MAP: Record<StatusValue, { label: string; tone: "success" | "danger" | "muted" }> = {
  PAID: { label: "Paid", tone: "success" },
  SUCCESS: { label: "Success", tone: "success" },
  // UNPAID: { label: "Unpaid", tone: "danger" },
  OVERDUE: { label: "Overdue", tone: "danger" },
  FAILED: { label: "Failed", tone: "danger" },
  PENDING: { label: "Pending", tone: "muted" },
  ISSUED: {
    label: "",
    tone: "success"
  },
  PARTIALLY_PAID: {
    label: "",
    tone: "success"
  },
  VOID: {
    label: "",
    tone: "success"
  }
};

const STATUS_TEXT_CLASSES: Record<"success" | "danger" | "muted", string> = {
  success: "text-[var(--galii-success)] bg-[var(--galii-success-bg)]",
  danger: "text-[var(--galii-danger)] bg-[var(--galii-danger-bg)]",
  muted: "text-[var(--galii-text-muted)] bg-[var(--galii-surface-muted)]",
};

const STATUS_DOT_CLASSES: Record<"success" | "danger" | "muted", string> = {
  success: "bg-[var(--galii-success)]",
  danger: "bg-[var(--galii-danger)]",
  muted: "bg-[var(--galii-text-faint)]",
};

export function StatusPill({ status }: { status: StatusValue }) {
  const item = STATUS_MAP[status] ?? STATUS_MAP.PENDING;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0",
        STATUS_TEXT_CLASSES[item.tone]
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT_CLASSES[item.tone])} />
      {item.label}
    </span>
  );
}

/* =====================================================================
   SECTION CARD
===================================================================== */

interface SectionCardProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, action, children, className }: SectionCardProps) {
  return (
    <Card className={cn("rounded-[20px] border-[var(--galii-border)] galii-card-in", className)}>
      <CardContent className="p-5">
        {(title || action) && (
          <div className="flex items-center justify-between mb-3.5">
            {title && <h3 className="font-semibold text-[14.5px] galii-serif">{title}</h3>}
            {action}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

/* =====================================================================
   DATA ROW
===================================================================== */

interface DataRowProps {
  label: string;
  value: string;
  last?: boolean;
  mono?: boolean;
}

export function DataRow({ label, value, last, mono }: DataRowProps) {
  return (
    <div
      className={cn(
        "flex justify-between items-center gap-4 py-3",
        !last && "border-b border-[var(--galii-border)]"
      )}
    >
      <span className="text-[12.5px] text-[var(--galii-text-muted)]">{label}</span>
      <span className={cn("text-[12.5px] font-semibold text-right break-all", mono && "galii-mono")}>{value}</span>
    </div>
  );
}

/* =====================================================================
   EMPTY STATE
===================================================================== */

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Card className="rounded-[20px] border-[var(--galii-border)] border-dashed galii-card-in">
      <CardContent className="py-14 flex flex-col items-center text-center">
        <IconTile icon={icon} size={12} />
        <p className="font-semibold text-[14px] mt-3.5 galii-serif">{title}</p>
        <p className="text-[11.5px] text-[var(--galii-text-muted)] mt-1 max-w-[240px]">{description}</p>
      </CardContent>
    </Card>
  );
}
