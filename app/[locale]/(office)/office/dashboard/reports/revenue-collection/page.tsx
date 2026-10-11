"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Activity,
  AlertTriangle,
  Banknote,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  ExternalLink,
  FileBarChart,
  FileSpreadsheet,
  Filter,
  Inbox,
  Landmark,
  Layers,
  Printer,
  RefreshCw,
  RotateCcw,
  Smartphone,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { EthiopianDatePicker } from "@/components/input/EthiopianDatePicker";
import { gregorianToEth } from "@/utils/ethiopianCalendar";
import { formatEthiopianDate } from "@/lib/utils";

import { useRevenueCollectionReport } from "@/hooks/report/use-revenue-collection-report";
import { useRevenueCategories } from "@/hooks/revenue/revenueCategory.hook";
import { useRevenueServices } from "@/hooks/revenue/revenueService.hook";

import type {
  RevenueCollectionReportFilters,
  RevenuePaymentMethod,
  RevenuePaymentProvider,
  RevenuePaymentSource,
  RevenuePaymentStatus,
} from "@/types/report/revenue-report";

/* -------------------------------------------------------------------------- */
/*  Types & constants                                                          */
/* -------------------------------------------------------------------------- */

type ReportFilters = {
  startDate: string;
  endDate: string;
  method: string;
  provider: string;
  source: string;
  status: string;
  domain: string;
  revenueCategoryId: string;
  serviceId: string;
  administrativeUnitId: string;
};

type Option = { id: string; name: string };
type Choice = { value: string; label: string };
type NumericValue = number | string | null | undefined;

/**
 * Theme-driven palette. Every colour resolves to a CSS variable, so the page
 * follows your light/dark theme. Optional tokens (--success, --warning,
 * --info) fall back to the shadcn chart colours when they are not defined.
 * See theme-tokens.css for the recommended values.
 */
const COLOR = {
  collected: "var(--success, var(--chart-1))",
  pending: "var(--warning, var(--chart-4))",
  processing: "var(--info, var(--chart-2))",
  failed: "var(--destructive)",
  reversed: "var(--chart-5)",
  neutral: "var(--muted-foreground)",
};

/** Transparent tint of any theme colour, for soft backgrounds and borders. */
const tint = (color: string, percent = 12) =>
  `color-mix(in oklab, ${color} ${percent}%, transparent)`;

const AXIS_TICK = { fontSize: 12, fill: "var(--muted-foreground)" };

const PAYMENT_METHODS: { value: RevenuePaymentMethod; label: string; color: string }[] = [
  { value: "CASH", label: "Cash", color: "var(--chart-4)" },
  { value: "BANK_TRANSFER", label: "Bank transfer", color: "var(--chart-2)" },
  { value: "ONLINE", label: "Online", color: "var(--chart-3)" },
];

const PAYMENT_PROVIDERS: { value: RevenuePaymentProvider; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank" },
  { value: "CHAPA", label: "Chapa" },
  { value: "TELEBIRR", label: "Telebirr" },
];

const PAYMENT_SOURCES: { value: RevenuePaymentSource; label: string }[] = [
  { value: "ONLINE", label: "Online" },
  { value: "AGENT_ASSISTED", label: "Agent assisted" },
  { value: "OFFICE_RECORDED", label: "Office recorded" },
  { value: "FIELD_COLLECTION", label: "Field collection" },
  { value: "SYSTEM", label: "System" },
];

const PAYMENT_STATUSES: { value: RevenuePaymentStatus; label: string }[] = [
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "FAILED", label: "Failed" },
  { value: "REVERSED", label: "Reversed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
];

const REVENUE_DOMAINS = [
  { value: "TAX", label: "Tax" },
  { value: "RENT", label: "Rent" },
  { value: "INVESTMENT", label: "Investment" },
  { value: "SERVICE", label: "Service" },
  { value: "SALE", label: "Sale" },
  { value: "CAPITAL", label: "Capital" },
] as const;

const DOMAIN_COLORS: Record<string, string> = {
  TAX: "var(--chart-2)",
  RENT: "var(--chart-1)",
  INVESTMENT: "var(--chart-5)",
  SERVICE: "var(--chart-4)",
  SALE: "var(--chart-3)",
  CAPITAL: "var(--muted-foreground)",
};

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--popover, var(--background))",
  color: "var(--popover-foreground, var(--foreground))",
  fontSize: 12,
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toIso(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Filters store ISO strings (sent to the API); the picker works with Dates. */
function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getDefaultFilters(): ReportFilters {
  return {
    startDate: `${new Date().getFullYear()}-01-01`,
    endDate: toIso(new Date()),
    method: "all",
    provider: "all",
    source: "all",
    status: "all",
    domain: "all",
    revenueCategoryId: "all",
    serviceId: "all",
    administrativeUnitId: "all",
  };
}

/** Quick reporting periods, always ending today. */
const PERIOD_PRESETS: { key: string; label: string; range: () => [string, string] }[] = [
  {
    key: "month",
    label: "This month",
    range: () => {
      const now = new Date();
      return [toIso(new Date(now.getFullYear(), now.getMonth(), 1)), toIso(now)];
    },
  },
  {
    key: "30d",
    label: "Last 30 days",
    range: () => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return [toIso(start), toIso(now)];
    },
  },
  {
    key: "quarter",
    label: "This quarter",
    range: () => {
      const now = new Date();
      const q = Math.floor(now.getMonth() / 3) * 3;
      return [toIso(new Date(now.getFullYear(), q, 1)), toIso(now)];
    },
  },
  {
    key: "ytd",
    label: "Year to date",
    range: () => {
      const now = new Date();
      return [toIso(new Date(now.getFullYear(), 0, 1)), toIso(now)];
    },
  },
];

function toNumber(value: NumericValue): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: NumericValue, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function formatNumber(value: NumericValue, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    toNumber(value),
  );
}

function formatCompact(value: NumericValue): string {
  const amount = toNumber(value);
  if (Math.abs(amount) >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(amount) >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toLocaleString();
}

function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(digits).replace(/\.0$/, "")}%`;
}

/** Ethiopian calendar label, shown in the header. */
function formatEthDate(iso: string): string {
  const date = isoToDate(iso);
  return date ? formatEthiopianDate(date.toDateString()) : "Any date";
}

/** Gregorian label, used as a tooltip next to the Ethiopian date. */
function formatDate(iso: string, locale: string): string {
  if (!iso) return "Any date";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(`${iso}T00:00:00`),
  );
}

function formatPeriod(period: string, locale: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(
      new Date(`${period}T00:00:00`),
    );
  }
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-").map(Number);
    return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short" }).format(
      new Date(year, month - 1, 1),
    );
  }
  return period;
}

function formatLabel(value: string): string {
  const text = value.toLowerCase().replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function percentOf(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0;
}

function escapeCsv(value: string | number | null | undefined): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadCsv(
  filename: string,
  rows: (string | number | null | undefined)[][],
): void {
  const content = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                      */
/* -------------------------------------------------------------------------- */

function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-xl border bg-card text-card-foreground print:break-inside-avoid ${className}`}
    >
      <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-tight">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0 print:hidden">{action}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function EmptyState({ message, height = 220 }: { message: string; height?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground"
      style={{ height }}
    >
      <Inbox className="size-5 opacity-60" />
      {message}
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
  label,
}: {
  options: Choice[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-lg border bg-muted/40 p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            value === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function PillGroup({
  label,
  value,
  onChange,
  options,
  allLabel = "All",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Choice[];
  allLabel?: string;
}) {
  const items: Choice[] = [{ value: "all", label: allLabel }, ...options];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {items.map((item) => {
          const active = value === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(item.value)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {active && <Check className="size-3" />}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Choice[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="all">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FilterGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading report">
      <div className="h-64 animate-pulse rounded-xl border bg-muted/40" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-xl border bg-muted/40" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="h-80 animate-pulse rounded-xl border bg-muted/40 xl:col-span-2" />
        <div className="h-80 animate-pulse rounded-xl border bg-muted/40" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function RevenueCollectionPage() {
  const t = useTranslations("revenueCollectionReport");
  const locale = useLocale();

  // Applied filters drive the API, charts, exports and links.
  const [filters, setFilters] = useState<ReportFilters>(getDefaultFilters);
  // Draft filters live inside the Sheet and never refetch until applied.
  const [draftFilters, setDraftFilters] = useState<ReportFilters>(getDefaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [trendView, setTrendView] = useState<"daily" | "cumulative">("daily");
  const [showAllUnits, setShowAllUnits] = useState(false);

  const defaultFilters = useMemo(() => getDefaultFilters(), []);

  const { data: categoriesResponse, isPending: categoriesPending } =
    useRevenueCategories();
  const { data: servicesResponse, isPending: servicesPending } = useRevenueServices();

  const categories: Option[] = useMemo(() => {
    const items = categoriesResponse?.data ?? [];
    return items
      .map((item) => ({ id: String(item.id), name: String(item.name ?? "") }))
      .filter((item) => item.id && item.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categoriesResponse]);

  const services: Option[] = useMemo(() => {
    const items = servicesResponse?.data ?? [];
    return items
      .map((item) => ({ id: String(item.id), name: String(item.name ?? "") }))
      .filter((item) => item.id && item.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [servicesResponse]);

  const apiFilters = useMemo<RevenueCollectionReportFilters>(() => {
    const params: RevenueCollectionReportFilters = {};

    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;
    if (filters.method !== "all")
      params.payment_method = filters.method as RevenuePaymentMethod;
    if (filters.provider !== "all")
      params.payment_provider = filters.provider as RevenuePaymentProvider;
    if (filters.source !== "all")
      params.payment_source = filters.source as RevenuePaymentSource;
    if (filters.status !== "all")
      params.status = filters.status as RevenuePaymentStatus;
    if (filters.domain !== "all")
      params.revenue_domain =
        filters.domain as RevenueCollectionReportFilters["revenue_domain"];
    if (filters.revenueCategoryId !== "all")
      params.revenue_category_id = filters.revenueCategoryId;
    if (filters.serviceId !== "all") params.service_id = filters.serviceId;
    if (filters.administrativeUnitId !== "all")
      params.administrative_unit_id = filters.administrativeUnitId;

    return params;
  }, [filters]);

  const {
    data: report,
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  } = useRevenueCollectionReport(apiFilters);

  const summary = report?.summary;
  const dailyCollections = report?.daily_collections ?? [];
  const paymentMethods = report?.payment_methods ?? [];
  const paymentSources = report?.payment_sources ?? [];
  const revenueDomains = report?.revenue_domains ?? [];
  const administrativeUnits = report?.administrative_units ?? [];

  const totalCollected = toNumber(summary?.total_collected);
  const totalTransactions = toNumber(summary?.total_transactions);
  const completedCount = toNumber(summary?.completed_count);
  const averagePayment = toNumber(summary?.average_payment);

  /* ----------------------------- filter state ----------------------------- */

  const countActiveFilters = (values: ReportFilters) =>
    [
      values.method !== "all",
      values.provider !== "all",
      values.source !== "all",
      values.status !== "all",
      values.domain !== "all",
      values.revenueCategoryId !== "all",
      values.serviceId !== "all",
      values.administrativeUnitId !== "all",
      values.startDate !== defaultFilters.startDate,
      values.endDate !== defaultFilters.endDate,
    ].filter(Boolean).length;

  const activeFilterCount = countActiveFilters(filters);
  const draftFilterCount = countActiveFilters(draftFilters);
  const hasUnappliedChanges = JSON.stringify(filters) !== JSON.stringify(draftFilters);

  const dateRangeInvalid =
    Boolean(draftFilters.startDate) &&
    Boolean(draftFilters.endDate) &&
    draftFilters.startDate > draftFilters.endDate;

  const administrativeUnitOptions = useMemo(() => {
    const options = [...administrativeUnits];

    if (
      filters.administrativeUnitId !== "all" &&
      !options.some((item) => item.administrative_unit_id === filters.administrativeUnitId)
    ) {
      options.push({
        administrative_unit_id: filters.administrativeUnitId,
        administrative_unit_name: "Selected administrative unit",
        completed_amount: 0,
        completed_count: 0,
      });
    }

    return options;
  }, [administrativeUnits, filters.administrativeUnitId]);

  const labelFrom = (list: Choice[], value: string) =>
    list.find((item) => item.value === value)?.label ?? formatLabel(value);

  const activePreset = PERIOD_PRESETS.find((preset) => {
    const [start, end] = preset.range();
    return start === filters.startDate && end === filters.endDate;
  });

  // Removable chips that summarise every applied (non-period) filter.
  const filterChips = useMemo(() => {
    const chips: { key: keyof ReportFilters; label: string }[] = [];
    const idName = (list: Option[], id: string) =>
      list.find((item) => item.id === id)?.name ?? "Selected";

    if (filters.domain !== "all")
      chips.push({ key: "domain", label: `Domain: ${labelFrom(REVENUE_DOMAINS.map((d) => ({ ...d })), filters.domain)}` });
    if (filters.revenueCategoryId !== "all")
      chips.push({ key: "revenueCategoryId", label: `Category: ${idName(categories, filters.revenueCategoryId)}` });
    if (filters.serviceId !== "all")
      chips.push({ key: "serviceId", label: `Service: ${idName(services, filters.serviceId)}` });
    if (filters.method !== "all")
      chips.push({ key: "method", label: `Method: ${labelFrom(PAYMENT_METHODS, filters.method)}` });
    if (filters.provider !== "all")
      chips.push({ key: "provider", label: `Provider: ${labelFrom(PAYMENT_PROVIDERS, filters.provider)}` });
    if (filters.source !== "all")
      chips.push({ key: "source", label: `Source: ${labelFrom(PAYMENT_SOURCES, filters.source)}` });
    if (filters.status !== "all")
      chips.push({ key: "status", label: `Status: ${labelFrom(PAYMENT_STATUSES, filters.status)}` });
    if (filters.administrativeUnitId !== "all") {
      const unit = administrativeUnitOptions.find(
        (item) => item.administrative_unit_id === filters.administrativeUnitId,
      );
      chips.push({ key: "administrativeUnitId", label: `Unit: ${unit?.administrative_unit_name ?? "Selected"}` });
    }

    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, categories, services, administrativeUnitOptions]);

  const updateDraftFilter = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) =>
    setDraftFilters((current) => ({ ...current, [key]: value }));

  // Memoised so the picker's value-sync effect only runs when the date changes.
  const startDateValue = useMemo(
    () => isoToDate(draftFilters.startDate),
    [draftFilters.startDate],
  );
  const endDateValue = useMemo(
    () => isoToDate(draftFilters.endDate),
    [draftFilters.endDate],
  );
  const ethiopianYear = useMemo(() => gregorianToEth(new Date()).year, []);

  const handleDateSelect =
    (key: "startDate" | "endDate") => (date: Date) =>
      updateDraftFilter(key, toIso(date));

  const openFilters = () => {
    setDraftFilters({ ...filters });
    setFiltersOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (open) setDraftFilters({ ...filters });
    setFiltersOpen(open);
  };

  const applyFilters = () => {
    if (dateRangeInvalid) return;
    setFilters({ ...draftFilters });
    setFiltersOpen(false);
  };

  const clearAppliedFilters = () => {
    const defaults = getDefaultFilters();
    setFilters(defaults);
    setDraftFilters(defaults);
    setFiltersOpen(false);
  };

  const removeChip = (key: keyof ReportFilters) =>
    setFilters((current) => ({ ...current, [key]: "all" }));

  const applyPreset = (preset: (typeof PERIOD_PRESETS)[number]) => {
    const [startDate, endDate] = preset.range();
    setFilters((current) => ({ ...current, startDate, endDate }));
  };

  /* ---------------------------- derived datasets -------------------------- */

  const outcome = useMemo(() => {
    const rows = [
      { key: "completed", label: "Completed", amount: toNumber(summary?.total_collected), count: toNumber(summary?.completed_count), color: COLOR.collected },
      { key: "pending", label: "Pending", amount: toNumber(summary?.pending_amount), count: toNumber(summary?.pending_count), color: COLOR.pending },
      { key: "processing", label: "Processing", amount: toNumber(summary?.processing_amount), count: toNumber(summary?.processing_count), color: COLOR.processing },
      { key: "failed", label: "Failed", amount: toNumber(summary?.failed_amount), count: toNumber(summary?.failed_count), color: COLOR.failed },
      { key: "reversed", label: "Reversed", amount: toNumber(summary?.reversed_amount), count: toNumber(summary?.reversed_count), color: COLOR.reversed },
    ];
    const total = rows.reduce((sum, row) => sum + row.amount, 0);
    return { rows, total };
  }, [summary]);

  const collectionTrend = useMemo(() => {
    let running = 0;
    return dailyCollections.map((item) => {
      const collected = toNumber(item.completed_amount);
      running += collected;
      return {
        period: item.period,
        label: formatPeriod(item.period, locale),
        collected,
        cumulative: running,
        count: toNumber(item.completed_count),
      };
    });
  }, [dailyCollections, locale]);

  const methodChartData = useMemo(
    () =>
      paymentMethods
        .map((item) => {
          const method = PAYMENT_METHODS.find((option) => option.value === item.label);
          return {
            name: method?.label ?? formatLabel(item.label),
            value: toNumber(item.completed_amount),
            count: toNumber(item.completed_count),
            color: method?.color ?? COLOR.neutral,
          };
        })
        .filter((item) => item.value > 0),
    [paymentMethods],
  );

  const domainChartData = useMemo(
    () =>
      revenueDomains
        .map((item) => ({
          domain: item.revenue_domain,
          name: formatLabel(item.revenue_domain),
          value: toNumber(item.completed_amount),
          count: toNumber(item.completed_count),
          color: DOMAIN_COLORS[item.revenue_domain] ?? COLOR.neutral,
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value),
    [revenueDomains],
  );

  const rankedUnits = useMemo(
    () =>
      administrativeUnits
        .slice()
        .sort((a, b) => toNumber(b.completed_amount) - toNumber(a.completed_amount)),
    [administrativeUnits],
  );

  const unitsTotal = rankedUnits.reduce((sum, item) => sum + toNumber(item.completed_amount), 0);
  const maxUnit = Math.max(1, ...rankedUnits.map((item) => toNumber(item.completed_amount)));
  const visibleUnits = showAllUnits ? rankedUnits : rankedUnits.slice(0, 8);

  const methodTotal = methodChartData.reduce((sum, item) => sum + item.value, 0);
  const amountFor = (name: string) =>
    methodChartData.find((item) => item.name === name)?.value ?? 0;
  const cashAmount = amountFor("Cash");
  const bankAmount = amountFor("Bank transfer");
  const onlineAmount = amountFor("Online");

  const completionRateByCount = percentOf(completedCount, totalTransactions);
  const completionRateByValue = percentOf(outcome.rows[0].amount, outcome.total);
  const digitalShare = percentOf(onlineAmount, methodTotal);

  // Plain-language findings generated from the data.
  const findings = useMemo(() => {
    const items: { icon: ReactNode; title: string; text: string }[] = [];

    const topDomain = domainChartData[0];
    if (topDomain) {
      items.push({
        icon: <Layers className="size-4" />,
        title: "Leading revenue domain",
        text: `${topDomain.name} contributed ${formatCurrency(topDomain.value, locale)}, ${formatPercent(percentOf(topDomain.value, domainChartData.reduce((s, d) => s + d.value, 0)))} of domain-attributed collections.`,
      });
    }

    const topMethod = methodChartData.slice().sort((a, b) => b.value - a.value)[0];
    if (topMethod) {
      items.push({
        icon: <CreditCard className="size-4" />,
        title: "Main payment channel",
        text: `${topMethod.name} accounts for ${formatPercent(percentOf(topMethod.value, methodTotal))} of collected value across ${formatNumber(topMethod.count, locale)} payments.`,
      });
    }

    const topUnit = rankedUnits[0];
    if (topUnit && toNumber(topUnit.completed_amount) > 0) {
      items.push({
        icon: <Building2 className="size-4" />,
        title: "Top administrative unit",
        text: `${topUnit.administrative_unit_name} collected ${formatCurrency(topUnit.completed_amount, locale)}, ${formatPercent(percentOf(toNumber(topUnit.completed_amount), unitsTotal))} of the unit total.`,
      });
    }

    const peak = collectionTrend.slice().sort((a, b) => b.collected - a.collected)[0];
    if (peak && peak.collected > 0) {
      items.push({
        icon: <TrendingUp className="size-4" />,
        title: "Peak collection period",
        text: `${peak.label} was the strongest period with ${formatCurrency(peak.collected, locale)} from ${formatNumber(peak.count, locale)} payments.`,
      });
    }

    return items;
  }, [domainChartData, methodChartData, methodTotal, rankedUnits, unitsTotal, collectionTrend, locale]);

  /* -------------------------------- actions ------------------------------- */

  const exportReport = () => {
    if (!report) return;

    const selectedCategory =
      categories.find((item) => item.id === filters.revenueCategoryId)?.name ?? "All";
    const selectedService =
      services.find((item) => item.id === filters.serviceId)?.name ?? "All";
    const selectedUnit =
      administrativeUnits.find(
        (item) => item.administrative_unit_id === filters.administrativeUnitId,
      )?.administrative_unit_name ?? "All";

    const all = (value: string) => (value === "all" ? "All" : value);

    const rows: (string | number | null | undefined)[][] = [
      ["Revenue Collection Report"],
      ["Generated at", new Date().toISOString()],
      ["Start date", filters.startDate || "All"],
      ["End date", filters.endDate || "All"],
      ["Administrative unit", selectedUnit],
      ["Revenue domain", all(filters.domain)],
      ["Revenue category", selectedCategory],
      ["Service", selectedService],
      ["Payment method", all(filters.method)],
      ["Payment provider", all(filters.provider)],
      ["Payment source", all(filters.source)],
      ["Payment status", all(filters.status)],
      [],
      ["Summary"],
      ["Metric", "Value"],
      ["Total collected (ETB)", summary?.total_collected ?? 0],
      ["Total transactions", summary?.total_transactions ?? 0],
      ["Completed payments", summary?.completed_count ?? 0],
      ["Average payment (ETB)", summary?.average_payment ?? 0],
      ["Pending amount (ETB)", summary?.pending_amount ?? 0],
      ["Pending count", summary?.pending_count ?? 0],
      ["Processing amount (ETB)", summary?.processing_amount ?? 0],
      ["Processing count", summary?.processing_count ?? 0],
      ["Failed amount (ETB)", summary?.failed_amount ?? 0],
      ["Failed count", summary?.failed_count ?? 0],
      ["Reversed amount (ETB)", summary?.reversed_amount ?? 0],
      ["Reversed count", summary?.reversed_count ?? 0],
      ["Cancelled count", summary?.cancelled_count ?? 0],
      ["Expired count", summary?.expired_count ?? 0],
      [],
      ["Collection Trend"],
      ["Period", "Completed Amount (ETB)", "Completed Count"],
      ...dailyCollections.map((i) => [i.period, i.completed_amount, i.completed_count]),
      [],
      ["Collection by Payment Method"],
      ["Method", "Completed Amount (ETB)", "Completed Count"],
      ...paymentMethods.map((i) => [i.label, i.completed_amount, i.completed_count]),
      [],
      ["Collection by Payment Source"],
      ["Source", "Completed Amount (ETB)", "Completed Count"],
      ...paymentSources.map((i) => [i.label, i.completed_amount, i.completed_count]),
      [],
      ["Collection by Revenue Domain"],
      ["Domain", "Completed Amount (ETB)", "Completed Count"],
      ...revenueDomains.map((i) => [i.revenue_domain, i.completed_amount, i.completed_count]),
      [],
      ["Administrative Unit Collections"],
      ["Administrative Unit", "Completed Amount (ETB)", "Completed Count"],
      ...administrativeUnits.map((i) => [
        i.administrative_unit_name,
        i.completed_amount,
        i.completed_count,
      ]),
    ];

    downloadCsv(
      `revenue-collection-report-${filters.startDate || "all"}-to-${filters.endDate || "all"}.csv`,
      rows,
    );
  };

  const paymentReportHref = () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.set("start_date", filters.startDate);
    if (filters.endDate) params.set("end_date", filters.endDate);
    if (filters.method !== "all") params.set("payment_method", filters.method);
    if (filters.provider !== "all") params.set("payment_provider", filters.provider);
    if (filters.source !== "all") params.set("payment_source", filters.source);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.domain !== "all") params.set("revenue_domain", filters.domain);
    if (filters.revenueCategoryId !== "all")
      params.set("revenue_category_id", filters.revenueCategoryId);
    if (filters.serviceId !== "all") params.set("service_id", filters.serviceId);
    if (filters.administrativeUnitId !== "all")
      params.set("administrative_unit_id", filters.administrativeUnitId);

    const query = params.toString();
    return `/${locale}/office/dashboard/payment-reports${query ? `?${query}` : ""}`;
  };

  /* --------------------------------- render ------------------------------- */

  return (
    <main className="min-h-screen bg-muted/30 text-foreground print:bg-white">
      {/* ------------------------------ Report header ----------------------- */}
      <header className="border-b bg-background">
        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground print:hidden">
                <FileBarChart className="size-6" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  Adama City Administration · Revenue Authority
                </p>
                <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">
                  {t("title")}
                </h1>
                <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">
                  {t("description")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button size="sm" onClick={exportReport} disabled={!report}>
                <FileSpreadsheet className="mr-2 size-4" />
                {t("export_csv")}
              </Button>
            </div>
          </div>

          {/* Period + filter toolbar */}
          <div className="mt-5 flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 text-sm font-medium">
                <CalendarDays className="size-4 text-muted-foreground" />
                <span
                  className="tabular-nums"
                  title={`${formatDate(filters.startDate, locale)} – ${formatDate(filters.endDate, locale)}`}
                >
                  {formatEthDate(filters.startDate)} – {formatEthDate(filters.endDate)}
                </span>
              </div>

              <div className="print:hidden">
                <Segmented
                  label="Reporting period"
                  value={activePreset?.key ?? ""}
                  onChange={(key) => {
                    const preset = PERIOD_PRESETS.find((p) => p.key === key);
                    if (preset) applyPreset(preset);
                  }}
                  options={PERIOD_PRESETS.map((p) => ({ value: p.key, label: p.label }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAppliedFilters}
                  className="text-muted-foreground"
                >
                  <X className="mr-1.5 size-4" />
                  Reset
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={openFilters}>
                <Filter className="mr-2 size-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {filterChips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Applied filters">
              {filterChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1 rounded-full border bg-muted/50 py-1 pl-3 pr-1.5 text-xs font-medium"
                >
                  {chip.label}
                  <button
                    type="button"
                    onClick={() => removeChip(chip.key)}
                    aria-label={`Remove filter ${chip.label}`}
                    className="rounded-full p-0.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ------------------------------ Filter sheet ------------------------ */}
      <Sheet open={filtersOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
          <SheetHeader className="border-b px-5 py-5 text-left sm:px-6">
            <div className="pr-8">
              <SheetTitle className="text-lg">Report filters</SheetTitle>
              <SheetDescription className="mt-1">
                Choose what the report covers. Nothing changes until you apply.
              </SheetDescription>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                {draftFilterCount} filters selected
              </span>
              {hasUnappliedChanges && (
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: tint(COLOR.pending, 15), color: COLOR.pending }}
                >
                  Not applied yet
                </span>
              )}
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-6">
            <FilterGroup title="Reporting period" icon={<CalendarDays className="size-4" />}>
              <div className="flex flex-wrap gap-2">
                {PERIOD_PRESETS.map((preset) => {
                  const [start, end] = preset.range();
                  const active = draftFilters.startDate === start && draftFilters.endDate === end;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setDraftFilters((c) => ({ ...c, startDate: start, endDate: end }))}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <p className="text-sm font-medium">{t("start_date")}</p>
                  <EthiopianDatePicker
                    value={startDateValue}
                    onChange={handleDateSelect("startDate")}
                    placeholder="Start date"
                    minYear={ethiopianYear - 10}
                    maxYear={ethiopianYear}
                    error={dateRangeInvalid ? " " : undefined}
                  />
                </div>
                <div className="min-w-0 space-y-2">
                  <p className="text-sm font-medium">{t("end_date")}</p>
                  <EthiopianDatePicker
                    value={endDateValue}
                    onChange={handleDateSelect("endDate")}
                    placeholder="End date"
                    minYear={ethiopianYear - 10}
                    maxYear={ethiopianYear}
                    error={dateRangeInvalid ? " " : undefined}
                  />
                </div>
              </div>

              {dateRangeInvalid && (
                <p className="text-xs text-destructive" role="alert">
                  The start date must be on or before the end date.
                </p>
              )}
            </FilterGroup>

            <div className="border-t" />

            <FilterGroup title="Revenue classification" icon={<Building2 className="size-4" />}>
              <PillGroup
                label="Revenue domain"
                value={draftFilters.domain}
                onChange={(v) => updateDraftFilter("domain", v)}
                options={REVENUE_DOMAINS.map((d) => ({ value: d.value, label: d.label }))}
              />
              <SelectField
                id="revenue-category"
                label="Revenue category"
                value={draftFilters.revenueCategoryId}
                onChange={(v) => updateDraftFilter("revenueCategoryId", v)}
                placeholder={categoriesPending ? "Loading categories…" : "All categories"}
                disabled={categoriesPending}
                options={categories.map((i) => ({ value: i.id, label: i.name }))}
              />
              <SelectField
                id="revenue-service"
                label="Service"
                value={draftFilters.serviceId}
                onChange={(v) => updateDraftFilter("serviceId", v)}
                placeholder={servicesPending ? "Loading services…" : "All services"}
                disabled={servicesPending}
                options={services.map((i) => ({ value: i.id, label: i.name }))}
              />
            </FilterGroup>

            <div className="border-t" />

            <FilterGroup title="Payment details" icon={<CreditCard className="size-4" />}>
              <PillGroup
                label={t("payment_method")}
                value={draftFilters.method}
                onChange={(v) => updateDraftFilter("method", v)}
                options={PAYMENT_METHODS.map((i) => ({ value: i.value, label: i.label }))}
                allLabel={t("all_methods")}
              />
              <PillGroup
                label="Payment provider"
                value={draftFilters.provider}
                onChange={(v) => updateDraftFilter("provider", v)}
                options={PAYMENT_PROVIDERS}
              />
              <PillGroup
                label="Payment source"
                value={draftFilters.source}
                onChange={(v) => updateDraftFilter("source", v)}
                options={PAYMENT_SOURCES}
              />
              <PillGroup
                label={t("status")}
                value={draftFilters.status}
                onChange={(v) => updateDraftFilter("status", v)}
                options={PAYMENT_STATUSES}
                allLabel={t("all_statuses")}
              />
            </FilterGroup>

            <div className="border-t" />

            <FilterGroup title="Administrative scope" icon={<Landmark className="size-4" />}>
              <SelectField
                id="administrative-unit"
                label="Administrative unit"
                value={draftFilters.administrativeUnitId}
                onChange={(v) => updateDraftFilter("administrativeUnitId", v)}
                placeholder="All administrative units"
                options={administrativeUnitOptions
                  .filter((item) => Boolean(item.administrative_unit_id))
                  .map((item) => ({
                    value: item.administrative_unit_id!,
                    label: item.administrative_unit_name,
                  }))}
              />
            </FilterGroup>
          </div>

          <SheetFooter className="border-t bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDraftFilters(getDefaultFilters())}
              className="sm:mr-auto"
            >
              <RotateCcw className="mr-2 size-4" />
              Reset all
            </Button>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => setFiltersOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={applyFilters} disabled={dateRangeInvalid}>
                <Check className="mr-2 size-4" />
                Apply filters
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ------------------------------- Content ---------------------------- */}
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {isError && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">
                  The report could not be loaded
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error instanceof Error
                    ? error.message
                    : "An unexpected error occurred. Check your connection and try again."}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {isPending && <DashboardSkeleton />}

        {report && (
          <>
            {isFetching && (
              <p className="text-xs text-muted-foreground" aria-live="polite">
                Updating report…
              </p>
            )}

            {totalTransactions === 0 && (
              <div
                className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between print:hidden"
                style={{ borderColor: tint(COLOR.pending, 45), backgroundColor: tint(COLOR.pending, 8) }}
              >
                <p className="text-sm">
                  No payments match the current filters. Widen the period or reset the filters to see collections.
                </p>
                <Button variant="outline" size="sm" onClick={clearAppliedFilters}>
                  Reset filters
                </Button>
              </div>
            )}

            {/* Headline: total collected + settlement outcome */}
            <section className="grid overflow-hidden rounded-xl border bg-card lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] print:break-inside-avoid">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CircleDollarSign className="size-4 text-primary" />
                  {t("total_collected")}
                </div>

                <p className="mt-3 break-words text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">
                  {formatCurrency(totalCollected, locale)}
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  From {formatNumber(completedCount, locale)} completed payments
                  {activePreset ? ` · ${activePreset.label.toLowerCase()}` : ""}. Pending and failed amounts are not counted as revenue.
                </p>

                {/* Settlement outcome bar */}
                <div className="mt-8">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-sm font-semibold">Where payment value ended up</h2>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatPercent(completionRateByValue)}
                      </span>{" "}
                      completed by value
                    </p>
                  </div>

                  <div
                    className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={`Payment value by outcome: ${outcome.rows
                      .map((r) => `${r.label} ${formatPercent(percentOf(r.amount, outcome.total))}`)
                      .join(", ")}`}
                  >
                    {outcome.rows.map((row) => {
                      const width = percentOf(row.amount, outcome.total);
                      if (width <= 0) return null;
                      return (
                        <div
                          key={row.key}
                          style={{ width: `${width}%`, backgroundColor: row.color }}
                          className="h-full border-r border-background last:border-r-0"
                          title={`${row.label}: ${formatCurrency(row.amount, locale)}`}
                        />
                      );
                    })}
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 xl:grid-cols-5">
                    {outcome.rows.map((row) => (
                      <div key={row.key} className="min-w-0">
                        <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span
                            className="size-2.5 shrink-0 rounded-sm"
                            style={{ backgroundColor: row.color }}
                          />
                          {row.label}
                        </dt>
                        <dd className="mt-1 truncate text-sm font-semibold tabular-nums">
                          {formatCompact(row.amount)} ETB
                        </dd>
                        <dd className="text-xs text-muted-foreground tabular-nums">
                          {formatNumber(row.count, locale)} payments
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <dl className="divide-y border-t bg-muted/20 lg:border-l lg:border-t-0">
                {[
                  {
                    icon: <Activity className="size-4" />,
                    label: "Matching payments",
                    value: formatNumber(totalTransactions, locale),
                    note: "All statuses in this view",
                  },
                  {
                    icon: <CheckCircle2 className="size-4" />,
                    label: t("completed_transactions"),
                    value: formatNumber(completedCount, locale),
                    note: `${formatPercent(completionRateByCount)} of matching payments`,
                  },
                  {
                    icon: <Wallet className="size-4" />,
                    label: t("average_collection"),
                    value: formatCurrency(averagePayment, locale),
                    note: "Per completed payment",
                  },
                  {
                    icon: <Smartphone className="size-4" />,
                    label: "Digital share",
                    value: formatPercent(digitalShare),
                    note: "Online payments, by value",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 px-6 py-4">
                    <div className="mt-0.5 text-muted-foreground">{item.icon}</div>
                    <div className="min-w-0">
                      <dt className="text-sm text-muted-foreground">{item.label}</dt>
                      <dd className="mt-0.5 break-words text-xl font-semibold tabular-nums">
                        {item.value}
                      </dd>
                      <dd className="text-xs text-muted-foreground">{item.note}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </section>

            {/* Channel strip */}
            <section
              aria-label="Collection by channel"
              className="grid divide-y overflow-hidden rounded-xl border bg-card sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x print:break-inside-avoid"
            >
              {[
                { icon: <Banknote className="size-5" />, label: "Cash", amount: cashAmount, color: "var(--chart-4)" },
                { icon: <Landmark className="size-5" />, label: "Bank transfer", amount: bankAmount, color: "var(--chart-2)" },
                { icon: <Smartphone className="size-5" />, label: "Online", amount: onlineAmount, color: "var(--chart-3)" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4 p-5">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: tint(item.color, 14), color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="break-words text-lg font-semibold tabular-nums">
                      {formatCurrency(item.amount, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatPercent(percentOf(item.amount, methodTotal))} of collected
                    </p>
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-4 p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Needs follow-up</p>
                  <p className="break-words text-lg font-semibold tabular-nums">
                    {formatCurrency(
                      toNumber(summary?.pending_amount) + toNumber(summary?.failed_amount),
                      locale,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatNumber(
                      toNumber(summary?.pending_count) + toNumber(summary?.failed_count),
                      locale,
                    )}{" "}
                    pending or failed
                  </p>
                </div>
              </div>
            </section>

            {/* Key findings */}
            {findings.length > 0 && (
              <section
                aria-label="Key findings"
                className="grid divide-y overflow-hidden rounded-xl border bg-card md:grid-cols-2 md:divide-y-0 xl:grid-cols-4 xl:divide-x print:break-inside-avoid"
              >
                {findings.map((item) => (
                  <div key={item.title} className="p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className="text-primary">{item.icon}</span>
                      {item.title}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                ))}
              </section>
            )}

            {/* Trend + method */}
            <div className="grid gap-6 xl:grid-cols-3">
              <Panel
                className="xl:col-span-2"
                title={t("collection_trend")}
                description="Completed collections per period. Periods group by day or month depending on the date range."
                action={
                  <Segmented
                    label="Trend view"
                    value={trendView}
                    onChange={(v) => setTrendView(v as "daily" | "cumulative")}
                    options={[
                      { value: "daily", label: "Per period" },
                      { value: "cumulative", label: "Running total" },
                    ]}
                  />
                }
              >
                {collectionTrend.length === 0 ? (
                  <EmptyState message={t("no_chart_data")} height={300} />
                ) : (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={collectionTrend}
                        margin={{ top: 10, right: 8, left: 8, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="runningFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" style={{ stopColor: COLOR.collected, stopOpacity: 0.28 }} />
                            <stop offset="100%" style={{ stopColor: COLOR.collected, stopOpacity: 0.02 }} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} minTickGap={24} />
                        <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} width={55} tick={AXIS_TICK} />
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value ?? 0), locale)}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.period ?? ""}
                          contentStyle={TOOLTIP_STYLE}
                        />

                        {trendView === "daily" ? (
                          <Bar dataKey="collected" name="Collected" fill={COLOR.collected} radius={[4, 4, 0, 0]} maxBarSize={40} />
                        ) : (
                          <Area
                            type="monotone"
                            dataKey="cumulative"
                            name="Running total"
                            stroke={COLOR.collected}
                            strokeWidth={2}
                            fill="url(#runningFill)"
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Panel>

              <Panel title={t("collection_by_method")} description="Completed revenue by payment method.">
                {methodChartData.length === 0 ? (
                  <EmptyState message={t("no_chart_data")} height={300} />
                ) : (
                  <>
                    <div className="relative h-[210px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={methodChartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={62}
                            outerRadius={90}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {methodChartData.map((item) => (
                              <Cell key={item.name} fill={item.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => formatCurrency(Number(value ?? 0), locale)}
                            contentStyle={TOOLTIP_STYLE}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs text-muted-foreground">Collected</span>
                        <span className="text-lg font-bold tabular-nums">
                          {formatCompact(methodTotal)}
                        </span>
                      </div>
                    </div>

                    <ul className="mt-4 divide-y">
                      {methodChartData.map((item) => (
                        <li key={item.name} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                            <span className="truncate">{item.name}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {formatPercent(percentOf(item.value, methodTotal))}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold tabular-nums">{formatCurrency(item.value, locale)}</p>
                            <p className="text-xs text-muted-foreground tabular-nums">
                              {formatNumber(item.count, locale)} completed
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Panel>
            </div>

            {/* Domain + administrative units */}
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Collection by revenue domain" description="Completed collections grouped by revenue domain.">
                {domainChartData.length === 0 ? (
                  <EmptyState message={t("no_chart_data")} height={280} />
                ) : (
                  <div style={{ height: Math.max(220, domainChartData.length * 48) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={domainChartData}
                        layout="vertical"
                        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                        <XAxis type="number" tickFormatter={formatCompact} tickLine={false} axisLine={false} tick={AXIS_TICK} />
                        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={90} tick={AXIS_TICK} />
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value ?? 0), locale)}
                          contentStyle={TOOLTIP_STYLE}
                        />
                        <Bar dataKey="value" name="Collected" radius={[0, 4, 4, 0]} maxBarSize={28}>
                          {domainChartData.map((item) => (
                            <Cell key={item.domain} fill={item.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  Invoices that span several revenue domains may be left out of this breakdown when the
                  payment cannot be safely split between domains.
                </p>
              </Panel>

              <Panel
                title="Administrative unit collections"
                description="Actual completed collections, ranked. No targets or estimates are shown."
                action={
                  rankedUnits.length > 8 ? (
                    <Button variant="ghost" size="sm" onClick={() => setShowAllUnits((v) => !v)}>
                      {showAllUnits ? "Show top 8" : `Show all ${rankedUnits.length}`}
                    </Button>
                  ) : undefined
                }
              >
                {rankedUnits.length === 0 ? (
                  <EmptyState message="No administrative-unit data for these filters." height={280} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th scope="col" className="w-8 pb-2 font-medium">#</th>
                          <th scope="col" className="pb-2 font-medium">Administrative unit</th>
                          <th scope="col" className="pb-2 text-right font-medium">Payments</th>
                          <th scope="col" className="pb-2 text-right font-medium">Collected</th>
                          <th scope="col" className="w-16 pb-2 text-right font-medium">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleUnits.map((item, index) => {
                          const collected = toNumber(item.completed_amount);
                          const width = (collected / maxUnit) * 100;
                          return (
                            <tr
                              key={item.administrative_unit_id ?? item.administrative_unit_name}
                              className="border-b last:border-0"
                            >
                              <td className="py-3 text-xs text-muted-foreground tabular-nums">{index + 1}</td>
                              <td className="py-3 pr-4">
                                <p className="truncate font-medium">{item.administrative_unit_name}</p>
                                <div
                                  className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                                  role="progressbar"
                                  aria-label={`${item.administrative_unit_name} relative to top unit`}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  aria-valuenow={Math.round(width)}
                                >
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.min(100, Math.max(0, width))}%`,
                                      backgroundColor: COLOR.collected,
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="py-3 text-right tabular-nums text-muted-foreground">
                                {formatNumber(item.completed_count, locale)}
                              </td>
                              <td className="py-3 text-right font-semibold tabular-nums">
                                {formatCurrency(collected, locale)}
                              </td>
                              <td className="py-3 text-right tabular-nums text-muted-foreground">
                                {formatPercent(percentOf(collected, unitsTotal))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </div>

            {/* Source + status reconciliation */}
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Collection by payment source" description="How completed payments entered the system.">
                {paymentSources.length === 0 ? (
                  <EmptyState message="No payment-source data for these filters." height={200} />
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th scope="col" className="pb-2 font-medium">Source</th>
                        <th scope="col" className="pb-2 text-right font-medium">Payments</th>
                        <th scope="col" className="pb-2 text-right font-medium">Collected</th>
                        <th scope="col" className="w-16 pb-2 text-right font-medium">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentSources.map((item) => (
                        <tr key={item.label} className="border-b last:border-0">
                          <td className="py-3 font-medium">{formatLabel(item.label)}</td>
                          <td className="py-3 text-right tabular-nums text-muted-foreground">
                            {formatNumber(item.completed_count, locale)}
                          </td>
                          <td className="py-3 text-right font-semibold tabular-nums">
                            {formatCurrency(item.completed_amount, locale)}
                          </td>
                          <td className="py-3 text-right tabular-nums text-muted-foreground">
                            {formatPercent(percentOf(toNumber(item.completed_amount), totalCollected))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Panel>

              <Panel title="Payment status reconciliation" description="Non-completed amounts are kept apart from collected revenue.">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th scope="col" className="pb-2 font-medium">Status</th>
                      <th scope="col" className="pb-2 text-right font-medium">Payments</th>
                      <th scope="col" className="pb-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outcome.rows.map((row) => (
                      <tr key={row.key} className="border-b last:border-0">
                        <td className="py-3">
                          <span className="inline-flex items-center gap-2 font-medium">
                            <span className="size-2.5 rounded-sm" style={{ backgroundColor: row.color }} />
                            {row.label}
                          </span>
                        </td>
                        <td className="py-3 text-right tabular-nums text-muted-foreground">
                          {formatNumber(row.count, locale)}
                        </td>
                        <td className="py-3 text-right font-semibold tabular-nums">
                          {formatCurrency(row.amount, locale)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-b">
                      <td className="py-3 font-medium text-muted-foreground">Cancelled</td>
                      <td className="py-3 text-right tabular-nums text-muted-foreground">
                        {formatNumber(summary?.cancelled_count, locale)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">—</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium text-muted-foreground">Expired</td>
                      <td className="py-3 text-right tabular-nums text-muted-foreground">
                        {formatNumber(summary?.expired_count, locale)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">—</td>
                    </tr>
                  </tbody>
                </table>
              </Panel>
            </div>

            {/* Footer */}
            <footer className="flex flex-col gap-3 border-t pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl leading-relaxed">
                Summary figures from the revenue system. Individual payment transactions are not listed here.
                Generated {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date())}.
              </p>

              <a
                href={paymentReportHref()}
                className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline print:hidden"
              >
                Open payment report
                <ExternalLink className="size-3.5" />
              </a>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}