"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
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

import {
  useCreateBankTransfer,
  useInitializeOnlinePayment,
} from "@/hooks/payment/payment.hook";

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

const MAX_VISIBLE_SERVICES = 6;


/* =========================================================
   TYPES
   ========================================================= */

type Step =
  | "find"
  | "payment"
  | "review"
  | "done";

type SubmittedStatus =
  | "COMPLETED"
  | "PENDING";


/* =========================================================
   STATUS STYLE
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


function getTodayDate(): string {
  return new Date()
    .toISOString()
    .slice(0, 10);
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

  const bankAccounts = useMemo(
    () =>
      paymentOptions?.bank_accounts?.filter(
        (bank) => bank.is_active,
      ) ?? [],
    [paymentOptions?.bank_accounts],
  );

  const paymentProviders = useMemo(
    () =>
      paymentOptions?.payment_providers?.filter(
        (provider) => provider.is_active,
      ) ?? [],
    [paymentOptions?.payment_providers],
  );


  /* =======================================================
     BANK TRANSFER MUTATION
     ======================================================= */

  const {
    mutateAsync: createBankTransfer,
    isPending: isCreatingBankTransfer,
    error: bankTransferError,
    reset: resetBankTransferMutation,
  } = useCreateBankTransfer();


  /* =======================================================
     ONLINE PAYMENT MUTATION
     ======================================================= */

  const {
    mutateAsync: initializeOnlinePayment,
    isPending: isInitializingOnlinePayment,
    error: onlinePaymentError,
    reset: resetOnlinePaymentMutation,
  } = useInitializeOnlinePayment();


  /* =======================================================
     AVAILABLE METHODS
     ======================================================= */

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

  const [transferDate, setTransferDate] =
    useState(getTodayDate());

  const [receipt, setReceipt] =
    useState<File | null>(null);


  /* =======================================================
     SUCCESS / RESULT
     ======================================================= */

  const [reference, setReference] =
    useState("");

  const [submittedStatus, setSubmittedStatus] =
    useState<SubmittedStatus>("PENDING");


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

  /*
   * This is the projected balance if the payment becomes
   * COMPLETED.
   *
   * For a PENDING bank transfer, the actual invoice balance
   * remains unchanged until verification.
   */
  const projectedRemaining = Math.max(
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
     SUBMISSION STATE
     ======================================================= */

  const isSubmitting =
    isCreatingBankTransfer ||
    isInitializingOnlinePayment;


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


  /*
   * Evidence is intentionally optional because the backend
   * request defines it as nullable.
   */
  const methodReady =
    method === "ONLINE"
      ? selectedProvider !== null
      : selectedBank !== null &&
        bankRef.trim().length >= 6 &&
        transferDate !== "";


  const canReview =
    invoice !== null &&
    amountReady &&
    methodReady &&
    !isSubmitting;


  /* =======================================================
     SELECT INVOICE
     ======================================================= */

  function selectInvoice(
    selected: AgentPendingInvoice,
  ) {
    resetBankTransferMutation();
    resetOnlinePaymentMutation();

    setInvoice(selected);

    setAmountMode("FULL");
    setPartAmount("");

    if (hasOnlinePayment) {
      setMethod("ONLINE");
    } else if (hasBankTransfer) {
      setMethod("BANK_TRANSFER");
    }

    setBankRef("");
    setTransferDate(
      getTodayDate(),
    );
    setReceipt(null);

    setSelectedProvider(
      paymentProviders[0] ?? null,
    );

    setSelectedBank(
      bankAccounts[0] ?? null,
    );

    setReference("");
    setSubmittedStatus("PENDING");

    setStep("payment");
  }


  /* =======================================================
     RESET
     ======================================================= */

  function resetAll() {
    resetBankTransferMutation();
    resetOnlinePaymentMutation();

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
    setTransferDate(
      getTodayDate(),
    );
    setReceipt(null);

    setReference("");
    setSubmittedStatus("PENDING");
  }


  /* =======================================================
     CHANGE INVOICE
     ======================================================= */

  function changeInvoice() {
    if (isSubmitting) {
      return;
    }

    resetBankTransferMutation();
    resetOnlinePaymentMutation();

    setInvoice(null);
    setStep("find");

    setBankRef("");
    setTransferDate(
      getTodayDate(),
    );
    setReceipt(null);

    setReference("");
  }


  /* =======================================================
     CONFIRM PAYMENT
     ======================================================= */

  async function confirmPayment() {
    if (
      !invoice ||
      !canReview ||
      isSubmitting
    ) {
      return;
    }


    /* =====================================================
       BANK TRANSFER
       ===================================================== */

    if (method === "BANK_TRANSFER") {
      if (!selectedBank) {
        return;
      }

      try {
        const response =
          await createBankTransfer({
            invoice_id:
              invoice.id,

            amount,

            bank_account_id:
              selectedBank.id,

            transfer_reference:
              bankRef.trim(),

            transfer_date:
              transferDate,

            payer_name:
              invoice.taxpayer?.name ??
              undefined,

            evidence:
              receipt ?? undefined,

            metadata: {
              amount_mode:
                amountMode,

              source:
                "REVENUE_COLLECTION_PORTAL",

              invoice_number:
                invoice.invoice_number,
            },
          });


        /*
         * The backend returns ApiResponse<Payment>.
         *
         * response.data may be nullable according to the
         * TypeScript contract, therefore we explicitly guard
         * it before accessing payment properties.
         */
        const payment =
          response.data;

        if (!payment) {
          throw new Error(
            "Payment was not returned by the server.",
          );
        }


        /*
         * Use the backend-generated reference.
         *
         * Never generate a fake payment reference in the
         * frontend.
         */
        setReference(
          payment.transaction_reference ??
          payment.payment_number ??
          payment.id,
        );


        /*
         * Bank transfers are normally PENDING immediately
         * after submission.
         *
         * They only become COMPLETED after verification.
         */
        setSubmittedStatus(
          payment.status ===
            "COMPLETED"
            ? "COMPLETED"
            : "PENDING",
        );


        setStep("done");
      } catch {
        /*
         * The normalized mutation error is displayed above
         * the payment flow.
         *
         * Keep the user on the review page so they can
         * correct the information and retry.
         */
        return;
      }

      return;
    }


    /* =====================================================
       ONLINE PAYMENT
       ===================================================== */

    if (method === "ONLINE") {
      if (!selectedProvider) {
        return;
      }

      /*
       * IMPORTANT:
       *
       * The exact InitializeOnlinePaymentRequest fields must
       * match your backend request type.
       *
       * The request below intentionally uses only fields that
       * belong to the payment initialization contract.
       */
      try {
        const response =
          await initializeOnlinePayment({
            invoice_id:
              invoice.id,

            amount,

            provider:
              selectedProvider.code,
          });

        /*
         * The online provider flow should be handled using
         * the response returned by the backend.
         *
         * Do not mark the payment COMPLETED simply because
         * initialization succeeded.
         */
        const payment =
          response.data;

        if (!payment) {
          throw new Error(
            "Online payment initialization did not return a payment.",
          );
        }

        /*
         * The exact redirect/checkout field depends on your
         * InitializeOnlinePaymentResponse contract.
         *
         * The page should redirect to the provider checkout
         * URL returned by the backend here.
         */
        if (
          "checkout_url" in payment &&
          typeof payment.checkout_url ===
            "string"
        ) {
          window.location.assign(
            payment.checkout_url,
          );

          return;
        }

        if (
          "payment_url" in payment &&
          typeof payment.payment_url ===
            "string"
        ) {
          window.location.assign(
            payment.payment_url,
          );

          return;
        }

        /*
         * If the backend does not return a checkout URL,
         * do not pretend that the payment was completed.
         */
        throw new Error(
          "Online payment was initialized, but no checkout URL was returned.",
        );
      } catch {
        return;
      }
    }
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
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
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
                  const Icon =
                    item.icon;

                  const done =
                    index < stepIndex;

                  const active =
                    index ===
                    stepIndex;

                  return (
                    <li
                      key={
                        item.key
                      }
                      className="flex flex-1 items-center gap-3 last:flex-none"
                    >

                      <div
                        aria-current={
                          active
                            ? "step"
                            : undefined
                        }
                        className={`flex items-center gap-2 ${
                          active ||
                          done
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
                          {
                            item.label
                          }
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
              disabled={isSubmitting}
            >
              Try again
            </Button>

          </div>
        )}


      {/* ===================================================
          BANK TRANSFER ERROR
          =================================================== */}

      {bankTransferError &&
        step !== "done" && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">

            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />

            <div className="min-w-0">
              <p className="text-sm font-medium">
                Bank transfer could not be recorded
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {bankTransferError instanceof Error
                  ? bankTransferError.message
                  : "Please review the payment information and try again."}
              </p>
            </div>

          </div>
        )}


      {/* ===================================================
          ONLINE PAYMENT ERROR
          =================================================== */}

      {onlinePaymentError &&
        step !== "done" && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">

            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />

            <div className="min-w-0">
              <p className="text-sm font-medium">
                Online payment could not be initialized
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {onlinePaymentError instanceof Error
                  ? onlinePaymentError.message
                  : "Please review the payment information and try again."}
              </p>
            </div>

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
                {submittedStatus ===
                "PENDING" ? (
                  <Clock3 className="h-7 w-7 text-muted-foreground" />
                ) : (
                  <CheckCircle2 className="h-7 w-7 text-primary" />
                )}
              </div>

              <h2 className="mt-4 text-lg font-semibold">

                {method ===
                  "BANK_TRANSFER"
                  ? submittedStatus ===
                    "PENDING"
                    ? "Bank transfer submitted"
                    : "Bank transfer completed"
                  : "Payment recorded"}

              </h2>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">

                {method ===
                  "BANK_TRANSFER"
                  ? submittedStatus ===
                    "PENDING"
                    ? `${etb(amount)} has been submitted for verification against ${invoice.invoice_number}.`
                    : `${etb(amount)} was applied to ${invoice.invoice_number}.`
                  : `${etb(amount)} was applied to ${invoice.invoice_number}.`}

              </p>


              {/* =============================================
                  PENDING NOTICE
                  ============================================= */}

              {method ===
                "BANK_TRANSFER" &&
                submittedStatus ===
                  "PENDING" && (
                  <div className="mt-4 flex max-w-md items-start gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-left text-xs text-muted-foreground">

                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />

                    <span>
                      The payment is pending verification.
                      It will affect the invoice balance only
                      after an authorized officer verifies the
                      bank transfer.
                    </span>

                  </div>
                )}


              <dl className="mt-6 w-full max-w-sm divide-y rounded-lg border px-4 text-left">

                <Row
                  icon={Hash}
                  label="Reference"
                  value={
                    reference
                  }
                  mono
                />

                <Row
                  icon={CreditCard}
                  label="Method"
                  value={
                    methodLabel
                  }
                />

                {submittedStatus ===
                  "PENDING" ? (
                  <Row
                    icon={Wallet}
                    label="Current balance"
                    value={etb(
                      balance,
                    )}
                    strong
                  />
                ) : (
                  <Row
                    icon={Wallet}
                    label="Remaining"
                    value={etb(
                      projectedRemaining,
                    )}
                    strong
                  />
                )}

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
                  onClick={
                    resetAll
                  }
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
                selectedInvoice={
                  invoice
                }
                onSelect={
                  selectInvoice
                }
              />
            )}


            {/* ===============================================
                SELECTED INVOICE
                =============================================== */}

            {invoice &&
              step !== "find" && (
                <SelectedInvoiceCard
                  invoice={
                    invoice
                  }
                  onChangeInvoice={
                    changeInvoice
                  }
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
                      icon={
                        CreditCard
                      }
                      title="Payment"
                      hint="Choose the amount and how it is paid"
                    />
                  </CardHeader>

                  <CardContent
                    className={`space-y-6 sm:space-y-8 ${PAD}`}
                  >

                    <PaymentAmountSection
                      currency="ETB"
                      balanceDue={
                        balance
                      }
                      mode={
                        amountMode
                      }
                      amount={
                        partAmount
                      }
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
                        {
                          amountError
                        }
                      </p>
                    )}


                    <div className="border-t pt-6">

                      <PaymentMethodSection
                        method={
                          method
                        }
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
                              amount={
                                amount
                              }
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
                              transferDate={
                                transferDate
                              }
                              onTransferDateChange={
                                setTransferDate
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
                        disabled={
                          isSubmitting
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

                  <CardContent
                    className={PAD}
                  >

                    <dl className="divide-y rounded-lg border px-4">

                      <Row
                        icon={
                          UserRound
                        }
                        label="Taxpayer"
                        value={`${invoice.taxpayer?.name ?? "—"} (${invoice.taxpayer?.taxpayer_number ?? "—"})`}
                      />

                      <Row
                        icon={
                          FileText
                        }
                        label="Invoice"
                        value={
                          invoice.invoice_number
                        }
                      />

                      <Row
                        icon={
                          Coins
                        }
                        label="Payment type"
                        value={
                          amountMode ===
                          "FULL"
                            ? "Full payment"
                            : "Part payment"
                        }
                      />

                      <Row
                        icon={
                          CreditCard
                        }
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
                            icon={
                              Hash
                            }
                            label="Reference"
                            value={
                              bankRef.trim()
                            }
                            mono
                          />

                          <Row
                            icon={
                              Clock3
                            }
                            label="Transfer date"
                            value={
                              transferDate
                            }
                          />

                          <Row
                            icon={
                              Receipt
                            }
                            label="Evidence"
                            value={
                              receipt?.name ??
                              "Not provided"
                            }
                          />

                        </>
                      )}


                      <Row
                        icon={
                          Banknote
                        }
                        label="Amount"
                        value={etb(
                          amount,
                        )}
                        strong
                      />

                      <Row
                        icon={
                          Wallet
                        }
                        label={
                          method ===
                          "BANK_TRANSFER"
                            ? "Projected remaining"
                            : "Remaining"
                        }
                        value={etb(
                          projectedRemaining,
                        )}
                      />

                    </dl>


                    {method ===
                      "BANK_TRANSFER" && (
                      <div className="mt-4 rounded-lg border bg-muted/30 p-3">

                        <p className="flex items-start gap-2 text-xs text-muted-foreground">

                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />

                          <span>
                            This transfer will be recorded as
                            <strong className="mx-1 font-medium text-foreground">
                              pending
                            </strong>
                            until an authorized officer verifies it.
                            The invoice balance will remain unchanged
                            until verification.
                          </span>

                        </p>

                      </div>
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
                        disabled={
                          isSubmitting
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
                          !canReview ||
                          isSubmitting
                        }
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {method ===
                            "BANK_TRANSFER"
                              ? "Recording transfer..."
                              : "Initializing payment..."}
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Confirm payment
                          </>
                        )}
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
                invoice={
                  invoice
                }
                balance={
                  balance
                }
                amount={
                  amount
                }
                remaining={
                  projectedRemaining
                }
                pending={
                  method ===
                    "BANK_TRANSFER" &&
                  submittedStatus ===
                    "PENDING"
                }
              />
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-dashed p-5">

                <Tile
                  icon={
                    FileText
                  }
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
  pending,
}: {
  invoice: AgentPendingInvoice;
  balance: number;
  amount: number;
  remaining: number;
  pending: boolean;
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
              icon={
                UserRound
              }
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
            status={
              invoice.status
            }
          />

        </div>

      </CardHeader>


      <CardContent className="px-4 py-2">

        <dl className="divide-y">

          <Row
            icon={
              FileText
            }
            label="Invoice"
            value={
              invoice.invoice_number
            }
          />

        </dl>


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
                {
                  services.length
                }
              </span>

            </div>

            <div className="space-y-1.5">

              {visibleServices.map(
                (
                  service,
                ) => (
                  <div
                    key={
                      service.id
                    }
                    className="flex items-start justify-between gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-muted/40"
                  >

                    <div className="min-w-0">

                      <p className="text-xs font-medium leading-4">
                        {
                          service.name
                        }
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
                  +{" "}
                  {
                    hiddenServiceCount
                  }{" "}
                  more{" "}
                  {
                    hiddenServiceCount ===
                    1
                      ? "service"
                      : "services"
                  }
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


        <div className="border-t">

          <dl className="divide-y">

            <Row
              icon={
                Receipt
              }
              label="Total"
              value={etb(
                invoice.total_amount,
              )}
            />

            <Row
              icon={
                CheckCircle2
              }
              label="Paid"
              value={etb(
                invoice.paid_amount,
              )}
            />

            <Row
              icon={
                Wallet
              }
              label="Balance due"
              value={etb(
                balance,
              )}
              strong
            />

          </dl>

        </div>


        {balance > 0 && (
          <div className="-mx-4 mt-2 border-t bg-muted/30 px-4 py-3">

            <dl>

              <Row
                icon={
                  Banknote
                }
                label="This payment"
                value={etb(
                  amount,
                )}
                strong
              />

              <Row
                icon={
                  Wallet
                }
                label={
                  pending
                    ? "Current balance"
                    : "Projected remaining"
                }
                value={etb(
                  pending
                    ? balance
                    : remaining,
                )}
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
            icon={
              FileText
            }
            accent
          />

          <div className="min-w-0">

            <div className="flex items-center gap-2">

              <p className="truncate text-sm font-semibold">
                {
                  invoice.invoice_number
                }
              </p>

              <StatusBadge
                status={
                  invoice.status
                }
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
          onClick={
            onChangeInvoice
          }
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
        className={`min-w-0 max-w-[65%] truncate text-right tabular-nums ${
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
