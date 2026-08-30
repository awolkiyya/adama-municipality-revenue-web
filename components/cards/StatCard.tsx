"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Accent system — explicit class strings (not dynamically built) so
// Tailwind's JIT compiler can statically detect every class used.
// ---------------------------------------------------------------------------

export type StatAccent =
  | "primary"
  | "emerald"
  | "blue"
  | "amber"
  | "violet"
  | "red"
  | "cyan";

const ACCENT_STYLES: Record<
  StatAccent,
  {
    icon: string;
    glow: string;
    ring: string;
    spark: string;
    /** Resting border tint — gives every card a quiet identity, not just on hover. */
    border: string;
    /** Colored shadow that intensifies on hover, tinted to the accent. */
    shadow: string;
  }
> = {
  primary: {
    icon: "bg-primary/10 text-primary",
    glow: "from-primary/[0.07]",
    ring: "group-hover:border-primary/30",
    spark: "stroke-primary",
    border: "border-primary/15",
    shadow: "shadow-sm shadow-primary/5 hover:shadow-lg hover:shadow-primary/10",
  },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-600",
    glow: "from-emerald-500/[0.07]",
    ring: "group-hover:border-emerald-500/30",
    spark: "stroke-emerald-500",
    border: "border-emerald-500/15",
    shadow: "shadow-sm shadow-emerald-500/5 hover:shadow-lg hover:shadow-emerald-500/10",
  },
  blue: {
    icon: "bg-blue-500/10 text-blue-600",
    glow: "from-blue-500/[0.07]",
    ring: "group-hover:border-blue-500/30",
    spark: "stroke-blue-500",
    border: "border-blue-500/15",
    shadow: "shadow-sm shadow-blue-500/5 hover:shadow-lg hover:shadow-blue-500/10",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-600",
    glow: "from-amber-500/[0.07]",
    ring: "group-hover:border-amber-500/30",
    spark: "stroke-amber-500",
    border: "border-amber-500/15",
    shadow: "shadow-sm shadow-amber-500/5 hover:shadow-lg hover:shadow-amber-500/10",
  },
  violet: {
    icon: "bg-violet-500/10 text-violet-600",
    glow: "from-violet-500/[0.07]",
    ring: "group-hover:border-violet-500/30",
    spark: "stroke-violet-500",
    border: "border-violet-500/15",
    shadow: "shadow-sm shadow-violet-500/5 hover:shadow-lg hover:shadow-violet-500/10",
  },
  red: {
    icon: "bg-red-500/10 text-red-600",
    glow: "from-red-500/[0.07]",
    ring: "group-hover:border-red-500/30",
    spark: "stroke-red-500",
    border: "border-red-500/15",
    shadow: "shadow-sm shadow-red-500/5 hover:shadow-lg hover:shadow-red-500/10",
  },
  cyan: {
    icon: "bg-cyan-500/10 text-cyan-600",
    glow: "from-cyan-500/[0.07]",
    ring: "group-hover:border-cyan-500/30",
    spark: "stroke-cyan-500",
    border: "border-cyan-500/15",
    shadow: "shadow-sm shadow-cyan-500/5 hover:shadow-lg hover:shadow-cyan-500/10",
  },
};

// ---------------------------------------------------------------------------
// TrendBadge — up/down/neutral, with the comparison period as context
// ---------------------------------------------------------------------------

export interface TrendProps {
  /** e.g. 12.4 → renders "+12.4%" */
  value: number;
  direction: "up" | "down" | "neutral";
  /** e.g. "vs last month" */
  period?: string;
}

function TrendBadge({ value, direction, period }: TrendProps) {
  const config = {
    up: { Icon: TrendingUp, className: "text-emerald-600 bg-emerald-500/10" },
    down: { Icon: TrendingDown, className: "text-red-600 bg-red-500/10" },
    neutral: { Icon: Minus, className: "text-muted-foreground bg-muted" },
  }[direction];

  const { Icon, className } = config;
  const sign = direction === "up" ? "+" : direction === "down" ? "\u2212" : "";

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
          className
        )}
      >
        <Icon className="size-3" aria-hidden="true" />
        {sign}
        {Math.abs(value)}%
      </span>
      {period && (
        <span className="text-xs text-muted-foreground">{period}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sparkline — lightweight inline SVG trend line, no charting library needed
// ---------------------------------------------------------------------------

function Sparkline({
  data,
  className,
}: {
  data: number[];
  className?: string;
}) {
  if (!data || data.length < 2) return null;

  const width = 88;
  const height = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className="shrink-0"
      role="img"
      aria-label="Trend over recent period"
    >
      <polyline
        points={points}
        className={className}
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Value formatting — accepts a raw number or an already-formatted string
// ---------------------------------------------------------------------------

function formatValue(value: string | number): string {
  if (typeof value === "string") return value;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: StatAccent;
  trend?: TrendProps;
  sparkline?: number[];
  href?: string;
  onClick?: () => void;
  loading?: boolean;
  /** Extra context shown as a native tooltip on the label. */
  description?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
  trend,
  sparkline,
  href,
  onClick,
  loading = false,
  description,
  className,
}: StatCardProps) {
  const styles = ACCENT_STYLES[accent];
  const isInteractive = Boolean(href || onClick);

  if (loading) return <StatCardSkeleton className={className} />;

  const body = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-4 transition-all duration-200",
        styles.border,
        styles.ring,
        styles.shadow,
        isInteractive &&
          "cursor-pointer hover:-translate-y-0.5 motion-reduce:hover:translate-y-0",
        className
      )}
    >
      {/* Ambient gradient wash, on hover only — restrained, not decorative noise */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          styles.glow
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                styles.icon
              )}
            >
              <Icon className="size-4.5" aria-hidden="true" />
            </div>
            <p
              className="truncate text-xs font-medium text-muted-foreground"
              title={description}
            >
              {label}
            </p>
          </div>

          <p className="text-2xl font-semibold leading-none tabular-nums text-foreground">
            {formatValue(value)}
          </p>

          {trend && <TrendBadge {...trend} />}
        </div>

        {sparkline && sparkline.length > 1 && (
          <Sparkline
            data={sparkline}
            className={cn(
              "opacity-70 transition-opacity group-hover:opacity-100",
              styles.spark
            )}
          />
        )}
      </div>

      {isInteractive && (
        <ArrowUpRight
          aria-hidden="true"
          className="absolute right-4 top-4 size-3.5 -translate-x-1 translate-y-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
        />
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {body}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {body}
      </button>
    );
  }

  return body;
}

// ---------------------------------------------------------------------------
// Loading skeleton — same footprint as the real card, no layout shift
// ---------------------------------------------------------------------------

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl border border-border bg-card p-4",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="size-9 rounded-lg bg-muted" />
        <div className="h-3 w-20 rounded bg-muted" />
      </div>
      <div className="mb-2 h-7 w-16 rounded bg-muted" />
      <div className="h-4 w-24 rounded bg-muted" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatCardGrid — responsive layout wrapper so consumers don't re-invent
// the same grid classes at every call site.
// ---------------------------------------------------------------------------

export interface StatCardGridProps {
  children: React.ReactNode;
  /** Max columns at the widest breakpoint. Defaults to 4. */
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

const GRID_COLUMNS: Record<NonNullable<StatCardGridProps["columns"]>, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
};

export function StatCardGrid({
  children,
  columns = 4,
  className,
}: StatCardGridProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-4", GRID_COLUMNS[columns], className)}>
      {children}
    </div>
  );
}