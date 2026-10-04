"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  Filter,
  Landmark,
  Search,
  Smartphone,
  WalletCards,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/* =========================================================
   TYPES
   ========================================================= */

type PaymentMethod = "ONLINE" | "BANK_TRANSFER";

type PaymentStatus = "POSTED" | "PENDING_VERIFICATION";

type Payment = {
  id: string;
  receiptNumber: string;
  invoiceNumber: string;
  taxpayerName: string;
  tin: string;
  amount: number;
  method: PaymentMethod;
  provider?: "TELEBIRR" | "CHAPA";
  bank?: string;
  reference?: string;
  status: PaymentStatus;
  date: string;
  time: string;
};

/* =========================================================
   MOCK DATA
   ========================================================= */

const MOCK_PAYMENTS: Payment[] = [
  {
    id: "PAY-00091",
    receiptNumber: "RCT-2026-00091",
    invoiceNumber: "INV-2026-00124",
    taxpayerName: "Abebe Trading PLC",
    tin: "0012345678",
    amount: 12500,
    method: "ONLINE",
    provider: "TELEBIRR",
    status: "POSTED",
    date: "2026-10-03",
    time: "14:32",
  },
  {
    id: "PAY-00090",
    receiptNumber: "RCT-2026-00090",
    invoiceNumber: "INV-2026-00121",
    taxpayerName: "Hawa Mohammed",
    tin: "0019876543",
    amount: 4800,
    method: "BANK_TRANSFER",
    bank: "Commercial Bank of Ethiopia",
    reference: "CBE-784521",
    status: "PENDING_VERIFICATION",
    date: "2026-10-03",
    time: "13:18",
  },
  {
    id: "PAY-00089",
    receiptNumber: "RCT-2026-00089",
    invoiceNumber: "INV-2026-00118",
    taxpayerName: "Kedir Construction",
    tin: "0023456789",
    amount: 28500,
    method: "ONLINE",
    provider: "CHAPA",
    status: "POSTED",
    date: "2026-10-03",
    time: "11:45",
  },
  {
    id: "PAY-00088",
    receiptNumber: "RCT-2026-00088",
    invoiceNumber: "INV-2026-00115",
    taxpayerName: "Sara Hotel",
    tin: "0034567891",
    amount: 17600,
    method: "BANK_TRANSFER",
    bank: "Awash Bank",
    reference: "AWB-458921",
    status: "POSTED",
    date: "2026-10-03",
    time: "10:26",
  },
  {
    id: "PAY-00087",
    receiptNumber: "RCT-2026-00087",
    invoiceNumber: "INV-2026-00109",
    taxpayerName: "Mekonnen Services",
    tin: "0045678912",
    amount: 7200,
    method: "ONLINE",
    provider: "TELEBIRR",
    status: "POSTED",
    date: "2026-10-03",
    time: "09:41",
  },
  {
    id: "PAY-00086",
    receiptNumber: "RCT-2026-00086",
    invoiceNumber: "INV-2026-00103",
    taxpayerName: "Fatuma Ali",
    tin: "0056789123",
    amount: 3500,
    method: "BANK_TRANSFER",
    bank: "Dashen Bank",
    reference: "DB-928374",
    status: "PENDING_VERIFICATION",
    date: "2026-10-03",
    time: "09:12",
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

const formatETB = (amount: number) =>
  new Intl.NumberFormat("en-ET", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

/* =========================================================
   STATUS BADGE
   ========================================================= */

function StatusBadge({
  status,
}: {
  status: PaymentStatus;
}) {
  if (status === "POSTED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Posted
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/10">
      <Clock3 className="h-3.5 w-3.5" />
      Pending verification
    </span>
  );
}

/* =========================================================
   METHOD
   ========================================================= */

function MethodBadge({
  payment,
}: {
  payment: Payment;
}) {
  if (payment.method === "ONLINE") {
    return (
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
          <Smartphone className="h-4 w-4 text-slate-600" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">
            Online
          </p>

          <p className="text-xs text-slate-400">
            {payment.provider}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Landmark className="h-4 w-4 text-slate-600" />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">
          Bank transfer
        </p>

        <p className="max-w-[180px] truncate text-xs text-slate-400">
          {payment.bank}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   FILTER OPTION
   ========================================================= */

function FilterOption({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-slate-200 hover:bg-slate-50",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
          selected
            ? "border-primary"
            : "border-slate-300",
        ].join(" ")}
      >
        {selected && (
          <span className="h-2 w-2 rounded-full bg-primary" />
        )}
      </span>

      <span
        className={[
          "text-sm",
          selected
            ? "font-medium text-slate-900"
            : "text-slate-600",
        ].join(" ")}
      >
        {children}
      </span>
    </button>
  );
}

/* =========================================================
   PAGE
   ========================================================= */

export default function PaymentsPage() {
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | PaymentStatus
  >("ALL");

  const [methodFilter, setMethodFilter] = useState<
    "ALL" | PaymentMethod
  >("ALL");

  /* ---------------------------------------------------------
     FILTERED PAYMENTS
     --------------------------------------------------------- */

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return MOCK_PAYMENTS.filter((payment) => {
      const matchesSearch =
        !query ||
        payment.id.toLowerCase().includes(query) ||
        payment.receiptNumber.toLowerCase().includes(query) ||
        payment.invoiceNumber.toLowerCase().includes(query) ||
        payment.taxpayerName.toLowerCase().includes(query) ||
        payment.tin.toLowerCase().includes(query) ||
        payment.reference?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        payment.status === statusFilter;

      const matchesMethod =
        methodFilter === "ALL" ||
        payment.method === methodFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMethod
      );
    });
  }, [search, statusFilter, methodFilter]);

  /* ---------------------------------------------------------
     SUMMARY
     --------------------------------------------------------- */

  const postedToday = MOCK_PAYMENTS.filter(
    (payment) => payment.status === "POSTED",
  ).reduce(
    (total, payment) => total + payment.amount,
    0,
  );

  const pendingAmount = MOCK_PAYMENTS.filter(
    (payment) =>
      payment.status === "PENDING_VERIFICATION",
  ).reduce(
    (total, payment) => total + payment.amount,
    0,
  );

  const postedCount = MOCK_PAYMENTS.filter(
    (payment) => payment.status === "POSTED",
  ).length;

  const pendingCount = MOCK_PAYMENTS.filter(
    (payment) =>
      payment.status === "PENDING_VERIFICATION",
  ).length;

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    methodFilter !== "ALL";

  const activeFilterCount =
    (statusFilter !== "ALL" ? 1 : 0) +
    (methodFilter !== "ALL" ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter("ALL");
    setMethodFilter("ALL");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <WalletCards className="h-4 w-4" />

                <span>Revenue</span>

                <span>/</span>

                <span className="text-slate-700">
                  Payments
                </span>
              </div>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                Payments
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View payments processed on behalf of taxpayers.
              </p>
            </div>

            <Button asChild>
              <Link href="/revenue/payments/process">
                Process payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* ===================================================
            SUMMARY
            =================================================== */}

        <section className="grid gap-4 md:grid-cols-3">
          {/* Posted */}
          <SummaryCard
            label="Posted today"
            value={`ETB ${formatETB(postedToday)}`}
            description={`${postedCount} ${
              postedCount === 1
                ? "payment"
                : "payments"
            } successfully posted`}
            icon={CheckCircle2}
            iconClassName="bg-emerald-50 text-emerald-600"
          />

          {/* Pending */}
          <SummaryCard
            label="Pending verification"
            value={`ETB ${formatETB(pendingAmount)}`}
            description={`${pendingCount} ${
              pendingCount === 1
                ? "payment"
                : "payments"
            } awaiting verification`}
            icon={Clock3}
            iconClassName="bg-amber-50 text-amber-600"
            attention={pendingCount > 0}
          />

          {/* Transactions */}
          <SummaryCard
            label="Payments today"
            value={MOCK_PAYMENTS.length.toString()}
            description="Online and bank transfer payments"
            icon={CreditCard}
            iconClassName="bg-slate-100 text-slate-600"
          />
        </section>

        {/* ===================================================
            PAYMENT HISTORY
            =================================================== */}

        <section className="overflow-hidden rounded-xl border bg-white">
          {/* -------------------------------------------------
              SECTION HEADER
              ------------------------------------------------- */}

          <div className="border-b px-5 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Payment history
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  Payments processed by you.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {/* Search */}
                <div className="relative sm:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search payment, invoice or taxpayer"
                    className="h-10 pl-9 pr-9"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filter Sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="relative h-10 gap-2"
                    >
                      <Filter className="h-4 w-4" />

                      Filter

                      {activeFilterCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>

                  <SheetContent
                    side="right"
                    className="flex w-full flex-col sm:max-w-md"
                  >
                    <SheetHeader className="border-b pb-5">
                      <SheetTitle>
                        Filter payments
                      </SheetTitle>

                      <SheetDescription>
                        Refine the payment history by status
                        or payment method.
                      </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 space-y-7 overflow-y-auto py-6">
                      {/* Status */}
                      <div>
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-slate-900">
                            Status
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            Select the payment status to display.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <FilterOption
                            selected={
                              statusFilter === "ALL"
                            }
                            onClick={() =>
                              setStatusFilter("ALL")
                            }
                          >
                            All statuses
                          </FilterOption>

                          <FilterOption
                            selected={
                              statusFilter === "POSTED"
                            }
                            onClick={() =>
                              setStatusFilter("POSTED")
                            }
                          >
                            Posted
                          </FilterOption>

                          <FilterOption
                            selected={
                              statusFilter ===
                              "PENDING_VERIFICATION"
                            }
                            onClick={() =>
                              setStatusFilter(
                                "PENDING_VERIFICATION",
                              )
                            }
                          >
                            Pending verification
                          </FilterOption>
                        </div>
                      </div>

                      {/* Method */}
                      <div>
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-slate-900">
                            Payment method
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            Select how the payment was processed.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <FilterOption
                            selected={
                              methodFilter === "ALL"
                            }
                            onClick={() =>
                              setMethodFilter("ALL")
                            }
                          >
                            All methods
                          </FilterOption>

                          <FilterOption
                            selected={
                              methodFilter === "ONLINE"
                            }
                            onClick={() =>
                              setMethodFilter("ONLINE")
                            }
                          >
                            <span className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4 text-slate-500" />
                              Online
                            </span>
                          </FilterOption>

                          <FilterOption
                            selected={
                              methodFilter ===
                              "BANK_TRANSFER"
                            }
                            onClick={() =>
                              setMethodFilter(
                                "BANK_TRANSFER",
                              )
                            }
                          >
                            <span className="flex items-center gap-2">
                              <Landmark className="h-4 w-4 text-slate-500" />
                              Bank transfer
                            </span>
                          </FilterOption>
                        </div>
                      </div>
                    </div>

                    <SheetFooter className="border-t pt-4">
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                      >
                        Clear filters
                      </Button>

                      <SheetClose asChild>
                        <Button>
                          Apply filters
                        </Button>
                      </SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Active filter summary */}
            {(hasActiveFilters || search) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-500">
                  Active:
                </span>

                {search && (
                  <FilterChip
                    label={`Search: ${search}`}
                    onRemove={() => setSearch("")}
                  />
                )}

                {statusFilter !== "ALL" && (
                  <FilterChip
                    label={
                      statusFilter === "POSTED"
                        ? "Posted"
                        : "Pending verification"
                    }
                    onRemove={() =>
                      setStatusFilter("ALL")
                    }
                  />
                )}

                {methodFilter !== "ALL" && (
                  <FilterChip
                    label={
                      methodFilter === "ONLINE"
                        ? "Online"
                        : "Bank transfer"
                    }
                    onRemove={() =>
                      setMethodFilter("ALL")
                    }
                  />
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    clearFilters();
                  }}
                  className="ml-1 text-xs font-medium text-primary hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* -------------------------------------------------
              TABLE
              ------------------------------------------------- */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b bg-slate-50/70">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Payment
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Taxpayer
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Method
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b last:border-0 transition-colors hover:bg-slate-50/70"
                  >
                    {/* Payment */}
                    <td className="px-5 py-4">
                      <Link
                        href={`/revenue/payments/${payment.id}`}
                        className="group inline-block"
                      >
                        <p className="font-medium text-slate-900 group-hover:text-primary">
                          {payment.receiptNumber}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {payment.invoiceNumber}
                        </p>
                      </Link>
                    </td>

                    {/* Taxpayer */}
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-slate-800">
                          {payment.taxpayerName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          TIN: {payment.tin}
                        </p>
                      </div>
                    </td>

                    {/* Method */}
                    <td className="px-5 py-4">
                      <MethodBadge payment={payment} />

                      {payment.reference && (
                        <p className="mt-1 pl-10 text-xs text-slate-400">
                          Ref: {payment.reference}
                        </p>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4 text-right">
                      <span className="font-semibold tabular-nums text-slate-900">
                        ETB {formatETB(payment.amount)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge
                        status={payment.status}
                      />
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">
                        {payment.date}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {payment.time}
                      </p>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                      >
                        <Link
                          href={`/agent/dashboard/payments/${payment.id}`}
                        >
                          View
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}

                {/* Empty state */}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-16">
                      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                          <Search className="h-5 w-5 text-slate-500" />
                        </div>

                        <h3 className="mt-4 font-medium text-slate-900">
                          No payments found
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          No payments match your current search
                          and filters.
                        </p>

                        {(search ||
                          hasActiveFilters) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => {
                              setSearch("");
                              clearFilters();
                            }}
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* -------------------------------------------------
              FOOTER
              ------------------------------------------------- */}

          <div className="flex items-center justify-between border-t bg-slate-50/50 px-5 py-3">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">
                {filteredPayments.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-700">
                {MOCK_PAYMENTS.length}
              </span>{" "}
              payments
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
   ========================================================= */

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  iconClassName,
  attention = false,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ElementType;
  iconClassName: string;
  attention?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border bg-white p-5",
        attention
          ? "border-amber-200"
          : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {value}
          </p>

          <p className="mt-1.5 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`shrink-0 rounded-lg p-2.5 ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FILTER CHIP
   ========================================================= */

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      {label}

      <button
        type="button"
        onClick={onRemove}
        className="rounded-full text-slate-400 hover:text-slate-700"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}