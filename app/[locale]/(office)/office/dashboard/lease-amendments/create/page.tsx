"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { LeaseAmendmentForm } from "@/components/forms/lease-amendment-form";
import { useAssessment } from "@/hooks/revenue/assessment.hook";
import { useCreateLeaseAmendment } from "@/hooks/revenue/use-lease-amendments";

import type { Assessment } from "@/types/revenue/assessment";
import type {
  AmendmentType,
  CreateLeaseAmendmentPayload,
  LeaseAmendmentFormValues,
} from "@/types/assessment/lease-amendment";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Supports common Laravel response structures:
 *   { id, assessmentNumber, services: [...] }
 *   { data: { id, assessmentNumber, services: [...] } }
 *   { data: { data: { id, assessmentNumber, services: [...] } } }
 */
function extractAssessment(response: unknown): Assessment | null {
  let current: unknown = response;

  for (let depth = 0; depth < 3; depth += 1) {
    if (!current || typeof current !== "object") {
      return null;
    }

    const record = current as Record<string, unknown>;

    if (
      typeof record.id === "string" &&
      typeof record.assessmentNumber === "string" &&
      Array.isArray(record.services)
    ) {
      return record as unknown as Assessment;
    }

    if (!("data" in record)) {
      return null;
    }

    current = record.data;
  }

  return null;
}

/**
 * Converts optional numeric values without converting empty values to zero.
 */
function toOptionalNumber(
  value: number | string | null | undefined,
): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Extracts a useful message from common Axios/Laravel errors.
 */
function getErrorMessage(error: unknown): string {
  const fallback =
    "Failed to create the lease amendment. Please try again.";

  if (!error || typeof error !== "object") {
    return fallback;
  }

  const record = error as {
    message?: string;
    response?: {
      data?: {
        message?: string;
        errors?: Record<string, string[] | string>;
      };
    };
  };

  const responseData = record.response?.data;

  if (responseData?.message) {
    return responseData.message;
  }

  const validationErrors = responseData?.errors;

  if (validationErrors) {
    const firstError = Object.values(validationErrors)[0];

    if (Array.isArray(firstError) && firstError.length > 0) {
      return firstError[0];
    }

    if (typeof firstError === "string") {
      return firstError;
    }
  }

  return record.message ?? fallback;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CreateLeaseAmendmentPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();

  const assessmentId = searchParams.get("assessment_id");

  /* ---------------------------------------------------------------------- */
  /* Source assessment                                                       */
  /* ---------------------------------------------------------------------- */

  const assessmentQuery = useAssessment(assessmentId ?? "");

  const assessment = useMemo(
    () => extractAssessment(assessmentQuery.data),
    [assessmentQuery.data],
  );

  /* ---------------------------------------------------------------------- */
  /* Create mutation                                                         */
  /* ---------------------------------------------------------------------- */

  const createLeaseAmendment = useCreateLeaseAmendment();

  /* ---------------------------------------------------------------------- */
  /* Loading and error states                                                */
  /* ---------------------------------------------------------------------- */

  const isLoading =
    Boolean(assessmentId) &&
    (assessmentQuery.isLoading || assessmentQuery.isFetching);

  const errorMessage = !assessmentId
    ? "Assessment ID is missing from the URL."
    : assessmentQuery.error
      ? "Failed to load the assessment. Please try again."
      : !isLoading && !assessment
        ? "Assessment not found or the API response has an unexpected structure."
        : null;

  /* ---------------------------------------------------------------------- */
  /* Submit                                                                  */
  /* ---------------------------------------------------------------------- */

  const handleSubmit = async (
    values: LeaseAmendmentFormValues,
  ): Promise<void> => {
    if (!assessmentId || !assessment) {
      toast.error("A valid source assessment is required.");
      throw new Error("A valid source assessment is required.");
    }

    if (createLeaseAmendment.isPending) {
      return;
    }

    /*
     * The form type permits null, but the API requires AmendmentType.
     * Validate before constructing the request payload so TypeScript
     * narrows this value to AmendmentType.
     */
    const selectedType = values.amendmentType;

    if (!selectedType) {
      toast.error("Please select an amendment type.");
      throw new Error("Amendment type is required.");
    }

    const amendmentType: AmendmentType = selectedType;

    if (!values.reason.trim()) {
      toast.error("Please provide a reason for the amendment.");
      throw new Error("Amendment reason is required.");
    }

    /*
     * Map the form's camelCase values to the API's snake_case contract.
     * Only include fields relevant to the selected amendment type.
     */
    const payload: CreateLeaseAmendmentPayload = {
      previous_assessment_id: assessment.id,
      amendment_type: amendmentType,
      reason: values.reason.trim(),

      ...(amendmentType === "OWNERSHIP_TRANSFER" && values.newTaxpayerId
        ? {
            new_taxpayer_id: values.newTaxpayerId,
          }
        : {}),

      ...(amendmentType === "LAND_AREA_CHANGE"
        ? {
            new_land_area: toOptionalNumber(values.newLandArea),
          }
        : {}),

      ...(amendmentType === "PARTIAL_TRANSFER"
        ? {
            transfer_area: toOptionalNumber(values.transferArea),
          }
        : {}),

      ...(amendmentType === "LAND_MERGE"
        ? {
            other_land_area: toOptionalNumber(values.mergedLandArea),
          }
        : {}),

      ...(values.otherAmendmentDescription?.trim()
        ? {
            other_amendment_description:
              values.otherAmendmentDescription.trim(),
          }
        : {}),

      ...(values.supportingDocuments?.length
        ? {
            supporting_documents: values.supportingDocuments,
          }
        : {}),
    };

    try {
      await createLeaseAmendment.mutateAsync(payload);

      toast.success("Lease amendment created successfully.");

      router.push(`/${locale}/office/dashboard/lease-amendments`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                 */
  /* ---------------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading assessment...
        </p>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Error                                                                   */
  /* ---------------------------------------------------------------------- */

  if (errorMessage || !assessment) {
    return (
      <div className="space-y-3 rounded-lg border p-5">
        <p className="text-sm text-destructive">
          {errorMessage ?? "Assessment not found."}
        </p>

        <button
          type="button"
          className="text-sm underline underline-offset-4"
          onClick={() => router.back()}
        >
          Go back
        </button>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Form                                                                    */
  /* ---------------------------------------------------------------------- */

  return (
    <LeaseAmendmentForm
      mode="create"
      assessment={assessment}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
