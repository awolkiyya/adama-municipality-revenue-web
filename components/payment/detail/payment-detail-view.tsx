"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FileText,
  History,
  LayoutGrid,
  Printer,
  ReceiptText,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import type {
  FileView,
  PaymentDetailPermissions,
  PaymentDetailRoutes,
  PaymentDetailTab,
  PaymentDetailVariant,
  PaymentView,
} from "@/types/payment/ui";

import { CopyButton, Fact, StatusBadge, tabClass } from "../../ui";

import {
  methodDescription,
  money,
  paymentDate,
  serviceSummary,
  statusMessage,
  TERMINAL_FAILURES,
} from "@/utils/helpers";

import {
  ActivityTab,
  InvoiceTab,
  OverviewTab,
  PaymentTab,
} from "@/components/tabs";

import { formatEthiopianDate } from "@/lib/utils";
import { Lifecycle } from "./lifecycle";

/**
 * Extra UI that a page can inject into the payment detail view.
 */
export type PaymentSlot =
  | ReactNode
  | ((payment: PaymentView) => ReactNode);

export type PaymentDetailViewProps = {
  /** Already-loaded payment. This component never fetches payment data. */
  payment: PaymentView;

  routes?: PaymentDetailRoutes;
  can?: PaymentDetailPermissions;

  /** "page" adds page chrome; "embedded" is for dialogs, sheets and split panes. */
  variant?: PaymentDetailVariant;
  defaultTab?: PaymentDetailTab;

  onBack?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;

  /** Must throw on failure so the confirmation dialog can remain open. */
  onCompleteCash?: () => Promise<void>;
  isCompleting?: boolean;
  completeError?: string | null;

  /** Omit to hide the transfer-evidence View button. */
  openFile?: (file: FileView) => Promise<unknown> | void;
  isOpening?: (id: string) => boolean;

  /** Additional header actions. */
  headerActions?: PaymentSlot;

  /** Optional notice between the header and payment summary. */
  notice?: PaymentSlot;

  /** Optional content below the tabs. */
  extra?: PaymentSlot;
};

function safeEthiopianDate(
  value?: string | Date | null,
): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return formatEthiopianDate(date.toISOString());
}

export function PaymentDetailView({
  payment,
  routes = {},
  can = {},
  variant = "page",
  defaultTab = "overview",
  onBack,
  onRefresh,
  isRefreshing = false,
  onCompleteCash,
  isCompleting = false,
  completeError,
  openFile,
  isOpening,
  headerActions,
  notice,
  extra,
}: PaymentDetailViewProps) {
  const [tab, setTab] = useState<PaymentDetailTab>(defaultTab);
  const [dialogOpen, setDialogOpen] = useState(false);

  /**
   * Permission flags control UI visibility only.
   * The backend must independently authorize every protected request.
   */
  const allow = {
    printReceipt: can.printReceipt ?? true,
    viewInvoice: can.viewInvoice ?? true,
    viewActivity: can.viewActivity ?? true,
    viewTaxpayer: can.viewTaxpayer ?? true,
  };

  const slot = (value?: PaymentSlot) =>
    typeof value === "function" ? value(payment) : value;

  const embedded = variant === "embedded";
  const currency = payment.currency || "ETB";
  const failed = TERMINAL_FAILURES.includes(payment.status);

  const paidOn = paymentDate(payment);

  const paidOnLabel = paidOn
    ? safeEthiopianDate(String(paidOn))
    : "—";

  const updatedLabel = safeEthiopianDate(payment.updated_at);

  /**
   * Cash completion is only available when:
   * - a completion handler was provided;
   * - the payment method is CASH;
   * - the payment is still PENDING.
   *
   * Backend authorization and status validation are still required.
   */
  const canCompleteCash =
    Boolean(onCompleteCash) &&
    payment.payment_method === "CASH" &&
    payment.status === "PENDING";

  const receiptPath = routes.receipt?.(payment.id);

  const hasIssuedReceipt =
    payment.status === "COMPLETED" &&
    Boolean(payment.receipt) &&
    Boolean(receiptPath);

  const showReceiptActions =
    allow.printReceipt && hasIssuedReceipt;

  const invoiceHref =
    allow.viewInvoice && payment.invoice && routes.invoice
      ? routes.invoice(payment.invoice.id)
      : undefined;

  const tabs = [
    {
      id: "overview" as const,
      title: "Overview",
      Icon: LayoutGrid,
      show: true,
      content: (
        <OverviewTab
          p={payment}
          showTaxpayer={allow.viewTaxpayer}
        />
      ),
    },
    {
      id: "invoice" as const,
      title: "Invoice",
      Icon: ReceiptText,
      show: Boolean(payment.invoice) && allow.viewInvoice,
      content: payment.invoice ? (
        <InvoiceTab
          invoice={payment.invoice}
          href={invoiceHref}
        />
      ) : null,
    },
    {
      id: "payment" as const,
      title: "Payment",
      Icon: CreditCard,
      show: true,
      content: (
        <PaymentTab
          p={payment}
          openFile={openFile}
          isOpening={isOpening}
        />
      ),
    },
    {
      id: "activity" as const,
      title: "Activity",
      Icon: History,
      show: allow.viewActivity,
      content: <ActivityTab p={payment} />,
    },
  ].filter((item) => item.show);

  /**
   * Keep the active tab valid if permissions change while this view is open.
   */
  const activeTab = tabs.some((item) => item.id === tab)
    ? tab
    : "overview";

 

  const body = (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-3">
        {onBack && !embedded && (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-muted-foreground"
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 size-4" />
            Payments
          </Button>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="break-all text-2xl font-semibold tracking-tight">
                {payment.payment_number}
              </h1>

              <StatusBadge status={payment.status} />
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {serviceSummary(payment)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="icon"
                aria-label="Refresh payment"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`size-4 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
              </Button>
            )}

            {showReceiptActions && receiptPath && (
              <>
                <Button variant="outline" asChild>
                  <Link href={receiptPath}>
                    <FileText className="mr-2 size-4" />
                    View receipt
                  </Link>
                </Button>

                <Button asChild>
                  <Link href={`${receiptPath}?print=1`}>
                    <Printer className="mr-2 size-4" />
                    Print
                  </Link>
                </Button>
              </>
            )}

            {slot(headerActions)}

            {canCompleteCash && (
              <Button
                onClick={() => setDialogOpen(true)}
                disabled={isCompleting}
              >
                <CheckCircle2 className="mr-2 size-4" />
                Complete cash payment
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Optional page-level notice */}
      {slot(notice)}

      {/* Payment summary */}
      <Card className="overflow-hidden shadow-none">
        <CardContent className="p-0">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm text-muted-foreground">
                Amount
              </p>

              <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
                {money(payment.amount, currency) ?? "—"}
              </p>

              <p
                className={`mt-2 text-sm ${
                  failed
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {statusMessage(payment)}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:min-w-[420px]">
              <Fact title="Method">
                {methodDescription(payment)}
              </Fact>

              <Fact title="Date">
                {paidOnLabel}
              </Fact>

              <Fact title="Invoice">
                {payment.invoice && allow.viewInvoice ? (
                  invoiceHref ? (
                    <Link
                      href={invoiceHref}
                      className="text-primary hover:underline"
                    >
                      {payment.invoice.invoice_number}
                    </Link>
                  ) : (
                    payment.invoice.invoice_number
                  )
                ) : (
                  "No invoice linked"
                )}
              </Fact>
            </dl>
          </div>

          <Separator />

          <div className="bg-muted/30 px-4 py-5 sm:px-6">
            <Lifecycle p={payment} />
          </div>
        </CardContent>
      </Card>

      {/* Payment detail tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setTab(value as PaymentDetailTab);
        }}
        className="gap-5"
      >
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-auto w-max min-w-full justify-start gap-1 rounded-none border-b bg-transparent p-0">
            {tabs.map(({ id, title, Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className={tabClass(activeTab === id)}
              >
                <Icon className="size-4" />
                {title}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map(({ id, content }) => (
          <TabsContent key={id} value={id}>
            {content}
          </TabsContent>
        ))}
      </Tabs>

      {/* Optional additional content */}
      {slot(extra)}

      {/* Footer metadata */}
      {!embedded && (
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1">
            Payment ID
            <span className="break-all font-mono">
              {payment.id}
            </span>

            <CopyButton
              value={payment.id}
              name="payment ID"
            />
          </span>

          <span>Updated {updatedLabel}</span>
        </footer>
      )}

      {/* Cash completion feedback */}
      {completeError && (
        <p role="alert" className="text-sm text-destructive">
          {completeError}
        </p>
      )}
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        {body}
      </div>
    </div>
  );
}
