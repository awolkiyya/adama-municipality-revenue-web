"use client";

import { TaxpayerForm } from "@/components/forms/TaxPayerForm";
import { useCreateCitizen } from "@/hooks/useCitizen.hook";
import { toast } from "sonner";
import type { AxiosError } from "axios";

type ApiErrorResponse = {
  message?: string;
};

export default function CitizenCreatePage() {
  const { mutate: createCitizen, isPending } = useCreateCitizen();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Register New Citizen</h1>

          <p className="text-sm text-muted-foreground">
            Create citizen profile and assign administrative location.
          </p>
        </div>
      </div>

      <TaxpayerForm
        isSubmitting={isPending}
        onSubmit={(values) => {
          createCitizen(values, {
            onSuccess: () => {
              toast.success("Citizen registered successfully.");
            }
          });
        }}
      />
    </div>
  );
}