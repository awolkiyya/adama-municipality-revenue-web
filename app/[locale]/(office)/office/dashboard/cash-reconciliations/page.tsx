"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";

import {
  AlertCircle,
  ArrowDownToLine,
  Banknote,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Eye,
  FilterX,
  ListFilter,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

import { usePermission } from "@/hooks/usePermission";

import {
  useCashReconciliations,
  useCreateCashReconciliation,
  useUpdateCashReconciliation,
  useSubmitCashReconciliation,
  useReviewCashReconciliation,
  useCancelCashReconciliation,
  useDeleteCashReconciliationDraft,
  useCashReconciliation,
} from "@/hooks/use-cash-reconciliations";

import type {
  CashReconciliation,
  CashReconciliationEvidence,
  CashReconciliationStatus,
} from "@/types/cash-reconciliation";

import { fetchPrivateImage } from "@/services/user.service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
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
  formatDate,
  formatMoney,
  getCollectorName,
  getDifferenceLabel,
  getStatusLabel,
  getStatusVariant,
  STATUS_OPTIONS,
} from "@/utils/cash-reconciliation-utils";

import {
  CashReconciliationDraftSheet,
} from "@/components/sheets/cash-reconciliation/CashReconciliationDraftSheet";

import type {
  CashReconciliationDraftPayload,
} from "@/components/sheets/cash-reconciliation/CashReconciliationDraftSheet";

import {
  CashReconciliationSubmitSheet,
} from "@/components/sheets/cash-reconciliation/CashReconciliationSubmitSheet";

import type {
  CashReconciliationSubmitPayload,
} from "@/components/sheets/cash-reconciliation/CashReconciliationSubmitSheet";

import {
  CashReconciliationReviewSheet,
} from "@/components/sheets/cash-reconciliation/CashReconciliationReviewSheet";

import type {
  CashReconciliationReviewPayload,
} from "@/components/sheets/cash-reconciliation/CashReconciliationReviewSheet";

import {
  CashReconciliationDetailsSheet,
} from "@/components/sheets/cash-reconciliation/CashReconciliationDetailsSheet";


import Can from "@/components/access/Can";
import PrivateFilePreviewDialog from "@/components/sheets/cash-reconciliation/PrivateFilePreviewDialog";

// ============================================================
// CONSTANTS
// ============================================================

const PAGE_SIZE = 10;

const EXPECTED_CASH_PAGE_PATH = "expected-cash";

const CASH_RECONCILIATION_RESOURCE = "cash_reconciliations";

// Window (ms) after the evidence preview closes during which the parent
// Details sheet ignores close requests. Prevents the same click/Escape that
// closed the preview from also closing the sheet underneath.
const PREVIEW_CLOSE_GUARD_MS = 300;

const AVAILABLE_STATUS_OPTIONS = STATUS_OPTIONS.filter(
  (option) => option.value !== "DISCREPANCY",
);

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  ...AVAILABLE_STATUS_OPTIONS,
];

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

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============================================================
// SMALL PRESENTATIONAL COMPONENTS
// ============================================================

type StatCardProps = {
  label: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
  tone: "blue" | "emerald" | "amber" | "red";
  loading?: boolean;
  onClick?: () => void;
  active?: boolean;
};

const TONE_CLASSES: Record<StatCardProps["tone"], string> = {
  blue: "bg-blue-500/10 text-blue-600",
  emerald: "bg-emerald-500/10 text-emerald-600",
  amber: "bg-amber-500/10 text-amber-600",
  red: "bg-destructive/10 text-destructive",
};

function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
  loading,
  onClick,
  active,
}: StatCardProps) {
  const interactive = typeof onClick === "function";

  return (
    <Card
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive && active !== undefined ? active : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (interactive && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClick?.();
        }
      }}
      className={[
        "transition-colors",
        interactive
          ? "cursor-pointer hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          : "",
        active ? "ring-2 ring-primary/40" : "",
      ].join(" ")}
    >
      <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm text-muted-foreground">{label}</p>

          {loading ? (
            <div className="h-7 w-24 animate-pulse rounded bg-muted" />
          ) : (
            <p className="truncate text-xl font-bold tabular-nums">{value}</p>
          )}

          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        </div>

        <div className={`shrink-0 rounded-lg p-3 ${TONE_CLASSES[tone]}`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

type DifferenceCellProps = {
  record: CashReconciliation;
};

function DifferenceValue({ record }: DifferenceCellProps) {
  const difference =
    record.difference_amount == null
      ? null
      : Number(record.difference_amount);

  if (difference === null || !Number.isFinite(difference)) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div>
      <span
        className={
          difference === 0
            ? "font-medium tabular-nums text-emerald-600"
            : "font-medium tabular-nums text-destructive"
        }
      >
        {formatMoney(record.difference_amount)}
      </span>

      <div className="text-xs text-muted-foreground">
        {getDifferenceLabel(record.difference_amount)}
      </div>
    </div>
  );
}

// ============================================================
// ROW ACTIONS
// ============================================================

type RowActionsProps = {
  record: CashReconciliation;
  onView: (record: CashReconciliation) => void;
  onEdit: (record: CashReconciliation) => void;
  onSubmit: (record: CashReconciliation) => void;
  onReview: (record: CashReconciliation) => void;
  onCancel: (record: CashReconciliation) => void;
  onDelete: (record: CashReconciliation) => void;
};

function RowActions({
  record,
  onView,
  onEdit,
  onSubmit,
  onReview,
  onCancel,
  onDelete,
}: RowActionsProps) {
  const isDraft = record.status === "DRAFT";

  const isEditable =
    isDraft || record.status === "RETURNED";

  const canReviewStatus =
    record.status === "PENDING_REVIEW";

  return (
    <div
      className="flex items-center justify-end gap-2"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {isEditable && (
        <Can
          resource={CASH_RECONCILIATION_RESOURCE}
          action="submit"
        >
          <Button
            type="button"
            size="sm"
            onClick={() => onSubmit(record)}
            className="hidden sm:inline-flex"
          >
            <Send className="mr-1.5 size-3.5" />
            Submit
          </Button>
        </Can>
      )}

      {canReviewStatus && (
        <Can
          resource={CASH_RECONCILIATION_RESOURCE}
          action="review"
        >
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onReview(record)}
            className="hidden sm:inline-flex"
          >
            <ShieldCheck className="mr-1.5 size-3.5" />
            Review
          </Button>
        </Can>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${getCollectorName(record)}'s closing`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            {getCollectorName(record)}
          </DropdownMenuLabel>

          <DropdownMenuItem onSelect={() => onView(record)}>
            <Eye className="mr-2 size-4" />
            View details
          </DropdownMenuItem>

          {isEditable && (
            <>
              <Can
                resource={CASH_RECONCILIATION_RESOURCE}
                action="update"
              >
                <DropdownMenuItem onSelect={() => onEdit(record)}>
                  <Pencil className="mr-2 size-4" />
                  {isDraft ? "Edit draft" : "Edit returned closing"}
                </DropdownMenuItem>
              </Can>

              <Can
                resource={CASH_RECONCILIATION_RESOURCE}
                action="submit"
              >
                <DropdownMenuItem onSelect={() => onSubmit(record)}>
                  <CheckCircle2 className="mr-2 size-4" />
                  Submit cash count
                </DropdownMenuItem>
              </Can>
            </>
          )}

          {canReviewStatus && (
            <Can
              resource={CASH_RECONCILIATION_RESOURCE}
              action="review"
            >
              <DropdownMenuItem onSelect={() => onReview(record)}>
                <ShieldCheck className="mr-2 size-4" />
                Finance review
              </DropdownMenuItem>
            </Can>
          )}

          {isEditable && (
            <Can
              resource={CASH_RECONCILIATION_RESOURCE}
              action="cancel"
            >
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => onCancel(record)}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="mr-2 size-4" />
                Cancel closing
              </DropdownMenuItem>
            </Can>
          )}

          {isDraft && (
            <Can
              resource={CASH_RECONCILIATION_RESOURCE}
              action="delete"
            >
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => onDelete(record)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                Delete draft
              </DropdownMenuItem>
            </Can>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ============================================================
// MOBILE RECORD CARD
// ============================================================

type RecordCardProps = RowActionsProps;

function RecordCard(props: RecordCardProps) {
  const { record, onView } = props;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(record)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onView(record);
        }
      }}
      className="cursor-pointer space-y-3 rounded-lg border p-3 transition-colors hover:bg-muted/40 focus-visible:bg-muted/50 focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{getCollectorName(record)}</p>

          <p className="truncate text-xs text-muted-foreground">
            {record.collector?.email ?? record.collector_id}
          </p>
        </div>

        <Badge variant={getStatusVariant(record.status)}>
          {getStatusLabel(record.status)}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarDays className="size-3.5 shrink-0" />
        <span>
          {formatDate(record.period_start)} – {formatDate(record.period_end)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-md bg-muted/40 p-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Expected</p>
          <p className="font-medium tabular-nums">
            {formatMoney(record.expected_amount)}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Actual</p>
          <p className="font-medium tabular-nums">
            {record.actual_amount == null
              ? "—"
              : formatMoney(record.actual_amount)}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Difference</p>
          <DifferenceValue record={record} />
        </div>
      </div>

      <RowActions {...props} />
    </div>
  );
}

// ============================================================
// STATUS FILTER DROPDOWN
// ============================================================

type StatusFilterDropdownProps = {
  value: string;
  counts: Record<string, number>;
  totalOnPage: number;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function StatusFilterDropdown({
  value,
  counts,
  totalOnPage,
  disabled,
  onChange,
}: StatusFilterDropdownProps) {
  const active = value !== "ALL";

  const currentLabel =
    STATUS_FILTER_OPTIONS.find((option) => option.value === value)?.label ??
    "All statuses";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={active ? "secondary" : "outline"}
          disabled={disabled}
          className="w-full justify-between gap-2 md:w-56"
          aria-label="Filter by status"
        >
          <span className="flex min-w-0 items-center gap-2">
            <ListFilter className="size-4 shrink-0" />

            <span className="truncate">
              {active ? currentLabel : "Status"}
            </span>
          </span>

          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Filter by status
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {STATUS_FILTER_OPTIONS.map((option) => {
            const count =
              option.value === "ALL" ? totalOnPage : counts[option.value] ?? 0;

            return (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="pr-3"
              >
                <span className="flex w-full items-center justify-between gap-3">
                  <span className="truncate">{option.label}</span>

                  <span className="text-xs tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>

        {active && (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={() => onChange("ALL")}>
              <FilterX className="mr-2 size-4" />
              Clear status filter
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <p className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground">
          <Check className="size-3" />
          Counts reflect the current page
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function CashReconciliationsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { can } = usePermission();

  // ==========================================================
  // PERMISSIONS
  // ==========================================================

  const canView = can(CASH_RECONCILIATION_RESOURCE, "view");
  const canCreate = can(CASH_RECONCILIATION_RESOURCE, "create");
  const canUpdate = can(CASH_RECONCILIATION_RESOURCE, "update");
  const canSubmit = can(CASH_RECONCILIATION_RESOURCE, "submit");
  const canReview = can(CASH_RECONCILIATION_RESOURCE, "review");
  const canCancel = can(CASH_RECONCILIATION_RESOURCE, "cancel");
  const canDelete = can(CASH_RECONCILIATION_RESOURCE, "delete");

  // ==========================================================
  // LIST FILTERS
  // ==========================================================

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // ==========================================================
  // SHEET VISIBILITY AND SELECTED RECORDS
  // ==========================================================

  const [draftSheetOpen, setDraftSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CashReconciliation | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [submitTarget, setSubmitTarget] =
    useState<CashReconciliation | null>(null);

  const [submitOpen, setSubmitOpen] = useState(false);

  const [reviewTarget, setReviewTarget] =
    useState<CashReconciliation | null>(null);

  const [reviewOpen, setReviewOpen] = useState(false);

  const [cancelTarget, setCancelTarget] =
    useState<CashReconciliation | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<CashReconciliation | null>(null);

  // ==========================================================
  // PRIVATE EVIDENCE PREVIEW
  // ==========================================================

  const [previewEvidence, setPreviewEvidence] =
    useState<CashReconciliationEvidence | null>(null);

  // Timestamp of the last preview close. Used to ignore the "outside
  // interaction" event that the parent Details sheet receives from the
  // same click / Escape press that closed the preview.
  const previewClosedAtRef = useRef(0);

  // ==========================================================
  // QUERIES
  // ==========================================================

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
  const deleteMutation = useDeleteCashReconciliationDraft();

  const isSaving =
    createMutation.isPending || updateMutation.isPending;

  // ==========================================================
  // CLIENT-SIDE SEARCH
  // ==========================================================

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return records;
    }

    return records.filter((record) => {
      const values = [
        record.id,
        getCollectorName(record),
        record.collector?.email ?? "",
        record.collector_id,
        record.status,
        record.period_start,
        record.period_end,
      ];

      return values.some((value) =>
        String(value).toLowerCase().includes(term),
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

          if (record.status === "PENDING_REVIEW") {
            totals.pending += 1;
          }

          if (record.status === "RECONCILED") {
            totals.reconciled += 1;
          }

          return totals;
        },
        {
          expected: 0,
          actual: 0,
          countedRecords: 0,
          pending: 0,
          reconciled: 0,
        },
      ),
    [records],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const record of records) {
      counts[record.status] = (counts[record.status] ?? 0) + 1;
    }

    return counts;
  }, [records]);

  const hasStatusFilter = statusFilter !== "ALL";
  const hasSearch = search.trim() !== "";
  const hasActiveFilters = hasStatusFilter || hasSearch;

  const statusFilterLabel =
    STATUS_FILTER_OPTIONS.find((option) => option.value === statusFilter)
      ?.label ?? statusFilter;

  // ==========================================================
  // FILTER HELPERS
  // ==========================================================

  function applyStatusFilter(value: string): void {
    setStatusFilter((current) =>
      current === value ? "ALL" : value,
    );

    setPage(1);
  }

  function changeStatusFilter(value: string): void {
    setStatusFilter(value);
    setPage(1);
  }

  function clearFilters(): void {
    setStatusFilter("ALL");
    setSearch("");
    setPage(1);
  }

  // ==========================================================
  // SHEET ACTIONS
  // ==========================================================

  function openCreateSheet(): void {
    if (!canCreate) {
      toast.error("You do not have permission to create closings.");
      return;
    }

    setEditing(null);
    setDraftSheetOpen(true);
  }

  function openEditSheet(record: CashReconciliation): void {
    if (!canUpdate) {
      toast.error("You do not have permission to edit closings.");
      return;
    }

    const isEditable =
      record.status === "DRAFT" ||
      record.status === "RETURNED";

    if (!isEditable) {
      toast.error(
        "Only draft or returned reconciliations can be edited.",
      );
      return;
    }

    setEditing(record);
    setDraftSheetOpen(true);
  }

  function openDetails(record: CashReconciliation): void {
    if (!canView) {
      toast.error("You do not have permission to view reconciliations.");
      return;
    }

    setSelectedId(record.id);
    setDetailsOpen(true);
  }

  function openSubmitSheet(record: CashReconciliation): void {
    if (!canSubmit) {
      toast.error("You do not have permission to submit closings.");
      return;
    }

    const isEditable =
      record.status === "DRAFT" ||
      record.status === "RETURNED";

    if (!isEditable) {
      toast.error(
        "Only draft or returned reconciliations can be submitted.",
      );
      return;
    }

    setSubmitTarget(record);
    setSubmitOpen(true);
  }

  function openReviewSheet(record: CashReconciliation): void {
    if (!canReview) {
      toast.error("You do not have permission to review closings.");
      return;
    }

    if (record.status !== "PENDING_REVIEW") {
      toast.error(
        "Only pending-review reconciliations can be reviewed.",
      );
      return;
    }

    setReviewTarget(record);
    setReviewOpen(true);
  }

  function openCancelDialog(record: CashReconciliation): void {
    if (!canCancel) {
      toast.error("You do not have permission to cancel closings.");
      return;
    }

    const isEditable =
      record.status === "DRAFT" ||
      record.status === "RETURNED";

    if (!isEditable) {
      toast.error(
        "Only draft or returned reconciliations can be cancelled.",
      );
      return;
    }

    setCancelTarget(record);
  }

  function openDeleteDialog(record: CashReconciliation): void {
    if (!canDelete) {
      toast.error("You do not have permission to delete drafts.");
      return;
    }

    if (record.status !== "DRAFT") {
      toast.error("Only draft reconciliations can be deleted.");
      return;
    }

    setDeleteTarget(record);
  }

  function openCollectorBreakdown(): void {
    if (!canView) {
      toast.error("You do not have permission to view reconciliations.");
      return;
    }

    router.push(
      `/office/dashboard/cash-reconciliations/${EXPECTED_CASH_PAGE_PATH}`,
    );
  }

  // ==========================================================
  // PRIVATE EVIDENCE PREVIEW AND DOWNLOAD
  // ==========================================================

  function handlePreviewEvidence(
    evidence: CashReconciliationEvidence,
  ): void {
    if (!evidence.uuid) {
      toast.error("This evidence file cannot be previewed.");
      return;
    }

    setPreviewEvidence(evidence);
  }

  function closeEvidencePreview(): void {
    // Stamp the close time so the Details sheet can ignore the
    // outside-interaction event fired by this same click / Escape.
    previewClosedAtRef.current = Date.now();
    setPreviewEvidence(null);
  }

  async function handleDownloadEvidence(): Promise<void> {
    if (!previewEvidence?.uuid) {
      toast.error("Evidence file is unavailable.");
      return;
    }

    let objectUrl: string | null = null;

    try {
      objectUrl = await fetchPrivateImage(
        `/private-file/${encodeURIComponent(previewEvidence.uuid)}/url`,
      );

      const anchor = document.createElement("a");

      anchor.href = objectUrl;
      anchor.download = previewEvidence.original_name || "evidence";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      if (objectUrl) {
        window.setTimeout(() => {
          URL.revokeObjectURL(objectUrl!);
        }, 1000);
      }
    }
  }

  // ============================================================
  // CREATE / UPDATE DRAFT
  // ============================================================

  async function handleSaveDraft(
    payload: CashReconciliationDraftPayload,
    files: File[],
    removeEvidenceIds: string[],
  ): Promise<CashReconciliation> {
    try {
      let savedRecord: CashReconciliation;

      if (editing) {
        if (!canUpdate) {
          throw new Error(
            "You do not have permission to update reconciliations.",
          );
        }

        savedRecord = await updateMutation.mutateAsync({
          id: editing.id,
          payload,
          files,
          removeEvidenceIds,
        });
      } else {
        if (!canCreate) {
          throw new Error(
            "You do not have permission to create reconciliations.",
          );
        }

        savedRecord = await createMutation.mutateAsync({
          payload,
          files,
        });
      }

      toast.success(
        editing
          ? "Cash reconciliation draft updated."
          : "Cash reconciliation draft created.",
      );

      setDraftSheetOpen(false);
      setEditing(null);

      await refetch();

      return savedRecord;
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
      throw mutationError;
    }
  }

  // ============================================================
  // SUBMIT PHYSICAL CASH COUNT
  // ============================================================

  async function handleSubmitClosing(
    payload: CashReconciliationSubmitPayload,
  ): Promise<void> {
    if (!submitTarget) {
      return;
    }

    if (!canSubmit) {
      toast.error("You do not have permission to submit closings.");
      return;
    }

    const isEditable =
      submitTarget.status === "DRAFT" ||
      submitTarget.status === "RETURNED";

    if (!isEditable) {
      toast.error(
        "This reconciliation is no longer eligible for submission.",
      );

      setSubmitOpen(false);
      setSubmitTarget(null);

      return;
    }

    try {
      await submitMutation.mutateAsync({
        id: submitTarget.id,
        payload,
      });

      toast.success("Cash closing submitted for review.");

      setSubmitOpen(false);
      setSubmitTarget(null);

      await refetch();
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  // ============================================================
  // FINANCE REVIEW
  // ============================================================

  async function handleReview(
    payload: CashReconciliationReviewPayload,
  ): Promise<void> {
    if (!reviewTarget) {
      return;
    }

    if (!canReview) {
      toast.error("You do not have permission to review closings.");
      return;
    }

    if (reviewTarget.status !== "PENDING_REVIEW") {
      toast.error(
        "This reconciliation has already been reviewed or is no longer pending review.",
      );

      setReviewOpen(false);
      setReviewTarget(null);

      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: reviewTarget.id,
        payload,
      });

      toast.success("Cash reconciliation review completed.");

      const reviewedId = reviewTarget.id;

      setReviewOpen(false);
      setReviewTarget(null);

      await refetch();

      if (detailsOpen && selectedId === reviewedId) {
        await refetchDetail();
      }
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  // ============================================================
  // CANCEL
  // ============================================================

  async function handleCancel(): Promise<void> {
    if (!cancelTarget) {
      return;
    }

    if (!canCancel) {
      toast.error("You do not have permission to cancel closings.");
      return;
    }

    const isEditable =
      cancelTarget.status === "DRAFT" ||
      cancelTarget.status === "RETURNED";

    if (!isEditable) {
      toast.error(
        "Only draft or returned reconciliations can be cancelled.",
      );

      setCancelTarget(null);
      return;
    }

    try {
      await cancelMutation.mutateAsync(cancelTarget.id);

      toast.success("Cash reconciliation cancelled.");

      const cancelledId = cancelTarget.id;

      setCancelTarget(null);

      await refetch();

      if (detailsOpen && selectedId === cancelledId) {
        await refetchDetail();
      }
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  // ============================================================
  // DELETE DRAFT
  // ============================================================

  async function handleDeleteDraft(): Promise<void> {
    if (!deleteTarget) {
      return;
    }

    if (!canDelete) {
      toast.error("You do not have permission to delete drafts.");
      return;
    }

    if (deleteTarget.status !== "DRAFT") {
      toast.error("Only draft reconciliations can be deleted.");
      setDeleteTarget(null);
      return;
    }

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);

      toast.success("Draft cash reconciliation deleted.");

      if (selectedId === deleteTarget.id) {
        setDetailsOpen(false);
        setSelectedId(null);
      }

      setDeleteTarget(null);

      await refetch();
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  // ============================================================
  // EXPORT
  // ============================================================

  function handleExport(): void {
    if (!canView) {
      toast.error("You do not have permission to export reconciliations.");
      return;
    }

    if (filteredRecords.length === 0) {
      toast.error("There are no records to export on this page.");
      return;
    }

    downloadCsv(filteredRecords);
    toast.success("CSV export generated.");
  }

  // ============================================================
  // PAGINATION
  // ============================================================

  const currentPage = meta?.current_page ?? page;
  const lastPage = meta?.last_page ?? 1;
  const total = meta?.total ?? records.length;

  const rowActionHandlers = {
    onView: openDetails,
    onEdit: openEditSheet,
    onSubmit: openSubmitSheet,
    onReview: openReviewSheet,
    onCancel: openCancelDialog,
    onDelete: openDeleteDialog,
  };

  // ============================================================
  // RENDER
  // ============================================================

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
            Record physical cash counts, submit daily closings,
            and review differences between expected and actual cash.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canView && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 md:flex-none">
                  {isFetching ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="mr-2 size-4" />
                  )}
                  Actions
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Reports and tools
                </DropdownMenuLabel>

                <DropdownMenuItem
                  onSelect={openCollectorBreakdown}
                  disabled={isLoading}
                >
                  <Users className="mr-2 size-4" />
                  Expected Cash by Collector
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={handleExport}
                  disabled={filteredRecords.length === 0}
                >
                  <ArrowDownToLine className="mr-2 size-4" />
                  Export CSV
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onSelect={() => void refetch()}
                  disabled={isFetching}
                >
                  <RefreshCw className="mr-2 size-4" />
                  Refresh
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Can
            resource={CASH_RECONCILIATION_RESOURCE}
            action="create"
          >
            <Button onClick={openCreateSheet} className="flex-1 md:flex-none">
              <Plus className="mr-2 size-4" />
              New Closing
            </Button>
          </Can>
        </div>
      </div>

      {/* SUMMARY CARDS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Expected Cash"
          value={formatMoney(summary.expected)}
          hint="Current page · click to see by collector"
          icon={<Wallet className="size-5" />}
          tone="blue"
          loading={isLoading}
          onClick={openCollectorBreakdown}
        />

        <StatCard
          label="Counted Cash"
          value={formatMoney(summary.actual)}
          hint={`${summary.countedRecords} recorded count${
            summary.countedRecords === 1 ? "" : "s"
          }`}
          icon={<Banknote className="size-5" />}
          tone="emerald"
          loading={isLoading}
        />

        <StatCard
          label="Pending Review"
          value={summary.pending}
          hint="Click to filter"
          icon={<Clock3 className="size-5" />}
          tone="amber"
          loading={isLoading}
          active={statusFilter === "PENDING_REVIEW"}
          onClick={() => applyStatusFilter("PENDING_REVIEW")}
        />

        <StatCard
          label="Reconciled"
          value={summary.reconciled}
          hint="Successfully reviewed and reconciled"
          icon={<CheckCircle2 className="size-5" />}
          tone="emerald"
          loading={isLoading}
          active={statusFilter === "RECONCILED"}
          onClick={() => applyStatusFilter("RECONCILED")}
        />
      </div>

      {/* RECONCILIATION RECORDS */}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                Reconciliation Records
              </CardTitle>

              <CardDescription>
                Select a record to see its details.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              {isFetching && !isLoading && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Updating...
                </span>
              )}

              <Badge variant="secondary" className="tabular-nums">
                {total} total
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* TOOLBAR */}

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search collector, ID, or status..."
                className="pl-9 pr-9"
              />

              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <StatusFilterDropdown
              value={statusFilter}
              counts={statusCounts}
              totalOnPage={records.length}
              disabled={isLoading}
              onChange={changeStatusFilter}
            />

            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Refresh records"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="hidden md:inline-flex"
            >
              <RefreshCw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {/* ACTIVE FILTER CHIPS */}

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Active filters:
              </span>

              {hasStatusFilter && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Status: {statusFilterLabel}

                  <button
                    type="button"
                    aria-label="Remove status filter"
                    onClick={() => changeStatusFilter("ALL")}
                    className="rounded-full p-0.5 hover:bg-background/60"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              )}

              {hasSearch && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Search: {search.trim()}

                  <button
                    type="button"
                    aria-label="Remove search filter"
                    onClick={() => setSearch("")}
                    className="rounded-full p-0.5 hover:bg-background/60"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 px-2 text-xs"
              >
                <FilterX className="mr-1.5 size-3.5" />
                Clear all
              </Button>
            </div>
          )}

          {/* QUERY ERROR */}

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

          {/* EMPTY STATE */}

          {!isLoading && filteredRecords.length === 0 && (
            <div className="rounded-md border px-4 py-12 text-center">
              <ClipboardCheck className="mx-auto mb-2 size-8 text-muted-foreground/50" />

              <p className="font-medium">No reconciliations found</p>

              <p className="mt-1 text-sm text-muted-foreground">
                {hasActiveFilters
                  ? "No records match your filters."
                  : "There are no cash reconciliation records to display."}
              </p>

              <div className="mt-3 flex justify-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <FilterX className="mr-2 size-4" />
                    Clear filters
                  </Button>
                )}

                <Can
                  resource={CASH_RECONCILIATION_RESOURCE}
                  action="create"
                >
                  <Button size="sm" onClick={openCreateSheet}>
                    <Plus className="mr-2 size-4" />
                    New Closing
                  </Button>
                </Can>
              </div>
            </div>
          )}

          {/* MOBILE LIST */}

          {(isLoading || filteredRecords.length > 0) && (
            <div className="space-y-3 md:hidden">
              {isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`mobile-skeleton-${index}`}
                      className="h-36 animate-pulse rounded-lg bg-muted"
                    />
                  ))
                : filteredRecords.map((record) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                      {...rowActionHandlers}
                    />
                  ))}
            </div>
          )}

          {/* DESKTOP TABLE */}

          {(isLoading || filteredRecords.length > 0) && (
            <div className="hidden overflow-x-auto rounded-md border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">No.</TableHead>
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
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          {Array.from({ length: 8 }).map((__, cell) => (
                            <TableCell key={cell}>
                              <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-muted" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : filteredRecords.map((record, index) => {
                        const rowNumber =
                          (currentPage - 1) * PAGE_SIZE + index + 1;

                        return (
                          <TableRow
                            key={record.id}
                            tabIndex={0}
                            onClick={() => openDetails(record)}
                            onKeyDown={(event) => {
                              if (event.target !== event.currentTarget) {
                                return;
                              }

                              if (
                                event.key === "Enter" ||
                                event.key === " "
                              ) {
                                event.preventDefault();
                                openDetails(record);
                              }
                            }}
                            className="cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none"
                          >
                            <TableCell>
                              <span className="font-medium tabular-nums">
                                {rowNumber}
                              </span>
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
                              <DifferenceValue record={record} />
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant={getStatusVariant(record.status)}
                              >
                                {getStatusLabel(record.status)}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <RowActions
                                record={record}
                                {...rowActionHandlers}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* PAGINATION */}

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

      {/* CREATE / EDIT DRAFT SHEET */}

      {(canCreate || canUpdate) && (
        <CashReconciliationDraftSheet
          open={draftSheetOpen}
          onOpenChange={(open) => {
            if (isSaving) {
              return;
            }

            setDraftSheetOpen(open);

            if (!open) {
              setEditing(null);
            }
          }}
          onPreviewEvidence={(file) => {
            setPreviewEvidence(file);
          }}
          record={editing}
          isSaving={isSaving}
          onSave={handleSaveDraft}
        />
      )}

      {/* SUBMIT CASH COUNT SHEET */}

      {canSubmit && (
        <CashReconciliationSubmitSheet
          open={submitOpen}
          onOpenChange={(open) => {
            if (submitMutation.isPending) {
              return;
            }

            setSubmitOpen(open);

            if (!open) {
              setSubmitTarget(null);
            }
          }}
          record={submitTarget}
          isSubmitting={submitMutation.isPending}
          onSubmit={handleSubmitClosing}
        />
      )}

      {/* FINANCE REVIEW SHEET */}

      {canReview && (
        <CashReconciliationReviewSheet
          open={reviewOpen}
          onOpenChange={(open) => {
            if (reviewMutation.isPending) {
              return;
            }

            setReviewOpen(open);

            if (!open) {
              setReviewTarget(null);
            }
          }}
          record={reviewTarget}
          isReviewing={reviewMutation.isPending}
          onSubmit={handleReview}
        />
      )}

      {/* DETAILS SHEET */}

      <CashReconciliationDetailsSheet
        open={detailsOpen}
        onOpenChange={(open) => {
          // Keep the details sheet open while the evidence preview is open,
          // and for a short moment after it closes, so closing the preview
          // does not also close this parent sheet.
          if (
            !open &&
            (previewEvidence !== null ||
              Date.now() - previewClosedAtRef.current <
                PREVIEW_CLOSE_GUARD_MS)
          ) {
            return;
          }

          setDetailsOpen(open);

          if (!open) {
            setSelectedId(null);
          }
        }}
        record={detailRecord ?? null}
        isLoading={detailLoading}
        isError={detailError}
        onRetry={() => {
          void refetchDetail();
        }}
        onEdit={(record) => {
          if (!canUpdate) {
            toast.error("You do not have permission to edit closings.");
            return;
          }

          setDetailsOpen(false);
          openEditSheet(record);
        }}
        onSubmitClosing={(record) => {
          if (!canSubmit) {
            toast.error("You do not have permission to submit closings.");
            return;
          }

          setDetailsOpen(false);
          openSubmitSheet(record);
        }}
        onReview={(record) => {
          if (!canReview) {
            toast.error("You do not have permission to review closings.");
            return;
          }

          setDetailsOpen(false);
          openReviewSheet(record);
        }}
        onPreviewEvidence={handlePreviewEvidence}
      />

      {/* REUSABLE PRIVATE EVIDENCE PREVIEW */}

      <PrivateFilePreviewDialog
        open={previewEvidence !== null}
        path={
          previewEvidence?.uuid
            ? `/private-file/${encodeURIComponent(previewEvidence.uuid)}/url`
            : null
        }
        fileName={previewEvidence?.original_name ?? ""}
        mimeType={previewEvidence?.mime_type ?? null}
        onClose={closeEvidencePreview}
        onDownload={() => {
          void handleDownloadEvidence();
        }}
      />

      {/* CANCEL CONFIRMATION */}

      {canCancel && (
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
                  ? `You are about to cancel the closing for ${getCollectorName(cancelTarget)}. The record will be retained for audit purposes.`
                  : "The record will be retained for audit purposes."}
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
      )}

      {/* DELETE DRAFT CONFIRMATION */}

      {canDelete && (
        <AlertDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open && !deleteMutation.isPending) {
              setDeleteTarget(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Trash2 className="size-5" />
              </div>

              <AlertDialogTitle>
                Permanently Delete Draft?
              </AlertDialogTitle>

              <AlertDialogDescription className="space-y-2">
                {deleteTarget ? (
                  <>
                    <span className="block">
                      You are about to permanently delete the draft closing
                      for{" "}
                      <span className="font-semibold text-foreground">
                        {getCollectorName(deleteTarget)}
                      </span>
                      .
                    </span>

                    <span className="block">
                      This action cannot be undone. Only unsubmitted draft
                      reconciliations can be deleted.
                    </span>
                  </>
                ) : (
                  "This action cannot be undone."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Keep Draft
              </AlertDialogCancel>

              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  void handleDeleteDraft();
                }}
                disabled={
                  deleteMutation.isPending ||
                  deleteTarget?.status !== "DRAFT"
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 size-4" />
                )}

                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* FOOTER */}

      <p className="text-center text-xs text-muted-foreground">
        Cash reconciliation · {locale.toUpperCase()}
      </p>
    </div>
  );
}