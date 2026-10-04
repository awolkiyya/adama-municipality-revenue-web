"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";



import { useTaxpayerInvoice } from "@/hooks/taxpayer/use-taxpayer-invoices";

import {
  useCreateBankTransfer,
  useInitializeOnlinePayment,
} from "@/hooks/payment/payment.hook";

import { usePaymentOptions } from "@/hooks/revenue/payment-option.hook";

import type { TaxpayerInvoice } from "@/types/taxpayer/invoice";
import { AmountMode, PaymentAmountSection } from "@/components/payment/section/PaymentAmountSection";
import { BankAccount } from "@/types/revenue/bank-account";
import { PaymentProvider } from "@/types/revenue/payment-provider";
import { PaymentMethod, PaymentMethodSection } from "@/components/payment/section/PaymentMethodSection";
import { OnlinePaymentSection } from "@/components/payment/section/OnlinePaymentSection";
import { BankTransferSection } from "@/components/payment/section/BankTransferSection";

/* ==========================================================================
 * CONFIG
 * ========================================================================== */

const EVIDENCE_MAX_MB = 5;

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
   *
   * Backend is the source of truth for:
   *
   * - enabled payment methods
   * - active bank accounts
   * - active payment providers
   * - provider fees
   * ---------------------------------------------------------------------- */

  const {
    data: paymentOptionsResponse,
    isLoading: isPaymentOptionsLoading,
    isError: isPaymentOptionsError,
    refetch: refetchPaymentOptions,
  } = usePaymentOptions();

  const paymentOptions =
    paymentOptionsResponse?.data;

  const enabledPaymentMethods =
    paymentOptions?.payment_methods ?? [];

  const bankAccounts =
    (paymentOptions?.bank_accounts ??
      []) as BankAccount[];

  const paymentProviders =
    (paymentOptions?.payment_providers ??
      []) as PaymentProvider[];

  /*
   * Backend payment method:
   *
   * MOBILE_MONEY → taxpayer UI: ONLINE
   * BANK         → taxpayer UI: BANK_TRANSFER
   *
   * CASH is intentionally excluded because this is
   * the taxpayer self-service payment page.
   */

  const hasOnlinePayment =
    enabledPaymentMethods.includes(
      "MOBILE_MONEY",
    );

  const hasBankTransfer =
    enabledPaymentMethods.includes(
      "BANK",
    );

  const hasPaymentOption =
    hasOnlinePayment ||
    hasBankTransfer;

  const paymentOptionsReady =
    !isPaymentOptionsLoading &&
    !isPaymentOptionsError;

  /* ------------------------------------------------------------------------
   * Mutations
   * ---------------------------------------------------------------------- */

  const initializeOnlinePayment =
    useInitializeOnlinePayment();

  const createBankTransfer =
    useCreateBankTransfer();

  /* ------------------------------------------------------------------------
   * State
   * ---------------------------------------------------------------------- */

  const [method, setMethod] =
    useState<PaymentMethod>("ONLINE");

  const [onlineProvider, setOnlineProvider] =
    useState("");

  const [amountMode, setAmountMode] =
    useState<AmountMode>("FULL");

  const [partialAmount, setPartialAmount] =
    useState("");

  const [bankId, setBankId] =
    useState<string | null>(null);

  const [reference, setReference] =
    useState("");

  const [evidence, setEvidence] =
    useState<File | null>(null);

  const [transferDate, setTransferDate] =
    useState("");

  const [error, setError] =
    useState<string | null>(null);

  /* ------------------------------------------------------------------------
   * Synchronize payment method
   * ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!paymentOptionsReady) {
      return;
    }

    setMethod((current) => {
      if (
        current === "ONLINE" &&
        hasOnlinePayment
      ) {
        return current;
      }

      if (
        current === "BANK_TRANSFER" &&
        hasBankTransfer
      ) {
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
   * Synchronize online provider
   * ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!hasOnlinePayment) {
      setOnlineProvider("");
      return;
    }

    if (paymentProviders.length === 0) {
      setOnlineProvider("");
      return;
    }

    const currentExists =
      paymentProviders.some(
        (provider) =>
          provider.code === onlineProvider,
      );

    if (!currentExists) {
      setOnlineProvider(
        paymentProviders[0].code,
      );
    }
  }, [
    hasOnlinePayment,
    paymentProviders,
    onlineProvider,
  ]);

  /* ------------------------------------------------------------------------
   * Synchronize bank account
   * ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!hasBankTransfer) {
      setBankId(null);
      return;
    }

    if (bankAccounts.length === 0) {
      setBankId(null);
      return;
    }

    const currentExists =
      bankAccounts.some(
        (bank) => bank.id === bankId,
      );

    if (!currentExists) {
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
   * Loading
   * ---------------------------------------------------------------------- */

  if (
    isInvoiceLoading ||
    isPaymentOptionsLoading
  ) {
    return <PageSkeleton />;
  }

  /* ------------------------------------------------------------------------
   * Invoice error
   * ---------------------------------------------------------------------- */

  if (
    isInvoiceError ||
    !invoice
  ) {
    return (
      <StateCard
        icon={
          <FileText className="size-6 text-muted-foreground" />
        }
        title="Unable to load invoice"
        text="We could not load the payment information. Please try again."
        primary={
          <Button
            onClick={() => {
              void refetch();
            }}
          >
            Try again
          </Button>
        }
        backHref="/citizen/dashboard/invoices"
      />
    );
  }

  /* ------------------------------------------------------------------------
   * Payment options error
   * ---------------------------------------------------------------------- */

  if (isPaymentOptionsError) {
    return (
      <StateCard
        icon={
          <CreditCard className="size-6 text-muted-foreground" />
        }
        title="Payment options unavailable"
        text="We could not load the payment methods currently available."
        primary={
          <Button
            onClick={() => {
              void refetchPaymentOptions();
            }}
          >
            Try again
          </Button>
        }
        backHref={`/citizen/dashboard/invoices/${invoice.id}`}
      />
    );
  }

  /* ------------------------------------------------------------------------
   * Invoice not payable
   * ---------------------------------------------------------------------- */

  if (!isInvoicePayable(invoice)) {
    const paid =
      invoice.is_fully_paid;

    const cancelled =
      invoice.status === "CANCELLED";

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
            <Link
              href={`/citizen/dashboard/invoices/${invoice.id}`}
            >
              View invoice
            </Link>
          </Button>
        }
        backHref="/citizen/dashboard/invoices"
      />
    );
  }

  /* ------------------------------------------------------------------------
   * No supported self-service method
   * ---------------------------------------------------------------------- */

  if (!hasPaymentOption) {
    return (
      <StateCard
        icon={
          <CreditCard className="size-6 text-muted-foreground" />
        }
        title="Online payment unavailable"
        text="There are currently no online or bank-transfer payment methods available."
        primary={
          <Button asChild>
            <Link
              href={`/citizen/dashboard/invoices/${invoice.id}`}
            >
              View invoice
            </Link>
          </Button>
        }
        backHref="/citizen/dashboard/invoices"
      />
    );
  }

  /* ------------------------------------------------------------------------
   * Derived values
   * ---------------------------------------------------------------------- */

  const balanceDue = parseMoney(
    invoice.balance_due,
  );

  const amountText =
    amountMode === "FULL"
      ? balanceDue.toFixed(2)
      : partialAmount;

  const validation =
    validateAmount(
      amountText,
      balanceDue,
    );

  const amount =
    parseMoney(amountText);

  const remaining =
    validation.isValid
      ? Math.max(
          0,
          balanceDue - amount,
        )
      : null;

  const selectedBank =
    bankAccounts.find(
      (bank) => bank.id === bankId,
    ) ?? null;

  const selectedProvider =
    paymentProviders.find(
      (provider) =>
        provider.code === onlineProvider,
    ) ?? null;

  const isOnline =
    method === "ONLINE";

  const isBank =
    method === "BANK_TRANSFER";

  const isSubmitting =
    initializeOnlinePayment.isPending ||
    createBankTransfer.isPending;

  /* ------------------------------------------------------------------------
   * Payment readiness
   * ---------------------------------------------------------------------- */

  const methodReady =
    (isOnline &&
      hasOnlinePayment &&
      paymentProviders.length > 0 &&
      !!selectedProvider) ||
    (isBank &&
      hasBankTransfer &&
      bankAccounts.length > 0 &&
      !!selectedBank);

  const bankReady =
    !isBank ||
    (!!selectedBank &&
      !!reference.trim() &&
      !!evidence);

  const canSubmit =
    paymentOptionsReady &&
    methodReady &&
    validation.isValid &&
    bankReady &&
    !isSubmitting;

  /* ------------------------------------------------------------------------
   * Submit
   * ---------------------------------------------------------------------- */

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    setError(null);

    /* ----------------------------------------------------------------------
     * Payment options
     * -------------------------------------------------------------------- */

    if (!paymentOptionsReady) {
      setError(
        "Payment options are currently unavailable. Please try again.",
      );
      return;
    }

    /* ----------------------------------------------------------------------
     * Amount
     * -------------------------------------------------------------------- */

    if (!validation.isValid) {
      setError(
        validation.message ??
          "Enter a valid amount.",
      );
      return;
    }

    /* ----------------------------------------------------------------------
     * BANK TRANSFER
     * -------------------------------------------------------------------- */

    if (isBank) {
      if (!hasBankTransfer) {
        setError(
          "Bank transfer is currently unavailable.",
        );
        return;
      }

      if (!selectedBank) {
        setError(
          "Select the bank you transferred to.",
        );
        return;
      }

      if (!reference.trim()) {
        setError(
          "Enter your transfer reference.",
        );
        return;
      }

      if (!evidence) {
        setError(
          "Upload your payment receipt as evidence.",
        );
        return;
      }

      try {
        await createBankTransfer.mutateAsync({
          invoice_id: invoice.id,
          amount,
          transfer_reference:
            reference.trim(),
          bank_name:
            selectedBank.bank_name,
          bank_account_number:
            selectedBank.account_number,
          evidence,
          transfer_date:
            transferDate || "",
        });

        router.push(
          `/citizen/dashboard/invoices/${invoice.id}?payment=bank-transfer-submitted`,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
        );
      }

      return;
    }

    /* ----------------------------------------------------------------------
     * ONLINE PAYMENT
     * -------------------------------------------------------------------- */

    if (!hasOnlinePayment) {
      setError(
        "Online payment is currently unavailable.",
      );
      return;
    }

    if (!selectedProvider) {
      setError(
        "Select an available payment provider.",
      );
      return;
    }

    try {
      /*
       * The frontend provider fee is only a preview.
       *
       * Laravel/payment integration remains authoritative for:
       *
       * - provider fee
       * - final payable amount
       * - checkout amount
       */

      const response =
        await initializeOnlinePayment.mutateAsync(
          {
            invoice_id: invoice.id,
            amount,
            payment_provider:
              selectedProvider.code,
          },
        );

      const checkoutUrl =
        response?.data?.checkoutUrl;

      if (!checkoutUrl) {
        setError(
          "The payment service did not return a checkout link. Please try again.",
        );
        return;
      }

      window.location.assign(
        checkoutUrl,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  /* ------------------------------------------------------------------------
   * Render
   * ---------------------------------------------------------------------- */

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      {/* ================================================================
          HEADER
          ================================================================ */}

      <header className="flex items-center gap-3">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="shrink-0"
        >
          <Link
            href={`/citizen/dashboard/invoices/${invoice.id}`}
          >
            <ArrowLeft className="size-4" />

            <span className="sr-only">
              Back to invoice
            </span>
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

      {/* ================================================================
          INVOICE SUMMARY
          ================================================================ */}

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Balance due
              </p>

              <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
                {formatMoney(
                  invoice.currency,
                  balanceDue,
                )}
              </p>
            </div>

            <StatusBadge invoice={invoice} />
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
              value={formatDate(
                invoice.due_date,
              )}
            />
          </dl>

          {invoice.is_overdue && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
              This invoice is overdue. Any
              penalty or interest is already
              included in the balance.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ================================================================
          1. PAYMENT AMOUNT
          ================================================================ */}

      <PaymentAmountSection
        currency={invoice.currency}
        balanceDue={balanceDue}
        mode={amountMode}
        amount={amountText}
        onModeChange={(nextMode) => {
          setError(null);
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

      {/* ================================================================
          2. PAYMENT METHOD
          ================================================================ */}

      <PaymentMethodSection
        hasOnlinePayment={
          hasOnlinePayment
        }
        hasBankTransfer={
          hasBankTransfer
        }
        method={method}
        onMethodChange={(nextMethod) => {
          setError(null);
          setMethod(nextMethod);
        }}
      />

      {/* ================================================================
          ONLINE PAYMENT
          ================================================================ */}

      {isOnline &&
        hasOnlinePayment && (
          <OnlinePaymentSection
            currency={invoice.currency}
            amount={amount}
            providers={paymentProviders}
            selectedProvider={
              selectedProvider
            }
            onProviderChange={(
              provider,
            ) => {
              setError(null);
              setOnlineProvider(
                provider.code,
              );
            }}
          />
        )}

      {/* ================================================================
          BANK TRANSFER
          ================================================================ */}

      {isBank &&
        hasBankTransfer && (
          <BankTransferSection
            banks={bankAccounts}
            selectedBank={selectedBank}
            onBankChange={(bank) => {
              setError(null);
              setBankId(bank.id);
            }}
            transferReference={reference}
            onTransferReferenceChange={(
              value,
            ) => {
              setError(null);
              setReference(value);
            }}
            evidence={evidence}
            onEvidenceChange={(file) => {
              setError(null);
              setEvidence(file);
            }}
            evidenceMaxMb={
              EVIDENCE_MAX_MB
            }
          />
        )}

      {/* ================================================================
          ERROR
          ================================================================ */}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* ================================================================
          SUBMIT
          ================================================================ */}

      <div className="space-y-3">
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
                ? "Submitting..."
                : "Redirecting..."}
            </>
          ) : isBank ? (
            "Submit bank transfer"
          ) : (
            `Pay ${formatMoney(
              invoice.currency,
              validation.isValid
                ? amount
                : 0,
            )}`
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {isBank
            ? "Your transfer will remain pending until the receipt is verified."
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
    <div>
      <dt className="text-xs text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-0.5 truncate font-medium tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function StatusBadge({
  invoice,
}: {
  invoice: TaxpayerInvoice;
}) {
  const status =
    getDisplayStatus(invoice);

  const map: Record<
    string,
    {
      label: string;
      className: string;
    }
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
      className:
        "bg-muted text-muted-foreground",
    },
  };

  const current =
    map[status] ?? {
      label: status,
      className: "",
    };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        current.className,
      ].join(" ")}
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
  icon: React.ReactNode;
  title: string;
  text: string;
  primary: React.ReactNode;
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

            <Button
              asChild
              variant="outline"
            >
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

/* ==========================================================================
 * BUSINESS LOGIC
 * ========================================================================== */

function isInvoicePayable(
  invoice: TaxpayerInvoice,
): boolean {
  return (
    !invoice.is_fully_paid &&
    Number(invoice.balance_due) > 0 &&
    [
      "ISSUED",
      "PARTIALLY_PAID",
      "OVERDUE",
    ].includes(invoice.status)
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
): {
  isValid: boolean;
  message: string | null;
} {
  if (value.trim() === "") {
    return {
      isValid: false,
      message: "Enter an amount to pay.",
    };
  }

  if (
    !/^\d+(\.\d{1,2})?$/.test(value)
  ) {
    return {
      isValid: false,
      message:
        "Enter a valid amount (up to 2 decimals).",
    };
  }

  const amount = Number(value);

  if (amount <= 0) {
    return {
      isValid: false,
      message:
        "Amount must be greater than 0.",
    };
  }

  if (amount > balanceDue) {
    return {
      isValid: false,
      message: `Amount cannot exceed the balance of ${formatAmount(
        balanceDue,
      )}.`,
    };
  }

  return {
    isValid: true,
    message: null,
  };
}

function parseMoney(
  value:
    | string
    | number
    | null
    | undefined,
): number {
  const parsed = Number(
    value ?? 0,
  );

  return Number.isFinite(parsed)
    ? Math.round(parsed * 100) / 100
    : 0;
}

function formatAmount(
  value: string | number,
): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(amount);
}

function formatMoney(
  currency: string,
  value: string | number,
): string {
  return `${currency} ${formatAmount(value)}`;
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "—";
  }

  const date =
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(
          `${value}T00:00:00`,
        )
      : new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}