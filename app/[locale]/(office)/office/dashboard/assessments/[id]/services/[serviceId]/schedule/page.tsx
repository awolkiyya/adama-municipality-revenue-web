"use client";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ReceiptText,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  useCreateInvoiceFromPaymentSchedules,
  usePaymentSchedule,
} from "@/hooks/payment-schedule/use-payment-schedule";

import type {
  PaymentSchedule,
  PaymentScheduleStatus,
} from "@/types/payment-schedule/payment-schedule";

// ============================================================================
// TYPES
// ============================================================================

type StatusFilter = "all" | "pending" | "partially_paid" | "paid" | "overdue";
type InvoiceState = "idle" | "submitting" | "confirmed";

type InvoiceSummary = {
  id: string;
  invoiceNumber: string | null;
  status: string | null;
};

type Installment = {
  id: string;
  assessmentServiceId: string;
  installmentNumber: number;
  /** Snapshot of the % rule applied when this row was generated (e.g. "10.00"). */
  rulePercentage: string | null;
  dueDate: string | null;
  amountDue: number;
  amountPaid: number;
  /** Backend-authoritative remaining amount. */
  remainingAmount: number;
  status: PaymentScheduleStatus;
  paidAt: string | null;
  notes: string | null;
  isInvoiced: boolean;
  invoice: InvoiceSummary | null;
};

type ScheduleViewModel = {
  assessmentId: string;
  assessmentServiceId: string;
  serviceId: string;
  revenueCode: string;
  serviceName: string;
  installments: Installment[];
};

type ConfirmedInvoiceSummary = { amount: number; count: number };

// ============================================================================
// CONSTANTS
// ============================================================================

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const SELECTABLE_STATUSES: PaymentScheduleStatus[] = [
  "PENDING",
  "PARTIALLY_PAID",
  "OVERDUE",
];

// ============================================================================
// FORMATTERS
// ============================================================================

const currencyFormatter = new Intl.NumberFormat("en-ET", {
  style: "currency",
  currency: "ETB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const formatCurrency = (value: number) =>
  currencyFormatter.format(Number.isFinite(value) ? value : 0);

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// ============================================================================
// STATUS
// ============================================================================

const STATUS_BADGE_CONFIG: Record<
  PaymentScheduleStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  PARTIALLY_PAID: { label: "Partially paid", variant: "secondary" },
  PAID: { label: "Paid", variant: "default" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "outline" },
};

function StatusBadge({ status }: { status: PaymentScheduleStatus }) {
  const config = STATUS_BADGE_CONFIG[status];
  return (
    <Badge variant={config.variant} className="font-normal">
      {config.label}
    </Badge>
  );
}

// ============================================================================
// NORMALIZATION
// ============================================================================

function normalizeInvoice(raw: unknown): InvoiceSummary | null {
  if (!raw || typeof raw !== "object") return null;

  const value = raw as Record<string, unknown>;
  const id = value.id != null ? String(value.id) : "";
  const invoiceNumber = value.invoiceNumber ?? value.invoice_number;
  const status = value.status != null ? String(value.status) : null;

  if (!id && !invoiceNumber) return null;

  return {
    id,
    invoiceNumber: invoiceNumber != null ? String(invoiceNumber) : null,
    status,
  };
}

function normalizeInstallment(raw: PaymentSchedule): Installment {
  const invoice = normalizeInvoice(raw.invoice);

  return {
    id: String(raw.id),
    assessmentServiceId: String(raw.assessmentServiceId),
    installmentNumber: Number(raw.installmentNumber),
    rulePercentage:
      raw.rulePercentage != null ? String(raw.rulePercentage) : null,
    dueDate: raw.dueDate ?? null,
    amountDue: toNumber(raw.amountDue),
    amountPaid: toNumber(raw.amountPaid),
    // Backend is authoritative. Never recompute from amountDue - amountPaid.
    remainingAmount: Math.max(toNumber(raw.remainingAmount), 0),
    status: raw.status,
    paidAt: raw.paidAt ?? null,
    notes: raw.notes ?? null,
    isInvoiced: Boolean(invoice?.id || invoice?.invoiceNumber),
    invoice,
  };
}

function normalizeScheduleContext(
  data:
    | {
        assessmentService: {
          id: string;
          assessmentId: string;
          serviceId: string;
          serviceName: string;
          revenueCode: string;
        };
        schedules: PaymentSchedule[];
      }
    | undefined,
): ScheduleViewModel | null {
  if (!data?.assessmentService) return null;

  const s = data.assessmentService;

  return {
    assessmentId: String(s.assessmentId),
    assessmentServiceId: String(s.id),
    serviceId: String(s.serviceId),
    revenueCode: String(s.revenueCode ?? ""),
    serviceName: String(s.serviceName ?? ""),
    installments: Array.isArray(data.schedules)
      ? data.schedules
          .map(normalizeInstallment)
          .sort((a, b) => a.installmentNumber - b.installmentNumber)
      : [],
  };
}

// ============================================================================
// HELPERS
// ============================================================================

const isSelectable = (i: Installment) =>
  SELECTABLE_STATUSES.includes(i.status) && !i.isInvoiced && i.remainingAmount > 0;

const isFirstInstallment = (i: Installment) => i.installmentNumber === 1;

const hasAppliedRule = (i: Installment) =>
  isFirstInstallment(i) && i.rulePercentage !== null;

// ============================================================================
// SUMMARY
// ============================================================================

function useScheduleSummary(installments: Installment[]) {
  return useMemo(() => {
    const counts: Record<PaymentScheduleStatus, number> = {
      PENDING: 0,
      PARTIALLY_PAID: 0,
      PAID: 0,
      OVERDUE: 0,
      CANCELLED: 0,
    };

    let totalDue = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    for (const i of installments) {
      counts[i.status] += 1;
      totalDue += i.amountDue;
      totalPaid += i.amountPaid;
      totalRemaining += i.remainingAmount;
    }

    const progress =
      totalDue > 0 ? Math.min(100, Math.round((totalPaid / totalDue) * 100)) : 0;

    const first = installments.find((i) => i.installmentNumber === 1) ?? null;

    const last = installments.reduce<Installment | null>(
      (latest, i) =>
        !latest || i.installmentNumber > latest.installmentNumber ? i : latest,
      null,
    );

    return {
      installmentCount: installments.length,
      paidCount: counts.PAID,
      pendingCount: counts.PENDING,
      partiallyPaidCount: counts.PARTIALLY_PAID,
      overdueCount: counts.OVERDUE,
      totalDue,
      totalPaid,
      totalRemaining,
      progress,
      firstDueDate: first?.dueDate ?? null,
      finalDueDate: last?.dueDate ?? null,
    };
  }, [installments]);
}

// ============================================================================
// FILTERS + PAGINATION
// ============================================================================

function useInstallmentFilters(installments: Installment[]) {
  const [search, setSearchState] = useState("");
  const [statusFilter, setStatusFilterState] = useState<StatusFilter>("all");
  const [pageSize, setPageSizeState] = useState<number>(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return installments.filter((i) => {
      const invoiceNumber = i.invoice?.invoiceNumber?.toLowerCase() ?? "";
      const dueDate = i.dueDate?.toLowerCase() ?? "";

      const matchesSearch =
        !query ||
        String(i.installmentNumber).includes(query) ||
        dueDate.includes(query) ||
        i.status.toLowerCase().includes(query) ||
        invoiceNumber.includes(query);

      const matchesStatus =
        statusFilter === "all" || i.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [installments, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return {
    search,
    setSearch(value: string) {
      setSearchState(value);
      setPage(1);
    },
    statusFilter,
    setStatusFilter(value: StatusFilter) {
      setStatusFilterState(value);
      setPage(1);
    },
    pageSize,
    setPageSize(value: number) {
      setPageSizeState(value);
      setPage(1);
    },
    filtered,
    paginated,
    currentPage,
    totalPages,
    setPage,
  };
}

// ============================================================================
// SELECTION
// ============================================================================

function useInstallmentSelection(installments: Installment[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectable = useMemo(
    () => installments.filter(isSelectable),
    [installments],
  );

  // Drop selections that are no longer valid after a backend refresh.
  useEffect(() => {
    setSelectedIds((current) => {
      const valid = new Set(selectable.map((i) => i.id));
      const next = new Set([...current].filter((id) => valid.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [selectable]);

  const selectedInstallments = useMemo(
    () => installments.filter((i) => selectedIds.has(i.id)),
    [installments, selectedIds],
  );

  // Preview only. The backend revalidates everything.
  const selectedAmount = selectedInstallments.reduce(
    (total, i) => total + i.remainingAmount,
    0,
  );

  const toggle = useCallback((installment: Installment) => {
    if (!isSelectable(installment)) return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(installment.id)) next.delete(installment.id);
      else next.add(installment.id);
      return next;
    });
  }, []);

  const setMany = useCallback((ids: string[], add: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (add) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const selectNext = useCallback(
    (count: number) =>
      setSelectedIds(new Set(selectable.slice(0, count).map((i) => i.id))),
    [selectable],
  );

  const selectAll = useCallback(
    () => setSelectedIds(new Set(selectable.map((i) => i.id))),
    [selectable],
  );

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  return {
    selectedIds,
    selectedInstallments,
    selectedAmount,
    selectedCount: selectedInstallments.length,
    selectable,
    toggle,
    setMany,
    selectNext,
    selectAll,
    clear,
  };
}

// ============================================================================
// SUMMARY STAT
// ============================================================================

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600"
      : tone === "warning"
        ? "text-amber-600"
        : "text-foreground";

  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${toneClass}`}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ============================================================================
// SELECTION BAR (sticky, appears only when something is selected)
// ============================================================================

function SelectionBar({
  count,
  totalAmount,
  onReview,
  onClear,
}: {
  count: number;
  totalAmount: number;
  onReview: () => void;
  onClear: () => void;
}) {
  return (
    <div
      role="region"
      aria-label="Selected installments"
      className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border bg-background p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onClear}
          aria-label="Clear selection"
        >
          <X className="size-4" />
        </Button>

        <div>
          <p className="text-sm font-medium">
            {count} installment{count !== 1 ? "s" : ""} selected
          </p>
          <p className="text-xs text-muted-foreground">
            Total to invoice:{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(totalAmount)}
            </span>
          </p>
        </div>
      </div>

      <Button onClick={onReview}>
        <ReceiptText className="mr-2 size-4" />
        Review invoice
      </Button>
    </div>
  );
}

// ============================================================================
// REVIEW LINE
// ============================================================================

function ReviewLineItem({
  installment,
  disabled,
  onRemove,
}: {
  installment: Installment;
  disabled: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium">
            Installment {installment.installmentNumber}
          </p>

          {hasAppliedRule(installment) && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
              {installment.rulePercentage}% rule
            </Badge>
          )}

          {installment.status === "OVERDUE" && (
            <Badge variant="destructive" className="px-1.5 py-0 text-[10px] font-normal">
              Overdue
            </Badge>
          )}
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground">
          Due {formatDate(installment.dueDate)}
        </p>
      </div>

      <p className="shrink-0 text-sm font-semibold">
        {formatCurrency(installment.remainingAmount)}
      </p>

      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
        disabled={disabled}
        onClick={onRemove}
        aria-label={`Remove installment ${installment.installmentNumber}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

// ============================================================================
// REVIEW SHEET
// ============================================================================

function PaymentReviewSheet({
  open,
  onOpenChange,
  installments,
  totalAmount,
  invoiceState,
  invoiceReference,
  invoiceStatus,
  invoiceError,
  confirmedSummary,
  onRemove,
  onConfirm,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installments: Installment[];
  totalAmount: number;
  invoiceState: InvoiceState;
  invoiceReference: string | null;
  invoiceStatus: string | null;
  invoiceError: string | null;
  confirmedSummary: ConfirmedInvoiceSummary | null;
  onRemove: (installment: Installment) => void;
  onConfirm: () => void;
  onDone: () => void;
}) {
  const isSubmitting = invoiceState === "submitting";
  const isConfirmed = invoiceState === "confirmed";
  const isEmpty = installments.length === 0;

  const confirmedAmount = confirmedSummary?.amount ?? totalAmount;
  const confirmedCount = confirmedSummary?.count ?? installments.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        {isConfirmed ? (
          <div className="flex h-full flex-col">
            <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
                <BadgeCheck className="size-9 text-emerald-600" />
              </div>

              <div>
                <SheetTitle className="text-lg">Invoice created</SheetTitle>
                <SheetDescription className="mt-1">
                  The selected installments were added to the invoice.
                </SheetDescription>
              </div>

              <p className="text-3xl font-semibold tracking-tight">
                {formatCurrency(confirmedAmount)}
              </p>

              <dl className="w-full divide-y rounded-xl border text-left text-sm">
                <div className="flex items-center justify-between px-4 py-3">
                  <dt className="text-muted-foreground">Invoice</dt>
                  <dd className="font-medium">{invoiceReference ?? "Created"}</dd>
                </div>

                {invoiceStatus && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      <Badge variant="secondary">{invoiceStatus}</Badge>
                    </dd>
                  </div>
                )}

                <div className="flex items-center justify-between px-4 py-3">
                  <dt className="text-muted-foreground">Installments</dt>
                  <dd className="font-medium">{confirmedCount}</dd>
                </div>
              </dl>
            </div>

            <SheetFooter className="border-t px-6 py-4">
              <Button className="w-full" onClick={onDone}>
                Done
              </Button>
            </SheetFooter>
          </div>
        ) : (
          <>
            <SheetHeader className="border-b px-6 py-5 text-left">
              <SheetTitle>Review invoice</SheetTitle>
              <SheetDescription>
                Check the installments below, then create the invoice.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6">
              {isEmpty ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
                  <CalendarClock className="size-8 text-muted-foreground/40" />
                  <p className="font-medium">No installments selected</p>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    Close this panel and select installments from the table.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {installments.map((installment) => (
                    <ReviewLineItem
                      key={installment.id}
                      installment={installment}
                      disabled={isSubmitting}
                      onRemove={() => onRemove(installment)}
                    />
                  ))}
                </div>
              )}
            </div>

            {invoiceError && (
              <div
                role="alert"
                className="mx-6 mb-4 flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Could not create the invoice
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {invoiceError}
                  </p>
                </div>
              </div>
            )}

            {!isEmpty && (
              <SheetFooter className="flex-col gap-3 border-t px-6 py-5 sm:flex-col">
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Invoice total
                  </span>
                  <span className="text-lg font-semibold">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                  onClick={onConfirm}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Creating invoice…
                    </>
                  ) : (
                    "Create invoice"
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  The final amount is confirmed by the server when the invoice
                  is created.
                </p>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// TABLE ROW
// ============================================================================

function InstallmentRow({
  installment,
  selected,
  onToggle,
}: {
  installment: Installment;
  selected: boolean;
  onToggle: () => void;
}) {
  const selectable = isSelectable(installment);

  return (
    <TableRow
      data-state={selected ? "selected" : undefined}
      className={selectable ? "cursor-pointer" : undefined}
      onClick={selectable ? onToggle : undefined}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selected}
          disabled={!selectable}
          onCheckedChange={onToggle}
          aria-label={`Select installment ${installment.installmentNumber}`}
        />
      </TableCell>

      <TableCell>
        <span className="font-semibold">{installment.installmentNumber}</span>
        {hasAppliedRule(installment) && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {installment.rulePercentage}% rule
          </p>
        )}
      </TableCell>

      <TableCell className="whitespace-nowrap">
        {formatDate(installment.dueDate)}
      </TableCell>

      <TableCell className="text-right tabular-nums">
        {formatCurrency(installment.amountDue)}
      </TableCell>

      <TableCell
        className={`text-right tabular-nums ${
          installment.amountPaid > 0 ? "" : "text-muted-foreground"
        }`}
      >
        {formatCurrency(installment.amountPaid)}
      </TableCell>

      <TableCell className="text-right font-semibold tabular-nums">
        {formatCurrency(installment.remainingAmount)}
      </TableCell>

      <TableCell>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={installment.status} />
          {installment.isInvoiced && (
            <Badge variant="outline" className="font-normal">
              {installment.invoice?.invoiceNumber
                ? `Invoice ${installment.invoice.invoiceNumber}`
                : "Invoiced"}
            </Badge>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <TableRow>
      <TableCell colSpan={7} className="h-44 text-center">
        <div className="flex flex-col items-center justify-center gap-2">
          <CalendarClock className="size-8 text-muted-foreground/40" />
          <p className="font-medium">
            {hasFilters ? "No installments match your filters" : "No installments yet"}
          </p>
          {hasFilters && (
            <>
              <p className="text-sm text-muted-foreground">
                Try a different search or status.
              </p>
              <Button variant="outline" size="sm" onClick={onReset}>
                Clear filters
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// PAGINATION (with page size)
// ============================================================================

function PaginationBar({
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const rangeStart = totalResults === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalResults);

  return (
    <div className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-md border bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {rangeStart}–{rangeEnd} of {totalResults}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="mr-1 size-4" />
          Previous
        </Button>

        <span className="px-1 text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// LOADING / ERROR
// ============================================================================

function ScheduleLoadingState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center" role="status">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="size-7 animate-spin text-primary" />
        <p className="font-medium">Loading payment schedule…</p>
      </div>
    </div>
  );
}

function ScheduleErrorState({
  message,
  onRetry,
  retryLabel = "Try again",
}: {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}) {
  return (
    <Card>
      <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-6 text-destructive" />
        </div>

        <div>
          <p className="font-semibold">Could not load the payment schedule</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
        </div>

        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-2 size-4" />
          {retryLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;

  if (error && typeof error === "object") {
    const value = error as Record<string, unknown>;
    if (typeof value.message === "string") return value.message;
    if (typeof value.error === "string") return value.error;
  }

  return "The server could not create the invoice.";
}

// ============================================================================
// PAGE
// ============================================================================

export default function PaymentScheduleManagementPage() {
  const params = useParams<{ id: string; serviceId: string }>();
  const router = useRouter();

  // Route: /assessments/[id]/services/[serviceId]/schedule
  const assessmentId = Array.isArray(params.id) ? (params.id[0] ?? "") : (params.id ?? "");
  const assessmentServiceId = Array.isArray(params.serviceId)
    ? (params.serviceId[0] ?? "")
    : (params.serviceId ?? "");

  const hasValidRoute = Boolean(assessmentId && assessmentServiceId);

  const {
    data: scheduleData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = usePaymentSchedule(assessmentServiceId);

  const createInvoice = useCreateInvoiceFromPaymentSchedules();

  const schedule = useMemo(
    () => normalizeScheduleContext(scheduleData),
    [scheduleData],
  );

  const routeMismatch = Boolean(
    schedule?.assessmentServiceId && schedule.assessmentServiceId !== assessmentServiceId,
  );
  const assessmentMismatch = Boolean(
    schedule?.assessmentId && schedule.assessmentId !== assessmentId,
  );

  const installments = schedule?.installments ?? [];
  const summary = useScheduleSummary(installments);
  const filters = useInstallmentFilters(installments);
  const selection = useInstallmentSelection(installments);

  // Invoice flow state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [invoiceState, setInvoiceState] = useState<InvoiceState>("idle");
  const [invoiceReference, setInvoiceReference] = useState<string | null>(null);
  const [invoiceStatus, setInvoiceStatus] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // Snapshot: selection disappears after refetch, confirmation screen needs it.
  const [confirmedSummary, setConfirmedSummary] =
    useState<ConfirmedInvoiceSummary | null>(null);

  // Current-page select all
  const currentPageSelectable = filters.paginated.filter(isSelectable);
  const currentPageSelectedCount = currentPageSelectable.filter((i) =>
    selection.selectedIds.has(i.id),
  ).length;
  const allCurrentPageSelected =
    currentPageSelectable.length > 0 &&
    currentPageSelectedCount === currentPageSelectable.length;
  const somePageSelected = currentPageSelectedCount > 0 && !allCurrentPageSelected;

  const toggleCurrentPage = useCallback(() => {
    selection.setMany(
      currentPageSelectable.map((i) => i.id),
      !allCurrentPageSelected,
    );
  }, [currentPageSelectable, allCurrentPageSelected, selection]);

  const resetInvoiceState = useCallback(() => {
    setInvoiceReference(null);
    setInvoiceStatus(null);
    setInvoiceError(null);
    setConfirmedSummary(null);
    setInvoiceState("idle");
  }, []);

  const openReview = useCallback(() => {
    if (selection.selectedCount === 0) return;
    resetInvoiceState();
    setReviewOpen(true);
  }, [selection.selectedCount, resetInvoiceState]);

  const handleConfirmInvoice = useCallback(async () => {
    if (!schedule || selection.selectedCount === 0 || createInvoice.isPending) return;

    const paymentScheduleIds = selection.selectedInstallments.map((i) => i.id);

    setConfirmedSummary({
      amount: selection.selectedAmount,
      count: selection.selectedCount,
    });
    setInvoiceState("submitting");
    setInvoiceError(null);

    try {
      // Only identifiers are submitted. The server owns all amounts.
      const response = await createInvoice.mutateAsync({
        assessmentServiceId,
        paymentScheduleIds,
      });

      const invoice = response.data.invoice;

      setInvoiceReference(invoice.invoiceNumber ?? invoice.id ?? "Created");
      setInvoiceStatus(invoice.status ?? null);

      await refetch();
      setInvoiceState("confirmed");
    } catch (err) {
      console.error("Failed to create invoice from payment schedules", {
        assessmentServiceId,
        paymentScheduleIds,
        err,
      });
      setInvoiceState("idle");
      setInvoiceError(extractErrorMessage(err));
    }
  }, [
    schedule,
    selection.selectedCount,
    selection.selectedAmount,
    selection.selectedInstallments,
    assessmentServiceId,
    createInvoice,
    refetch,
  ]);

  const handleReviewOpenChange = useCallback(
    (open: boolean) => {
      setReviewOpen(open);
      if (!open && invoiceState === "confirmed") {
        selection.clear();
        resetInvoiceState();
      }
    },
    [invoiceState, selection, resetInvoiceState],
  );

  const handleDoneReview = useCallback(() => {
    setReviewOpen(false);
    selection.clear();
    resetInvoiceState();
  }, [selection, resetInvoiceState]);

  // ------------------------------------------------------------------------
  // Guard states
  // ------------------------------------------------------------------------

  if (!hasValidRoute) {
    return (
      <div className="p-6">
        <ScheduleErrorState
          message="This page needs both an assessment ID and a service ID in the URL."
          onRetry={() => router.back()}
          retryLabel="Go back"
        />
      </div>
    );
  }

  if (routeMismatch || assessmentMismatch) {
    return (
      <div className="p-6">
        <ScheduleErrorState
          message={
            routeMismatch
              ? "The schedule returned belongs to a different service. Loading was stopped to avoid changing the wrong record."
              : "The schedule returned belongs to a different assessment. Loading was stopped to avoid changing the wrong record."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <ScheduleLoadingState />
      </div>
    );
  }

  if (isError || !schedule) {
    return (
      <div className="p-6">
        <ScheduleErrorState
          message={
            error instanceof Error
              ? error.message
              : "No payment schedule was returned for this service."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // ------------------------------------------------------------------------
  // Derived UI state
  // ------------------------------------------------------------------------

  const hasSelectable = selection.selectable.length > 0;
  const hasFilters = Boolean(filters.search.trim()) || filters.statusFilter !== "all";

  const allOutstandingUnavailable =
    summary.totalRemaining > 0 && !hasSelectable;

  const overallStatus =
    summary.overdueCount > 0
      ? { label: "Overdue", variant: "destructive" as const }
      : summary.pendingCount === 0 && summary.partiallyPaidCount === 0
        ? { label: "Fully paid", variant: "default" as const }
        : { label: "Active", variant: "secondary" as const };

  const resetFilters = () => {
    filters.setSearch("");
    filters.setStatusFilter("all");
  };

  // ------------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* HEADER: what is this, where am I, what can I do */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 mb-1 text-muted-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-1.5 size-4" />
            Back
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Payment schedule
            </h1>
            {summary.installmentCount > 0 && (
              <Badge variant={overallStatus.variant}>{overallStatus.label}</Badge>
            )}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {[schedule.serviceName, schedule.revenueCode].filter(Boolean).join(" · ") ||
              "Assessment service"}
          </p>
        </div>

        <Button variant="outline" disabled={isFetching} onClick={() => refetch()}>
          <RefreshCw className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      {/* SUMMARY: one card, three numbers, one progress bar */}
      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <Stat
              label="Total scheduled"
              value={formatCurrency(summary.totalDue)}
              hint={`${summary.installmentCount} installments`}
            />
            <Stat
              label="Paid"
              value={formatCurrency(summary.totalPaid)}
              hint={`${summary.paidCount} fully paid`}
              tone="success"
            />
            <Stat
              label="Outstanding"
              value={formatCurrency(summary.totalRemaining)}
              hint={
                summary.overdueCount > 0
                  ? `${summary.overdueCount} overdue`
                  : `Final due ${formatDate(summary.finalDueDate)}`
              }
              tone={summary.overdueCount > 0 ? "warning" : "default"}
            />
          </div>

          <div>
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>{summary.progress}% paid</span>
              <span>
                {formatDate(summary.firstDueDate)} – {formatDate(summary.finalDueDate)}
              </span>
            </div>
            <Progress value={summary.progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {allOutstandingUnavailable && (
        <div
          role="status"
          className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium">Nothing available to invoice</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              The remaining balance is already on an invoice or can't be invoiced
              right now.
            </p>
          </div>
        </div>
      )}

      {/* INSTALLMENTS: search, filter, select, page */}
      <Card>
        <div className="space-y-3 border-b p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold">Installments</h2>
              <p className="text-sm text-muted-foreground">
                Select the installments you want on a new invoice.
              </p>
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => filters.setSearch(e.target.value)}
                placeholder="Search installments"
                aria-label="Search installments"
                className="h-9 pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="overflow-x-auto">
              <Tabs
                value={filters.statusFilter}
                onValueChange={(v) => filters.setStatusFilter(v as StatusFilter)}
              >
                <TabsList>
                  <TabsTrigger value="all">All {summary.installmentCount}</TabsTrigger>
                  <TabsTrigger value="pending">Pending {summary.pendingCount}</TabsTrigger>
                  <TabsTrigger value="partially_paid">
                    Partial {summary.partiallyPaidCount}
                  </TabsTrigger>
                  <TabsTrigger value="paid">Paid {summary.paidCount}</TabsTrigger>
                  <TabsTrigger value="overdue">Overdue {summary.overdueCount}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {hasSelectable && (
              <div className="flex items-center gap-1 text-sm">
                <span className="mr-1 text-muted-foreground">Quick select:</span>
                <Button variant="outline" size="sm" onClick={() => selection.selectNext(3)}>
                  Next 3
                </Button>
                <Button variant="outline" size="sm" onClick={selection.selectAll}>
                  All outstanding
                </Button>
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        allCurrentPageSelected
                          ? true
                          : somePageSelected
                            ? "indeterminate"
                            : false
                      }
                      disabled={currentPageSelectable.length === 0}
                      onCheckedChange={toggleCurrentPage}
                      aria-label="Select all available installments on this page"
                    />
                  </TableHead>
                  <TableHead className="w-24">No.</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead className="text-right">Amount due</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filters.paginated.map((installment) => (
                  <InstallmentRow
                    key={installment.id}
                    installment={installment}
                    selected={selection.selectedIds.has(installment.id)}
                    onToggle={() => selection.toggle(installment)}
                  />
                ))}

                {filters.paginated.length === 0 && (
                  <EmptyState hasFilters={hasFilters} onReset={resetFilters} />
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        <PaginationBar
          currentPage={filters.currentPage}
          totalPages={filters.totalPages}
          totalResults={filters.filtered.length}
          pageSize={filters.pageSize}
          onPageChange={filters.setPage}
          onPageSizeChange={filters.setPageSize}
        />
      </Card>

      {/* ACTION BAR: appears only when there is something to act on */}
      {selection.selectedCount > 0 && (
        <SelectionBar
          count={selection.selectedCount}
          totalAmount={selection.selectedAmount}
          onReview={openReview}
          onClear={selection.clear}
        />
      )}

      <PaymentReviewSheet
        open={reviewOpen}
        onOpenChange={handleReviewOpenChange}
        installments={selection.selectedInstallments}
        totalAmount={selection.selectedAmount}
        invoiceState={invoiceState}
        invoiceReference={invoiceReference}
        invoiceStatus={invoiceStatus}
        invoiceError={invoiceError}
        confirmedSummary={confirmedSummary}
        onRemove={selection.toggle}
        onConfirm={handleConfirmInvoice}
        onDone={handleDoneReview}
      />
    </div>
  );
}