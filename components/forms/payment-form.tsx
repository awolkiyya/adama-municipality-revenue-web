"use client";

import React, { useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronsUpDown,
  FileText,
  Loader2,
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER";

export type PaymentProvider =
  | "COMMERCIAL_BANK"
  | "OTHER";

export type Invoice = {
  id: string;
  invoiceNumber: string;
  taxpayerName: string;
  taxpayerTin: string;
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
  invoices?: Invoice[];
  initialInvoiceId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
};

/*
|--------------------------------------------------------------------------
| Mock Data
|--------------------------------------------------------------------------
|
| Remove this when invoices come from the API.
|
*/

const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "INV-2026-000125",
    taxpayerName: "Abebe Kebede",
    taxpayerTin: "0012345678",
    assessmentNumber: "ASM-2026-000098",
    totalAmount: 25000,
    paidAmount: 5000,
    outstandingAmount: 20000,
    issueDate: "2026-09-10",
    dueDate: "2026-09-30",
  },
  {
    id: "inv-002",
    invoiceNumber: "INV-2026-000126",
    taxpayerName: "Fatuma Ali",
    taxpayerTin: "0023456789",
    assessmentNumber: "ASM-2026-000099",
    totalAmount: 18000,
    paidAmount: 0,
    outstandingAmount: 18000,
    issueDate: "2026-09-11",
    dueDate: "2026-09-30",
  },
  {
    id: "inv-003",
    invoiceNumber: "INV-2026-000127",
    taxpayerName: "Mohammed Hassan",
    taxpayerTin: "0034567890",
    assessmentNumber: "ASM-2026-000100",
    totalAmount: 45000,
    paidAmount: 15000,
    outstandingAmount: 30000,
    issueDate: "2026-09-12",
    dueDate: "2026-10-05",
  },
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const getMethodIcon = (method: PaymentMethod) => {
  switch (method) {
    case "BANK_TRANSFER":
      return Building2;

    case "CASH":
    default:
      return Wallet;
  }
};

const getProviderLabel = (
  provider: PaymentProvider | "",
) => {
  switch (provider) {
    case "COMMERCIAL_BANK":
      return "Commercial Bank";

    case "OTHER":
      return "Other Bank";

    default:
      return "";
  }
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export function PaymentForm({
  invoices = MOCK_INVOICES,
  initialInvoiceId = "",
  onCancel,
  onSuccess,
}: PaymentFormProps) {
  /*
  |--------------------------------------------------------------------------
  | Invoice
  |--------------------------------------------------------------------------
  */

  const [invoiceId, setInvoiceId] =
    useState(initialInvoiceId);

  const [invoiceOpen, setInvoiceOpen] =
    useState(false);

  const selectedInvoice = useMemo(
    () =>
      invoices.find(
        (invoice) => invoice.id === invoiceId,
      ),
    [invoices, invoiceId],
  );

  /*
  |--------------------------------------------------------------------------
  | Payment State
  |--------------------------------------------------------------------------
  */

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("CASH");

  const [provider, setProvider] =
    useState<PaymentProvider | "">("");

  const [amount, setAmount] = useState("");

  const [transactionReference, setTransactionReference] =
    useState("");

  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Derived Values
  |--------------------------------------------------------------------------
  */

  const maxAmount =
    selectedInvoice?.outstandingAmount ?? 0;

  const numericAmount = Number(amount || 0);

  const amountError =
    numericAmount > maxAmount
      ? `Payment amount cannot exceed ${formatCurrency(
          maxAmount,
        )} ETB.`
      : "";

  const isBankTransfer =
    paymentMethod === "BANK_TRANSFER";

  const isValid =
    !!selectedInvoice &&
    numericAmount > 0 &&
    numericAmount <= maxAmount &&
    !!paymentDate &&
    (!isBankTransfer || !!provider) &&
    (!isBankTransfer ||
      !!transactionReference.trim());

  const MethodIcon = getMethodIcon(paymentMethod);

  /*
  |--------------------------------------------------------------------------
  | Invoice Change
  |--------------------------------------------------------------------------
  */

  const handleInvoiceChange = (
    value: string,
  ) => {
    setInvoiceId(value);

    const invoice = invoices.find(
      (item) => item.id === value,
    );

    if (invoice) {
      setAmount(
        invoice.outstandingAmount.toString(),
      );
    } else {
      setAmount("");
    }

    setInvoiceOpen(false);
  };

  /*
  |--------------------------------------------------------------------------
  | Payment Method Change
  |--------------------------------------------------------------------------
  */

  const handlePaymentMethodChange = (
    value: PaymentMethod,
  ) => {
    setPaymentMethod(value);

    /*
    |--------------------------------------------------------------------------
    | Clear bank-specific fields when switching
    | back to Cash.
    |--------------------------------------------------------------------------
    */

    setProvider("");
    setTransactionReference("");
  };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!isValid || !selectedInvoice) {
      return;
    }

    setIsSubmitting(true);

    try {
      /*
      |--------------------------------------------------------------------------
      | TODO: Replace with API request
      |--------------------------------------------------------------------------
      |
      | await paymentsApi.create({
      |   invoice_id: selectedInvoice.id,
      |   amount: numericAmount,
      |   payment_method: paymentMethod,
      |   payment_provider: provider || null,
      |   transaction_reference:
      |     transactionReference || null,
      |   payment_date: paymentDate,
      |   notes: notes || null,
      | });
      |
      */

      await new Promise((resolve) =>
        setTimeout(resolve, 1000),
      );

      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Invoice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Invoice
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="invoice">
                  Invoice{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </Label>

                <Popover
                  open={invoiceOpen}
                  onOpenChange={setInvoiceOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={invoiceOpen}
                      className="w-full justify-between font-normal"
                    >
                      {selectedInvoice ? (
                        <span className="truncate">
                          {
                            selectedInvoice.invoiceNumber
                          }{" "}
                          —{" "}
                          {
                            selectedInvoice.taxpayerName
                          }
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Search and select invoice
                        </span>
                      )}

                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent
                    align="start"
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                  >
                    <Command>
                      <CommandInput placeholder="Search invoice, taxpayer, or TIN..." />

                      <CommandList>
                        <CommandEmpty>
                          No invoice found.
                        </CommandEmpty>

                        <CommandGroup>
                          {invoices.map(
                            (invoice) => (
                              <CommandItem
                                key={invoice.id}
                                value={`${invoice.invoiceNumber} ${invoice.taxpayerName} ${invoice.taxpayerTin}`}
                                onSelect={() =>
                                  handleInvoiceChange(
                                    invoice.id,
                                  )
                                }
                              >
                                <div className="flex w-full flex-col gap-1">
                                  <span className="font-medium">
                                    {
                                      invoice.invoiceNumber
                                    }
                                  </span>

                                  <span className="text-xs text-muted-foreground">
                                    {
                                      invoice.taxpayerName
                                    }{" "}
                                    · TIN{" "}
                                    {
                                      invoice.taxpayerTin
                                    }
                                  </span>

                                  <span className="text-xs text-muted-foreground">
                                    Outstanding:{" "}
                                    {formatCurrency(
                                      invoice.outstandingAmount,
                                    )}{" "}
                                    ETB
                                  </span>
                                </div>
                              </CommandItem>
                            ),
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Selected Invoice */}
              {selectedInvoice && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Invoice
                      </p>

                      <p className="font-medium">
                        {
                          selectedInvoice.invoiceNumber
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Taxpayer
                      </p>

                      <p className="font-medium">
                        {
                          selectedInvoice.taxpayerName
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        TIN
                      </p>

                      <p className="font-medium">
                        {
                          selectedInvoice.taxpayerTin
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Assessment
                      </p>

                      <p className="font-medium">
                        {
                          selectedInvoice.assessmentNumber
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Invoice Total
                      </p>

                      <p className="font-medium">
                        {formatCurrency(
                          selectedInvoice.totalAmount,
                        )}{" "}
                        ETB
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Outstanding
                      </p>

                      <p className="font-semibold">
                        {formatCurrency(
                          selectedInvoice.outstandingAmount,
                        )}{" "}
                        ETB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MethodIcon className="h-4 w-4" />
                Payment Details
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Payment Amount{" "}
                    <span className="text-destructive">
                      *
                    </span>
                  </Label>

                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(event) =>
                        setAmount(
                          event.target.value,
                        )
                      }
                      placeholder="0.00"
                      disabled={!selectedInvoice}
                      className="pr-14"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ETB
                    </span>
                  </div>

                  {selectedInvoice && (
                    <p className="text-xs text-muted-foreground">
                      Maximum payable:{" "}
                      {formatCurrency(
                        maxAmount,
                      )}{" "}
                      ETB
                    </p>
                  )}

                  {amountError && (
                    <p className="text-sm text-destructive">
                      {amountError}
                    </p>
                  )}
                </div>

                {/* Payment Date */}
                <div className="space-y-2">
                  <Label htmlFor="payment-date">
                    Payment Date{" "}
                    <span className="text-destructive">
                      *
                    </span>
                  </Label>

                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="payment-date"
                      type="date"
                      value={paymentDate}
                      onChange={(event) =>
                        setPaymentDate(
                          event.target.value,
                        )
                      }
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="payment-method">
                  Payment Method{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </Label>

                <Select
                  value={paymentMethod}
                  onValueChange={(value) =>
                    handlePaymentMethodChange(
                      value as PaymentMethod,
                    )
                  }
                >
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="CASH">
                      Cash
                    </SelectItem>

                    <SelectItem value="BANK_TRANSFER">
                      Bank Transfer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bank Transfer Details */}
              {isBankTransfer && (
                <div className="grid gap-5 md:grid-cols-2">
                  {/* Bank */}
                  <div className="space-y-2">
                    <Label htmlFor="provider">
                      Bank{" "}
                      <span className="text-destructive">
                        *
                      </span>
                    </Label>

                    <Select
                      value={provider}
                      onValueChange={(value) =>
                        setProvider(
                          value as PaymentProvider,
                        )
                      }
                    >
                      <SelectTrigger id="provider">
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="COMMERCIAL_BANK">
                          Commercial Bank
                        </SelectItem>

                        <SelectItem value="OTHER">
                          Other Bank
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Transaction Reference */}
                  <div className="space-y-2">
                    <Label htmlFor="transaction-reference">
                      Transaction Reference{" "}
                      <span className="text-destructive">
                        *
                      </span>
                    </Label>

                    <Input
                      id="transaction-reference"
                      value={
                        transactionReference
                      }
                      onChange={(event) =>
                        setTransactionReference(
                          event.target.value,
                        )
                      }
                      placeholder="Enter bank transaction reference"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">
                  Notes
                </Label>

                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder="Add payment notes if necessary..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">
                Payment Summary
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              {selectedInvoice ? (
                <>
                  {/* Invoice */}
                  <div className="space-y-3">
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Invoice
                      </span>

                      <span className="font-medium">
                        {
                          selectedInvoice.invoiceNumber
                        }
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Taxpayer
                      </span>

                      <span className="text-right font-medium">
                        {
                          selectedInvoice.taxpayerName
                        }
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Outstanding
                      </span>

                      <span className="font-medium">
                        {formatCurrency(
                          maxAmount,
                        )}{" "}
                        ETB
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="border-t pt-4">
                    <div className="flex items-end justify-between gap-4">
                      <span className="text-sm text-muted-foreground">
                        Payment Amount
                      </span>

                      <span className="text-2xl font-semibold">
                        {formatCurrency(
                          numericAmount,
                        )}{" "}
                        ETB
                      </span>
                    </div>
                  </div>

                  {/* Method */}
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-2">
                      <MethodIcon className="h-4 w-4" />

                      <span className="text-sm font-medium">
                        {paymentMethod === "CASH"
                          ? "Cash"
                          : "Bank Transfer"}
                      </span>
                    </div>

                    {provider && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Bank:{" "}
                        {getProviderLabel(
                          provider,
                        )}
                      </p>
                    )}

                    {transactionReference && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Reference:{" "}
                        {transactionReference}
                      </p>
                    )}
                  </div>

                  {/* Full Settlement */}
                  {numericAmount > 0 &&
                    numericAmount ===
                      maxAmount && (
                      <div className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                        <span>
                          This payment will fully
                          settle the invoice.
                        </span>
                      </div>
                    )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={onCancel}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={
                        !isValid ||
                        isSubmitting
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Recording...
                        </>
                      ) : (
                        "Record Payment"
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

                  <p className="text-sm font-medium">
                    Select an invoice
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Select an invoice to start
                    recording the payment.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

