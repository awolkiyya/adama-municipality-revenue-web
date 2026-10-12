"use client";

import React, { useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { label, STATUS_STYLE, TERMINAL_FAILURES } from "@/utils/helpers";

export function CopyButton({ value, name }: { value: string; name: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={`Copy ${name}`}
      className="inline-flex shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const Icon =
    status === "COMPLETED"
      ? CheckCircle2
      : TERMINAL_FAILURES.includes(status)
        ? XCircle
        : status === "PROCESSING"
          ? Loader2
          : Clock3;

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 ${STATUS_STYLE[status] ?? "text-muted-foreground"}`}
    >
      <Icon
        className={`size-3.5 ${status === "PROCESSING" ? "animate-spin" : ""}`}
      />
      {label(status)}
    </Badge>
  );
}

export type Row = { label: string; value: React.ReactNode; mono?: boolean };

/** Label/value list. Empty rows are hidden; monospace references get a copy button. */
export function Fields({ rows }: { rows: (Row | false | null | undefined)[] }) {
  const visible = rows.filter(
    (r): r is Row => !!r && r.value != null && r.value !== "",
  );

  if (visible.length === 0) {
    return <p className="text-sm text-muted-foreground">No details recorded.</p>;
  }

  return (
    <dl className="divide-y">
      {visible.map((r) => (
        <div
          key={r.label}
          className="flex items-start justify-between gap-6 py-2.5 text-sm"
        >
          <dt className="shrink-0 pt-0.5 text-muted-foreground">{r.label}</dt>
          <dd className="flex min-w-0 items-center justify-end gap-1 text-right font-medium">
            <span className={r.mono ? "break-all font-mono text-xs" : "break-words"}>
              {r.value}
            </span>
            {r.mono && typeof r.value === "string" && (
              <CopyButton value={r.value} name={r.label.toLowerCase()} />
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function Empty({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      <span className="text-muted-foreground/60">{icon}</span>
      <p className="max-w-xs">{children}</p>
    </div>
  );
}

export function Fact({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{title}</dt>
      <dd className="mt-1 truncate text-sm font-medium">{children}</dd>
    </div>
  );
}


export function Notice({
  icon,
  title,
  message,
  actions,
}: {
  icon: React.ReactNode;
  title: string;
  message?: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Card className="shadow-none">
        <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
          {icon}
          <h2 className="font-semibold">{title}</h2>
          {message && (
            <p className="max-w-md text-sm text-muted-foreground">{message}</p>
          )}
          <div className="mt-1 flex gap-2">{actions}</div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PageSkeleton() {
  const bar = "animate-pulse rounded-lg bg-muted";
  return (
    <div
      className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6"
      aria-busy
      aria-label="Loading payment"
    >
      <div className={`${bar} h-8 w-64`} />
      <div className={`${bar} h-52`} />
      <div className={`${bar} h-9 w-80`} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className={`${bar} h-48`} />
        <div className={`${bar} h-48`} />
      </div>
    </div>
  );
}

/** Active tab uses the theme's primary colour; driven by state so it never depends on component defaults. */
export const tabClass = (active: boolean) =>
  [
    "h-auto flex-none gap-2 rounded-md rounded-b-none border-0 border-b-2 px-3 pb-2.5 pt-2 shadow-none transition-colors",
    active
      ? "border-primary bg-primary/10 font-semibold text-primary data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:border-primary dark:data-[state=active]:bg-primary/10 dark:data-[state=active]:text-primary"
      : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  ].join(" ");