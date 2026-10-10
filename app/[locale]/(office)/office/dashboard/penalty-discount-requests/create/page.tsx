"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import PenaltyDiscountForm from "@/components/forms/penalty-discount-form";
import {
  useCreatePenaltyDiscountRequest,
  useSubmitPenaltyDiscountRequest,
} from "@/hooks/revenue/use-penalty-discount-requests";

import type { PenaltyDiscountFormValues } from "@/components/forms/penalty-discount-form";

type CreatedRequestResponse = {
  id?: string;
  data?: {
    id?: string;
    data?: {
      id?: string;
    };
  };
};

/**
 * Extract the newly created request ID from common API response shapes.
 */
function getCreatedRequestId(
  response: unknown,
): string | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const result = response as CreatedRequestResponse;

  return (
    result.id ??
    result.data?.id ??
    result.data?.data?.id ??
    null
  );
}

/**
 * Convert form values into multipart/form-data.
 *
 * Important:
 * - Append the actual File object.
 * - Do not JSON.stringify this payload.
 * - Do not append an empty object when no file is selected.
 */
function toFormData(
  values: PenaltyDiscountFormValues,
): FormData {
  const formData = new FormData();

  formData.append("invoice_id", values.invoice_id);
  formData.append(
    "requested_amount",
    String(values.requested_amount),
  );
  formData.append("reason", values.reason.trim());

  if (values.supporting_file instanceof File) {
    formData.append(
      "supporting_file",
      values.supporting_file,
      values.supporting_file.name,
    );
  }

  return formData;
}

export default function CreatePenaltyDiscountRequestPage() {
  const router = useRouter();

  const createMutation = useCreatePenaltyDiscountRequest();
  const submitMutation = useSubmitPenaltyDiscountRequest();

  const isLoading =
    createMutation.isPending ||
    submitMutation.isPending;

  /**
   * Save the request as a draft.
   */
  const handleSaveDraft = async (
    values: PenaltyDiscountFormValues,
  ) => {
    try {
      const formData = toFormData(values);

      await createMutation.mutateAsync(formData);

      toast.success("Penalty discount draft saved successfully.");

      router.push("../");
    } catch {
      // The mutation hook should display the API error.
      // Keep the form open so the user can correct the request.
    }
  };

  /**
   * Create the request, then submit it for approval.
   */
  const handleSubmit = async (
    values: PenaltyDiscountFormValues,
  ) => {
    try {
      const formData = toFormData(values);

      const response =
        await createMutation.mutateAsync(formData);

      const requestId = getCreatedRequestId(response);

      if (!requestId) {
        toast.error(
          "The request was created, but its ID could not be read. " +
            "Please open the request list and submit it from there.",
        );

        return;
      }

      await submitMutation.mutateAsync(requestId);

      toast.success(
        "Penalty discount request submitted for approval.",
      );

      router.push("../");
    } catch {
      // Mutation hooks should display API errors.
      // Keep the form open if creation or submission fails.
    }
  };

  return (
    <PenaltyDiscountForm
      mode="create"
      loading={isLoading}
      onCancel={() => router.back()}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
    />
  );
}
