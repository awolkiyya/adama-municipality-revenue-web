"use client";

import {
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  Filter,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  IconTile,
  SectionCard,
  StatusPill,
} from "../primitives";
import { PAYMENTS } from "../data";
import { formatAmount } from "../utils";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type PaymentStatus = "SUCCESS" | "FAILED" | "PENDING";

type Payment = {
  id: string;
  title: string;
  transaction_number: string;
  method: string;
  paid_at: string;
  amount: number;
  status: PaymentStatus;

  /*
   * Optional fields.
   *
   * The component safely works even if your current
   * PAYMENTS mock data does not contain them.
   */
  provider?: string;
  invoice_number?: string;
};

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const ITEMS_PER_PAGE = 6;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalize(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function getPaymentIcon(status: PaymentStatus) {
  switch (status) {
    case "SUCCESS":
      return CheckCircle2;

    case "FAILED":
      return XCircle;

    default:
      return Clock;
  }
}

function getPaymentTone(status: PaymentStatus) {
  switch (status) {
    case "SUCCESS":
      return "success" as const;

    case "FAILED":
      return "danger" as const;

    default:
      return "primary" as const;
  }
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export function PaymentsPanel() {
  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | PaymentStatus>("ALL");

  const [methodFilter, setMethodFilter] =
    useState("ALL");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [sortOrder, setSortOrder] =
    useState<"NEWEST" | "OLDEST">("NEWEST");

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const successCount = PAYMENTS.filter(
    (payment) => payment.status === "SUCCESS"
  ).length;

  const failedCount = PAYMENTS.filter(
    (payment) => payment.status === "FAILED"
  ).length;

  const pendingCount = PAYMENTS.filter(
    (payment) => payment.status === "PENDING"
  ).length;

  const totalPaid = PAYMENTS.filter(
    (payment) => payment.status === "SUCCESS"
  ).reduce(
    (total, payment) => total + payment.amount,
    0
  );

  /*
  |--------------------------------------------------------------------------
  | Payment Methods
  |--------------------------------------------------------------------------
  */

  const paymentMethods = useMemo(() => {
    const methods = PAYMENTS.map(
      (payment) => payment.method
    ).filter(Boolean);

    return Array.from(
      new Set(methods)
    ).sort();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Filter + Search
  |--------------------------------------------------------------------------
  */

  const filteredPayments = useMemo(() => {
    const query = normalize(search);

    const filtered = (PAYMENTS as Payment[]).filter(
      (payment) => {
        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        const matchesSearch =
          !query ||
          normalize(payment.title).includes(query) ||
          normalize(
            payment.transaction_number
          ).includes(query) ||
          normalize(
            payment.invoice_number
          ).includes(query) ||
          normalize(payment.method).includes(query) ||
          normalize(payment.provider).includes(query);

        /*
        |--------------------------------------------------------------------------
        | Status
        |--------------------------------------------------------------------------
        */

        const matchesStatus =
          statusFilter === "ALL" ||
          payment.status === statusFilter;

        /*
        |--------------------------------------------------------------------------
        | Method
        |--------------------------------------------------------------------------
        */

        const matchesMethod =
          methodFilter === "ALL" ||
          payment.method === methodFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesMethod
        );
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Sort
    |--------------------------------------------------------------------------
    */

    return [...filtered].sort(
      (a, b) => {
        const dateA =
          new Date(a.paid_at).getTime();

        const dateB =
          new Date(b.paid_at).getTime();

        return sortOrder === "NEWEST"
          ? dateB - dateA
          : dateA - dateB;
      }
    );
  }, [
    search,
    statusFilter,
    methodFilter,
    sortOrder,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredPayments.length /
        ITEMS_PER_PAGE
    )
  );

  /*
  |--------------------------------------------------------------------------
  | Keep Current Page Valid
  |--------------------------------------------------------------------------
  */

  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE;

  const paginatedPayments =
    filteredPayments.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

  /*
  |--------------------------------------------------------------------------
  | Pagination Range
  |--------------------------------------------------------------------------
  */

  const firstResult =
    filteredPayments.length === 0
      ? 0
      : startIndex + 1;

  const lastResult = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredPayments.length
  );

  /*
  |--------------------------------------------------------------------------
  | Filters
  |--------------------------------------------------------------------------
  */

  const hasFilters =
    Boolean(search) ||
    statusFilter !== "ALL" ||
    methodFilter !== "ALL";

  function clearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setMethodFilter("ALL");
    setCurrentPage(1);
  }

  function handleSearch(
    value: string
  ) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleStatusChange(
    value: "ALL" | PaymentStatus
  ) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function handleMethodChange(
    value: string
  ) {
    setMethodFilter(value);
    setCurrentPage(1);
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/* ============================================================
          SUMMARY
          ============================================================ */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Successful */}

        <Card className="rounded-[20px] border-[var(--galii-border)] galii-card-in">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-[12.5px] text-[var(--galii-text-muted)]">
                  Successful payments
                </p>

                <p className="text-[26px] font-bold leading-none galii-serif">
                  {successCount}
                </p>

                <p className="text-[11px] font-semibold text-[var(--galii-success)]">
                  Completed transactions
                </p>
              </div>

              <IconTile
                icon={CheckCircle2}
                tone="success"
                size={10}
              />
            </div>
          </CardContent>
        </Card>

        {/* Total */}

        <Card className="rounded-[20px] border-[var(--galii-border)] galii-card-in">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <p className="text-[12.5px] text-[var(--galii-text-muted)]">
                  Total paid
                </p>

                <p className="text-[24px] font-bold leading-none galii-serif truncate">
                  {formatAmount(totalPaid,                                "ETB"
)}
                </p>

                <p className="text-[11px] font-semibold text-[var(--galii-text-faint)]">
                  Successful payments
                </p>
              </div>

              <IconTile
                icon={CreditCard}
                tone="primary"
                size={10}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pending */}

        <Card className="rounded-[20px] border-[var(--galii-border)] galii-card-in">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-[12.5px] text-[var(--galii-text-muted)]">
                  Pending
                </p>

                <p className="text-[26px] font-bold leading-none galii-serif">
                  {pendingCount}
                </p>

                <p className="text-[11px] font-semibold text-[var(--galii-text-faint)]">
                  Awaiting confirmation
                </p>
              </div>

              <IconTile
                icon={Clock}
                tone="primary"
                size={10}
              />
            </div>
          </CardContent>
        </Card>

        {/* Failed */}

        <Card className="rounded-[20px] border-[var(--galii-border)] galii-card-in">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-[12.5px] text-[var(--galii-text-muted)]">
                  Failed
                </p>

                <p className="text-[26px] font-bold leading-none galii-serif">
                  {failedCount}
                </p>

                <p className="text-[11px] font-semibold text-[var(--galii-danger)]">
                  Needs attention
                </p>
              </div>

              <IconTile
                icon={XCircle}
                tone="danger"
                size={10}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
          PAYMENT HISTORY
          ============================================================ */}

      <SectionCard title="Payment history">
        <div className="space-y-5">
          {/* ========================================================
              SEARCH + FILTERS
              ======================================================== */}

          <div className="rounded-[18px] border border-[var(--galii-border)] bg-[var(--galii-surface)] p-3">
            <div className="flex flex-col gap-3 lg:flex-row">
              {/* Search */}

              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--galii-text-faint)]"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    handleSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search payment, transaction, invoice..."
                  className="
                    h-11
                    w-full
                    rounded-[12px]
                    border
                    border-[var(--galii-border)]
                    bg-[var(--galii-bg)]
                    pl-10
                    pr-10
                    text-[13px]
                    outline-none
                    transition
                    placeholder:text-[var(--galii-text-faint)]
                    focus:border-[var(--galii-primary)]
                    focus:ring-2
                    focus:ring-[var(--galii-primary)]/10
                  "
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSearch("")
                    }
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      rounded-full
                      p-1
                      text-[var(--galii-text-faint)]
                      hover:bg-[var(--galii-border)]
                      hover:text-[var(--galii-text)]
                    "
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status */}

              <div className="flex items-center gap-2">
                <Filter className="hidden h-4 w-4 text-[var(--galii-text-faint)] sm:block" />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    handleStatusChange(
                      event.target.value as
                        | "ALL"
                        | PaymentStatus
                    )
                  }
                  className="
                    h-11
                    rounded-[12px]
                    border
                    border-[var(--galii-border)]
                    bg-[var(--galii-bg)]
                    px-3
                    text-[12.5px]
                    font-medium
                    outline-none
                    focus:border-[var(--galii-primary)]
                  "
                >
                  <option value="ALL">
                    All statuses
                  </option>

                  <option value="SUCCESS">
                    Successful
                  </option>

                  <option value="PENDING">
                    Pending
                  </option>

                  <option value="FAILED">
                    Failed
                  </option>
                </select>
              </div>

              {/* Method */}

              <select
                value={methodFilter}
                onChange={(event) =>
                  handleMethodChange(
                    event.target.value
                  )
                }
                className="
                  h-11
                  rounded-[12px]
                  border
                  border-[var(--galii-border)]
                  bg-[var(--galii-bg)]
                  px-3
                  text-[12.5px]
                  font-medium
                  outline-none
                  focus:border-[var(--galii-primary)]
                "
              >
                <option value="ALL">
                  All methods
                </option>

                {paymentMethods.map(
                  (method) => (
                    <option
                      key={method}
                      value={method}
                    >
                      {method}
                    </option>
                  )
                )}
              </select>

              {/* Sort */}

              <select
                value={sortOrder}
                onChange={(event) => {
                  setSortOrder(
                    event.target.value as
                      | "NEWEST"
                      | "OLDEST"
                  );

                  setCurrentPage(1);
                }}
                className="
                  h-11
                  rounded-[12px]
                  border
                  border-[var(--galii-border)]
                  bg-[var(--galii-bg)]
                  px-3
                  text-[12.5px]
                  font-medium
                  outline-none
                  focus:border-[var(--galii-primary)]
                "
              >
                <option value="NEWEST">
                  Newest first
                </option>

                <option value="OLDEST">
                  Oldest first
                </option>
              </select>

              {/* Clear */}

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="
                    h-11
                    rounded-[12px]
                    px-4
                    text-[12px]
                    font-semibold
                    text-[var(--galii-text-muted)]
                    transition
                    hover:bg-[var(--galii-border)]
                    hover:text-[var(--galii-text)]
                  "
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* ========================================================
              RESULT SUMMARY
              ======================================================== */}

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-semibold">
                Your payments
              </p>

              <p className="text-[11.5px] text-[var(--galii-text-faint)]">
                {filteredPayments.length === 0
                  ? "No payments found"
                  : `Showing ${firstResult}–${lastResult} of ${filteredPayments.length} payments`}
              </p>
            </div>

            {hasFilters && (
              <p className="text-[11px] text-[var(--galii-text-muted)]">
                Filters are active
              </p>
            )}
          </div>

          {/* ========================================================
              PAYMENT LIST
              ======================================================== */}

          {paginatedPayments.length > 0 ? (
            <div className="space-y-2.5">
              {paginatedPayments.map(
                (payment) => {
                  const Icon =
                    getPaymentIcon(
                      payment.status
                    );

                  const tone =
                    getPaymentTone(
                      payment.status
                    );

                  return (
                    <Card
                      key={payment.id}
                      className="
                        rounded-[16px]
                        border-[var(--galii-border)]
                        transition
                        hover:-translate-y-[1px]
                        hover:shadow-sm
                      "
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {/* Icon */}

                          <IconTile
                            icon={Icon}
                            tone={tone}
                            size={10}
                          />

                          {/* Main */}

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-[13.5px] font-semibold">
                                {payment.title}
                              </p>

                              <StatusPill
                                status={
                                  payment.status
                                }
                              />
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                              <span className="galii-mono text-[var(--galii-text-faint)]">
                                {
                                  payment.transaction_number
                                }
                              </span>

                              <span className="text-[var(--galii-text-faint)]">
                                •
                              </span>

                              <span className="text-[var(--galii-text-muted)]">
                                {
                                  payment.method
                                }
                              </span>

                              <span className="text-[var(--galii-text-faint)]">
                                •
                              </span>

                              <span className="text-[var(--galii-text-muted)]">
                                {
                                  payment.paid_at
                                }
                              </span>
                            </div>
                          </div>

                          {/* Amount */}

                          <div className="hidden text-right sm:block">
                            <p className="galii-mono text-[13.5px] font-semibold">
                              {formatAmount(
                                payment.amount,
                                "ETB"
                              )}
                            </p>

                            {payment.invoice_number && (
                              <p className="mt-1 text-[10.5px] text-[var(--galii-text-faint)]">
                                {
                                  payment.invoice_number
                                }
                              </p>
                            )}
                          </div>

                          {/* Actions */}

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="
                                hidden
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-[10px]
                                text-[var(--galii-text-muted)]
                                transition
                                hover:bg-[var(--galii-border)]
                                hover:text-[var(--galii-text)]
                                sm:flex
                              "
                              title="View payment"
                              aria-label="View payment"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {payment.status ===
                              "SUCCESS" && (
                              <button
                                type="button"
                                className="
                                  flex
                                  h-9
                                  w-9
                                  items-center
                                  justify-center
                                  rounded-[10px]
                                  text-[var(--galii-success)]
                                  transition
                                  hover:bg-[var(--galii-success)]/10
                                "
                                title="Download receipt"
                                aria-label="Download receipt"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Mobile amount */}

                        <div className="mt-3 flex items-center justify-between border-t border-[var(--galii-border)] pt-3 sm:hidden">
                          <div>
                            <p className="text-[10.5px] text-[var(--galii-text-faint)]">
                              Amount
                            </p>

                            <p className="mt-0.5 galii-mono text-[13px] font-semibold">
                              {formatAmount(
                                payment.amount,
                                "ETB"

                              )}
                            </p>
                          </div>

                          {payment.invoice_number && (
                            <div className="text-right">
                              <p className="text-[10.5px] text-[var(--galii-text-faint)]">
                                Invoice
                              </p>

                              <p className="mt-0.5 galii-mono text-[11px] text-[var(--galii-text-muted)]">
                                {
                                  payment.invoice_number
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              )}
            </div>
          ) : (
            /* ========================================================
               EMPTY STATE
               ======================================================== */

            <div className="rounded-[18px] border border-dashed border-[var(--galii-border)] py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--galii-border)]/50">
                <CreditCard className="h-5 w-5 text-[var(--galii-text-faint)]" />
              </div>

              <p className="mt-4 text-[14px] font-semibold">
                No payments found
              </p>

              <p className="mx-auto mt-1 max-w-sm text-[12px] leading-5 text-[var(--galii-text-muted)]">
                {hasFilters
                  ? "Try adjusting your search or filters to find the payment you are looking for."
                  : "Your completed and pending payments will appear here."}
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="
                    mt-4
                    rounded-[10px]
                    bg-[var(--galii-primary)]
                    px-4
                    py-2
                    text-[12px]
                    font-semibold
                    text-white
                    transition
                    hover:opacity-90
                  "
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* ========================================================
              PAGINATION
              ======================================================== */}

          {filteredPayments.length >
            ITEMS_PER_PAGE && (
            <div className="flex flex-col gap-3 border-t border-[var(--galii-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-[var(--galii-text-faint)]">
                Page {currentPage} of{" "}
                {totalPages}
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(
                          1,
                          page - 1
                        )
                    )
                  }
                  className="
                    rounded-[10px]
                    border
                    border-[var(--galii-border)]
                    px-3
                    py-2
                    text-[11px]
                    font-semibold
                    transition
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                    hover:bg-[var(--galii-border)]
                  "
                >
                  Previous
                </button>

                {Array.from(
                  {
                    length: totalPages,
                  },
                  (_, index) =>
                    index + 1
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        page
                      )
                    }
                    className={`
                      hidden
                      h-8
                      min-w-8
                      rounded-[9px]
                      px-2
                      text-[11px]
                      font-semibold
                      transition
                      sm:block
                      ${
                        page ===
                        currentPage
                          ? "bg-[var(--galii-primary)] text-white"
                          : "text-[var(--galii-text-muted)] hover:bg-[var(--galii-border)]"
                      }
                    `}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                    )
                  }
                  className="
                    rounded-[10px]
                    border
                    border-[var(--galii-border)]
                    px-3
                    py-2
                    text-[11px]
                    font-semibold
                    transition
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                    hover:bg-[var(--galii-border)]
                  "
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}