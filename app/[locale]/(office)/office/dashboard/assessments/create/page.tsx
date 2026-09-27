"use client";

import { useMemo } from "react";

import {
  ArrowLeft,
  ClipboardList,
} from "lucide-react";

import { Banner } from "@/components/banner/topBanner";

import { IconBadge } from "@/components/commen/icon-badge";

import { Button } from "@/components/ui/button";

import { FloatingParticles } from "@/components/design/FloatingParticles";

import type {
  RevenueField,
  RevenueService,
  SubmissionResult,
} from "@/types/revenue/assessment";

import type {
  RevenueService as ApiRevenueService,
  RevenueServiceField as ApiRevenueServiceField,
} from "@/types/revenue/revenu-service";

import { useCitizens } from "@/hooks/useCitizen.hook";

import { useRevenueServices } from "@/hooks/revenue/revenueService.hook";

import {
  useSaveAssessmentDraft,
  useSubmitAssessment,
} from "@/hooks/revenue/assessment.hook";
import { AssessmentForm } from "@/components/revenue/assessment/assessment-form";


/**
 * Safely convert an unknown value to a string.
 */
const asString = (
  value: unknown,
): string => {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value);
};

/**
 * Normalize the API field type into the
 * RevenueField type expected by AssessmentForm.
 *
 * This function only controls field/input behavior.
 *
 * It does NOT:
 * - calculate money
 * - calculate tariffs
 * - calculate totals
 * - resolve pricing
 */
const normalizeFieldType = (
  field: ApiRevenueServiceField,
): RevenueField["type"] => {
  const baseField =
    field.baseField as
      | Record<string, unknown>
      | null
      | undefined;

  const rawType =
    baseField?.dataType ??
    baseField?.data_type ??
    baseField?.type ??
    baseField?.fieldType ??
    baseField?.field_type ??
    "TEXT";

  const normalized =
    String(rawType)
      .toUpperCase()
      .replace(
        /[\s-]+/g,
        "_",
      );

  switch (normalized) {
    case "NUMBER":
    case "INTEGER":
    case "INT":
      return "NUMBER";

    case "DECIMAL":
    case "FLOAT":
    case "DOUBLE":
    case "NUMERIC":
      return "DECIMAL";

    case "SELECT":
    case "DROPDOWN":
      return "SELECT";

    case "RADIO":
      return "RADIO";

    case "CHECKBOX":
    case "BOOLEAN":
    case "BOOL":
      return "CHECKBOX";

    case "DATE":
      return "DATE";

    case "TEXTAREA":
    case "LONG_TEXT":
      return "TEXTAREA";

    case "FILE":
      return "FILE";

    case "MULTI_FILE":
    case "MULTIPLE_FILE":
      return "MULTI_FILE";

    case "TEXT":
    case "STRING":
    default:
      return "TEXT";
  }
};

/**
 * Convert an API RevenueServiceField into the
 * RevenueField structure used by AssessmentForm.
 */
const mapRevenueServiceField = (
  field: ApiRevenueServiceField,
): RevenueField => {
  const baseField =
    field.baseField as
      | {
          id?: string;
          code?: string;
          name?: string;
          description?: string;

          dataType?: string;
          data_type?: string;
          type?: string;

          options?: unknown;

          measurementUnit?: {
            id?: string;
            code?: string;
            name?: string;
            symbol?: string;
          } | null;

          measurement_unit?: {
            id?: string;
            code?: string;
            name?: string;
            symbol?: string;
          } | null;
        }
      | null
      | undefined;

  const validationRules =
    field.validationRules ?? {};

  const fieldType =
    normalizeFieldType(field);

  const baseFieldKey =
    baseField?.code ??
    baseField?.name ??
    field.baseFieldId;

  const baseFieldLabel =
    baseField?.name ??
    baseField?.code ??
    field.baseFieldId;

  const label =
    field.label?.trim() ||
    asString(baseFieldLabel);

  const description =
    field.helpText?.trim() ||
    baseField?.description?.trim() ||
    undefined;

  const measurementUnit =
    baseField?.measurementUnit ??
    baseField?.measurement_unit ??
    null;

  const unit =
    measurementUnit?.symbol ??
    measurementUnit?.code ??
    measurementUnit?.name ??
    undefined;

  const rawOptions =
    baseField?.options;

  const options =
    Array.isArray(rawOptions)
      ? rawOptions
          .filter(
            (
              option,
            ): option is Record<
              string,
              unknown
            > =>
              typeof option ===
                "object" &&
              option !== null,
          )
          .sort(
            (a, b) =>
              Number(
                a.sortOrder ??
                  a.sort_order ??
                  0,
              ) -
              Number(
                b.sortOrder ??
                  b.sort_order ??
                  0,
              ),
          )
          .map(
            (option) => ({
              id: asString(
                option.id ??
                  option.value ??
                  "",
              ),

              value: asString(
                option.value ??
                  option.id ??
                  "",
              ),

              label: asString(
                option.label ??
                  option.name ??
                  option.value ??
                  option.id ??
                  "",
              ),

              sortOrder: Number(
                option.sortOrder ??
                  option.sort_order ??
                  0,
              ),

              isDefault:
                Boolean(
                  option.isDefault ??
                    option.is_default ??
                    false,
                ),
            }),
          )
          .filter(
            (option) =>
              option.value !== "",
          )
      : undefined;

  return {
    id: field.id,

    key: asString(
      baseFieldKey,
    ),

    label,

    type: fieldType,

    required: Boolean(
      field.isRequired,
    ),

    min: validationRules.min,

    max: validationRules.max,

    ...(options &&
    options.length > 0
      ? {
          options,
        }
      : {}),

    ...(description
      ? {
          description,
        }
      : {}),

    ...(unit
      ? {
          unit,
        }
      : {}),
  };
};

/**
 * Convert the API RevenueService into the
 * RevenueService structure consumed by AssessmentForm.
 *
 * This is only an adapter between API/domain shapes.
 * Financial calculation remains backend-owned.
 */
export const mapRevenueService = (
  service: ApiRevenueService,
): RevenueService => {
  const revenueCode =
    service.revenueCode;

  const serviceCode =
    revenueCode?.code ??
    service.id;

  const category =
    revenueCode?.name ??
    "Revenue Service";

  const fields: RevenueField[] =
    (service.fields ?? [])
      .filter(
        (field) =>
          field.isActive !== false,
      )
      .sort(
        (a, b) =>
          Number(
            a.sortOrder ?? 0,
          ) -
          Number(
            b.sortOrder ?? 0,
          ),
      )
      .map(
        (field) =>
          mapRevenueServiceField(
            field,
          ),
      );

  return {
    id: service.id,

    code: serviceCode,

    category,

    name: service.name,

    description:
      service.description ?? "",

    collectionMode:
      service.collectionMode ?? "",

    fields,
  };
};

type SubmissionStatus =
  SubmissionResult["status"];

/**
 * Convert backend assessment status into
 * the UI-level SubmissionResult status.
 */
const normalizeSubmissionStatus = (
  rawStatus: unknown,
  fallbackStatus: SubmissionStatus,
): SubmissionStatus => {
  if (
    typeof rawStatus !==
    "string"
  ) {
    return fallbackStatus;
  }

  const normalized =
    rawStatus
      .toUpperCase()
      .replace(
        /[\s-]+/g,
        "_",
      );

  switch (normalized) {
    case "DRAFT":
    case "DRAFT_SAVED":
      return "DRAFT_SAVED";

    case "PENDING_APPROVAL":
    case "SUBMITTED":
      return "SUBMITTED";

    case "UPDATED":
      return "UPDATED";

    default:
      return fallbackStatus;
  }
};

/**
 * Adapt the API response into the result contract
 * expected by AssessmentForm.
 */
const toSubmissionResult = (
  response: {
    message?: string;
    data?: unknown;
  },
  fallbackMessage: string,
  fallbackStatus: SubmissionStatus,
): SubmissionResult => {
  const data =
    response.data;

  const assessment =
    data &&
    typeof data === "object"
      ? (data as Record<
          string,
          unknown
        >)
      : {};

  const referenceId =
    assessment.referenceId ??
    assessment.reference_id ??
    assessment.id ??
    "";

  const status =
    normalizeSubmissionStatus(
      assessment.status,
      fallbackStatus,
    );

  return {
    message:
      response.message ??
      fallbackMessage,

    assessmentNumber:
      asString(referenceId),

    status,
  };
};

export default function CreateAssessmentPage() {
  /*
   * --------------------------------------------------------------------------
   * Taxpayers
   * --------------------------------------------------------------------------
   */

  const {
    data: citizensData,
    isLoading: citizensLoading,
    isError: citizensError,
  } = useCitizens();

  const taxpayers =
    useMemo(
      () =>
        citizensData?.data ?? [],
      [citizensData],
    );

  /*
   * --------------------------------------------------------------------------
   * Revenue services
   * --------------------------------------------------------------------------
   */

  const {
    data: revenueServicesData,

    isLoading:
      revenueServicesLoading,

    isError:
      revenueServicesError,

    refetch:
      refetchRevenueServices,
  } = useRevenueServices({
    is_active: true,
    per_page: 100,
    page: 1,
  });

  /*
   * --------------------------------------------------------------------------
   * Adapt API services to form services
   * --------------------------------------------------------------------------
   */

  const revenueServices =
    useMemo<RevenueService[]>(
      () => {
        const apiServices =
          revenueServicesData?.data ??
          [];

        return apiServices.map(
          (service) =>
            mapRevenueService(
              service,
            ),
        );
      },
      [revenueServicesData],
    );

  /*
   * --------------------------------------------------------------------------
   * Mutations
   * --------------------------------------------------------------------------
   */

  const {
    mutateAsync:
      submitAssessment,
  } = useSubmitAssessment();

  const {
    mutateAsync:
      saveAssessmentDraft,
  } = useSaveAssessmentDraft();

  /*
   * --------------------------------------------------------------------------
   * Navigation
   * --------------------------------------------------------------------------
   */

  const handleBack = () => {
    window.history.back();
  };

  /*
   * --------------------------------------------------------------------------
   * Submit
   * --------------------------------------------------------------------------
   */

  const handleSubmit = async (
    formData: FormData,
  ): Promise<SubmissionResult> => {
    const response =
      await submitAssessment(
        formData,
      );

    return toSubmissionResult(
      response,
      "Assessment submitted successfully.",
      "SUBMITTED",
    );
  };

  /*
   * --------------------------------------------------------------------------
   * Save draft
   * --------------------------------------------------------------------------
   */

  const handleSaveDraft = async (
    formData: FormData,
  ): Promise<SubmissionResult> => {
    const response =
      await saveAssessmentDraft(
        formData,
      );

    return toSubmissionResult(
      response,
      "Assessment draft saved successfully.",
      "DRAFT_SAVED",
    );
  };

  /*
   * --------------------------------------------------------------------------
   * Render
   * --------------------------------------------------------------------------
   */

  return (
    <div className="m-auto max-w-5xl space-y-5">
      <Banner
        badge={
          <IconBadge
            className="gap-2 rounded-full bg-black/20 p-3 text-[10px] text-white"
            icon={
              <ClipboardList className="h-4 w-4" />
            }
          >
            Revenue Assessment
          </IconBadge>
        }
        description="Capture taxpayer and revenue-service information. Pricing and tariff resolution are handled by the backend Decision Provider."
        background={
          <FloatingParticles
            color="#040404"
            count={35}
            speed={0.2}
            connectDistance={100}
            position="bottom-right"
          />
        }
        overlayClassName="bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50"
        className="text-white"
        actions={
          <Button
            type="button"
            variant="outline"
            className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white hover:text-primary"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assessments
          </Button>
        }
      />

      <AssessmentForm
        taxpayers={taxpayers}
        revenueServices={
          revenueServices
        }
        taxpayerLoading={
          citizensLoading
        }
        taxpayerError={
          citizensError
        }
        revenueServicesLoading={
          revenueServicesLoading
        }
        revenueServicesError={
          revenueServicesError
        }
        onRetryRevenueServices={() =>
          refetchRevenueServices()
        }
        onSubmit={handleSubmit}
        onSaveDraft={
          handleSaveDraft
        }
        onBack={handleBack}
      />
    </div>
  );
}