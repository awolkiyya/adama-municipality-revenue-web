"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";

import {
  mapFormToTariffRulePayload,
  mapRuleToFormShape,
  TariffRuleFormType,
} from "@/types/revenue/tariff-form";

import TariffRuleForm from "@/components/forms/TariffRuleForm";

import {
  useTariffRule,
  useUpdateTariffRule,
} from "@/hooks/revenue/revenueTariffRule.hook";

import { useTariffVersion } from "@/hooks/revenue/revenueVersion.hook";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EditTariffRulePage() {
  const params = useParams<{
    ruleId: string;
    id: string;
    locale?: string;
  }>();

  const router = useRouter();

  // -------------------------------------------------------------------------
  // Route IDs
  // -------------------------------------------------------------------------

  const tariffVersionId = params.id;
  const ruleId = params.ruleId;
  const locale = params.locale;

  // -------------------------------------------------------------------------
  // Load Tariff Version
  // -------------------------------------------------------------------------

  const {
    data: tariffVersionResponse,
    isLoading: isTariffVersionLoading,
    isError: isTariffVersionError,
  } = useTariffVersion(tariffVersionId);

  const tariffVersion =
    tariffVersionResponse?.data;

  // -------------------------------------------------------------------------
  // Load Tariff Rule
  // -------------------------------------------------------------------------

  const {
    data: tariffRuleResponse,
    isLoading: isTariffRuleLoading,
    isError: isTariffRuleError,
  } = useTariffRule(
    ruleId,
    tariffVersionId
  );

  const rule =
    tariffRuleResponse?.data;

  // -------------------------------------------------------------------------
  // Update Mutation
  // -------------------------------------------------------------------------

  const updateMutation =
    useUpdateTariffRule();

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  const isLoading =
    isTariffVersionLoading ||
    isTariffRuleLoading;

  // -------------------------------------------------------------------------
  // Error
  // -------------------------------------------------------------------------

  const isError =
    isTariffVersionError ||
    isTariffRuleError;

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  const handleSubmit = async (
    form: TariffRuleFormType
  ) => {
    setIsSubmitting(true);

    try {
      /*
      |--------------------------------------------------------------------------
      | Convert form state into API payload
      |--------------------------------------------------------------------------
      |
      | Form:
      |
      |   serviceId
      |   tariffVersionId
      |   calculationType
      |   baseFieldId
      |
      | API:
      |
      |   service_id
      |   tariff_version_id
      |   calculation_type
      |   base_field_id
      |
      | mapFormToTariffRulePayload() also validates
      | calculation_type so "" cannot reach the API.
      |
      */

      const payload =
        mapFormToTariffRulePayload(
          form,
          tariffVersionId
        );

      /*
      |--------------------------------------------------------------------------
      | Update RULE
      |--------------------------------------------------------------------------
      |
      | IMPORTANT:
      |
      | id = ruleId
      |
      | NOT tariffVersionId.
      |
      */

      await updateMutation.mutateAsync({
        id: ruleId,

        data: payload,
      });

      /*
      |--------------------------------------------------------------------------
      | Navigate back
      |--------------------------------------------------------------------------
      */

      router.push(
        locale
          ? `/${locale}/office/dashboard/revenue-managements/tariff-versions/${tariffVersionId}`
          : `/office/dashboard/revenue-managements/tariff-versions/${tariffVersionId}`
      );
    } catch (error) {
      console.error(
        "Failed to update tariff rule:",
        error
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Loading State
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 md:px-6">
        <Skeleton className="h-9 w-72" />

        <Skeleton className="h-5 w-96" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="hidden h-96 lg:col-span-3 lg:block" />

          <Skeleton className="h-96 lg:col-span-6" />

          <Skeleton className="hidden h-96 lg:col-span-3 lg:block" />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Error / Missing Data
  // -------------------------------------------------------------------------

  if (
    isError ||
    !rule ||
    !tariffVersion
  ) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center">
        <AlertTriangle className="h-6 w-6 text-destructive" />

        <p className="font-semibold">
          Couldn't load this rule
        </p>

        <p className="text-sm text-muted-foreground">
          The tariff rule or tariff version
          could not be loaded. It may have been
          deleted, or there was a problem
          reaching the server.
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Existing Rule -> Form
  // -------------------------------------------------------------------------

  const initialData =
    mapRuleToFormShape(rule);

  // -------------------------------------------------------------------------
  // Sibling Rules
  // -------------------------------------------------------------------------

  const existingRules =
    rule.siblingRules?.filter(
      (sibling) =>
        sibling.id !== ruleId
    ) ?? [];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <TariffRuleForm
      mode="update"

      /*
      |--------------------------------------------------------------------------
      | Existing values
      |--------------------------------------------------------------------------
      */

      initialData={initialData}

      /*
      |--------------------------------------------------------------------------
      | Initial relationships
      |--------------------------------------------------------------------------
      */

      initialSelections={{
        baseField: rule.baseField,
        unit: rule.unit,
        service: rule.service,
      }}

      /*
      |--------------------------------------------------------------------------
      | Sibling rules
      |--------------------------------------------------------------------------
      */

      existingRules={existingRules}

      /*
      |--------------------------------------------------------------------------
      | Submit state
      |--------------------------------------------------------------------------
      */

      isSubmitting={
        isSubmitting ||
        updateMutation.isPending
      }

      /*
      |--------------------------------------------------------------------------
      | Submit
      |--------------------------------------------------------------------------
      */

      onSubmit={handleSubmit}

      /*
      |--------------------------------------------------------------------------
      | Tariff Version
      |--------------------------------------------------------------------------
      */

      tariffVersion={tariffVersion}
    />
  );
}