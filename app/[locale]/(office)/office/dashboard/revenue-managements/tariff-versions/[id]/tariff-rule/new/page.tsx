"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import TariffRuleForm from "@/components/forms/TariffRuleForm";

import {
  mapFormToTariffRulePayload,
  TariffRuleFormType,
} from "@/types/revenue/tariff-form";

import {
  useTariffVersion,
} from "@/hooks/revenue/revenueVersion.hook";

import {
  useCreateTariffRule,
} from "@/hooks/revenue/revenueTariffRule.hook";


// ---------------------------------------------------------------------------
// app/.../tariff-rules/new/page.tsx
// ---------------------------------------------------------------------------

export default function CreateTariffRulePage() {


  const {
    id: tariffVersionId,
  } = useParams<{ id:string }>();


  const router = useRouter();



  const {
    data,
    isLoading,
    isError,
  } = useTariffVersion(
    tariffVersionId
  );



  const tariffVersion =
    data?.data;



  const createMutation =
    useCreateTariffRule();



  const [isSubmitting,setIsSubmitting] =
    useState(false);





  const handleSubmit = async (
    form:TariffRuleFormType
  ) => {


    setIsSubmitting(true);


    try {


      await createMutation.mutateAsync({

        tariffVersionId,
      
        data:
          mapFormToTariffRulePayload(
            form,
            tariffVersionId
          )
      
      });



      toast.success(
        "Tariff rule created successfully."
      );



      router.push(
        `/office/dashboard/revenue-managements/tariff-versions/${tariffVersionId}`
      );



    } catch(error) {


      console.error(error);


      toast.error(
        "Failed to create tariff rule."
      );


    } finally {


      setIsSubmitting(false);

    }


  };





  if (isLoading) {

    return (

      <div className="flex h-64 items-center justify-center">

        Loading tariff version...

      </div>

    );

  }





  if (isError || !tariffVersion) {


    return (

      <div className="flex h-64 items-center justify-center text-red-500">

        Failed to load tariff version.

      </div>

    );

  }





  return (

    <TariffRuleForm

      mode="create"

      tariffVersion={tariffVersion}

      isSubmitting={
        isSubmitting ||
        createMutation.isPending
      }

      onSubmit={
        handleSubmit
      }

    />

  );

}