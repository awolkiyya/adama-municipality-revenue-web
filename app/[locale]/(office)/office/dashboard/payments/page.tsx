"use client";

import { useMemo, useState } from "react";
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
  Printer,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

import type {
  Payment,
  PaymentFilters,
} from "@/types/payment";
import {
  useCompleteCashPayment,
  usePayments,
  useRejectBankTransfer,
  useVerifyBankTransfer,
} from "@/hooks/payment/payment.hook";
import { EthiopianDatePicker } from "@/components/input/EthiopianDatePicker";

// =========================================================
// CONSTANTS
// =========================================================

const DEFAULT_PER_PAGE = 10;

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  ONLINE: "Online Payment",
};

const SOURCE_LABELS: Record<string, string> = {
  OFFICE_RECORDED: "Office",
  BANK_TRANSFER: "Bank Transfer",
  ONLINE: "Online",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  REVERSED: "Reversed",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  PROCESSING:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  COMPLETED:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300",
  FAILED:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  CANCELLED:
    "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300",
  EXPIRED:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300",
  REVERSED:
    "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-300",
};

// =========================================================
// TYPES
// =========================================================

type ActiveFilterChip = {
  label: string;
  clear: () => void;
};

// =========================================================
// DATE HELPERS
// =========================================================

function toApiDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function fromApiDate(value: string): Date | undefined {
  if (!value) return undefined;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

// =========================================================
// PAYMENT HELPERS
// =========================================================

function getPaymentIcon(method?: string) {
  switch (method) {
    case "CASH":
      return Wallet;
    case "BANK_TRANSFER":
      return Building2;
    case "ONLINE":
      return Smartphone;
    default:
      return CreditCard;
  }
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAmount(
  amount?: number | string | null,
  currency = "ETB",
): string {
  const numericAmount = Number(amount ?? 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericAmount) ? numericAmount : 0);
}

function getPaymentDate(payment: Payment): string | null {
  switch (payment.payment_method) {
    case "CASH":
      return (
        payment.cash_details?.cash_received_at ??
        payment.created_at ??
        null
      );

    case "BANK_TRANSFER":
      return (
        payment.bank_transfer_details?.transfer_date ??
        payment.created_at ??
        null
      );

    case "ONLINE":
      return (
        payment.online_details?.paid_at ??
        payment.created_at ??
        null
      );

    default:
      return payment.created_at ?? null;
  }
}

function getMethodDescription(payment: Payment): string {
  switch (payment.payment_method) {
    case "CASH":
      return payment.cash_details?.cashier_session_id
        ? `Session: ${payment.cash_details.cashier_session_id}`
        : "Cash payment";

    case "BANK_TRANSFER":
      return (
        payment.bank_transfer_details?.transfer_reference ??
        "Bank transfer"
      );

    case "ONLINE":
      return (
        payment.online_details?.checkout_reference ??
        "Online payment"
      );

    default:
      return "Payment";
  }
}

function getPaymentSourceLabel(source?: string | null): string {
  if (!source) return "—";

  return SOURCE_LABELS[source] ?? source.replaceAll("_", " ");
}

function getPaymentStatusLabel(status?: string | null): string {
  if (!status) return "Unknown";

  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

function getPaymentMethodLabel(method?: string | null): string {
  if (!method) return "Unknown";

  return METHOD_LABELS[method] ?? method.replaceAll("_", " ");
}

// =========================================================
// FILTER GROUP
// =========================================================

function FilterGroup({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string;
  options: {
    label: string;
    value: string;
  }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <Button
              key={option.value || "all"}
              type="button"
              size="sm"
              variant={selected ? "default" : "outline"}
              onClick={() => onChange(option.value)}
              className="h-8"
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// =========================================================
// MAIN PAGE
// =========================================================

export default function PaymentsPage() {
  const router = useRouter();

  // -------------------------------------------------------
  // ACTIVE FILTERS
  // -------------------------------------------------------

  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentSource, setPaymentSource] = useState("");
  const [status, setStatus] = useState("");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  // -------------------------------------------------------
  // FILTER SHEET DRAFT VALUES
  // -------------------------------------------------------

  const [sheetOpen, setSheetOpen] = useState(false);

  const [draftMethod, setDraftMethod] = useState("");
  const [draftSource, setDraftSource] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [draftDateFrom, setDraftDateFrom] = useState("");
  const [draftDateTo, setDraftDateTo] = useState("");

  // -------------------------------------------------------
  // VERIFY BANK TRANSFER DIALOG
  // -------------------------------------------------------

  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyPayment, setVerifyPayment] = useState<Payment | null>(null);

  // -------------------------------------------------------
  // REJECT BANK TRANSFER DIALOG
  // -------------------------------------------------------

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectPayment, setRejectPayment] = useState<Payment | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // -------------------------------------------------------
  // FILTER COUNTS
  // -------------------------------------------------------

  const activeFilterCount = [
    paymentMethod,
    paymentSource,
    status,
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  const draftCount = [
    draftMethod,
    draftSource,
    draftStatus,
    draftDateFrom,
    draftDateTo,
  ].filter(Boolean).length;

  // -------------------------------------------------------
  // API FILTERS
  // -------------------------------------------------------

  const filters = useMemo<
    PaymentFilters & {
      date_from?: string;
      date_to?: string;
    }
  >(() => {
    const result: PaymentFilters & {
      date_from?: string;
      date_to?: string;
    } = {
      page,
      per_page: perPage,
    };

    const trimmedSearch = search.trim();

    if (trimmedSearch) result.search = trimmedSearch;

    if (paymentMethod) {
      result.payment_method =
        paymentMethod as PaymentFilters["payment_method"];
    }

    if (paymentSource) {
      result.payment_source =
        paymentSource as PaymentFilters["payment_source"];
    }

    if (status) {
      result.status = status as PaymentFilters["status"];
    }

    if (dateFrom) result.date_from = dateFrom;
    if (dateTo) result.date_to = dateTo;

    return result;
  }, [
    search,
    paymentMethod,
    paymentSource,
    status,
    dateFrom,
    dateTo,
    page,
    perPage,
  ]);

  // -------------------------------------------------------
  // QUERIES AND MUTATIONS
  // -------------------------------------------------------

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = usePayments({
    params: filters,
  });

  const completeCashPayment = useCompleteCashPayment();
  const verifyBankTransfer = useVerifyBankTransfer();
  const rejectBankTransfer = useRejectBankTransfer();

  // -------------------------------------------------------
  // RESPONSE DATA
  // -------------------------------------------------------

  const payments = data?.data ?? [];
  const pagination = data?.meta;

  const currentPage = pagination?.current_page ?? page;
  const lastPage = pagination?.last_page ?? 1;
  const total = pagination?.total ?? payments.length;

  const rowOffset = (currentPage - 1) * perPage;

  // -------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------

  const completedAmount = payments.reduce(
    (sum, payment) =>
      payment.status === "COMPLETED"
        ? sum + Number(payment.amount ?? 0)
        : sum,
    0,
  );

  const pendingCount = payments.filter((payment) =>
    ["PENDING", "PROCESSING"].includes(payment.status),
  ).length;

  // -------------------------------------------------------
  // FILTER HANDLERS
  // -------------------------------------------------------

  const openSheet = () => {
    setDraftMethod(paymentMethod);
    setDraftSource(paymentSource);
    setDraftStatus(status);
    setDraftDateFrom(dateFrom);
    setDraftDateTo(dateTo);
    setSheetOpen(true);
  };

  const applyFilters = () => {
    if (draftDateFrom && draftDateTo && draftDateFrom > draftDateTo) {
      toast.error("The start date cannot be after the end date.");
      return;
    }

    setPaymentMethod(draftMethod);
    setPaymentSource(draftSource);
    setStatus(draftStatus);
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
    setPage(1);
    setSheetOpen(false);
  };

  const clearDraft = () => {
    setDraftMethod("");
    setDraftSource("");
    setDraftStatus("");
    setDraftDateFrom("");
    setDraftDateTo("");
  };

  const resetAll = () => {
    setSearch("");
    setPaymentMethod("");
    setPaymentSource("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setDraftMethod("");
    setDraftSource("");
    setDraftStatus("");
    setDraftDateFrom("");
    setDraftDateTo("");
    setPage(1);
  };

  // -------------------------------------------------------
  // ACTIVE FILTER CHIPS
  // -------------------------------------------------------

  const activeChips: ActiveFilterChip[] = [
    paymentMethod
      ? {
          label: `Method: ${getPaymentMethodLabel(paymentMethod)}`,
          clear: () => {
            setPaymentMethod("");
            setPage(1);
          },
        }
      : null,

    paymentSource
      ? {
          label: `Source: ${getPaymentSourceLabel(paymentSource)}`,
          clear: () => {
            setPaymentSource("");
            setPage(1);
          },
        }
      : null,

    status
      ? {
          label: `Status: ${getPaymentStatusLabel(status)}`,
          clear: () => {
            setStatus("");
            setPage(1);
          },
        }
      : null,

    dateFrom
      ? {
          label: `From: ${dateFrom}`,
          clear: () => {
            setDateFrom("");
            setPage(1);
          },
        }
      : null,

    dateTo
      ? {
          label: `To: ${dateTo}`,
          clear: () => {
            setDateTo("");
            setPage(1);
          },
        }
      : null,
  ].filter(Boolean) as ActiveFilterChip[];

  // -------------------------------------------------------
  // PAYMENT NAVIGATION
  // -------------------------------------------------------

  const openPayment = (payment: Payment) => {
    router.push(
      `/office/dashboard/payments/${encodeURIComponent(payment.id)}`,
    );
  };

  const openReceipt = (payment: Payment) => {
    router.push(
      `/office/dashboard/payments/${encodeURIComponent(payment.id)}/receipt`,
    );
  };

  const openInvoice = (payment: Payment) => {
    const invoiceId = payment.invoice?.id;

    if (!invoiceId) {
      toast.error("No invoice is associated with this payment.");
      return;
    }

    router.push(
      `/office/dashboard/invoices/${encodeURIComponent(invoiceId)}`,
    );
  };

  // -------------------------------------------------------
  // COMPLETE CASH PAYMENT
  // -------------------------------------------------------

  const handleCompleteCash = async (payment: Payment) => {
    if (payment.payment_method !== "CASH") return;

    if (payment.status !== "PENDING") {
      toast.error("Only pending cash payments can be completed.");
      return;
    }

    const confirmed = window.confirm(
      "Complete this cash payment? This will update the invoice and payment status.",
    );

    if (!confirmed) return;

    try {
      await completeCashPayment.mutateAsync(payment.id);
    } catch {
      // Mutation hook handles the API error.
    }
  };

  // -------------------------------------------------------
  // OPEN VERIFY DIALOG
  // -------------------------------------------------------

  const openVerifyDialog = (payment: Payment) => {
    if (payment.payment_method !== "BANK_TRANSFER") {
      toast.error("Only bank transfers can be verified here.");
      return;
    }

    if (payment.status !== "PENDING") {
      toast.error("Only pending bank transfers can be verified.");
      return;
    }

    setVerifyPayment(payment);
    setVerifyDialogOpen(true);
  };

  // -------------------------------------------------------
  // CONFIRM BANK TRANSFER VERIFICATION
  // -------------------------------------------------------

  const handleVerify = async () => {
    if (!verifyPayment || verifyBankTransfer.isPending) return;

    if (
      verifyPayment.payment_method !== "BANK_TRANSFER" ||
      verifyPayment.status !== "PENDING"
    ) {
      toast.error("This payment is no longer eligible for verification.");
      setVerifyDialogOpen(false);
      setVerifyPayment(null);
      return;
    }

    try {
      await verifyBankTransfer.mutateAsync({
        paymentId: verifyPayment.id,
      });

      setVerifyDialogOpen(false);
      setVerifyPayment(null);
    } catch {
      // Keep the dialog open so the officer can retry.
    }
  };

  // -------------------------------------------------------
  // REJECT BANK TRANSFER
  // -------------------------------------------------------

  const openRejectDialog = (payment: Payment) => {
    if (
      payment.payment_method !== "BANK_TRANSFER" ||
      payment.status !== "PENDING"
    ) {
      toast.error("Only pending bank transfers can be rejected.");
      return;
    }

    setRejectPayment(payment);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectPayment || rejectBankTransfer.isPending) return;

    const reason = rejectReason.trim();

    if (!reason) {
      toast.error("Enter a reason for rejecting this bank transfer.");
      return;
    }

    if (reason.length > 500) {
      toast.error("The rejection reason cannot exceed 500 characters.");
      return;
    }

    try {
      await rejectBankTransfer.mutateAsync({
        paymentId: rejectPayment.id,
        data: {
          reason,
        },
      });

      setRejectDialogOpen(false);
      setRejectPayment(null);
      setRejectReason("");
    } catch {
      // Keep the dialog open so the officer can retry.
    }
  };

  // -------------------------------------------------------
  // LOADING STATE
  // -------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading payments...
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // ERROR STATE
  // -------------------------------------------------------

  if (isError) {
    return (
      <div className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-2 text-destructive">
          <XCircle className="h-5 w-5" />
          <h2 className="font-semibold">Unable to load payments</h2>
        </div>

        <p className="text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "An unexpected error occurred while loading payments."}
        </p>

        <Button type="button" variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------
  // PAGE
  // -------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Review payment transactions, verify transfers, and view receipts.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => window.print()}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Payments on this page
            </p>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">{payments.length}</p>

          <p className="mt-1 text-xs text-muted-foreground">
            {total.toLocaleString()} matching transactions in total
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Completed amount on this page
            </p>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {formatAmount(completedAmount)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Completed payments on the current page
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Pending review</p>
            <Wallet className="h-4 w-4 text-amber-600" />
          </div>

          <p className="mt-2 text-2xl font-semibold">{pendingCount}</p>

          <p className="mt-1 text-xs text-muted-foreground">
            Pending or processing payments on this page
          </p>
        </div>
      </div>

      {/* TOOLBAR AND FILTERS */}

      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search payment number, invoice, or reference..."
              className="pl-9 pr-9"
            />

            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Sheet
            open={sheetOpen}
            onOpenChange={(open) => {
              if (open) {
                openSheet();
              } else {
                setSheetOpen(false);
              }
            }}
          >
            <SheetTrigger asChild>
              <Button type="button" variant="outline" className="shrink-0">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters

                {activeFilterCount > 0 && (
                  <Badge className="ml-2 h-5 min-w-5 justify-center px-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
            >
              <SheetHeader className="border-b p-5 text-left">
                <SheetTitle>Payment Filters</SheetTitle>

                <SheetDescription>
                  Narrow down payments by date, method, source, or status.
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-6 overflow-y-auto p-5">
                {/* DATE RANGE */}

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium">
                      Payment date range
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Select dates using the Ethiopian calendar.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="min-w-0 space-y-2">
                      <label className="text-sm font-medium">Date from</label>

                      <EthiopianDatePicker
                        value={fromApiDate(draftDateFrom)}
                        onChange={(date) => {
                          const nextDate = toApiDate(date);

                          setDraftDateFrom(nextDate);

                          if (draftDateTo && nextDate > draftDateTo) {
                            setDraftDateTo("");
                          }
                        }}
                        placeholder="Select start date"
                      />

                      {draftDateFrom && (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                          onClick={() => setDraftDateFrom("")}
                        >
                          Clear start date
                        </button>
                      )}
                    </div>

                    <div className="min-w-0 space-y-2">
                      <label className="text-sm font-medium">Date to</label>

                      <EthiopianDatePicker
                        value={fromApiDate(draftDateTo)}
                        onChange={(date) => {
                          const nextDate = toApiDate(date);

                          if (draftDateFrom && nextDate < draftDateFrom) {
                            toast.error(
                              "The end date cannot be before the start date.",
                            );
                            return;
                          }

                          setDraftDateTo(nextDate);
                        }}
                        placeholder="Select end date"
                      />

                      {draftDateTo && (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                          onClick={() => setDraftDateTo("")}
                        >
                          Clear end date
                        </button>
                      )}
                    </div>
                  </div>

                  {draftDateFrom && draftDateTo && (
                    <p className="text-xs text-muted-foreground">
                      API date range: {draftDateFrom} to {draftDateTo}
                    </p>
                  )}
                </div>

                <div className="border-t" />

                <FilterGroup
                  title="Payment method"
                  value={draftMethod}
                  onChange={setDraftMethod}
                  options={[
                    { label: "All", value: "" },
                    { label: "Cash", value: "CASH" },
                    { label: "Bank Transfer", value: "BANK_TRANSFER" },
                    { label: "Online", value: "ONLINE" },
                  ]}
                />

                <div className="border-t" />

                <FilterGroup
                  title="Payment source"
                  value={draftSource}
                  onChange={setDraftSource}
                  options={[
                    { label: "All", value: "" },
                    { label: "Office", value: "OFFICE_RECORDED" },
                    { label: "Bank Transfer", value: "BANK_TRANSFER" },
                    { label: "Online", value: "ONLINE" },
                  ]}
                />

                <div className="border-t" />

                <FilterGroup
                  title="Payment status"
                  value={draftStatus}
                  onChange={setDraftStatus}
                  options={[
                    { label: "All", value: "" },
                    { label: "Pending", value: "PENDING" },
                    { label: "Processing", value: "PROCESSING" },
                    { label: "Completed", value: "COMPLETED" },
                    { label: "Failed", value: "FAILED" },
                    { label: "Cancelled", value: "CANCELLED" },
                    { label: "Expired", value: "EXPIRED" },
                    { label: "Reversed", value: "REVERSED" },
                  ]}
                />
              </div>

              <SheetFooter className="border-t p-5 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearDraft}
                  className="sm:flex-1"
                >
                  Clear filters
                </Button>

                <Button
                  type="button"
                  onClick={applyFilters}
                  className="sm:flex-1"
                >
                  Apply filters
                  {draftCount > 0 && ` (${draftCount})`}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {isFetching && (
            <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating
            </div>
          )}
        </div>

        {/* ACTIVE FILTER CHIPS */}

        {(activeChips.length > 0 || search.trim()) && (
          <div className="flex flex-wrap items-center gap-2">
            {search.trim() && (
              <Badge variant="secondary" className="gap-1.5 py-1">
                Search: {search.trim()}

                <button
                  type="button"
                  aria-label="Clear search filter"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="ml-1 rounded-full hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {activeChips.map((chip) => (
              <Badge
                key={chip.label}
                variant="secondary"
                className="gap-1.5 py-1"
              >
                {chip.label}

                <button
                  type="button"
                  aria-label={`Remove ${chip.label} filter`}
                  onClick={chip.clear}
                  className="ml-1 rounded-full hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetAll}
              className="h-7 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* PAYMENTS TABLE */}

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Payment transactions</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Showing {payments.length ? rowOffset + 1 : 0}
              {"–"}
              {rowOffset + payments.length} of {total} payments
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="payments-per-page"
              className="text-sm text-muted-foreground"
            >
              Rows
            </label>

            <select
              id="payments-per-page"
              value={perPage}
              onChange={(event) => {
                setPerPage(Number(event.target.value));
                setPage(1);
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b text-left text-muted-foreground">
                <th className="w-14 px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="w-16 px-4 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CreditCard className="h-8 w-8 text-muted-foreground/60" />

                      <p className="font-medium">No payments found</p>

                      <p className="max-w-sm text-sm text-muted-foreground">
                        Try changing your search or filters to find matching
                        payment transactions.
                      </p>

                      {(activeFilterCount > 0 || search.trim()) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={resetAll}
                          className="mt-2"
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment, index) => {
                  const PaymentIcon = getPaymentIcon(
                    payment.payment_method,
                  );

                  const paymentDate = getPaymentDate(payment);

                  const canCompleteCash =
                    payment.payment_method === "CASH" &&
                    payment.status === "PENDING";

                  const canReviewBankTransfer =
                    payment.payment_method === "BANK_TRANSFER" &&
                    payment.status === "PENDING";

                  const hasReceipt = Boolean(payment.receipt?.id);

                  return (
                    <tr
                      key={payment.id}
                      className="border-b last:border-b-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-4 text-muted-foreground">
                        {rowOffset + index + 1}
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => openPayment(payment)}
                          className="text-left"
                        >
                          <span className="font-medium hover:underline">
                            {payment.payment_number ?? payment.id}
                          </span>
                        </button>

                        <p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">
                          {getMethodDescription(payment)}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        {payment.invoice?.id ? (
                          <button
                            type="button"
                            onClick={() => openInvoice(payment)}
                            className="text-left font-medium hover:underline"
                          >
                            {payment.invoice.invoice_number ??
                              payment.invoice.id}
                          </button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
                            <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                          </div>

                          <span>
                            {getPaymentMethodLabel(payment.payment_method)}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {getPaymentSourceLabel(payment.payment_source)}
                      </td>

                      <td className="px-4 py-4 text-right font-medium tabular-nums">
                        {formatAmount(
                          payment.amount,
                          payment.currency ?? "ETB",
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        {formatDate(paymentDate)}
                      </td>

                      <td className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className={
                            STATUS_STYLES[payment.status] ??
                            "border-muted bg-muted/30"
                          }
                        >
                          {getPaymentStatusLabel(payment.status)}
                        </Badge>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Payment actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                              onSelect={() => openPayment(payment)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View payment
                            </DropdownMenuItem>

                            {payment.invoice?.id && (
                              <DropdownMenuItem
                                onSelect={() => openInvoice(payment)}
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                View invoice
                              </DropdownMenuItem>
                            )}

                            {canCompleteCash && (
                              <>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  disabled={completeCashPayment.isPending}
                                  onSelect={() =>
                                    void handleCompleteCash(payment)
                                  }
                                >
                                  {completeCashPayment.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                  )}
                                  Complete cash payment
                                </DropdownMenuItem>
                              </>
                            )}

                            {canReviewBankTransfer && (
                              <>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  disabled={verifyBankTransfer.isPending}
                                  onSelect={() => openVerifyDialog(payment)}
                                >
                                  <ShieldCheck className="mr-2 h-4 w-4" />
                                  Verify bank transfer
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  disabled={rejectBankTransfer.isPending}
                                  onSelect={() => openRejectDialog(payment)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject bank transfer
                                </DropdownMenuItem>
                              </>
                            )}

                            {payment.status === "COMPLETED" && (
                              <>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  disabled={!hasReceipt}
                                  onSelect={() => openReceipt(payment)}
                                >
                                  <Printer className="mr-2 h-4 w-4" />
                                  View receipt
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {lastPage}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isFetching}
              onClick={() =>
                setPage((previous) => Math.max(1, previous - 1))
              }
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= lastPage || isFetching}
              onClick={() =>
                setPage((previous) => Math.min(lastPage, previous + 1))
              }
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* VERIFY BANK TRANSFER DIALOG */}

      <Dialog
        open={verifyDialogOpen}
        onOpenChange={(open) => {
          if (verifyBankTransfer.isPending) return;

          setVerifyDialogOpen(open);

          if (!open) {
            setVerifyPayment(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Verify bank transfer
            </DialogTitle>

            <DialogDescription>
              Review the payment information and confirm that the bank transfer
              has been verified against the actual bank transaction.
            </DialogDescription>
          </DialogHeader>

          {verifyPayment && (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Payment number
                </span>

                <span className="break-all text-right text-sm font-medium">
                  {verifyPayment.payment_number ?? verifyPayment.id}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Amount
                </span>

                <span className="text-right text-sm font-semibold">
                  {formatAmount(
                    verifyPayment.amount,
                    verifyPayment.currency ?? "ETB",
                  )}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Transfer reference
                </span>

                <span className="max-w-[65%] break-words text-right text-sm">
                  {verifyPayment.bank_transfer_details?.transfer_reference ??
                    "—"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-muted-foreground">Invoice</span>

                <span className="max-w-[65%] break-words text-right text-sm">
                  {verifyPayment.invoice?.invoice_number ??
                    verifyPayment.invoice?.id ??
                    "—"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Current status
                </span>

                <Badge
                  variant="outline"
                  className={
                    STATUS_STYLES[verifyPayment.status] ??
                    "border-muted bg-muted/30"
                  }
                >
                  {getPaymentStatusLabel(verifyPayment.status)}
                </Badge>
              </div>
            </div>
          )}

          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Confirm only after checking the bank transfer evidence and
            confirming the amount and reference against the appropriate bank
            records.
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={verifyBankTransfer.isPending}
              onClick={() => {
                setVerifyDialogOpen(false);
                setVerifyPayment(null);
              }}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={
                verifyBankTransfer.isPending ||
                !verifyPayment ||
                verifyPayment.status !== "PENDING"
              }
              onClick={() => void handleVerify()}
            >
              {verifyBankTransfer.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Confirm verification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT BANK TRANSFER DIALOG */}

      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          if (rejectBankTransfer.isPending) return;

          setRejectDialogOpen(open);

          if (!open) {
            setRejectPayment(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject bank transfer</DialogTitle>

            <DialogDescription>
              Provide a clear reason for rejecting this payment. The reason
              should explain why the transfer could not be verified.
            </DialogDescription>
          </DialogHeader>

          {rejectPayment && (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-muted-foreground">Payment</span>

                <span className="text-right text-sm font-medium">
                  {rejectPayment.payment_number ?? rejectPayment.id}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-muted-foreground">Amount</span>

                <span className="text-right text-sm font-semibold">
                  {formatAmount(
                    rejectPayment.amount,
                    rejectPayment.currency ?? "ETB",
                  )}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  Transfer reference
                </span>

                <span className="max-w-[65%] break-words text-right text-sm">
                  {rejectPayment.bank_transfer_details?.transfer_reference ??
                    "—"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-muted-foreground">Invoice</span>

                <span className="max-w-[65%] break-words text-right text-sm">
                  {rejectPayment.invoice?.invoice_number ??
                    rejectPayment.invoice?.id ??
                    "—"}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="bank-transfer-rejection-reason"
              className="text-sm font-medium"
            >
              Rejection reason <span className="text-destructive">*</span>
            </label>

            <Textarea
              id="bank-transfer-rejection-reason"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Explain why this bank transfer is being rejected..."
              rows={4}
              maxLength={500}
              disabled={rejectBankTransfer.isPending}
            />

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                A rejection reason is required.
              </p>

              <p className="text-xs tabular-nums text-muted-foreground">
                {rejectReason.length}/500
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={rejectBankTransfer.isPending}
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectPayment(null);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={
                rejectBankTransfer.isPending ||
                !rejectReason.trim() ||
                rejectReason.trim().length > 500
              }
              onClick={() => void handleReject()}
            >
              {rejectBankTransfer.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}