
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import PenaltyDiscountForm, {
  type PenaltyDiscountInitialData,
  type PenaltyDiscountFormValues,
} from "@/components/forms/penalty-discount-form";

import type { Invoice } from "@/types/invoice/invoice";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  usePenaltyDiscountRequest,
} from "@/hooks/revenue/use-penalty-discount-requests";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type ApiRecord = Record<string, unknown>;

type SupportingFile = {
  original_name?: string;
  file_name?: string;
  name?: string;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function asRecord(value: unknown): ApiRecord {
  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as ApiRecord;
  }

  return {};
}

function asText(
  value: unknown,
  fallback = "",
): string {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
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

/**
 * Validate the fields that PenaltyDiscountForm actually reads.
 *
 * This prevents an invoice ID, partial API object, or missing invoice
 * from being passed as if it were a complete Invoice.
 */
function toInvoice(value: unknown): Invoice | null {
  const record = asRecord(value);

  const financial = asRecord(record.financial);
  const dates = asRecord(record.dates);

  const hasRequiredFields =
    typeof record.id === "string" &&
    record.id.length > 0 &&
    typeof record.invoice_number === "string" &&
    record.invoice_number.length > 0 &&
    typeof record.status === "string" &&
    record.financial !== null &&
    typeof record.financial === "object" &&
    !Array.isArray(record.financial) &&
    record.dates !== null &&
    typeof record.dates === "object" &&
    !Array.isArray(record.dates) &&
    "penalty_amount" in financial &&
    "discount_amount" in financial &&
    "due_date" in dates;

  if (!hasRequiredFields) {
    return null;
  }

  /*
   * The required form fields have been checked at runtime.
   * Preserve the remaining fields returned by the invoice API.
   */
  return record as unknown as Invoice;
}

function getSupportingFileName(
  request: ApiRecord,
): string | null {
  const directName = asText(
    request.supporting_file_name,
  );

  if (directName) {
    return directName;
  }

  const rawFiles = Array.isArray(request.supporting_files)
    ? request.supporting_files
    : [];

  const names = rawFiles
    .map((file) => {
      const item = asRecord(file);

      return asText(
        item.original_name ??
          item.file_name ??
          item.name,
      );
    })
    .filter(Boolean);

  return names.length > 0 ? names.join(", ") : null;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function EditPenaltyDiscountRequestPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const id = params.id;

  const [saving, setSaving] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePenaltyDiscountRequest(id, Boolean(id));

  const request: ApiRecord | null = data
    ? asRecord(data)
    : null;

  /*
   * The form requires a complete Invoice object.
   * If the API returns only invoice_id, retrieve the associated
   * invoice from your backend before rendering the form.
   */
  const invoice = request
    ? toInvoice(request.invoice)
    : null;

  const status = asText(request?.status).toUpperCase();

  const isDraft = status === "DRAFT";
  const canEdit = isDraft;

  /* ------------------------------------------------------------------------ */
  /* Redirect when the request is no longer editable                          */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (request && !canEdit) {
      toast.error(
        "Only draft penalty discount requests can be edited.",
      );

      router.replace(
        `../../${encodeURIComponent(id)}`,
      );
    }
  }, [request, canEdit, id, router]);

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (isLoading) {
    return (
      <div
        className="flex min-h-[400px] flex-col items-center justify-center gap-3"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />

        <p className="text-sm text-muted-foreground">
          Loading penalty discount request...
        </p>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Error                                                                    */
  /* ------------------------------------------------------------------------ */

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <Button
          type="button"
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <XCircle className="h-9 w-9 text-destructive" />

            <div className="space-y-1">
              <h2 className="font-semibold">
                Unable to load request
              </h2>

              <p className="max-w-lg text-sm text-muted-foreground">
                {getErrorMessage(
                  error,
                  "An unexpected error occurred while loading the request.",
                )}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}

              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Not found                                                                */
  /* ------------------------------------------------------------------------ */

  if (!request) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <Button
          type="button"
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <XCircle className="h-9 w-9 text-muted-foreground" />

            <h2 className="font-semibold">
              Penalty discount request not found
            </h2>

            <p className="text-sm text-muted-foreground">
              The request may have been deleted or you may not
              have permission to view it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Prevent editing requests outside DRAFT                                   */
  /* ------------------------------------------------------------------------ */

  if (!canEdit) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <XCircle className="h-9 w-9 text-muted-foreground" />

            <h2 className="font-semibold">
              This request cannot be edited
            </h2>

            <p className="text-sm text-muted-foreground">
              Only draft penalty discount requests can be edited.
              Current status: {status || "Unknown"}.
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Validate the linked invoice                                              */
  /* ------------------------------------------------------------------------ */

  if (!invoice) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <Button
          type="button"
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <XCircle className="h-9 w-9 text-destructive" />

            <div className="space-y-1">
              <h2 className="font-semibold">
                Unable to load the associated invoice
              </h2>

              <p className="max-w-lg text-sm text-muted-foreground">
                The request does not contain a complete invoice
                object required by the form. Ensure the request
                detail API returns the associated invoice, including
                its financial values and due date.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}

              Reload request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Form initial data                                                        */
  /* ------------------------------------------------------------------------ */

  const initialData: PenaltyDiscountInitialData = {
    invoice,
    requested_amount: Number(request.requested_amount ?? 0),
    reason: asText(request.reason),
    supporting_file_name: getSupportingFileName(request),
  };

  /* ------------------------------------------------------------------------ */
  /* Save handlers                                                            */
  /* ------------------------------------------------------------------------ */

  async function handleSaveDraft(
    values: PenaltyDiscountFormValues,
  ): Promise<void> {
    if (!canEdit || saving) {
      toast.error(
        "This request can no longer be edited.",
      );
      return;
    }

    const payload = {
      invoice_id: values.invoice_id,
      requested_amount: Number(values.requested_amount),
      reason: values.reason.trim(),
      supporting_file: values.supporting_file,
    };

    if (
      !payload.invoice_id ||
      !Number.isFinite(payload.requested_amount) ||
      payload.requested_amount <= 0 ||
      payload.reason.length < 10
    ) {
      toast.error(
        "Please provide a valid invoice, discount amount, and reason of at least 10 characters.",
      );
      return;
    }

    /*
     * TODO: Connect the existing update mutation here.
     *
     * Expected form values:
     * - invoice_id
     * - requested_amount
     * - reason
     * - supporting_file
     *
     * The update mutation must handle the optional file upload.
     * Do not send the invoice display object or supporting file name
     * unless your Laravel validation rules explicitly accept them.
     */
    toast.error(
      "The draft update mutation is not connected. No changes were saved.",
    );
  }

  async function handleSubmit(
    values: PenaltyDiscountFormValues,
  ): Promise<void> {
    if (!canEdit || saving) {
      toast.error(
        "This request can no longer be edited.",
      );
      return;
    }

    const payload = {
      invoice_id: values.invoice_id,
      requested_amount: Number(values.requested_amount),
      reason: values.reason.trim(),
      supporting_file: values.supporting_file,
    };

    if (
      !payload.invoice_id ||
      !Number.isFinite(payload.requested_amount) ||
      payload.requested_amount <= 0 ||
      payload.reason.length < 10
    ) {
      toast.error(
        "Please provide a valid invoice, discount amount, and reason of at least 10 characters.",
      );
      return;
    }

    /*
     * TODO: Implement the actual submission sequence:
     *
     * 1. Update the existing draft using the update mutation.
     * 2. Wait for the update to succeed.
     * 3. Submit the updated draft using the existing submit mutation.
     * 4. Navigate to the request detail page only after both succeed.
     *
     * Do not call the submit mutation before the update succeeds.
     */
    toast.error(
      "The update and submit mutations are not connected. The request has not been submitted.",
    );
  }

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Edit Penalty Discount Request
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Update the draft details before submitting for approval.
            </p>
          </div>
        </div>

        <span className="rounded-full border px-3 py-1 text-xs font-medium">
          {status.replaceAll("_", " ")}
        </span>
      </div>

      <PenaltyDiscountForm
        mode="edit"
        initialData={initialData}
        loading={saving}
        onCancel={() => router.back()}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
      />

      {saving && (
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </div>
      )}
    </div>
  );
}