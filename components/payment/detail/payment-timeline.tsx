"use client";

import {
  Check,
  Circle,
  Clock3,
  LoaderCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type {
  PaymentStatus,
  PaymentTimelineEvent,
} from "@/types/payment/detail";

import { cn } from "@/lib/utils";

type PaymentTimelineProps = {
  events: PaymentTimelineEvent[];
  status?: PaymentStatus;
  emptyMessage?: string;
  className?: string;
};

function formatDateTime(value?: string | null): string {
  if (!value) return "Time not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time not available";
  }

  return new Intl.DateTimeFormat("en-ET", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Addis_Ababa",
  }).format(date);
}

function getEventIcon(
  eventStatus: PaymentTimelineEvent["status"],
): LucideIcon {
  switch (eventStatus) {
    case "completed":
      return Check;
    case "current":
      return Clock3;
    case "failed":
      return XCircle;
    case "pending":
    default:
      return Circle;
  }
}

function getEventStyles(
  eventStatus: PaymentTimelineEvent["status"],
): string {
  switch (eventStatus) {
    case "completed":
      return "border-emerald-600 bg-emerald-600 text-white";

    case "current":
      return "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";

    case "failed":
      return "border-red-600 bg-red-600 text-white";

    case "pending":
    default:
      return "border-muted-foreground/30 bg-background text-muted-foreground";
  }
}

export function PaymentTimeline({
  events,
  emptyMessage = "No payment history is available yet.",
  className,
}: PaymentTimelineProps) {
  if (events.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed p-6 text-center",
          className,
        )}
      >
        <Clock3
          aria-hidden="true"
          className="mx-auto size-8 text-muted-foreground"
        />

        <p className="mt-3 text-sm font-medium">
          No timeline events
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <ol
      aria-label="Payment timeline"
      className={cn("space-y-0", className)}
    >
      {events.map((event, index) => {
        const Icon = getEventIcon(event.status);
        const isLast = index === events.length - 1;

        const isProcessing =
          event.status === "current" &&
          event.title.toLowerCase().includes("processing");

        return (
          <li
            key={event.id}
            className="relative flex gap-3"
          >
            <div className="flex shrink-0 flex-col items-center">
              <span
                className={cn(
                  "z-10 flex size-8 items-center justify-center rounded-full border",
                  getEventStyles(event.status),
                )}
              >
                {isProcessing ? (
                  <LoaderCircle
                    aria-label="Processing"
                    className="size-4 animate-spin"
                  />
                ) : (
                  <Icon className="size-4" />
                )}
              </span>

              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "my-1 min-h-8 w-px flex-1",
                    event.status === "completed"
                      ? "bg-emerald-300"
                      : "bg-border",
                  )}
                />
              )}
            </div>

            <div
              className={cn(
                "min-w-0 flex-1",
                isLast ? "pb-1" : "pb-6",
              )}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <p className="text-sm font-medium">
                  {event.title}
                </p>

                {event.date && (
                  <time
                    dateTime={event.date}
                    className="text-xs text-muted-foreground"
                  >
                    {formatDateTime(event.date)}
                  </time>
                )}
              </div>

              {event.description && (
                <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                  {event.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default PaymentTimeline;

