
"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";
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
  CashReconciliationReviewAction,
} from "@/types/cash-reconciliation";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

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
  value: CashReconciliationReviewAction;
  label: string;
  description: string;
}[] = [
  {
    value: "RECONCILE",
    label: "Reconcile",
    description: "Approve a balanced cash closing.",
  },
  {
    value: "FLAG_DISCREPANCY",
    label: "Flag discrepancy",
    description: "Flag a cash shortage or overage for investigation.",
  },
  {
    value: "RETURN",
    label: "Return for correction",
    description: "Return the closing to the collector for correction.",
  },
];

function formatMoney(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "ETB 0.00";
  }

  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 16);
  }

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}

function getStatusLabel(status: CashReconciliationStatus) {
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
      return "outline";

    case "CANCELLED":
      return "outline";

    default:
      return "secondary";
  }
}

function getDifferenceLabel(value: string | number | null) {
  const difference = Number(value ?? 0);

  if (difference > 0) return "Cash surplus";
  if (difference < 0) return "Cash shortage";

  return "Balanced";
}

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

      if (typeof firstError === "string") {
        return firstError;
      }
    }

    if (data?.message) {
      return data.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

function downloadCsv(records: CashReconciliation[]) {
  const headers = [
    "ID",
    "Collector",
    "Period Start",
    "Period End",
    "Expected Amount",
    "Actual Amount",
    "Difference",
    "Status",
    "Submitted At",
    "Reviewed At",
  ];

  const escapeCsv = (value: unknown) => {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
  };

  const rows = records.map((record) => [
    record.id,
    record.collector?.name ?? record.collector_id,
    record.period_start,
    record.period_end,
    record.expected_amount,
    record.actual_amount ?? "",
    record.difference_amount ?? "",
    record.status,
    record.submitted_at ?? "",
    record.reviewed_at ?? "",
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

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function CashReconciliationsPage() {
  const locale = useLocale();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
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

  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [collectorNotes, setCollectorNotes] = useState("");

  const [actualAmount, setActualAmount] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");

  const [reviewAction, setReviewAction] =
    useState<CashReconciliationReviewAction>("RECONCILE");
  const [reviewNotes, setReviewNotes] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Queries
  |--------------------------------------------------------------------------
  */

  const filters = useMemo(
    () => ({
      page,
      per_page: PAGE_SIZE,
      ...(statusFilter !== "ALL"
        ? {
            status: statusFilter as CashReconciliationStatus,
          }
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
  } = useCashReconciliation(
    detailsOpen ? selectedId : null,
  );

  /*
  |--------------------------------------------------------------------------
  | Mutations
  |--------------------------------------------------------------------------
  */

  const createMutation = useCreateCashReconciliation();
  const updateMutation = useUpdateCashReconciliation();
  const submitMutation = useSubmitCashReconciliation();
  const reviewMutation = useReviewCashReconciliation();
  const cancelMutation = useCancelCashReconciliation();

  const isSaving =
    createMutation.isPending || updateMutation.isPending;

  /*
  |--------------------------------------------------------------------------
  | Client-side Search
  |--------------------------------------------------------------------------
  */

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return records;

    return records.filter((record) => {
      const values = [
        String(record.id),
        record.collector?.name ?? "",
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

  /*
  |--------------------------------------------------------------------------
  | Summary Cards
  |--------------------------------------------------------------------------
  |
  | These totals are calculated from the currently loaded page only.
  | They are not system-wide financial totals.
  |--------------------------------------------------------------------------
  */

  const summary = useMemo(() => {
    return records.reduce(
      (totals, record) => {
        totals.expected += Number(record.expected_amount ?? 0);
        totals.actual += Number(record.actual_amount ?? 0);

        if (record.status === "PENDING_REVIEW") {
          totals.pending += 1;
        }

        if (record.status === "DISCREPANCY") {
          totals.discrepancies += 1;
        }

        if (record.status === "RECONCILED") {
          totals.reconciled += 1;
        }

        return totals;
      },
      {
        expected: 0,
        actual: 0,
        pending: 0,
        discrepancies: 0,
        reconciled: 0,
      },
    );
  }, [records]);

  /*
  |--------------------------------------------------------------------------
  | Dialog Actions
  |--------------------------------------------------------------------------
  */

  function resetDraftForm() {
    setPeriodStart("");
    setPeriodEnd("");
    setCollectorNotes("");
    setEditing(null);
  }

  function openCreateDialog() {
    resetDraftForm();
    setCreateOpen(true);
  }

  function openEditDialog(record: CashReconciliation) {
    setEditing(record);
    setPeriodStart(toDateTimeLocal(record.period_start));
    setPeriodEnd(toDateTimeLocal(record.period_end));
    setCollectorNotes(record.collector_notes ?? "");
    setCreateOpen(true);
  }

  function openDetails(record: CashReconciliation) {
    setSelectedId(record.id);
    setDetailsOpen(true);
  }

  function openSubmitDialog(record: CashReconciliation) {
    setSubmitTarget(record);
    setActualAmount("");
    setSubmissionNotes(record.collector_notes ?? "");
    setSubmitOpen(true);
  }

  function openReviewDialog(record: CashReconciliation) {
    setReviewTarget(record);
    setReviewAction("RECONCILE");
    setReviewNotes("");
    setReviewOpen(true);
  }

  /*
  |--------------------------------------------------------------------------
  | Create / Update
  |--------------------------------------------------------------------------
  */

  async function handleSaveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!periodStart || !periodEnd) {
      toast.error("Select both the closing period start and end.");
      return;
    }

    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      toast.error("Enter valid closing period dates.");
      return;
    }

    if (end <= start) {
      toast.error("The period end must be later than the period start.");
      return;
    }

    const payload = {
      period_start: periodStart.replace("T", " ") + ":00",
      period_end: periodEnd.replace("T", " ") + ":00",
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

      setCreateOpen(false);
      resetDraftForm();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Submit Physical Cash Count
  |--------------------------------------------------------------------------
  */

  async function handleSubmitClosing(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!submitTarget) return;

    if (
      actualAmount.trim() === "" ||
      !Number.isFinite(Number(actualAmount)) ||
      Number(actualAmount) < 0
    ) {
      toast.error("Enter a valid physical cash amount.");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        id: submitTarget.id,
        payload: {
          actual_amount: Number(actualAmount),
          collector_notes: submissionNotes.trim() || null,
        },
      });

      toast.success("Cash closing submitted for review.");

      setSubmitOpen(false);
      setSubmitTarget(null);
      setActualAmount("");
      setSubmissionNotes("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Finance Review
  |--------------------------------------------------------------------------
  */

  async function handleReview(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!reviewTarget) return;

    if (
      reviewAction !== "RECONCILE" &&
      !reviewNotes.trim()
    ) {
      toast.error(
        "Enter review notes when flagging a discrepancy or returning a closing.",
      );
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: reviewTarget.id,
        payload: {
          action: reviewAction,
          review_notes: reviewNotes.trim() || null,
        },
      });

      toast.success("Cash reconciliation review completed.");

      setReviewOpen(false);
      setReviewTarget(null);
      setReviewNotes("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Cancel
  |--------------------------------------------------------------------------
  */

  async function handleCancel() {
    if (!cancelTarget) return;

    try {
      await cancelMutation.mutateAsync(cancelTarget.id);

      toast.success("Cash reconciliation cancelled.");
      setCancelTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Export
  |--------------------------------------------------------------------------
  */

  function handleExport() {
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

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
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

          <p className="text-sm text-muted-foreground">
            Record physical cash counts, submit daily closings, and
            review differences between expected and actual cash.
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

          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 size-4" />
            New Closing
          </Button>
        </div>
      </div>

      {/* Financial and Workflow Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Expected Cash
              </p>

              <p className="text-xl font-bold">
                {formatMoney(summary.expected)}
              </p>

              <p className="text-xs text-muted-foreground">
                Current page
              </p>
            </div>

            <div className="rounded-lg bg-blue-500/10 p-3 text-blue-600">
              <Wallet className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Counted Cash
              </p>

              <p className="text-xl font-bold">
                {formatMoney(summary.actual)}
              </p>

              <p className="text-xs text-muted-foreground">
                Submitted physical counts
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
              <p className="text-sm text-muted-foreground">
                Pending Review
              </p>

              <p className="text-xl font-bold">
                {summary.pending}
              </p>

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
              <p className="text-sm text-muted-foreground">
                Discrepancies
              </p>

              <p className="text-xl font-bold">
                {summary.discrepancies}
              </p>

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

      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Reconciliation Records
          </CardTitle>

          <CardDescription>
            Review cash closings and manage their workflow status.
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
                  <SelectItem value="ALL">
                    All statuses
                  </SelectItem>

                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                    >
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

                <span>
                  {getErrorMessage(error)}
                </span>
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
                  <TableHead className="text-right">
                    Expected
                  </TableHead>
                  <TableHead className="text-right">
                    Actual
                  </TableHead>
                  <TableHead className="text-right">
                    Difference
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-36 text-center"
                    >
                      <Loader2 className="mx-auto mb-2 size-5 animate-spin text-muted-foreground" />

                      <span className="text-sm text-muted-foreground">
                        Loading reconciliations...
                      </span>
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-36 text-center"
                    >
                      <ClipboardCheck className="mx-auto mb-2 size-8 text-muted-foreground/50" />

                      <p className="font-medium">
                        No reconciliations found
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Try changing your filters or create a new closing.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => {
                    const difference = Number(
                      record.difference_amount ?? 0,
                    );

                    const isEditable =
                      record.status === "DRAFT" ||
                      record.status === "RETURNED";

                    const canReview =
                      record.status === "PENDING_REVIEW" ||
                      record.status === "DISCREPANCY";

                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="font-medium">
                            #{record.id}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Created {formatDate(record.created_at)}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-medium">
                            {record.collector?.name ??
                              "Collector"}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {record.collector?.email ??
                              record.collector_id}
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
                          {record.actual_amount === null
                            ? "—"
                            : formatMoney(record.actual_amount)}
                        </TableCell>

                        <TableCell className="text-right">
                          {record.difference_amount === null ? (
                            <span className="text-muted-foreground">
                              —
                            </span>
                          ) : (
                            <div>
                              <span
                                className={
                                  difference === 0
                                    ? "font-medium text-emerald-600"
                                    : "font-medium text-destructive"
                                }
                              >
                                {formatMoney(
                                  record.difference_amount,
                                )}
                              </span>

                              <div className="text-xs text-muted-foreground">
                                {getDifferenceLabel(
                                  record.difference_amount,
                                )}
                              </div>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={getStatusVariant(record.status)}
                          >
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
                                  onClick={() =>
                                    openEditDialog(record)
                                  }
                                >
                                  <RefreshCw className="size-4" />
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  title="Submit cash count"
                                  onClick={() =>
                                    openSubmitDialog(record)
                                  }
                                >
                                  <CheckCircle2 className="size-4" />
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  title="Cancel closing"
                                  onClick={() =>
                                    setCancelTarget(record)
                                  }
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
                                onClick={() =>
                                  openReviewDialog(record)
                                }
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

          {/* Pagination */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredRecords.length} on this page
              {typeof meta?.total === "number"
                ? ` of ${meta.total} records`
                : ""}
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
                  setPage((current) =>
                    Math.min(lastPage, current + 1),
                  )
                }
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {total} total record{total === 1 ? "" : "s"}.
            Summary amounts above reflect only the currently loaded page.
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Draft Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);

          if (!open) resetDraftForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Update Cash Closing" : "New Cash Closing"}
            </DialogTitle>

            <DialogDescription>
              Define the closing period. Expected cash is calculated by
              the backend when the closing is submitted.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDraft} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="period_start">
                Period Start
              </Label>

              <Input
                id="period_start"
                type="datetime-local"
                value={periodStart}
                onChange={(event) =>
                  setPeriodStart(event.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period_end">
                Period End
              </Label>

              <Input
                id="period_end"
                type="datetime-local"
                value={periodEnd}
                onChange={(event) =>
                  setPeriodEnd(event.target.value)
                }
                min={periodStart || undefined}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="collector_notes">
                Collector Notes
              </Label>

              <Textarea
                id="collector_notes"
                value={collectorNotes}
                onChange={(event) =>
                  setCollectorNotes(event.target.value)
                }
                placeholder="Optional closing notes..."
                rows={3}
                maxLength={5000}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Submit Physical Cash Count Dialog */}
      <Dialog
        open={submitOpen}
        onOpenChange={(open) => {
          setSubmitOpen(open);

          if (!open) setSubmitTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Cash Closing</DialogTitle>

            <DialogDescription>
              {submitTarget
                ? `Closing #${submitTarget.id}. Enter the physical cash counted before submitting for finance review.`
                : "Enter the physical cash counted before submitting for finance review."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmitClosing}
            className="space-y-4"
          >
            {submitTarget && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Expected cash
                  </span>

                  <span className="font-semibold">
                    {formatMoney(submitTarget.expected_amount)}
                  </span>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  The backend recalculates expected cash from eligible
                  completed cash payments during submission.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="actual_amount">
                Physical Cash Count (ETB)
              </Label>

              <Input
                id="actual_amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={actualAmount}
                onChange={(event) =>
                  setActualAmount(event.target.value)
                }
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="submission_notes">
                Closing Notes
              </Label>

              <Textarea
                id="submission_notes"
                value={submissionNotes}
                onChange={(event) =>
                  setSubmissionNotes(event.target.value)
                }
                placeholder="Explain any relevant closing details..."
                rows={3}
                maxLength={5000}
              />
            </div>

            <DialogFooter>
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
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}

                Submit for Review
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Finance Review Dialog */}
      <Dialog
        open={reviewOpen}
        onOpenChange={(open) => {
          setReviewOpen(open);

          if (!open) setReviewTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Cash Closing</DialogTitle>

            <DialogDescription>
              {reviewTarget
                ? `Review closing #${reviewTarget.id}. Confirm the amounts and record your decision.`
                : "Confirm the amounts and record your decision."}
            </DialogDescription>
          </DialogHeader>

          {reviewTarget && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">
                  Expected cash
                </span>

                <span className="font-semibold">
                  {formatMoney(reviewTarget.expected_amount)}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">
                  Actual cash
                </span>

                <span className="font-semibold">
                  {formatMoney(reviewTarget.actual_amount)}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-t pt-3 text-sm">
                <span className="text-muted-foreground">
                  Difference
                </span>

                <span
                  className={
                    Number(reviewTarget.difference_amount ?? 0) === 0
                      ? "font-bold text-emerald-600"
                      : "font-bold text-destructive"
                  }
                >
                  {formatMoney(reviewTarget.difference_amount)}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                {getDifferenceLabel(reviewTarget.difference_amount)}
              </p>
            </div>
          )}

          <form onSubmit={handleReview} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="review_action">
                Review Decision
              </Label>

              <Select
                value={reviewAction}
                onValueChange={(value) =>
                  setReviewAction(
                    value as CashReconciliationReviewAction,
                  )
                }
              >
                <SelectTrigger id="review_action">
                  <SelectValue placeholder="Choose an action" />
                </SelectTrigger>

                <SelectContent>
                  {REVIEW_ACTIONS.map((action) => (
                    <SelectItem
                      key={action.value}
                      value={action.value}
                    >
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">
                {
                  REVIEW_ACTIONS.find(
                    (action) => action.value === reviewAction,
                  )?.description
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review_notes">
                Review Notes
                {reviewAction !== "RECONCILE" && (
                  <span className="text-destructive"> *</span>
                )}
              </Label>

              <Textarea
                id="review_notes"
                value={reviewNotes}
                onChange={(event) =>
                  setReviewNotes(event.target.value)
                }
                placeholder="Enter your review findings..."
                rows={4}
                maxLength={5000}
                required={reviewAction !== "RECONCILE"}
              />
            </div>

            {reviewAction === "RECONCILE" && (
              <div className="flex gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />

                <p>
                  Reconciliation should only be approved when the
                  closing satisfies your backend's balance and review
                  requirements.
                </p>
              </div>
            )}

            <DialogFooter>
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
                disabled={reviewMutation.isPending}
                variant={
                  reviewAction === "FLAG_DISCREPANCY"
                    ? "destructive"
                    : "default"
                }
              >
                {reviewMutation.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}

                Submit Decision
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);

          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Cash Reconciliation Details
            </DialogTitle>

            <DialogDescription>
              Detailed closing information, amounts, and review history.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : detailError || !visibleDetail ? (
            <div className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">
              Unable to load reconciliation details. Close this dialog
              and try again.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Reconciliation ID
                  </p>

                  <p className="text-xl font-bold">
                    #{visibleDetail.id}
                  </p>
                </div>

                <Badge
                  variant={getStatusVariant(visibleDetail.status)}
                >
                  {getStatusLabel(visibleDetail.status)}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Collector
                  </p>

                  <p className="mt-1 font-semibold">
                    {visibleDetail.collector?.name ?? "—"}
                  </p>

                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {visibleDetail.collector?.email ??
                      visibleDetail.collector_id}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Closing Period
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {formatDate(visibleDetail.period_start)}
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {formatDate(visibleDetail.period_end)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">
                  Financial Summary
                </h3>

                <div className="divide-y rounded-lg border">
                  <div className="flex justify-between gap-4 p-3 text-sm">
                    <span className="text-muted-foreground">
                      Expected cash
                    </span>

                    <span className="font-semibold">
                      {formatMoney(visibleDetail.expected_amount)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 p-3 text-sm">
                    <span className="text-muted-foreground">
                      Physical cash counted
                    </span>

                    <span className="font-semibold">
                      {formatMoney(visibleDetail.actual_amount)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 p-3 text-sm">
                    <span className="text-muted-foreground">
                      Difference
                    </span>

                    <span
                      className={
                        Number(visibleDetail.difference_amount ?? 0) === 0
                          ? "font-bold text-emerald-600"
                          : "font-bold text-destructive"
                      }
                    >
                      {formatMoney(visibleDetail.difference_amount)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 p-3 text-sm">
                    <span className="text-muted-foreground">
                      Result
                    </span>

                    <span className="font-medium">
                      {getDifferenceLabel(
                        visibleDetail.difference_amount,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">
                  Collector Notes
                </h3>

                <div className="rounded-lg border p-3 text-sm">
                  {visibleDetail.collector_notes || (
                    <span className="text-muted-foreground">
                      No collector notes provided.
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">
                  Submission and Review
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      Submitted At
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {formatDate(visibleDetail.submitted_at)}
                    </p>
                  </div>

                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      Reviewed At
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {formatDate(visibleDetail.reviewed_at)}
                    </p>
                  </div>

                  <div className="rounded-lg border p-3 sm:col-span-2">
                    <p className="text-xs text-muted-foreground">
                      Reviewer
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {visibleDetail.reviewer?.name ??
                        visibleDetail.reviewed_by ??
                        "Not reviewed"}
                    </p>
                  </div>

                  <div className="rounded-lg border p-3 sm:col-span-2">
                    <p className="text-xs text-muted-foreground">
                      Review Notes
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {visibleDetail.review_notes || "No review notes."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Created: {formatDate(visibleDetail.created_at)}
                {" · "}
                Updated: {formatDate(visibleDetail.updated_at)}
              </div>

              <DialogFooter>
                {(visibleDetail.status === "DRAFT" ||
                  visibleDetail.status === "RETURNED") && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDetailsOpen(false);
                        openEditDialog(visibleDetail);
                      }}
                    >
                      Edit Draft
                    </Button>

                    <Button
                      onClick={() => {
                        setDetailsOpen(false);
                        openSubmitDialog(visibleDetail);
                      }}
                    >
                      Submit Closing
                    </Button>
                  </>
                )}

                {(visibleDetail.status === "PENDING_REVIEW" ||
                  visibleDetail.status === "DISCREPANCY") && (
                  <Button
                    onClick={() => {
                      setDetailsOpen(false);
                      openReviewDialog(visibleDetail);
                    }}
                  >
                    <ShieldCheck className="mr-2 size-4" />
                    Review Closing
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
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
            <AlertDialogTitle>
              Cancel Cash Closing?
            </AlertDialogTitle>

            <AlertDialogDescription>
              {cancelTarget
                ? `You are about to cancel closing #${cancelTarget.id}. This action is subject to the backend workflow rules and may not be reversible.`
                : "This action is subject to the backend workflow rules."}
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