"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  LayoutList,
  Search,
  Wallet,
  X,
  CreditCard,
  Loader2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { EmptyState } from "../primitives";
import { INVOICES } from "../data";
import { formatAmount, formatDate } from "../utils";

import type {
  Invoice,
  InvoiceItem,
  InvoiceStatus,
} from "../types";

import { getInvoiceDisplayTitle } from "@/lib/utils";
import { useInitializePayment } from "@/hooks/payment/payment.hook";



// =====================================================
// TYPES
// =====================================================

type InvoiceFilter =
  | "ALL"
  | "OUTSTANDING"
  | "PAID";

type PaymentMethod =
  | "CHAPA";


// =====================================================
// CONSTANTS
// =====================================================

const FILTERS: {
  value: InvoiceFilter;
  label: string;
}[] = [
  {
    value: "ALL",
    label: "All",
  },
  {
    value: "OUTSTANDING",
    label: "Outstanding",
  },
  {
    value: "PAID",
    label: "Paid",
  },
];


const OUTSTANDING_STATUSES: InvoiceStatus[] = [
  "ISSUED",
  "PARTIALLY_PAID",
  "OVERDUE",
];


// Line items shown before the rest collapse.
const VISIBLE_ITEM_LIMIT = 2;


// Invoice cards shown per page.
const PAGE_SIZE = 4;


// =====================================================
// STATUS META
// =====================================================

type StatusMeta = {
  label: string;
  icon: typeof CheckCircle2;
  badge: string;
  accent: string;
};


const FILTER_ICONS: Record<
  InvoiceFilter,
  typeof CheckCircle2
> = {
  ALL: LayoutList,
  OUTSTANDING: AlertTriangle,
  PAID: CheckCircle2,
};


type StatusMetaMap =
  Record<
    InvoiceStatus,
    StatusMeta
  >;


const STATUS_META: StatusMetaMap = {
  OVERDUE: {
    label: "Overdue",
    icon: AlertTriangle,
    badge:
      "bg-[var(--galii-danger-bg)] text-[var(--galii-danger)]",
    accent:
      "border-l-[var(--galii-danger)]",
  },

  ISSUED: {
    label: "Unpaid",
    icon: Clock3,
    badge:
      "bg-[var(--galii-warning-bg)] text-[var(--galii-warning)]",
    accent:
      "border-l-[var(--galii-warning)]",
  },

  PARTIALLY_PAID: {
    label: "Partially paid",
    icon: Wallet,
    badge:
      "bg-[var(--galii-info-bg)] text-[var(--galii-info)]",
    accent:
      "border-l-[var(--galii-info)]",
  },

  PAID: {
    label: "Paid",
    icon: CheckCircle2,
    badge:
      "bg-[var(--galii-success-bg)] text-[var(--galii-success)]",
    accent:
      "border-l-[var(--galii-success)]",
  },

  VOID: {
    label: "Void",
    icon: FileText,
    badge:
      "bg-[var(--galii-border)] text-[var(--galii-text-faint)]",
    accent:
      "border-l-[var(--galii-border)]",
  },
};


// =====================================================
// HELPERS
// =====================================================

function isOverdue(
  invoice: Invoice,
) {
  return invoice.status === "OVERDUE";
}


function itemQuantityLabel(
  item: InvoiceItem,
) {
  if (item.quantity == null) {
    return null;
  }

  return item.unit
    ? `${item.quantity} ${item.unit}`
    : `${item.quantity}`;
}


function matchesSearch(
  invoice: Invoice,
  query: string,
) {
  if (!query) {
    return true;
  }

  const q = query.toLowerCase();

  return (
    invoice.invoice_number
      .toLowerCase()
      .includes(q) ||

    invoice.assessment?.assessment_number
      .toLowerCase()
      .includes(q) ||

    invoice.items.some(
      (item) =>
        item.description
          .toLowerCase()
          .includes(q),
    )
  );
}


// =====================================================
// INVOICE LINE ITEM
// =====================================================

function InvoiceLineItem({
  item,
  currency,
}: {
  item: InvoiceItem;
  currency: string;
}) {
  const hasAdjustment =
    item.discount_amount > 0 ||
    item.penalty_amount > 0;

  const qtyLabel =
    itemQuantityLabel(item);

  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-[12.5px] text-[var(--galii-text)] truncate">
          {item.description}
        </p>

        {(qtyLabel || hasAdjustment) && (
          <p className="text-[10.5px] text-[var(--galii-text-faint)] mt-0.5 flex flex-wrap gap-x-2">

            {qtyLabel && (
              <span>
                {qtyLabel}
              </span>
            )}

            {item.discount_amount > 0 && (
              <span className="text-[var(--galii-success)]">
                −
                {formatAmount(
                  item.discount_amount,
                  currency,
                )}
              </span>
            )}

            {item.penalty_amount > 0 && (
              <span className="text-[var(--galii-danger)]">
                +
                {formatAmount(
                  item.penalty_amount,
                  currency,
                )}
              </span>
            )}

          </p>
        )}
      </div>

      <p className="text-[12.5px] font-medium galii-mono shrink-0">
        {formatAmount(
          item.total_amount,
          currency,
        )}
      </p>
    </div>
  );
}


// =====================================================
// INVOICE CARD
// =====================================================

function InvoiceCard({
  invoice,
  onPay,
  isInitializing,
}: {
  invoice: Invoice;
  onPay: (invoice: Invoice) => void;
  isInitializing: boolean;
}) {
  const meta =
    STATUS_META[invoice.status];

  const StatusIcon =
    meta.icon;

  const hasAdjustments =
    invoice.discount_amount > 0 ||
    invoice.penalty_amount > 0;

  const paymentProgress =
    invoice.total_amount > 0
      ? Math.min(
          100,
          (invoice.paid_amount /
            invoice.total_amount) *
            100,
        )
      : 0;

  const visibleItems =
    invoice.items.slice(
      0,
      VISIBLE_ITEM_LIMIT,
    );

  const hiddenItems =
    invoice.items.slice(
      VISIBLE_ITEM_LIMIT,
    );

  const amountToShow =
    invoice.status === "PAID"
      ? invoice.total_amount
      : invoice.balance_due;

  const amountLabel =
    invoice.status === "PAID"
      ? "Total paid"
      : "Balance due";

  return (
    <Card
      className={`rounded-sm border-[var(--galii-border)] border-l-4 galii-card-in overflow-hidden ${meta.accent}`}
    >
      <CardContent className="p-0">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">

          <div className="min-w-0">

            <p className="font-semibold text-[14.5px] galii-serif leading-snug truncate">
              {getInvoiceDisplayTitle(
                invoice,
              )}
            </p>

            <p className="text-[11px] text-[var(--galii-text-faint)] galii-mono mt-0.5 truncate">
              {invoice.invoice_number}

              {invoice.assessment &&
                ` · ${invoice.assessment.assessment_number}`}
            </p>

          </div>

          <span
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-semibold shrink-0 ${meta.badge}`}
          >
            <StatusIcon className="h-3 w-3" />

            {meta.label}
          </span>

        </div>


        {/* ================================================= */}
        {/* SERVICES */}
        {/* ================================================= */}

        <div className="px-4">

          <div className="divide-y divide-[var(--galii-border)]/60 border-t border-[var(--galii-border)]/60">

            {visibleItems.map(
              (item) => (
                <InvoiceLineItem
                  key={item.id}
                  item={item}
                  currency={
                    invoice.currency
                  }
                />
              ),
            )}

          </div>


          {hiddenItems.length > 0 && (
            <Accordion
              type="single"
              collapsible
              className="border-t border-[var(--galii-border)]/60"
            >

              <AccordionItem
                value="more-items"
                className="border-none"
              >

                <AccordionTrigger className="py-2 text-[10.5px] font-medium text-[var(--galii-primary)] hover:no-underline [&>svg]:h-3.5 [&>svg]:w-3.5">
                  {hiddenItems.length} more service
                  {hiddenItems.length > 1
                    ? "s"
                    : ""}
                </AccordionTrigger>

                <AccordionContent className="pb-0">

                  <div className="divide-y divide-[var(--galii-border)]/60 border-t border-[var(--galii-border)]/60">

                    {hiddenItems.map(
                      (item) => (
                        <InvoiceLineItem
                          key={item.id}
                          item={item}
                          currency={
                            invoice.currency
                          }
                        />
                      ),
                    )}

                  </div>

                </AccordionContent>

              </AccordionItem>

            </Accordion>
          )}

        </div>


        {/* ================================================= */}
        {/* SUBTOTAL / ADJUSTMENTS */}
        {/* ================================================= */}

        {hasAdjustments && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 mt-2 text-[10.5px] text-[var(--galii-text-faint)]">

            <span>
              Subtotal ·{" "}
              {formatAmount(
                invoice.subtotal,
                invoice.currency,
              )}
            </span>

            {invoice.discount_amount > 0 && (
              <span className="text-[var(--galii-success)]">
                −{" "}
                {formatAmount(
                  invoice.discount_amount,
                  invoice.currency,
                )}{" "}
                discount
              </span>
            )}

            {invoice.penalty_amount > 0 && (
              <span className="text-[var(--galii-danger)]">
                +{" "}
                {formatAmount(
                  invoice.penalty_amount,
                  invoice.currency,
                )}{" "}
                penalty
              </span>
            )}

          </div>
        )}


        {/* ================================================= */}
        {/* PARTIAL PAYMENT */}
        {/* ================================================= */}

        {invoice.status ===
          "PARTIALLY_PAID" && (
          <div className="px-4 mt-3">

            <Progress
              value={
                paymentProgress
              }
              className="h-1.5"
            />

            <p className="text-[10.5px] text-[var(--galii-text-faint)] mt-1">
              {formatAmount(
                invoice.paid_amount,
                invoice.currency,
              )}{" "}
              of{" "}
              {formatAmount(
                invoice.total_amount,
                invoice.currency,
              )}{" "}
              paid
            </p>

          </div>
        )}


        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <div className="flex items-center justify-between gap-3 mt-4 px-4 py-3.5 bg-[var(--galii-surface)] border-t border-[var(--galii-border)]/60">

          <div>

            <p className="text-[10px] uppercase tracking-wide text-[var(--galii-text-faint)]">
              {amountLabel}
            </p>

            <p className="font-bold text-[17px] galii-mono leading-tight">
              {formatAmount(
                amountToShow,
                invoice.currency,
              )}
            </p>

            <p
              className={`text-[10.5px] mt-0.5 ${
                isOverdue(invoice)
                  ? "text-[var(--galii-danger)] font-medium"
                  : "text-[var(--galii-text-faint)]"
              }`}
            >
              {invoice.status ===
              "PAID"
                ? invoice.paid_at
                  ? `Paid ${formatDate(
                      invoice.paid_at,
                    )}`
                  : "Paid"
                : invoice.due_date
                ? `${
                    isOverdue(
                      invoice,
                    )
                      ? "Overdue since"
                      : "Due"
                  } ${formatDate(
                    invoice.due_date,
                  )}`
                : "No due date"}
            </p>

          </div>


          {/* ================================================= */}
          {/* PAY NOW */}
          {/* ================================================= */}

          {invoice.status !==
            "PAID" && (
            <Button
              size="sm"
              disabled={
                isInitializing
              }
              onClick={() =>
                onPay(invoice)
              }
              className="bg-[var(--galii-primary)] hover:bg-[var(--galii-primary-light)] text-white h-9 px-4 text-[12px] font-semibold galii-tap"
            >

              {isInitializing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  Pay now
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </>
              )}

            </Button>
          )}

        </div>

      </CardContent>
    </Card>
  );
}


// =====================================================
// PAYMENT METHOD DIALOG
// =====================================================

function PaymentMethodDialog({
  invoice,
  open,
  onOpenChange,
  selectedMethod,
  onMethodChange,
  onContinue,
  isInitializing,
}: {
  invoice: Invoice | null;

  open: boolean;

  onOpenChange: (
    open: boolean,
  ) => void;

  selectedMethod: PaymentMethod;

  onMethodChange: (
    method: PaymentMethod,
  ) => void;

  onContinue: () => void;

  isInitializing: boolean;
}) {
  if (!invoice) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={
        onOpenChange
      }
    >

      <DialogContent className="sm:max-w-md">

        <DialogHeader>

          <DialogTitle className="text-[17px] galii-serif">
            Choose payment method
          </DialogTitle>

          <DialogDescription className="text-[12px]">
            Select how you want to pay this invoice.
          </DialogDescription>

        </DialogHeader>


        {/* ================================================= */}
        {/* INVOICE SUMMARY */}
        {/* ================================================= */}

        <div className="rounded-lg border border-[var(--galii-border)] bg-[var(--galii-surface)] p-3">

          <div className="flex items-start justify-between gap-3">

            <div className="min-w-0">

              <p className="font-semibold text-[13px] truncate">
                {getInvoiceDisplayTitle(
                  invoice,
                )}
              </p>

              <p className="text-[10.5px] text-[var(--galii-text-faint)] galii-mono mt-0.5">
                {invoice.invoice_number}
              </p>

            </div>

            <div className="text-right shrink-0">

              <p className="text-[10px] text-[var(--galii-text-faint)] uppercase tracking-wide">
                Amount due
              </p>

              <p className="font-bold text-[16px] galii-mono">
                {formatAmount(
                  invoice.balance_due,
                  invoice.currency,
                )}
              </p>

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* PAYMENT METHODS */}
        {/* ================================================= */}

        <div className="space-y-2">

          <p className="text-[11px] font-semibold text-[var(--galii-text-muted)]">
            Payment method
          </p>


          <button
            type="button"
            onClick={() =>
              onMethodChange(
                "CHAPA",
              )
            }
            className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              selectedMethod ===
              "CHAPA"
                ? "border-[var(--galii-primary)] bg-[var(--galii-primary)]/5"
                : "border-[var(--galii-border)] hover:bg-[var(--galii-surface)]"
            }`}
          >

            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                selectedMethod ===
                "CHAPA"
                  ? "bg-[var(--galii-primary)] text-white"
                  : "bg-[var(--galii-border)] text-[var(--galii-text-muted)]"
              }`}
            >
              <CreditCard className="h-4 w-4" />
            </span>


            <span className="flex-1">

              <span className="block text-[13px] font-semibold">
                Chapa
              </span>

              <span className="block text-[10.5px] text-[var(--galii-text-faint)] mt-0.5">
                Pay securely using Chapa
              </span>

            </span>


            <span
              className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                selectedMethod ===
                "CHAPA"
                  ? "border-[var(--galii-primary)]"
                  : "border-[var(--galii-border)]"
              }`}
            >
              {selectedMethod ===
                "CHAPA" && (
                <span className="h-2 w-2 rounded-full bg-[var(--galii-primary)]" />
              )}
            </span>

          </button>

        </div>


        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {isInitializing && (
          <div className="rounded-md bg-[var(--galii-info-bg)] px-3 py-2 text-[11px] text-[var(--galii-info)]">
            Initializing secure Chapa checkout...
          </div>
        )}


        <DialogFooter className="gap-2 sm:gap-2">

          <Button
            type="button"
            variant="outline"
            disabled={
              isInitializing
            }
            onClick={() =>
              onOpenChange(
                false,
              )
            }
          >
            Cancel
          </Button>


          <Button
            type="button"
            disabled={
              isInitializing ||
              selectedMethod !==
                "CHAPA"
            }
            onClick={
              onContinue
            }
            className="bg-[var(--galii-primary)] hover:bg-[var(--galii-primary-light)] text-white"
          >

            {isInitializing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}

          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>
  );
}


// =====================================================
// INVOICES PANEL
// =====================================================

export function InvoicesPanel() {

  // ===================================================
  // LOCAL UI STATE
  // ===================================================

  const [
    filter,
    setFilter,
  ] = useState<InvoiceFilter>(
    "ALL",
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);


  // Currently selected invoice
  // for payment.

  const [
    selectedInvoice,
    setSelectedInvoice,
  ] = useState<Invoice | null>(
    null,
  );


  // Selected payment method.

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState<PaymentMethod>(
    "CHAPA",
  );


  // ===================================================
  // CHAPA INITIALIZATION HOOK
  // ===================================================

  const initializeChapaPayment =
    useInitializePayment();


  // ===================================================
  // MOCK INVOICES
  // ===================================================

  const activeInvoices =
    INVOICES.filter(
      (invoice) =>
        invoice.status !==
        "VOID",
    );


  const outstandingInvoices =
    activeInvoices.filter(
      (invoice) =>
        OUTSTANDING_STATUSES.includes(
          invoice.status,
        ),
    );


  const overdueCount =
    activeInvoices.filter(
      (invoice) =>
        invoice.status ===
        "OVERDUE",
    ).length;


  const totalOutstanding =
    outstandingInvoices.reduce(
      (sum, invoice) =>
        sum +
        invoice.balance_due,
      0,
    );


  const currency =
    activeInvoices[0]
      ?.currency ?? "ETB";


  // ===================================================
  // FILTERING
  // ===================================================

  const filtered =
    useMemo(() => {

      return activeInvoices

        .filter(
          (invoice) => {

            if (
              filter ===
                "OUTSTANDING" &&
              !OUTSTANDING_STATUSES.includes(
                invoice.status,
              )
            ) {
              return false;
            }

            if (
              filter ===
                "PAID" &&
              invoice.status !==
                "PAID"
            ) {
              return false;
            }

            return matchesSearch(
              invoice,
              search.trim(),
            );
          },
        )

        .sort(
          (a, b) => {

            if (
              isOverdue(a) !==
              isOverdue(b)
            ) {
              return isOverdue(a)
                ? -1
                : 1;
            }

            return (
              a.due_date ?? ""
            ).localeCompare(
              b.due_date ?? "",
            );
          },
        );

      // activeInvoices is mock
      // static data.

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      filter,
      search,
    ]);


  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filtered.length /
          PAGE_SIZE,
      ),
    );


  const currentPage =
    Math.min(
      page,
      totalPages,
    );


  const pageStart =
    (currentPage - 1) *
    PAGE_SIZE;


  const pageItems =
    filtered.slice(
      pageStart,
      pageStart +
        PAGE_SIZE,
    );


  // ===================================================
  // FILTER HANDLERS
  // ===================================================

  function handleFilterChange(
    value: string,
  ) {
    setFilter(
      value as InvoiceFilter,
    );

    setPage(1);
  }


  function handleSearchChange(
    value: string,
  ) {
    setSearch(value);

    setPage(1);
  }


  // ===================================================
  // OPEN PAYMENT METHOD
  // ===================================================

  function handlePay(
    invoice: Invoice,
  ) {

    setSelectedInvoice(
      invoice,
    );

    // Chapa is the currently
    // supported payment method.

    setPaymentMethod(
      "CHAPA",
    );
  }


  // ===================================================
  // CLOSE PAYMENT DIALOG
  // ===================================================

  function handlePaymentDialogChange(
    open: boolean,
  ) {

    if (
      initializeChapaPayment.isPending
    ) {
      return;
    }

    if (!open) {
      setSelectedInvoice(
        null,
      );
    }
  }


  // ===================================================
  // INITIALIZE CHAPA PAYMENT
  // ===================================================

  async function handleContinuePayment() {

    if (
      !selectedInvoice
    ) {
      return;
    }


    if (
      paymentMethod !==
      "CHAPA"
    ) {
      return;
    }


    try {

      const response =
  await initializeChapaPayment.mutateAsync({
    invoice_id:
      "01a013e2-eb7a-736a-9d76-b5ba41b11213",

    payment_method:"CHAPA",

    payment_provider:"CHAPA",

    customer_first_name:
      "Abdulbaasit",

    customer_last_name:
      "Awol",

    customer_email:
      "awolabdulbaasit143@gmail.com",

    customer_phone:
      "+251911996750",

    return_url:
      `${window.location.origin}/payments/success`,

    callback_url:
      "https://napoleon-polytonal-nonaffectingly.ngrok-free.dev/api/v1/payments/webhooks/chapa",

    description:
      "Invoice payment",

    metadata: {
      source: "postman-test",
    },
  });


      // =================================================
// CHECK CHECKOUT URL
// =================================================

const checkoutUrl =
response?.data?.checkoutUrl;

if (!checkoutUrl) {
console.error(
  "Chapa initialization succeeded but checkoutUrl was not returned.",
  response,
);

return;
}



      // =================================================
      // CLOSE LOCAL DIALOG
      // =================================================

      setSelectedInvoice(
        null,
      );


      // =================================================
      // REDIRECT TO CHAPA
      // =================================================

      window.location.assign(
        checkoutUrl,
      );

    } catch (error) {

      console.error(
        "Failed to initialize Chapa payment:",
        error,
      );

    }
  }


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>

      {/* ================================================= */}
      {/* SUMMARY STRIP */}
      {/* ================================================= */}

      {outstandingInvoices.length >
        0 && (
        <Card className="rounded-[14px] border-[var(--galii-border)] galii-card-in">

          <CardContent className="p-4 flex items-center justify-between gap-3">

            <div>

              <p className="text-[10.5px] uppercase tracking-wide text-[var(--galii-text-faint)]">
                Total outstanding
              </p>

              <p className="font-bold text-[22px] galii-mono leading-tight mt-0.5">
                {formatAmount(
                  totalOutstanding,
                  currency,
                )}
              </p>

              <p className="text-[11px] text-[var(--galii-text-muted)] mt-1">

                {outstandingInvoices.length}{" "}
                invoice
                {outstandingInvoices.length >
                1
                  ? "s"
                  : ""}{" "}
                awaiting payment

                {overdueCount >
                  0 && (
                  <span className="text-[var(--galii-danger)] font-medium">
                    {" "}
                    ·{" "}
                    {
                      overdueCount
                    }{" "}
                    overdue
                  </span>
                )}

              </p>

            </div>


            {overdueCount >
              0 && (
              <span className="flex items-center justify-center h-11 w-11 rounded-full bg-[var(--galii-danger-bg)] text-[var(--galii-danger)] shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </span>
            )}

          </CardContent>

        </Card>
      )}


      {/* ================================================= */}
      {/* FILTERS + SEARCH */}
      {/* ================================================= */}

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">

        <Tabs
          value={filter}
          onValueChange={
            handleFilterChange
          }
          className="items-start justify-start px-4 md:px-1"
        >

          <TabsList variant="default">

            {FILTERS.map(
              ({
                value,
                label,
              }) => {

                const Icon =
                  FILTER_ICONS[
                    value
                  ];

                const count =
                  value ===
                  "OUTSTANDING"
                    ? outstandingInvoices.length
                    : undefined;

                return (
                  <TabsTrigger
                    key={value}
                    value={value}
                  >

                    <Icon className="h-5 w-5" />

                    {label}

                    {!!count && (
                      <span className="min-w-[16px] rounded-full bg-[var(--galii-danger-bg)] px-1 text-center text-[10px] font-bold leading-4 text-[var(--galii-danger)] data-[state=active]:bg-white/25 data-[state=active]:text-white">
                        {count}
                      </span>
                    )}

                  </TabsTrigger>
                );
              },
            )}

          </TabsList>

        </Tabs>


        <div className="relative mx-auto w-full sm:mx-0 sm:w-64">

          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--galii-text-faint)]" />

          <Input
            value={search}
            onChange={(e) =>
              handleSearchChange(
                e.target.value,
              )
            }
            placeholder="Search invoice or service"
            className="h-9 w-full rounded-sm border-[var(--galii-border)] bg-[var(--galii-surface)] pl-8 pr-8 text-[12.5px] focus-visible:ring-[var(--galii-primary)]"
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                handleSearchChange(
                  "",
                )
              }
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--galii-text-faint)] hover:text-[var(--galii-text)]"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

        </div>

      </div>


      {/* ================================================= */}
      {/* RESULT COUNT */}
      {/* ================================================= */}

      {filtered.length >
        0 && (
        <p className="text-[11px] text-[var(--galii-text-faint)]">

          Showing{" "}
          {pageStart + 1}
          –
          {Math.min(
            pageStart +
              PAGE_SIZE,
            filtered.length,
          )}{" "}
          of{" "}
          {filtered.length}

        </p>
      )}


      {/* ================================================= */}
      {/* INVOICE LIST */}
      {/* ================================================= */}

      <div className="grid gap-3.5 md:grid-cols-2">

        {pageItems.map(
          (invoice) => (

            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onPay={
                handlePay
              }
              isInitializing={
                initializeChapaPayment.isPending &&
                selectedInvoice?.id ===
                  invoice.id
              }
            />

          ),
        )}

      </div>


      {/* ================================================= */}
      {/* EMPTY STATE */}
      {/* ================================================= */}

      {filtered.length ===
        0 && (
        <EmptyState
          icon={FileText}
          title="No invoices found"
          description={
            search
              ? `No invoices match "${search}". Try a different invoice number or service name.`
              : "There are no invoices matching this filter."
          }
        />
      )}


      {/* ================================================= */}
      {/* PAGINATION */}
      {/* ================================================= */}

      {totalPages >
        1 && (
        <Pagination>

          <PaginationContent>

            <PaginationItem>

              <PaginationPrevious
                href="#"
                onClick={(e) => {

                  e.preventDefault();

                  if (
                    currentPage >
                    1
                  ) {
                    setPage(
                      currentPage -
                        1,
                    );
                  }

                }}
                className={
                  currentPage ===
                  1
                    ? "pointer-events-none opacity-40"
                    : ""
                }
              />

            </PaginationItem>


            {Array.from(
              {
                length:
                  totalPages,
              },
              (_, i) =>
                i + 1,
            ).map(
              (num) => (

                <PaginationItem
                  key={num}
                >

                  <PaginationLink
                    href="#"
                    isActive={
                      num ===
                      currentPage
                    }
                    onClick={(
                      e,
                    ) => {

                      e.preventDefault();

                      setPage(
                        num,
                      );

                    }}
                    className={
                      num ===
                      currentPage
                        ? "bg-[var(--galii-primary)] text-white border-[var(--galii-primary)]"
                        : ""
                    }
                  >
                    {num}
                  </PaginationLink>

                </PaginationItem>

              ),
            )}


            <PaginationItem>

              <PaginationNext
                href="#"
                onClick={(e) => {

                  e.preventDefault();

                  if (
                    currentPage <
                    totalPages
                  ) {
                    setPage(
                      currentPage +
                        1,
                    );
                  }

                }}
                className={
                  currentPage ===
                  totalPages
                    ? "pointer-events-none opacity-40"
                    : ""
                }
              />

            </PaginationItem>

          </PaginationContent>

        </Pagination>
      )}


      {/* ================================================= */}
      {/* PAYMENT METHOD DIALOG */}
      {/* ================================================= */}

      <PaymentMethodDialog
        invoice={
          selectedInvoice
        }
        open={
          !!selectedInvoice
        }
        onOpenChange={
          handlePaymentDialogChange
        }
        selectedMethod={
          paymentMethod
        }
        onMethodChange={
          setPaymentMethod
        }
        onContinue={
          handleContinuePayment
        }
        isInitializing={
          initializeChapaPayment.isPending
        }
      />

    </>
  );
}