"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InterestRuleForm } from "@/components/forms/InterestRuleForm";

import {
  EMPTY_INTEREST_RULE_FORM,
  interestRuleFormToPayload,
  type InterestRuleFormValues,
} from "@/types/revenue/interestRule";
import { useCreateInterestRule } from "@/hooks/revenue/interestRule.hook";


export default function CreateInterestRulePage() {
  const router = useRouter();

  const createMutation = useCreateInterestRule();

  const handleSubmit = async (
    values: InterestRuleFormValues,
  ) => {
    await createMutation.mutateAsync(
      interestRuleFormToPayload(values),
    );

    router.push(
      "/office/dashboard/revenue-managements/interest-rules",
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Form */}
      <InterestRuleForm
        mode="create"
        initialValues={EMPTY_INTEREST_RULE_FORM}
        isSubmitting={createMutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}