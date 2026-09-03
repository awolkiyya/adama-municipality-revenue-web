"use client";

import { useRouter } from "next/navigation";

import { ArrowLeft, Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";


import {
  EMPTY_INTEREST_RULE_FORM,
  interestRuleFormToPayload,
  type InterestRuleFormValues,
} from "@/types/revenue/interestRule";
import { InterestRuleForm } from "@/components/forms/InterestRuleForm";


export default function CreateInterestRulePage() {
  const router = useRouter();

  // const createMutation =
  //   useCreateInterestRule();


  const handleSubmit = async (
    values: InterestRuleFormValues,
  ) => {
    // await createMutation.mutateAsync(
    //   interestRuleFormToPayload(values),
    // );
  };


  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Form */}

      <InterestRuleForm
        mode="create"
        initialValues={
          EMPTY_INTEREST_RULE_FORM
        }
        isSubmitting={
false        }
        onSubmit={handleSubmit}
        onCancel={() =>
          router.back()
        }
      />

    </div>
  );
}