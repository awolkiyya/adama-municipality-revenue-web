"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  PenaltyForm,
  PenaltyFormValues,
} from "@/components/forms/penalty-form";

import {
  usePenaltyRule,
  useUpdatePenaltyRule,
} from "@/hooks/revenue/penaltyRule.hook";

import {
  PenaltyRule,
  PenaltyRulePayload,
  penaltyFormToPayload,
} from "@/types/revenue/penality.";

const PENALTY_RULES_PATH =
  "/office/dashboard/revenue-managements/penalty-rules";

/**
 * Convert the API resource into the string-based
 * values expected by the form.
 */
function penaltyRuleToFormValues(
  rule: PenaltyRule,
): PenaltyFormValues {
  return {
    name: rule.name,

    initial_rate: rule.initial_rate,
    increment_rate: rule.increment_rate,
    maximum_rate: rule.maximum_rate,

    start_type: rule.start_type,


    increment_period: rule.increment_period,

    calculation_basis: rule.calculation_basis,

    effective_from: rule.effective_from
      ? rule.effective_from.slice(0, 10)
      : "",

    effective_to: rule.effective_to
      ? rule.effective_to.slice(0, 10)
      : "",

    legal_reference: rule.legal_reference ?? "",

    description: rule.description ?? "",

    is_active: rule.is_active,
  };
}

export default function EditPenaltyPage() {
  const params = useParams();
  const router = useRouter();

  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = usePenaltyRule(id);

  const updatePenaltyRule = useUpdatePenaltyRule();

  /**
   * usePenaltyRule returns:
   *
   * ApiResponse<PenaltyRule>
   *
   * Therefore the actual PenaltyRule is response.data.
   */
  const rule = response?.data ?? null;

  /**
   * Convert API data into the form's string-based values.
   */
  const initialValues = useMemo(() => {
    if (!rule) {
      return null;
    }

    return penaltyRuleToFormValues(rule);
  }, [rule]);

  /**
   * Convert form values into the numeric API payload.
   */
  const handleSubmit = async (
    values: PenaltyFormValues,
  ) => {
    if (!id) {
      return;
    }

    const payload: PenaltyRulePayload =
      penaltyFormToPayload(values);

    await updatePenaltyRule.mutateAsync({
      id,
      data: payload,
    });

    router.push(PENALTY_RULES_PATH);
  };

  /**
   * Invalid ID
   */
  if (!id) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />

            <div>
              <h2 className="font-semibold">
                Invalid penalty rule
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                The penalty rule ID is missing from the URL.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Loading
   */
  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading penalty rule...</span>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Error / missing rule
   */
  if (isError || !initialValues) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />

            <div className="flex-1">
              <h2 className="font-semibold">
                Unable to load penalty rule
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "The penalty rule could not be loaded."}
              </p>

              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    router.push(PENALTY_RULES_PATH)
                  }
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Penalty Rules
                </Button>

                <Button
                  type="button"
                  onClick={() => refetch()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Edit form
   */
  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <Button
          type="button"
          variant="ghost"
          className="-ml-2"
          onClick={() =>
            router.push(PENALTY_RULES_PATH)
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Penalty Rules
        </Button>
      </div>

      <PenaltyForm
        mode="edit"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isSubmitting={updatePenaltyRule.isPending}
      />
    </div>
  );
}