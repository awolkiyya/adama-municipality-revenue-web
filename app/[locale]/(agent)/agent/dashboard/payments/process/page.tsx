"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Coins,
  CreditCard,
  FileText,
  Hash,
  Landmark,
  Loader2,
  Receipt,
  ShieldCheck,
  UserRound,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

import {
  AmountMode,
  PaymentAmountSection,
} from "@/components/payment/section/PaymentAmountSection";

import {
  PaymentMethod,
  PaymentMethodSection,
} from "@/components/payment/section/PaymentMethodSection";

import { OnlinePaymentSection } from "@/components/payment/section/OnlinePaymentSection";

import { BankTransferSection } from "@/components/payment/section/BankTransferSection";

import { FindInvoiceSection } from "@/components/payment/section/FindInvoiceSection";

import { usePaymentOptions } from "@/hooks/revenue/payment-option.hook";

import type { BankAccount } from "@/types/revenue/bank-account";
import type { PaymentProvider } from "@/types/revenue/payment-provider";

import type {
  AgentPendingInvoice,
  AgentPendingInvoiceStatus,
} from "@/types/agent/agent-invoice";

/* =========================================================
   CONSTANTS
   ========================================================= */

const PORTAL_NAME = "Revenue Collection Portal";

const PAD = "p-4 sm:p-6";
const PAD_X = "px-4 sm:px-6";

const RECEIPT_MAX_MB = 5;

/*
 * Keep the services list compact when an invoice contains
 * many services. The full invoice remains authoritative;
 * this is only a payment-context summary.
 */
const MAX_VISIBLE_SERVICES = 6;

/* =========================================================
   TYPES
   ========================================================= */

type Step =
  | "find"
  | "payment"
  | "review"
  | "done";

/* =========================================================
   STATUS
   ========================================================= */

const STATUS_STYLE: Record<
  AgentPendingInvoiceStatus,
  {
    label: string;
    dot: string;
  }
> = {
  ISSUED: {
    label: "Issued",
    dot: "bg-red-500",
  },

  PARTIALLY_PAID: {
    label: "Partially paid",
    dot: "bg-amber-500",
  },

  OVERDUE: {
    label: "Overdue",
    dot: "bg-red-600",
  },
};

/* =========================================================
   STEPS
   ========================================================= */

const STEPS: {
  key: Step;
  label: string;
  icon: LucideIcon;
}[] = [
  {
    key: "find",
    label: "Find invoice",
    icon: FileText,
  },
  {
    key: "payment",
    label: "Payment",
    icon: CreditCard,
  },
  {
    key: "review",
    label: "Confirm",
    icon: ClipboardCheck,
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

function etb(amount: string | number): string {
  const value =
    typeof amount === "number"
      ? amount
      : Number(amount);

  if (!Number.isFinite(value)) {
    return "ETB 0.00";
  }

  return `ETB ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

/* =========================================================
   PAGE
   ========================================================= */

export default function PaymentProcessPage() {
  const router = useRouter();

  /* =======================================================
     PAYMENT OPTIONS
     ======================================================= */

  const {
    data: paymentOptionsResponse,
    isLoading: isPaymentOptionsLoading,
    isError: isPaymentOptionsError,
    refetch: refetchPaymentOptions,
  } = usePaymentOptions();

  const paymentOptions =
    paymentOptionsResponse?.data;

  const bankAccounts =
    paymentOptions?.bank_accounts?.filter(
      (bank) => bank.is_active,
    ) ?? [];

  const paymentProviders =
    paymentOptions?.payment_providers?.filter(
      (provider) => provider.is_active,
    ) ?? [];

  /*
   * Cash is intentionally excluded from this page.
   *
   * This page is for agent-assisted:
   *
   * - online payment
   * - bank transfer
   *
   * Cash collection has its own workflow.
   */

  const hasOnlinePayment =
    paymentOptions?.payment_methods?.includes(
      "MOBILE_MONEY",
    ) ?? false;

  const hasBankTransfer =
    paymentOptions?.payment_methods?.includes(
      "BANK",
    ) ?? false;

  /* =======================================================
     FLOW STATE
     ======================================================= */

  const [step, setStep] =
    useState<Step>("find");

  const [invoice, setInvoice] =
    useState<AgentPendingInvoice | null>(null);

  /* =======================================================
     PAYMENT AMOUNT
     ======================================================= */

  const [amountMode, setAmountMode] =
    useState<AmountMode>("FULL");

  const [partAmount, setPartAmount] =
    useState("");

  /* =======================================================
     PAYMENT METHOD
     ======================================================= */

  const [method, setMethod] =
    useState<PaymentMethod>("ONLINE");

  const [selectedProvider, setSelectedProvider] =
    useState<PaymentProvider | null>(null);

  /* =======================================================
     BANK TRANSFER
     ======================================================= */

  const [selectedBank, setSelectedBank] =
    useState<BankAccount | null>(null);

  const [bankRef, setBankRef] =
    useState("");

  const [receipt, setReceipt] =
    useState<File | null>(null);

  /* =======================================================
     SUCCESS
     ======================================================= */

  const [reference, setReference] =
    useState("");

  /* =======================================================
     INITIALIZE PAYMENT OPTIONS
     ======================================================= */

  useEffect(() => {
    if (
      selectedProvider === null &&
      paymentProviders.length > 0
    ) {
      setSelectedProvider(
        paymentProviders[0],
      );
    }

    if (
      selectedBank === null &&
      bankAccounts.length > 0
    ) {
      setSelectedBank(
        bankAccounts[0],
      );
    }
  }, [
    paymentProviders,
    bankAccounts,
    selectedProvider,
    selectedBank,
  ]);

  /* =======================================================
     KEEP PAYMENT METHOD VALID
     ======================================================= */

  useEffect(() => {
    if (
      method === "ONLINE" &&
      !hasOnlinePayment &&
      hasBankTransfer
    ) {
      setMethod("BANK_TRANSFER");
      return;
    }

    if (
      method === "BANK_TRANSFER" &&
      !hasBankTransfer &&
      hasOnlinePayment
    ) {
      setMethod("ONLINE");
    }
  }, [
    method,
    hasOnlinePayment,
    hasBankTransfer,
  ]);

  /* =======================================================
     DERIVED PAYMENT STATE
     ======================================================= */

  const balance = invoice
    ? Number(invoice.balance_amount)
    : 0;

  const amount =
    amountMode === "FULL"
      ? balance
      : Number(partAmount || 0);

  const remaining = Math.max(
    balance - amount,
    0,
  );

  const providerLabel =
    selectedProvider?.name ??
    "Payment provider";

  const methodLabel =
    method === "BANK_TRANSFER"
      ? `Bank transfer · ${
          selectedBank?.bank_name ?? "Bank"
        }`
      : `Online · ${providerLabel}`;

  /* =======================================================
     VALIDATION
     ======================================================= */

  const amountError =
    amountMode === "PARTIAL" &&
    partAmount !== "" &&
    (amount <= 0 ||
      amount >= balance)
      ? amount <= 0
        ? "Enter an amount greater than zero."
        : "Must be less than the balance. Choose Pay in full instead."
      : null;

  const amountReady =
    amountMode === "FULL"
      ? balance > 0
      : amount > 0 &&
        amount < balance;

  const methodReady =
    method === "ONLINE"
      ? selectedProvider !== null
      : selectedBank !== null &&
        bankRef.trim().length >= 6 &&
        receipt !== null;

  const canReview =
    invoice !== null &&
    amountReady &&
    methodReady;

  /* =======================================================
     ACTIONS
     ======================================================= */

  function selectInvoice(
    selected: AgentPendingInvoice,
  ) {
    setInvoice(selected);

    setAmountMode("FULL");
    setPartAmount("");

    /*
     * Prefer online payment when configured.
     * Otherwise use bank transfer.
     */
    if (hasOnlinePayment) {
      setMethod("ONLINE");
    } else if (hasBankTransfer) {
      setMethod("BANK_TRANSFER");
    }

    setBankRef("");
    setReceipt(null);

    setSelectedProvider(
      paymentProviders[0] ?? null,
    );

    setSelectedBank(
      bankAccounts[0] ?? null,
    );

    setStep("payment");
  }

  function resetAll() {
    setStep("find");

    setInvoice(null);

    setAmountMode("FULL");
    setPartAmount("");

    if (hasOnlinePayment) {
      setMethod("ONLINE");
    } else if (hasBankTransfer) {
      setMethod("BANK_TRANSFER");
    }

    setSelectedProvider(
      paymentProviders[0] ?? null,
    );

    setSelectedBank(
      bankAccounts[0] ?? null,
    );

    setBankRef("");
    setReceipt(null);

    setReference("");
  }

  function confirmPayment() {
    if (!invoice || !canReview) {
      return;
    }

    /*
     * Replace this with the real payment API call.
     *
     * Backend remains the source of truth and must
     * revalidate:
     *
     * - invoice
     * - invoice balance
     * - payment method
     * - bank account
     * - payment provider
     * - amount
     * - provider fee
     *
     * The authenticated agent is recorded on the
     * payment transaction, NOT on the invoice.
     */

    console.log({
      invoice_id: invoice.id,
      amount_mode: amountMode,
      amount,

      payment_method:
        method === "BANK_TRANSFER"
          ? "BANK"
          : "MOBILE_MONEY",

      ...(method === "BANK_TRANSFER"
        ? {
            bank_account_id:
              selectedBank?.id,

            transfer_reference:
              bankRef.trim(),

            evidence: receipt,
          }
        : {
            payment_provider:
              selectedProvider?.code,
          }),
    });

    setReference(
      `PAY-${Date.now()
        .toString()
        .slice(-8)}`,
    );

    setStep("done");
  }

  /* =======================================================
     STEP
     ======================================================= */

  const stepIndex =
    STEPS.findIndex(
      (item) => item.key === step,
    );

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6">
      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="overflow-hidden rounded-xl border bg-card text-card-foreground">
        <div
          className={`${PAD_X} pb-5 pt-4`}
        >
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background">
              <Landmark className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {PORTAL_NAME}
              </p>

              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Process payment
              </h1>
            </div>
          </div>
        </div>

        {step !== "done" && (
          <nav
            aria-label="Progress"
            className="border-t bg-muted/30 px-4 py-3 sm:px-6"
          >
            <ol className="flex items-center gap-3">
              {STEPS.map(
                (item, index) => {
                  const Icon = item.icon;

                  const done =
                    index < stepIndex;

                  const active =
                    index === stepIndex;

                  return (
                    <li
                      key={item.key}
                      className="flex flex-1 items-center gap-3 last:flex-none"
                    >
                      <div
                        aria-current={
                          active
                            ? "step"
                            : undefined
                        }
                        className={`flex items-center gap-2 ${
                          active || done
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full ${
                            active
                              ? "border border-primary bg-primary text-primary-foreground"
                              : done
                                ? "border border-primary text-primary"
                                : "border text-muted-foreground"
                          }`}
                        >
                          {done ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Icon className="h-3.5 w-3.5" />
                          )}
                        </span>

                        <span className="hidden text-xs font-medium sm:inline">
                          {item.label}
                        </span>
                      </div>

                      {index <
                        STEPS.length -
                          1 && (
                        <div
                          className={`h-px flex-1 ${
                            index <
                            stepIndex
                              ? "bg-primary"
                              : "bg-border"
                          }`}
                        />
                      )}
                    </li>
                  );
                },
              )}
            </ol>
          </nav>
        )}
      </header>

      {/* ===================================================
          PAYMENT OPTIONS LOADING
          =================================================== */}

      {isPaymentOptionsLoading &&
        step !== "done" && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />

            <div>
              <p className="font-medium">
                Loading payment options
              </p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                Checking available banks and online payment providers.
              </p>
            </div>
          </div>
        )}

      {/* ===================================================
          PAYMENT OPTIONS ERROR
          =================================================== */}

      {isPaymentOptionsError &&
        step !== "done" && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-medium">
                Payment options unavailable
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                We could not load the available payment methods.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                refetchPaymentOptions()
              }
            >
              Try again
            </Button>
          </div>
        )}

      {/* ===================================================
          SUCCESS
          =================================================== */}

      {step === "done" &&
        invoice && (
          <Card>
            <CardContent className="flex flex-col items-center px-4 py-10 text-center sm:px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>

              <h2 className="mt-4 text-lg font-semibold">
                {method ===
                "BANK_TRANSFER"
                  ? "Bank transfer recorded"
                  : "Payment recorded"}
              </h2>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {etb(amount)} was applied to{" "}
                {invoice.invoice_number} for{" "}
                {invoice.taxpayer?.name ??
                  "the taxpayer"}
                .
              </p>

              <dl className="mt-6 w-full max-w-sm divide-y rounded-lg border px-4 text-left">
                <Row
                  icon={Hash}
                  label="Reference"
                  value={reference}
                  mono
                />

                <Row
                  icon={CreditCard}
                  label="Method"
                  value={methodLabel}
                />

                <Row
                  icon={Wallet}
                  label="Remaining"
                  value={etb(remaining)}
                  strong
                />
              </dl>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() =>
                    router.back()
                  }
                >
                  Done
                </Button>

                <Button
                  onClick={resetAll}
                >
                  Process another payment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* ===================================================
          MAIN FLOW
          =================================================== */}

      {step !== "done" && (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          {/* =================================================
              LEFT
              ================================================= */}

          <div className="space-y-4 sm:space-y-6">
            {/* ===============================================
                FIND INVOICE
                =============================================== */}

            {step === "find" && (
              <FindInvoiceSection
                selectedInvoice={invoice}
                onSelect={selectInvoice}
              />
            )}

            {/* ===============================================
                SELECTED INVOICE
                =============================================== */}

            {invoice &&
              step !== "find" && (
                <SelectedInvoiceCard
                  invoice={invoice}
                  onChangeInvoice={() => {
                    setInvoice(null);
                    setStep("find");
                  }}
                />
              )}

            {/* ===============================================
                FULLY PAID
                =============================================== */}

            {invoice &&
              balance === 0 && (
                <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                  <div>
                    <p className="text-sm font-medium">
                      This invoice is fully paid
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      No balance is outstanding. Search for another invoice.
                    </p>
                  </div>
                </div>
              )}

            {/* ===============================================
                PAYMENT
                =============================================== */}

            {invoice &&
              balance > 0 &&
              step === "payment" && (
                <Card>
                  <CardHeader
                    className={`border-b py-4 ${PAD_X}`}
                  >
                    <SectionHeader
                      icon={CreditCard}
                      title="Payment"
                      hint="Choose the amount and how it is paid"
                    />
                  </CardHeader>

                  <CardContent
                    className={`space-y-6 sm:space-y-8 ${PAD}`}
                  >
                    <PaymentAmountSection
                      currency="ETB"
                      balanceDue={balance}
                      mode={amountMode}
                      amount={partAmount}
                      onModeChange={(
                        nextMode,
                      ) => {
                        setAmountMode(
                          nextMode,
                        );

                        if (
                          nextMode ===
                          "FULL"
                        ) {
                          setPartAmount(
                            "",
                          );
                        }
                      }}
                      onAmountChange={
                        setPartAmount
                      }
                    />

                    {amountError && (
                      <p className="text-xs text-destructive">
                        {amountError}
                      </p>
                    )}

                    <div className="border-t pt-6">
                      <PaymentMethodSection
                        method={method}
                        onMethodChange={
                          setMethod
                        }
                        hasOnlinePayment={
                          hasOnlinePayment
                        }
                        hasBankTransfer={
                          hasBankTransfer
                        }
                      />

                      {method ===
                        "ONLINE" && (
                        <div className="mt-4">
                          {paymentProviders.length >
                          0 ? (
                            <OnlinePaymentSection
                              amount={amount}
                              currency="ETB"
                              providers={
                                paymentProviders
                              }
                              selectedProvider={
                                selectedProvider
                              }
                              onProviderChange={
                                setSelectedProvider
                              }
                            />
                          ) : (
                            <UnavailablePaymentMethod
                              title="No online payment provider available"
                              description="Online payment is currently unavailable. Please choose another payment method."
                            />
                          )}
                        </div>
                      )}

                      {method ===
                        "BANK_TRANSFER" && (
                        <div className="mt-4">
                          {bankAccounts.length >
                          0 ? (
                            <BankTransferSection
                              banks={
                                bankAccounts
                              }
                              selectedBank={
                                selectedBank
                              }
                              onBankChange={
                                setSelectedBank
                              }
                              transferReference={
                                bankRef
                              }
                              onTransferReferenceChange={
                                setBankRef
                              }
                              evidence={
                                receipt
                              }
                              onEvidenceChange={
                                setReceipt
                              }
                              evidenceMaxMb={
                                RECEIPT_MAX_MB
                              }
                            />
                          ) : (
                            <UnavailablePaymentMethod
                              title="No bank account available"
                              description="Bank transfer is currently unavailable. Please choose another payment method."
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={
                          resetAll
                        }
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>

                      <Button
                        type="button"
                        disabled={
                          !canReview ||
                          isPaymentOptionsLoading
                        }
                        onClick={() =>
                          setStep(
                            "review",
                          )
                        }
                      >
                        Review payment
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* ===============================================
                REVIEW
                =============================================== */}

            {invoice &&
              step === "review" && (
                <Card>
                  <CardHeader
                    className={`border-b py-4 ${PAD_X}`}
                  >
                    <SectionHeader
                      icon={
                        ClipboardCheck
                      }
                      title="Review and confirm"
                      hint="Check the details before recording"
                    />
                  </CardHeader>

                  <CardContent className={PAD}>
                    <dl className="divide-y rounded-lg border px-4">
                      <Row
                        icon={UserRound}
                        label="Taxpayer"
                        value={`${invoice.taxpayer?.name ?? "—"} (${invoice.taxpayer?.taxpayer_number ?? "—"})`}
                      />

                      <Row
                        icon={FileText}
                        label="Invoice"
                        value={
                          invoice.invoice_number
                        }
                      />

                      <Row
                        icon={Coins}
                        label="Payment type"
                        value={
                          amountMode ===
                          "FULL"
                            ? "Full payment"
                            : "Part payment"
                        }
                      />

                      <Row
                        icon={CreditCard}
                        label="Method"
                        value={
                          methodLabel
                        }
                      />

                      {method ===
                        "ONLINE" &&
                        selectedProvider && (
                          <Row
                            icon={
                              CreditCard
                            }
                            label="Provider"
                            value={
                              selectedProvider.name
                            }
                          />
                        )}

                      {method ===
                        "BANK_TRANSFER" && (
                        <>
                          <Row
                            icon={
                              Landmark
                            }
                            label="Transfer to"
                            value={
                              selectedBank
                                ? `${selectedBank.bank_name} · ${selectedBank.account_number}`
                                : "—"
                            }
                          />

                          <Row
                            icon={Hash}
                            label="Reference"
                            value={
                              bankRef.trim()
                            }
                            mono
                          />

                          <Row
                            icon={Receipt}
                            label="Receipt"
                            value={
                              receipt?.name ??
                              "—"
                            }
                          />
                        </>
                      )}

                      <Row
                        icon={Banknote}
                        label="Amount"
                        value={etb(
                          amount,
                        )}
                        strong
                      />

                      <Row
                        icon={Wallet}
                        label="Remaining"
                        value={etb(
                          remaining,
                        )}
                      />
                    </dl>

                    {method ===
                      "BANK_TRANSFER" && (
                      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        Bank transfers may be verified against the bank statement before the balance is cleared.
                      </p>
                    )}

                    <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setStep(
                            "payment",
                          )
                        }
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Edit
                      </Button>

                      <Button
                        type="button"
                        onClick={
                          confirmPayment
                        }
                        disabled={
                          !canReview
                        }
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Confirm payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* =================================================
              RIGHT — INVOICE SUMMARY
              ================================================= */}

          <aside className="lg:sticky lg:top-6">
            {invoice ? (
              <InvoiceSummary
                invoice={invoice}
                balance={balance}
                amount={amount}
                remaining={remaining}
              />
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-dashed p-5">
                <Tile
                  icon={FileText}
                />

                <div>
                  <p className="text-sm font-medium">
                    Invoice summary
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Select an invoice to see the taxpayer, services, and balance here.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   INVOICE SUMMARY
   ========================================================= */

function InvoiceSummary({
  invoice,
  balance,
  amount,
  remaining,
}: {
  invoice: AgentPendingInvoice;
  balance: number;
  amount: number;
  remaining: number;
}) {
  const services =
    invoice.services ?? [];

  const visibleServices =
    services.slice(
      0,
      MAX_VISIBLE_SERVICES,
    );

  const hiddenServiceCount =
    Math.max(
      services.length -
        MAX_VISIBLE_SERVICES,
      0,
    );

  return (
    <Card>
      <CardHeader className="border-b px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Tile
              icon={UserRound}
              accent
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {invoice.taxpayer?.name ??
                  "Taxpayer unavailable"}
              </p>

              <p className="truncate text-xs text-muted-foreground">
                {invoice.taxpayer
                  ?.taxpayer_number ??
                  "—"}
              </p>
            </div>
          </div>

          <StatusBadge
            status={invoice.status}
          />
        </div>
      </CardHeader>

      <CardContent className="px-4 py-2">
        {/* =================================================
            INVOICE
            ================================================= */}

        <dl className="divide-y">
          <Row
            icon={FileText}
            label="Invoice"
            value={invoice.invoice_number}
          />
        </dl>

        {/* =================================================
            SERVICES
            ================================================= */}

        {services.length > 0 && (
          <div className="border-t py-3">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold">
                  Services
                </p>

                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Included in this invoice
                </p>
              </div>

              <span className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {services.length}
              </span>
            </div>

            <div className="space-y-1.5">
              {visibleServices.map(
                (service) => (
                  <div
                    key={service.id}
                    className="flex items-start justify-between gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium leading-4">
                        {service.name}
                      </p>

                      {service.description &&
                        service.description !==
                          service.name && (
                          <p className="mt-0.5 line-clamp-1 text-[10px] leading-4 text-muted-foreground">
                            {
                              service.description
                            }
                          </p>
                        )}
                    </div>

                    <p className="shrink-0 text-xs font-medium tabular-nums">
                      {etb(
                        service.amount,
                      )}
                    </p>
                  </div>
                ),
              )}
            </div>

            {hiddenServiceCount > 0 && (
              <div className="mt-2 rounded-md bg-muted/40 px-2.5 py-2 text-center">
                <p className="text-[11px] text-muted-foreground">
                  + {hiddenServiceCount}{" "}
                  more{" "}
                  {hiddenServiceCount ===
                  1
                    ? "service"
                    : "services"}
                </p>
              </div>
            )}
          </div>
        )}

        {services.length === 0 && (
          <div className="border-t py-3">
            <div className="rounded-md border border-dashed px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground">
                Service details are not available for this invoice.
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            AMOUNT SUMMARY
            ================================================= */}

        <div className="border-t">
          <dl className="divide-y">
            <Row
              icon={Receipt}
              label="Total"
              value={etb(
                invoice.total_amount,
              )}
            />

            <Row
              icon={CheckCircle2}
              label="Paid"
              value={etb(
                invoice.paid_amount,
              )}
            />

            <Row
              icon={Wallet}
              label="Balance due"
              value={etb(balance)}
              strong
            />
          </dl>
        </div>

        {/* =================================================
            CURRENT PAYMENT
            ================================================= */}

        {balance > 0 && (
          <div className="-mx-4 mt-2 border-t bg-muted/30 px-4 py-3">
            <dl>
              <Row
                icon={Banknote}
                label="This payment"
                value={etb(amount)}
                strong
              />

              <Row
                icon={Wallet}
                label="Remaining"
                value={etb(remaining)}
              />
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* =========================================================
   SELECTED INVOICE
   ========================================================= */

function SelectedInvoiceCard({
  invoice,
  onChangeInvoice,
}: {
  invoice: AgentPendingInvoice;
  onChangeInvoice: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <Tile
            icon={FileText}
            accent
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">
                {invoice.invoice_number}
              </p>

              <StatusBadge
                status={invoice.status}
              />
            </div>

            <p className="mt-1 truncate text-xs text-muted-foreground">
              {invoice.taxpayer?.name ??
                "Taxpayer unavailable"}
              {invoice.taxpayer
                ?.taxpayer_number
                ? ` · ${invoice.taxpayer.taxpayer_number}`
                : ""}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onChangeInvoice}
        >
          Change
        </Button>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   UNAVAILABLE PAYMENT METHOD
   ========================================================= */

function UnavailablePaymentMethod({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed p-4">
      <p className="text-sm font-medium">
        {title}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   TILE
   ========================================================= */

function Tile({
  icon: Icon,
  accent = false,
}: {
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
        accent
          ? "border bg-background text-foreground"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

/* =========================================================
   SECTION HEADER
   ========================================================= */

function SectionHeader({
  icon,
  title,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Tile
        icon={icon}
        accent
      />

      <div>
        <h2 className="text-base font-semibold leading-tight">
          {title}
        </h2>

        <p className="text-xs text-muted-foreground">
          {hint}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
   ========================================================= */

function StatusBadge({
  status,
}: {
  status: AgentPendingInvoiceStatus;
}) {
  const {
    label,
    dot,
  } = STATUS_STYLE[status];

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium">
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${dot}`}
      />

      {label}
    </span>
  );
}

/* =========================================================
   ROW
   ========================================================= */

function Row({
  icon: Icon,
  label,
  value,
  strong = false,
  mono = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  strong?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <dt className="flex shrink-0 items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </dt>

      <dd
        className={`min-w-0 text-right tabular-nums ${
          strong
            ? "font-semibold"
            : "font-medium"
        } ${
          mono
            ? "font-mono text-xs"
            : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}