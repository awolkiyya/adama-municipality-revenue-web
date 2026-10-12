"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowDownToLine,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Wallet,
  XCircle,
  ArrowLeft,
  UserRound,
  FileText,
} from "lucide-react";

import {
  useCashReconciliations,
  useCreateCashReconciliation,
  useUpdateCashReconciliation,
  useSubmitCashReconciliation,
  useReviewCashReconciliation,
  useCancelCashReconciliation,
  useCashReconciliation,
} from "@/hooks/use-cash-reconciliations";

import type {
  CashReconciliation,
  CashReconciliationStatus,
  CashReconciliationReviewDecision,
} from "@/types/cash-reconciliation";

import { EthiopianDatePicker } from "@/components/input/EthiopianDatePicker";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ============================================================
// CONSTANTS
// ============================================================

const PAGE_SIZE = 10;

const STATUS_OPTIONS: {
  value: CashReconciliationStatus;
  label: string;
}[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "RECONCILED", label: "Reconciled" },
  { value: "DISCREPANCY", label: "Discrepancy" },
  { value: "RETURNED", label: "Returned" },
  { value: "CANCELLED", label: "Cancelled" },
];

const REVIEW_ACTIONS: {
  value: CashReconciliationReviewDecision;
  label: string;
  description: string;
}[] = [
  {
    value: "RECONCILED",
    label: "Reconcile",
    description:
      "Confirm the closing after the backend validates the reconciliation.",
  },
  {
    value: "DISCREPANCY",
    label: "Flag discrepancy",
    description:
      "Record a shortage or surplus that requires further investigation.",
  },
  {
    value: "RETURNED",
    label: "Return for correction",
    description:
      "Return the closing to the collector for correction or additional evidence.",
  },
];

// ============================================================
// DATE HELPERS
// ============================================================

function toApiDateBoundary(
  date: Date,
  endOfDay = false,
): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const time = endOfDay ? "23:59:59" : "00:00:00";

  return `${year}-${month}-${day} ${time}`;
}

function parseApiDate(
  value: string | null | undefined,
): Date | undefined {
  if (!value) return undefined;

  // Use the date portion to avoid changing the calendar day
  // when parsing timestamps that contain timezone information.
  const datePart = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);

  if (!match) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return undefined;
  }

  return parsed;
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ============================================================
// FORMATTERS
// ============================================================

function formatMoney(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) return "—";

  const date = parseApiDate(value);

  if (!date) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(
  value: string | null | undefined,
): string {
  if (!value) return "—";

  const date = new Date(
    value.includes("T") ? value : value.replace(" ", "T"),
  );

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusLabel(status: CashReconciliationStatus): string {
  return (
    STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status.replaceAll("_", " ")
  );
}

function getStatusVariant(
  status: CashReconciliationStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "RECONCILED":
      return "default";
    case "DISCREPANCY":
      return "destructive";
    case "PENDING_REVIEW":
      return "secondary";
    case "RETURNED":
    case "CANCELLED":
      return "outline";
    case "DRAFT":
    default:
      return "secondary";
  }
}

function getDifferenceLabel(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === "") {
    return "Not recorded";
  }

  const difference = Number(value);

  if (!Number.isFinite(difference)) return "Not recorded";
  if (difference > 0) return "Cash surplus";
  if (difference < 0) return "Cash shortage";

  return "Balanced";
}

function getCollectorName(record: CashReconciliation): string {
  return (
    record.collector?.full_name ||
    record.collector?.name ||
    record.collector?.email ||
    record.collector_id
  );
}

// ============================================================
// ERROR HANDLING
// ============================================================

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
            errors?: Record<string, string[] | string>;
          };
        };
      }
    ).response;

    const data = response?.data;

    if (data?.errors) {
      const firstError = Object.values(data.errors)[0];

      if (Array.isArray(firstError) && firstError.length > 0) {
        return firstError[0];
      }

      if (typeof firstError === "string") return firstError;
    }

    if (data?.message) return data.message;
  }

  if (error instanceof Error) return error.message;

  return "An unexpected error occurred. Please try again.";
}

// ============================================================
// CSV EXPORT
// ============================================================

function downloadCsv(records: CashReconciliation[]): void {
  const headers = [
    "ID",
    "Collector",
    "Collector ID",
    "Period Start",
    "Period End",
    "Expected Amount",
    "Actual Amount",
    "Difference",
    "Difference Type",
    "Status",
    "Submitted At",
    "Reviewed At",
    "Reviewer",
    "Collector Notes",
    "Review Notes",
  ];

  function escapeCsv(value: unknown): string {
    return `"${String(value ?? "").replaceAll('"', '""')}"`;
  }

  const rows = records.map((record) => [
    record.id,
    getCollectorName(record),
    record.collector_id,
    record.period_start,
    record.period_end,
    record.expected_amount,
    record.actual_amount ?? "",
    record.difference_amount ?? "",
    record.difference_type ?? "",
    record.status,
    record.submitted_at ?? "",
    record.reviewed_at ?? "",
    record.reviewer?.full_name ??
      record.reviewer?.name ??
      record.reviewed_by ??
      "",
    record.collector_notes ?? "",
    record.review_notes ?? "",
  ]);

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `cash-reconciliations-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

// ============================================================
// PAGE
// ============================================================

export default function CashReconciliationsPage() {
  const locale = useLocale();

  // List filters
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Sheet state
  const [draftSheetOpen, setDraftSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CashReconciliation | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [submitTarget, setSubmitTarget] =
    useState<CashReconciliation | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);

  const [reviewTarget, setReviewTarget] =
    useState<CashReconciliation | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const [cancelTarget, setCancelTarget] =
    useState<CashReconciliation | null>(null);

  // Draft form
  const [periodStart, setPeriodStart] = useState<Date | undefined>();
  const [periodEnd, setPeriodEnd] = useState<Date | undefined>();
  const [collectorNotes, setCollectorNotes] = useState("");

  // Physical cash count form
  const [actualAmount, setActualAmount] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");

  // Finance review form
  const [reviewDecision, setReviewDecision] =
    useState<CashReconciliationReviewDecision>("RECONCILED");
  const [reviewNotes, setReviewNotes] = useState("");

  // ==========================================================
  // QUERIES
  // ==========================================================

  const filters = useMemo(
    () => ({
      page,
      per_page: PAGE_SIZE,
      ...(statusFilter !== "ALL"
        ? { status: statusFilter as CashReconciliationStatus }
        : {}),
    }),
    [page, statusFilter],
  );

  const {
    data: listResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useCashReconciliations(filters);

  const records = listResponse?.data ?? [];
  const meta = listResponse?.meta;

  const {
    data: detailRecord,
    isLoading: detailLoading,
    isError: detailError,
    refetch: refetchDetail,
  } = useCashReconciliation(detailsOpen ? selectedId : null);

  // ==========================================================
  // MUTATIONS
  // ==========================================================

  const createMutation = useCreateCashReconciliation();
  const updateMutation = useUpdateCashReconciliation();
  const submitMutation = useSubmitCashReconciliation();
  const reviewMutation = useReviewCashReconciliation();
  const cancelMutation = useCancelCashReconciliation();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ==========================================================
  // CLIENT-SIDE SEARCH
  // ==========================================================

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return records;

    return records.filter((record) => {
      const values = [
        String(record.id),
        getCollectorName(record),
        record.collector?.email ?? "",
        record.collector_id,
        record.status,
        record.period_start,
        record.period_end,
      ];

      return values.some((value) =>
        value.toLowerCase().includes(term),
      );
    });
  }, [records, search]);

  // ==========================================================
  // CURRENT-PAGE SUMMARY
  // ==========================================================

  const summary = useMemo(
    () =>
      records.reduce(
        (totals, record) => {
          totals.expected += Number(record.expected_amount ?? 0);

          if (
            record.actual_amount !== null &&
            record.actual_amount !== undefined &&
            record.actual_amount !== ""
          ) {
            const actual = Number(record.actual_amount);

            if (Number.isFinite(actual)) {
              totals.actual += actual;
              totals.countedRecords += 1;
            }
          }

          if (record.status === "PENDING_REVIEW") totals.pending += 1;
          if (record.status === "DISCREPANCY") totals.discrepancies += 1;
          if (record.status === "RECONCILED") totals.reconciled += 1;

          return totals;
        },
        {
          expected: 0,
          actual: 0,
          countedRecords: 0,
          pending: 0,
          discrepancies: 0,
          reconciled: 0,
        },
      ),
    [records],
  );

  // ==========================================================
  // SHEET ACTIONS
  // ==========================================================

  function resetDraftForm(): void {
    setPeriodStart(undefined);
    setPeriodEnd(undefined);
    setCollectorNotes("");
    setEditing(null);
  }

  function openCreateSheet(): void {
    resetDraftForm();
    setDraftSheetOpen(true);
  }

  function openEditSheet(record: CashReconciliation): void {
    setEditing(record);
    setPeriodStart(parseApiDate(record.period_start));
    setPeriodEnd(parseApiDate(record.period_end));
    setCollectorNotes(record.collector_notes ?? "");
    setDraftSheetOpen(true);
  }

  function openDetails(record: CashReconciliation): void {
    setSelectedId(record.id);
    setDetailsOpen(true);
  }

  function openSubmitSheet(record: CashReconciliation): void {
    setSubmitTarget(record);
    setActualAmount("");
    setSubmissionNotes(record.collector_notes ?? "");
    setSubmitOpen(true);
  }

  function openReviewSheet(record: CashReconciliation): void {
    setReviewTarget(record);
    setReviewDecision("RECONCILED");
    setReviewNotes("");
    setReviewOpen(true);
  }

  // ==========================================================
  // CREATE / UPDATE DRAFT
  // ==========================================================

  async function handleSaveDraft(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!periodStart || !periodEnd) {
      toast.error("Select both the closing period start and end.");
      return;
    }

    if (
      Number.isNaN(periodStart.getTime()) ||
      Number.isNaN(periodEnd.getTime())
    ) {
      toast.error("Select valid closing period dates.");
      return;
    }

    if (periodEnd.getTime() < periodStart.getTime()) {
      toast.error("The period end must be on or after the period start.");
      return;
    }

    const payload = {
      period_start: toApiDateBoundary(periodStart),
      period_end: toApiDateBoundary(periodEnd, true),
      collector_notes: collectorNotes.trim() || null,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          payload,
        });

        toast.success("Cash reconciliation draft updated.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Cash reconciliation draft created.");
      }

      setDraftSheetOpen(false);
      resetDraftForm();
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  // ==========================================================
  // SUBMIT PHYSICAL CASH COUNT
  // ==========================================================

  async function handleSubmitClosing(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!submitTarget) return;

    const normalizedAmount = actualAmount.trim();

    if (
      !/^\d+(\.\d{1,2})?$/.test(normalizedAmount) ||
      !Number.isFinite(Number(normalizedAmount))
    ) {
      toast.error(
        "Enter a valid cash amount with no more than two decimal places.",
      );
      return;
    }

    try {
      await submitMutation.mutateAsync({
        id: submitTarget.id,
        payload: {
          actual_amount: normalizedAmount,
          collector_notes: submissionNotes.trim() || null,
        },
      });

      toast.success("Cash closing submitted for review.");
      setSubmitOpen(false);
      setSubmitTarget(null);
      setActualAmount("");
      setSubmissionNotes("");
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  // ==========================================================
  // FINANCE REVIEW
  // ==========================================================

  async function handleReview(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!reviewTarget) return;

    if (reviewDecision !== "RECONCILED" && !reviewNotes.trim()) {
      toast.error(
        "Review notes are required for a discrepancy or return.",
      );
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: reviewTarget.id,
        payload: {
          decision: reviewDecision,
          review_notes: reviewNotes.trim() || null,
        },
      });

      toast.success("Cash reconciliation review completed.");
      setReviewOpen(false);
      setReviewTarget(null);
      setReviewNotes("");
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  // ==========================================================
  // CANCEL
  // ==========================================================

  async function handleCancel(): Promise<void> {
    if (!cancelTarget) return;

    try {
      await cancelMutation.mutateAsync(cancelTarget.id);
      toast.success("Cash reconciliation cancelled.");
      setCancelTarget(null);
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  // ==========================================================
  // EXPORT / PAGINATION
  // ==========================================================

  function handleExport(): void {
    if (filteredRecords.length === 0) {
      toast.error("There are no records to export on this page.");
      return;
    }

    downloadCsv(filteredRecords);
    toast.success("CSV export generated.");
  }

  const currentPage = meta?.current_page ?? page;
  const lastPage = meta?.last_page ?? 1;
  const total = meta?.total ?? records.length;
  const visibleDetail = detailRecord;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <ClipboardCheck className="size-6" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight">
              Cash Reconciliation
            </h1>
          </div>

          <p className="max-w-2xl text-sm text-muted-foreground">
            Record physical cash counts, submit daily closings, and review
            differences between expected and actual cash.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filteredRecords.length === 0}
          >
            <ArrowDownToLine className="mr-2 size-4" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-4" />
            )}
            Refresh
          </Button>

          <Button onClick={openCreateSheet}>
            <Plus className="mr-2 size-4" />
            New Closing
          </Button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Expected Cash</p>
              <p className="text-xl font-bold">
                {formatMoney(summary.expected)}
              </p>
              <p className="text-xs text-muted-foreground">Current page</p>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-3 text-blue-600">
              <Wallet className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Counted Cash</p>
              <p className="text-xl font-bold">
                {formatMoney(summary.actual)}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.countedRecords} recorded count
                {summary.countedRecords === 1 ? "" : "s"}
              </p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-600">
              <Banknote className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-xl font-bold">{summary.pending}</p>
              <p className="text-xs text-muted-foreground">
                Awaiting finance review
              </p>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-3 text-amber-600">
              <Clock3 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Discrepancies</p>
              <p className="text-xl font-bold">{summary.discrepancies}</p>
              <p className="text-xs text-muted-foreground">
                Require investigation
              </p>
            </div>
            <div className="rounded-lg bg-destructive/10 p-3 text-destructive">
              <AlertCircle className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RECONCILIATION TABLE */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Reconciliation Records</CardTitle>
          <CardDescription>
            Track closing periods, amounts, and workflow status.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search collector, ID, or status..."
                className="pl-9"
              />
            </div>

            <div className="w-full md:w-56">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isError && (
            <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{getErrorMessage(error)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                Try again
              </Button>
            </div>
          )}

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Closing</TableHead>
                  <TableHead>Collector</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-36 text-center">
                      <Loader2 className="mx-auto mb-2 size-5 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Loading reconciliations...
                      </span>
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-36 text-center">
                      <ClipboardCheck className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                      <p className="font-medium">No reconciliations found</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Adjust the filters or create a new closing.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => {
                    const difference =
                      record.difference_amount == null
                        ? null
                        : Number(record.difference_amount);

                    const isEditable =
                      record.status === "DRAFT" ||
                      record.status === "RETURNED";

                    const canReview =
                      record.status === "PENDING_REVIEW" ||
                      record.status === "DISCREPANCY";

                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="font-medium">#{record.id}</div>
                          <div className="text-xs text-muted-foreground">
                            Created {formatDateTime(record.created_at)}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-medium">
                            {getCollectorName(record)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {record.collector?.email ?? record.collector_id}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-start gap-2">
                            <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                            <div className="space-y-1 text-xs">
                              <div>
                                <span className="text-muted-foreground">
                                  From:{" "}
                                </span>
                                {formatDate(record.period_start)}
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  To:{" "}
                                </span>
                                {formatDate(record.period_end)}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-medium tabular-nums">
                          {formatMoney(record.expected_amount)}
                        </TableCell>

                        <TableCell className="text-right font-medium tabular-nums">
                          {record.actual_amount == null
                            ? "—"
                            : formatMoney(record.actual_amount)}
                        </TableCell>

                        <TableCell className="text-right">
                          {difference === null ||
                          !Number.isFinite(difference) ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <div>
                              <span
                                className={
                                  difference === 0
                                    ? "font-medium text-emerald-600"
                                    : "font-medium text-destructive"
                                }
                              >
                                {formatMoney(record.difference_amount)}
                              </span>
                              <div className="text-xs text-muted-foreground">
                                {getDifferenceLabel(record.difference_amount)}
                              </div>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge variant={getStatusVariant(record.status)}>
                            {getStatusLabel(record.status)}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title="View details"
                              aria-label={`View closing ${record.id}`}
                              onClick={() => openDetails(record)}
                            >
                              <Eye className="size-4" />
                            </Button>

                            {isEditable && (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  title="Edit draft"
                                  aria-label={`Edit closing ${record.id}`}
                                  onClick={() => openEditSheet(record)}
                                >
                                  <RefreshCw className="size-4" />
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  title="Submit cash count"
                                  aria-label={`Submit closing ${record.id}`}
                                  onClick={() => openSubmitSheet(record)}
                                >
                                  <CheckCircle2 className="size-4" />
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  title="Cancel closing"
                                  aria-label={`Cancel closing ${record.id}`}
                                  onClick={() => setCancelTarget(record)}
                                >
                                  <XCircle className="size-4 text-destructive" />
                                </Button>
                              </>
                            )}

                            {canReview && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openReviewSheet(record)}
                              >
                                <ShieldCheck className="mr-1 size-4" />
                                Review
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredRecords.length} record
              {filteredRecords.length === 1 ? "" : "s"} on this page of{" "}
              {total} total
            </p>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {lastPage}
              </span>

              <Button
                variant="outline"
                size="icon"
                aria-label="Previous page"
                disabled={currentPage <= 1 || isFetching}
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
              >
                <ChevronLeft className="size-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                aria-label="Next page"
                disabled={currentPage >= lastPage || isFetching}
                onClick={() =>
                  setPage((current) => Math.min(lastPage, current + 1))
                }
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Summary amounts represent the current page only. Search filters
            the records currently loaded from the server.
          </p>
        </CardContent>
      </Card>

      {/* ======================================================
          CREATE / EDIT SHEET
      ====================================================== */}

      <Sheet
        open={draftSheetOpen}
        onOpenChange={(open) => {
          if (isSaving) return;

          setDraftSheetOpen(open);

          if (!open) resetDraftForm();
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
        >
          <SheetHeader className="border-b px-5 py-5 text-left sm:px-6">
            <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="size-5" />
            </div>

            <SheetTitle className="text-xl">
              {editing ? "Edit Cash Closing" : "Create Cash Closing"}
            </SheetTitle>

            <SheetDescription>
              Define the period to reconcile. Expected cash is calculated by
              the backend when the closing is submitted.
            </SheetDescription>

            {editing && (
              <Badge variant="outline" className="mt-2 w-fit">
                Editing closing #{editing.id}
              </Badge>
            )}
          </SheetHeader>

          <form
            onSubmit={handleSaveDraft}
            className="flex flex-1 flex-col"
          >
            <div className="flex-1 space-y-6 px-5 py-6 sm:px-6">
              <div className="space-y-2">
                <Label>Period Start · Ethiopian Calendar</Label>
                <EthiopianDatePicker
                  value={periodStart}
                  onChange={(date) => {
                    setPeriodStart(date);

                    if (
                      periodEnd &&
                      date.getTime() > periodEnd.getTime()
                    ) {
                      setPeriodEnd(undefined);
                    }
                  }}
                  placeholder="Select start date"
                  disabled={isSaving}
                  searchable
                  showTime
                  timeFormat="12h"
                />
                <p className="text-xs text-muted-foreground">
                  Start boundary: 00:00:00.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Period End · Ethiopian Calendar</Label>
                <EthiopianDatePicker
                  value={periodEnd}
                  onChange={setPeriodEnd}
                  placeholder="Select end date"
                  disabled={isSaving}
                  searchable
                  showTime
                  timeFormat="12h"
                />
                <p className="text-xs text-muted-foreground">
                  End boundary: 23:59:59, including the selected day.
                </p>
              </div>

              {periodStart &&
                periodEnd &&
                periodEnd.getTime() < periodStart.getTime() && (
                  <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <p>
                      The period end must be on or after the period start.
                    </p>
                  </div>
                )}

              {periodStart &&
                periodEnd &&
                sameCalendarDay(periodStart, periodEnd) && (
                  <div className="flex gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      This closing covers the entire selected calendar day.
                    </p>
                  </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="collector_notes">Collector Notes</Label>
                <Textarea
                  id="collector_notes"
                  value={collectorNotes}
                  onChange={(event) => setCollectorNotes(event.target.value)}
                  placeholder="Add relevant notes for this closing..."
                  rows={5}
                  maxLength={5000}
                  disabled={isSaving}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {collectorNotes.length}/5000
                </p>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Financial control
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Saving creates or updates a draft only. The server
                      calculates expected cash from eligible completed cash
                      payments during submission.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <SheetFooter className="sticky bottom-0 border-t bg-background px-5 py-4 sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraftSheetOpen(false);
                  resetDraftForm();
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isSaving}>
                {isSaving && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {editing ? "Save Changes" : "Create Draft"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* ======================================================
          SUBMIT CASH COUNT SHEET
      ====================================================== */}

      <Sheet
        open={submitOpen}
        onOpenChange={(open) => {
          if (submitMutation.isPending) return;

          setSubmitOpen(open);

          if (!open) setSubmitTarget(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
        >
          <SheetHeader className="border-b px-5 py-5 text-left sm:px-6">
            <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Banknote className="size-5" />
            </div>

            <SheetTitle className="text-xl">
              Submit Cash Closing
            </SheetTitle>

            <SheetDescription>
              Enter the physical cash counted and submit the closing for
              finance review.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleSubmitClosing}
            className="flex flex-1 flex-col"
          >
            <div className="flex-1 space-y-6 px-5 py-6 sm:px-6">
              {submitTarget && (
                <>
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Closing reference
                        </p>
                        <p className="text-lg font-bold">
                          #{submitTarget.id}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(submitTarget.status)}>
                        {getStatusLabel(submitTarget.status)}
                      </Badge>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <p className="text-sm text-muted-foreground">
                        Previously recorded expected cash
                      </p>
                      <p className="mt-1 text-2xl font-bold tabular-nums">
                        {formatMoney(submitTarget.expected_amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-lg border bg-muted/30 p-3">
                    <AlertCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      The backend recalculates expected cash using eligible
                      completed cash payments. The displayed amount is
                      informational and is not used as the submitted total.
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="actual_amount">
                  Physical Cash Count (ETB) *
                </Label>
                <Input
                  id="actual_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={actualAmount}
                  onChange={(event) => setActualAmount(event.target.value)}
                  placeholder="0.00"
                  required
                  disabled={submitMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the amount physically counted. Use up to two decimal
                  places.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="submission_notes">Closing Notes</Label>
                <Textarea
                  id="submission_notes"
                  value={submissionNotes}
                  onChange={(event) => setSubmissionNotes(event.target.value)}
                  placeholder="Explain relevant closing details or cash differences..."
                  rows={5}
                  maxLength={5000}
                  disabled={submitMutation.isPending}
                />
              </div>
            </div>

            <SheetFooter className="sticky bottom-0 border-t bg-background px-5 py-4 sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSubmitOpen(false)}
                disabled={submitMutation.isPending}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={submitMutation.isPending || !submitTarget}
              >
                {submitMutation.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Submit for Review
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* ======================================================
          FINANCE REVIEW SHEET
      ====================================================== */}

      <Sheet
        open={reviewOpen}
        onOpenChange={(open) => {
          if (reviewMutation.isPending) return;

          setReviewOpen(open);

          if (!open) setReviewTarget(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
        >
          <SheetHeader className="border-b px-5 py-5 text-left sm:px-6">
            <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>

            <SheetTitle className="text-xl">
              Review Cash Closing
            </SheetTitle>

            <SheetDescription>
              Verify the submitted figures and record the finance review
              decision.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleReview} className="flex flex-1 flex-col">
            <div className="flex-1 space-y-6 px-5 py-6 sm:px-6">
              {reviewTarget && (
                <div className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Closing reference
                      </p>
                      <p className="text-lg font-bold">
                        #{reviewTarget.id}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(reviewTarget.status)}>
                      {getStatusLabel(reviewTarget.status)}
                    </Badge>
                  </div>

                  <div className="mt-4 divide-y border-t">
                    <div className="flex justify-between gap-4 py-3 text-sm">
                      <span className="text-muted-foreground">
                        Expected cash
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatMoney(reviewTarget.expected_amount)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 py-3 text-sm">
                      <span className="text-muted-foreground">
                        Physical cash counted
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatMoney(reviewTarget.actual_amount)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 py-3 text-sm">
                      <span className="text-muted-foreground">
                        Difference
                      </span>
                      <span
                        className={
                          reviewTarget.difference_amount != null &&
                          Number(reviewTarget.difference_amount) === 0
                            ? "font-bold text-emerald-600"
                            : "font-bold text-destructive"
                        }
                      >
                        {formatMoney(reviewTarget.difference_amount)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {getDifferenceLabel(reviewTarget.difference_amount)}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="review_decision">Review Decision *</Label>
                <Select
                  value={reviewDecision}
                  onValueChange={(value) =>
                    setReviewDecision(
                      value as CashReconciliationReviewDecision,
                    )
                  }
                  disabled={reviewMutation.isPending}
                >
                  <SelectTrigger id="review_decision">
                    <SelectValue placeholder="Choose a decision" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVIEW_ACTIONS.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  {
                    REVIEW_ACTIONS.find(
                      (action) => action.value === reviewDecision,
                    )?.description
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review_notes">
                  Review Notes
                  {reviewDecision !== "RECONCILED" && (
                    <span className="text-destructive"> *</span>
                  )}
                </Label>
                <Textarea
                  id="review_notes"
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  placeholder="Record findings, reasons, or corrective actions..."
                  rows={5}
                  maxLength={5000}
                  required={reviewDecision !== "RECONCILED"}
                  disabled={reviewMutation.isPending}
                />
              </div>

              {reviewDecision === "RECONCILED" && (
                <div className="flex gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                  <p className="text-muted-foreground">
                    The backend remains responsible for validating whether
                    this closing can be finalized.
                  </p>
                </div>
              )}

              {reviewDecision === "DISCREPANCY" && (
                <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                  <p className="text-muted-foreground">
                    Record the reason for the discrepancy and any required
                    follow-up.
                  </p>
                </div>
              )}
            </div>

            <SheetFooter className="sticky bottom-0 border-t bg-background px-5 py-4 sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReviewOpen(false)}
                disabled={reviewMutation.isPending}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={reviewMutation.isPending || !reviewTarget}
                variant={
                  reviewDecision === "DISCREPANCY"
                    ? "destructive"
                    : "default"
                }
              >
                {reviewMutation.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Submit Decision
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* ======================================================
          DETAILS SHEET
      ====================================================== */}

      <Sheet
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);

          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-2xl"
        >
          <SheetHeader className="border-b px-5 py-5 text-left sm:px-6">
            <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <SheetTitle className="text-xl">
              Cash Reconciliation Details
            </SheetTitle>
            <SheetDescription>
              Closing information, financial totals, and review history.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 px-5 py-6 sm:px-6">
            {detailLoading ? (
              <div className="flex min-h-48 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : detailError || !visibleDetail ? (
              <div className="space-y-3 rounded-lg border border-destructive/30 p-4">
                <p className="text-sm text-destructive">
                  Unable to load reconciliation details.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void refetchDetail()}
                >
                  Try again
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Reconciliation ID
                    </p>
                    <p className="text-2xl font-bold">
                      #{visibleDetail.id}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(visibleDetail.status)}>
                    {getStatusLabel(visibleDetail.status)}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UserRound className="size-4" />
                      <p className="text-sm">Collector</p>
                    </div>
                    <p className="mt-2 font-semibold">
                      {getCollectorName(visibleDetail)}
                    </p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {visibleDetail.collector?.email ??
                        visibleDetail.collector_id}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="size-4" />
                      <p className="text-sm">Closing Period</p>
                    </div>
                    <p className="mt-2 text-sm font-medium">
                      From: {formatDate(visibleDetail.period_start)}
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      To: {formatDate(visibleDetail.period_end)}
                    </p>
                  </div>
                </div>

                <section className="space-y-3">
                  <h3 className="font-semibold">Financial Summary</h3>
                  <div className="divide-y rounded-xl border">
                    <div className="flex justify-between gap-4 p-4 text-sm">
                      <span className="text-muted-foreground">
                        Expected cash
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatMoney(visibleDetail.expected_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 p-4 text-sm">
                      <span className="text-muted-foreground">
                        Physical cash counted
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatMoney(visibleDetail.actual_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 p-4 text-sm">
                      <span className="text-muted-foreground">Difference</span>
                      <span
                        className={
                          visibleDetail.difference_amount != null &&
                          Number(visibleDetail.difference_amount) === 0
                            ? "font-bold text-emerald-600"
                            : "font-bold text-destructive"
                        }
                      >
                        {formatMoney(visibleDetail.difference_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 p-4 text-sm">
                      <span className="text-muted-foreground">Result</span>
                      <span className="font-medium">
                        {getDifferenceLabel(visibleDetail.difference_amount)}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold">Collector Notes</h3>
                  <div className="rounded-xl border p-4 text-sm whitespace-pre-wrap">
                    {visibleDetail.collector_notes || (
                      <span className="text-muted-foreground">
                        No collector notes provided.
                      </span>
                    )}
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="font-semibold">Submission and Review</h3>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border p-4">
                      <p className="text-xs text-muted-foreground">
                        Submitted At
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {formatDateTime(visibleDetail.submitted_at)}
                      </p>
                    </div>

                    <div className="rounded-xl border p-4">
                      <p className="text-xs text-muted-foreground">
                        Reviewed At
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {formatDateTime(visibleDetail.reviewed_at)}
                      </p>
                    </div>

                    <div className="rounded-xl border p-4 sm:col-span-2">
                      <p className="text-xs text-muted-foreground">
                        Reviewer
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {visibleDetail.reviewer?.full_name ??
                          visibleDetail.reviewer?.name ??
                          visibleDetail.reviewed_by ??
                          "Not reviewed"}
                      </p>
                    </div>

                    <div className="rounded-xl border p-4 sm:col-span-2">
                      <p className="text-xs text-muted-foreground">
                        Review Notes
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {visibleDetail.review_notes || "No review notes."}
                      </p>
                    </div>
                  </div>
                </section>

                <div className="border-t pt-4 text-xs text-muted-foreground">
                  <p>Created: {formatDateTime(visibleDetail.created_at)}</p>
                  <p className="mt-1">
                    Updated: {formatDateTime(visibleDetail.updated_at)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {visibleDetail && !detailLoading && !detailError && (
            <SheetFooter className="sticky bottom-0 border-t bg-background px-5 py-4 sm:px-6">
              {(visibleDetail.status === "DRAFT" ||
                visibleDetail.status === "RETURNED") && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDetailsOpen(false);
                      openEditSheet(visibleDetail);
                    }}
                  >
                    <RefreshCw className="mr-2 size-4" />
                    Edit Draft
                  </Button>
                  <Button
                    onClick={() => {
                      setDetailsOpen(false);
                      openSubmitSheet(visibleDetail);
                    }}
                  >
                    <CheckCircle2 className="mr-2 size-4" />
                    Submit Closing
                  </Button>
                </>
              )}

              {(visibleDetail.status === "PENDING_REVIEW" ||
                visibleDetail.status === "DISCREPANCY") && (
                <Button
                  onClick={() => {
                    setDetailsOpen(false);
                    openReviewSheet(visibleDetail);
                  }}
                >
                  <ShieldCheck className="mr-2 size-4" />
                  Review Closing
                </Button>
              )}
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* ======================================================
          CANCEL CONFIRMATION
      ====================================================== */}

      <AlertDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open && !cancelMutation.isPending) {
            setCancelTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Cash Closing?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget
                ? `You are about to cancel closing #${cancelTarget.id}. Only eligible drafts or returned closings can be cancelled.`
                : "Only eligible drafts or returned closings can be cancelled."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>
              Keep Closing
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleCancel();
              }}
              disabled={cancelMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Cancel Closing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="text-center text-xs text-muted-foreground">
        Cash reconciliation · {locale.toUpperCase()}
      </p>
    </div>
  );
}
