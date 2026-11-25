
"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";

import {
  AlertCircle,
  ArrowRight,
  Banknote,
  BarChart3,
  Building2,
  ClipboardList,
  Clock3,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Landmark,
  Layers3,
  LineChart as LineChartIcon,
  Receipt,
  Settings2,
  Users,
  UserCheck,
  Code2,
  type LucideIcon,
} from "lucide-react";

import Can from "@/components/access/Can";
import ProtectedRoute from "@/components/access/ProtectedRoute";

import MetricCard from "@/components/dashboard/MetricCard";

import {
  PeriodSwitch,
  type PeriodSelection,
} from "@/components/dashboard/PeriodSwitch";

import RevenueChart from "@/components/dashboard/RevenueChart";
import SourceMix from "@/components/dashboard/SourceMix";
import QuickAccess from "@/components/dashboard/QuickAccess";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

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
  type ChartType,
  type DashboardWorkQueueItem,
} from "@/types/dashboard";

import UnpaidInvoicesDialog from "@/components/dialogs/UnpaidInvoicesDialog";

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

type SystemStatGroup =
  | "people"
  | "operations"
  | "configuration";

interface SystemStat {
  label: string;
  key:
    | "totalUsers"
    | "totalTaxpayers"
    | "totalAgents"
    | "totalAssessments"
    | "totalAssessmentInvoices"
    | "totalDirectCollectionInvoices"
    | "totalActiveRevenueCategories"
    | "totalRevenueCodes"
    | "totalActiveRevenueServices";
  group: SystemStatGroup;
  icon: LucideIcon;
}

interface SystemStatGroupConfig {
  key: SystemStatGroup;
  title: string;
  description: string;
  icon: LucideIcon;
}

const SYSTEM_STAT_GROUPS: SystemStatGroupConfig[] = [
  {
    key: "people",
    title: "People and accounts",
    description: "Registered users and taxpayer accounts.",
    icon: Users,
  },
  {
    key: "operations",
    title: "Revenue operations",
    description: "Assessment and invoice records.",
    icon: ClipboardList,
  },
  {
    key: "configuration",
    title: "Revenue configuration",
    description: "Configured revenue categories, codes and services.",
    icon: Settings2,
  },
];

const SYSTEM_STATS: SystemStat[] = [
  {
    label: "Users",
    key: "totalUsers",
    group: "people",
    icon: Users,
  },
  {
    label: "Taxpayers",
    key: "totalTaxpayers",
    group: "people",
    icon: Building2,
  },
  {
    label: "Agents",
    key: "totalAgents",
    group: "people",
    icon: UserCheck,
  },
  {
    label: "Assessments",
    key: "totalAssessments",
    group: "operations",
    icon: ClipboardList,
  },
  {
    label: "Assessment invoices",
    key: "totalAssessmentInvoices",
    group: "operations",
    icon: FileCheck2,
  },
  {
    label: "Direct invoices",
    key: "totalDirectCollectionInvoices",
    group: "operations",
    icon: Receipt,
  },
  {
    label: "Active categories",
    key: "totalActiveRevenueCategories",
    group: "configuration",
    icon: Layers3,
  },
  {
    label: "Revenue codes",
    key: "totalRevenueCodes",
    group: "configuration",
    icon: Code2,
  },
  {
    label: "Active services",
    key: "totalActiveRevenueServices",
    group: "configuration",
    icon: Settings2,
  },
];

const KPI_ICON = "bg-muted text-muted-foreground";

const DAYS_BY_PERIOD = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
} as const;

/* -------------------------------------------------------------------------- */
/* Shared dashboard components                                                */
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
          <CardTitle className="text-base">
            {title}
          </CardTitle>

          {description ? (
            <CardDescription>
              {description}
            </CardDescription>
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
      <p className="text-sm font-medium">
        {title}
      </p>

      <p className="mt-1 text-sm text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* System statistics components                                               */
/* -------------------------------------------------------------------------- */

function SystemStatCard({
  stat,
  value,
}: {
  stat: SystemStat;
  value: number;
}) {
  const Icon = stat.icon;

  return (
    <div
      className={cn(
        "group flex min-w-0 items-center gap-3 rounded-lg border bg-card p-4",
        "transition-colors duration-200 hover:bg-muted/40",
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          "bg-muted text-muted-foreground",
          "transition-colors duration-200 group-hover:bg-background",
        )}
      >
        <Icon
          className="size-5"
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <dt className="truncate text-sm font-medium text-muted-foreground">
          {stat.label}
        </dt>

        <dd className="mt-1 text-2xl font-semibold leading-none tracking-tight tabular-nums">
          {value.toLocaleString()}
        </dd>
      </div>
    </div>
  );
}

function SystemStatGroupSection({
  group,
  statistics,
}: {
  group: SystemStatGroupConfig;
  statistics: Record<SystemStat["key"], number>;
}) {
  const Icon = group.icon;

  const stats = SYSTEM_STATS.filter(
    (stat) => stat.group === group.key,
  );

  return (
    <section
      aria-labelledby={`system-stat-${group.key}`}
      className="space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon
            className="size-4"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0">
          <h3
            id={`system-stat-${group.key}`}
            className="text-sm font-semibold"
          >
            {group.title}
          </h3>

          <p className="mt-0.5 text-xs text-muted-foreground">
            {group.description}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <SystemStatCard
            key={stat.key}
            stat={stat}
            value={statistics[stat.key]}
          />
        ))}
      </dl>
    </section>
  );
}

function SystemRecords({
  statistics,
}: {
  statistics: Record<SystemStat["key"], number>;
}) {
  return (
    <section aria-labelledby="system-records-heading">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle
                id="system-records-heading"
                className="text-base"
              >
                System records
              </CardTitle>

              <CardDescription>
                All-time system totals, independent of the selected reporting period.
              </CardDescription>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5">
              <Clock3
                className="size-3.5 text-muted-foreground"
                aria-hidden="true"
              />

              <span className="text-xs font-medium text-muted-foreground">
                All time
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-7">
          {SYSTEM_STAT_GROUPS.map((group, index) => (
            <div key={group.key}>
              {index > 0 && (
                <div className="mb-6 border-t" />
              )}

              <SystemStatGroupSection
                group={group}
                statistics={statistics}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Work queue                                                                 */
/* -------------------------------------------------------------------------- */

const rowLink =
  "group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function WorkQueueRow({
  item,
}: {
  item: DashboardWorkQueueItem;
}) {
  const Icon =
    item.key === "pending_bank_transfers"
      ? Landmark
      : ClipboardList;

  return (
    <Link
      href="/office/dashboard/payments"
      className={rowLink}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon
          className="size-4"
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {item.title}
        </p>

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
        {item.count.toLocaleString()}
      </span>

      <ArrowRight
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading state                                                              */
/* -------------------------------------------------------------------------- */

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
          <Skeleton
            key={index}
            className="h-28"
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-96 xl:col-span-2" />
        <Skeleton className="h-96" />
      </div>

      <Skeleton className="h-[34rem]" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Analytics dashboard                                                        */
/* -------------------------------------------------------------------------- */

function AnalyticsDashboard() {
  const [chartType, setChartType] =
    useState<ChartType>("bar");

  const [period, setPeriod] =
    useState<PeriodSelection>({
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
        <AlertCircle
          className="size-4"
          aria-hidden="true"
        />

        <AlertTitle>
          Unable to load analytics
        </AlertTitle>

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

  const {
    revenue,
    workQueue,
    systemStatistics,
  } = data.data;

  const { totals } = revenue;

  return (
    <div className="space-y-8">
      {/* =====================================================
          1. OVERVIEW KPIs
      ===================================================== */}

      <section
        aria-labelledby="overview-heading"
        className="space-y-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="overview-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Overview
            </h2>

            <p className="text-sm text-muted-foreground">
              {periodLabel}
            </p>
          </div>

          <PeriodSwitch
            value={period}
            onChange={setPeriod}
          />
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

      {/* =====================================================
          2. COLLECTIONS CHART + WORK QUEUE
      ===================================================== */}

      <section
        aria-label="Collections and work queue"
        className="grid min-w-0 gap-6 xl:grid-cols-3"
      >
        {/* Collections chart */}
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
                  if (
                    value === "bar" ||
                    value === "line"
                  ) {
                    setChartType(value);
                  }
                }}
                aria-label="Chart type"
              >
                <ToggleGroupItem
                  value="bar"
                  aria-label="Bar chart"
                >
                  <BarChart3
                    className="size-4"
                    aria-hidden="true"
                  />
                </ToggleGroupItem>

                <ToggleGroupItem
                  value="line"
                  aria-label="Line chart"
                >
                  <LineChartIcon
                    className="size-4"
                    aria-hidden="true"
                  />
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

        {/* Work queue */}
        <Card className="min-w-0">
          <CardHeading
            title="Needs attention"
            description="Work waiting for review."
            action={
              workQueue.total > 0 ? (
                <span className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
                  {workQueue.total.toLocaleString()}
                </span>
              ) : undefined
            }
          />

          <CardContent>
            {workQueue.items.length > 0 ? (
              <div className="space-y-0.5">
                {workQueue.items.map((item) => (
                  <WorkQueueRow
                    key={item.key}
                    item={item}
                  />
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

      {/* =====================================================
          3. ALL-TIME SYSTEM RECORDS
      ===================================================== */}

      <SystemRecords
        statistics={systemStatistics}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dashboard page                                                             */
/* -------------------------------------------------------------------------- */

function DashboardContent() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Page header */}
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
          {/* Unpaid invoices permission */}
          <Can
            resource="invoices"
            action="read"
          >
            <UnpaidInvoicesDialog />
          </Can>

          {/* Reports permission */}
          <Can
            resource="reports"
            action="view"
          >
            <Button
              variant="outline"
              asChild
            >
              <Link href="/office/dashboard/reports">
                <BarChart3
                  className="size-4"
                  aria-hidden="true"
                />

                Reports
              </Link>
            </Button>
          </Can>
        </div>
      </header>

      {/* Analytics permission */}
      <Can
        resource="analytics"
        action="view"
      >
        <AnalyticsDashboard />
      </Can>

      {/* Quick access is independent of analytics permission */}
      <QuickAccess />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page export                                                                */
/* -------------------------------------------------------------------------- */

export default function RevenueDashboardPage() {
  return (
    <ProtectedRoute
      resource="dashboard"
      action="view"
    >
      <DashboardContent />
    </ProtectedRoute>
  );
}
