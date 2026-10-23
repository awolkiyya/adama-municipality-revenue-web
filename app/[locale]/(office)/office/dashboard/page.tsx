"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Ban,
  Banknote,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  CreditCard,
  FileCheck2,
  HandCoins,
  Landmark,
  LineChart as LineChartIcon,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";

import Can from "@/components/access/Can";
import ProtectedRoute from "@/components/access/ProtectedRoute";
import MetricCard from "@/components/dashboard/MetricCard";
import {
  PeriodSelection,
  PeriodSwitch,
} from "@/components/dashboard/PeriodSwitch";
import RevenueChart from "@/components/dashboard/RevenueChart";
import SourceMix from "@/components/dashboard/SourceMix";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { useDashboardSummary } from "@/hooks/dashboard/use-dashboard-summary";
import {
  cn,
  formatCompactETB,
  formatETB,
  formatEthiopianDateWithTime,
  toDateKey,
} from "@/lib/utils";
import {
  MODULES,
  type ChartType,
  type DashboardActivityStatus,
  type DashboardWorkQueueItem,
  type IconType,
  type ModuleItem,
} from "@/types/dashboard";
import QuickAccess from "@/components/dashboard/QuickAccess";

/* -------------------------------------------------------------------------- */
/* Static configuration                                                       */
/* -------------------------------------------------------------------------- */

const QUICK_ACCESS_TITLES = [
  "Assessments",
  "Invoices",
  "Assessment Payments",
  "Direct Collections",
  "Cash Collections",
  "Citizens",
] as const;

const QUICK_ACCESS: ModuleItem[] = QUICK_ACCESS_TITLES.flatMap((title) => {
  const module = MODULES.find((item) => item.title === title);

  return module ? [module] : [];
});

const SYSTEM_STATS = [
  { label: "Users", key: "totalUsers" },
  { label: "Taxpayers", key: "totalTaxpayers" },
  { label: "Agents", key: "totalAgents" },
  { label: "Assessments", key: "totalAssessments" },
  { label: "Assessment invoices", key: "totalAssessmentInvoices" },
  { label: "Direct invoices", key: "totalDirectCollectionInvoices" },
] as const;

const ACTIVITY_STATUS: Record<
  DashboardActivityStatus,
  { icon: IconType; className: string }
> = {
  INITIATED: {
    icon: Clock3,
    className: "bg-muted text-muted-foreground",
  },
  PENDING: {
    icon: Clock3,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  PROCESSING: {
    icon: CreditCard,
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  COMPLETED: {
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  FAILED: {
    icon: XCircle,
    className: "bg-red-500/10 text-red-700 dark:text-red-400",
  },
  REVERSED: {
    icon: RotateCcw,
    className: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  },
  CANCELLED: {
    icon: Ban,
    className: "bg-muted text-muted-foreground",
  },
};

const KPI_ICON = "bg-muted text-muted-foreground";

const DAYS_BY_PERIOD = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
} as const;

/* -------------------------------------------------------------------------- */
/* Shared components                                                          */
/* -------------------------------------------------------------------------- */

function CardHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <CardHeader>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>

          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>

        {action}
      </div>
    </CardHeader>
  );
}

function EmptyMessage({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

const rowLink =
  "group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function WorkQueueRow({ item }: { item: DashboardWorkQueueItem }) {
  const Icon =
    item.key === "pending_bank_transfers" ? Landmark : ClipboardList;

  return (
    <Link href={item.href} className={rowLink}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.description}
        </p>
      </div>

      <span
        className={cn(
          "min-w-7 rounded-md px-2 py-0.5 text-center text-sm font-semibold tabular-nums",
          item.count > 0
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground",
        )}
        aria-label={`${item.count} items`}
      >
        {item.count}
      </span>

      <ArrowRight
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="space-y-8"
      aria-label="Loading analytics"
      aria-busy="true"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>

        <Skeleton className="h-9 w-40" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-96 xl:col-span-2" />
        <Skeleton className="h-96" />
      </div>

      <Skeleton className="h-72" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Analytics dashboard                                                        */
/*                                                                            */
/* This component is rendered only when Can grants analytics.view.            */
/* The analytics query therefore does not mount for unauthorized users.       */
/* -------------------------------------------------------------------------- */

function AnalyticsDashboard() {
  const [chartType, setChartType] = useState<ChartType>("bar");

  const [period, setPeriod] = useState<PeriodSelection>({
    type: "preset",
    period: "7d",
  });

  const { dateRange, periodLabel } = useMemo(() => {
    if (period.type === "custom") {
      return {
        dateRange: {
          from: period.from,
          to: period.to,
        },
        periodLabel: `${period.from} to ${period.to}`,
      };
    }

    const days = DAYS_BY_PERIOD[period.period];
    const to = new Date();
    const from = new Date(to);

    from.setDate(from.getDate() - days + 1);

    return {
      dateRange: {
        from: toDateKey(from),
        to: toDateKey(to),
      },
      periodLabel: `Last ${days} days`,
    };
  }, [period]);

  // This hook only mounts when analytics.view is granted by Can.
  const {
    data,
    isPending,
    isError,
    refetch,
  } = useDashboardSummary({
    from: dateRange.from,
    to: dateRange.to,
  });

  if (isPending) {
    return <DashboardSkeleton />;
  }

  if (isError || !data?.success) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" aria-hidden="true" />

        <AlertTitle>Unable to load analytics</AlertTitle>

        <AlertDescription className="mt-2 flex flex-col items-start gap-3">
          The dashboard analytics could not be loaded. Please try again.

          <Button
            size="sm"
            variant="outline"
            onClick={() => void refetch()}
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const { revenue, workQueue, recentActivity, systemStatistics } =
    data.data;

  const { totals } = revenue;
  const activities = recentActivity.items;

  return (
    <div className="space-y-8">
      {/* 1. Overview KPIs */}
      <section aria-labelledby="overview-heading" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="overview-heading" className="text-lg font-semibold">
              Overview
            </h2>

            <p className="text-sm text-muted-foreground">{periodLabel}</p>
          </div>

          <PeriodSwitch value={period} onChange={setPeriod} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total collections"
            value={formatCompactETB(totals.combined)}
            helper="All sources"
            icon={CircleDollarSign}
            iconClassName={KPI_ICON}
            trend={totals.combinedTrend}
          />

          <MetricCard
            title="Assessment-based"
            value={formatCompactETB(totals.assessment)}
            helper="Assessment invoice payments"
            icon={FileCheck2}
            iconClassName={KPI_ICON}
            trend={totals.assessmentTrend}
          />

          <MetricCard
            title="Direct collections"
            value={formatCompactETB(totals.direct)}
            helper="Collected directly"
            icon={Banknote}
            iconClassName={KPI_ICON}
            trend={totals.directTrend}
          />

          <MetricCard
            title="Outstanding invoices"
            value={formatETB(revenue.outstanding.amount)}
            helper="Unpaid balance"
            icon={Clock3}
            iconClassName={KPI_ICON}
          />
        </div>
      </section>

      {/* 2. Collections chart and work queue */}
      <section
        aria-label="Collections and work queue"
        className="grid min-w-0 gap-6 xl:grid-cols-3"
      >
        <Card className="min-w-0 xl:col-span-2">
          <CardHeading
            title="Collections over time"
            description="Daily amounts in ETB, by source."
            action={
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={chartType}
                onValueChange={(value) => {
                  if (value === "bar" || value === "line") {
                    setChartType(value);
                  }
                }}
                aria-label="Chart type"
              >
                <ToggleGroupItem value="bar" aria-label="Bar chart">
                  <BarChart3 className="size-4" aria-hidden="true" />
                </ToggleGroupItem>

                <ToggleGroupItem value="line" aria-label="Line chart">
                  <LineChartIcon className="size-4" aria-hidden="true" />
                </ToggleGroupItem>
              </ToggleGroup>
            }
          />

          <CardContent>
            <RevenueChart
              data={revenue.chart.series}
              chartType={chartType}
            />
          </CardContent>

          <CardFooter className="flex-col items-stretch gap-4 border-t pt-6">
            <SourceMix
              assessmentTotal={totals.assessment}
              directTotal={totals.direct}
            />
          </CardFooter>
        </Card>

        <Card className="min-w-0">
          <CardHeading
            title="Needs attention"
            description="Work waiting for review."
            action={
              workQueue.total > 0 ? (
                <span className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
                  {workQueue.total}
                </span>
              ) : undefined
            }
          />

          <CardContent>
            {workQueue.items.length > 0 ? (
              <div className="space-y-0.5">
                {workQueue.items.map((item) => (
                  <WorkQueueRow key={item.key} item={item} />
                ))}
              </div>
            ) : (
              <EmptyMessage
                title="All caught up"
                text="There is no work waiting for review."
              />
            )}
          </CardContent>
        </Card>
      </section>

      {/* 3. Recent activity */}
      <section aria-label="Recent activity">
        <Card className="min-w-0">
          <CardHeading
            title="Recent activity"
            description="Latest payment and collection events."
            action={
              <Can resource="payments" action="read">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/payments">
                    View all
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </Can>
            }
          />

          <CardContent>
            {activities.length === 0 ? (
              <EmptyMessage
                title="No recent activity"
                text="Payment and collection events will appear here."
              />
            ) : (
              <ul className="divide-y">
                {activities.map((activity) => {
                  const status = ACTIVITY_STATUS[activity.status];
                  const StatusIcon = status.icon;
                  const date = new Date(activity.occurredAt);

                  const time = Number.isNaN(date.getTime())
                    ? "Unknown time"
                    : date.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      });

                  const source =
                    activity.source === "ASSESSMENT"
                      ? "Assessment"
                      : "Direct collection";

                  return (
                    <li
                      key={activity.reference}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full",
                          status.className,
                        )}
                      >
                        <StatusIcon
                          className="size-4"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {activity.title}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          {source} · {activity.reference} · {time}
                        </p>
                      </div>

                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          status.className,
                        )}
                      >
                        {activity.status.toLowerCase()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 4. All-time system statistics */}
      <section aria-label="System records">
        <Card>
          <CardHeading
            title="System records"
            description="All-time totals, not affected by the period filter."
          />

          <CardContent>
            <dl className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {SYSTEM_STATS.map((stat) => (
                <div key={stat.key}>
                  <dt className="text-sm text-muted-foreground">
                    {stat.label}
                  </dt>

                  <dd className="mt-1 text-2xl font-semibold tabular-nums">
                    {systemStatistics[stat.key].toLocaleString()}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dashboard page                                                             */
/* -------------------------------------------------------------------------- */

function DashboardContent() {
  const [searchOpen, setSearchOpen] = useState(false);

  // Support Cmd+K on macOS and Ctrl+K on other platforms.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <>

      <div className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Page header and actions remain available independently of analytics. */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Revenue management
            </h1>

            <p className="text-sm text-muted-foreground">
              {formatEthiopianDateWithTime(new Date())}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">

              <Button variant="outline" asChild>
                <Link href="/reports">
                  <BarChart3 className="size-4" aria-hidden="true" />
                  Reports
                </Link>
              </Button>

          </div>
        </header>

        {/* Only authorized users mount the analytics query and analytics UI. */}
        <Can resource="analytics" action="view">
          <AnalyticsDashboard />
        </Can>

{/* Quick access is independent of analytics.view. */}
<QuickAccess />
      </div>
    </>
  );
}

export default function RevenueDashboardPage() {
  return (
    <ProtectedRoute resource="dashboard" action="view">
      <DashboardContent />
    </ProtectedRoute>
  );
}