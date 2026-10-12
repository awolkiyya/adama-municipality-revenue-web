
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useTaxpayerInvoice } from "@/hooks/taxpayer/use-taxpayer-invoices";

import {
  useCreateBankTransfer,
  useInitializeOnlinePayment,
} from "@/hooks/payment/payment.hook";

import { usePaymentOptions } from "@/hooks/revenue/payment-option.hook";

import type { TaxpayerInvoice } from "@/types/taxpayer/invoice";
import type { BankAccount } from "@/types/revenue/bank-account";
import type { PaymentProvider } from "@/types/revenue/payment-provider";

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

/* ==========================================================================
 * CONSTANTS
 * ========================================================================== */

const EVIDENCE_MAX_MB = 5;

const INVOICES_PATH = "/citizen/dashboard/invoices";

type SubmittedStatus = "COMPLETED" | "PENDING";

type PaymentResult = {
  id?: string;
  payment_number?: string | null;
  transaction_reference?: string | null;
  status?: string;
  checkoutUrl?: string | null;
};

/* ==========================================================================
 * PAGE
 * ========================================================================== */

export default function InvoicePayPage() {
  const router = useRouter();

  const params = useParams<{ id: string }>();
  const invoiceId = params?.id;

  /* ------------------------------------------------------------------------
   * Invoice
   * ---------------------------------------------------------------------- */

  const {
    data: invoice,
    isLoading: isInvoiceLoading,
    isError: isInvoiceError,
    refetch,
  } = useTaxpayerInvoice(invoiceId);

  /* ------------------------------------------------------------------------
   * Payment options
   * ---------------------------------------------------------------------- */

  const {
    data: paymentOptionsResponse,
    isLoading: isPaymentOptionsLoading,
    isError: isPaymentOptionsError,
    refetch: refetchPaymentOptions,
  } = usePaymentOptions();

  const paymentOptions = paymentOptionsResponse?.data;

  const enabledPaymentMethods =
    paymentOptions?.payment_methods ?? [];

  const bankAccounts = useMemo(
    () =>
      ((paymentOptions?.bank_accounts ?? []) as BankAccount[])
        .filter((bank) => bank.is_active),
    [paymentOptions?.bank_accounts],
  );

  const paymentProviders = useMemo(
    () =>
      ((paymentOptions?.payment_providers ?? []) as PaymentProvider[])
        .filter((provider) => provider.is_active),
    [paymentOptions?.payment_providers],
  );

  /*
   * Backend payment methods:
   *
   * MOBILE_MONEY -> ONLINE
   * BANK         -> BANK_TRANSFER
   *
   * CASH is intentionally excluded from taxpayer self-service.
   */

  const hasOnlinePayment =
    enabledPaymentMethods.includes("MOBILE_MONEY");

  const hasBankTransfer =
    enabledPaymentMethods.includes("BANK");

  const hasPaymentOption =
    hasOnlinePayment || hasBankTransfer;

  const paymentOptionsReady =
    !isPaymentOptionsLoading && !isPaymentOptionsError;

  /* ------------------------------------------------------------------------
   * Mutations
   * ---------------------------------------------------------------------- */

  const {
    mutateAsync: createBankTransfer,
    isPending: isCreatingBankTransfer,
    error: bankTransferError,
    reset: resetBankTransferMutation,
  } = useCreateBankTransfer();

  const {
    mutateAsync: initializeOnlinePayment,
    isPending: isInitializingOnlinePayment,
    error: onlinePaymentError,
    reset: resetOnlinePaymentMutation,
  } = useInitializeOnlinePayment();

  /* ------------------------------------------------------------------------
   * Payment state
   * ---------------------------------------------------------------------- */

  const [method, setMethod] = useState<PaymentMethod>("ONLINE");

  const [onlineProvider, setOnlineProvider] = useState("");

  const [amountMode, setAmountMode] =
    useState<AmountMode>("FULL");

  const [partialAmount, setPartialAmount] = useState("");

  /* ------------------------------------------------------------------------
   * Bank transfer state
   * ---------------------------------------------------------------------- */

  const [bankId, setBankId] = useState<string | null>(null);

  const [reference, setReference] = useState("");

  const [evidence, setEvidence] = useState<File | null>(null);

  const [transferDate, setTransferDate] = useState(getTodayDate());

  /* ------------------------------------------------------------------------
   * Submission and result state
   * ---------------------------------------------------------------------- */

  const [error, setError] = useState<string | null>(null);

  const [submittedReference, setSubmittedReference] = useState("");

  const [submittedAmount, setSubmittedAmount] = useState(0);

  const [submittedMethod, setSubmittedMethod] =
    useState<PaymentMethod>("ONLINE");

  const [submittedStatus, setSubmittedStatus] =
    useState<SubmittedStatus>("PENDING");

  const [showResult, setShowResult] = useState(false);

  /* ------------------------------------------------------------------------
   * Keep the selected payment method valid
   * ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!paymentOptionsReady) {
      return;
    }

    setMethod((current) => {
      if (current === "ONLINE" && hasOnlinePayment) {
        return current;
      }

      if (current === "BANK_TRANSFER" && hasBankTransfer) {
        return current;
      }

      if (hasOnlinePayment) {
        return "ONLINE";
      }

      if (hasBankTransfer) {
        return "BANK_TRANSFER";
      }

      return current;
    });
  }, [
    paymentOptionsReady,
    hasOnlinePayment,
    hasBankTransfer,
  ]);

  /* ------------------------------------------------------------------------
   * Keep the selected provider valid
   * ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!hasOnlinePayment || paymentProviders.length === 0) {
      setOnlineProvider("");
      return;
    }

    const providerExists = paymentProviders.some(
      (provider) => provider.code === onlineProvider,
    );

    if (!providerExists) {
      setOnlineProvider(paymentProviders[0].code);
    }
  }, [
    hasOnlinePayment,
    paymentProviders,
    onlineProvider,
  ]);

  /* ------------------------------------------------------------------------
   * Keep the selected bank valid
   * ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!hasBankTransfer || bankAccounts.length === 0) {
      setBankId(null);
      return;
    }

    const bankExists = bankAccounts.some(
      (bank) => bank.id === bankId,
    );

    if (!bankExists) {
      setBankId(
        bankAccounts.length === 1
          ? bankAccounts[0].id
          : null,
      );
    }
  }, [
    hasBankTransfer,
    bankAccounts,
    bankId,
  ]);

  /* ------------------------------------------------------------------------
   * Derived values
   * ---------------------------------------------------------------------- */

  const balanceDue = parseMoney(invoice?.balance_due);

  const amountText =
    amountMode === "FULL"
      ? balanceDue.toFixed(2)
      : partialAmount;

  const amount = parseMoney(amountText);

  const validation = validateAmount(
    amountText,
    balanceDue,
    amountMode,
  );

  const projectedRemaining = validation.isValid
    ? Math.max(0, balanceDue - amount)
    : balanceDue;

  const selectedBank =
    bankAccounts.find((bank) => bank.id === bankId) ?? null;

  const selectedProvider =
    paymentProviders.find(
      (provider) => provider.code === onlineProvider,
    ) ?? null;

  const isOnline = method === "ONLINE";

  const isBank = method === "BANK_TRANSFER";

  const isSubmitting =
    isCreatingBankTransfer || isInitializingOnlinePayment;

  const methodReady =
    (isOnline &&
      hasOnlinePayment &&
      !!selectedProvider) ||
    (isBank &&
      hasBankTransfer &&
      !!selectedBank);

  /*
   * Evidence is optional here, matching the agent portal.
   * The backend must also define evidence as nullable.
   */

  const bankReady =
    !isBank ||
    (!!selectedBank &&
      reference.trim().length >= 6 &&
      !!transferDate);

  const canSubmit =
    paymentOptionsReady &&
    methodReady &&
    validation.isValid &&
    bankReady &&
    !isSubmitting;

  /* ------------------------------------------------------------------------
   * Reset mutation errors when the user edits the payment
   * ---------------------------------------------------------------------- */

  function clearErrors() {
    setError(null);
    resetBankTransferMutation();
    resetOnlinePaymentMutation();
  }

  /* ------------------------------------------------------------------------
   * Record a backend-generated payment result
   * ---------------------------------------------------------------------- */

  function recordResult(
    payment: PaymentResult,
    paymentMethod: PaymentMethod,
    paymentAmount: number,
  ) {
    const backendReference =
      payment.transaction_reference ||
      payment.payment_number ||
      payment.id;

    if (!backendReference) {
      throw new Error(
        "The server did not return a payment reference.",
      );
    }

    setSubmittedReference(backendReference);
    setSubmittedAmount(paymentAmount);
    setSubmittedMethod(paymentMethod);

    setSubmittedStatus(
      payment.status === "COMPLETED"
        ? "COMPLETED"
        : "PENDING",
    );

    setShowResult(true);
  }

  /* ------------------------------------------------------------------------
   * Submit payment
   * ---------------------------------------------------------------------- */

  async function handleSubmit() {
    if (isSubmitting || !invoice) {
      return;
    }

    clearErrors();

    if (!paymentOptionsReady) {
      setError(
        "Payment options are unavailable. Please try again.",
      );
      return;
    }

    if (!isInvoicePayable(invoice)) {
      setError(
        "This invoice is no longer payable. Refresh the invoice and try again.",
      );
      return;
    }

    if (!validation.isValid) {
      setError(
        validation.message ?? "Enter a valid payment amount.",
      );
      return;
    }

    /* ----------------------------------------------------------------------
     * Bank transfer
     * -------------------------------------------------------------------- */

    if (isBank) {
      if (!hasBankTransfer) {
        setError("Bank transfer is currently unavailable.");
        return;
      }

      if (!selectedBank) {
        setError("Select the bank account you transferred to.");
        return;
      }

      if (reference.trim().length < 6) {
        setError(
          "Enter a transfer reference containing at least 6 characters.",
        );
        return;
      }

      if (!transferDate) {
        setError("Enter the transfer date.");
        return;
      }

      try {
        const response = await createBankTransfer({
          invoice_id: invoice.id,
          amount,
          bank_account_id: selectedBank.id,
          transfer_reference: reference.trim(),
          transfer_date: transferDate,
          evidence: evidence ?? undefined,
          metadata: {
            amount_mode: amountMode,
            source: "TAXPAYER_PORTAL",
            invoice_number: invoice.invoice_number,
          },
        });

        const payment = response?.data as
          | PaymentResult
          | null
          | undefined;

        if (!payment) {
          throw new Error(
            "The server did not return the bank transfer payment.",
          );
        }

        /*
         * A bank transfer is normally PENDING until an
         * authorized finance officer verifies it.
         *
         * The invoice balance must not be reduced here.
         */

        recordResult(payment, "BANK_TRANSFER", amount);
      } catch (err) {
        setError(
          getErrorMessage(
            err,
            "The bank transfer could not be submitted. Please check the details and try again.",
          ),
        );
      }

      return;
    }

    /* ----------------------------------------------------------------------
     * Online payment
     * -------------------------------------------------------------------- */

    if (!hasOnlinePayment) {
      setError("Online payment is currently unavailable.");
      return;
    }

    if (!selectedProvider) {
      setError("Select an available payment provider.");
      return;
    }

    try {
      const response = await initializeOnlinePayment({
        invoice_id: invoice.id,
        amount,
        payment_provider: selectedProvider.code,
      });

      const payment = response?.data as
        | PaymentResult
        | null
        | undefined;

      if (!payment) {
        throw new Error(
          "Online payment initialization did not return a payment.",
        );
      }

      /*
       * The backend creates the payment and initializes
       * the provider checkout.
       *
       * Only a verified backend webhook may mark it COMPLETED.
       */

      if (!payment.checkoutUrl) {
        throw new Error(
          "The payment was initialized, but no checkout URL was returned.",
        );
      }

      window.location.assign(payment.checkoutUrl);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Online payment could not be initialized. Please try again.",
        ),
      );
    }
  }

  /* ------------------------------------------------------------------------
   * Loading
   * ---------------------------------------------------------------------- */

  if (isInvoiceLoading || isPaymentOptionsLoading) {
    return <PageSkeleton />;
  }

  /* ------------------------------------------------------------------------
   * Invoice loading error
   * ---------------------------------------------------------------------- */

  if (isInvoiceError || !invoice) {
    return (
      <StateCard
        icon={<FileText className="size-6 text-muted-foreground" />}
        title="Unable to load invoice"
        text="We could not load the payment information. Please try again."
        primary={
          <Button
            type="button"
            onClick={() => void refetch()}
          >
            Try again
          </Button>
        }
        backHref={INVOICES_PATH}
      />
    );
  }

  /* ------------------------------------------------------------------------
   * Payment options error
   * ---------------------------------------------------------------------- */

  if (isPaymentOptionsError) {
    return (
      <StateCard
        icon={<CreditCard className="size-6 text-muted-foreground" />}
        title="Payment options unavailable"
        text="We could not load the currently available payment methods."
        primary={
          <Button
            type="button"
            onClick={() => void refetchPaymentOptions()}
          >
            Try again
          </Button>
        }
        backHref={`${INVOICES_PATH}/${invoice.id}`}
      />
    );
  }

  /* ------------------------------------------------------------------------
   * Invoice cannot be paid
   * ---------------------------------------------------------------------- */

  if (!isInvoicePayable(invoice)) {
    const paid = invoice.is_fully_paid;
    const cancelled = invoice.status === "CANCELLED";

    return (
      <StateCard
        icon={
          paid ? (
            <CheckCircle2 className="size-6 text-muted-foreground" />
          ) : (
            <FileText className="size-6 text-muted-foreground" />
          )
        }
        title={
          paid
            ? "Invoice already paid"
            : cancelled
              ? "Invoice cancelled"
              : "Invoice cannot be paid"
        }
        text={`Invoice ${invoice.invoice_number} is not available for payment.`}
        primary={
          <Button asChild>
            <Link href={`${INVOICES_PATH}/${invoice.id}`}>
              View invoice
            </Link>
          </Button>
        }
        backHref={INVOICES_PATH}
      />
    );
  }

  /* ------------------------------------------------------------------------
   * No supported self-service method
   * ---------------------------------------------------------------------- */

  if (!hasPaymentOption) {
    return (
      <StateCard
        icon={<CreditCard className="size-6 text-muted-foreground" />}
        title="Online payment unavailable"
        text="There are currently no online or bank-transfer payment methods available."
        primary={
          <Button asChild>
            <Link href={`${INVOICES_PATH}/${invoice.id}`}>
              View invoice
            </Link>
          </Button>
        }
        backHref={INVOICES_PATH}
      />
    );
  }

  /* ------------------------------------------------------------------------
   * Successful bank-transfer submission
   * ---------------------------------------------------------------------- */

  if (showResult) {
    const isPending = submittedStatus === "PENDING";

    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
        <header className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="shrink-0"
          >
            <Link href={`${INVOICES_PATH}/${invoice.id}`}>
              <ArrowLeft className="size-4" />
              <span className="sr-only">Back to invoice</span>
            </Link>
          </Button>

          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Payment submission
            </h1>
            <p className="text-sm text-muted-foreground">
              {invoice.invoice_number}
            </p>
          </div>
        </header>

        <Card>
          <CardContent className="flex flex-col items-center px-5 py-10 text-center sm:px-8">
            <div className="flex size-14 items-center justify-center rounded-full border">
              {isPending ? (
                <Clock3 className="size-7 text-muted-foreground" />
              ) : (
                <CheckCircle2 className="size-7 text-primary" />
              )}
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              {isPending
                ? submittedMethod === "BANK_TRANSFER"
                  ? "Bank transfer submitted"
                  : "Payment pending"
                : "Payment completed"}
            </h2>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {isPending
                ? `Your payment of ${formatMoney(
                    invoice.currency,
                    submittedAmount,
                  )} has been recorded and is awaiting confirmation.`
                : `${formatMoney(
                    invoice.currency,
                    submittedAmount,
                  )} has been recorded as completed.`}
            </p>

            {isPending && (
              <div className="mt-5 flex max-w-md items-start gap-2 rounded-lg border bg-muted/30 p-3 text-left text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                <span>
                  A pending payment does not reduce your invoice
                  balance. Bank transfers must be verified by an
                  authorized officer. Online payments must be
                  confirmed by the payment provider through the
                  backend verification process.
                </span>
              </div>
            )}

            <dl className="mt-6 w-full max-w-sm divide-y rounded-lg border px-4 text-left">
              <Meta
                label="Payment reference"
                value={submittedReference}
              />

              <Meta
                label="Payment method"
                value={
                  submittedMethod === "BANK_TRANSFER"
                    ? `Bank transfer · ${selectedBank?.bank_name ?? "Bank"}`
                    : `Online · ${selectedProvider?.name ?? "Payment provider"}`
                }
              />

              <Meta
                label="Payment amount"
                value={formatMoney(
                  invoice.currency,
                  submittedAmount,
                )}
              />

              <Meta
                label={
                  isPending
                    ? "Current invoice balance"
                    : "Previously calculated remaining balance"
                }
                value={formatMoney(
                  invoice.currency,
                  isPending
                    ? balanceDue
                    : projectedRemaining,
                )}
              />
            </dl>

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild variant="outline">
                <Link href={INVOICES_PATH}>
                  Back to invoices
                </Link>
              </Button>

              <Button asChild>
                <Link href={`${INVOICES_PATH}/${invoice.id}`}>
                  View invoice
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ------------------------------------------------------------------------
   * Main payment page
   * ---------------------------------------------------------------------- */

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      {/* Header */}

      <header className="flex items-center gap-3">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="shrink-0"
        >
          <Link href={`${INVOICES_PATH}/${invoice.id}`}>
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to invoice</span>
          </Link>
        </Button>

        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Pay invoice
          </h1>
          <p className="text-sm text-muted-foreground">
            {invoice.invoice_number}
          </p>
        </div>
      </header>

      {/* Invoice summary */}

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Balance due
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
                {formatMoney(invoice.currency, balanceDue)}
              </p>
            </div>

            <InvoiceStatusBadge invoice={invoice} />
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-4 border-t pt-4 text-sm">
            <Meta
              label="Total"
              value={formatMoney(
                invoice.currency,
                invoice.total_amount,
              )}
            />

            <Meta
              label="Paid"
              value={formatMoney(
                invoice.currency,
                invoice.paid_amount,
              )}
            />

            <Meta
              label="Due date"
              value={formatDate(invoice.due_date)}
            />
          </dl>

          {invoice.is_overdue && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
              This invoice is overdue. Any applicable penalty or
              interest should be reflected in the backend-calculated
              balance.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment amount */}

      <PaymentAmountSection
        currency={invoice.currency}
        balanceDue={balanceDue}
        mode={amountMode}
        amount={amountText}
        onModeChange={(nextMode) => {
          clearErrors();
          setAmountMode(nextMode);

          if (nextMode === "FULL") {
            setPartialAmount("");
          }
        }}
        onAmountChange={(nextAmount) => {
          setError(null);
          setPartialAmount(nextAmount);
        }}
      />

      {/* Payment method */}

      <PaymentMethodSection
        hasOnlinePayment={hasOnlinePayment}
        hasBankTransfer={hasBankTransfer}
        method={method}
        onMethodChange={(nextMethod) => {
          clearErrors();
          setMethod(nextMethod);
        }}
      />

      {/* Online payment */}

      {isOnline && hasOnlinePayment && (
        <OnlinePaymentSection
          currency={invoice.currency}
          amount={amount}
          providers={paymentProviders}
          selectedProvider={selectedProvider}
          onProviderChange={(provider) => {
            clearErrors();
            setOnlineProvider(provider.code);
          }}
        />
      )}

      {isOnline && paymentProviders.length === 0 && (
        <UnavailablePaymentMethod
          title="No online payment provider available"
          description="Online payment is currently unavailable. Choose another supported payment method."
        />
      )}

      {/* Bank transfer */}

      {isBank && hasBankTransfer && (
        <BankTransferSection
          banks={bankAccounts}
          selectedBank={selectedBank}
          onBankChange={(bank) => {
            clearErrors();
            setBankId(bank.id);
          }}
          transferReference={reference}
          onTransferReferenceChange={(value) => {
            setError(null);
            setReference(value);
          }}
          transferDate={transferDate}
          onTransferDateChange={(value) => {
            setError(null);
            setTransferDate(value);
          }}
          evidence={evidence}
          onEvidenceChange={(file) => {
            setError(null);
            setEvidence(file);
          }}
          evidenceMaxMb={EVIDENCE_MAX_MB}
        />
      )}

      {isBank && bankAccounts.length === 0 && (
        <UnavailablePaymentMethod
          title="No bank account available"
          description="Bank transfer is currently unavailable. Choose another supported payment method."
        />
      )}

      {/* Mutation errors */}

      {(error || bankTransferError || onlinePaymentError) && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>
            {error ??
              getErrorMessage(
                bankTransferError ?? onlinePaymentError,
                "The payment request failed. Please try again.",
              )}
          </p>
        </div>
      )}

      {/* Payment confirmation */}

      <div className="space-y-3">
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              Payment amount
            </span>
            <span className="font-semibold tabular-nums">
              {formatMoney(
                invoice.currency,
                validation.isValid ? amount : 0,
              )}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              Projected remaining
            </span>
            <span className="font-medium tabular-nums">
              {formatMoney(
                invoice.currency,
                projectedRemaining,
              )}
            </span>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            The remaining balance is a preview. The backend
            determines the final invoice balance after a payment
            has been verified and completed.
          </p>
        </div>

        <Button
          type="button"
          size="lg"
          className="h-12 w-full text-base"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {isBank
                ? "Submitting transfer..."
                : "Initializing payment..."}
            </>
          ) : isBank ? (
            "Submit bank transfer"
          ) : (
            `Pay ${formatMoney(
              invoice.currency,
              validation.isValid ? amount : 0,
            )}`
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {isBank
            ? "Bank transfers remain pending until verified by an authorized officer."
            : selectedProvider
              ? `You will be redirected to ${selectedProvider.name} to complete your payment.`
              : "Select an available payment provider to continue."}
        </p>
      </div>
    </div>
  );
}

/* ==========================================================================
 * SMALL UI
 * ========================================================================== */

function Meta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 py-2">
      <dt className="text-xs text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 break-words font-medium tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function InvoiceStatusBadge({
  invoice,
}: {
  invoice: TaxpayerInvoice;
}) {
  const status = getDisplayStatus(invoice);

  const styles: Record<
    string,
    { label: string; className: string }
  > = {
    ISSUED: {
      label: "Unpaid",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    },
    PARTIALLY_PAID: {
      label: "Partially paid",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
    },
    OVERDUE: {
      label: "Overdue",
      className:
        "border-red-200 bg-red-50 text-red-700",
    },
    PAID: {
      label: "Paid",
      className:
        "border-green-200 bg-green-50 text-green-700",
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-muted text-muted-foreground",
    },
    VOID: {
      label: "Void",
      className: "bg-muted text-muted-foreground",
    },
  };

  const current = styles[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-medium ${current.className}`}
    >
      {current.label}
    </span>
  );
}

function StateCard({
  icon,
  title,
  text,
  primary,
  backHref,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  primary: ReactNode;
  backHref: string;
}) {
  return (
    <div className="mx-auto flex min-h-[420px] w-full max-w-md items-center p-4">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center px-6 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            {icon}
          </div>

          <h1 className="mt-4 text-lg font-semibold">
            {title}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {text}
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {primary}

            <Button asChild variant="outline">
              <Link href={backHref}>
                Back to invoices
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl animate-pulse space-y-6 p-4 sm:p-6">
      <div className="h-10 w-48 rounded bg-muted" />
      <div className="h-36 rounded-xl bg-muted" />
      <div className="h-40 rounded-xl bg-muted" />
      <div className="h-32 rounded-xl bg-muted" />
      <div className="h-12 rounded bg-muted" />
    </div>
  );
}

function UnavailablePaymentMethod({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed p-4">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/* ==========================================================================
 * BUSINESS LOGIC
 * ========================================================================== */

function isInvoicePayable(
  invoice: TaxpayerInvoice,
): boolean {
  return (
    !invoice.is_fully_paid &&
    parseMoney(invoice.balance_due) > 0 &&
    ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(
      invoice.status,
    )
  );
}

function getDisplayStatus(
  invoice: TaxpayerInvoice,
): string {
  if (invoice.is_fully_paid) {
    return "PAID";
  }

  if (invoice.is_overdue) {
    return "OVERDUE";
  }

  return invoice.status;
}

function validateAmount(
  value: string,
  balanceDue: number,
  mode: AmountMode,
): {
  isValid: boolean;
  message: string | null;
} {
  if (!value.trim()) {
    return {
      isValid: false,
      message: "Enter an amount to pay.",
    };
  }

  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    return {
      isValid: false,
      message: "Enter a valid amount with up to 2 decimal places.",
    };
  }

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      isValid: false,
      message: "Amount must be greater than zero.",
    };
  }

  if (amount > balanceDue) {
    return {
      isValid: false,
      message: `Amount cannot exceed the balance of ${formatAmount(balanceDue)}.`,
    };
  }

  /*
   * Partial payment must be strictly less than the balance.
   * If the taxpayer wants to pay the entire balance, they
   * should choose FULL instead.
   */

  if (mode === "PARTIAL" && amount >= balanceDue) {
    return {
      isValid: false,
      message:
        "A partial payment must be less than the balance. Choose full payment instead.",
    };
  }

  return {
    isValid: true,
    message: null,
  };
}

function parseMoney(
  value: string | number | null | undefined,
): number {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed)
    ? Math.round((parsed + Number.EPSILON) * 100) / 100
    : 0;
}

function formatAmount(
  value: string | number,
): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatMoney(
  currency: string,
  value: string | number,
): string {
  return `${currency} ${formatAmount(value)}`;
}

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return "—";
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getTodayDate(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}