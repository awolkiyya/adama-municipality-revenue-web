"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileCheck2,
  FileClock,
  FileText,
  HandCoins,
  Landmark,
  LineChart as LineChartIcon,
  ListChecks,
  MapPinned,
  Receipt,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
  X,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Can from "@/components/access/Can";
import ProtectedRoute from "@/components/access/ProtectedRoute";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

/**
 * Adama Municipal Revenue Management System: office dashboard
 *
 * IMPORTANT:
 * Dashboard figures, workflow counts and activity below are DEMONSTRATION
 * DATA. Replace them with values from your Laravel dashboard API before
 * presenting this page as live municipal financial information.
 *
 * Revenue sources:
 * ASSESSMENT        - Payments against assessment-generated invoices.
 * DIRECT_COLLECTION - Revenue collected through direct collection.
 *
 * Total collections = assessment collections + direct collections.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type ChartType = "bar" | "line";
type Period = "7d" | "30d" | "90d";
type RevenueSource = "ASSESSMENT" | "DIRECT_COLLECTION";
type ModuleCategory = "Revenue" | "Operations" | "Administration";
type IconType = ComponentType<{ className?: string }>;

type RevenuePoint = {
  date: string;
  assessment: number;
  direct: number;
};

type ModuleItem = {
  title: string;
  description: string;
  href: string;
  resource: string;
  action: string;
  category: ModuleCategory;
  icon: IconType;
  keywords?: string[];
};

type WorkItem = {
  title: string;
  description: string;
  count: number;
  href: string;
  resource: string;
  action: string;
  icon: IconType;
  priority: "High" | "Medium";
};

type ActivityStatus = "Completed" | "Pending" | "Processing";

/* -------------------------------------------------------------------------- */
/* Demo data                                                                  */
/* -------------------------------------------------------------------------- */

const PERIODS: { key: Period; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
];

const DEMO_REVENUE: Record<Period, RevenuePoint[]> = {
  "7d": [
    { date: "Oct 07", assessment: 125000, direct: 42000 },
    { date: "Oct 08", assessment: 148000, direct: 51000 },
    { date: "Oct 09", assessment: 112000, direct: 38000 },
    { date: "Oct 10", assessment: 176000, direct: 65000 },
    { date: "Oct 11", assessment: 158000, direct: 57000 },
    { date: "Oct 12", assessment: 195000, direct: 72000 },
    { date: "Oct 13", assessment: 184000, direct: 81000 },
  ],
  "30d": [
    { date: "Sep 14", assessment: 420000, direct: 135000 },
    { date: "Sep 17", assessment: 385000, direct: 148000 },
    { date: "Sep 20", assessment: 510000, direct: 172000 },
    { date: "Sep 23", assessment: 465000, direct: 155000 },
    { date: "Sep 26", assessment: 590000, direct: 210000 },
    { date: "Sep 29", assessment: 545000, direct: 192000 },
    { date: "Oct 02", assessment: 625000, direct: 235000 },
    { date: "Oct 05", assessment: 580000, direct: 218000 },
    { date: "Oct 08", assessment: 690000, direct: 265000 },
    { date: "Oct 11", assessment: 735000, direct: 292000 },
  ],
  "90d": [
    { date: "Jul 16", assessment: 1250000, direct: 380000 },
    { date: "Jul 26", assessment: 1380000, direct: 425000 },
    { date: "Aug 05", assessment: 1320000, direct: 410000 },
    { date: "Aug 15", assessment: 1510000, direct: 490000 },
    { date: "Aug 25", assessment: 1640000, direct: 525000 },
    { date: "Sep 04", assessment: 1570000, direct: 505000 },
    { date: "Sep 14", assessment: 1810000, direct: 590000 },
    { date: "Sep 24", assessment: 1930000, direct: 645000 },
    { date: "Oct 04", assessment: 2050000, direct: 720000 },
    { date: "Oct 13", assessment: 2240000, direct: 810000 },
  ],
};

const OUTSTANDING_INVOICES_DEMO = 2480000;

const MODULES: ModuleItem[] = [
  {
    title: "Payments",
    description: "Payment history, transactions and receipts",
    href: "/payments",
    resource: "payments",
    action: "read",
    category: "Revenue",
    icon: Wallet,
    keywords: ["transactions", "receipts", "payment history"],
  },
  {
    title: "Assessment Payments",
    description: "Payments linked to assessment-generated invoices",
    href: "/payments?source=ASSESSMENT",
    resource: "payments",
    action: "read",
    category: "Revenue",
    icon: FileCheck2,
    keywords: ["assessment", "invoice", "tax"],
  },
  {
    title: "Direct Collections",
    description: "Revenue collected without the assessment workflow",
    href: "/payments?source=DIRECT_COLLECTION",
    resource: "payments",
    action: "read",
    category: "Revenue",
    icon: HandCoins,
    keywords: ["direct", "field", "cash", "revenue"],
  },
  {
    title: "Invoices",
    description: "Issued, partially paid and overdue invoices",
    href: "/invoices",
    resource: "invoices",
    action: "read",
    category: "Revenue",
    icon: Receipt,
    keywords: ["billing", "unpaid", "outstanding"],
  },
  {
    title: "Assessments",
    description: "Assess, review and issue revenue assessments",
    href: "/assessments",
    resource: "assessments",
    action: "read",
    category: "Revenue",
    icon: FileText,
    keywords: ["assessment", "approval", "tariff"],
  },
  {
    title: "Cash Collections",
    description: "Record and review cash collection transactions",
    href: "/cash-collections",
    resource: "payments",
    action: "read",
    category: "Revenue",
    icon: Banknote,
    keywords: ["cash", "collector", "receipt"],
  },
  {
    title: "Bank Transfers",
    description: "Verify bank transfer evidence and references",
    href: "/bank-transfers",
    resource: "payments",
    action: "read",
    category: "Revenue",
    icon: Landmark,
    keywords: ["bank", "transfer", "verification"],
  },
  {
    title: "Online Payments",
    description: "Monitor electronic payment transactions",
    href: "/online-payments",
    resource: "payments",
    action: "read",
    category: "Revenue",
    icon: Smartphone,
    keywords: ["online", "digital", "Chapa", "Telebirr"],
  },
  {
    title: "Cash Reconciliation",
    description: "Reconcile collections and cash sessions",
    href: "/cash-reconciliations",
    resource: "payments",
    action: "read",
    category: "Revenue",
    icon: ListChecks,
    keywords: ["reconciliation", "cash", "finance"],
  },
  {
    title: "Field Collections",
    description: "Manage revenue collection in the field",
    href: "/field-collections",
    resource: "payments",
    action: "read",
    category: "Operations",
    icon: MapPinned,
    keywords: ["field", "mobile", "collection"],
  },
  {
    title: "Lease Amendments",
    description: "Review lease-related assessment amendments",
    href: "/lease-amendments",
    resource: "lease-amendments",
    action: "read",
    category: "Operations",
    icon: FileCheck2,
    keywords: ["lease", "land", "ownership", "amendment"],
  },
  {
    title: "Citizens",
    description: "Citizen and taxpayer records",
    href: "/citizens",
    resource: "citizens",
    action: "read",
    category: "Operations",
    icon: Users,
    keywords: ["citizen", "taxpayer", "person"],
  },
  {
    title: "Properties",
    description: "Property information and ownership records",
    href: "/properties",
    resource: "properties",
    action: "read",
    category: "Operations",
    icon: Building2,
    keywords: ["property", "land", "ownership"],
  },
  {
    title: "Business Licenses",
    description: "Business registration and licensing information",
    href: "/business-licenses",
    resource: "business-licenses",
    action: "read",
    category: "Operations",
    icon: FileText,
    keywords: ["business", "license", "registration"],
  },
  {
    title: "Tariffs",
    description: "Manage revenue tariffs and assessment rules",
    href: "/tariffs",
    resource: "tariffs",
    action: "read",
    category: "Administration",
    icon: Settings2,
    keywords: ["tariff", "rate", "calculation"],
  },
  {
    title: "Measurement Units",
    description: "Configure units used in revenue calculations",
    href: "/measurement-units",
    resource: "measurement-units",
    action: "read",
    category: "Administration",
    icon: Settings2,
    keywords: ["unit", "measurement", "area"],
  },
  {
    title: "Users",
    description: "Manage office users and permissions",
    href: "/users",
    resource: "users",
    action: "read",
    category: "Administration",
    icon: ShieldCheck,
    keywords: ["user", "account", "permission"],
  },
  {
    title: "Agents",
    description: "Manage registered collection agents",
    href: "/agents",
    resource: "agents",
    action: "read",
    category: "Administration",
    icon: HandCoins,
    keywords: ["agent", "account", "collection"],
  },
  {
    title: "Audit Logs",
    description: "Review system activities and audit records",
    href: "/audit-logs",
    resource: "audit-logs",
    action: "read",
    category: "Administration",
    icon: Activity,
    keywords: ["audit", "history", "security"],
  },
];

/** Modules shown in the "Quick access" card, in this order. */
const QUICK_ACCESS_TITLES = [
  "Assessments",
  "Invoices",
  "Assessment Payments",
  "Direct Collections",
  "Cash Collections",
  "Citizens",
];

const QUICK_ACCESS: ModuleItem[] = QUICK_ACCESS_TITLES.map((title) =>
  MODULES.find((module) => module.title === title),
).filter((module): module is ModuleItem => Boolean(module));

const WORK_QUEUE: WorkItem[] = [
  {
    title: "Bank transfers to verify",
    description: "Review evidence and confirm payment references.",
    count: 12,
    href: "/bank-transfers",
    resource: "payments",
    action: "read",
    icon: Landmark,
    priority: "High",
  },
  {
    title: "Assessments to review",
    description: "Assessments waiting for approval.",
    count: 8,
    href: "/assessments",
    resource: "assessments",
    action: "read",
    icon: FileClock,
    priority: "High",
  },
  {
    title: "Lease amendments to review",
    description: "Pending changes to lease assessments.",
    count: 5,
    href: "/lease-amendments",
    resource: "lease-amendments",
    action: "read",
    icon: FileCheck2,
    priority: "Medium",
  },
  {
    title: "Cash reconciliations",
    description: "Check collection totals against cash sessions.",
    count: 3,
    href: "/cash-reconciliations",
    resource: "payments",
    action: "read",
    icon: ListChecks,
    priority: "Medium",
  },
];

const DEMO_ACTIVITIES: {
  title: string;
  description: string;
  reference: string;
  time: string;
  status: ActivityStatus;
  source: RevenueSource;
}[] = [
  {
    title: "Assessment payment recorded",
    description: "Assessment-related invoice payment",
    reference: "PAY-DEMO-001",
    time: "Today · 10:42 AM",
    status: "Completed",
    source: "ASSESSMENT",
  },
  {
    title: "Direct collection recorded",
    description: "Revenue recorded through direct collection",
    reference: "PAY-DEMO-002",
    time: "Today · 10:18 AM",
    status: "Completed",
    source: "DIRECT_COLLECTION",
  },
  {
    title: "Bank transfer awaiting verification",
    description: "Payment evidence requires review",
    reference: "PAY-DEMO-003",
    time: "Today · 09:55 AM",
    status: "Pending",
    source: "ASSESSMENT",
  },
  {
    title: "Online payment initiated",
    description: "Provider confirmation is pending",
    reference: "PAY-DEMO-004",
    time: "Today · 09:31 AM",
    status: "Processing",
    source: "DIRECT_COLLECTION",
  },
];

const ACTIVITY_STATUS_STYLES: Record<
  ActivityStatus,
  { icon: IconType; className: string }
> = {
  Completed: {
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  Pending: {
    icon: Clock3,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  Processing: {
    icon: CreditCard,
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatETB(value: number): string {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactETB(value: number): string {
  if (value >= 1_000_000) return `ETB ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `ETB ${(value / 1_000).toFixed(0)}K`;

  return `ETB ${value.toLocaleString("en-ET")}`;
}

/** Short axis label without the currency prefix, e.g. "1.2M". */
function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;

  return String(value);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Compares the later half of a period with the earlier half.
 * Returns the percentage change, or null when there is not enough data.
 */
function getTrend(values: number[]): number | null {
  if (values.length < 4) return null;

  const half = Math.floor(values.length / 2);
  const earlier = sum(values.slice(0, half));
  const later = sum(values.slice(values.length - half));

  if (earlier <= 0) return null;

  return ((later - earlier) / earlier) * 100;
}

/* -------------------------------------------------------------------------- */
/* Small components                                                           */
/* -------------------------------------------------------------------------- */

function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
  iconClassName,
  trend,
}: {
  title: string;
  value: string;
  helper: string;
  icon: IconType;
  iconClassName?: string;
  trend?: number | null;
}) {
  const hasTrend = typeof trend === "number";
  const isPositive = hasTrend && trend >= 0;

  return (
    <Card className="min-w-0 border-border/70 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>

          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              iconClassName ?? "bg-muted text-foreground",
            )}
          >
            <Icon className="size-4" />
          </div>
        </div>

        <p className="mt-3 break-words text-2xl font-semibold tracking-tight">
          {value}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {hasTrend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold",
                isPositive
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-400",
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {isPositive ? "+" : ""}
              {trend.toFixed(1)}%
            </span>
          )}

          <span className="text-muted-foreground">{helper}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const assessment =
    payload.find((item) => item.dataKey === "assessment")?.value ?? 0;
  const direct = payload.find((item) => item.dataKey === "direct")?.value ?? 0;

  return (
    <div className="min-w-48 rounded-xl border bg-background p-3 shadow-xl">
      <p className="mb-3 text-sm font-semibold">{label}</p>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Assessment-based</span>
          <span className="font-medium">{formatETB(assessment)}</span>
        </div>

        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Direct collection</span>
          <span className="font-medium">{formatETB(direct)}</span>
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-6">
          <span className="font-medium">Total</span>
          <span className="font-semibold">{formatETB(assessment + direct)}</span>
        </div>
      </div>
    </div>
  );
}

function RevenueChart({
  data,
  chartType,
}: {
  data: RevenuePoint[];
  chartType: ChartType;
}) {
  const sharedAxes = (
    <>
      <CartesianGrid
        strokeDasharray="3 3"
        vertical={false}
        className="stroke-border"
      />
      <XAxis
        dataKey="date"
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 11 }}
        tickMargin={10}
        minTickGap={18}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 11 }}
        tickFormatter={formatAxisValue}
        width={44}
      />
      <Tooltip content={<RevenueTooltip />} />
      <Legend
        verticalAlign="top"
        align="right"
        iconType="circle"
        iconSize={8}
        wrapperStyle={{ fontSize: 12, paddingBottom: 16 }}
      />
    </>
  );

  const margin = { top: 8, right: 8, left: 0, bottom: 0 };

  return (
    <div className="h-[280px] w-full sm:h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "bar" ? (
          <BarChart data={data} margin={margin} barGap={4} barCategoryGap="25%">
            {sharedAxes}
            <Bar
              dataKey="assessment"
              name="Assessment-based"
              fill="#2563eb"
              radius={[5, 5, 0, 0]}
              maxBarSize={30}
            />
            <Bar
              dataKey="direct"
              name="Direct collection"
              fill="#0d9488"
              radius={[5, 5, 0, 0]}
              maxBarSize={30}
            />
          </BarChart>
        ) : (
          <LineChart data={data} margin={margin}>
            {sharedAxes}
            <Line
              type="monotone"
              dataKey="assessment"
              name="Assessment-based"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="direct"
              name="Direct collection"
              stroke="#0d9488"
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/** One stacked bar showing how much each source contributes. */
function SourceMix({
  assessmentTotal,
  directTotal,
}: {
  assessmentTotal: number;
  directTotal: number;
}) {
  const total = assessmentTotal + directTotal;
  const assessmentShare = total > 0 ? (assessmentTotal / total) * 100 : 0;
  const directShare = total > 0 ? 100 - assessmentShare : 0;

  return (
    <div className="space-y-3">
      <div
        role="img"
        aria-label={`Assessment-based ${assessmentShare.toFixed(0)} percent, direct collection ${directShare.toFixed(0)} percent`}
        className="flex h-2.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="bg-blue-600 transition-all"
          style={{ width: `${assessmentShare}%` }}
        />
        <div
          className="bg-teal-600 transition-all"
          style={{ width: `${directShare}%` }}
        />
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-full bg-blue-600" />
          <span className="text-muted-foreground">Assessment-based</span>
          <span className="ml-auto font-semibold sm:ml-0">
            {assessmentShare.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-full bg-teal-600" />
          <span className="text-muted-foreground">Direct collection</span>
          <span className="ml-auto font-semibold sm:ml-0">
            {directShare.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function PeriodSwitch({
  value,
  onChange,
}: {
  value: Period;
  onChange: (period: Period) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Time period"
      className="inline-flex rounded-lg border bg-background p-1"
    >
      {PERIODS.map((period) => (
        <Button
          key={period.key}
          type="button"
          size="sm"
          variant={value === period.key ? "secondary" : "ghost"}
          className="h-8 px-3"
          aria-pressed={value === period.key}
          onClick={() => onChange(period.key)}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}

function WorkQueueItem({ item }: { item: WorkItem }) {
  const Icon = item.icon;

  return (
    <Can resource={item.resource} action={item.action}>
      <Link
        href={item.href}
        className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
          <Icon className="size-4 text-muted-foreground" />

          <span
            className={cn(
              "absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-background",
              item.priority === "High" ? "bg-rose-500" : "bg-amber-500",
            )}
            title={`${item.priority} priority`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{item.title}</p>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {item.description}
          </p>
        </div>

        <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-muted px-2 text-sm font-semibold">
          {item.count}
        </span>

        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Can>
  );
}

function QuickAccessItem({ module }: { module: ModuleItem }) {
  const Icon = module.icon;

  return (
    <Can resource={module.resource} action={module.action}>
      <Link
        href={module.href}
        className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground">
          <Icon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{module.title}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {module.description}
          </p>
        </div>

        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Can>
  );
}

/**
 * Searchable module dialog.
 *
 * Command handles text filtering and arrow-key navigation.
 * Enter opens a result; Escape closes the dialog.
 * Can wraps every result so users only see modules they can access.
 */
function ModuleSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  const categories: ModuleCategory[] = [
    "Revenue",
    "Operations",
    "Administration",
  ];

  function navigateToModule(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-5 sm:max-w-[620px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Search modules</DialogTitle>
          <DialogDescription>
            Search the municipal revenue system and open an authorized module.
          </DialogDescription>
        </DialogHeader>

        <Command
          loop
          className="rounded-xl"
          filter={(value, search) =>
            value.toLowerCase().includes(search.toLowerCase().trim()) ? 1 : 0
          }
        >
          <div className="flex items-center gap-3 border-b px-4">
            <Search className="size-5 shrink-0 text-muted-foreground" />

            <CommandInput
              placeholder="Search modules, payments, invoices..."
              className="h-14 border-0 text-sm shadow-none focus-visible:ring-0 w-full my-5"
            />

            <kbd className="hidden shrink-0 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-block">
              ESC
            </kbd>
          </div>

          <CommandList className="max-h-[min(65vh,480px)] p-2">
            <CommandEmpty className="py-10 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
                <Search className="size-5 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium">No modules found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try another module name or search term.
              </p>
            </CommandEmpty>

            {categories.map((category, categoryIndex) => (
              <div key={category}>
                {categoryIndex > 0 && <CommandSeparator className="my-2" />}

                <CommandGroup
                  heading={category}
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                >
                  {MODULES.filter((module) => module.category === category).map(
                    (module) => {
                      const Icon = module.icon;

                      return (
                        <Can
                          key={module.title}
                          resource={module.resource}
                          action={module.action}
                        >
                          <CommandItem
                            value={`${module.title} ${module.description} ${(module.keywords ?? []).join(" ")}`}
                            onSelect={() => navigateToModule(module.href)}
                            className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3"
                          >
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground group-data-[selected=true]:border-primary/20 group-data-[selected=true]:bg-primary/10 group-data-[selected=true]:text-primary">
                              <Icon className="size-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">
                                {module.title}
                              </p>
                              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                {module.description}
                              </p>
                            </div>

                            <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
                          </CommandItem>
                        </Can>
                      );
                    },
                  )}
                </CommandGroup>
              </div>
            ))}
          </CommandList>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-4 py-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <kbd className="rounded border bg-background px-1.5 py-0.5">
                  ↑
                </kbd>
                <kbd className="rounded border bg-background px-1.5 py-0.5">
                  ↓
                </kbd>
                Navigate
              </span>
              <span className="inline-flex items-center gap-1.5">
                <kbd className="rounded border bg-background px-1.5 py-0.5">
                  ↵
                </kbd>
                Open
              </span>
            </div>

            <span>Only authorized modules are shown</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function DemoNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3"
    >
      <Activity className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />

      <p className="flex-1 text-xs leading-5 text-muted-foreground">
        <span className="font-semibold text-foreground">Demo data. </span>
        Figures, work queue counts and activity on this page are examples, not
        live municipal records.
      </p>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss demo data notice"
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

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
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>

        {action}
      </div>
    </CardHeader>
  );
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

function DashboardContent() {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [period, setPeriod] = useState<Period>("7d");
  const [moduleSearchOpen, setModuleSearchOpen] = useState(false);
  const [showDemoNotice, setShowDemoNotice] = useState(true);

  // Set on the client only, so server and browser dates never mismatch.
  const [todayLabel, setTodayLabel] = useState("");
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl K");

  useEffect(() => {
    setTodayLabel(
      new Intl.DateTimeFormat("en-ET", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    );

    if (/Mac|iPhone|iPad/i.test(navigator.platform)) {
      setShortcutLabel("⌘K");
    }
  }, []);

  // Global shortcut: Command+K on macOS, Ctrl+K elsewhere.
  useEffect(() => {
    function handleGlobalShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setModuleSearchOpen((current) => !current);
      }
    }

    window.addEventListener("keydown", handleGlobalShortcut);

    return () => window.removeEventListener("keydown", handleGlobalShortcut);
  }, []);

  const revenueData = DEMO_REVENUE[period];

  const totals = useMemo(() => {
    const assessmentValues = revenueData.map((point) => point.assessment);
    const directValues = revenueData.map((point) => point.direct);
    const combinedValues = revenueData.map(
      (point) => point.assessment + point.direct,
    );

    return {
      assessment: sum(assessmentValues),
      direct: sum(directValues),
      combined: sum(combinedValues),
      assessmentTrend: getTrend(assessmentValues),
      directTrend: getTrend(directValues),
      combinedTrend: getTrend(combinedValues),
    };
  }, [revenueData]);

  const periodLabel =
    PERIODS.find((item) => item.key === period)?.label ?? "";

  const queueTotal = WORK_QUEUE.reduce((total, item) => total + item.count, 0);

  return (
    <div className="min-h-screen bg-muted/20">
      <ModuleSearchDialog
        open={moduleSearchOpen}
        onOpenChange={setModuleSearchOpen}
      />

      <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
        {showDemoNotice && (
          <DemoNotice onDismiss={() => setShowDemoNotice(false)} />
        )}

        {/* Page header */}
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Revenue management
            </h1>

            <p className="mt-1 min-h-5 text-sm text-muted-foreground">
              {todayLabel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setModuleSearchOpen(true)}
              className="min-w-44 justify-between gap-3"
              aria-label="Search modules"
            >
              <span className="flex items-center gap-2">
                <Search className="size-4" />
                Search modules
              </span>

              <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-block">
                {shortcutLabel}
              </kbd>
            </Button>

            <Button variant="outline" asChild>
              <Link href="/reports">
                <BarChart3 className="mr-2 size-4" />
                Reports
              </Link>
            </Button>

            <Can resource="payments" action="create">
              <Button asChild>
                <Link href="/payments">
                  <HandCoins className="mr-2 size-4" />
                  Manage collections
                </Link>
              </Button>
            </Can>
          </div>
        </header>

        {/* Key figures */}
        <section aria-labelledby="overview-heading" className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="overview-heading" className="text-lg font-semibold">
                Overview
              </h2>
              <p className="text-sm text-muted-foreground">
                Last {periodLabel}. Trends compare the later half of the period
                with the earlier half.
              </p>
            </div>

            <PeriodSwitch value={period} onChange={setPeriod} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total collections"
              value={formatCompactETB(totals.combined)}
              helper="All sources"
              icon={CircleDollarSign}
              iconClassName="bg-primary/10 text-primary"
              trend={totals.combinedTrend}
            />

            <MetricCard
              title="Assessment-based"
              value={formatCompactETB(totals.assessment)}
              helper="Against assessment invoices"
              icon={FileCheck2}
              iconClassName="bg-blue-500/10 text-blue-700 dark:text-blue-400"
              trend={totals.assessmentTrend}
            />

            <MetricCard
              title="Direct collections"
              value={formatCompactETB(totals.direct)}
              helper="Collected directly"
              icon={Banknote}
              iconClassName="bg-teal-500/10 text-teal-700 dark:text-teal-400"
              trend={totals.directTrend}
            />

            <MetricCard
              title="Outstanding invoices"
              value={formatETB(OUTSTANDING_INVOICES_DEMO)}
              helper="Unpaid balance"
              icon={Clock3}
              iconClassName="bg-amber-500/10 text-amber-700 dark:text-amber-400"
            />
          </div>
        </section>

        {/* Chart and work queue */}
        <section className="grid gap-5 xl:grid-cols-3">
          <Card className="min-w-0 border-border/70 shadow-sm xl:col-span-2">
            <CardHeading
              title="Collections over time"
              description="Amounts in ETB, by revenue source."
              action={
                <div
                  role="group"
                  aria-label="Chart type"
                  className="flex items-center rounded-lg border bg-muted/40 p-1"
                >
                  <Button
                    size="sm"
                    variant={chartType === "bar" ? "secondary" : "ghost"}
                    className="h-8 gap-1.5 px-3"
                    onClick={() => setChartType("bar")}
                    aria-pressed={chartType === "bar"}
                  >
                    <BarChart3 className="size-4" />
                    <span className="hidden sm:inline">Bar</span>
                  </Button>

                  <Button
                    size="sm"
                    variant={chartType === "line" ? "secondary" : "ghost"}
                    className="h-8 gap-1.5 px-3"
                    onClick={() => setChartType("line")}
                    aria-pressed={chartType === "line"}
                  >
                    <LineChartIcon className="size-4" />
                    <span className="hidden sm:inline">Line</span>
                  </Button>
                </div>
              }
            />

            <CardContent className="space-y-5">
              <SourceMix
                assessmentTotal={totals.assessment}
                directTotal={totals.direct}
              />

              <RevenueChart data={revenueData} chartType={chartType} />

              <Can resource="payments" action="read">
                <div className="flex justify-end border-t pt-4">
                  <Link
                    href="/payments"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    View payments
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </Can>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeading
              title="Needs attention"
              description="Work waiting for review or action."
              action={
                <span className="rounded-lg bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
                  {queueTotal} items
                </span>
              }
            />

            <CardContent>
              <div className="-mx-1 space-y-0.5">
                {WORK_QUEUE.map((item) => (
                  <WorkQueueItem key={item.title} item={item} />
                ))}
              </div>

              <p className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Counts are examples. In production, load them from Laravel and
                apply the signed-in user&apos;s permissions.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Activity and quick access */}
        <section className="grid gap-5 xl:grid-cols-3">
          <Card className="border-border/70 shadow-sm xl:col-span-2">
            <CardHeading
              title="Recent activity"
              description="Latest payment and collection events."
              action={
                <Can resource="payments" action="read">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/payments">
                      View all
                      <ArrowRight className="ml-1.5 size-3.5" />
                    </Link>
                  </Button>
                </Can>
              }
            />

            <CardContent>
              <ul className="divide-y">
                {DEMO_ACTIVITIES.map((activity) => {
                  const status = ACTIVITY_STATUS_STYLES[activity.status];
                  const StatusIcon = status.icon;

                  return (
                    <li
                      key={activity.reference}
                      className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0"
                    >
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full",
                          status.className,
                        )}
                      >
                        <StatusIcon className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <p className="text-sm font-medium">{activity.title}</p>

                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-medium",
                              status.className,
                            )}
                          >
                            {activity.status}
                          </span>
                        </div>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {activity.description}
                        </p>

                        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="font-mono">{activity.reference}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">
                            {activity.source === "ASSESSMENT"
                              ? "Assessment"
                              : "Direct"}
                          </span>
                          <span>{activity.time}</span>
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeading
              title="Quick access"
              description="Jump to the work you do most."
            />

            <CardContent>
              <div className="-mx-1 space-y-0.5">
                {QUICK_ACCESS.map((module) => (
                  <QuickAccessItem key={module.title} module={module} />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="flex items-center gap-2 border-t pt-5 text-xs text-muted-foreground">
          <ShieldCheck className="size-4" />
          <span>
            Access-controlled navigation · Adama Municipal Revenue System
          </span>
        </footer>
      </div>
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