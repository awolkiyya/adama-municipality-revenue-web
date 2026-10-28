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
  Landmark,
  LineChart as LineChartIcon,
  LoaderCircle,
  RotateCcw,
  Search,
  X,
  XCircle,
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

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  type DashboardActivityStatus,
  type DashboardWorkQueueItem,
  type IconType,
} from "@/types/dashboard";
import { useInvoices } from "@/hooks/invoice/useInvoice.hook";

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

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

const UNPAID_STATUSES = [
  "ISSUED",
  "PARTIALLY_PAID",
  "OVERDUE",
] as const;

const INVOICES_PER_STATUS = 10;

/* -------------------------------------------------------------------------- */
/* Invoice types and helpers                                                  */
/* -------------------------------------------------------------------------- */

/**
 * This flexible view supports the invoice list fields used by the dialog.
 * The existing API remains responsible for invoice filtering and balances.
 */
type InvoiceRecord = Record<string, unknown> & {
  id?: string;
  invoice_number?: string;
  status?: string;
  source_type?: string;
};

type InvoiceQueryResult = {
  data?: InvoiceRecord[];
  meta?: {
    total?: number;
    current_page?: number;
    last_page?: number;
    per_page?: number;
  };
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return undefined;
}

function amountValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function getInvoiceStatus(invoice: InvoiceRecord): string {
  return (
    firstString(invoice.status)?.toUpperCase() ?? "UNKNOWN"
  );
}

function getInvoiceNumber(invoice: InvoiceRecord): string {
  return (
    firstString(invoice.invoice_number, invoice.number) ?? "Invoice"
  );
}

function getTaxpayerName(invoice: InvoiceRecord): string {
  const citizen = asRecord(invoice.citizen);
  const taxpayer = asRecord(invoice.taxpayer);
  const customer = citizen ?? taxpayer ?? asRecord(invoice.customer);

  const fullName = firstString(
    customer?.full_name,
    customer?.name,
    customer?.display_name,
  );

  if (fullName) {
    return fullName;
  }

  const parts = [
    customer?.first_name,
    customer?.middle_name,
    customer?.last_name,
  ].filter(
    (part): part is string =>
      typeof part === "string" && part.trim() !== "",
  );

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return (
    firstString(
      invoice.taxpayer_name,
      invoice.citizen_name,
      invoice.customer_name,
    ) ?? "Taxpayer not specified"
  );
}

function getTaxpayerIdentifier(invoice: InvoiceRecord): string | undefined {
  const citizen = asRecord(invoice.citizen);
  const taxpayer = asRecord(invoice.taxpayer);
  const customer = citizen ?? taxpayer ?? asRecord(invoice.customer);

  return firstString(
    customer?.taxpayer_number,
    customer?.taxpayer_id_number,
    customer?.tin,
    customer?.citizen_number,
    customer?.phone,
    invoice.taxpayer_number,
    invoice.citizen_number,
    invoice.tin,
  );
}

function getInvoiceDescription(invoice: InvoiceRecord): string {
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const firstItem = asRecord(items[0]);
  const assessment = asRecord(invoice.assessment);

  return (
    firstString(
      invoice.service_name,
      invoice.revenue_service_name,
      firstItem?.service_name,
      firstItem?.description,
      assessment?.assessment_number,
      invoice.assessment_number,
    ) ?? "Revenue invoice"
  );
}

function getInvoiceDueDate(invoice: InvoiceRecord): string | undefined {
  const dates = asRecord(invoice.dates);

  return firstString(
    invoice.due_date,
    dates?.due_date,
    invoice.payment_due_date,
  );
}

function getInvoiceBalance(invoice: InvoiceRecord): number {
  const financial = asRecord(invoice.financial);
  const totals = asRecord(invoice.totals);

  const balance = amountValue(
    invoice.balance_due ??
      invoice.outstanding_amount ??
      invoice.remaining_amount ??
      financial?.balance_due ??
      financial?.outstanding_amount ??
      totals?.balance_due,
  );

  if (balance !== undefined) {
    return Math.max(0, balance);
  }

  const total = amountValue(
    invoice.total_amount ??
      invoice.grand_total ??
      invoice.total ??
      financial?.total_amount ??
      financial?.grand_total ??
      totals?.total_amount,
  );

  const paid = amountValue(
    invoice.paid_amount ??
      invoice.amount_paid ??
      financial?.paid_amount ??
      financial?.amount_paid ??
      totals?.paid_amount,
  );

  if (total !== undefined) {
    return Math.max(0, total - (paid ?? 0));
  }

  return 0;
}

function getInvoiceStatusLabel(status: string): string {
  switch (status) {
    case "ISSUED":
      return "Issued";
    case "PARTIALLY_PAID":
      return "Partially paid";
    case "OVERDUE":
      return "Overdue";
    default:
      return status.replaceAll("_", " ").toLowerCase();
  }
}

function getInvoiceStatusClass(status: string): string {
  switch (status) {
    case "OVERDUE":
      return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400";
    case "PARTIALLY_PAID":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "ISSUED":
      return "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function getInvoiceHref(invoice: InvoiceRecord): string | undefined {
  const id = firstString(invoice.id, invoice.uuid);

  return id ? `/invoices/${encodeURIComponent(id)}` : undefined;
}

function getQueryInvoices(
  result: unknown,
): InvoiceRecord[] {
  const response = asRecord(result);
  const records = response?.data;

  if (Array.isArray(records)) {
    return records as InvoiceRecord[];
  }

  return [];
}

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
/* Unpaid invoice dialog                                                      */
/*                                                                            */
/* Uses the existing invoice API through useInvoices. Each status is queried  */
/* separately because the existing invoice filter uses a single status value. */
/* -------------------------------------------------------------------------- */

function UnpaidInvoicesDialog() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  // The search dialog does not issue broad requests until opened.
  const enabled = open;

  const issuedQuery = useInvoices({
    params: {
      search: debouncedSearch || undefined,
      status: "ISSUED",
      page: 1,
      per_page: INVOICES_PER_STATUS,
    },
  });

  const partialQuery = useInvoices({
    params: {
      search: debouncedSearch || undefined,
      status: "PARTIALLY_PAID",
      page: 1,
      per_page: INVOICES_PER_STATUS,
    },
  });

  const overdueQuery = useInvoices({
    params: {
      search: debouncedSearch || undefined,
      status: "OVERDUE",
      page: 1,
      per_page: INVOICES_PER_STATUS,
    },
  });

  const queries = [issuedQuery, partialQuery, overdueQuery];

  const isLoading =
    enabled && queries.some((query) => query.isPending);

  const isError =
    enabled && queries.some((query) => query.isError);

  const invoices = useMemo(() => {
    if (!enabled) {
      return [];
    }

    const allInvoices = queries.flatMap((query) =>
      getQueryInvoices(query.data),
    );

    const uniqueInvoices = new Map<string, InvoiceRecord>();

    for (const invoice of allInvoices) {
      const id = firstString(invoice.id, invoice.uuid);

      if (id) {
        uniqueInvoices.set(id, invoice);
      }
    }

    return Array.from(uniqueInvoices.values())
      .filter((invoice) => {
        const status = getInvoiceStatus(invoice);

        return (
          UNPAID_STATUSES.includes(
            status as (typeof UNPAID_STATUSES)[number],
          ) && getInvoiceBalance(invoice) > 0
        );
      })
      .sort((a, b) => {
        const aStatus = getInvoiceStatus(a);
        const bStatus = getInvoiceStatus(b);

        // Overdue invoices appear first, then partially paid, then issued.
        const priority: Record<string, number> = {
          OVERDUE: 0,
          PARTIALLY_PAID: 1,
          ISSUED: 2,
        };

        const statusDifference =
          (priority[aStatus] ?? 3) - (priority[bStatus] ?? 3);

        if (statusDifference !== 0) {
          return statusDifference;
        }

        return getInvoiceNumber(a).localeCompare(getInvoiceNumber(b));
      });
  }, [
    enabled,
    issuedQuery.data,
    partialQuery.data,
    overdueQuery.data,
  ]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setSearch("");
      setDebouncedSearch("");
    }
  }

  const hasSearch = debouncedSearch.length > 0;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Search className="size-4" aria-hidden="true" />
        Check unpaid invoices
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:w-full">
          <DialogHeader className="border-b px-5 py-5 pr-12 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Search className="size-5" aria-hidden="true" />
              </div>

              <div className="min-w-0 space-y-1">
                <DialogTitle className="text-lg">
                  Check unpaid invoices
                </DialogTitle>

                <DialogDescription>
                  Search by invoice number, taxpayer name, taxpayer number,
                  or other supported invoice search fields.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 border-b px-5 py-4 sm:px-6">
            <label
              htmlFor="unpaid-invoice-search"
              className="text-sm font-medium"
            >
              Search taxpayers or invoices
            </label>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <Input
                id="unpaid-invoice-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Enter taxpayer name, TIN, or invoice number..."
                className="h-11 pl-9 pr-10"
                autoComplete="off"
                autoFocus
              />

              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Clear search"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">Included statuses:</span>
              <Badge variant="outline" className={getInvoiceStatusClass("OVERDUE")}>
                Overdue
              </Badge>
              <Badge
                variant="outline"
                className={getInvoiceStatusClass("PARTIALLY_PAID")}
              >
                Partially paid
              </Badge>
              <Badge variant="outline" className={getInvoiceStatusClass("ISSUED")}>
                Issued
              </Badge>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            {isLoading ? (
              <div
                className="space-y-3"
                aria-label="Searching unpaid invoices"
                aria-busy="true"
              >
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className="space-y-3 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-3 w-48" />
                    <div className="flex items-center justify-between gap-3">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <Alert variant="destructive">
                <AlertCircle className="size-4" aria-hidden="true" />

                <AlertTitle>Unable to search invoices</AlertTitle>

                <AlertDescription className="mt-2 space-y-3">
                  <p>
                    The invoice search request failed. Check your connection
                    and try again.
                  </p>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void Promise.all(
                        queries.map((query) => query.refetch()),
                      );
                    }}
                  >
                    Try again
                  </Button>
                </AlertDescription>
              </Alert>
            ) : invoices.length === 0 ? (
              <EmptyMessage
                title={
                  hasSearch
                    ? "No unpaid invoices found"
                    : "No outstanding invoices found"
                }
                text={
                  hasSearch
                    ? "Try a different taxpayer name, TIN, or invoice number."
                    : "There are no matching unpaid invoices in the current results."
                }
              />
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    Matching invoices
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Showing up to {INVOICES_PER_STATUS} results per status
                  </p>
                </div>

                {invoices.map((invoice) => {
                  const id = firstString(invoice.id, invoice.uuid);
                  const invoiceNumber = getInvoiceNumber(invoice);
                  const taxpayerName = getTaxpayerName(invoice);
                  const taxpayerIdentifier =
                    getTaxpayerIdentifier(invoice);
                  const description = getInvoiceDescription(invoice);
                  const dueDate = getInvoiceDueDate(invoice);
                  const status = getInvoiceStatus(invoice);
                  const balance = getInvoiceBalance(invoice);
                  const href = getInvoiceHref(invoice);

                  return (
                    <div
                      key={id ?? invoiceNumber}
                      className="rounded-xl border bg-card p-4 transition-colors hover:border-primary/30"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold tracking-tight">
                              {invoiceNumber}
                            </span>

                            <Badge
                              variant="outline"
                              className={getInvoiceStatusClass(status)}
                            >
                              {getInvoiceStatusLabel(status)}
                            </Badge>
                          </div>

                          <p className="truncate text-sm font-medium">
                            {taxpayerName}
                          </p>

                          {taxpayerIdentifier ? (
                            <p className="text-xs text-muted-foreground">
                              Taxpayer ID: {taxpayerIdentifier}
                            </p>
                          ) : null}

                          <p className="text-sm text-muted-foreground">
                            {description}
                          </p>
                        </div>

                        <div className="shrink-0 sm:text-right">
                          <p className="text-xs text-muted-foreground">
                            Outstanding balance
                          </p>

                          <p className="mt-1 text-lg font-semibold tabular-nums">
                            {formatETB(balance)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">
                          {dueDate
                            ? `Due date: ${dueDate}`
                            : "Due date not available"}
                        </p>

                        {href ? (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto"
                          >
                            <Link href={href} onClick={() => setOpen(false)}>
                              View invoice
                              <ArrowRight
                                className="size-3.5"
                                aria-hidden="true"
                              />
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Invoice details unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                <p className="pt-1 text-xs text-muted-foreground">
                  Refine the search to find a specific taxpayer or invoice.
                  This dialog displays the first page of results for each
                  unpaid status.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-muted-foreground">
              Outstanding balances are retrieved from the invoice records.
            </p>

            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Analytics dashboard                                                        */
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
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
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

          <Button variant="outline" asChild>
            <Link href="/reports">
              <BarChart3 className="size-4" aria-hidden="true" />
              Reports
            </Link>
          </Button>
        </div>
      </header>

      {/* Only authorized users mount the analytics query and UI. */}
      <Can resource="analytics" action="view">
        <AnalyticsDashboard />
      </Can>

      {/* Quick access is independent of analytics.view. */}
      <QuickAccess />
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