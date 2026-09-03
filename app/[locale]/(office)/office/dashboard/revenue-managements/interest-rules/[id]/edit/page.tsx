"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  Landmark,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";


import {
  interestRuleFormToPayload,
  interestRuleToForm,
  type InterestRuleFormValues,
} from "@/types/revenue/interestRule";

import {
  useInterestRule,
  useUpdateInterestRule,
} from "@/hooks/revenue/interestRule.hook";
import { InterestRuleForm } from "@/components/forms/InterestRuleForm";

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

  const updateMutation =
    useUpdateInterestRule();


  const rule = data?.data;


  const initialValues = useMemo(() => {
    if (!rule) {
      return undefined;
    }

    return interestRuleToForm(rule);
  }, [rule]);


  const handleSubmit = async (
    values: InterestRuleFormValues,
  ) => {
    await updateMutation.mutateAsync({
      id,
      data:
        interestRuleFormToPayload(values),
    });
  };


  // ===================================================
  // LOADING
  // ===================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">

        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />

      </div>
    );
  }


  // ===================================================
  // ERROR
  // ===================================================

  if (isError || !rule) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">

        <p className="font-medium">
          Interest rule could not be loaded.
        </p>

        <Button
          variant="outline"
          onClick={() =>
            router.back()
          }
        >
          Go Back
        </Button>

      </div>
    );
  }


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Header */}

      <div className="flex items-center gap-3">

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() =>
            router.back()
          }
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Landmark className="h-5 w-5" />
        </div>

        <div>

          <h1 className="text-xl font-semibold">
            Edit Interest Rule
          </h1>

          <p className="text-sm text-muted-foreground">
            Update the configuration of this interest policy.
          </p>

        </div>

      </div>


      {/* Form */}

      {initialValues && (
        <InterestRuleForm
          mode="edit"
          initialValues={
            initialValues
          }
          isSubmitting={
            updateMutation.isPending
          }
          onSubmit={handleSubmit}
          onCancel={() =>
            router.back()
          }
        />
      )}

    </div>
  );
}