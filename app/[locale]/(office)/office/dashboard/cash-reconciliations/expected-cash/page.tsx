
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";

import {
  AlertCircle,
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  Banknote,
  Bell,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Loader2,
  RefreshCw,
  Search,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { usePermission } from "@/hooks/usePermission";

import {
  useExpectedCashByCollector,
  useNotifyCashCollector,
} from "@/hooks/use-cash-reconciliations";

import type {
  ExpectedByCollectorFilters,
  ExpectedCashCollector,
} from "@/types/cash-reconciliation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatMoney } from "@/utils/cash-reconciliation-utils";

// ============================================================
// CONSTANTS
// ============================================================

const CASH_RECONCILIATION_RESOURCE = "cash_reconciliations";

const PAGE_SIZE = 100;

const LIST_PAGE_PATH = "cash-reconciliations";

// ============================================================
// TYPES
// ============================================================

type SortKey =
  | "name"
  | "expected"
  | "reconciled"
  | "outstanding";

type SortDirection = "asc" | "desc";

type CollectorRow = {
  id: string;
  name: string;
  email: string | null;
  paymentsCount: number;
  expected: number;
  reconciliationsCount: number;
  reconciled: number;
  outstanding: number;
};

// ============================================================
// HELPERS
// ============================================================

function toFiniteNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  return (
    (parts[0][0] ?? "") +
    (parts.length > 1 ? parts[parts.length - 1][0] : "")
  ).toUpperCase();
}

function buildRows(
  collectors: ExpectedCashCollector[],
): CollectorRow[] {
  return collectors.map((collector) => ({
    id: collector.collector_id,
    name: collector.collector?.name ?? "Unknown cash handler",
    email: collector.collector?.email ?? null,
    paymentsCount: toFiniteNumber(collector.payments_count),
    expected: toFiniteNumber(collector.expected_total),
    reconciliationsCount: toFiniteNumber(
      collector.reconciliations_count,
    ),
    reconciled: toFiniteNumber(collector.reconciled_total),
    outstanding: toFiniteNumber(collector.outstanding_total),
  }));
}

// ============================================================
// CSV EXPORT
// ============================================================

function downloadRowsCsv(rows: CollectorRow[]): void {
  const headers = [
    "Cash Handler",
    "Email",
    "Cash Payments",
    "Expected Cash",
    "Reconciliation Records",
    "Reconciled Cash",
    "Outstanding Cash",
  ];

  const escape = (value: unknown) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;

  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) =>
      [
        row.name,
        row.email ?? "",
        row.paymentsCount,
        row.expected,
        row.reconciliationsCount,
        row.reconciled,
        row.outstanding,
      ]
        .map(escape)
        .join(","),
    ),
  ];

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `expected-cash-by-handler-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

// ============================================================
// SORT HEADER
// ============================================================

function SortHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  align = "right",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = activeKey === sortKey;

  const Icon = !active
    ? ArrowUpDown
    : direction === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <TableHead
      className={align === "right" ? "text-right" : undefined}
      aria-sort={
        active
          ? direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-foreground ${
          active ? "text-foreground" : ""
        }`}
      >
        {label}
        <Icon className="size-3.5" />
      </button>
    </TableHead>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function ExpectedCashByCollectorPage() {
  const router = useRouter();
  const locale = useLocale();
  const { can } = usePermission();

  // ---------------------------------------------------------
  // PERMISSIONS
  // ---------------------------------------------------------

  const canView = true;
    // can(CASH_RECONCILIATION_RESOURCE, "view_expected_cash") ||
    // can(CASH_RECONCILIATION_RESOURCE, "view_all_expected_cash");

  // ---------------------------------------------------------
  // FILTER STATE
  // ---------------------------------------------------------

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("expected");

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");

  // ---------------------------------------------------------
  // NOTIFICATION MUTATION
  // ---------------------------------------------------------

  const notifyMutation = useNotifyCashCollector();

  const [notifyingCollectorId, setNotifyingCollectorId] =
    useState<string | null>(null);

  // ---------------------------------------------------------
  // API FILTERS
  // ---------------------------------------------------------

  const filters = useMemo<ExpectedByCollectorFilters>(
    () => ({
      page,
      per_page: PAGE_SIZE,

      ...(search.trim()
        ? { search: search.trim() }
        : {}),

      ...(dateFrom
        ? { date_from: dateFrom }
        : {}),

      ...(dateTo
        ? { date_to: dateTo }
        : {}),

      ...(sortKey !== "name"
        ? { sort_by: sortKey }
        : {}),

      sort_dir: sortDirection,
    }),
    [
      page,
      search,
      dateFrom,
      dateTo,
      sortKey,
      sortDirection,
    ],
  );

  // ---------------------------------------------------------
  // EXPECTED CASH QUERY
  // ---------------------------------------------------------

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useExpectedCashByCollector(filters);

  const collectors = response?.data ?? [];

  const meta = response?.meta;

  const summary = meta?.summary;

  const currentPage = meta?.current_page ?? page;
  const lastPage = meta?.last_page ?? 1;
  const totalCollectors = meta?.total ?? collectors.length;

  // ---------------------------------------------------------
  // NORMALIZE API DATA
  // ---------------------------------------------------------

  const normalizedRows = useMemo(
    () => buildRows(collectors),
    [collectors],
  );

  // ---------------------------------------------------------
  // CLIENT-SIDE NAME SORTING
  // ---------------------------------------------------------

  const rows = useMemo(() => {
    if (sortKey !== "name") {
      return normalizedRows;
    }

    const factor = sortDirection === "asc" ? 1 : -1;

    return [...normalizedRows].sort(
      (a, b) => factor * a.name.localeCompare(b.name),
    );
  }, [normalizedRows, sortKey, sortDirection]);

  // ---------------------------------------------------------
  // SERVER AGGREGATE TOTALS
  // ---------------------------------------------------------

  const totals = useMemo(
    () => ({
      collectors: toFiniteNumber(summary?.collectors),
      paymentsCount: toFiniteNumber(summary?.payments_count),
      expected: toFiniteNumber(summary?.expected_total),
      reconciliationsCount: toFiniteNumber(
        summary?.reconciliations_count,
      ),
      reconciled: toFiniteNumber(summary?.reconciled_total),
      outstanding: toFiniteNumber(summary?.outstanding_total),
    }),
    [summary],
  );

  // ---------------------------------------------------------
  // DERIVED VALUES
  // ---------------------------------------------------------

  const hasActiveFilters =
    search.trim() !== "" ||
    dateFrom !== "" ||
    dateTo !== "";

  const expectedTotal = totals.expected;

  // ---------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------

  function handleSort(key: SortKey): void {
    if (key === sortKey) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc",
      );
      return;
    }

    setSortKey(key);

    setSortDirection(
      key === "name" ? "asc" : "desc",
    );

    setPage(1);
  }

  function handleSearchChange(value: string): void {
    setSearch(value);
    setPage(1);
  }

  function handleDateFromChange(value: string): void {
    setDateFrom(value);
    setPage(1);
  }

  function handleDateToChange(value: string): void {
    setDateTo(value);
    setPage(1);
  }

  function clearFilters(): void {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  function handleExport(): void {
    if (rows.length === 0) {
      toast.error("There are no cash handlers to export.");
      return;
    }

    downloadRowsCsv(rows);

    toast.success(
      `CSV export generated for ${rows.length} cash handlers on this page.`,
    );
  }

  /**
   * Send an immediate database notification to a collector
   * who has outstanding collected cash.
   *
   * Every successful request creates a new notification.
   * Duplicate reminders are intentionally allowed.
   */
  async function handleNotify(row: CollectorRow): Promise<void> {
    if (row.outstanding <= 0) {
      toast.info("This cash handler has no outstanding cash.");
      return;
    }

    if (notifyMutation.isPending) {
      return;
    }

    setNotifyingCollectorId(row.id);

    try {
      const result = await notifyMutation.mutateAsync({
        collector_id: row.id,
        date_from: dateFrom || null,
        date_to: dateTo || null,
      });

      toast.success(result.message, {
        description: `${row.name} has been notified about ${formatMoney(
          row.outstanding,
        )} outstanding cash.`,
      });
    } catch (error) {
      console.error(
        "Failed to send cash reconciliation notification:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send notification. Please try again.",
      );
    } finally {
      setNotifyingCollectorId(null);
    }
  }

  function goBack(): void {
    router.push(`/${locale}/${LIST_PAGE_PATH}`);
  }

  // ---------------------------------------------------------
  // PERMISSION CHECK
  // ---------------------------------------------------------

  if (!canView) {
    return (
      <div className="p-4 md:p-6">
        <div className="rounded-xl border border-dashed p-10 text-center">
          <AlertCircle className="mx-auto mb-2 size-8 text-muted-foreground/60" />

          <p className="font-medium">
            You don’t have access to this page
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Ask an administrator for permission to view expected
            cash by collector.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="-ml-2 h-8 text-muted-foreground"
          >
            <ArrowLeft className="mr-1.5 size-4" />
            Cash reconciliation
          </Button>

          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Users className="size-6" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight">
              Expected Cash by Collector
            </h1>
          </div>

          <p className="max-w-2xl text-sm text-muted-foreground">
            Monitor cash collected by each cash handler, compare
            expected cash with reconciled cash, and identify
            outstanding balances.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
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

          <Button
            variant="outline"
            onClick={handleExport}
            disabled={rows.length === 0 || isLoading}
          >
            <ArrowDownToLine className="mr-2 size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ================================================== */}
      {/* SUMMARY CARDS */}
      {/* ================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Expected cash",
            value: formatMoney(totals.expected),
            hint: `${totals.paymentsCount.toLocaleString()} successful cash payments`,
            icon: <Wallet className="size-5" />,
            tone: "bg-blue-500/10 text-blue-600",
          },
          {
            label: "Reconciled cash",
            value: formatMoney(totals.reconciled),
            hint: `${totals.reconciliationsCount.toLocaleString()} reconciled records`,
            icon: <Banknote className="size-5" />,
            tone: "bg-emerald-500/10 text-emerald-600",
          },
          {
            label: "Outstanding cash",
            value: formatMoney(totals.outstanding),
            hint: "Expected cash minus reconciled cash",
            icon: <AlertCircle className="size-5" />,
            tone: "bg-amber-500/10 text-amber-600",
          },
          {
            label: "Cash handlers",
            value: totals.collectors.toLocaleString(),
            hint: "Users who processed cash in the result",
            icon: <Users className="size-5" />,
            tone: "bg-primary/10 text-primary",
          },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div className="min-w-0 space-y-1">
                <p className="text-sm text-muted-foreground">
                  {card.label}
                </p>

                {isLoading ? (
                  <div className="h-7 w-28 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="truncate text-xl font-bold tabular-nums">
                    {card.value}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  {card.hint}
                </p>
              </div>

              <div className={`rounded-lg p-3 ${card.tone}`}>
                {card.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ================================================== */}
      {/* FILTERS */}
      {/* ================================================== */}

      <Card>
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            {/* SEARCH */}

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  handleSearchChange(event.target.value)
                }
                placeholder="Search cash handler name or email..."
                className="pl-9 pr-9"
              />

              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* DATE RANGE */}

            <div className="grid grid-cols-2 gap-3 sm:w-auto">
              <label className="space-y-1 text-xs text-muted-foreground">
                Date from

                <Input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(event) =>
                    handleDateFromChange(event.target.value)
                  }
                  className="text-foreground"
                />
              </label>

              <label className="space-y-1 text-xs text-muted-foreground">
                Date to

                <Input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(event) =>
                    handleDateToChange(event.target.value)
                  }
                  className="text-foreground"
                />
              </label>
            </div>

            {/* CLEAR FILTERS */}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="self-start lg:self-auto"
              >
                <FilterX className="mr-2 size-4" />
                Clear filters
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                Payment date and reconciliation period
              </Badge>

              {hasActiveFilters && (
                <Badge variant="secondary">
                  Filters applied
                </Badge>
              )}
            </div>

            {isFetching && !isLoading && (
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Updating results...
              </span>
            )}
          </div>

          {/* ================================================== */}
          {/* ERROR */}
          {/* ================================================== */}

          {isError && (
            <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />

                <span>
                  We couldn’t load expected cash by cash handler.
                  Check your connection and try again.
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

          {/* ================================================== */}
          {/* TABLE */}
          {/* ================================================== */}

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHeader
                    label="Cash handler"
                    sortKey="name"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    align="left"
                  />

                  <TableHead className="text-right">
                    Cash payments
                  </TableHead>

                  <SortHeader
                    label="Expected cash"
                    sortKey="expected"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />

                  <TableHead className="text-right">
                    Reconciliation records
                  </TableHead>

                  <SortHeader
                    label="Reconciled cash"
                    sortKey="reconciled"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />

                  <SortHeader
                    label="Outstanding cash"
                    sortKey="outstanding"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />

                  <TableHead className="w-40">
                    Reconciled share
                  </TableHead>

                  <TableHead className="text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* LOADING */}

                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      {Array.from({ length: 8 }).map((__, cell) => (
                        <TableCell key={cell}>
                          <div className="h-4 w-full max-w-[110px] animate-pulse rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  /* EMPTY STATE */

                  <TableRow>
                    <TableCell colSpan={8} className="h-44 text-center">
                      <Users className="mx-auto mb-2 size-8 text-muted-foreground/50" />

                      <p className="font-medium">
                        No cash handlers found
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {hasActiveFilters
                          ? "No users match your current filters."
                          : "There are no cash handlers available in this result."}
                      </p>

                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          className="mt-3"
                        >
                          <FilterX className="mr-2 size-4" />
                          Clear filters
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  /* CASH HANDLER ROWS */

                  rows.map((row) => {
                    const reconciledShare =
                      row.expected > 0
                        ? Math.max(
                            0,
                            Math.min(
                              100,
                              (row.reconciled / row.expected) * 100,
                            ),
                          )
                        : 0;

                    const outstandingIsNegative =
                      row.outstanding < 0;

                    const hasOutstanding =
                      row.outstanding > 0;

                    const isNotifying =
                      notifyingCollectorId === row.id;

                    return (
                      <TableRow key={row.id}>
                        {/* CASH HANDLER */}

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              aria-hidden="true"
                              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                            >
                              {getInitials(row.name)}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {row.name}
                              </p>

                              <p className="truncate text-xs text-muted-foreground">
                                {row.email ?? "No email"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* CASH PAYMENTS */}

                        <TableCell className="text-right tabular-nums">
                          {row.paymentsCount.toLocaleString()}
                        </TableCell>

                        {/* EXPECTED */}

                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatMoney(row.expected)}
                        </TableCell>

                        {/* RECONCILIATION RECORDS */}

                        <TableCell className="text-right tabular-nums">
                          {row.reconciliationsCount.toLocaleString()}
                        </TableCell>

                        {/* RECONCILED */}

                        <TableCell className="text-right font-medium tabular-nums text-emerald-600">
                          {formatMoney(row.reconciled)}
                        </TableCell>

                        {/* OUTSTANDING */}

                        <TableCell
                          className={`text-right font-semibold tabular-nums ${
                            outstandingIsNegative
                              ? "text-emerald-600"
                              : hasOutstanding
                                ? "text-amber-600"
                                : "text-muted-foreground"
                          }`}
                        >
                          {formatMoney(row.outstanding)}
                        </TableCell>

                        {/* RECONCILED SHARE */}

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                              role="presentation"
                            >
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{
                                  width: `${reconciledShare}%`,
                                }}
                              />
                            </div>

                            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                              {Math.round(reconciledShare)}%
                            </span>
                          </div>
                        </TableCell>

                        {/* NOTIFY ACTION */}

                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={
                              !hasOutstanding ||
                              notifyMutation.isPending
                            }
                            onClick={() => void handleNotify(row)}
                            title={
                              hasOutstanding
                                ? `Notify ${row.name} about outstanding cash`
                                : "No outstanding cash to notify about"
                            }
                          >
                            {isNotifying ? (
                              <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                              <Bell className="mr-2 size-4" />
                            )}

                            {isNotifying
                              ? "Sending..."
                              : "Notify"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>

              {/* ================================================== */}
              {/* SERVER-SIDE TOTALS */}
              {/* ================================================== */}

              {!isLoading && rows.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-semibold">
                      Total
                    </TableCell>

                    <TableCell className="text-right font-semibold tabular-nums">
                      {totals.paymentsCount.toLocaleString()}
                    </TableCell>

                    <TableCell className="text-right font-bold tabular-nums">
                      {formatMoney(totals.expected)}
                    </TableCell>

                    <TableCell className="text-right font-semibold tabular-nums">
                      {totals.reconciliationsCount.toLocaleString()}
                    </TableCell>

                    <TableCell className="text-right font-bold tabular-nums text-emerald-600">
                      {formatMoney(totals.reconciled)}
                    </TableCell>

                    <TableCell className="text-right font-bold tabular-nums">
                      {formatMoney(totals.outstanding)}
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {expectedTotal > 0
                          ? `${Math.round(
                              Math.max(
                                0,
                                Math.min(
                                  100,
                                  (totals.reconciled / expectedTotal) *
                                    100,
                                ),
                              ),
                            )}%`
                          : "—"}
                      </span>
                    </TableCell>

                    <TableCell />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>

          {/* ================================================== */}
          {/* PAGINATION AND DATA SCOPE */}
          {/* ================================================== */}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {lastPage > 1
                  ? `Showing ${rows.length} cash handlers on page ${currentPage} of ${lastPage}. Aggregate totals cover all ${totalCollectors} matching users.`
                  : `Showing ${rows.length} of ${totalCollectors} matching cash handlers. Aggregate totals cover the complete filtered result.`}
              </p>

              <p className="text-xs text-muted-foreground">
                CSV export includes the cash handlers on the current page.
              </p>
            </div>

            {lastPage > 1 && (
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
                    setPage((current) =>
                      Math.max(1, current - 1),
                    )
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
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
