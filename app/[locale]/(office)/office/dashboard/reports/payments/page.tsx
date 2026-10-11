"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Eye,
  Filter,
  Landmark,
  Loader2,
  Printer,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldAlert,
  Smartphone,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { gregorianToEth } from "@/utils/ethiopianCalendar";
import { formatEthiopianDate } from "@/lib/utils";

import { useRevenueCategories } from "@/hooks/revenue/revenueCategory.hook";
import { useRevenueServices } from "@/hooks/revenue/revenueService.hook";
import {
  usePaymentReports,
  usePaymentReportSummary,
} from "@/hooks/report/use-payment-reports";
import type {
  PaymentMethod,
  PaymentReport,
  PaymentReportFilters,
  PaymentStatus,
} from "@/types/report/payment-report";
import { useAdminUnits } from "@/hooks/useAdminUnit.hook";
import { EthiopianDatePicker } from "@/components/input/EthiopianDatePicker";

/* -------------------------------------------------------------------------- */
/* Types and constants                                                        */
/* -------------------------------------------------------------------------- */

type PaymentProvider = "CASH" | "CBE" | "TELEBIRR" | "CHAPA" | string;
type StatusFilter = "ALL" | PaymentStatus;
type MethodFilter = "ALL" | PaymentMethod;

type ListFilters = {
  method: MethodFilter;
  status: StatusFilter;
  startDate: string;
  endDate: string;
  categoryId: string;
  serviceId: string;
  unitId: string;
};

type Choice = { value: string; label: string };
type Option = { id: string; name: string };

type PaymentListFilters = PaymentReportFilters & {
  revenue_category_id?: string;
  service_id?: string;
  administrative_unit_id?: string;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const PAYMENT_METHODS: Choice[] = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "ONLINE", label: "Online payment" },
];

const PAYMENT_STATUSES: Choice[] = [
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REVERSED", label: "Reversed" },
];

const COLOR = {
  collected: "var(--success, var(--chart-1))",
  pending: "var(--warning, var(--chart-4))",
  processing: "var(--info, var(--chart-2))",
  failed: "var(--destructive)",
  reversed: "var(--chart-5)",
  neutral: "var(--muted-foreground)",
};

const tint = (color: string, percent = 12) =>
  `color-mix(in oklab, ${color} ${percent}%, transparent)`;

const EMPTY_FILTERS: ListFilters = {
  method: "ALL",
  status: "ALL",
  startDate: "",
  endDate: "",
  categoryId: "",
  serviceId: "",
  unitId: "",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toIso(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatEthDate(iso: string): string {
  const date = isoToDate(iso);
  return date ? formatEthiopianDate(date.toDateString()) : "Any date";
}

const PERIOD_PRESETS: {
  key: string;
  label: string;
  range: () => [string, string];
}[] = [
  {
    key: "today",
    label: "Today",
    range: () => {
      const now = new Date();
      return [toIso(now), toIso(now)];
    },
  },
  {
    key: "7d",
    label: "Last 7 days",
    range: () => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return [toIso(start), toIso(now)];
    },
  },
  {
    key: "month",
    label: "This month",
    range: () => {
      const now = new Date();
      return [toIso(new Date(now.getFullYear(), now.getMonth(), 1)), toIso(now)];
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

function formatCurrency(amount: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTime(value: string | null | undefined, locale: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getMethodLabel(method: string | null) {
  switch (method) {
    case "CASH":
      return "Cash";
    case "BANK_TRANSFER":
      return "Bank transfer";
    case "ONLINE":
      return "Online payment";
    default:
      return method || "Not specified";
  }
}

function getProviderLabel(provider: PaymentProvider | null) {
  switch (provider) {
    case "CASH":
      return "Cash";
    case "CBE":
      return "Commercial Bank of Ethiopia";
    case "TELEBIRR":
      return "Telebirr";
    case "CHAPA":
      return "Chapa";
    default:
      return provider || "Not specified";
  }
}

function getSourceLabel(source: string | null) {
  switch (source) {
    case "ASSESSMENT":
      return "Assessment / invoice";
    case "DIRECT_COLLECTION":
      return "Direct collection";
    case "OFFICE_RECORDED":
      return "Office-recorded payment";
    default:
      return source || "—";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "COMPLETED":
      return COLOR.collected;
    case "PENDING":
      return COLOR.pending;
    case "PROCESSING":
      return COLOR.processing;
    case "FAILED":
      return COLOR.failed;
    case "REVERSED":
      return COLOR.reversed;
    case "EXPIRED":
      return "var(--chart-3)";
    default:
      return COLOR.neutral;
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 className="size-3.5" />;
    case "PENDING":
      return <Clock3 className="size-3.5" />;
    case "PROCESSING":
      return <Loader2 className="size-3.5" />;
    case "FAILED":
      return <XCircle className="size-3.5" />;
    case "CANCELLED":
      return <X className="size-3.5" />;
    case "EXPIRED":
    case "REVERSED":
      return <ShieldAlert className="size-3.5" />;
    default:
      return <Clock3 className="size-3.5" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const color = getStatusColor(status);

  return (
    <Badge
      variant="outline"
      className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium"
      style={{
        color,
        backgroundColor: tint(color, 12),
        borderColor: tint(color, 35),
      }}
    >
      <StatusIcon status={status} />
      {formatStatus(status)}
    </Badge>
  );
}

function MethodIcon({ method }: { method: string | null }) {
  switch (method) {
    case "CASH":
      return <Banknote className="size-4" />;
    case "BANK_TRANSFER":
      return <Landmark className="size-4" />;
    case "ONLINE":
      return <Smartphone className="size-4" />;
    default:
      return <CreditCard className="size-4" />;
  }
}

function getVerificationColor(status: string | null | undefined): string {
  switch (status) {
    case "VERIFIED":
      return COLOR.collected;
    case "REJECTED":
      return COLOR.failed;
    case "PENDING":
    case "PENDING_VERIFICATION":
      return COLOR.pending;
    default:
      return COLOR.neutral;
  }
}

function VerificationBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  if (!status) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const color = getVerificationColor(status);

  return (
    <Badge
      variant="outline"
      className="whitespace-nowrap"
      style={{
        color,
        backgroundColor: tint(color, 12),
        borderColor: tint(color, 35),
      }}
    >
      {formatStatus(status)}
    </Badge>
  );
}

/**
 * Adapt the actual API response to fields used by the page.
 *
 * The API supplies:
 * - taxpayer.name, taxpayer.national_id, taxpayer.citizen_uid
 * - bank_transfer_details.bank_account
 * - processed_by and verified_by
 *
 * It does not currently supply a reliable receipt number or completion time.
 */
function getPaymentDisplay(payment: PaymentReport) {
  const bankTransfer = payment.bank_transfer_details;
  const bankAccount = bankTransfer?.bank_account;

  return {
    id: String(payment.id),
    paymentNumber: payment.payment_reference || String(payment.id),
    receiptNumber: payment.receipt_number ?? null,
    invoiceNumber: payment.invoice_reference || "—",

    taxpayer: payment.taxpayer ?? null,

    amount: Number(payment.amount ?? 0),
    currency: payment.currency || "ETB",
    status: String(payment.status || "PENDING"),

    method: payment.payment_method,
    provider: payment.payment_provider,
    source: payment.payment_source,

    transactionReference: payment.transaction_reference,

    bankTransfer,
    bankAccount,

    processedBy: payment.processed_by?.name ?? null,
    verifiedBy: payment.verified_by?.name ?? null,
    verifiedAt: payment.verified_at ?? null,

    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  return "An unexpected error occurred while loading payment reports.";
}

const isIsoDate = (value: string | null): value is string =>
  Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

/* -------------------------------------------------------------------------- */
/* Small building blocks                                                      */
/* -------------------------------------------------------------------------- */

function PillGroup({
  label,
  value,
  onChange,
  options,
  allValue,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Choice[];
  allValue: string;
  allLabel: string;
}) {
  const items: Choice[] = [{ value: allValue, label: allLabel }, ...options];

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
        value={value || "all"}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value === "all" ? "" : event.target.value)
        }
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  note,
  color,
  loading,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-start gap-4 p-5">
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: tint(color, 14), color }}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <dt className="text-sm text-muted-foreground">{label}</dt>

        <dd className="mt-0.5 break-words text-xl font-semibold tabular-nums">
          {loading ? (
            <span className="inline-block h-6 w-24 animate-pulse rounded bg-muted" />
          ) : (
            value
          )}
        </dd>

        <dd className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {loading ? "Loading…" : note}
        </dd>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function PaymentsPage() {
  return (
    <Suspense fallback={null}>
      <PaymentsContent />
    </Suspense>
  );
}

function PaymentsContent() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialFilters = useMemo<ListFilters>(() => {
    const method = searchParams.get("payment_method");
    const status = searchParams.get("status");
    const start = searchParams.get("start_date");
    const end = searchParams.get("end_date");
    const category = searchParams.get("revenue_category_id");
    const service = searchParams.get("service_id");
    const unit = searchParams.get("administrative_unit_id");

    return {
      method: PAYMENT_METHODS.some((item) => item.value === method)
        ? (method as MethodFilter)
        : "ALL",
      status: PAYMENT_STATUSES.some((item) => item.value === status)
        ? (status as StatusFilter)
        : "ALL",
      startDate: isIsoDate(start) ? start : "",
      endDate: isIsoDate(end) ? end : "",
      categoryId: category ?? "",
      serviceId: service ?? "",
      unitId: unit ?? "",
    };
    // Read deep-link filters only when the page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [filters, setFilters] = useState<ListFilters>(initialFilters);
  const [draft, setDraft] = useState<ListFilters>(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [selectedPayment, setSelectedPayment] = useState<PaymentReport | null>(null);

  /* --------------------------- Classification lookups -------------------- */

  const {
    data: categoriesResponse,
    isPending: categoriesPending,
  } = useRevenueCategories();

  const {
    data: servicesResponse,
    isPending: servicesPending,
  } = useRevenueServices();

  const {
    data: unitsResponse,
    isPending: unitsPending,
  } = useAdminUnits();

  const toOptions = (items: { id: unknown; name?: unknown }[]): Option[] =>
    items
      .map((item) => ({
        id: String(item.id),
        name: String(item.name ?? ""),
      }))
      .filter((item) => item.id && item.name)
      .sort((a, b) => a.name.localeCompare(b.name));

  const categories = useMemo(
    () => toOptions(categoriesResponse?.data ?? []),
    [categoriesResponse],
  );

  const services = useMemo(
    () => toOptions(servicesResponse?.data ?? []),
    [servicesResponse],
  );

  const units = useMemo(() => {
    const options = toOptions(unitsResponse?.data ?? []);

    if (
      initialFilters.unitId &&
      !options.some((option) => option.id === initialFilters.unitId)
    ) {
      options.push({
        id: initialFilters.unitId,
        name: "Selected administrative unit",
      });
    }

    return options;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitsResponse, initialFilters.unitId]);

  /* -------------------------------- Search -------------------------------- */

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  /* ------------------------------ API filters ---------------------------- */

  const reportFilters = useMemo<PaymentListFilters>(
    () => ({
      ...(search ? { search } : {}),
      ...(filters.method !== "ALL"
        ? { payment_method: filters.method }
        : {}),
      ...(filters.status !== "ALL" ? { status: filters.status } : {}),
      ...(filters.startDate ? { start_date: filters.startDate } : {}),
      ...(filters.endDate ? { end_date: filters.endDate } : {}),
      ...(filters.categoryId
        ? { revenue_category_id: filters.categoryId }
        : {}),
      ...(filters.serviceId ? { service_id: filters.serviceId } : {}),
      ...(filters.unitId
        ? { administrative_unit_id: filters.unitId }
        : {}),
      page,
      per_page: pageSize,
      sort_by: "created_at",
      sort_direction: "desc",
    }),
    [search, filters, page, pageSize],
  );

  const summaryFilters = useMemo<PaymentListFilters>(
    () => ({
      ...(filters.method !== "ALL"
        ? { payment_method: filters.method }
        : {}),
      ...(filters.startDate ? { start_date: filters.startDate } : {}),
      ...(filters.endDate ? { end_date: filters.endDate } : {}),
      ...(filters.categoryId
        ? { revenue_category_id: filters.categoryId }
        : {}),
      ...(filters.serviceId ? { service_id: filters.serviceId } : {}),
      ...(filters.unitId
        ? { administrative_unit_id: filters.unitId }
        : {}),
    }),
    [
      filters.method,
      filters.startDate,
      filters.endDate,
      filters.categoryId,
      filters.serviceId,
      filters.unitId,
    ],
  );

  const {
    data: reportResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = usePaymentReports(reportFilters);

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
  } = usePaymentReportSummary(summaryFilters);

  const payments = reportResponse?.data ?? [];
  const pagination = reportResponse?.meta;

  const totalRecords = pagination?.total ?? 0;
  const currentPage = pagination?.current_page ?? page;
  const totalPages = Math.max(pagination?.last_page ?? 1, 1);
  const from = pagination?.from ?? 0;
  const to = pagination?.to ?? 0;

  const selectedDisplay = selectedPayment
    ? getPaymentDisplay(selectedPayment)
    : null;

  /* ----------------------------- Filter state ---------------------------- */

  const countActive = (values: ListFilters) =>
    [
      values.method !== "ALL",
      values.status !== "ALL",
      Boolean(values.startDate),
      Boolean(values.endDate),
      Boolean(values.categoryId),
      Boolean(values.serviceId),
      Boolean(values.unitId),
    ].filter(Boolean).length;

  const activeFilterCount = countActive(filters);
  const draftFilterCount = countActive(draft);

  const hasUnappliedChanges =
    JSON.stringify(filters) !== JSON.stringify(draft);

  const hasAnyFilter = activeFilterCount > 0 || Boolean(search);

  const dateRangeInvalid =
    Boolean(draft.startDate) &&
    Boolean(draft.endDate) &&
    draft.startDate > draft.endDate;

  const startDateValue = useMemo(
    () => isoToDate(draft.startDate),
    [draft.startDate],
  );

  const endDateValue = useMemo(
    () => isoToDate(draft.endDate),
    [draft.endDate],
  );

  const ethiopianYear = useMemo(
    () => gregorianToEth(new Date()).year,
    [],
  );

  const chips = useMemo(() => {
    const items: { key: keyof ListFilters; label: string }[] = [];

    if (filters.method !== "ALL") {
      items.push({
        key: "method",
        label: `Method: ${getMethodLabel(filters.method)}`,
      });
    }

    if (filters.status !== "ALL") {
      items.push({
        key: "status",
        label: `Status: ${formatStatus(filters.status)}`,
      });
    }

    if (filters.startDate) {
      items.push({
        key: "startDate",
        label: `From: ${formatEthDate(filters.startDate)}`,
      });
    }

    if (filters.endDate) {
      items.push({
        key: "endDate",
        label: `To: ${formatEthDate(filters.endDate)}`,
      });
    }

    const nameOf = (list: Option[], id: string) =>
      list.find((item) => item.id === id)?.name ?? "Selected";

    if (filters.categoryId) {
      items.push({
        key: "categoryId",
        label: `Category: ${nameOf(categories, filters.categoryId)}`,
      });
    }

    if (filters.serviceId) {
      items.push({
        key: "serviceId",
        label: `Service: ${nameOf(services, filters.serviceId)}`,
      });
    }

    if (filters.unitId) {
      items.push({
        key: "unitId",
        label: `Unit: ${nameOf(units, filters.unitId)}`,
      });
    }

    return items;
  }, [filters, categories, services, units]);

  const openFilters = () => {
    setDraft({ ...filters });
    setFiltersOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (open) setDraft({ ...filters });
    setFiltersOpen(open);
  };

  const applyFilters = () => {
    if (dateRangeInvalid) return;

    setFilters({ ...draft });
    setPage(1);
    setFiltersOpen(false);
  };

  const removeChip = (key: keyof ListFilters) => {
    setFilters((current) => ({
      ...current,
      [key]: EMPTY_FILTERS[key],
    }));
    setPage(1);
  };

  const resetAll = () => {
    setFilters(EMPTY_FILTERS);
    setDraft(EMPTY_FILTERS);
    setSearchInput("");
    setSearch("");
    setPage(1);
    setFiltersOpen(false);
  };

  const periodLabel =
    filters.startDate || filters.endDate
      ? `${formatEthDate(filters.startDate)} – ${formatEthDate(filters.endDate)}`
      : "All dates";

  /* -------------------------------- Export -------------------------------- */

  const handleExportCsv = () => {
    if (payments.length === 0) {
      toast.info("There are no payment records on this page to export.");
      return;
    }

    const headers = [
      "Payment ID",
      "Payment Reference",
      "Receipt Number",
      "Invoice Reference",
      "Citizen UID",
      "Citizen Name",
      "National ID",
      "Citizen Phone",
      "Citizen Email",
      "Amount",
      "Currency",
      "Status",
      "Payment Method",
      "Payment Provider",
      "Payment Source",
      "Transaction Reference",
      "Bank Name",
      "Bank Account Name",
      "Masked Bank Account Number",
      "Transfer Reference",
      "Transfer Date",
      "Transfer Verification Status",
      "Processed By",
      "Verified By",
      "Verified At",
      "Created At",
      "Updated At",
    ];

    const escapeCsv = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = payments.map((payment) => {
      const display = getPaymentDisplay(payment);

      return [
        display.id,
        display.paymentNumber,
        display.receiptNumber,
        display.invoiceNumber,
        display.taxpayer?.citizen_uid,
        display.taxpayer?.name,
        display.taxpayer?.national_id,
        display.taxpayer?.phone,
        display.taxpayer?.email,
        display.amount,
        display.currency,
        display.status,
        display.method,
        display.provider,
        display.source,
        display.transactionReference,
        display.bankAccount?.bank_name,
        display.bankAccount?.account_name,
        display.bankAccount?.account_number,
        display.bankTransfer?.transfer_reference,
        display.bankTransfer?.transfer_date,
        display.bankTransfer?.verification_status,
        display.processedBy,
        display.verifiedBy,
        display.verifiedAt,
        display.createdAt,
        display.updatedAt,
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `municipal-payments-page-${currentPage}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast.success("Current page exported successfully.");
  };

  /* -------------------------------- Render -------------------------------- */

  return (
    <main className="min-h-screen bg-muted/30 text-foreground [-webkit-print-color-adjust:exact] [print-color-adjust:exact] print:bg-white">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-2 text-sm text-muted-foreground print:hidden"
              >
                <Link
                  href={`/${locale}/office/dashboard/reports`}
                  className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                  Reports
                </Link>

                <span aria-hidden>/</span>
                <span className="text-foreground">Payments</span>
              </nav>

              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Payments management
              </h1>

              <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">
                Review payment records, monitor payment status, and track cash,
                bank transfers and digital payments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCcw
                  className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                disabled={isLoading || payments.length === 0}
              >
                <Printer className="mr-2 size-4" />
                Print report
              </Button>

              <Button
                size="sm"
                onClick={handleExportCsv}
                disabled={isLoading || payments.length === 0}
              >
                <ArrowDownToLine className="mr-2 size-4" />
                Export current page
              </Button>
            </div>
          </div>

          {/* Search and filters */}
          <div className="mt-5 flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="size-4 text-muted-foreground" />
              <span className="tabular-nums">{periodLabel}</span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center print:hidden">
              <div className="relative sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search payment reference or ID"
                  aria-label="Search payments"
                  className="h-9 pl-9 pr-8"
                />

                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {hasAnyFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetAll}
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
          </div>

          {(chips.length > 0 || search) && (
            <div
              className="mt-3 flex flex-wrap items-center gap-2"
              aria-label="Applied filters"
            >
              {search && (
                <span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 py-1 pl-3 pr-1.5 text-xs font-medium">
                  Search: {search}

                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    aria-label="Clear search filter"
                    className="rounded-full p-0.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}

              {chips.map((chip) => (
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

      {/* Filter sheet */}
      <Sheet open={filtersOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
        >
          <SheetHeader className="border-b px-5 py-5 text-left sm:px-6">
            <div className="pr-8">
              <SheetTitle className="text-lg">Payment filters</SheetTitle>
              <SheetDescription className="mt-1">
                Choose which payments to list. Nothing changes until you apply.
              </SheetDescription>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                {draftFilterCount} filters selected
              </span>

              {hasUnappliedChanges && (
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: tint(COLOR.pending, 15),
                    color: COLOR.pending,
                  }}
                >
                  Not applied yet
                </span>
              )}
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-6">
            <FilterGroup
              title="Payment period"
              icon={<CalendarDays className="size-4" />}
            >
              <div className="flex flex-wrap gap-2">
                {PERIOD_PRESETS.map((preset) => {
                  const [start, end] = preset.range();
                  const active =
                    draft.startDate === start && draft.endDate === end;

                  return (
                    <button
                      key={preset.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          startDate: start,
                          endDate: end,
                        }))
                      }
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
                  <p className="text-sm font-medium">Start date</p>

                  <EthiopianDatePicker
                    value={startDateValue}
                    onChange={(date) =>
                      setDraft((current) => ({
                        ...current,
                        startDate: toIso(date),
                      }))
                    }
                    placeholder="Start date"
                    minYear={ethiopianYear - 10}
                    maxYear={ethiopianYear}
                  />
                </div>

                <div className="min-w-0 space-y-2">
                  <p className="text-sm font-medium">End date</p>

                  <EthiopianDatePicker
                    value={endDateValue}
                    onChange={(date) =>
                      setDraft((current) => ({
                        ...current,
                        endDate: toIso(date),
                      }))
                    }
                    placeholder="End date"
                    minYear={ethiopianYear - 10}
                    maxYear={ethiopianYear}
                  />
                </div>
              </div>

              {(draft.startDate || draft.endDate) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit text-muted-foreground"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      startDate: "",
                      endDate: "",
                    }))
                  }
                >
                  <X className="mr-1.5 size-4" />
                  Clear dates
                </Button>
              )}

              {dateRangeInvalid && (
                <p className="text-xs text-destructive" role="alert">
                  The start date must be on or before the end date.
                </p>
              )}
            </FilterGroup>

            <div className="border-t" />

            <FilterGroup
              title="Revenue classification"
              icon={<Building2 className="size-4" />}
            >
              <SelectField
                id="revenue-category"
                label="Revenue category"
                value={draft.categoryId}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, categoryId: value }))
                }
                placeholder={
                  categoriesPending ? "Loading categories…" : "All categories"
                }
                disabled={categoriesPending}
                options={categories.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
              />

              <SelectField
                id="revenue-service"
                label="Service"
                value={draft.serviceId}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, serviceId: value }))
                }
                placeholder={
                  servicesPending ? "Loading services…" : "All services"
                }
                disabled={servicesPending}
                options={services.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
              />
            </FilterGroup>

            <div className="border-t" />

            <FilterGroup
              title="Payment details"
              icon={<CreditCard className="size-4" />}
            >
              <PillGroup
                label="Payment method"
                value={draft.method}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    method: value as MethodFilter,
                  }))
                }
                options={PAYMENT_METHODS}
                allValue="ALL"
                allLabel="All methods"
              />

              <PillGroup
                label="Payment status"
                value={draft.status}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    status: value as StatusFilter,
                  }))
                }
                options={PAYMENT_STATUSES}
                allValue="ALL"
                allLabel="All statuses"
              />

              <p className="text-xs leading-relaxed text-muted-foreground">
                Summary figures ignore status and search. Period, method and
                classification filters apply to both summary and records.
              </p>
            </FilterGroup>

            <div className="border-t" />

            <FilterGroup
              title="Administrative scope"
              icon={<Landmark className="size-4" />}
            >
              <SelectField
                id="administrative-unit"
                label="Administrative unit"
                value={draft.unitId}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, unitId: value }))
                }
                placeholder={
                  unitsPending
                    ? "Loading administrative units…"
                    : "All administrative units"
                }
                disabled={unitsPending}
                options={units.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
              />
            </FilterGroup>
          </div>

          <SheetFooter className="border-t bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDraft(EMPTY_FILTERS)}
              className="sm:mr-auto"
            >
              <RotateCcw className="mr-2 size-4" />
              Reset all
            </Button>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFiltersOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={applyFilters}
                disabled={dateRangeInvalid}
              >
                <Check className="mr-2 size-4" />
                Apply filters
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {isError && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-card p-5 sm:flex-row sm:items-center sm:justify-between print:hidden"
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-destructive" />

              <div>
                <p className="font-semibold text-destructive">
                  Payment records could not be loaded
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {getErrorMessage(error)}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Check your connection and permissions. If the problem
                  continues, check the API endpoint and Laravel logs.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 size-4" />
              )}
              Try again
            </Button>
          </div>
        )}

        {/* Summary */}
        <section
          aria-label="Payment summary"
          className="grid divide-y overflow-hidden rounded-xl border bg-card sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 xl:divide-x print:break-inside-avoid"
        >
          <Stat
            icon={<CheckCircle2 className="size-5" />}
            label="Completed payments"
            value={(summary?.completed_count ?? 0).toLocaleString(locale)}
            note="Successfully completed records"
            color={COLOR.collected}
            loading={isSummaryLoading}
          />

          <Stat
            icon={<CircleDollarSign className="size-5" />}
            label="Amount collected"
            value={formatCurrency(
              Number(summary?.completed_amount ?? 0),
              locale,
            )}
            note="Completed payments only"
            color={COLOR.processing}
            loading={isSummaryLoading}
          />

          <Stat
            icon={<Clock3 className="size-5" />}
            label="Pending payments"
            value={(summary?.pending_count ?? 0).toLocaleString(locale)}
            note={`${formatCurrency(
              Number(summary?.pending_amount ?? 0),
              locale,
            )} awaiting action`}
            color={COLOR.pending}
            loading={isSummaryLoading}
          />

          <Stat
            icon={<RefreshCcw className="size-5" />}
            label="Processing payments"
            value={(summary?.processing_count ?? 0).toLocaleString(locale)}
            note={`${formatCurrency(
              Number(summary?.processing_amount ?? 0),
              locale,
            )} in progress`}
            color={COLOR.reversed}
            loading={isSummaryLoading}
          />
        </section>

        {isSummaryError && (
          <p
            className="text-sm"
            style={{ color: COLOR.pending }}
            role="status"
          >
            Summary figures could not be loaded. Payment records may still be
            available below.
          </p>
        )}

        {/* Payment records */}
        <section className="overflow-hidden rounded-xl border bg-card">
          <header className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Payment records</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Transactions returned by the municipal revenue system, newest
                first.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isFetching && !isLoading && (
                <Loader2 className="size-4 animate-spin text-muted-foreground print:hidden" />
              )}

              <span className="rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums">
                {totalRecords.toLocaleString(locale)} records
              </span>
            </div>
          </header>

          {isLoading ? (
            <div
              className="space-y-3 p-5"
              aria-busy="true"
              aria-label="Loading payment records"
            >
              {[1, 2, 3, 4, 5, 6].map((row) => (
                <div
                  key={row}
                  className="h-14 animate-pulse rounded-lg bg-muted/60"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-full bg-destructive/10 p-4 text-destructive">
                <ShieldAlert className="size-6" />
              </div>

              <h3 className="font-semibold">Payment records unavailable</h3>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                The server could not return payment records. Check your
                connection and permissions, then try again.
              </p>

              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
                className="mt-4"
              >
                <RefreshCcw className="mr-2 size-4" />
                Try again
              </Button>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
                <Search className="size-6" />
              </div>

              <h3 className="font-semibold">No payments found</h3>

              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                No payment records match the current search and filters. Widen
                the period or reset the filters.
              </p>

              {hasAnyFilter && (
                <Button
                  variant="outline"
                  onClick={resetAll}
                  className="mt-4"
                >
                  Reset filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                      <th scope="col" className="px-5 py-3 font-medium">
                        Payment
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Citizen
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Method / Bank
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Processed by
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-3 text-right font-medium"
                      >
                        Amount
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Date
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-3 text-right font-medium print:hidden"
                      >
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {payments.map((payment) => {
                      const display = getPaymentDisplay(payment);

                      return (
                        <tr
                          key={display.id}
                          className="transition-colors hover:bg-muted/40"
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold">
                              {display.paymentNumber}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              Invoice {display.invoiceNumber}
                            </p>

                            {display.receiptNumber && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Receipt {display.receiptNumber}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium">
                              {display.taxpayer?.name || "Not specified"}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {display.taxpayer?.citizen_uid || "No citizen UID"}
                            </p>

                            {display.taxpayer?.national_id && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                ID: {display.taxpayer.national_id}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-start gap-2.5">
                              <div className="rounded-lg border bg-background p-2 text-muted-foreground">
                                <MethodIcon method={display.method} />
                              </div>

                              <div className="min-w-0">
                                <p className="font-medium">
                                  {getMethodLabel(display.method)}
                                </p>

                                {display.bankAccount ? (
                                  <>
                                    <p className="mt-1 max-w-56 truncate text-xs font-medium">
                                      {display.bankAccount.bank_name ||
                                        "Bank not specified"}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {display.bankAccount.account_number ||
                                        "Account number unavailable"}
                                    </p>

                                    <div className="mt-2">
                                      <VerificationBadge
                                        status={
                                          display.bankTransfer
                                            ?.verification_status
                                        }
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <p className="mt-1 max-w-48 truncate text-xs text-muted-foreground">
                                    {getProviderLabel(display.provider)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium">
                              {display.processedBy || "—"}
                            </p>

                            {display.verifiedBy && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Verified by {display.verifiedBy}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <p className="whitespace-nowrap font-semibold tabular-nums">
                              {formatCurrency(display.amount, locale)}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="whitespace-nowrap">
                              {display.createdAt
                                ? formatEthiopianDate(
                                    new Date(
                                      display.createdAt,
                                    ).toDateString(),
                                  )
                                : "—"}
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                              {formatTime(display.createdAt, locale)}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={display.status} />
                          </td>

                          <td className="px-5 py-4 text-right print:hidden">
                          <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/${locale}/office/dashboard/payments/${encodeURIComponent(
                                    String(payment.id),
                                  )}`,
                                )
                              }
                              aria-label={`View details for payment ${display.paymentNumber}`}
                            >
                              <Eye className="mr-2 size-3.5" />
                              Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Server-side pagination */}
              <footer className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground tabular-nums">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {from.toLocaleString(locale)}
                  </span>
                  –
                  <span className="font-medium text-foreground">
                    {to.toLocaleString(locale)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {totalRecords.toLocaleString(locale)}
                  </span>{" "}
                  payments
                </p>

                <div className="flex flex-wrap items-center gap-3 print:hidden">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="page-size"
                      className="whitespace-nowrap text-sm text-muted-foreground"
                    >
                      Rows per page
                    </label>

                    <select
                      id="page-size"
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(Number(event.target.value));
                        setPage(1);
                      }}
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || isFetching}
                    onClick={() =>
                      setPage((previous) => Math.max(1, previous - 1))
                    }
                  >
                    <ChevronLeft className="mr-1 size-4" />
                    Previous
                  </Button>

                  <span className="min-w-24 text-center text-sm text-muted-foreground tabular-nums">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages || isFetching}
                    onClick={() =>
                      setPage((previous) =>
                        Math.min(totalPages, previous + 1),
                      )
                    }
                  >
                    Next
                    <ChevronRight className="ml-1 size-4" />
                  </Button>
                </div>
              </footer>
            </>
          )}
        </section>

        {/* Footer */}
        <footer className="flex flex-col gap-3 border-t pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Amounts in Ethiopian Birr (ETB). Printing and CSV export include the
            current page only.
          </p>

          <Link
            href={`/${locale}/office/dashboard/reports/revenue-collection`}
            className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline print:hidden"
          >
            Open revenue collection report
            <ArrowRight className="size-3.5" />
          </Link>
        </footer>
      </div>
    </main>
  );
}
