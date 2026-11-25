"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  AlertCircle,
  ArrowRight,
  Banknote,
  BarChart3,
  Building2,
  ChevronDown,
  CircleCheck,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Code2,
  FileCheck2,
  Landmark,
  Layers3,
  LineChart as LineChartIcon,
  Receipt,
  Settings2,
  UserCheck,
  Users,
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

type StatKey =
  | "totalUsers"
  | "totalTaxpayers"
  | "totalAgents"
  | "totalAssessments"
  | "totalAssessmentInvoices"
  | "totalDirectCollectionInvoices"
  | "totalActiveRevenueCategories"
  | "totalRevenueCodes"
  | "totalActiveRevenueServices";

interface SystemStat {
  label: string;
  key: StatKey;
  icon: LucideIcon;
}

// Flat list: no groups, no extra headings. Easy to scan.
const SYSTEM_STATS: SystemStat[] = [
  { label: "Users", key: "totalUsers", icon: Users },
  { label: "Taxpayers", key: "totalTaxpayers", icon: Building2 },
  { label: "Agents", key: "totalAgents", icon: UserCheck },
  { label: "Assessments", key: "totalAssessments", icon: ClipboardList },
  { label: "Assessment invoices", key: "totalAssessmentInvoices", icon: FileCheck2 },
  { label: "Direct invoices", key: "totalDirectCollectionInvoices", icon: Receipt },
  { label: "Active categories", key: "totalActiveRevenueCategories", icon: Layers3 },
  { label: "Revenue codes", key: "totalRevenueCodes", icon: Code2 },
  { label: "Active services", key: "totalActiveRevenueServices", icon: Settings2 },
];

// Show only the first few until the user asks for more.
const VISIBLE_STATS = 3;

const KPI_ICON = "bg-muted text-muted-foreground";

const DAYS_BY_PERIOD = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
} as const;

/* -------------------------------------------------------------------------- */
/* Needs attention (top of page, only when there is work)                     */
/* -------------------------------------------------------------------------- */

function AttentionRow({ item }: { item: DashboardWorkQueueItem }) {
  const Icon =
    item.key === "pending_bank_transfers" ? Landmark : ClipboardList;

  return (
    <Link
      href="/office/dashboard/payments"
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5",
        "transition-colors hover:bg-background/70",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <Icon
        className="size-4 shrink-0 text-destructive"
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.description}
        </p>
      </div>

      <span
        className="rounded-md bg-destructive/10 px-2 py-0.5 text-sm font-semibold tabular-nums text-destructive"
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

function NeedsAttention({
  items,
  total,
}: {
  items: DashboardWorkQueueItem[];
  total: number;
}) {
  // Nothing to do: show one calm line instead of an empty card.
  if (total === 0 || items.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
        <CircleCheck
          className="size-4 text-emerald-600"
          aria-hidden="true"
        />
        All caught up. Nothing is waiting for review.
      </div>
    );
  }

  return (
    <section
      aria-label="Needs attention"
      className="rounded-lg border border-destructive/30 bg-destructive/5 p-2"
    >
      <p className="px-3 pb-1 pt-2 text-sm font-semibold">
        {total.toLocaleString()} {total === 1 ? "item needs" : "items need"} your attention
      </p>

      <div>
        {items.map((item) => (
          <AttentionRow key={item.key} item={item} />
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* System records (compact, expandable)                                       */
/* -------------------------------------------------------------------------- */

function SystemRecords({
  statistics,
}: {
  statistics: Record<StatKey, number>;
}) {
  const [expanded, setExpanded] = useState(false);

  const stats = expanded
    ? SYSTEM_STATS
    : SYSTEM_STATS.slice(0, VISIBLE_STATS);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">System records</CardTitle>
          <CardDescription>
            All-time totals. The period filter does not change these.
          </CardDescription>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : `Show all ${SYSTEM_STATS.length}`}
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              expanded && "rotate-180",
            )}
            aria-hidden="true"
          />
        </Button>
      </CardHeader>

      <CardContent>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center gap-3">
              <Icon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />

              <dt className="flex-1 truncate text-sm text-muted-foreground">
                {label}
              </dt>

              <dd className="text-base font-semibold tabular-nums">
                {(statistics[key] ?? 0).toLocaleString()}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading state                                                              */
/* -------------------------------------------------------------------------- */

function DashboardSkeleton() {
  return (
    <div
      className="space-y-6"
      aria-label="Loading analytics"
      aria-busy="true"
    >
      <Skeleton className="h-14" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>

      <Skeleton className="h-96" />
      <Skeleton className="h-40" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Analytics                                                                  */
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
        dateRange: { from: period.from, to: period.to },
        periodLabel: `${period.from} to ${period.to}`,
      };
    }

    const days = DAYS_BY_PERIOD[period.period];
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - days + 1);

    return {
      dateRange: { from: toDateKey(from), to: toDateKey(to) },
      periodLabel: `Last ${days} days`,
    };
  }, [period]);

  const { data, isPending, isError, refetch } = useDashboardSummary({
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
          Check your connection and try again.

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

  const { revenue, workQueue, systemStatistics } = data.data;
  const { totals } = revenue;

  return (
    <div className="space-y-6">
      {/* 1. What needs me right now? */}
      <NeedsAttention
        items={workQueue.items}
        total={workQueue.total}
      />

      {/* 2. How are we doing? */}
      <section aria-labelledby="overview-heading" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="overview-heading"
              className="text-lg font-semibold tracking-tight"
            >
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

      {/* 3. Where is it coming from? */}
      <Card className="min-w-0">
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">
              Collections over time
            </CardTitle>
            <CardDescription>Daily amounts in ETB, by source.</CardDescription>
          </div>

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
        </CardHeader>

        <CardContent>
          <RevenueChart
            data={revenue.chart.series}
            chartType={chartType}
          />
        </CardContent>

        <CardFooter className="flex-col items-stretch border-t pt-6">
          <SourceMix
            assessmentTotal={totals.assessment}
            directTotal={totals.direct}
          />
        </CardFooter>
      </Card>

      {/* 4. Reference numbers (least important, so last and compact) */}
      <SystemRecords statistics={systemStatistics} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

function DashboardContent() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
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
          <Can resource="invoices" action="read">
            <UnpaidInvoicesDialog />
          </Can>

          <Can resource="reports" action="view">
            <Button variant="outline" asChild>
              <Link href="/office/dashboard/reports">
                <BarChart3 className="size-4" aria-hidden="true" />
                Reports
              </Link>
            </Button>
          </Can>
        </div>
      </header>

      {/* Quick access first: the actions people use most, always visible */}
      <QuickAccess />

      <Can resource="analytics" action="view">
        <AnalyticsDashboard />
      </Can>
    </div>
  );
}

export default function RevenueDashboardPage() {
  return (
    <ProtectedRoute resource="dashboard" action="view">
      <DashboardContent />
    </ProtectedRoute>
  );
}