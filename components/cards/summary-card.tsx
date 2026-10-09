
"use client";

import * as React from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Info,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/* =========================================================
   TYPES
   ========================================================= */

export type SummaryCardTone =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type SummaryCardTrend = {
  value: string;
  label?: string;
  direction?: "up" | "down" | "neutral";
  tone?: "success" | "warning" | "danger" | "neutral";
};

export interface SummaryCardProps {
  label: string;
  value: React.ReactNode;
  description?: string;
  icon?: LucideIcon;
  tone?: SummaryCardTone;
  iconClassName?: string;
  className?: string;
  trend?: SummaryCardTrend;
  attention?: boolean;
  loading?: boolean;
  onClick?: () => void;
  action?: React.ReactNode;
  valueLabel?: string;
  footer?: React.ReactNode;
}

/* =========================================================
   SEMANTIC THEME STYLES
   ========================================================= */

const toneStyles: Record<
  SummaryCardTone,
  {
    icon: string;
    border: string;
  }
> = {
  default: {
    icon: "bg-muted text-muted-foreground",
    border: "border-border",
  },
  primary: {
    icon: "bg-primary/10 text-primary",
    border: "border-primary/20",
  },
  success: {
    icon: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  warning: {
    icon: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  danger: {
    icon: "bg-destructive/10 text-destructive",
    border: "border-destructive/20",
  },
  info: {
    icon: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
    border: "border-sky-500/20",
  },
};

const trendStyles: Record<
  NonNullable<SummaryCardTrend["tone"]>,
  string
> = {
  success: "text-emerald-700 dark:text-emerald-400",
  warning: "text-amber-700 dark:text-amber-400",
  danger: "text-destructive",
  neutral: "text-muted-foreground",
};

/* =========================================================
   SKELETON
   ========================================================= */

function SummaryCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="min-h-[148px] animate-pulse rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-8 w-36 max-w-full rounded bg-muted" />
          <div className="h-3 w-44 max-w-full rounded bg-muted/70" />
        </div>

        <div className="h-10 w-10 shrink-0 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
   ========================================================= */

export function SummaryCard({
  label,
  value,
  description,
  icon: Icon = Info,
  tone = "default",
  iconClassName,
  className,
  trend,
  attention = false,
  loading = false,
  onClick,
  action,
  valueLabel,
  footer,
}: SummaryCardProps) {
  if (loading) {
    return <SummaryCardSkeleton />;
  }

  const theme = toneStyles[tone];
  const isInteractive = Boolean(onClick);

  const TrendIcon =
    trend?.direction === "down"
      ? ArrowDownRight
      : trend?.direction === "up"
        ? ArrowUpRight
        : null;

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">
            {label}
          </p>

          <p
            aria-label={valueLabel}
            className="mt-2 break-words text-2xl font-semibold tracking-tight text-foreground tabular-nums"
          >
            {value}
          </p>

          {description && (
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          )}

          {trend && (
            <div
              className={cn(
                "mt-2 flex flex-wrap items-center gap-1 text-xs font-medium",
                trendStyles[trend.tone ?? "neutral"],
              )}
            >
              {TrendIcon && (
                <TrendIcon
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                />
              )}

              <span>{trend.value}</span>

              {trend.label && (
                <span className="font-normal text-muted-foreground">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            theme.icon,
            iconClassName,
          )}
        >
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
      </div>

      {(action || footer || isInteractive) && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">{footer}</div>

          {action}

          {isInteractive && !action && (
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-muted-foreground"
            />
          )}
        </div>
      )}
    </>
  );

  const cardClassName = cn(
    "rounded-xl border bg-card p-5 text-card-foreground transition-colors",
    attention
      ? "border-amber-500/50"
      : theme.border,
    isInteractive &&
      "cursor-pointer hover:bg-accent/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(cardClassName, "block w-full text-left")}
      >
        {content}
      </button>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}

export default SummaryCard;