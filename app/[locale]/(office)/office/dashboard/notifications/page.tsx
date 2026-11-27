"use client";

import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@/hooks/use-notifications";

import type { AppNotification } from "@/types/notification";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Tone = "danger" | "warning" | "success" | "info" | "neutral";

type Category = "payments" | "invoices" | "assessments" | "leases" | "system";

type FilterKey = "all" | "unread" | "payments" | "invoices" | "other";

type GroupKey = "attention" | "today" | "yesterday" | "week" | "earlier";

interface NotificationMeta {
  icon: LucideIcon;
  tone: Tone;
  category: Category;
  action: string;
  urgent: boolean;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const TONE_CLASS: Record<Tone, string> = {
  danger: "bg-destructive/10 text-destructive",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-500",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  neutral: "bg-muted text-muted-foreground",
};

const DEFAULT_META: NotificationMeta = {
  icon: Info,
  tone: "neutral",
  category: "system",
  action: "View details",
  urgent: false,
};

/**
 * These values must match NotificationType enum values
 * returned by the Laravel API.
 */
const NOTIFICATION_META: Record<string, NotificationMeta> = {
  "payment.received": {
    icon: CheckCircle2,
    tone: "success",
    category: "payments",
    action: "View payment",
    urgent: false,
  },
  "invoice.generated": {
    icon: FileText,
    tone: "info",
    category: "invoices",
    action: "View invoice",
    urgent: false,
  },
  "assessment.approved": {
    icon: CheckCircle2,
    tone: "success",
    category: "assessments",
    action: "View assessment",
    urgent: false,
  },
  "lease.expiring": {
    icon: CalendarClock,
    tone: "warning",
    category: "leases",
    action: "View lease",
    urgent: true,
  },
  "payment.failed": {
    icon: XCircle,
    tone: "danger",
    category: "payments",
    action: "View payment",
    urgent: true,
  },
  "payment.overdue": {
    icon: AlertCircle,
    tone: "danger",
    category: "invoices",
    action: "View invoice",
    urgent: true,
  },
  "payment.due_soon": {
    icon: CalendarClock,
    tone: "warning",
    category: "invoices",
    action: "View invoice",
    urgent: true,
  },
  "invoice.overdue": {
    icon: AlertTriangle,
    tone: "danger",
    category: "invoices",
    action: "View invoice",
    urgent: true,
  },
  "system.announcement": {
    icon: Info,
    tone: "neutral",
    category: "system",
    action: "View details",
    urgent: false,
  },
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "payments", label: "Payments" },
  { key: "invoices", label: "Invoices" },
  { key: "other", label: "Other" },
];

const GROUP_LABEL: Record<GroupKey, string> = {
  attention: "Needs your attention",
  today: "Today",
  yesterday: "Yesterday",
  week: "This week",
  earlier: "Earlier",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const DAY_MS = 86_400_000;

function getModuleMeta(module: string): NotificationMeta {
  switch (module) {
    case "payment":
      return {
        icon: CheckCircle2,
        tone: "success",
        category: "payments",
        action: "View payment",
        urgent: false,
      };
    case "invoice":
      return {
        icon: FileText,
        tone: "info",
        category: "invoices",
        action: "View invoice",
        urgent: false,
      };
    case "assessment":
      return {
        icon: CheckCircle2,
        tone: "success",
        category: "assessments",
        action: "View assessment",
        urgent: false,
      };
    case "lease":
      return {
        icon: CalendarClock,
        tone: "warning",
        category: "leases",
        action: "View lease",
        urgent: true,
      };
    default:
      return DEFAULT_META;
  }
}

function getNotificationMeta(notification: AppNotification): NotificationMeta {
  return (
    NOTIFICATION_META[notification.type] ?? getModuleMeta(notification.module)
  );
}

function isNotificationUnread(notification: AppNotification): boolean {
  return !notification.is_read;
}

function isNotificationUrgent(notification: AppNotification): boolean {
  return notification.priority === "high" || notification.priority === "urgent";
}

function isOtherCategory(category: Category): boolean {
  return (
    category === "assessments" || category === "leases" || category === "system"
  );
}

function matchesFilter(
  notification: AppNotification,
  filter: FilterKey
): boolean {
  const { category } = getNotificationMeta(notification);

  switch (filter) {
    case "all":
      return true;
    case "unread":
      return isNotificationUnread(notification);
    case "payments":
      return category === "payments";
    case "invoices":
      return category === "invoices";
    case "other":
      return isOtherCategory(category);
    default:
      return true;
  }
}

function getTime(value: string | null): number {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getBucket(value: string | null, today: Date): GroupKey {
  if (!value) return "earlier";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "earlier";

  date.setHours(0, 0, 0, 0);

  const days = Math.floor((today.getTime() - date.getTime()) / DAY_MS);

  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return "week";
  return "earlier";
}

function timeAgo(value: string | null): string {
  if (!value) return "Unknown date";

  const timestamp = getTime(value);
  if (!timestamp) return "Unknown date";

  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

/**
 * Only allow internal application URLs.
 * Prevents protocol-relative and external URL navigation.
 */
function getSafeActionUrl(actionUrl: string | null): string | null {
  if (!actionUrl) return null;

  if (
    !actionUrl.startsWith("/") ||
    actionUrl.startsWith("//") ||
    actionUrl.includes("\\")
  ) {
    return null;
  }

  return actionUrl;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export function TaxpayerNotifications() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [actionError, setActionError] = useState<string | null>(null);

  /*
   * Fetch notifications from Laravel.
   * Laravel currently supports a maximum per_page of 100.
   */
  const {
    data: notificationsResponse,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useNotifications({
    filter: "all",
    per_page: 100,
    page: 1,
  });

  const { data: unreadCount = 0, isLoading: isUnreadCountLoading } =
    useUnreadNotificationCount();

  const markReadMutation = useMarkNotificationAsRead();
  const markAllReadMutation = useMarkAllNotificationsAsRead();

  const notifications = useMemo(
    () => notificationsResponse?.data ?? [],
    [notificationsResponse]
  );

  /* ---------------------------------------------------------------------- */
  /* Mutations                                                              */
  /* ---------------------------------------------------------------------- */

  const markRead = async (id: string) => {
    setActionError(null);

    try {
      await markReadMutation.mutateAsync(id);
    } catch {
      setActionError(
        "Unable to mark this notification as read. Please try again."
      );
    }
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;

    setActionError(null);

    try {
      await markAllReadMutation.mutateAsync();
    } catch {
      setActionError(
        "Unable to mark all notifications as read. Please try again."
      );
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Filtering and grouping                                                 */
  /* ---------------------------------------------------------------------- */

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((notification) => matchesFilter(notification, filter))
      .sort((a, b) => getTime(b.created_at) - getTime(a.created_at));
  }, [notifications, filter]);

  const counts = useMemo(() => {
    const countBy = (key: FilterKey) =>
      notifications.filter((n) => matchesFilter(n, key)).length;

    return {
      all: notifications.length,
      unread: countBy("unread"),
      payments: countBy("payments"),
      invoices: countBy("invoices"),
      other: countBy("other"),
    } satisfies Record<FilterKey, number>;
  }, [notifications]);

  const groups = useMemo(() => {
    const isPriority = (notification: AppNotification) =>
      isNotificationUnread(notification) && isNotificationUrgent(notification);

    const output: { key: GroupKey; items: AppNotification[] }[] = [];

    const attention = filteredNotifications.filter(isPriority);

    if (attention.length > 0) {
      output.push({ key: "attention", items: attention });
    }

    const today = startOfToday();

    for (const notification of filteredNotifications) {
      if (isPriority(notification)) continue;

      const key = getBucket(notification.created_at, today);

      let group = output.find((item) => item.key === key);

      if (!group) {
        group = { key, items: [] };
        output.push(group);
      }

      group.items.push(notification);
    }

    return output;
  }, [filteredNotifications]);

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                */
  /* ---------------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div
        className="mx-auto w-full max-w-3xl min-w-0 space-y-5 px-4 py-5 sm:p-6 lg:p-8"
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Loading notifications...</span>

        <div className="space-y-2">
          <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-56 max-w-full animate-pulse rounded-md bg-muted" />
        </div>

        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-20 shrink-0 animate-pulse rounded-full bg-muted"
            />
          ))}
        </div>

        <Card className="divide-y overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-4">
              <div className="size-10 shrink-0 animate-pulse rounded-lg bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Error                                                                  */
  /* ---------------------------------------------------------------------- */

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-3xl min-w-0 px-4 py-5 sm:p-6 lg:p-8">
        <Card className="flex flex-col items-center px-5 py-10 text-center sm:px-6 sm:py-12">
          <div className="flex size-11 items-center justify-center rounded-lg bg-destructive/10">
            <AlertCircle className="size-5 text-destructive" />
          </div>

          <h2 className="mt-4 text-base font-semibold">
            Unable to load notifications
          </h2>

          <p className="mt-1 max-w-sm break-words text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Something went wrong while retrieving your notifications."}
          </p>

          <Button
            variant="outline"
            className="mt-5 h-10 w-full sm:w-auto"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            {isRefetching ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-4" />
            )}
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  const total = notificationsResponse?.meta?.total;

  return (
    <div className="min-w-0 overflow-x-clip">
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4 px-4 py-5 sm:space-y-6 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Notifications
            </h1>

            <p
              className="text-sm text-muted-foreground"
              aria-live="polite"
            >
              {isUnreadCountLoading
                ? "Checking unread notifications..."
                : unreadCount > 0
                  ? `You have ${unreadCount} unread ${
                      unreadCount === 1 ? "notification" : "notifications"
                    }.`
                  : "You're all caught up."}
            </p>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={isRefetching}
              aria-label="Refresh notifications"
              className="size-10 shrink-0 p-0 sm:size-9"
            >
              <RefreshCw
                className={cn("size-4", isRefetching && "animate-spin")}
              />
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={unreadCount === 0 || markAllReadMutation.isPending}
              onClick={markAllRead}
              className="h-10 min-w-0 flex-1 sm:h-9 sm:flex-none"
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="mr-2 size-4 shrink-0 animate-spin" />
              ) : (
                <CheckCheck className="mr-2 size-4 shrink-0" />
              )}
              <span className="truncate">Mark all as read</span>
            </Button>
          </div>
        </header>

        {/* Mutation error */}
        {actionError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive sm:px-4"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0 break-words">{actionError}</span>
          </div>
        )}

        {/*
          Filters: a single swipeable row on mobile (scrolls inside its own
          container, never the page), wrapping on larger screens.
        */}
        <div
          className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Filter notifications"
        >
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
              className={cn(
                "inline-flex h-9 shrink-0 snap-start items-center whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                filter === item.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {item.label}

              <span className="ml-1.5 tabular-nums opacity-70">
                {counts[item.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Notification list */}
        <Card className="min-w-0 overflow-hidden">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-12 text-center sm:px-6 sm:py-14">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Bell className="size-5 text-muted-foreground" />
              </div>

              <p className="mt-3 text-sm font-medium">
                {notifications.length === 0
                  ? "No notifications yet"
                  : filter === "unread"
                    ? "You're all caught up"
                    : "Nothing here"}
              </p>

              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                {notifications.length === 0
                  ? "Invoice, assessment, lease and payment updates will appear here."
                  : "There are no notifications in this view."}
              </p>

              {filter !== "all" && notifications.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 h-10 w-full max-w-xs sm:w-auto"
                  onClick={() => setFilter("all")}
                >
                  Show all
                </Button>
              )}
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.key} aria-label={GROUP_LABEL[group.key]}>
                <h2
                  className={cn(
                    "flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-2 text-xs font-medium",
                    group.key === "attention"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  <span className="truncate">{GROUP_LABEL[group.key]}</span>
                  <span className="shrink-0 tabular-nums opacity-70">
                    {group.items.length}
                  </span>
                </h2>

                <ul className="divide-y border-b last:border-b-0">
                  {group.items.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      onRead={markRead}
                      isMarkingRead={
                        markReadMutation.isPending &&
                        markReadMutation.variables === notification.id
                      }
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </Card>

        {/* Pagination information */}
        {typeof total === "number" && (
          <p className="text-center text-xs text-muted-foreground">
            Showing {notifications.length} of {total} notifications
          </p>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Notification Row                                                          */
/* -------------------------------------------------------------------------- */

function NotificationRow({
  notification,
  onRead,
  isMarkingRead,
}: {
  notification: AppNotification;
  onRead: (id: string) => void | Promise<void>;
  isMarkingRead: boolean;
}) {
  const meta = getNotificationMeta(notification);
  const Icon = meta.icon;

  const unread = isNotificationUnread(notification);
  const priority = unread && isNotificationUrgent(notification);
  const actionUrl = getSafeActionUrl(notification.action_url);

  return (
    <li
      className={cn(
        "flex min-w-0 gap-3 p-4 transition-colors",
        unread && "bg-primary/[0.03]"
      )}
    >
      {/* Icon (unread dot sits on the icon so it never steals row width) */}
      <div className="relative shrink-0">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-lg sm:size-9",
            TONE_CLASS[meta.tone]
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </div>

        {unread && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-background bg-primary"
          />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Title + time: stacked on mobile, side by side from sm up */}
        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <p
            className={cn(
              "min-w-0 break-words text-sm",
              unread ? "font-semibold" : "font-medium"
            )}
          >
            {unread && <span className="sr-only">Unread: </span>}
            {notification.title}
          </p>

          <time
            dateTime={notification.created_at ?? undefined}
            className="shrink-0 text-xs text-muted-foreground sm:pt-0.5"
          >
            {timeAgo(notification.created_at)}
          </time>
        </div>

        <p className="mt-1 whitespace-pre-line break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
          {notification.message}
        </p>

        {/* Actions: full-width tap targets on mobile, inline on larger screens */}
        {(actionUrl || unread) && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            {actionUrl && (
              <Button
                asChild
                size="sm"
                variant={priority ? "default" : "outline"}
                className="h-10 w-full sm:h-8 sm:w-auto"
              >
                <Link
                  href={actionUrl}
                  onClick={() => {
                    if (unread) void onRead(notification.id);
                  }}
                >
                  {meta.action}
                </Link>
              </Button>
            )}

            {unread && (
              <button
                type="button"
                disabled={isMarkingRead}
                onClick={() => void onRead(notification.id)}
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:h-auto sm:w-auto sm:justify-start"
              >
                {isMarkingRead && <Loader2 className="size-3 animate-spin" />}
                Mark as read
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Next.js Page                                                               */
/* -------------------------------------------------------------------------- */

// Route:
// app/[locale]/citizen/dashboard/notifications/page.tsx

export default function NotificationsPage() {
  return <TaxpayerNotifications />;
}