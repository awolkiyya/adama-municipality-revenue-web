"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  Loader2,
  MoreHorizontal,
  Plus,
  Printer,
  Search,
  SlidersHorizontal,
  Smartphone,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Textarea } from "@/components/ui/textarea";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import type {
  Payment,
  PaymentFilters,
} from "@/types/payment";

import {
  usePayments,
  useCompleteCashPayment,
  useRejectBankTransfer,
  useVerifyBankTransfer,
} from "@/hooks/payment/payment.hook";

// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_PER_PAGE = 10;

// =====================================================
// PAYMENT METHOD LABELS
// =====================================================

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  ONLINE: "Online Payment",
};

// =====================================================
// PAYMENT SOURCE LABELS
// =====================================================

const SOURCE_LABELS: Record<string, string> = {
  OFFICE_RECORDED: "Office",
  BANK_TRANSFER: "Bank Transfer",
  ONLINE: "Online",
};

// =====================================================
// PAYMENT STATUS LABELS
// =====================================================

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  REVERSED: "Reversed",
};

// =====================================================
// PAYMENT STATUS STYLES
// =====================================================

const STATUS_STYLES: Record<string, string> = {
  PENDING:
    "bg-yellow-50 text-yellow-700 ring-yellow-600/20",

  PROCESSING:
    "bg-blue-50 text-blue-700 ring-blue-600/20",

  COMPLETED:
    "bg-green-50 text-green-700 ring-green-600/20",

  FAILED:
    "bg-red-50 text-red-700 ring-red-600/20",

  CANCELLED:
    "bg-gray-50 text-gray-600 ring-gray-500/20",

  EXPIRED:
    "bg-gray-50 text-gray-600 ring-gray-500/20",

  REVERSED:
    "bg-orange-50 text-orange-700 ring-orange-600/20",
};

// =====================================================
// HELPERS
// =====================================================

function getPaymentIcon(
  method: Payment["payment_method"],
) {
  switch (method) {
    case "CASH":
      return (
        <Wallet className="h-4 w-4 text-muted-foreground" />
      );

    case "BANK_TRANSFER":
      return (
        <Building2 className="h-4 w-4 text-muted-foreground" />
      );

    case "ONLINE":
      return (
        <Smartphone className="h-4 w-4 text-muted-foreground" />
      );

    default:
      return (
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      );
  }
}

// =====================================================
// DATE FORMATTER
// =====================================================

function formatDate(
  value?: string | null,
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

// =====================================================
// AMOUNT FORMATTER
// =====================================================

function formatAmount(
  amount: number | string,
  currency: string,
): string {
  const numericAmount = Number(amount || 0);

  return (
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount) +
    ` ${currency}`
  );
}

// =====================================================
// PAYMENT DATE
// =====================================================
//
// Uses the most meaningful date for each payment method.
//
// CASH
//   cash_received_at
//
// BANK_TRANSFER
//   transfer_date
//
// ONLINE
//   paid_at
//
// fallback
//   created_at
//
// =====================================================

function getPaymentDate(
  payment: Payment,
): string | null {
  if (payment.payment_method === "CASH") {
    return (
      payment.cash_details?.cash_received_at ??
      payment.created_at
    );
  }

  if (
    payment.payment_method ===
    "BANK_TRANSFER"
  ) {
    return (
      payment.bank_transfer_details
        ?.transfer_date ??
      payment.created_at
    );
  }

  if (payment.payment_method === "ONLINE") {
    return (
      payment.online_details?.paid_at ??
      payment.created_at
    );
  }

  return payment.created_at;
}

// =====================================================
// METHOD DESCRIPTION
// =====================================================
//
// Provider/bank-specific information is no longer stored
// directly on Payment.
//
// Keep this helper based only on fields guaranteed by the
// current frontend Payment type.
//
// =====================================================

function getMethodDescription(
  payment: Payment,
): string {
  switch (payment.payment_method) {
    case "CASH":
      return (
        payment.cash_details
          ?.cashier_session_id
          ? `Cashier session ${payment.cash_details.cashier_session_id}`
          : "Municipal cash collection"
      );

    case "BANK_TRANSFER":
      return (
        payment.bank_transfer_details
          ?.transfer_reference
          ? `Transfer ${payment.bank_transfer_details.transfer_reference}`
          : "Bank transfer"
      );

    case "ONLINE":
      return (
        payment.online_details
          ?.checkout_reference
          ? `Checkout ${payment.online_details.checkout_reference}`
          : "Online payment"
      );

    default:
      return payment.payment_method;
  }
}

// =====================================================
// PAYMENT SOURCE LABEL
// =====================================================

function getPaymentSourceLabel(
  source:
    | Payment["payment_source"]
    | string
    | null
    | undefined,
): string {
  if (!source) {
    return "—";
  }

  return (
    SOURCE_LABELS[source] ??
    source
  );
}

// =====================================================
// FILTER GROUP
// =====================================================

function FilterGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Record<string, string>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {title}
        </h3>

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(options).map(
          ([key, label]) => {
            const selected =
              value === key;

            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  onChange(
                    selected ? "" : key,
                  )
                }
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  selected
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}

// =====================================================
// PAGE
// =====================================================

function PaymentsPage() {
  const router = useRouter();

  // ===================================================
  // FILTER STATE
  // ===================================================

  const [search, setSearch] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<string>("");

  const [paymentSource, setPaymentSource] =
    useState<string>("");

  const [status, setStatus] =
    useState<string>("");

  const [page, setPage] =
    useState(1);

  const [perPage, setPerPage] =
    useState(DEFAULT_PER_PAGE);

  // ===================================================
  // FILTER SHEET
  // ===================================================

  const [sheetOpen, setSheetOpen] =
    useState(false);

  const [draftMethod, setDraftMethod] =
    useState("");

  const [draftSource, setDraftSource] =
    useState("");

  const [draftStatus, setDraftStatus] =
    useState("");

  const activeFilterCount = [
    paymentMethod,
    paymentSource,
    status,
  ].filter(Boolean).length;

  const draftCount = [
    draftMethod,
    draftSource,
    draftStatus,
  ].filter(Boolean).length;

  const openSheet = () => {
    setDraftMethod(
      paymentMethod,
    );

    setDraftSource(
      paymentSource,
    );

    setDraftStatus(status);

    setSheetOpen(true);
  };

  const applyFilters = () => {
    setPaymentMethod(
      draftMethod,
    );

    setPaymentSource(
      draftSource,
    );

    setStatus(
      draftStatus,
    );

    setPage(1);

    setSheetOpen(false);
  };

  const clearDraft = () => {
    setDraftMethod("");
    setDraftSource("");
    setDraftStatus("");
  };

  const resetAll = () => {
    setSearch("");
    setPaymentMethod("");
    setPaymentSource("");
    setStatus("");
    setPage(1);
  };

  // ===================================================
  // REJECT PAYMENT DIALOG
  // ===================================================

  const [rejectDialogOpen, setRejectDialogOpen] =
    useState(false);

  const [rejectPayment, setRejectPayment] =
    useState<Payment | null>(null);

  const [rejectReason, setRejectReason] =
    useState("");

  // ===================================================
  // QUERY FILTERS
  // ===================================================

  const filters =
    useMemo<PaymentFilters>(() => {
      const result: PaymentFilters = {
        page,
        per_page: perPage,
      };

      const trimmedSearch =
        search.trim();

      if (trimmedSearch) {
        result.search =
          trimmedSearch;
      }

      if (paymentMethod) {
        result.payment_method =
          paymentMethod as PaymentFilters["payment_method"];
      }

      if (paymentSource) {
        result.payment_source =
          paymentSource as PaymentFilters["payment_source"];
      }

      if (status) {
        result.status =
          status as PaymentFilters["status"];
      }

      return result;
    }, [
      search,
      paymentMethod,
      paymentSource,
      status,
      page,
      perPage,
    ]);

  // ===================================================
  // PAYMENT QUERY
  // ===================================================

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = usePayments({
    params: filters,
  });

  // ===================================================
  // MUTATIONS
  // ===================================================

  const completeCashPayment =
    useCompleteCashPayment();

  const verifyBankTransfer =
    useVerifyBankTransfer();

  const rejectBankTransfer =
    useRejectBankTransfer();

  // ===================================================
  // DATA
  // ===================================================

  const payments =
    data?.data ?? [];

  const pagination =
    data?.meta;

  const currentPage =
    pagination?.current_page ??
    page;

  const lastPage =
    pagination?.last_page ??
    1;

  const total =
    pagination?.total ??
    payments.length;

  const rowOffset =
    (currentPage - 1) *
    perPage;

  // ===================================================
  // SUMMARY
  // ===================================================

  const summary =
    useMemo(() => {
      let totalAmount = 0;
      let completedAmount = 0;

      let pendingCount = 0;
      let completedCount = 0;

      for (const payment of payments) {
        const amount =
          Number(
            payment.amount || 0,
          );

        totalAmount += amount;

        if (
          payment.status ===
          "COMPLETED"
        ) {
          completedAmount +=
            amount;

          completedCount += 1;
        }

        if (
          payment.status ===
            "PENDING" ||
          payment.status ===
            "PROCESSING"
        ) {
          pendingCount += 1;
        }
      }

      return {
        totalAmount,
        completedAmount,
        pendingCount,
        completedCount,
      };
    }, [payments]);

  const currency =
    payments[0]?.currency ??
    "ETB";

  // ===================================================
  // NAVIGATION
  // ===================================================

  const goToPayment = (
    id: string,
  ) => {
    router.push(
      `/office/dashboard/payments/${encodeURIComponent(
        id,
      )}`,
    );
  };

  const goToReceipt = (
    id: string,
  ) => {
    router.push(
      `/office/dashboard/payments/${encodeURIComponent(
        id,
      )}/receipt`,
    );
  };

  const goToInvoice = (
    id: string,
  ) => {
    router.push(
      `/office/dashboard/invoices/${encodeURIComponent(
        id,
      )}`,
    );
  };

  // ===================================================
  // VERIFY BANK TRANSFER
  // ===================================================

  const handleVerify = async (
    paymentId: string,
  ) => {
    const confirmed =
      window.confirm(
        "Verify this bank transfer?\n\n" +
          "Successful verification will complete the payment, update the invoice, and generate the official receipt.",
      );

    if (!confirmed) {
      return;
    }

    try {
      await verifyBankTransfer.mutateAsync(
        {
          paymentId,
        },
      );
    } catch {
      // Mutation hook handles the error.
    }
  };

  // ===================================================
  // OPEN REJECT DIALOG
  // ===================================================

  const openRejectDialog = (
    payment: Payment,
  ) => {
    setRejectPayment(payment);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  // ===================================================
  // REJECT BANK TRANSFER
  // ===================================================

  const handleReject = async () => {
    if (!rejectPayment?.id) {
      return;
    }

    const reason =
      rejectReason.trim();

    if (!reason) {
      return;
    }

    try {
      await rejectBankTransfer.mutateAsync(
        {
          paymentId:
            rejectPayment.id,
          data: {
            reason,
          },
        },
      );

      setRejectDialogOpen(false);
      setRejectPayment(null);
      setRejectReason("");
    } catch {
      // Keep the dialog open so the officer
      // can see the error and retry.
    }
  };

  // ===================================================
  // COMPLETE CASH PAYMENT
  // ===================================================

  const handleCompleteCash =
    async (
      paymentId: string,
    ) => {
      const confirmed =
        window.confirm(
          "Complete this cash payment?\n\n" +
            "This will mark the payment as COMPLETED, apply the payment to the invoice, and generate the official receipt.",
        );

      if (!confirmed) {
        return;
      }

      try {
        await completeCashPayment.mutateAsync(
          paymentId,
        );
      } catch {
        // Mutation hook handles the error.
      }
    };

  // ===================================================
  // ERROR STATE
  // ===================================================

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Payments
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage cash, bank transfer, and
            online payments.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-5">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <p className="font-medium text-red-800">
              Failed to load payments
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================
  // ACTIVE FILTER CHIPS
  // ===================================================

  const chips = [
    paymentMethod && {
      label:
        METHOD_LABELS[
          paymentMethod
        ] ??
        paymentMethod,

      clear: () =>
        setPaymentMethod(""),
    },

    paymentSource && {
      label:
        getPaymentSourceLabel(
          paymentSource,
        ),

      clear: () =>
        setPaymentSource(""),
    },

    status && {
      label:
        STATUS_LABELS[status] ??
        status,

      clear: () =>
        setStatus(""),
    },
  ].filter(Boolean) as {
    label: string;
    clear: () => void;
  }[];

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Payments
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage and verify municipal payment
            transactions.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/office/dashboard/payments/create",
            )
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Record Payment
        </button>
      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* TOTAL RECORDS */}

        <div className="rounded-lg border bg-background p-4">
          <p className="text-sm text-muted-foreground">
            Payments on page
          </p>

          <p className="mt-1 text-xl font-semibold">
            {payments.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {total.toLocaleString()} total records
          </p>
        </div>

        {/* TOTAL AMOUNT */}

        <div className="rounded-lg border bg-background p-4">
          <p className="text-sm text-muted-foreground">
            Amount on page
          </p>

          <p className="mt-1 text-xl font-semibold">
            {formatAmount(
              summary.totalAmount,
              currency,
            )}
          </p>
        </div>

        {/* COMPLETED */}

        <div className="rounded-lg border bg-background p-4">
          <p className="text-sm text-muted-foreground">
            Completed
          </p>

          <p className="mt-1 text-xl font-semibold">
            {formatAmount(
              summary.completedAmount,
              currency,
            )}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {summary.completedCount} completed payment
            {summary.completedCount === 1
              ? ""
              : "s"}
          </p>
        </div>

        {/* PENDING */}

        <div className="rounded-lg border bg-background p-4">
          <p className="text-sm text-muted-foreground">
            Pending
          </p>

          <p className="mt-1 text-xl font-semibold">
            {summary.pendingCount}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Awaiting processing or completion
          </p>
        </div>
      </div>

      {/* =================================================
          TABLE CARD
      ================================================= */}

      <div className="rounded-lg border bg-background">

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="space-y-3 border-b p-4">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

            {/* SEARCH */}

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(
                    event.target.value,
                  );

                  setPage(1);
                }}
                placeholder="Search payment, invoice, or transaction..."
                className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* FILTER BUTTON */}

            <button
              type="button"
              onClick={openSheet}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
            >
              <SlidersHorizontal className="h-4 w-4" />

              Filters

              {activeFilterCount >
                0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* FETCHING */}

            {isFetching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* =================================================
              ACTIVE FILTER CHIPS
          ================================================= */}

          {(chips.length > 0 ||
            search.trim()) && (
            <div className="flex flex-wrap items-center gap-2">

              {/* SEARCH CHIP */}

              {search.trim() && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                  Search:{" "}
                  {search.trim()}

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    aria-label="Remove search"
                    className="rounded-full hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {/* FILTER CHIPS */}

              {chips.map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
                >
                  {chip.label}

                  <button
                    type="button"
                    onClick={() => {
                      chip.clear();
                      setPage(1);
                    }}
                    aria-label={`Remove ${chip.label} filter`}
                    className="rounded-full hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={resetAll}
                className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            {/* TABLE HEADER */}

            <thead className="border-b bg-muted/50 text-muted-foreground">
              <tr>
                <th className="w-12 px-4 py-3 text-left font-medium">
                  #
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Payment
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Invoice
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Method
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Source
                </th>

                <th className="px-4 py-3 text-right font-medium">
                  Amount
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Date
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Status
                </th>

                <th className="w-24 px-4 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            {/* TABLE BODY */}

            <tbody>

              {/* LOADING */}

              {isLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-14 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading payments...
                    </div>
                  </td>
                </tr>
              ) : payments.length ===
                0 ? (

                /* EMPTY */

                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-14 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <CreditCard className="h-8 w-8 text-muted-foreground" />

                      <p className="font-medium">
                        No payments found
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Try changing your search or filters.
                      </p>

                      {(search.trim() ||
                        activeFilterCount >
                          0) && (
                        <button
                          type="button"
                          onClick={
                            resetAll
                          }
                          className="mt-2 text-sm font-medium text-primary hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (

                /* DATA */

                payments.map(
                  (
                    payment,
                    index,
                  ) => {

                    // -----------------------------------------
                    // ACTION STATES
                    // -----------------------------------------

                    const isPendingCash =
                      payment.payment_method ===
                        "CASH" &&
                      payment.status ===
                        "PENDING";

                    const isPendingBank =
                      payment.payment_method ===
                        "BANK_TRANSFER" &&
                      payment.status ===
                        "PENDING";

                    const isCompleted =
                      payment.status ===
                      "COMPLETED";

                    const isCompleting =
                      completeCashPayment.isPending &&
                      completeCashPayment.variables ===
                        payment.id;

                    const isVerifying =
                      verifyBankTransfer.isPending &&
                      verifyBankTransfer
                        .variables
                        ?.paymentId ===
                        payment.id;

                    const isRejecting =
                      rejectBankTransfer.isPending &&
                      rejectBankTransfer
                        .variables
                        ?.paymentId ===
                        payment.id;

                    const paymentDate =
                      getPaymentDate(
                        payment,
                      );

                    const methodDescription =
                      getMethodDescription(
                        payment,
                      );

                    return (
                      <tr
                        key={
                          payment.id
                        }
                        className="border-b last:border-0 hover:bg-muted/30"
                      >

                        {/* =================================
                            #
                        ================================= */}

                        <td className="px-4 py-3 text-muted-foreground">
                          {rowOffset +
                            index +
                            1}
                        </td>

                        {/* =================================
                            PAYMENT
                        ================================= */}

                        <td className="px-4 py-3">
                          <div className="space-y-0.5">

                            <button
                              type="button"
                              onClick={() =>
                                goToPayment(
                                  payment.id,
                                )
                              }
                              className="font-medium hover:underline"
                            >
                              {
                                payment.payment_number
                              }
                            </button>

                            <p className="text-xs text-muted-foreground">
                              {
                                payment.transaction_reference
                              }
                            </p>
                          </div>
                        </td>

                        {/* =================================
                            INVOICE
                        ================================= */}

                        <td className="px-4 py-3">
                          {payment.invoice_id ? (
                            <button
                              type="button"
                              onClick={() =>
                                goToInvoice(
                                  payment.invoice_id!,
                                )
                              }
                              className="font-medium hover:underline"
                            >
                              {
                                payment.invoice_id
                              }
                            </button>
                          ) : (
                            <span className="text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>

                        {/* =================================
                            METHOD
                        ================================= */}

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">

                            {getPaymentIcon(
                              payment.payment_method,
                            )}

                            <div className="min-w-0 leading-tight">

                              <p>
                                {
                                  METHOD_LABELS[
                                    payment.payment_method
                                  ] ??
                                    payment.payment_method
                                }
                              </p>

                              <p className="max-w-48 truncate text-xs text-muted-foreground">
                                {
                                  methodDescription
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* =================================
                            SOURCE
                        ================================= */}

                        <td className="px-4 py-3">
                          <span className="text-sm">
                            {getPaymentSourceLabel(
                              payment.payment_source,
                            )}
                          </span>
                        </td>

                        {/* =================================
                            AMOUNT
                        ================================= */}

                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                          {formatAmount(
                            payment.amount,
                            payment.currency,
                          )}
                        </td>

                        {/* =================================
                            DATE
                        ================================= */}

                        <td className="whitespace-nowrap px-4 py-3">
                          {formatDate(
                            paymentDate,
                          )}
                        </td>

                        {/* =================================
                            STATUS
                        ================================= */}

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                              STATUS_STYLES[
                                payment.status
                              ] ??
                              "bg-muted text-muted-foreground ring-transparent"
                            }`}
                          >
                            {
                              STATUS_LABELS[
                                payment.status
                              ] ??
                                payment.status
                            }
                          </span>
                        </td>

                        {/* =================================
                            ACTIONS
                        ================================= */}

                        <td className="px-4 py-3">

                          <div className="flex items-center justify-end gap-1">

                            {/* VIEW */}

                            <button
                              type="button"
                              title="View payment"
                              onClick={() =>
                                goToPayment(
                                  payment.id,
                                )
                              }
                              className="rounded-md p-2 hover:bg-muted"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* MORE */}

                            <DropdownMenu>

                              <DropdownMenuTrigger
                                asChild
                              >
                                <button
                                  type="button"
                                  title="More actions"
                                  className="rounded-md p-2 hover:bg-muted"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent
                                align="end"
                                className="w-64"
                              >

                                {/* VIEW PAYMENT */}

                                <DropdownMenuItem
                                  onClick={() =>
                                    goToPayment(
                                      payment.id,
                                    )
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" />

                                  View Payment
                                </DropdownMenuItem>

                                {/* VIEW INVOICE */}

                                {payment.invoice_id && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      goToInvoice(
                                        payment.invoice_id!,
                                      )
                                    }
                                  >
                                    <CreditCard className="mr-2 h-4 w-4" />

                                    View Invoice
                                  </DropdownMenuItem>
                                )}

                                {/* =================================
                                    CASH
                                ================================= */}

                                {isPendingCash && (
                                  <>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                      disabled={
                                        isCompleting
                                      }
                                      onClick={() =>
                                        handleCompleteCash(
                                          payment.id,
                                        )
                                      }
                                    >
                                      {isCompleting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                      )}

                                      Complete Cash Payment
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {/* =================================
                                    BANK TRANSFER
                                ================================= */}

                                {isPendingBank && (
                                  <>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                      disabled={
                                        isVerifying ||
                                        isRejecting
                                      }
                                      onClick={() =>
                                        handleVerify(
                                          payment.id,
                                        )
                                      }
                                    >
                                      {isVerifying ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                      )}

                                      Verify Bank Transfer
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      disabled={
                                        isVerifying ||
                                        isRejecting
                                      }
                                      onClick={() =>
                                        openRejectDialog(
                                          payment,
                                        )
                                      }
                                      className="text-destructive focus:text-destructive"
                                    >
                                      {isRejecting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <XCircle className="mr-2 h-4 w-4" />
                                      )}

                                      Reject Bank Transfer
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {/* =================================
                                    RECEIPT
                                ================================= */}

                                {isCompleted &&
                                  payment.receipt && (
                                    <>
                                      <DropdownMenuSeparator />

                                      <DropdownMenuItem
                                        onClick={() =>
                                          goToReceipt(
                                            payment.id,
                                          )
                                        }
                                      >
                                        <Printer className="mr-2 h-4 w-4" />

                                        View / Print Receipt
                                      </DropdownMenuItem>
                                    </>
                                  )}

                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )
              )}
            </tbody>
          </table>
        </div>

        {/* =================================================
            PAGINATION
        ================================================= */}

        <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-muted-foreground">
            Page{" "}
            <span className="font-medium text-foreground">
              {currentPage}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {lastPage}
            </span>

            {" · "}

            <span className="font-medium text-foreground">
              {total}
            </span>{" "}
            payments
          </p>

          <div className="flex items-center gap-2">

            <select
              value={perPage}
              onChange={(event) => {
                setPerPage(
                  Number(
                    event.target.value,
                  ),
                );

                setPage(1);
              }}
              className="h-9 rounded-md border bg-background px-2 text-sm"
              aria-label="Payments per page"
            >
              {[10, 25, 50, 100].map(
                (number) => (
                  <option
                    key={number}
                    value={number}
                  >
                    {number} / page
                  </option>
                ),
              )}
            </select>

            <button
              type="button"
              disabled={
                isFetching ||
                currentPage <= 1
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.max(
                      1,
                      current - 1,
                    ),
                )
              }
              className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <button
              type="button"
              disabled={
                isFetching ||
                currentPage >=
                  lastPage
              }
              onClick={() =>
                setPage(
                  (current) =>
                    current + 1,
                )
              }
              className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>

          </div>
        </div>
      </div>

      {/* =================================================
          FILTER SHEET
      ================================================= */}

      <Sheet
        open={sheetOpen}
        onOpenChange={
          setSheetOpen
        }
      >
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">

          {/* HEADER */}

          <SheetHeader className="space-y-1 border-b px-6 py-5 pr-14 text-left">

            <SheetTitle className="text-lg">
              Payment Filters
            </SheetTitle>

            <SheetDescription>
              Narrow down payments by method, source,
              or payment status.
            </SheetDescription>

          </SheetHeader>

          {/* BODY */}

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">

            <FilterGroup
              title="Payment method"
              options={
                METHOD_LABELS
              }
              value={
                draftMethod
              }
              onChange={
                setDraftMethod
              }
            />

            <div className="border-t" />

            <FilterGroup
              title="Payment source"
              options={
                SOURCE_LABELS
              }
              value={
                draftSource
              }
              onChange={
                setDraftSource
              }
            />

            <div className="border-t" />

            <FilterGroup
              title="Payment status"
              options={
                STATUS_LABELS
              }
              value={
                draftStatus
              }
              onChange={
                setDraftStatus
              }
            />

          </div>

          {/* FOOTER */}

          <SheetFooter className="flex-row gap-3 border-t bg-muted/30 px-6 py-4 sm:space-x-0">

            <button
              type="button"
              onClick={
                clearDraft
              }
              disabled={
                draftCount === 0
              }
              className="h-10 flex-1 rounded-md border bg-background px-4 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              Clear all
            </button>

            <button
              type="button"
              onClick={
                applyFilters
              }
              className="h-10 flex-1 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Apply filters

              {draftCount >
                0
                ? ` (${draftCount})`
                : ""}
            </button>

          </SheetFooter>

        </SheetContent>
      </Sheet>

      {/* =================================================
          REJECT BANK TRANSFER DIALOG
      ================================================= */}

      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          if (
            !rejectBankTransfer.isPending
          ) {
            setRejectDialogOpen(
              open,
            );

            if (!open) {
              setRejectPayment(null);
              setRejectReason("");
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md">

          {/* HEADER */}

          <DialogHeader>
            <DialogTitle>
              Reject bank transfer
            </DialogTitle>

            <DialogDescription>
              Rejecting this payment will change
              its status to{" "}
              <strong>
                Cancelled
              </strong>
              . The payment will not be applied
              to the invoice.
            </DialogDescription>
          </DialogHeader>

          {rejectPayment && (
            <div className="space-y-5 py-2">

              {/* =========================================
                  PAYMENT SUMMARY
              ========================================= */}

              <div className="rounded-lg border bg-muted/30 p-4">

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    Payment
                  </span>

                  <span className="text-sm font-medium">
                    {
                      rejectPayment.payment_number
                    }
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    Amount
                  </span>

                  <span className="text-base font-semibold">
                    {formatAmount(
                      rejectPayment.amount,
                      rejectPayment.currency,
                    )}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    Transfer reference
                  </span>

                  <span className="max-w-48 break-all text-right font-mono text-xs font-medium">
                    {rejectPayment
                      .bank_transfer_details
                      ?.transfer_reference ??
                      "—"}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    Invoice
                  </span>

                  <span className="max-w-48 truncate text-right text-sm font-medium">
                    {rejectPayment.invoice_id ??
                      "—"}
                  </span>
                </div>

              </div>

              {/* =========================================
                  WARNING
              ========================================= */}

              <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">

                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />

                <p className="leading-5">
                  This action will cancel the pending
                  bank transfer. The amount will not
                  be recognized as a completed municipal
                  payment.
                </p>

              </div>

              {/* =========================================
                  REASON
              ========================================= */}

              <div className="space-y-2">

                <label
                  htmlFor="rejection-reason"
                  className="text-sm font-medium"
                >
                  Rejection reason
                  <span className="ml-1 text-destructive">
                    *
                  </span>
                </label>

                <Textarea
                  id="rejection-reason"
                  value={
                    rejectReason
                  }
                  onChange={(event) =>
                    setRejectReason(
                      event.target.value,
                    )
                  }
                  placeholder="Explain why this bank transfer cannot be verified..."
                  rows={4}
                  maxLength={500}
                  disabled={
                    rejectBankTransfer.isPending
                  }
                />

                <div className="flex justify-end">
                  <span className="text-xs text-muted-foreground">
                    {
                      rejectReason.length
                    }
                    /500
                  </span>
                </div>

              </div>

              {/* =========================================
                  ERROR
              ========================================= */}

              {rejectBankTransfer.isError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  {rejectBankTransfer.error instanceof
                  Error
                    ? rejectBankTransfer.error.message
                    : "Unable to reject this payment. Please try again."}
                </div>
              )}

            </div>
          )}

          {/* ===========================================
              FOOTER
          =========================================== */}

          <DialogFooter className="gap-2">

            <button
              type="button"
              disabled={
                rejectBankTransfer.isPending
              }
              onClick={() => {
                setRejectDialogOpen(
                  false,
                );

                setRejectPayment(null);
                setRejectReason("");
              }}
              className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                !rejectReason.trim() ||
                rejectBankTransfer.isPending
              }
              onClick={
                handleReject
              }
              className="inline-flex h-10 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {rejectBankTransfer.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Payment
                </>
              )}
            </button>

          </DialogFooter>

        </DialogContent>
      </Dialog>

    </div>
  );
}

export default PaymentsPage;