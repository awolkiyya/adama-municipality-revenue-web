"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useTaxpayerInvoice } from "@/hooks/taxpayer/use-taxpayer-invoices";

import type { TaxpayerInvoice } from "@/types/taxpayer/invoice";
import { useInitializeChapaPayment } from "@/hooks/payment/payment.hook";

type PaymentMethod = "CHAPA";

export default function InvoicePayPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = params?.id;

  const {
    data: invoice,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useTaxpayerInvoice(invoiceId);

  /*
   * ============================================================
   * PAYMENT INITIALIZATION MUTATION
   * ============================================================
   *
   * Backend:
   *
   * POST /payments/chapa/initialize
   *
   * The backend remains responsible for:
   *
   * - authentication
   * - taxpayer authorization
   * - invoice ownership
   * - current balance
   * - amount validation
   * - payment creation
   * - Chapa initialization
   *
   */
  const initializeChapaPayment =
    useInitializeChapaPayment();

  /*
   * The amount the taxpayer wants to pay now.
   *
   * This is NOT the invoice balance itself.
   *
   * Example:
   *
   * Invoice total = 5,000
   * Already paid   = 2,000
   * Balance due    = 3,000
   *
   * The taxpayer may enter:
   *
   * 3,000 -> full payment
   * 1,500 -> partial payment
   */
  const [paymentAmount, setPaymentAmount] =
    useState("");

  /*
   * Currently supported payment method.
   *
   * The current backend contract supports Chapa.
   *
   * Telebirr / Online Banking should be added here only
   * when their backend initialization endpoints/contracts
   * are implemented.
   */
  const [paymentMethod] =
    useState<PaymentMethod>("CHAPA");

  /*
   * Prevent repeated initialization when the invoice query
   * refetches.
   */
  const [initializedInvoiceId, setInitializedInvoiceId] =
    useState<string | null>(null);

  /*
   * Payment initialization error shown directly on this page.
   */
  const [paymentError, setPaymentError] =
    useState<string | null>(null);

  /*
   * ============================================================
   * INITIALIZE PAYMENT AMOUNT
   * ============================================================
   */

  useEffect(() => {
    if (!invoice) {
      return;
    }

    if (initializedInvoiceId === invoice.id) {
      return;
    }

    setPaymentAmount(
      normalizeAmountForInput(
        invoice.balance_due,
      ),
    );

    setInitializedInvoiceId(invoice.id);
  }, [
    invoice,
    initializedInvoiceId,
  ]);

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (isLoading) {
    return <InvoicePaySkeleton />;
  }

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (isError || !invoice) {
    return (
      <InvoicePayError
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  /*
   * ============================================================
   * PAYABLE CHECK
   * ============================================================
   */

  const payable =
    isInvoicePayable(invoice);

  if (!payable) {
    return (
      <InvoiceNotPayable
        invoice={invoice}
      />
    );
  }

  /*
   * ============================================================
   * CURRENT BALANCE
   * ============================================================
   */

  const balanceDue =
    parseMoney(
      invoice.balance_due,
    );

  /*
   * ============================================================
   * SELECTED PAYMENT AMOUNT
   * ============================================================
   */

  const selectedAmount =
    parseMoney(
      paymentAmount,
    );

  /*
   * ============================================================
   * FRONTEND VALIDATION
   * ============================================================
   *
   * This is only for user experience.
   *
   * Backend MUST perform the same validation against the
   * CURRENT invoice balance.
   */

  const amountValidation =
    validatePaymentAmount(
      paymentAmount,
      balanceDue,
    );

  const isAmountValid =
    amountValidation.isValid;

  /*
   * ============================================================
   * REMAINING BALANCE
   * ============================================================
   */

  const remainingAfterPayment =
    isAmountValid
      ? Math.max(
          0,
          balanceDue - selectedAmount,
        )
      : null;

  /*
   * ============================================================
   * FULL / PARTIAL PAYMENT
   * ============================================================
   */

  const isFullPayment =
    isAmountValid &&
    selectedAmount === balanceDue;

  const isPartialPayment =
    isAmountValid &&
    selectedAmount > 0 &&
    selectedAmount < balanceDue;

  /*
   * ============================================================
   * CONTINUE BUTTON
   * ============================================================
   */

  const canContinue =
    isAmountValid &&
    balanceDue > 0 &&
    !initializeChapaPayment.isPending;

  /*
   * ============================================================
   * PAYMENT INITIALIZATION
   * ============================================================
   */

  const handlePayment = async () => {
    /*
     * Clear previous error.
     */
    setPaymentError(null);

    /*
     * Never submit invalid frontend data.
     */
    if (!amountValidation.isValid) {
      setPaymentError(
        amountValidation.message ??
          "Please enter a valid payment amount.",
      );

      return;
    }

    /*
     * Never initialize if the invoice no longer has
     * a payable balance according to the currently loaded
     * invoice.
     */
    if (balanceDue <= 0) {
      setPaymentError(
        "This invoice has no outstanding balance.",
      );

      return;
    }

    /*
     * Prevent duplicate submissions.
     */
    if (
      initializeChapaPayment.isPending
    ) {
      return;
    }

    try {
      /*
       * IMPORTANT:
       *
       * paymentAmount is a request from the taxpayer.
       *
       * Laravel MUST reload the invoice and validate the
       * CURRENT balance before creating the payment.
       */
      const response =
      await initializeChapaPayment.mutateAsync({
        invoice_id: invoice.id,
        amount: selectedAmount,
        payment_method: paymentMethod,
        payment_provider:"CHAPA",
      });

      /*
       * The initialization response should contain the
       * provider checkout URL.
       *
       * Example:
       *
       * response.data.checkoutUrl
       */
      const checkoutUrl =
        response?.data?.checkoutUrl;

      if (!checkoutUrl) {
        setPaymentError(
          "The payment service did not return a checkout URL. Please try again.",
        );

        return;
      }

      /*
       * Redirect the taxpayer to the provider.
       *
       * Do NOT mark the payment as successful here.
       *
       * Chapa must complete the transaction and Laravel
       * must verify the result.
       */
      window.location.assign(
        checkoutUrl,
      );
    } catch (error) {
      /*
       * normalizeApiError() from the service should already
       * convert the backend error into a usable Error object.
       */
      const message =
        error instanceof Error
          ? error.message
          : "Unable to initialize the payment. Please try again.";

      setPaymentError(message);
    }
  };

  return (
    <div className="min-w-0">
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* ============================================================ */}
        {/* HEADER                                                       */}
        {/* ============================================================ */}

        <header>
          <div className="flex items-start gap-3">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="mt-0.5 shrink-0"
              disabled={
                initializeChapaPayment.isPending
              }
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

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Pay invoice
                </h1>

                <InvoiceStatusBadge
                  invoice={invoice}
                />
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Make a full or partial payment for{" "}
                <span className="font-medium text-foreground">
                  {invoice.invoice_number}
                </span>
              </p>
            </div>

            {isFetching && (
              <span
                className="ml-auto shrink-0 text-xs text-muted-foreground"
                aria-live="polite"
              >
                Updating...
              </span>
            )}
          </div>
        </header>

        {/* ============================================================ */}
        {/* PAYMENT LAYOUT                                               */}
        {/* ============================================================ */}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            {/* ======================================================== */}
            {/* PAYMENT AMOUNT                                           */}
            {/* ======================================================== */}

            <PaymentAmountCard
              invoice={invoice}
              paymentAmount={paymentAmount}
              balanceDue={balanceDue}
              amountValidation={
                amountValidation
              }
              isFullPayment={
                isFullPayment
              }
              isPartialPayment={
                isPartialPayment
              }
              remainingAfterPayment={
                remainingAfterPayment
              }
              onPaymentAmountChange={
                (value) => {
                  setPaymentError(null);
                  setPaymentAmount(value);
                }
              }
            />

            {/* ======================================================== */}
            {/* PAYMENT METHOD                                           */}
            {/* ======================================================== */}

            <PaymentMethodCard />

            {/* ======================================================== */}
            {/* SECURITY                                                 */}
            {/* ======================================================== */}

            <SecurityNote />

            {/* ======================================================== */}
            {/* PAYMENT ERROR                                            */}
            {/* ======================================================== */}

            {paymentError && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 p-4"
                role="alert"
              >
                <p className="text-sm font-medium text-red-800">
                  Payment could not be started
                </p>

                <p className="mt-1 text-xs leading-5 text-red-700">
                  {paymentError}
                </p>
              </div>
            )}

            {/* ======================================================== */}
            {/* PAYMENT ACTION                                           */}
            {/* ======================================================== */}

            <PaymentActions
              invoice={invoice}
              paymentAmount={
                paymentAmount
              }
              paymentMethod={
                paymentMethod
              }
              disabled={
                !canContinue
              }
              isPending={
                initializeChapaPayment.isPending
              }
              onContinue={
                handlePayment
              }
            />

            <p className="text-center text-xs leading-5 text-muted-foreground">
              You will be redirected to Chapa to
              complete the transaction securely.
            </p>
          </div>

          {/* ========================================================== */}
          {/* INVOICE SUMMARY                                            */}
          {/* ========================================================== */}

          <InvoicePaymentSummary
            invoice={invoice}
          />
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
 * Payment amount
 * ========================================================================== */

function PaymentAmountCard({
  invoice,
  paymentAmount,
  balanceDue,
  amountValidation,
  isFullPayment,
  isPartialPayment,
  remainingAfterPayment,
  onPaymentAmountChange,
}: {
  invoice: TaxpayerInvoice;
  paymentAmount: string;
  balanceDue: number;
  amountValidation: PaymentAmountValidation;
  isFullPayment: boolean;
  isPartialPayment: boolean;
  remainingAfterPayment: number | null;
  onPaymentAmountChange: (
    value: string,
  ) => void;
}) {
  const hasInput =
    paymentAmount.length > 0;

  const setFullBalance = () => {
    onPaymentAmountChange(
      normalizeAmountForInput(
        invoice.balance_due,
      ),
    );
  };

  const handleAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value =
      event.target.value;

    /*
     * Allow the user to clear the field.
     */
    if (value === "") {
      onPaymentAmountChange("");
      return;
    }

    /*
     * Allow:
     *
     * 123
     * 123.
     * 123.4
     * 123.45
     *
     * Maximum two decimal places.
     */
    if (!/^\d*\.?\d{0,2}$/.test(value)) {
      return;
    }

    /*
     * Prevent unnecessary leading zeros.
     *
     * Preserve:
     *
     * 0.
     */
    if (
      value.length > 1 &&
      value.startsWith("0") &&
      !value.startsWith("0.")
    ) {
      const normalized =
        value.replace(/^0+/, "");

      onPaymentAmountChange(
        normalized === ""
          ? "0"
          : normalized,
      );

      return;
    }

    onPaymentAmountChange(value);
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">
          Payment amount
        </CardTitle>

        <p className="text-xs text-muted-foreground">
          Pay the full balance or choose a
          smaller amount for a partial payment.
        </p>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {/* ========================================================== */}
        {/* CURRENT BALANCE                                            */}
        {/* ========================================================== */}

        <div className="rounded-xl border bg-muted/30 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Current balance due
              </p>

              <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
                {formatMoney(
                  invoice.currency,
                  invoice.balance_due,
                )}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Maximum amount that can be paid now
              </p>
            </div>

            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background">
              <CreditCard className="size-5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* AMOUNT INPUT                                               */}
        {/* ========================================================== */}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="payment-amount">
              Amount to pay
            </Label>

            <button
              type="button"
              onClick={
                setFullBalance
              }
              disabled={
                balanceDue <= 0 ||
                !invoice.is_fully_paid === false
              }
              className="text-xs font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
            >
              Pay full balance
            </button>
          </div>

          <div className="relative">
            <Input
              id="payment-amount"
              name="payment_amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={paymentAmount}
              onChange={
                handleAmountChange
              }
              placeholder="0.00"
              disabled={false}
              className={[
                "h-12 pr-16 text-right text-lg font-semibold tabular-nums",
                hasInput &&
                !amountValidation.isValid
                  ? "border-red-500 focus-visible:ring-red-500"
                  : "",
              ].join(" ")}
              aria-invalid={
                hasInput &&
                !amountValidation.isValid
              }
              aria-describedby="payment-amount-help payment-amount-error"
            />

            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-muted-foreground">
              {invoice.currency}
            </span>
          </div>

          {/* ======================================================== */}
          {/* VALIDATION                                               */}
          {/* ======================================================== */}

          {hasInput &&
            !amountValidation.isValid && (
              <p
                id="payment-amount-error"
                className="text-xs font-medium text-red-600"
                role="alert"
              >
                {
                  amountValidation.message
                }
              </p>
            )}

          {/* ======================================================== */}
          {/* PARTIAL PAYMENT                                          */}
          {/* ======================================================== */}

          {isPartialPayment &&
            remainingAfterPayment !==
              null && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-blue-800">
                      Partial payment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      This payment will reduce
                      your outstanding balance.
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[11px] text-blue-700">
                      Remaining
                    </p>

                    <p className="text-sm font-bold tabular-nums text-blue-800">
                      {formatMoney(
                        invoice.currency,
                        remainingAfterPayment,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* ======================================================== */}
          {/* FULL PAYMENT                                             */}
          {/* ======================================================== */}

          {isFullPayment && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-700" />

                <div>
                  <p className="text-xs font-semibold text-green-800">
                    Full payment
                  </p>

                  <p className="mt-1 text-xs leading-5 text-green-700">
                    This payment will clear the
                    remaining invoice balance.
                  </p>
                </div>
              </div>
            </div>
          )}

          <p
            id="payment-amount-help"
            className="text-xs leading-5 text-muted-foreground"
          >
            Enter any amount from 0.01 up to
            your current balance of{" "}
            {formatMoney(
              invoice.currency,
              balanceDue,
            )}
            .
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ==========================================================================
 * Payment methods
 * ========================================================================== */

function PaymentMethodCard() {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">
          Online payment method
        </CardTitle>

        <p className="text-xs text-muted-foreground">
          Select how you want to complete this
          payment.
        </p>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="space-y-3">
          <PaymentMethodOption
            title="Chapa"
            description="Pay securely online through Chapa's supported payment options."
            icon={
              <CreditCard className="size-4" />
            }
            badge="Online"
            selected
          />
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentMethodOption({
  title,
  description,
  icon,
  badge,
  selected,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  selected: boolean;
}) {
  return (
    <div
      className={[
        "flex items-start gap-3 rounded-xl border p-4 transition-colors",
        selected
          ? "border-foreground/30 bg-muted/30"
          : "",
      ].join(" ")}
    >
      <div className="mt-1 flex size-4 shrink-0 items-center justify-center">
        <span
          className={[
            "size-3 rounded-full border-4",
            selected
              ? "border-foreground"
              : "border-muted-foreground/40",
          ].join(" ")}
        />
      </div>

      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">
            {title}
          </p>

          {badge && (
            <Badge
              variant="secondary"
              className="text-[10px]"
            >
              {badge}
            </Badge>
          )}
        </div>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ==========================================================================
 * Invoice summary
 * ========================================================================== */

function InvoicePaymentSummary({
  invoice,
}: {
  invoice: TaxpayerInvoice;
}) {
  return (
    <Card className="h-fit lg:sticky lg:top-6">
      <CardHeader className="border-b">
        <CardTitle className="text-base">
          Invoice summary
        </CardTitle>

        <p className="text-xs text-muted-foreground">
          Key information for this payment.
        </p>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        <SummaryRow
          label="Invoice"
          value={
            invoice.invoice_number
          }
        />

        <SummaryRow
          label="Issued"
          value={formatDate(
            invoice.issued_at,
          )}
        />

        <SummaryRow
          label="Due date"
          value={formatDate(
            invoice.due_date,
          )}
        />

        <div className="border-t pt-4">
          <SummaryRow
            label="Invoice total"
            value={formatMoney(
              invoice.currency,
              invoice.total_amount,
            )}
          />

          <div className="mt-3">
            <SummaryRow
              label="Already paid"
              value={formatMoney(
                invoice.currency,
                invoice.paid_amount,
              )}
            />
          </div>

          <div className="mt-3">
            <SummaryRow
              label="Balance due"
              value={formatMoney(
                invoice.currency,
                invoice.balance_due,
              )}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-muted/40 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">
                Current balance
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Maximum payable amount
              </p>
            </div>

            <span className="text-lg font-bold tabular-nums">
              {formatMoney(
                invoice.currency,
                invoice.balance_due,
              )}
            </span>
          </div>
        </div>

        {invoice.is_overdue && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs font-medium text-red-800">
              This invoice is overdue.
            </p>

            <p className="mt-1 text-xs leading-5 text-red-700">
              Any applicable penalty or
              interest is already reflected
              in the invoice balance.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ==========================================================================
 * Security
 * ========================================================================== */

function SecurityNote() {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/20 p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <ShieldCheck className="size-4 text-muted-foreground" />
      </div>

      <div>
        <p className="text-sm font-medium">
          Secure online payment
        </p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Your payment will be processed
          through the selected payment provider.
          The municipality will verify the
          transaction before updating your
          invoice.
        </p>
      </div>
    </div>
  );
}

/* ==========================================================================
 * Actions
 * ========================================================================== */

function PaymentActions({
  invoice,
  paymentAmount,
  paymentMethod,
  disabled,
  isPending,
  onContinue,
}: {
  invoice: TaxpayerInvoice;
  paymentAmount: string;
  paymentMethod: PaymentMethod;
  disabled: boolean;
  isPending: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
      <Button
        asChild
        variant="outline"
        disabled={isPending}
      >
        <Link
          href={`/citizen/dashboard/invoices/${invoice.id}`}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to invoice
        </Link>
      </Button>

      <Button
        size="lg"
        className="h-11 sm:min-w-48"
        type="button"
        disabled={disabled}
        onClick={onContinue}
      >
        {isPending ? (
          <>
            <span className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Starting payment...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 size-4" />
            Continue to payment
          </>
        )}
      </Button>
    </div>
  );
}

/* ==========================================================================
 * Not payable
 * ========================================================================== */

function InvoiceNotPayable({
  invoice,
}: {
  invoice: TaxpayerInvoice;
}) {
  const isPaid =
    invoice.is_fully_paid;

  const isCancelled =
    invoice.status === "CANCELLED";

  return (
    <div className="min-w-0">
      <div className="mx-auto flex min-h-[600px] w-full max-w-2xl items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              {isPaid ? (
                <CheckCircle2 className="size-6 text-muted-foreground" />
              ) : (
                <FileText className="size-6 text-muted-foreground" />
              )}
            </div>

            <h1 className="mt-5 text-xl font-semibold">
              {isPaid
                ? "Invoice already paid"
                : isCancelled
                  ? "Invoice cancelled"
                  : "Invoice cannot be paid"}
            </h1>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {isPaid
                ? `Invoice ${invoice.invoice_number} has no remaining balance.`
                : isCancelled
                  ? `Invoice ${invoice.invoice_number} has been cancelled and cannot be paid.`
                  : `Invoice ${invoice.invoice_number} is not currently available for online payment.`}
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <Link
                  href={`/citizen/dashboard/invoices/${invoice.id}`}
                >
                  <FileText className="mr-2 size-4" />
                  View invoice
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
              >
                <Link href="/citizen/dashboard/invoices">
                  Back to invoices
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ==========================================================================
 * Status
 * ========================================================================== */

function InvoiceStatusBadge({
  invoice,
}: {
  invoice: TaxpayerInvoice;
}) {
  const status =
    getDisplayStatus(invoice);

  const config: Record<
    string,
    {
      label: string;
      className?: string;
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
        "border-muted bg-muted text-muted-foreground",
    },
  };

  const current =
    config[status] ?? {
      label: formatStatus(status),
    };

  return (
    <Badge
      variant="outline"
      className={current.className}
    >
      {current.label}
    </Badge>
  );
}

/* ==========================================================================
 * Shared UI helpers
 * ========================================================================== */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span className="max-w-[60%] truncate text-right text-sm font-medium tabular-nums">
        {value}
      </span>
    </div>
  );
}

/* ==========================================================================
 * Payment validation
 * ========================================================================== */

interface PaymentAmountValidation {
  isValid: boolean;
  message: string | null;
}

function validatePaymentAmount(
  value: string,
  balanceDue: number,
): PaymentAmountValidation {
  if (value.trim() === "") {
    return {
      isValid: false,
      message:
        "Enter an amount to pay.",
    };
  }

  if (
    !/^\d+(\.\d{1,2})?$/.test(value)
  ) {
    return {
      isValid: false,
      message:
        "Enter a valid amount with up to two decimal places.",
    };
  }

  const amount =
    Number(value);

  if (!Number.isFinite(amount)) {
    return {
      isValid: false,
      message:
        "Enter a valid payment amount.",
    };
  }

  if (amount <= 0) {
    return {
      isValid: false,
      message:
        "Payment amount must be greater than 0.00.",
    };
  }

  if (balanceDue <= 0) {
    return {
      isValid: false,
      message:
        "This invoice has no outstanding balance.",
    };
  }

  if (amount > balanceDue) {
    return {
      isValid: false,
      message:
        `Payment cannot exceed the current balance of ${formatAmount(
          balanceDue,
        )}.`,
    };
  }

  return {
    isValid: true,
    message: null,
  };
}

/* ==========================================================================
 * Business logic
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

/* ==========================================================================
 * Money helpers
 * ========================================================================== */

function parseMoney(
  value:
    | string
    | number
    | null
    | undefined,
): number {
  if (
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  const parsed =
    Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return (
    Math.round(
      parsed * 100,
    ) / 100
  );
}

function normalizeAmountForInput(
  value: string | number,
): string {
  const amount =
    parseMoney(value);

  return amount.toFixed(2);
}

function formatMoney(
  currency: string,
  value: string | number,
): string {
  return `${currency} ${formatAmount(
    value,
  )}`;
}

function formatAmount(
  value: string | number,
): string {
  const amount =
    Number(value);

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

/* ==========================================================================
 * Date helpers
 * ========================================================================== */

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "—";
  }

  const date =
    /^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
      ? new Date(
          `${value}T00:00:00`,
        )
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

/* ==========================================================================
 * Status formatting
 * ========================================================================== */

function formatStatus(
  value: string,
): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

/* ==========================================================================
 * Loading
 * ========================================================================== */

function InvoicePaySkeleton() {
  return (
    <div className="min-w-0 animate-pulse">
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-md bg-muted" />

          <div className="space-y-2">
            <div className="h-7 w-40 rounded bg-muted" />
            <div className="h-4 w-72 rounded bg-muted" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-5 p-6">
                <div className="h-5 w-32 rounded bg-muted" />
                <div className="h-24 w-full rounded-xl bg-muted" />
                <div className="h-5 w-28 rounded bg-muted" />
                <div className="h-12 w-full rounded bg-muted" />
                <div className="h-10 w-full rounded-lg bg-muted" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="h-5 w-40 rounded bg-muted" />
                <div className="h-16 w-full rounded-xl bg-muted" />
              </CardContent>
            </Card>

            <div className="h-20 w-full rounded-xl bg-muted" />
            <div className="h-11 w-full rounded bg-muted" />
          </div>

          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="h-5 w-32 rounded bg-muted" />

              {[1, 2, 3, 4, 5].map(
                (item) => (
                  <div
                    key={item}
                    className="h-5 w-full rounded bg-muted"
                  />
                ),
              )}

              <div className="h-16 w-full rounded-xl bg-muted" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
 * Error
 * ========================================================================== */

function InvoicePayError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[500px] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center px-6 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <FileText className="size-6 text-muted-foreground" />
          </div>

          <h2 className="mt-4 text-lg font-semibold">
            Unable to load invoice
          </h2>

          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            We could not load the invoice
            payment information. Please try
            again.
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button onClick={onRetry}>
              Try again
            </Button>

            <Button
              asChild
              variant="outline"
            >
              <Link href="/citizen/dashboard/invoices">
                Back to invoices
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}