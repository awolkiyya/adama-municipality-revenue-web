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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import type { Payment, PaymentFilters } from "@/types/payment";
import {
  usePayments,
  usePostCashPayment,
  useRejectBankTransfer,
  useVerifyBankTransfer,
} from "@/hooks/payment/payment.hook";

// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_PER_PAGE = 10;

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  ONLINE: "Online Payment",
};

const PROVIDER_LABELS: Record<string, string> = {
  CASH: "Municipal Cash",
  BANK: "Bank",
  CHAPA: "Chapa",
  TELEBIRR: "Telebirr",
  CBE_BIRR: "CBE Birr",
};

const STATUS_LABELS: Record<string, string> = {
  INITIATED: "Initiated",
  PENDING: "Pending",
  RECORDED: "Recorded",
  PENDING_VERIFICATION: "Pending Verification",
  VERIFIED: "Verified",
  POSTED: "Posted",
  FAILED: "Failed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

const STATUS_STYLES: Record<string, string> = {
  POSTED: "bg-green-50 text-green-700 ring-green-600/20",
  VERIFIED: "bg-blue-50 text-blue-700 ring-blue-600/20",
  PENDING_VERIFICATION: "bg-blue-50 text-blue-700 ring-blue-600/20",
  RECORDED: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  INITIATED: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  PENDING: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  FAILED: "bg-red-50 text-red-700 ring-red-600/20",
  REJECTED: "bg-red-50 text-red-700 ring-red-600/20",
  CANCELLED: "bg-gray-50 text-gray-600 ring-gray-500/20",
  EXPIRED: "bg-gray-50 text-gray-600 ring-gray-500/20",
};

// =====================================================
// HELPERS
// =====================================================

function getPaymentIcon(method: Payment["payment_method"]) {
  switch (method) {
    case "CASH":
      return <Wallet className="h-4 w-4 text-muted-foreground" />;
    case "BANK_TRANSFER":
      return <Building2 className="h-4 w-4 text-muted-foreground" />;
    case "ONLINE":
      return <Smartphone className="h-4 w-4 text-muted-foreground" />;
    default:
      return <CreditCard className="h-4 w-4 text-muted-foreground" />;
  }
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatAmount(amount: number, currency: string): string {
  return (
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ` ${currency}`
  );
}

// =====================================================
// FILTER GROUP (chip-style single select)
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
        <h3 className="text-sm font-medium">{title}</h3>
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
        {Object.entries(options).map(([key, label]) => {
          const selected = value === key;

          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? "" : key)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                selected
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =====================================================
// PAGE
// =====================================================

function PaymentsPage() {
  const router = useRouter();

  // ---------- applied filters (sent to API) ----------
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentProvider, setPaymentProvider] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  // ---------- filter sheet (draft values) ----------
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftMethod, setDraftMethod] = useState("");
  const [draftProvider, setDraftProvider] = useState("");
  const [draftStatus, setDraftStatus] = useState("");

  const activeFilterCount = [paymentMethod, paymentProvider, status].filter(
    Boolean,
  ).length;

  const draftCount = [draftMethod, draftProvider, draftStatus].filter(
    Boolean,
  ).length;

  const openSheet = () => {
    setDraftMethod(paymentMethod);
    setDraftProvider(paymentProvider);
    setDraftStatus(status);
    setSheetOpen(true);
  };

  const applyFilters = () => {
    setPaymentMethod(draftMethod);
    setPaymentProvider(draftProvider);
    setStatus(draftStatus);
    setPage(1);
    setSheetOpen(false);
  };

  const clearDraft = () => {
    setDraftMethod("");
    setDraftProvider("");
    setDraftStatus("");
  };

  const resetAll = () => {
    setSearch("");
    setPaymentMethod("");
    setPaymentProvider("");
    setStatus("");
    setPage(1);
  };

  // ---------- query ----------
  const filters = useMemo<PaymentFilters>(() => {
    const result: PaymentFilters = { page, per_page: perPage };
    const trimmed = search.trim();
    if (trimmed) result.search = trimmed;
    if (paymentMethod)
      result.payment_method = paymentMethod as PaymentFilters["payment_method"];
    if (paymentProvider)
      result.payment_provider =
        paymentProvider as PaymentFilters["payment_provider"];
    if (status) result.status = status as PaymentFilters["status"];
    return result;
  }, [search, paymentMethod, paymentProvider, status, page, perPage]);

  const { data, isLoading, isFetching, isError, error } = usePayments({
    params: filters,
  });

  // ---------- mutations ----------
  const postCashPayment = usePostCashPayment();
  const verifyBankTransfer = useVerifyBankTransfer();
  const rejectBankTransfer = useRejectBankTransfer();

  const payments = data?.data ?? [];
  const pagination = data?.meta;

  const currentPage = pagination?.current_page ?? page;
  const lastPage = pagination?.last_page ?? 1;
  const total = pagination?.total ?? payments.length;
  const rowOffset = (currentPage - 1) * perPage;

  // Summary of the currently loaded page only (not global totals)
  const summary = useMemo(() => {
    let totalAmount = 0;
    let postedAmount = 0;
    let pendingVerification = 0;

    for (const p of payments) {
      const amount = Number(p.amount || 0);
      totalAmount += amount;
      if (p.status === "POSTED") postedAmount += amount;
      if (p.status === "PENDING_VERIFICATION") pendingVerification += 1;
    }

    return { totalAmount, postedAmount, pendingVerification };
  }, [payments]);

  const currency = payments[0]?.currency ?? "ETB";

  // ---------- navigation ----------
  const goToPayment = (id: string) =>
    router.push(`/office/dashboard/payments/${encodeURIComponent(id)}`);

  const goToReceipt = (id: string) =>
    router.push(`/office/dashboard/payments/${encodeURIComponent(id)}/receipt`);

  const goToInvoice = (id: string) =>
    router.push(`/office/dashboard/invoices/${encodeURIComponent(id)}`);

  // ---------- actions ----------
  const handleVerify = async (paymentId: string) => {
    if (
      !window.confirm(
        "Verify this bank transfer? This confirms the submitted transfer and allows the backend to continue the payment workflow.",
      )
    )
      return;
    await verifyBankTransfer.mutateAsync({ paymentId });
  };

  const handleReject = async (paymentId: string) => {
    const reason = window.prompt(
      "Enter the reason for rejecting this bank transfer:",
    );
    if (!reason?.trim()) return;
    await rejectBankTransfer.mutateAsync({
      paymentId,
      data: { reason: reason.trim() },
    });
  };

  const handlePostCash = async (paymentId: string) => {
    if (
      !window.confirm(
        "Post this cash payment? Posting makes the payment financially recognized by the backend.",
      )
    )
      return;
    await postCashPayment.mutateAsync(paymentId);
  };

  // ---------- error ----------
  if (isError) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Payments</h1>
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-5">
          <XCircle className="mt-0.5 h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800">Failed to load payments</p>
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

  // ---------- active filter chips ----------
  const chips = [
    paymentMethod && {
      label: METHOD_LABELS[paymentMethod] ?? paymentMethod,
      clear: () => setPaymentMethod(""),
    },
    paymentProvider && {
      label: PROVIDER_LABELS[paymentProvider] ?? paymentProvider,
      clear: () => setPaymentProvider(""),
    },
    status && {
      label: STATUS_LABELS[status] ?? status,
      clear: () => setStatus(""),
    },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  // ---------- render ----------
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Manage cash, bank transfer, and online payments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/office/dashboard/payments/create")}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Record Payment
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Payments on page", value: String(payments.length) },
          {
            label: "Amount on page",
            value: formatAmount(summary.totalAmount, currency),
          },
          {
            label: "Posted on page",
            value: formatAmount(summary.postedAmount, currency),
          },
          {
            label: "Pending verification",
            value: String(summary.pendingVerification),
          },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border bg-background p-4">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-lg border bg-background">
        {/* Toolbar */}
        <div className="space-y-3 border-b p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search payment or invoice..."
                className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="button"
              onClick={openSheet}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {isFetching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Active chips */}
          {(chips.length > 0 || search.trim()) && (
            <div className="flex flex-wrap items-center gap-2">
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-muted-foreground">
              <tr>
                <th className="w-12 px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Payment</th>
                <th className="px-4 py-3 text-left font-medium">Invoice</th>
                <th className="px-4 py-3 text-left font-medium">Method</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="w-24 px-4 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading payments...
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                      <p className="font-medium">No payments found</p>
                      <p className="text-sm text-muted-foreground">
                        Try changing your search or filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment, index) => {
                  const isPendingVerification =
                    payment.status === "PENDING_VERIFICATION";
                  const isRecordedCash =
                    payment.payment_method === "CASH" &&
                    payment.status === "RECORDED";
                  const isPosted = payment.status === "POSTED";

                  const isVerifying =
                    verifyBankTransfer.isPending &&
                    verifyBankTransfer.variables?.paymentId === payment.id;
                  const isRejecting =
                    rejectBankTransfer.isPending &&
                    rejectBankTransfer.variables?.paymentId === payment.id;
                  const isPosting =
                    postCashPayment.isPending &&
                    postCashPayment.variables === payment.id;

                  return (
                    <tr
                      key={payment.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      {/* # */}
                      <td className="px-4 py-3 text-muted-foreground">
                        {rowOffset + index + 1}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => goToPayment(payment.id)}
                          className="font-medium hover:underline"
                        >
                          {payment.id}
                        </button>
                      </td>

                      {/* Invoice */}
                      <td className="px-4 py-3">
                        {payment.invoice_id ? (
                          <button
                            type="button"
                            onClick={() => goToInvoice(payment.invoice_id!)}
                            className="hover:underline"
                          >
                            {payment.invoice_id}
                          </button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Method + provider */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getPaymentIcon(payment.payment_method)}
                          <div className="leading-tight">
                            <p>
                              {METHOD_LABELS[payment.payment_method] ??
                                payment.payment_method}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {PROVIDER_LABELS[payment.payment_provider] ??
                                payment.payment_provider}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                        {formatAmount(payment.amount, payment.currency)}
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-4 py-3">
                        {formatDate(payment.payment_date)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                            STATUS_STYLES[payment.status] ??
                            "bg-muted text-muted-foreground ring-transparent"
                          }`}
                        >
                          {STATUS_LABELS[payment.status] ?? payment.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="View payment"
                            onClick={() => goToPayment(payment.id)}
                            className="rounded-md p-2 hover:bg-muted"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                title="More actions"
                                className="rounded-md p-2 hover:bg-muted"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem
                                onClick={() => goToPayment(payment.id)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Payment
                              </DropdownMenuItem>

                              {isPendingVerification && (
                                <>
                                  <DropdownMenuItem
                                    disabled={isVerifying || isRejecting}
                                    onClick={() => handleVerify(payment.id)}
                                  >
                                    {isVerifying ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                    )}
                                    Verify Bank Transfer
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    disabled={isVerifying || isRejecting}
                                    onClick={() => handleReject(payment.id)}
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

                              {isRecordedCash && (
                                <DropdownMenuItem
                                  disabled={isPosting}
                                  onClick={() => handlePostCash(payment.id)}
                                >
                                  {isPosting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                  )}
                                  Post Cash Payment
                                </DropdownMenuItem>
                              )}

                              {isPosted && (
                                <DropdownMenuItem
                                  onClick={() => goToReceipt(payment.id)}
                                >
                                  <Printer className="mr-2 h-4 w-4" />
                                  View / Print Receipt
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (single) */}
        <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page{" "}
            <span className="font-medium text-foreground">{currentPage}</span>{" "}
            of <span className="font-medium text-foreground">{lastPage}</span>
            {" · "}
            <span className="font-medium text-foreground">{total}</span>{" "}
            payments
          </p>

          <div className="flex items-center gap-2">
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={isFetching || currentPage <= 1}
              onClick={() => setPage((c) => Math.max(1, c - 1))}
              className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <button
              type="button"
              disabled={isFetching || currentPage >= lastPage}
              onClick={() => setPage((c) => c + 1)}
              className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          {/* Header */}
          <SheetHeader className="space-y-1 border-b px-6 py-5 pr-14 text-left">
            <SheetTitle className="text-lg">Filters</SheetTitle>
            <SheetDescription>
              Narrow down the payments shown in the table.
            </SheetDescription>
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <FilterGroup
              title="Payment method"
              options={METHOD_LABELS}
              value={draftMethod}
              onChange={setDraftMethod}
            />

            <div className="border-t" />

            <FilterGroup
              title="Provider"
              options={PROVIDER_LABELS}
              value={draftProvider}
              onChange={setDraftProvider}
            />

            <div className="border-t" />

            <FilterGroup
              title="Status"
              options={STATUS_LABELS}
              value={draftStatus}
              onChange={setDraftStatus}
            />
          </div>

          {/* Footer */}
          <SheetFooter className="flex-row gap-3 border-t bg-muted/30 px-6 py-4 sm:space-x-0">
            <button
              type="button"
              onClick={clearDraft}
              disabled={draftCount === 0}
              className="h-10 flex-1 rounded-md border bg-background px-4 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              Clear all
            </button>

            <button
              type="button"
              onClick={applyFilters}
              className="h-10 flex-1 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Apply filters{draftCount > 0 ? ` (${draftCount})` : ""}
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default PaymentsPage;