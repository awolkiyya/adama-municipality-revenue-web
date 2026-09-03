"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PenaltyForm, PenaltyFormValues } from "@/components/forms/penalty-form";


export default function EditPenaltyPage() {
  const params = useParams();
  const router = useRouter();

  const [initialValues, setInitialValues] =
    useState<PenaltyFormValues | null>(null);

  useEffect(() => {
    const loadPenalty = async () => {
      // GET /penalty-rules/{id}

      // Example:
      // setInitialValues({
      //   name: "Lizz Late Payment Penalty",

      //   initial_rate: "5",
      //   increment_rate: "2",
      //   maximum_rate: "25",



      //   calculation_basis: "PRINCIPAL",

      //   effective_from: "2026-01-01",
      //   effective_to: "",

      //   legal_reference: "",
      //   description: "",

      //   is_active: true,
      // });
    };

    loadPenalty();
  }, [params.id]);

  const handleSubmit = async (values: PenaltyFormValues) => {
    // PUT /penalty-rules/{id}

    console.log(params.id, values);

    router.push("/revenue/penalties");
  };

  if (!initialValues) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <PenaltyForm
        mode="edit"
        initialValues={initialValues}
        onSubmit={handleSubmit}
      />
    </div>
  );
}