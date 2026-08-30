"use client";

import { TaxpayerForm } from "@/components/forms/TaxPayerForm";
import { useCreateCitizen } from "@/hooks/useCitizen.hook";
import { toast } from "sonner";

export default function CitizenCreatePage() {
  const { mutate: createCitizen, isPending } = useCreateCitizen();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Register New Citizen
          </h1>

          <p className="text-sm text-muted-foreground">
            Create citizen profile and assign administrative location.
          </p>
        </div>
      </div>

      <TaxpayerForm
        isSubmitting={isPending} // if your form supports it
        onSubmit={(values) => {
          createCitizen(values, {
            onSuccess: () => {
              toast.success("Citizen registered successfully.");
            },
            onError: (error: any) => {
              toast.error(
                error?.response?.data?.message ??
                  "Failed to register citizen."
              );
            },
          });
        }}
      />
    </div>
  );
}