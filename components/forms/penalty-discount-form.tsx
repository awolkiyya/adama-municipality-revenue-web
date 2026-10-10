"use client";

import React, { useState } from "react";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Search,
  X,
  Loader2,
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

import { FileUpload } from "@/components/file-upload";

import type { Invoice } from "@/types/invoice/invoice";
import InvoiceSelectorDialog from "../dialogs/InvoiceSelectorDialog";

/* =========================================================
 * TYPES
 * ======================================================= */

export type InvoiceStatus =
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "OVERDUE";

export type EligibleInvoice = Invoice;

export type PenaltyDiscountFormValues = {
  invoice_id: string;
  requested_amount: number;
  reason: string;
  supporting_file: File | null;
};

export type PenaltyDiscountFormMode = "create" | "edit";

export type PenaltyDiscountInitialData = {
  invoice: EligibleInvoice;
  requested_amount: number;
  reason: string;
  supporting_file_name?: string | null;
};

export type PenaltyDiscountFormProps = {
  mode?: PenaltyDiscountFormMode;
  blockedInvoiceIds?: string[];
  initialData?: PenaltyDiscountInitialData | null;

  onSaveDraft?: (
    values: PenaltyDiscountFormValues,
  ) => Promise<void> | void;

  onSubmit?: (
    values: PenaltyDiscountFormValues,
  ) => Promise<void> | void;

  onCancel?: () => void;
  cancelLabel?: string;
  loading?: boolean;
};

/* =========================================================
 * CONSTANTS
 * ======================================================= */

const MIN_REASON_LENGTH = 10;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_FILE_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
] as const;

const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

/* =========================================================
 * HELPERS
 * ======================================================= */

export const getAvailablePenalty = (
  invoice: EligibleInvoice,
): number => {
  const penalty = Number(
    invoice.financial.penalty_amount ?? 0,
  );

  const existingDiscount = Number(
    invoice.financial.discount_amount ?? 0,
  );

  if (
    !Number.isFinite(penalty) ||
    !Number.isFinite(existingDiscount)
  ) {
    return 0;
  }

  return Math.max(penalty - existingDiscount, 0);
};

const formatCurrency = (
  value: number | string | null | undefined,
): string => {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("en-ET", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (
  value: string | null | undefined,
): string => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-ET", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
};

const validateSupportingFile = (
  file: File,
): string | null => {
  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase();

  if (
    !extension ||
    !ALLOWED_FILE_EXTENSIONS.includes(
      extension as (typeof ALLOWED_FILE_EXTENSIONS)[number],
    )
  ) {
    return "The supporting document must be a PDF, JPG, JPEG, or PNG file.";
  }

  if (file.size <= 0) {
    return "The selected supporting document is empty.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "The supporting document must not exceed 5 MB.";
  }

  if (
    file.type &&
    !ALLOWED_FILE_TYPES.has(file.type)
  ) {
    return "The selected file type is not supported.";
  }

  return null;
};

/* =========================================================
 * INVOICE STATUS BADGE
 * ======================================================= */

function InvoiceStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalizedStatus = status.toUpperCase();

  const labels: Record<string, string> = {
    ISSUED: "Issued",
    PARTIALLY_PAID: "Partially Paid",
    OVERDUE: "Overdue",
    PAID: "Paid",
    DRAFT: "Draft",
    CANCELLED: "Cancelled",
    VOID: "Void",
  };

  const styles: Record<string, string> = {
    ISSUED:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",

    PARTIALLY_PAID:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",

    OVERDUE:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",

    PAID:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  };

  return (
    <Badge
      variant="outline"
      className={styles[normalizedStatus] ?? ""}
    >
      {labels[normalizedStatus] ?? normalizedStatus}
    </Badge>
  );
}

/* =========================================================
 * FORM
 * ======================================================= */

export default function PenaltyDiscountRequestForm({
  mode = "create",
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

  /* =======================================================
   * FORM FIELDS
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
   * SUPPORTING DOCUMENT
   * ===================================================== */

  const [supportingFiles, setSupportingFiles] =
    useState<File[]>([]);

  const existingFileName =
    initialData?.supporting_file_name ?? null;

  /* =======================================================
   * UI STATE
   * ===================================================== */

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [submitDialogOpen, setSubmitDialogOpen] =
    useState(false);

  const isBusy = saving || loading;

  /* =======================================================
   * FINANCIAL VALUES
   * ===================================================== */

  const availablePenalty = selectedInvoice
    ? getAvailablePenalty(selectedInvoice)
    : 0;

  const amount =
    requestedAmount.trim() === ""
      ? 0
      : Number(requestedAmount);

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
    reason.trim().length < MIN_REASON_LENGTH;

  const formValid =
    !!selectedInvoice &&
    !amountInvalid &&
    !reasonInvalid;

  /* =======================================================
   * SELECT INVOICE
   * ===================================================== */

  const handleSelectInvoice = (
    invoice: EligibleInvoice,
  ) => {
    const isBlocked = blockedInvoiceIds.includes(
      invoice.id,
    );

    const isCurrentInvoice =
      invoice.id === selectedInvoice?.id;

    if (isBlocked && !isCurrentInvoice) {
      setError(
        "This invoice already has an active or pending penalty discount request.",
      );

      return;
    }

    const available = getAvailablePenalty(invoice);

    if (available <= 0) {
      setError(
        "This invoice has no available penalty for a discount request.",
      );

      return;
    }

    const changed =
      invoice.id !== selectedInvoice?.id;

    setSelectedInvoice(invoice);

    if (changed) {
      setRequestedAmount("");
    }

    setError("");
    setInvoiceDialogOpen(false);
  };

  /* =======================================================
   * VALIDATION
   * ===================================================== */

  const validateForm = (): boolean => {
    setError("");

    if (!selectedInvoice) {
      setError("Please select an invoice.");
      return false;
    }

    const isBlocked = blockedInvoiceIds.includes(
      selectedInvoice.id,
    );

    const isCurrentInvoice =
      selectedInvoice.id === initialData?.invoice.id;

    if (isBlocked && !isCurrentInvoice) {
      setError(
        "This invoice already has an active or pending penalty discount request.",
      );

      return false;
    }

    const currentAvailablePenalty =
      getAvailablePenalty(selectedInvoice);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Please enter a valid discount amount greater than zero.",
      );

      return false;
    }

    if (amount > currentAvailablePenalty) {
      setError(
        "The requested discount cannot exceed the available penalty.",
      );

      return false;
    }

    if (reason.trim().length < MIN_REASON_LENGTH) {
      setError(
        "Please provide a justification of at least 10 characters.",
      );

      return false;
    }

    if (supportingFiles.length > 1) {
      setError(
        "Only one supporting document can be uploaded.",
      );

      return false;
    }

    const supportingFile = supportingFiles[0];

    if (supportingFile) {
      const fileError =
        validateSupportingFile(supportingFile);

      if (fileError) {
        setError(fileError);
        return false;
      }
    }

    return true;
  };

  /* =======================================================
   * FORM VALUES
   * ===================================================== */

  const getFormValues =
    (): PenaltyDiscountFormValues => {
      if (!selectedInvoice) {
        throw new Error(
          "An invoice must be selected before continuing.",
        );
      }

      return {
        invoice_id: selectedInvoice.id,
        requested_amount: amount,
        reason: reason.trim(),
        supporting_file: supportingFiles[0] ?? null,
      };
    };

  /* =======================================================
   * SAVE DRAFT
   * ===================================================== */

  const handleSaveDraft = async () => {
    if (isBusy || !validateForm()) {
      return;
    }

    if (!onSaveDraft) {
      setError(
        "Draft saving is not configured. Please contact your administrator.",
      );

      return;
    }

    setSaving(true);

    try {
      await onSaveDraft(getFormValues());
    } catch (caughtError: unknown) {
      console.error(
        "Unable to save penalty discount draft:",
        caughtError,
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save the request. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
   * OPEN SUBMIT CONFIRMATION
   * ===================================================== */

  const handleOpenSubmit = () => {
    if (isBusy || !validateForm()) {
      return;
    }

    if (!onSubmit) {
      setError(
        "Request submission is not configured. Please contact your administrator.",
      );

      return;
    }

    setSubmitDialogOpen(true);
  };

  /* =======================================================
   * CONFIRM SUBMIT
   * ===================================================== */

  const handleConfirmSubmit = async () => {
    if (isBusy || !validateForm()) {
      return;
    }

    if (!onSubmit) {
      setSubmitDialogOpen(false);

      setError(
        "Request submission is not configured. Please contact your administrator.",
      );

      return;
    }

    setSaving(true);

    try {
      await onSubmit(getFormValues());
      setSubmitDialogOpen(false);
    } catch (caughtError: unknown) {
      console.error(
        "Unable to submit penalty discount request:",
        caughtError,
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to submit the request. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
   * CANCEL
   * ===================================================== */

  const handleCancel = () => {
    if (isBusy) {
      return;
    }

    onCancel?.();
  };

  /* =======================================================
   * RENDER
   * ===================================================== */

  return (
    <div className="min-h-full p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}

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
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {isEdit
                  ? "Edit Penalty Discount Request"
                  : "Create Penalty Discount Request"}
              </h1>

              <Badge variant="outline">
                {isEdit ? "Edit mode" : "New request"}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {isEdit
                ? "Update the request details before submitting it for review."
                : "Request a reduction of the penalty on an outstanding municipal invoice."}
            </p>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />

            <span className="flex-1 text-destructive">
              {error}
            </span>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-destructive/70 hover:text-destructive"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* MAIN CONTENT */}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* REQUEST DETAILS */}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Request Details
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* INVOICE */}

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
                      setError("");
                      setInvoiceDialogOpen(true);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>

                      <div>
                        <div className="text-sm font-medium">
                          Select an invoice
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          Search and choose an eligible invoice
                        </div>
                      </div>
                    </div>

                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ) : (
                  <div className="rounded-lg border">
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                          <FileText className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="break-all font-semibold">
                            {selectedInvoice.invoice_number}
                          </div>

                          <div className="mt-1 truncate text-sm text-muted-foreground">
                            {selectedInvoice.citizen?.name ??
                              "Taxpayer information unavailable"}
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        disabled={isBusy}
                        onClick={() => {
                          setError("");
                          setInvoiceDialogOpen(true);
                        }}
                      >
                        <Search className="mr-2 h-4 w-4" />
                        Change invoice
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* INVOICE INFORMATION */}

              {selectedInvoice && (
                <div className="overflow-hidden rounded-lg border bg-muted/20">
                  <div className="grid sm:grid-cols-2">
                    <div className="p-4 sm:border-r">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Taxpayer
                      </div>

                      <div className="mt-2 font-medium">
                        {selectedInvoice.citizen?.name ??
                          "Not available"}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {selectedInvoice.citizen?.phone ??
                          "No phone number"}
                      </div>
                    </div>

                    <div className="border-t p-4 sm:border-t-0">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Invoice status
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <InvoiceStatusBadge
                          status={String(selectedInvoice.status)}
                        />

                        <span className="text-xs text-muted-foreground">
                          Due{" "}
                          {formatDate(
                            selectedInvoice.dates.due_date,
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

                      <div className="mt-1 font-semibold tabular-nums">
                        {formatCurrency(
                          selectedInvoice.financial.penalty_amount,
                        )}{" "}
                        ETB
                      </div>
                    </div>

                    <div className="border-t p-4 sm:border-t-0 sm:border-r">
                      <div className="text-xs text-muted-foreground">
                        Existing discount
                      </div>

                      <div className="mt-1 font-semibold tabular-nums">
                        {formatCurrency(
                          selectedInvoice.financial.discount_amount,
                        )}{" "}
                        ETB
                      </div>
                    </div>

                    <div className="border-t p-4 sm:border-t-0">
                      <div className="text-xs text-muted-foreground">
                        Available penalty
                      </div>

                      <div className="mt-1 font-semibold tabular-nums">
                        {formatCurrency(availablePenalty)} ETB
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* REQUESTED AMOUNT */}

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
                    inputMode="decimal"
                    placeholder="0.00"
                    disabled={!selectedInvoice || isBusy}
                    value={requestedAmount}
                    aria-invalid={
                      requestedAmount !== "" && amountInvalid
                    }
                    onChange={(event) => {
                      setRequestedAmount(event.target.value);
                      setError("");
                    }}
                    className="pr-14 py-5"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ETB
                  </span>
                </div>

                {selectedInvoice && (
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                    <span>Maximum available</span>

                    <span className="font-medium tabular-nums">
                      {formatCurrency(availablePenalty)} ETB
                    </span>
                  </div>
                )}

                {amountTooHigh && (
                  <p className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Amount cannot exceed the available penalty.
                  </p>
                )}

                {requestedAmount !== "" &&
                  Number.isFinite(amount) &&
                  amount <= 0 && (
                    <p className="text-sm text-destructive">
                      Enter an amount greater than zero.
                    </p>
                  )}
              </div>

              {/* REASON */}

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
                  placeholder="Explain why a penalty discount is being requested..."
                  className="min-h-[130px] resize-y"
                  aria-invalid={
                    reason.length > 0 && reasonInvalid
                  }
                />

                <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    Provide a clear administrative justification.
                  </span>

                  <span>
                    {reason.trim().length} characters
                  </span>
                </div>

                {reason.length > 0 && reasonInvalid && (
                  <p className="text-sm text-destructive">
                    Please provide at least 10 characters.
                  </p>
                )}
              </div>

              {/* SUPPORTING DOCUMENT */}

              <div className="space-y-3">
                {existingFileName && (
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {existingFileName}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Existing supporting document
                      </p>
                    </div>
                  </div>
                )}

                <FileUpload
                  value={supportingFiles}
                  onChange={(files) => {
                    setSupportingFiles(files.slice(0, 1));
                    setError("");
                  }}
                  multiple={false}
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  maxSizeMB={5}
                  maxFiles={1}
                  label="Supporting document"
                  description="Optional. Upload PDF, JPG, or PNG. Maximum 5 MB."
                  placeholder={
                    existingFileName
                      ? "Choose a replacement document"
                      : "Upload supporting document"
                  }
                  disabled={isBusy}
                />

                {supportingFiles[0] && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {supportingFiles[0].name} (
                    {(supportingFiles[0].size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* REQUEST SUMMARY */}

          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-base">
                Request Summary
              </CardTitle>
            </CardHeader>

            <CardContent>
              {!selectedInvoice ? (
                <div className="rounded-lg border border-dashed bg-muted/30 p-5 text-center">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground" />

                  <p className="mt-3 text-sm font-medium">
                    No invoice selected
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Select an invoice to review its penalty and request details.
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    disabled={isBusy}
                    onClick={() => setInvoiceDialogOpen(true)}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Select invoice
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Invoice
                    </div>

                    <div className="mt-1 break-all font-semibold">
                      {selectedInvoice.invoice_number}
                    </div>

                    <div className="mt-1 text-sm text-muted-foreground">
                      {selectedInvoice.citizen?.name ??
                        "Taxpayer information unavailable"}
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-start justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Due date
                      </span>

                      <span className="text-right font-medium">
                        {formatDate(
                          selectedInvoice.dates.due_date,
                        )}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Available penalty
                      </span>

                      <span className="text-right font-medium tabular-nums">
                        {formatCurrency(availablePenalty)} ETB
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="text-xs text-muted-foreground">
                      Requested discount
                    </div>

                    <div className="mt-1 break-words text-2xl font-semibold tracking-tight">
                      {formatCurrency(amount)}{" "}
                      <span className="text-sm font-medium">
                        ETB
                      </span>
                    </div>

                    {amount > 0 &&
                      amount <= availablePenalty && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Within available penalty
                        </div>
                      )}
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                    <span>
                      The requested discount must be approved before it can be applied to the invoice.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FORM ACTIONS */}

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
            {saving && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

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
            {saving && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            {isEdit
              ? "Submit Changes"
              : "Submit for Approval"}
          </Button>
        </div>
      </div>

      {/* INVOICE SELECTOR */}

      <InvoiceSelectorDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        selectedInvoice={selectedInvoice}
        onSelect={handleSelectInvoice}
        getAvailablePenalty={(invoice) => {
          const blocked = blockedInvoiceIds.includes(
            invoice.id,
          );

          const isCurrentInvoice =
            invoice.id === selectedInvoice?.id;

          if (blocked && !isCurrentInvoice) {
            return 0;
          }

          return getAvailablePenalty(invoice);
        }}
        isBusy={isBusy}
      />

      {/* SUBMIT CONFIRMATION */}

      <Dialog
        open={submitDialogOpen}
        onOpenChange={(open) => {
          if (!isBusy) {
            setSubmitDialogOpen(open);
          }
        }}
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
                ? "Confirm that the updated request is ready for administrative review."
                : "Review the details before sending this request for administrative approval."}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
              <div>
                <div className="text-xs text-muted-foreground">
                  Invoice
                </div>

                <div className="mt-1 break-all font-medium">
                  {selectedInvoice.invoice_number}
                </div>

                <div className="mt-1 text-sm text-muted-foreground">
                  {selectedInvoice.citizen?.name ??
                    "Taxpayer information unavailable"}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t pt-3">
                <span className="text-sm text-muted-foreground">
                  Requested discount
                </span>

                <span className="text-right font-semibold tabular-nums">
                  {formatCurrency(amount)} ETB
                </span>
              </div>

              {supportingFiles[0] && (
                <div className="flex items-start gap-2 border-t pt-3 text-sm">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0" />

                  <span className="break-all">
                    {supportingFiles[0].name}
                  </span>
                </div>
              )}

              <div className="flex items-start gap-2 border-t pt-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                <p className="text-xs leading-5 text-muted-foreground">
                  The request will require approval before the discount can be applied to the invoice.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => setSubmitDialogOpen(false)}
            >
              Review
            </Button>

            <Button
              type="button"
              disabled={isBusy}
              onClick={handleConfirmSubmit}
            >
              {saving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

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
