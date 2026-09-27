"use client";

import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  MoreHorizontal,
  ReceiptText,
  Search,
  Trash2,
  WalletCards,
} from "lucide-react";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

// ============================================================
// TYPES
// ============================================================

type InstallmentStatus = "PENDING" | "PAID" | "PARTIAL" | "OVERDUE" | "CANCELLED";
type PaymentScheduleStatus = InstallmentStatus;
type StatusFilter = "all" | "pending" | "paid" | "overdue";
type InvoiceState = "idle" | "submitting" | "confirmed";

type Installment = {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InstallmentStatus;
  completionYear: number | null;
  isInitialInstallment: boolean;
};

type PaymentSchedule = {
  id: string;
  assessmentId: string;
  assessmentServiceId: string;
  installmentCount: number;
  firstInstallmentRequired: boolean;
  firstInstallmentPercentage: number;
  paymentCompletionYears: number;
  principalAmount: number;
  firstInstallmentAmount: number;
  remainingPrincipal: number;
  annualInstallmentAmount: number;
  scheduledAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  baseDueDate: string;
  firstDueDate: string;
  finalDueDate: string;
  status: PaymentScheduleStatus;
  installments: Installment[];
};

const SELECTABLE_STATUSES: InstallmentStatus[] = ["PENDING", "PARTIAL", "OVERDUE"];
const PAGE_SIZE = 10;

// ============================================================
// MOCK DATA — replace with a fetch/query once wired to the API
// ============================================================

const PRINCIPAL_AMOUNT = 73260;
const FIRST_INSTALLMENT_AMOUNT = 7326;
const ANNUAL_INSTALLMENT_AMOUNT = 1098.9;
const PAYMENT_COMPLETION_YEARS = 60;
const BASE_DUE_DATE = "2026-09-11";
const FIRST_DUE_DATE = "2026-09-11";
const FINAL_DUE_DATE = "2086-09-11";

function buildInstallments(): Installment[] {
  const installments: Installment[] = [
    {
      id: "payment-schedule-installment-01",
      installmentNumber: 1,
      dueDate: FIRST_DUE_DATE,
      amount: FIRST_INSTALLMENT_AMOUNT,
      paidAmount: 0,
      remainingAmount: FIRST_INSTALLMENT_AMOUNT,
      status: "PENDING",
      completionYear: 0,
      isInitialInstallment: true,
    },
  ];

  for (let year = 1; year <= PAYMENT_COMPLETION_YEARS; year++) {
    installments.push({
      id: `payment-schedule-installment-${String(year + 1).padStart(2, "0")}`,
      installmentNumber: year + 1,
      dueDate: `${2026 + year}-09-11`,
      amount: ANNUAL_INSTALLMENT_AMOUNT,
      paidAmount: 0,
      remainingAmount: ANNUAL_INSTALLMENT_AMOUNT,
      status: "PENDING",
      completionYear: year,
      isInitialInstallment: false,
    });
  }

  return installments;
}

const MOCK_SCHEDULE: PaymentSchedule = {
  id: "payment-schedule-mock-1731",
  assessmentId: "assessment-id",
  assessmentServiceId: "assessment-service-id",
  installmentCount: PAYMENT_COMPLETION_YEARS + 1,
  firstInstallmentRequired: true,
  firstInstallmentPercentage: 10,
  paymentCompletionYears: PAYMENT_COMPLETION_YEARS,
  principalAmount: PRINCIPAL_AMOUNT,
  firstInstallmentAmount: FIRST_INSTALLMENT_AMOUNT,
  remainingPrincipal: PRINCIPAL_AMOUNT - FIRST_INSTALLMENT_AMOUNT,
  annualInstallmentAmount: ANNUAL_INSTALLMENT_AMOUNT,
  scheduledAmount: PRINCIPAL_AMOUNT,
  paidAmount: 0,
  outstandingAmount: PRINCIPAL_AMOUNT,
  baseDueDate: BASE_DUE_DATE,
  firstDueDate: FIRST_DUE_DATE,
  finalDueDate: FINAL_DUE_DATE,
  status: "PENDING",
  installments: buildInstallments(),
};

// ============================================================
// FORMATTERS
// ============================================================

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

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return dateFormatter.format(new Date(`${value}T00:00:00`));
}

function isSelectable(installment: Installment): boolean {
  return SELECTABLE_STATUSES.includes(installment.status);
}

function generateInvoiceReference(): string {
  return `INV-${Date.now().toString().slice(-8)}`;
}

// ============================================================
// STATUS BADGES
// ============================================================

const STATUS_BADGE_CONFIG: Record<
  InstallmentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  PARTIAL: { label: "Partial", variant: "secondary" },
  PAID: { label: "Paid", variant: "default" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "outline" },
};

function StatusBadge({ status }: { status: InstallmentStatus }) {
  const config = STATUS_BADGE_CONFIG[status];
  return (
    <Badge variant={config.variant} className="font-normal">
      {config.label}
    </Badge>
  );
}

// ============================================================
// HOOKS — business logic lives here, kept out of the render tree
// ============================================================

/** Aggregate counts and totals derived from the schedule's installments. */
function useScheduleSummary(schedule: PaymentSchedule) {
  return useMemo(() => {
    const counts: Record<InstallmentStatus, number> = {
      PENDING: 0,
      PAID: 0,
      PARTIAL: 0,
      OVERDUE: 0,
      CANCELLED: 0,
    };

    let totalPaid = 0;
    let totalRemaining = 0;

    for (const installment of schedule.installments) {
      counts[installment.status] += 1;
      totalPaid += installment.paidAmount;
      totalRemaining += installment.remainingAmount;
    }

    return {
      paidCount: counts.PAID,
      pendingCount: counts.PENDING,
      partialCount: counts.PARTIAL,
      overdueCount: counts.OVERDUE,
      totalPaid,
      totalRemaining,
      progress:
        schedule.principalAmount > 0
          ? Math.min(100, Math.round((schedule.paidAmount / schedule.principalAmount) * 100))
          : 0,
    };
  }, [schedule]);
}

/** Search + status-tab filtering, with pagination derived from the result. */
function useInstallmentFilters(installments: Installment[]) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return installments.filter((installment) => {
      const matchesSearch =
        !query ||
        String(installment.installmentNumber).includes(query) ||
        installment.dueDate.toLowerCase().includes(query) ||
        installment.status.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || installment.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [installments, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  return {
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    statusFilter,
    setStatusFilter: (value: StatusFilter) => {
      setStatusFilter(value);
      setPage(1);
    },
    filtered,
    paginated,
    currentPage,
    totalPages,
    setPage,
  };
}

/** Row selection plus the quick-select shortcuts, kept independent of filtering/pagination. */
function useInstallmentSelection(installments: Installment[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectable = useMemo(() => installments.filter(isSelectable), [installments]);

  const selectedInstallments = useMemo(
    () =>
      installments
        .filter((i) => selectedIds.has(i.id))
        // Keep selection ordered by due date so the checkout list reads like a real statement.
        .sort((a, b) => a.installmentNumber - b.installmentNumber),
    [installments, selectedIds],
  );

  const selectedAmount = selectedInstallments.reduce((sum, i) => sum + i.remainingAmount, 0);

  function toggle(installment: Installment) {
    if (!isSelectable(installment)) return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(installment.id)) next.delete(installment.id);
      else next.add(installment.id);
      return next;
    });
  }

  function setMany(ids: string[], add: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (add) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  /** Selects the next N selectable installments in schedule order (initial installment first). */
  function selectNext(count: number) {
    setSelectedIds(new Set(selectable.slice(0, count).map((i) => i.id)));
  }

  function selectAll(ids: string[]) {
    setSelectedIds(new Set(ids));
  }

  function clear() {
    setSelectedIds(new Set());
  }

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

// ============================================================
// SUBCOMPONENTS — overview
// ============================================================

function OverviewCard({
  icon,
  iconClassName,
  label,
  value,
  caption,
}: {
  icon: React.ReactNode;
  iconClassName: string;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${iconClassName}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// SUBCOMPONENTS — payment / checkout flow
// ============================================================

function QuickSelectionBar({
  onSelectNext,
  onSelectAllFiltered,
  onSelectFullSchedule,
  onClear,
  hasSelection,
  isFiltered,
}: {
  onSelectNext: (count: number) => void;
  onSelectAllFiltered: () => void;
  onSelectFullSchedule: () => void;
  onClear: () => void;
  hasSelection: boolean;
  isFiltered: boolean;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium">Quick selection</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Select the next unpaid installments, starting from the earliest due.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => onSelectNext(2)}>
            Next year
          </Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => onSelectNext(3)}>
            Next 2 years
          </Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => onSelectNext(6)}>
            Next 5 years
          </Button>
          {isFiltered && (
            <Button size="sm" variant="outline" className="rounded-full" onClick={onSelectAllFiltered}>
              All in view
            </Button>
          )}
          <Button size="sm" variant="outline" className="rounded-full" onClick={onSelectFullSchedule}>
            Full remaining schedule
          </Button>
          {hasSelection && (
            <Button size="sm" variant="ghost" className="rounded-full" onClick={onClear}>
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * A compact "checkout strip" — mirrors the pattern of a bank app's cart/basket
 * summary: a few stacked previews of what's selected, the running total, and
 * a single call to action that opens the full review sheet.
 */
function PaymentCheckoutStrip({
  installments,
  totalAmount,
  onReview,
}: {
  installments: Installment[];
  totalAmount: number;
  onReview: () => void;
}) {
  const previewCount = 3;
  const preview = installments.slice(0, previewCount);
  const overflow = installments.length - preview.length;

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-gradient-to-br from-primary/[0.06] to-transparent p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 overflow-x-auto">
        {preview.map((installment) => (
          <div
            key={installment.id}
            className="flex shrink-0 items-center gap-2 rounded-full border bg-background py-1 pl-1 pr-3"
          >
            <div className="flex size-6 items-center justify-center rounded-full bg-primary/10">
              <CalendarClock className="size-3.5 text-primary" />
            </div>
            <span className="text-xs font-medium">
              {installment.isInitialInstallment ? "Initial" : `Yr ${installment.completionYear}`}
            </span>
          </div>
        ))}

        {overflow > 0 && (
          <span className="shrink-0 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
            +{overflow} more
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {installments.length} installment{installments.length !== 1 ? "s" : ""} selected
          </p>
          <p className="text-xl font-semibold tracking-tight">{formatCurrency(totalAmount)}</p>
        </div>
        <Button onClick={onReview} className="shrink-0">
          Review &amp; pay
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}

/** One removable line item inside the review sheet. */
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
    <div className="flex items-center gap-3 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <CalendarClock className="size-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {installment.isInitialInstallment
            ? "Initial installment"
            : `Annual installment · Year ${installment.completionYear}`}
        </p>
        <p className="text-xs text-muted-foreground">Due {formatDate(installment.dueDate)}</p>
      </div>

      <p className="shrink-0 text-sm font-semibold">
        {formatCurrency(installment.remainingAmount)}
      </p>

      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
        disabled={disabled}
        onClick={onRemove}
        aria-label="Remove from payment"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

/**
 * The payment review sheet — the bank-app "checkout" moment. Shows a
 * removable list of what's being paid, a totals breakdown, and walks
 * through submitting → confirmed states rather than a single click.
 */
function PaymentReviewSheet({
  open,
  onOpenChange,
  installments,
  totalAmount,
  assessmentServiceId,
  invoiceState,
  invoiceReference,
  onRemove,
  onConfirm,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installments: Installment[];
  totalAmount: number;
  assessmentServiceId: string;
  invoiceState: InvoiceState;
  invoiceReference: string | null;
  onRemove: (installment: Installment) => void;
  onConfirm: () => void;
  onDone: () => void;
}) {
  const isSubmitting = invoiceState === "submitting";
  const isConfirmed = invoiceState === "confirmed";
  const isEmpty = installments.length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {isConfirmed ? (
          // ---------------------------------------------------
          // Confirmation state — like a bank app's transaction receipt
          // ---------------------------------------------------
          <div className="flex h-full flex-col">
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
                <BadgeCheck className="size-9 text-emerald-600" />
              </div>

              <div>
                <p className="text-lg font-semibold">Invoice created</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {installments.length} installment{installments.length !== 1 ? "s" : ""} are now
                  invoiced and ready for payment.
                </p>
              </div>

              <p className="text-3xl font-semibold tracking-tight">
                {formatCurrency(totalAmount)}
              </p>

              <div className="w-full rounded-lg border bg-muted/30 p-4 text-left text-sm">
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-medium">{invoiceReference}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Assessment service</span>
                  <span className="font-medium">{assessmentServiceId}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Issued</span>
                  <span className="font-medium">
                    {formatDate(new Date().toISOString().slice(0, 10))}
                  </span>
                </div>
              </div>
            </div>

            <SheetFooter className="border-t px-6 py-4">
              <Button className="w-full" onClick={onDone}>
                Done
              </Button>
            </SheetFooter>
          </div>
        ) : (
          // ---------------------------------------------------
          // Review state — removable line items + totals
          // ---------------------------------------------------
          <>
            <SheetHeader className="border-b px-6 py-5 text-left">
              <SheetTitle>Review payment</SheetTitle>
              <SheetDescription>
                Confirm the installments below before creating the invoice.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6">
              {isEmpty ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
                  <CalendarClock className="size-8 text-muted-foreground/40" />
                  <p className="font-medium">Nothing left to review</p>
                  <p className="text-sm text-muted-foreground">
                    Close this panel and select installments to continue.
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

            {!isEmpty && (
              <SheetFooter className="flex-col gap-4 border-t px-6 py-5 sm:flex-col">
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total due</span>
                  <span className="text-2xl font-semibold tracking-tight">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>

                <Button className="w-full" size="lg" disabled={isSubmitting} onClick={onConfirm}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Creating invoice…
                    </>
                  ) : (
                    <>
                      <ReceiptText className="mr-2 size-4" />
                      Confirm &amp; create invoice
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  The final amount is recalculated and verified on the server before the invoice
                  is issued.
                </p>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// SUBCOMPONENTS — installments table
// ============================================================

function InstallmentRow({
  installment,
  schedule,
  selected,
  onToggle,
}: {
  installment: Installment;
  schedule: PaymentSchedule;
  selected: boolean;
  onToggle: () => void;
}) {
  const selectable = isSelectable(installment);

  return (
    <TableRow data-state={selected ? "selected" : undefined}>
      <TableCell>
        <Checkbox
          checked={selected}
          disabled={!selectable}
          onCheckedChange={onToggle}
          aria-label={`Select installment ${installment.installmentNumber}`}
        />
      </TableCell>

      <TableCell>
        <span className="font-medium">{installment.installmentNumber}</span>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" />
          <span className="font-medium">{formatDate(installment.dueDate)}</span>
        </div>
      </TableCell>

      <TableCell>
        {installment.isInitialInstallment ? (
          <div>
            <p className="text-sm font-medium">Initial</p>
            <p className="text-xs text-muted-foreground">
              {schedule.firstInstallmentPercentage}%
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium">Annual</p>
            <p className="text-xs text-muted-foreground">Year {installment.completionYear}</p>
          </div>
        )}
      </TableCell>

      <TableCell>
        <span className="font-medium">{formatCurrency(installment.amount)}</span>
      </TableCell>

      <TableCell>
        <span className={installment.paidAmount > 0 ? "font-medium" : "text-muted-foreground"}>
          {formatCurrency(installment.paidAmount)}
        </span>
      </TableCell>

      <TableCell>
        <span className="font-medium">{formatCurrency(installment.remainingAmount)}</span>
      </TableCell>

      <TableCell>
        <StatusBadge status={installment.status} />
      </TableCell>

      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Installment actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>View payments</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function EmptyState() {
  return (
    <TableRow>
      <TableCell colSpan={9} className="h-36 text-center">
        <div className="flex flex-col items-center justify-center gap-2">
          <CalendarClock className="size-8 text-muted-foreground/40" />
          <p className="font-medium">No installments match this search</p>
          <p className="text-sm text-muted-foreground">
            Try a different due date, number, or status.
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}

function PaginationBar({
  currentPage,
  totalPages,
  totalResults,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  onPageChange: (page: number) => void;
}) {
  const rangeStart = totalResults === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalResults);

  const visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, currentPage - 3),
    Math.min(totalPages, currentPage + 2),
  );

  return (
    <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {rangeStart} to {rangeEnd} of {totalResults}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft className="mr-1 size-4" />
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {visiblePages.map((page) => (
            <Button
              key={page}
              size="sm"
              variant={page === currentPage ? "default" : "outline"}
              className="size-9 p-0"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          Next
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function PaymentScheduleManagementPage() {
  const schedule = MOCK_SCHEDULE;
  const summary = useScheduleSummary(schedule);
  const filters = useInstallmentFilters(schedule.installments);
  const selection = useInstallmentSelection(schedule.installments);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [invoiceState, setInvoiceState] = useState<InvoiceState>("idle");
  const [invoiceReference, setInvoiceReference] = useState<string | null>(null);

  const currentPageSelectable = filters.paginated.filter(isSelectable);
  const currentPageSelectedCount = currentPageSelectable.filter((i) =>
    selection.selectedIds.has(i.id),
  ).length;
  const allCurrentPageSelected =
    currentPageSelectable.length > 0 && currentPageSelectedCount === currentPageSelectable.length;
  const somePageSelected = currentPageSelectedCount > 0 && !allCurrentPageSelected;

  function toggleCurrentPage() {
    selection.setMany(
      currentPageSelectable.map((i) => i.id),
      !allCurrentPageSelected,
    );
  }

  function openReview() {
    setInvoiceState("idle");
    setReviewOpen(true);
  }

  function handleConfirmInvoice() {
    if (!selection.selectedInstallments.length) return;
    setInvoiceState("submitting");

    /*
     * Frontend-only selection payload. The backend must still:
     * 1. Validate the assessment service and selected payment schedule IDs.
     * 2. Confirm each installment is payable and not already invoiced.
     * 3. Calculate the authoritative amount server-side (never trust the client total).
     * 4. Create the invoice + invoice items, then issue it and return a real reference.
     */
    const payload = {
      assessmentServiceId: schedule.assessmentServiceId,
      paymentScheduleIds: Array.from(selection.selectedIds),
    };

    // Simulated latency — swap for the real invoice-creation request.
    setTimeout(() => {
      console.log("Create invoice", payload);
      setInvoiceReference(generateInvoiceReference());
      setInvoiceState("confirmed");
    }, 900);
  }

  function handleReviewOpenChange(open: boolean) {
    setReviewOpen(open);
    // Closing after a confirmed invoice clears the basket, same as leaving a receipt screen.
    if (!open && invoiceState === "confirmed") {
      selection.clear();
      setInvoiceState("idle");
    }
  }

  function handleDoneReview() {
    setReviewOpen(false);
    selection.clear();
    setInvoiceState("idle");
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>Assessment</span>
        <span>/</span>
        <span>Assessment Service</span>
        <span>/</span>
        <span className="text-foreground">Payment Schedule</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-primary/10">
            <CalendarClock className="size-5 text-primary" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Manage Payment Schedule</h1>
              <StatusBadge status={schedule.status} />
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Select one or more scheduled payments to create an invoice.
            </p>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                Assessment Service:{" "}
                <span className="font-medium text-foreground">
                  {schedule.assessmentServiceId}
                </span>
              </span>
              <span>
                Revenue Code: <span className="font-medium text-foreground">1731</span>
              </span>
            </div>
          </div>
        </div>

        <Button variant="outline">
          <ReceiptText className="mr-2 size-4" />
          View assessment
        </Button>
      </div>

      {/* Financial overview */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          icon={<WalletCards className="size-5 text-primary" />}
          iconClassName="bg-primary/10"
          label="Scheduled principal"
          value={formatCurrency(schedule.principalAmount)}
          caption="Total obligation"
        />
        <OverviewCard
          icon={<CalendarClock className="size-5 text-muted-foreground" />}
          iconClassName="bg-muted"
          label="Initial installment"
          value={formatCurrency(schedule.firstInstallmentAmount)}
          caption={`${schedule.firstInstallmentPercentage}% of principal`}
        />
        <OverviewCard
          icon={<Clock3 className="size-5 text-muted-foreground" />}
          iconClassName="bg-muted"
          label="Annual installment"
          value={formatCurrency(schedule.annualInstallmentAmount)}
          caption={`${schedule.paymentCompletionYears} annual payments`}
        />
        <OverviewCard
          icon={<AlertCircle className="size-5 text-amber-600" />}
          iconClassName="bg-amber-500/10"
          label="Outstanding"
          value={formatCurrency(schedule.outstandingAmount)}
          caption="Remaining principal"
        />
      </div>

      {/* Schedule information */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Schedule Information</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                First due date
              </p>
              <p className="mt-1 text-sm font-semibold">{formatDate(schedule.firstDueDate)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Final due date
              </p>
              <p className="mt-1 text-sm font-semibold">{formatDate(schedule.finalDueDate)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Completion period
              </p>
              <p className="mt-1 text-sm font-semibold">
                {schedule.paymentCompletionYears} years
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Installments
              </p>
              <p className="mt-1 text-sm font-semibold">{schedule.installmentCount}</p>
              <p className="text-xs text-muted-foreground">1 initial + 60 annual</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment progress */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Payment Progress</h2>
                <Badge variant="outline">{summary.progress}%</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatCurrency(schedule.paidAmount)} collected from{" "}
                {formatCurrency(schedule.principalAmount)}
              </p>
            </div>
            <div className="w-full lg:w-80">
              <Progress value={summary.progress} className="h-2" />
            </div>
          </div>

          <div className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="mt-1 text-lg font-semibold">{summary.paidCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="mt-1 text-lg font-semibold">{summary.pendingCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(summary.totalRemaining)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Payment — checkout flow */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Create Payment</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Select the scheduled payments the taxpayer wants to settle.
          </p>
        </CardHeader>

        <CardContent className="space-y-4 p-5">
          <QuickSelectionBar
            onSelectNext={selection.selectNext}
            onSelectAllFiltered={() =>
              selection.selectAll(filters.filtered.filter(isSelectable).map((i) => i.id))
            }
            onSelectFullSchedule={() =>
              selection.selectAll(selection.selectable.map((i) => i.id))
            }
            onClear={selection.clear}
            hasSelection={selection.selectedCount > 0}
            isFiltered={filters.search.trim() !== "" || filters.statusFilter !== "all"}
          />

          {selection.selectedCount > 0 && (
            <PaymentCheckoutStrip
              installments={selection.selectedInstallments}
              totalAmount={selection.selectedAmount}
              onReview={openReview}
            />
          )}
        </CardContent>
      </Card>

      {/* Installments table */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base">Payment Installments</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {schedule.installmentCount} installments generated from the approved schedule.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(event) => filters.setSearch(event.target.value)}
                placeholder="Search by number, date, or status…"
                className="h-9 pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <div className="border-b px-5 py-3">
          <Tabs
            value={filters.statusFilter}
            onValueChange={(value) => filters.setStatusFilter(value as StatusFilter)}
          >
            <TabsList>
              <TabsTrigger value="all">
                All
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {schedule.installments.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {summary.pendingCount}
                </span>
              </TabsTrigger>
              <TabsTrigger value="paid">
                Paid
                <span className="ml-1.5 text-xs text-muted-foreground">{summary.paidCount}</span>
              </TabsTrigger>
              <TabsTrigger value="overdue">
                Overdue
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {summary.overdueCount}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        allCurrentPageSelected ? true : somePageSelected ? "indeterminate" : false
                      }
                      onCheckedChange={toggleCurrentPage}
                      aria-label="Select all installments on this page"
                    />
                  </TableHead>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filters.paginated.map((installment) => (
                  <InstallmentRow
                    key={installment.id}
                    installment={installment}
                    schedule={schedule}
                    selected={selection.selectedIds.has(installment.id)}
                    onToggle={() => selection.toggle(installment)}
                  />
                ))}

                {filters.paginated.length === 0 && <EmptyState />}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        <PaginationBar
          currentPage={filters.currentPage}
          totalPages={filters.totalPages}
          totalResults={filters.filtered.length}
          onPageChange={filters.setPage}
        />
      </Card>

      {/* Footer summary */}
      <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>{schedule.installmentCount} total installments</span>

        <div className="flex flex-wrap items-center gap-4">
          <span>Pending: {summary.pendingCount}</span>
          <span>Paid: {summary.paidCount}</span>
          <span>Overdue: {summary.overdueCount}</span>
          {selection.selectedCount > 0 && (
            <span className="font-medium text-foreground">
              Selected: {formatCurrency(selection.selectedAmount)}
            </span>
          )}
        </div>
      </div>

      <PaymentReviewSheet
        open={reviewOpen}
        onOpenChange={handleReviewOpenChange}
        installments={selection.selectedInstallments}
        totalAmount={selection.selectedAmount}
        assessmentServiceId={schedule.assessmentServiceId}
        invoiceState={invoiceState}
        invoiceReference={invoiceReference}
        onRemove={selection.toggle}
        onConfirm={handleConfirmInvoice}
        onDone={handleDoneReview}
      />
    </div>
  );
}