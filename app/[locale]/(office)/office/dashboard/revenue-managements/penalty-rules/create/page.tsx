"use client";

import { PenaltyForm, PenaltyFormValues } from "@/components/forms/penalty-form";
import { useRouter } from "next/navigation";

const EMPTY_FORM: PenaltyFormValues = {
  name: "",

  initial_rate: "5",
  increment_rate: "2",
  maximum_rate: "25",



  calculation_basis: "PRINCIPAL",

  effective_from: new Date().toISOString().split("T")[0],
  effective_to: "",

  legal_reference: "",
  description: "",

  is_active: true,
  start_type: "FIXED_FISCAL_MONTH",
  start_fiscal_month: "",
  increment_period: "MONTH"
};

export default function CreatePenaltyPage() {
  const router = useRouter();

  const handleSubmit = async (values: PenaltyFormValues) => {
    // POST /penalty-rules

    console.log(values);

    router.push("/revenue/penalties");
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <PenaltyForm
        mode="create"
        initialValues={EMPTY_FORM}
        onSubmit={handleSubmit}
      />
    </div>
  );
}