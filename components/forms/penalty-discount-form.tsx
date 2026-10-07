"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Search,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* =========================================================
 * TYPES
 * ======================================================= */

export type InvoiceStatus =
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "OVERDUE";

export type EligibleInvoice = {
  id: string;
  invoice_number: string;
  status: InvoiceStatus;

  citizen: {
    id: string;
    name: string;
    phone: string;
  };

  subtotal: number;
  penalty_amount: number;
  penalty_discount_amount: number;
  interest_amount: number;

  total_amount: number;
  paid_amount: number;
  balance_due: number;

  due_date: string;
};

export type PenaltyDiscountFormValues = {
  invoice_id: string;
  requested_amount: number;
  reason: string;
  supporting_file: File | null;
};

export type PenaltyDiscountFormMode =
  | "create"
  | "edit";

export type PenaltyDiscountInitialData = {
  invoice: EligibleInvoice;
  requested_amount: number;
  reason: string;
  supporting_file_name?: string | null;
};

/* =========================================================
 * PROPS
 * ======================================================= */

export type PenaltyDiscountFormProps = {
  mode?: PenaltyDiscountFormMode;

  /**
   * Eligible invoices supplied by the parent page.
   */
  invoices: EligibleInvoice[];

  /**
   * Invoice IDs that already have an active/pending
   * penalty discount request.
   *
   * In edit mode, the currently selected invoice is still
   * allowed.
   */
  blockedInvoiceIds?: string[];

  /**
   * Existing request data when editing.
   */
  initialData?: PenaltyDiscountInitialData | null;

  /**
   * Called when the user clicks Save Draft.
   */
  onSaveDraft?: (
    values: PenaltyDiscountFormValues,
  ) => Promise<void> | void;

  /**
   * Called when the user confirms Submit for Approval.
   */
  onSubmit?: (
    values: PenaltyDiscountFormValues,
  ) => Promise<void> | void;

  /**
   * Called when the user clicks Back/Cancel.
   */
  onCancel?: () => void;

  /**
   * Optional text override for the cancel button.
   */
  cancelLabel?: string;

  /**
   * Optional external loading state.
   */
  loading?: boolean;
};

/* =========================================================
 * HELPERS
 * ======================================================= */

export const getAvailablePenalty = (
  invoice: EligibleInvoice,
) =>
  Math.max(
    invoice.penalty_amount -
      invoice.penalty_discount_amount,
    0,
  );

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));

/* =========================================================
 * STATUS BADGE
 * ======================================================= */

function InvoiceStatusBadge({
  status,
}: {
  status: InvoiceStatus;
}) {
  const labels: Record<InvoiceStatus, string> = {
    ISSUED: "Issued",
    PARTIALLY_PAID: "Partially Paid",
    OVERDUE: "Overdue",
  };

  return (
    <Badge variant="outline">
      {labels[status]}
    </Badge>
  );
}

/* =========================================================
 * FORM
 * ======================================================= */

export default function PenaltyDiscountRequestForm({
  mode = "create",
  invoices,
  blockedInvoiceIds = [],
  initialData = null,
  onSaveDraft,
  onSubmit,
  onCancel,
  cancelLabel = "Cancel",
  loading = false,
}: PenaltyDiscountFormProps) {
  const isEdit = mode === "edit";

  /* =======================================================
   * INVOICE
   * ===================================================== */

  const [selectedInvoice, setSelectedInvoice] =
    useState<EligibleInvoice | null>(
      initialData?.invoice ?? null,
    );

  const [invoiceDialogOpen, setInvoiceDialogOpen] =
    useState(false);

  const [invoiceSearch, setInvoiceSearch] =
    useState("");

  /* =======================================================
   * FORM
   * ===================================================== */

  const [requestedAmount, setRequestedAmount] =
    useState(
      initialData?.requested_amount !== undefined
        ? String(initialData.requested_amount)
        : "",
    );

  const [reason, setReason] = useState(
    initialData?.reason ?? "",
  );

  /* =======================================================
   * FILE
   * ===================================================== */

  const [supportingFile, setSupportingFile] =
    useState<File | null>(null);

  const [existingFileName] = useState<
    string | null
  >(
    initialData?.supporting_file_name ?? null,
  );

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  /* =======================================================
   * UI
   * ======================================================= */

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [submitDialogOpen, setSubmitDialogOpen] =
    useState(false);

  const isBusy = saving || loading;

  /* =======================================================
   * FILTER INVOICES
   * ======================================================= */

  const filteredInvoices = useMemo(() => {
    const query = invoiceSearch
      .trim()
      .toLowerCase();

    return invoices.filter((invoice) => {
      const isCurrentInvoice =
        invoice.id === selectedInvoice?.id;

      const availablePenalty =
        getAvailablePenalty(invoice);

      const isBlocked =
        blockedInvoiceIds.includes(invoice.id);

      /*
       * The current invoice is allowed in edit mode even
       * if it is in blockedInvoiceIds.
       */
      if (
        availablePenalty <= 0 ||
        (isBlocked && !isCurrentInvoice)
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        invoice.invoice_number
          .toLowerCase()
          .includes(query) ||
        invoice.citizen.name
          .toLowerCase()
          .includes(query) ||
        invoice.citizen.phone
          .toLowerCase()
          .includes(query)
      );
    });
  }, [
    invoices,
    blockedInvoiceIds,
    invoiceSearch,
    selectedInvoice,
  ]);

  /* =======================================================
   * FINANCIAL VALUES
   * ======================================================= */

  const availablePenalty = selectedInvoice
    ? getAvailablePenalty(selectedInvoice)
    : 0;

  const amount = Number(
    requestedAmount || 0,
  );

  const amountTooHigh =
    !!selectedInvoice &&
    Number.isFinite(amount) &&
    amount > availablePenalty;

  const amountInvalid =
    !selectedInvoice ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amountTooHigh;

  const reasonInvalid =
    reason.trim().length < 10;

  const formValid =
    !!selectedInvoice &&
    !amountInvalid &&
    !reasonInvalid;

  /* =======================================================
   * SELECT INVOICE
   * ======================================================= */

  const handleSelectInvoice = (
    invoice: EligibleInvoice,
  ) => {
    const changed =
      invoice.id !== selectedInvoice?.id;

    setSelectedInvoice(invoice);

    /*
     * When changing the invoice, the previous amount
     * should not be carried to the new invoice.
     */
    if (changed) {
      setRequestedAmount("");
    }

    setError("");
    setInvoiceDialogOpen(false);
  };

  /* =======================================================
   * FILE
   * ======================================================= */

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setError("");

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only PDF, JPG, and PNG files are allowed.",
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "The supporting document must be 5 MB or smaller.",
      );

      event.target.value = "";
      return;
    }

    setSupportingFile(file);
  };

  const removeFile = () => {
    setSupportingFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =======================================================
   * VALIDATION
   * ======================================================= */

  const validateForm = () => {
    setError("");

    if (!selectedInvoice) {
      setError("Please select an invoice.");
      return false;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Please enter a valid discount amount.",
      );
      return false;
    }

    if (amount > availablePenalty) {
      setError(
        "The requested discount cannot exceed the available penalty.",
      );
      return false;
    }

    if (reason.trim().length < 10) {
      setError(
        "Please provide a justification of at least 10 characters.",
      );
      return false;
    }

    return true;
  };

  /* =======================================================
   * FORM VALUES
   * ======================================================= */

  const getFormValues =
    (): PenaltyDiscountFormValues => ({
      invoice_id: selectedInvoice!.id,
      requested_amount: amount,
      reason: reason.trim(),
      supporting_file: supportingFile,
    });

  /* =======================================================
   * SAVE DRAFT
   * ======================================================= */

  const handleSaveDraft = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const values = getFormValues();

      if (onSaveDraft) {
        await onSaveDraft(values);
      } else {
        /*
         * No handler supplied.
         *
         * This is intentionally not navigating anywhere.
         * The parent page owns navigation.
         */
        console.log(
          "Penalty Discount Draft",
          values,
        );
      }
    } catch (error) {
      console.error(error);

      setError(
        "Unable to save the request. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
   * OPEN SUBMIT
   * ======================================================= */

  const handleOpenSubmit = () => {
    if (!validateForm()) {
      return;
    }

    setSubmitDialogOpen(true);
  };

  /* =======================================================
   * CONFIRM SUBMIT
   * ======================================================= */

  const handleConfirmSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const values = getFormValues();

      if (onSubmit) {
        await onSubmit(values);
      } else {
        console.log(
          "Penalty Discount Request Submitted",
          values,
        );
      }

      setSubmitDialogOpen(false);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to submit the request. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
   * CANCEL
   * ======================================================= */

  const handleCancel = () => {
    if (isBusy) {
      return;
    }

    onCancel?.();
  };

  /* =======================================================
   * RENDER
   * ======================================================= */

  return (
    <div className="min-h-full p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* =================================================
         * HEADER
         * =============================================== */}

        <div className="space-y-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 w-fit"
            disabled={isBusy}
            onClick={handleCancel}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {isEdit
                ? "Edit Penalty Discount Request"
                : "Create Penalty Discount Request"}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {isEdit
                ? "Update the request details before submitting it for review."
                : "Request a reduction of the penalty on an outstanding invoice."}
            </p>
          </div>
        </div>

        {/* =================================================
         * ERROR
         * =============================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />

            <span className="text-destructive">
              {error}
            </span>
          </div>
        )}

        {/* =================================================
         * CONTENT
         * =============================================== */}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* =================================================
           * FORM CARD
           * =============================================== */}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Request Details
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* ---------------------------------------------
               * INVOICE
               * ------------------------------------------- */}

              <div className="space-y-2">
                <Label>
                  Invoice{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </Label>

                {!selectedInvoice ? (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      setInvoiceSearch("");
                      setInvoiceDialogOpen(true);
                    }}
                    className="flex w-full items-center justify-between rounded-md border px-3 py-3 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div>
                        <div className="text-sm font-medium">
                          Select an invoice
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Choose an eligible invoice
                        </div>
                      </div>
                    </div>

                    <Search className="h-4 w-4 text-muted-foreground" />
                  </button>
                ) : (
                  <div className="rounded-md border">
                    <div className="flex items-center justify-between gap-4 p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                          <FileText className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="font-medium">
                            {
                              selectedInvoice.invoice_number
                            }
                          </div>

                          <div className="truncate text-sm text-muted-foreground">
                            {
                              selectedInvoice.citizen
                                .name
                            }
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => {
                          setInvoiceSearch("");
                          setInvoiceDialogOpen(true);
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* ---------------------------------------------
               * INVOICE INFORMATION
               * ------------------------------------------- */}

              {selectedInvoice && (
                <div className="overflow-hidden rounded-lg border bg-muted/20">
                  <div className="grid sm:grid-cols-2">
                    <div className="p-4 sm:border-r">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Taxpayer
                      </div>

                      <div className="mt-2 font-medium">
                        {selectedInvoice.citizen.name}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {selectedInvoice.citizen.phone}
                      </div>
                    </div>

                    <div className="border-t p-4 sm:border-t-0">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Invoice Status
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <InvoiceStatusBadge
                          status={
                            selectedInvoice.status
                          }
                        />

                        <span className="text-xs text-muted-foreground">
                          Due{" "}
                          {formatDate(
                            selectedInvoice.due_date,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid border-t sm:grid-cols-3">
                    <div className="p-4 sm:border-r">
                      <div className="text-xs text-muted-foreground">
                        Penalty
                      </div>

                      <div className="mt-1 font-semibold">
                        {formatCurrency(
                          selectedInvoice.penalty_amount,
                        )}{" "}
                        ETB
                      </div>
                    </div>

                    <div className="border-t p-4 sm:border-t-0 sm:border-r">
                      <div className="text-xs text-muted-foreground">
                        Existing Discount
                      </div>

                      <div className="mt-1 font-semibold">
                        {formatCurrency(
                          selectedInvoice.penalty_discount_amount,
                        )}{" "}
                        ETB
                      </div>
                    </div>

                    <div className="border-t p-4 sm:border-t-0">
                      <div className="text-xs text-muted-foreground">
                        Available Penalty
                      </div>

                      <div className="mt-1 font-semibold">
                        {formatCurrency(
                          availablePenalty,
                        )}{" "}
                        ETB
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------
               * REQUESTED AMOUNT
               * ------------------------------------------- */}

              <div className="space-y-2">
                <Label htmlFor="requested-amount">
                  Requested Discount Amount{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </Label>

                <div className="relative">
                  <Input
                    id="requested-amount"
                    type="number"
                    min="0"
                    max={
                      selectedInvoice
                        ? availablePenalty
                        : undefined
                    }
                    step="0.01"
                    placeholder="0.00"
                    disabled={!selectedInvoice || isBusy}
                    value={requestedAmount}
                    onChange={(event) => {
                      setRequestedAmount(
                        event.target.value,
                      );
                      setError("");
                    }}
                    className="pr-14"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ETB
                  </span>
                </div>

                {selectedInvoice && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Maximum available
                    </span>

                    <span>
                      {formatCurrency(
                        availablePenalty,
                      )}{" "}
                      ETB
                    </span>
                  </div>
                )}

                {amountTooHigh && (
                  <p className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Amount cannot exceed the available
                    penalty.
                  </p>
                )}
              </div>

              {/* ---------------------------------------------
               * REASON
               * ------------------------------------------- */}

              <div className="space-y-2">
                <Label htmlFor="reason">
                  Reason / Justification{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </Label>

                <Textarea
                  id="reason"
                  value={reason}
                  disabled={!selectedInvoice || isBusy}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setError("");
                  }}
                  placeholder="Enter the reason for requesting the penalty discount..."
                  className="min-h-[130px] resize-none"
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Provide a clear administrative
                    justification.
                  </span>

                  <span>
                    {reason.trim().length} characters
                  </span>
                </div>
              </div>

              {/* ---------------------------------------------
               * SUPPORTING DOCUMENT
               * ------------------------------------------- */}

              <div className="space-y-2">
                <Label>
                  Supporting Document{" "}
                  <span className="text-muted-foreground">
                    (Optional)
                  </span>
                </Label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  disabled={isBusy}
                  onChange={handleFileChange}
                />

                {supportingFile ? (
                  <div className="flex items-center justify-between gap-4 rounded-md border px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <FileText className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {supportingFile.name}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {(
                            supportingFile.size /
                            1024 /
                            1024
                          ).toFixed(2)}{" "}
                          MB
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isBusy}
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : existingFileName ? (
                  <div className="flex items-center justify-between gap-4 rounded-md border px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <FileText className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {existingFileName}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Existing supporting document
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                    >
                      Replace
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={
                      !selectedInvoice || isBusy
                    }
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="flex w-full items-center gap-3 rounded-md border border-dashed px-4 py-4 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div>
                      <div className="text-sm font-medium">
                        Upload document
                      </div>

                      <div className="text-xs text-muted-foreground">
                        PDF, JPG or PNG · Maximum 5 MB
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* =================================================
           * SUMMARY
           * =============================================== */}

          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-base">
                Request Summary
              </CardTitle>
            </CardHeader>

            <CardContent>
              {!selectedInvoice ? (
                <div className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">
                  Select an invoice to review the
                  request.
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Invoice
                    </div>

                    <div className="mt-1 font-semibold">
                      {
                        selectedInvoice.invoice_number
                      }
                    </div>

                    <div className="mt-1 text-sm text-muted-foreground">
                      {selectedInvoice.citizen.name}
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Invoice balance
                      </span>

                      <span className="font-medium">
                        {formatCurrency(
                          selectedInvoice.balance_due,
                        )}{" "}
                        ETB
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Available penalty
                      </span>

                      <span className="font-medium">
                        {formatCurrency(
                          availablePenalty,
                        )}{" "}
                        ETB
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="text-xs text-muted-foreground">
                      Requested discount
                    </div>

                    <div className="mt-1 text-xl font-semibold">
                      {formatCurrency(amount)} ETB
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                    <span>
                      The requested discount must be
                      approved before it can be applied to
                      the invoice.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* =================================================
         * ACTIONS
         * =============================================== */}

        <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={handleCancel}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={!formValid || isBusy}
            onClick={handleSaveDraft}
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Save Draft"}
          </Button>

          <Button
            type="button"
            disabled={!formValid || isBusy}
            onClick={handleOpenSubmit}
          >
            {isEdit
              ? "Submit Changes"
              : "Submit for Approval"}
          </Button>
        </div>
      </div>

      {/* ===================================================
       * INVOICE SELECTOR
       * ================================================= */}

      <Dialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Select Invoice
            </DialogTitle>

            <DialogDescription>
              Choose an invoice with an available penalty.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              autoFocus
              value={invoiceSearch}
              onChange={(event) =>
                setInvoiceSearch(event.target.value)
              }
              placeholder="Search invoice, taxpayer, or phone..."
              className="pl-9"
            />
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto">
            {filteredInvoices.map((invoice) => {
              const available =
                getAvailablePenalty(invoice);

              const isSelected =
                invoice.id === selectedInvoice?.id;

              return (
                <button
                  key={invoice.id}
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    handleSelectInvoice(invoice)
                  }
                  className={`w-full rounded-md border p-4 text-left transition-colors hover:bg-muted/50 ${
                    isSelected
                      ? "border-primary bg-muted/40"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium">
                        {invoice.invoice_number}
                      </div>

                      <div className="mt-1 text-sm text-muted-foreground">
                        {invoice.citizen.name}
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        Due{" "}
                        {formatDate(
                          invoice.due_date,
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <InvoiceStatusBadge
                        status={invoice.status}
                      />

                      <div className="mt-2 font-semibold">
                        {formatCurrency(
                          available,
                        )}{" "}
                        ETB
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Available penalty
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredInvoices.length === 0 && (
              <div className="py-10 text-center">
                <Search className="mx-auto mb-3 h-5 w-5 text-muted-foreground" />

                <p className="font-medium">
                  No eligible invoices found
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Try another invoice number, taxpayer,
                  or phone number.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setInvoiceDialogOpen(false)
              }
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================================================
       * SUBMIT CONFIRMATION
       * ================================================= */}

      <Dialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEdit
                ? "Submit Changes?"
                : "Submit Request for Approval?"}
            </DialogTitle>

            <DialogDescription>
              {isEdit
                ? "The updated request will be sent for administrative review."
                : "Review the details before sending this request for administrative approval."}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
              <div>
                <div className="text-xs text-muted-foreground">
                  Invoice
                </div>

                <div className="mt-1 font-medium">
                  {selectedInvoice.invoice_number}
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm text-muted-foreground">
                  Requested discount
                </span>

                <span className="font-semibold">
                  {formatCurrency(amount)} ETB
                </span>
              </div>

              <div className="flex items-start gap-2 border-t pt-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                <p className="text-xs leading-5 text-muted-foreground">
                  The request will require approval before
                  the discount can be applied.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() =>
                setSubmitDialogOpen(false)
              }
            >
              Review
            </Button>

            <Button
              type="button"
              disabled={saving}
              onClick={handleConfirmSubmit}
            >
              {saving
                ? "Submitting..."
                : "Confirm & Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}