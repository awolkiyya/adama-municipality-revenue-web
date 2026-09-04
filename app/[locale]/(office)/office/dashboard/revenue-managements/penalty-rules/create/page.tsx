"use client";

import {
  PenaltyForm,
  type PenaltyFormValues,
} from "@/components/forms/penalty-form";



import {
  useCreatePenaltyRule,
} from "@/hooks/revenue/penaltyRule.hook";
import { EMPTY_PENALTY_FORM, penaltyFormToPayload } from "@/types/revenue/penality.";

/* ================================================================
   PAGE
================================================================ */

export default function CreatePenaltyPage() {
  const createPenaltyRule =
    useCreatePenaltyRule();

  /* ==============================================================
     SUBMIT
  ============================================================== */

  const handleSubmit = async (
    values: PenaltyFormValues,
  ) => {
    /**
     * The form keeps numeric values as strings.
     *
     * Convert the UI model into the API payload at this
     * boundary before sending it to the mutation.
     */
    const payload =
      penaltyFormToPayload(values);

    await createPenaltyRule.mutateAsync(
      payload,
    );
  };

  /* ================================================================
     RENDER
  ================================================================ */

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <PenaltyForm
        mode="create"
        initialValues={EMPTY_PENALTY_FORM}
        isSubmitting={
          createPenaltyRule.isPending
        }
        onSubmit={handleSubmit}
      />
    </div>
  );
}