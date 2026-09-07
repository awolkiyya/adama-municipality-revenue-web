"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  Landmark,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { InterestRuleForm } from "@/components/forms/InterestRuleForm";

import {
  interestRuleFormToPayload,
  interestRuleToForm,
  type InterestRuleFormValues,
} from "@/types/revenue/interestRule";

import {
  useInterestRule,
  useUpdateInterestRule,
} from "@/hooks/revenue/interestRule.hook";

export default function EditInterestRulePage() {
  const router = useRouter();

  const params = useParams<{
    id: string;
  }>();

  const id = params.id;

  const {
    data,
    isLoading,
    isError,
  } = useInterestRule(id);

  const updateMutation = useUpdateInterestRule();

  const rule = data?.data;

  /**
   * Convert API resource into the form representation.
   *
   * The form should never work directly with the API resource
   * when its representation differs from the editable form state.
   */
  const initialValues = useMemo(() => {
    if (!rule) {
      return undefined;
    }

    return interestRuleToForm(rule);
  }, [rule]);

  /**
   * Submit updated interest rule.
   *
   * The page does not calculate interest.
   * It only transforms the form state into the API payload
   * and delegates persistence to the mutation hook.
   */
  const handleSubmit = async (
    values: InterestRuleFormValues,
  ) => {
    await updateMutation.mutateAsync({
      id,
      data: interestRuleFormToPayload(values),
    });

    router.push(
      "/office/dashboard/revenue-managements/interest-rules",
    );
  };

  // ===========================================================================
  // LOADING
  // ===========================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label="Loading interest rule"
        />
      </div>
    );
  }

  // ===========================================================================
  // ERROR
  // ===========================================================================

  if (isError || !rule || !initialValues) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <p className="font-medium">
          Interest rule could not be loaded.
        </p>

        <p className="text-sm text-muted-foreground">
          The rule may have been removed or you may not have permission
          to access it.
        </p>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="mx-auto max-w-4xl space-y-6">


      {/* Form */}
      <InterestRuleForm
        mode="edit"
        initialValues={initialValues}
        isSubmitting={updateMutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
