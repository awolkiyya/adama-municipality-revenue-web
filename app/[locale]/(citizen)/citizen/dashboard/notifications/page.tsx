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
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------
   API TYPES (assumed shape, adjust to your notification resource)
--------------------------------------------------------------- */

export type NotificationType =
  | "INVOICE_ISSUED"
  | "PAYMENT_DUE_SOON"
  | "PAYMENT_OVERDUE"
  | "PENALTY_APPLIED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "SYSTEM";

export interface TaxpayerNotification {
  id: string | number;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string; // ISO datetime
  read_at: string | null; // null = unread
  action_url: string | null;
}

/* ---------------------------------------------------------------
   MOCK DATA
   Dates are relative to "now" (rounded to the hour) so the groups
   Today / Yesterday / This week always look right.
   Remove this block and pass real data via the `notifications` prop.
--------------------------------------------------------------- */

const ago = (hours: number) =>
  new Date(Math.floor((Date.now() - hours * 3_600_000) / 3_600_000) * 3_600_000).toISOString();

const MOCK_NOTIFICATIONS: TaxpayerNotification[] = [
  {
    id: "n-1",
    type: "PAYMENT_FAILED",
    title: "Payment for INV-2026-00125 failed",
    message: "Your wallet balance was too low to complete the payment of ETB 4,500.00. Top up and try again.",
    created_at: ago(5),
    read_at: null,
    action_url: "/citizen/dashboard/invoices/inv-001/pay",
  },
  {
    id: "n-2",
    type: "PAYMENT_OVERDUE",
    title: "Commercial Permit is overdue",
    message: "Invoice INV-2026-00087 (ETB 2,200.00) was due on Sep 20. Pay now to avoid further penalties.",
    created_at: ago(28),
    read_at: null,
    action_url: "/citizen/dashboard/invoices/inv-005/pay",
  },
  {
    id: "n-3",
    type: "PAYMENT_DUE_SOON",
    title: "Property Tax is due on Oct 15",
    message: "Invoice INV-2026-00125 for ETB 4,500.00 is coming up. Paying early avoids late penalties.",
    created_at: ago(30),
    read_at: null,
    action_url: "/citizen/dashboard/invoices/inv-001/pay",
  },
  {
    id: "n-4",
    type: "PAYMENT_SUCCESS",
    title: "Payment received",
    message: "We received ETB 1,500.00 for INV-2026-00131 through CBE Birr. Your balance is now ETB 1,500.00.",
    created_at: ago(24 * 5 + 2),
    read_at: ago(24 * 5),
    action_url: "/citizen/dashboard/payments",
  },
  {
    id: "n-5",
    type: "INVOICE_ISSUED",
    title: "New invoice: Property Service Fee",
    message: "Invoice INV-2026-00131 for ETB 3,000.00 has been issued. It is due on Oct 25.",
    created_at: ago(24 * 8),
    read_at: ago(24 * 8 - 3),
    action_url: "/citizen/dashboard/invoices",
  },
  {
    id: "n-6",
    type: "PENALTY_APPLIED",
    title: "Late penalty added",
    message: "A penalty of ETB 150.00 and interest of ETB 50.00 were added to INV-2026-00087.",
    created_at: ago(24 * 9),
    read_at: ago(24 * 9 - 1),
    action_url: "/citizen/dashboard/invoices",
  },
  {
    id: "n-7",
    type: "PAYMENT_SUCCESS",
    title: "Payment confirmed",
    message: "Your bank transfer of ETB 5,000.00 for INV-2026-00110 was confirmed. Thank you.",
    created_at: ago(24 * 21),
    read_at: ago(24 * 21 - 2),
    action_url: "/citizen/dashboard/payments",
  },
  {
    id: "n-8",
    type: "SYSTEM",
    title: "Scheduled maintenance finished",
    message: "The portal was briefly unavailable. All services are working normally again.",
    created_at: ago(24 * 30),
    read_at: ago(24 * 30 - 5),
    action_url: null,
  },
];

/* ---------------------------------------------------------------
   TYPE METADATA
--------------------------------------------------------------- */

type Tone = "danger" | "warning" | "success" | "info" | "neutral";
type Category = "invoices" | "payments" | "system";

const TONE_CLASS: Record<Tone, string> = {
  danger: "bg-destructive/10 text-destructive",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-500",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  neutral: "bg-muted text-muted-foreground",
};

const META: Record<
  NotificationType,
  { icon: LucideIcon; tone: Tone; category: Category; action: string | null; urgent: boolean }
> = {
  INVOICE_ISSUED: { icon: FileText, tone: "info", category: "invoices", action: "View invoice", urgent: false },
  PAYMENT_DUE_SOON: { icon: CalendarClock, tone: "warning", category: "invoices", action: "Pay now", urgent: true },
  PAYMENT_OVERDUE: { icon: AlertCircle, tone: "danger", category: "invoices", action: "Pay now", urgent: true },
  PENALTY_APPLIED: { icon: AlertTriangle, tone: "warning", category: "invoices", action: "View invoice", urgent: false },
  PAYMENT_SUCCESS: { icon: CheckCircle2, tone: "success", category: "payments", action: "View payment", urgent: false },
  PAYMENT_FAILED: { icon: XCircle, tone: "danger", category: "payments", action: "Try again", urgent: true },
  SYSTEM: { icon: Info, tone: "neutral", category: "system", action: null, urgent: false },
};

/* ---------------------------------------------------------------
   FILTERS + GROUPS
--------------------------------------------------------------- */

type FilterKey = "all" | "unread" | "invoices" | "payments";

const FILTERS: { key: FilterKey; label: string; match: (n: TaxpayerNotification) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "unread", label: "Unread", match: (n) => !n.read_at },
  { key: "invoices", label: "Invoices", match: (n) => META[n.type].category === "invoices" },
  { key: "payments", label: "Payments", match: (n) => META[n.type].category === "payments" },
];

type GroupKey = "attention" | "today" | "yesterday" | "week" | "earlier";

const GROUP_LABEL: Record<GroupKey, string> = {
  attention: "Needs your attention",
  today: "Today",
  yesterday: "Yesterday",
  week: "This week",
  earlier: "Earlier",
};

/* Delivery preferences */
type PrefKey = "reminders" | "confirmations" | "invoices";

const PREF_ROWS: { key: PrefKey; label: string; hint: string }[] = [
  { key: "reminders", label: "Payment reminders", hint: "Before a due date and when an invoice is overdue" },
  { key: "confirmations", label: "Payment confirmations", hint: "Receipts and failed payment alerts" },
  { key: "invoices", label: "New invoices", hint: "When a new invoice is issued to you" },
];

type Prefs = Record<PrefKey, { sms: boolean; email: boolean }>;

const MOCK_PREFS: Prefs = {
  reminders: { sms: true, email: true },
  confirmations: { sms: true, email: false },
  invoices: { sms: false, email: true },
};

/* ---------------------------------------------------------------
   PAGE
--------------------------------------------------------------- */

export function TaxpayerNotifications({
  notifications = MOCK_NOTIFICATIONS,
}: {
  notifications?: TaxpayerNotification[];
}) {
  const [items, setItems] = useState(notifications);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [prefs, setPrefs] = useState<Prefs>(MOCK_PREFS);

  // With a real API: call PATCH /taxpayer/notifications/{id}/read (and
  // .../read-all), then refresh the unread count shown in the top bar.
  const markRead = (id: TaxpayerNotification["id"]) =>
    setItems((prev) =>
      prev.map((n) =>
        n.id === id && !n.read_at
          ? { ...n, read_at: new Date().toISOString() }
          : n
      )
    );

  const markAllRead = () =>
    setItems((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() }))
    );

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f.key, items.filter(f.match).length])
      ) as Record<FilterKey, number>,
    [items]
  );

  const groups = useMemo(() => {
    const active = FILTERS.find((f) => f.key === filter)!;
    const sorted = items
      .filter(active.match)
      .sort((a, b) => time(b.created_at) - time(a.created_at));

    // Unread items that need action float to the top.
    const isPriority = (n: TaxpayerNotification) =>
      !n.read_at && META[n.type].urgent;

    const out: { key: GroupKey; items: TaxpayerNotification[] }[] = [];
    const attention = sorted.filter(isPriority);
    if (attention.length) out.push({ key: "attention", items: attention });

    const today = startOfToday();
    for (const n of sorted.filter((n) => !isPriority(n))) {
      const key = bucket(n.created_at, today);
      let group = out.find((g) => g.key === key);
      if (!group) {
        group = { key, items: [] };
        out.push(group);
      }
      group.items.push(n);
    }
    return out;
  }, [items, filter]);

  const unread = counts.unread;

  return (
    <div className="min-w-0">
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Notifications
            </h1>
            <p className="text-sm text-muted-foreground">
              {unread > 0
                ? `You have ${unread} unread ${unread === 1 ? "notification" : "notifications"}.`
                : "You're all caught up."}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={unread === 0}
            onClick={markAllRead}
            className="w-full shrink-0 sm:w-auto"
          >
            <CheckCheck className="mr-2 size-4" />
            Mark all as read
          </Button>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter notifications">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                filter === f.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {f.label}
              <span className="ml-1.5 tabular-nums opacity-70">
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        <Card className="overflow-hidden">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Bell className="size-5 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium">
                {items.length === 0
                  ? "No notifications yet"
                  : filter === "unread"
                    ? "You're all caught up"
                    : "Nothing here"}
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                {items.length === 0
                  ? "Invoice, due date and payment updates will appear here."
                  : "There are no notifications in this view."}
              </p>
              {filter !== "all" && items.length > 0 && (
                <Button
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
            groups.map((g) => (
              <section key={g.key}>
                <h2
                  className={cn(
                    "border-b bg-muted/30 px-4 py-2 text-xs font-medium",
                    g.key === "attention"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {GROUP_LABEL[g.key]}
                </h2>
                <ul className="divide-y border-b last:border-b-0">
                  {g.items.map((n) => (
                    <NotificationRow key={n.id} notification={n} onRead={markRead} />
                  ))}
                </ul>
              </section>
            ))
          )}
        </Card>

        {/* Delivery preferences */}
        <section>
          <h2 className="mb-2 px-1 text-sm font-medium text-muted-foreground">
            Delivery preferences
          </h2>
          <Card>
            <p className="border-b px-5 py-3 text-xs text-muted-foreground">
              Notifications always appear here. Choose where else we should
              reach you. Changes are saved automatically.
            </p>

            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 px-5 py-2 text-xs text-muted-foreground">
              <span />
              <span className="w-10 text-center">SMS</span>
              <span className="w-10 text-center">Email</span>
            </div>

            <ul className="divide-y border-t">
              {PREF_ROWS.map((row) => (
                <li
                  key={row.key}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{row.label}</p>
                    <p className="text-xs text-muted-foreground">{row.hint}</p>
                  </div>

                  {(["sms", "email"] as const).map((channel) => (
                    <div key={channel} className="flex w-10 justify-center">
                      <Switch
                        checked={prefs[row.key][channel]}
                        onCheckedChange={(checked) =>
                          // With a real API: PATCH /taxpayer/notification-preferences
                          setPrefs((prev) => ({
                            ...prev,
                            [row.key]: { ...prev[row.key], [channel]: checked },
                          }))
                        }
                        aria-label={`${row.label} by ${channel === "sms" ? "SMS" : "email"}`}
                      />
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </div>
  );
}

// Route entry: app/[locale]/citizen/dashboard/notifications/page.tsx
export default function NotificationsPage() {
  return <TaxpayerNotifications />;
}

/* ---------------------------------------------------------------
   PARTS
--------------------------------------------------------------- */

function NotificationRow({
  notification: n,
  onRead,
}: {
  notification: TaxpayerNotification;
  onRead: (id: TaxpayerNotification["id"]) => void;
}) {
  const meta = META[n.type];
  const Icon = meta.icon;
  const unread = !n.read_at;
  const priority = unread && meta.urgent;

  return (
    <li className={cn("flex gap-3 p-4", unread && "bg-primary/[0.03]")}>
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          TONE_CLASS[meta.tone]
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              "text-sm",
              unread ? "font-semibold" : "font-medium"
            )}
          >
            {unread && <span className="sr-only">Unread: </span>}
            {n.title}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {timeAgo(n.created_at)}
          </span>
        </div>

        <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>

        {(n.action_url && meta.action) || unread ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            {n.action_url && meta.action && (
              <Button
                asChild
                size="sm"
                variant={priority ? "default" : "outline"}
                onClick={() => onRead(n.id)}
              >
                <Link href={n.action_url}>{meta.action}</Link>
              </Button>
            )}

            {unread && (
              <button
                type="button"
                onClick={() => onRead(n.id)}
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Mark as read
              </button>
            )}
          </div>
        ) : null}
      </div>

      {unread && (
        <span
          aria-hidden="true"
          className="mt-2 size-2 shrink-0 rounded-full bg-primary"
        />
      )}
    </li>
  );
}

/* ---------------------------------------------------------------
   HELPERS
--------------------------------------------------------------- */

const DAY_MS = 86_400_000;

function time(value: string): number {
  return new Date(value).getTime();
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function bucket(value: string, today: Date): GroupKey {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - d.getTime()) / DAY_MS);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return "week";
  return "earlier";
}

function timeAgo(value: string): string {
  const diff = Date.now() - time(value);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}