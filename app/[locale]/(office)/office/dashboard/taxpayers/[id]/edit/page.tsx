"use client";

import { TaxpayerForm } from "@/components/forms/TaxPayerForm";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { useCitizen, useUpdateCitizen } from "@/hooks/useCitizen.hook";
import { mapCitizenToForm } from "@/utils/citizen.mapper";

function TaxPayerEditPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const {
    data: citizen,
    isLoading,
    isError,
  } = useCitizen(id);

  const {
    mutate: updateCitizen,
    isPending,
  } = useUpdateCitizen();


  if (isLoading) {
    return (
      <div className="p-6">
        Loading citizen information...
      </div>
    );
  }


  if (isError || !citizen) {
    return (
      <div className="p-6 text-red-500">
        Citizen not found.
      </div>
    );
  }


  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          Edit Citizen
        </h1>

        <p className="text-sm text-muted-foreground">
          Update citizen profile information.
        </p>
      </div>


      <TaxpayerForm
        defaultValues={mapCitizenToForm(citizen)}
        isSubmitting={isPending}
        onSubmit={(values) => {

          updateCitizen(
            {
              id,
              data: values,
            },
            {
              onSuccess: () => {
                toast.success(
                  "Citizen updated successfully."
                );

                router.push("/office/dashboard/taxpayers");
              },

              onError: (error: any) => {
                toast.error(
                  error?.response?.data?.message ??
                  "Failed to update citizen."
                );
              },
            }
          );

        }}
      />

    </div>
  );
}

export default TaxPayerEditPage;