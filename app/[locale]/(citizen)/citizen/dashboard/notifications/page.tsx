
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

type Category =
  | "invoices"
  | "payments"
  | "assessments"
  | "leases"
  | "system";

type FilterKey =
  | "all"
  | "unread"
  | "invoices"
  | "payments"
  | "other";

type GroupKey =
  | "attention"
  | "today"
  | "yesterday"
  | "week"
  | "earlier";

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

const DAY_MS = 86_400_000;

const TONE_CLASS: Record<Tone, string> = {
  danger: "bg-destructive/10 text-destructive",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-500",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  neutral: "bg-muted text-muted-foreground",
};

/**
 * Notification types must match the Laravel NotificationType enum.
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

const DEFAULT_META: NotificationMeta = {
  icon: Info,
  tone: "neutral",
  category: "system",
  action: "View details",
  urgent: false,
};

const FILTERS: {
  key: FilterKey;
  label: string;
}[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "invoices", label: "Invoices" },
  { key: "payments", label: "Payments" },
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
/* Notification Metadata                                                      */
/* -------------------------------------------------------------------------- */

function getNotificationMeta(
  notification: AppNotification
): NotificationMeta {
  const knownMeta = NOTIFICATION_META[notification.type];

  if (knownMeta) {
    return knownMeta;
  }

  switch (notification.module) {
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

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isUnread(notification: AppNotification): boolean {
  return !notification.is_read;
}

function isUrgent(notification: AppNotification): boolean {
  return (
    notification.priority === "high" ||
    notification.priority === "urgent"
  );
}

function matchesFilter(
  notification: AppNotification,
  filter: FilterKey
): boolean {
  const category = getNotificationMeta(notification).category;

  switch (filter) {
    case "all":
      return true;

    case "unread":
      return isUnread(notification);

    case "invoices":
      return category === "invoices";

    case "payments":
      return category === "payments";

    case "other":
      return (
        category === "assessments" ||
        category === "leases" ||
        category === "system"
      );

    default:
      return true;
  }
}

function getTimestamp(value: string | null): number {
  if (!value) return 0;

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function startOfToday(): Date {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date;
}

function getBucket(
  value: string | null,
  today: Date
): GroupKey {
  if (!value) return "earlier";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "earlier";
  }

  date.setHours(0, 0, 0, 0);

  const days = Math.floor(
    (today.getTime() - date.getTime()) / DAY_MS
  );

  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return "week";

  return "earlier";
}

function timeAgo(value: string | null): string {
  if (!value) return "Unknown date";

  const timestamp = getTimestamp(value);

  if (!timestamp) return "Unknown date";

  const diff = Math.max(0, Date.now() - timestamp);

  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return "Just now";

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

/**
 * Notification action URLs must be internal application paths.
 */
function getSafeActionUrl(
  actionUrl: string | null
): string | null {
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

  /* ---------------------------------------------------------------------- */
  /* API Queries                                                            */
  /* ---------------------------------------------------------------------- */

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

  const {
    data: unreadCount = 0,
    isLoading: isUnreadCountLoading,
  } = useUnreadNotificationCount();

  /* ---------------------------------------------------------------------- */
  /* API Mutations                                                          */
  /* ---------------------------------------------------------------------- */

  const markReadMutation = useMarkNotificationAsRead();

  const markAllReadMutation = useMarkAllNotificationsAsRead();

  /* ---------------------------------------------------------------------- */
  /* Notification Data                                                      */
  /* ---------------------------------------------------------------------- */

  const notifications = useMemo(
    () => notificationsResponse?.data ?? [],
    [notificationsResponse]
  );

  /* ---------------------------------------------------------------------- */
  /* Actions                                                                */
  /* ---------------------------------------------------------------------- */

  const markRead = async (id: string): Promise<void> => {
    setActionError(null);

    try {
      await markReadMutation.mutateAsync(id);
    } catch {
      setActionError(
        "Unable to mark this notification as read. Please try again."
      );
    }
  };

  const markAllRead = async (): Promise<void> => {
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
  /* Counts                                                                 */
  /* ---------------------------------------------------------------------- */

  const counts = useMemo(() => {
    return {
      all: notifications.length,

      unread: notifications.filter(isUnread).length,

      invoices: notifications.filter(
        (notification) =>
          getNotificationMeta(notification).category === "invoices"
      ).length,

      payments: notifications.filter(
        (notification) =>
          getNotificationMeta(notification).category === "payments"
      ).length,

      other: notifications.filter((notification) => {
        const category = getNotificationMeta(notification).category;

        return (
          category === "assessments" ||
          category === "leases" ||
          category === "system"
        );
      }).length,
    };
  }, [notifications]);

  /* ---------------------------------------------------------------------- */
  /* Filtering                                                              */
  /* ---------------------------------------------------------------------- */

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((notification) =>
        matchesFilter(notification, filter)
      )
      .sort(
        (a, b) =>
          getTimestamp(b.created_at) -
          getTimestamp(a.created_at)
      );
  }, [notifications, filter]);

  /* ---------------------------------------------------------------------- */
  /* Grouping                                                               */
  /* ---------------------------------------------------------------------- */

  const groups = useMemo(() => {
    const sorted = [...filteredNotifications];

    const isPriority = (notification: AppNotification) =>
      isUnread(notification) && isUrgent(notification);

    const output: {
      key: GroupKey;
      items: AppNotification[];
    }[] = [];

    const attention = sorted.filter(isPriority);

    if (attention.length > 0) {
      output.push({
        key: "attention",
        items: attention,
      });
    }

    const today = startOfToday();

    for (const notification of sorted.filter(
      (item) => !isPriority(item)
    )) {
      const key = getBucket(notification.created_at, today);

      let group = output.find((item) => item.key === key);

      if (!group) {
        group = {
          key,
          items: [],
        };

        output.push(group);
      }

      group.items.push(notification);
    }

    return output;
  }, [filteredNotifications]);

  /* ---------------------------------------------------------------------- */
  /* Loading State                                                          */
  /* ---------------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[400px] w-full max-w-3xl items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />

          <p className="text-sm text-muted-foreground">
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Error State                                                            */
  /* ---------------------------------------------------------------------- */

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8">
        <Card className="flex flex-col items-center px-6 py-12 text-center">
          <div className="flex size-11 items-center justify-center rounded-lg bg-destructive/10">
            <AlertCircle className="size-5 text-destructive" />
          </div>

          <h2 className="mt-4 text-base font-semibold">
            Unable to load notifications
          </h2>

          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Something went wrong while retrieving your notifications."}
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-5"
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

  return (
    <div className="min-w-0">
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Notifications
            </h1>

            <p className="text-sm text-muted-foreground">
              {isUnreadCountLoading
                ? "Checking unread notifications..."
                : unreadCount > 0
                  ? `You have ${unreadCount} unread ${
                      unreadCount === 1
                        ? "notification"
                        : "notifications"
                    }.`
                  : "You're all caught up."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              aria-label="Refresh notifications"
            >
              <RefreshCw
                className={cn(
                  "size-4",
                  isRefetching && "animate-spin"
                )}
              />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                unreadCount === 0 ||
                markAllReadMutation.isPending
              }
              onClick={markAllRead}
              className="w-full shrink-0 sm:w-auto"
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CheckCheck className="mr-2 size-4" />
              )}

              Mark all as read
            </Button>
          </div>
        </header>

        {/* Mutation Error */}
        {actionError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="size-4 shrink-0" />
            {actionError}
          </div>
        )}

        {/* Filters */}
        <div
          className="flex flex-wrap gap-1.5"
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
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
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

        {/* Notification List */}
        <Card className="overflow-hidden">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
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
                  size="sm"
                  className="mt-4"
                  onClick={() => setFilter("all")}
                >
                  Show all
                </Button>
              )}
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.key}>
                <h2
                  className={cn(
                    "border-b bg-muted/30 px-4 py-2 text-xs font-medium",
                    group.key === "attention"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {GROUP_LABEL[group.key]}
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

        {/* Pagination Information */}
        {notificationsResponse?.meta && (
          <p className="text-center text-xs text-muted-foreground">
            Showing {notifications.length} of{" "}
            {notificationsResponse.meta.total} notifications
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

  const unread = isUnread(notification);

  const priority = unread && isUrgent(notification);

  const actionUrl = getSafeActionUrl(notification.action_url);

  return (
    <li
      className={cn(
        "flex gap-3 p-4 transition-colors",
        unread && "bg-primary/[0.03]"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          TONE_CLASS[meta.tone]
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              "text-sm",
              unread ? "font-semibold" : "font-medium"
            )}
          >
            {unread && (
              <span className="sr-only">Unread: </span>
            )}

            {notification.title}
          </p>

          <time
            dateTime={notification.created_at ?? undefined}
            className="shrink-0 text-xs text-muted-foreground"
          >
            {timeAgo(notification.created_at)}
          </time>
        </div>

        <p className="mt-0.5 whitespace-pre-line text-sm text-muted-foreground">
          {notification.message}
        </p>

        {/* Actions */}
        {(actionUrl || unread) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            {actionUrl && (
              <Button
                asChild
                type="button"
                size="sm"
                variant={priority ? "default" : "outline"}
                onClick={() => {
                  if (unread) {
                    void onRead(notification.id);
                  }
                }}
              >
                <Link href={actionUrl}>
                  {meta.action}
                </Link>
              </Button>
            )}

            {unread && (
              <button
                type="button"
                disabled={isMarkingRead}
                onClick={() => void onRead(notification.id)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isMarkingRead && (
                  <Loader2 className="size-3 animate-spin" />
                )}

                Mark as read
              </button>
            )}
          </div>
        )}
      </div>

      {/* Unread Indicator */}
      {unread && (
        <span
          aria-label="Unread"
          className="mt-2 size-2 shrink-0 rounded-full bg-primary"
        />
      )}
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
