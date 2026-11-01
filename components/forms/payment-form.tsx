"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  UserRound,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useInvoice } from "@/hooks/invoice/useInvoice.hook";
import { useCreateCashPayment } from "@/hooks/payment/payment.hook";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type UnknownRecord = Record<string, unknown>;

type InvoiceView = {
  id: string;
  invoiceNumber: string;
  taxpayerName: string;
  taxpayerTin: string;
  taxpayerPhone: string;
  assessmentNumber: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  issueDate: string;
  dueDate: string;
};

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/

type PaymentFormProps = {
  initialInvoiceId: string;
  onCancel?: () => void;
  onSuccess?: () => void;
};

/*
|--------------------------------------------------------------------------
| Safe Object Helpers
|--------------------------------------------------------------------------
*/

function isRecord(value: unknown): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getRecord(
  value: unknown,
): UnknownRecord | null {
  return isRecord(value) ? value : null;
}

function getString(
  value: unknown,
  fallback = "",
): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function getNumber(
  value: unknown,
  fallback = 0,
): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

/*
|--------------------------------------------------------------------------
| Formatting Helpers
|--------------------------------------------------------------------------
*/

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

/*
|--------------------------------------------------------------------------
| Invoice Normalizer
|--------------------------------------------------------------------------
*/

const normalizeInvoice = (
  raw: UnknownRecord,
): InvoiceView => {
  const citizen = getRecord(raw.citizen);
  const financial = getRecord(raw.financial);
  const dates = getRecord(raw.dates);
  const assessment = getRecord(raw.assessment);

  const citizenName = getString(citizen?.name).trim();

  return {
    id: getString(raw.id),

    invoiceNumber: getString(raw.invoice_number),

    taxpayerName: citizenName || "Unnamed taxpayer",

    taxpayerTin: getString(
      citizen?.tin ?? citizen?.taxpayer_tin,
    ),

    taxpayerPhone: getString(citizen?.phone),

    assessmentNumber: getString(
      assessment?.assessment_number ?? assessment?.number,
    ),

    totalAmount: getNumber(financial?.total_amount),

    paidAmount: getNumber(financial?.paid_amount),

    outstandingAmount: getNumber(financial?.balance_due),

    issueDate: getString(dates?.issued_at),

    dueDate: getString(dates?.due_date),
  };
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export function PaymentForm({
  initialInvoiceId,
  onCancel,
  onSuccess,
}: PaymentFormProps) {
  const invoiceId = initialInvoiceId.trim();

  return (
    <PaymentFormContent
      key={invoiceId}
      invoiceId={invoiceId}
      onCancel={onCancel}
      onSuccess={onSuccess}
    />
  );
}

/*
|--------------------------------------------------------------------------
| Payment Form Content
|--------------------------------------------------------------------------
*/

function PaymentFormContent({
  invoiceId,
  onCancel,
  onSuccess,
}: {
  invoiceId: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  /*
  |--------------------------------------------------------------------------
  | Load Invoice
  |--------------------------------------------------------------------------
  */

  const {
    data: invoiceResponse,
    isLoading: isLoadingInvoice,
    isError: isInvoiceError,
    error: invoiceError,
  } = useInvoice(invoiceId, Boolean(invoiceId));

  /*
  |--------------------------------------------------------------------------
  | Create Cash Payment
  |--------------------------------------------------------------------------
  */

  const createCashPayment = useCreateCashPayment();

  /*
  |--------------------------------------------------------------------------
  | Resolve Invoice
  |--------------------------------------------------------------------------
  */

  const selectedInvoice = useMemo(() => {
    const response = getRecord(invoiceResponse);
    const rawInvoice = getRecord(response?.data);

    if (!rawInvoice) {
      return null;
    }

    const id = getString(rawInvoice.id);

    if (!id) {
      return null;
    }

    return normalizeInvoice(rawInvoice);
  }, [invoiceResponse]);

  /*
  |--------------------------------------------------------------------------
  | Payment State
  |--------------------------------------------------------------------------
  |
  | null means the amount has not been initialized by the user.
  | In that case, the invoice outstanding balance is used as the default.
  | An empty string means the user intentionally cleared the input.
  |--------------------------------------------------------------------------
  */

  const [amount, setAmount] = useState<string | null>(null);

  const [notes, setNotes] = useState("");

  const [showConfirmation, setShowConfirmation] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Invoice Details
  |--------------------------------------------------------------------------
  */

  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Derived Amount
  |--------------------------------------------------------------------------
  */

  const amountValue =
    amount ??
    (selectedInvoice
      ? selectedInvoice.outstandingAmount.toFixed(2)
      : "");

  /*
  |--------------------------------------------------------------------------
  | Derived Values
  |--------------------------------------------------------------------------
  */

  const maxAmount = selectedInvoice?.outstandingAmount ?? 0;

  const numericAmount =
    amountValue === "" ? 0 : Number(amountValue);

  const amountError =
    numericAmount > maxAmount
      ? `Payment amount cannot exceed ${formatCurrency(maxAmount)} ETB.`
      : numericAmount <= 0 && amountValue !== ""
        ? "Payment amount must be greater than zero."
        : "";

  const remainingBalance = Math.max(
    maxAmount - numericAmount,
    0,
  );

  const isFullSettlement =
    Boolean(selectedInvoice) &&
    numericAmount === maxAmount &&
    numericAmount > 0;

  const isValid =
    Boolean(selectedInvoice) &&
    selectedInvoice!.id === invoiceId &&
    maxAmount > 0 &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    numericAmount <= maxAmount &&
    !amountError;

  /*
  |--------------------------------------------------------------------------
  | Amount Change
  |--------------------------------------------------------------------------
  */

  const handleAmountChange = (value: string) => {
    if (value === "") {
      setAmount("");
      return;
    }

    if (!/^\d*\.?\d{0,2}$/.test(value)) {
      return;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      return;
    }

    setAmount(value);
  };

  /*
  |--------------------------------------------------------------------------
  | Collect Full Balance
  |--------------------------------------------------------------------------
  */

  const handlePayFullAmount = () => {
    if (!selectedInvoice) {
      return;
    }

    setAmount(selectedInvoice.outstandingAmount.toFixed(2));
  };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValid) {
      return;
    }

    setShowConfirmation(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Confirm Payment
  |--------------------------------------------------------------------------
  */

  const handleConfirmPayment = async () => {
    if (!isValid || !selectedInvoice) {
      return;
    }

    try {
      /*
      |--------------------------------------------------------------------------
      | Backend determines:
      |
      | received_by    = authenticated user
      | payment_method = CASH
      | payment_date   = now()
      |--------------------------------------------------------------------------
      */

      await createCashPayment.mutateAsync({
        invoice_id: selectedInvoice.id,
        amount: numericAmount,
        metadata: {
          notes: notes.trim() || null,
        },
      });

      setShowConfirmation(false);

      onSuccess?.();
    } catch {
      /*
      |--------------------------------------------------------------------------
      | Error is exposed through:
      |
      | createCashPayment.error
      |--------------------------------------------------------------------------
      */
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (isLoadingInvoice) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />

            <div>
              <p className="text-sm font-medium">
                Loading invoice...
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Retrieving invoice details before creating the payment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Missing Invoice ID
  |--------------------------------------------------------------------------
  */

  if (!invoiceId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />

        <AlertTitle>Invoice is required</AlertTitle>

        <AlertDescription>
          This page must be opened with an invoice ID.
        </AlertDescription>
      </Alert>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Invoice Error
  |--------------------------------------------------------------------------
  */

  if (isInvoiceError || !selectedInvoice) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />

          <AlertTitle>Unable to load invoice</AlertTitle>

          <AlertDescription>
            {invoiceError instanceof Error
              ? invoiceError.message
              : "The invoice could not be loaded. Please try again."}
          </AlertDescription>
        </Alert>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Go Back
        </Button>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Fully Paid
  |--------------------------------------------------------------------------
  */

  if (selectedInvoice.outstandingAmount <= 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-base font-semibold">
              Invoice is fully paid
            </h3>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Invoice{" "}
              <span className="font-medium text-foreground">
                {selectedInvoice.invoiceNumber}
              </span>{" "}
              has no outstanding balance. A new cash payment cannot be
              created against it.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-6"
              onClick={onCancel}
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* =========================================================
            INVOICE
        ========================================================= */}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Invoice
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="rounded-lg border">
              {/* COMPACT INVOICE SUMMARY */}

              <div className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Invoice
                      </p>

                      <p className="truncate font-semibold">
                        {selectedInvoice.invoiceNumber}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {selectedInvoice.taxpayerName}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-xs text-muted-foreground">
                      Outstanding
                    </p>

                    <p className="text-xl font-semibold tracking-tight">
                      {formatCurrency(selectedInvoice.outstandingAmount)}{" "}
                      <span className="text-sm font-medium">ETB</span>
                    </p>
                  </div>
                </div>

                {/* VIEW DETAILS */}

                <button
                  type="button"
                  onClick={() =>
                    setShowInvoiceDetails((current) => !current)
                  }
                  className="mt-4 flex w-full items-center justify-between border-t pt-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  aria-expanded={showInvoiceDetails}
                  aria-controls="invoice-details"
                >
                  <span>Invoice details</span>

                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      showInvoiceDetails ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* EXPANDED DETAILS */}

              {showInvoiceDetails && (
                <div
                  id="invoice-details"
                  className="border-t bg-muted/10 px-4 py-4"
                >
                  <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Taxpayer
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {selectedInvoice.taxpayerName}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Phone
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {selectedInvoice.taxpayerPhone || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        TIN
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {selectedInvoice.taxpayerTin || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Assessment
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {selectedInvoice.assessmentNumber || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Invoice date
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatDate(selectedInvoice.issueDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Due date
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatDate(selectedInvoice.dueDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Invoice total
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatCurrency(selectedInvoice.totalAmount)} ETB
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Already paid
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatCurrency(selectedInvoice.paidAmount)} ETB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* =========================================================
            PAYMENT
        ========================================================= */}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4" />
              Payment
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* PAYMENT METHOD */}

            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-sm font-medium">
                  Payment method
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Cash
                </p>
              </div>

              <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* AMOUNT */}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="amount">
                  Amount collected{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
                  onClick={handlePayFullAmount}
                  disabled={createCashPayment.isPending}
                >
                  Collect full balance
                </button>
              </div>

              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  max={maxAmount}
                  step="0.01"
                  inputMode="decimal"
                  value={amountValue}
                  onChange={(event) =>
                    handleAmountChange(event.target.value)
                  }
                  placeholder="0.00"
                  className="h-12 pr-16 text-lg font-semibold"
                  disabled={createCashPayment.isPending}
                />

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  ETB
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Outstanding balance</span>

                <span className="font-medium text-foreground">
                  {formatCurrency(maxAmount)} ETB
                </span>
              </div>

              {amountError && (
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle className="h-4 w-4" />

                  <AlertTitle>Invalid amount</AlertTitle>

                  <AlertDescription>
                    {amountError}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* REMAINING BALANCE */}

            <div className="flex items-center justify-between border-y py-4">
              <span className="text-sm text-muted-foreground">
                Remaining balance
              </span>

              <span className="text-lg font-semibold">
                {formatCurrency(remainingBalance)} ETB
              </span>
            </div>

            {/* SETTLEMENT STATUS */}

            {numericAmount > 0 && !amountError && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                <div>
                  <p className="text-sm font-medium">
                    {isFullSettlement
                      ? "Full settlement"
                      : "Partial payment"}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {isFullSettlement
                      ? "This payment will fully settle the invoice."
                      : "The remaining balance will stay payable."}
                  </p>
                </div>
              </div>
            )}

            {/* NOTES */}

            <div className="space-y-2">
              <Label htmlFor="notes">
                Collection notes
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (Optional)
                </span>
              </Label>

              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add relevant collection information..."
                rows={3}
                disabled={createCashPayment.isPending}
              />
            </div>

            {/* COLLECTOR */}

            <div className="flex items-center gap-3 border-t pt-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <UserRound className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Collected by
                </p>

                <p className="text-sm font-medium">
                  Current authenticated user
                </p>
              </div>
            </div>

            <p className="-mt-3 text-xs text-muted-foreground">
              The collector and collection time are recorded automatically
              for audit purposes.
            </p>

            {/* ERROR */}

            {createCashPayment.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />

                <AlertTitle>
                  Payment could not be created
                </AlertTitle>

                <AlertDescription>
                  {createCashPayment.error instanceof Error
                    ? createCashPayment.error.message
                    : "An error occurred while creating the cash payment. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            {/* ACTIONS */}

            <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="sm:min-w-28"
                onClick={onCancel}
                disabled={createCashPayment.isPending}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="sm:min-w-40"
                disabled={!isValid || createCashPayment.isPending}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Collect Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* =========================================================
          CONFIRMATION DIALOG
      ========================================================= */}

      <Dialog
        open={showConfirmation}
        onOpenChange={(open) => {
          if (!createCashPayment.isPending) {
            setShowConfirmation(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Confirm cash collection
            </DialogTitle>

            <DialogDescription>
              Review the collection before creating the payment record.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* BASIC INFORMATION */}

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">
                  Invoice
                </span>

                <span className="font-medium">
                  {selectedInvoice.invoiceNumber}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">
                  Taxpayer
                </span>

                <span className="text-right font-medium">
                  {selectedInvoice.taxpayerName}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">
                  Payment method
                </span>

                <span className="font-medium">
                  Cash
                </span>
              </div>
            </div>

            {/* AMOUNT */}

            <div className="rounded-lg bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">
                Amount collected
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {formatCurrency(numericAmount)}{" "}
                <span className="text-sm font-medium">ETB</span>
              </p>
            </div>

            {/* REMAINING */}

            <div className="flex items-center justify-between border-y py-3 text-sm">
              <span className="text-muted-foreground">
                Remaining after collection
              </span>

              <span className="font-semibold">
                {formatCurrency(remainingBalance)} ETB
              </span>
            </div>

            {/* NOTES */}

            {notes.trim() && (
              <div>
                <p className="text-xs text-muted-foreground">
                  Collection notes
                </p>

                <p className="mt-1 text-sm">
                  {notes.trim()}
                </p>
              </div>
            )}

            {/* AUDIT */}

            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

              <div>
                <p className="text-sm font-medium">
                  Collector and time are automatic
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  The system records the authenticated collector and the
                  payment time.
                </p>
              </div>
            </div>

            {/* CASH WARNING */}

            <Alert>
              <AlertCircle className="h-4 w-4" />

              <AlertTitle>
                Confirm cash received
              </AlertTitle>

              <AlertDescription>
                Confirm that the cash has physically been received from the
                taxpayer before creating this payment.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={createCashPayment.isPending}
            >
              Review Again
            </Button>

            <Button
              type="button"
              onClick={handleConfirmPayment}
              disabled={createCashPayment.isPending}
            >
              {createCashPayment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Payment...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Collection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
