"use client";

import {
  useMemo,
} from "react";

import {
  ArrowLeft,
  ClipboardList,
} from "lucide-react";

import {
  Banner,
} from "@/components/banner/topBanner";

import {
  IconBadge,
} from "@/components/commen/icon-badge";

import {
  Button,
} from "@/components/ui/button";

import {
  FloatingParticles,
} from "@/components/design/FloatingParticles";

import {
  RevenueField,
  RevenueService,
  SubmissionResult,
} from "@/types/revenue/assessment";

import {
  RevenueService as ApiRevenueService,
  RevenueServiceField as ApiRevenueServiceField,
} from "@/types/revenue/revenu-service";

import {
  useCitizens,
} from "@/hooks/useCitizen.hook";

import {
  useRevenueServices,
} from "@/hooks/revenue/revenueService.hook";

import {
  useSaveAssessmentDraft,
  useSubmitAssessment,
} from "@/hooks/revenue/assessment.hook";

import {
  AssessmentForm,
} from "@/components/revenue/assessment/assessment-form";


// =====================================================
// HELPERS
// =====================================================

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


// =====================================================
// NORMALIZE FIELD TYPE
// =====================================================

/**
 * Convert the API/BaseField data type into the
 * RevenueField type expected by AssessmentForm.
 *
 * IMPORTANT:
 *
 * This function only controls input/presentation
 * behavior.
 *
 * It NEVER:
 *
 * - calculates money
 * - calculates tariffs
 * - calculates totals
 * - resolves pricing
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


// =====================================================
// MAP REVENUE SERVICE FIELD
// =====================================================

/**
 * Converts the real API RevenueServiceField into
 * the RevenueField structure expected by AssessmentForm.
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


  // ===================================================
  // VALIDATION RULES
  // ===================================================

  const validationRules =
    field.validationRules ??
    {};


  // ===================================================
  // FIELD TYPE
  // ===================================================

  const fieldType =
    normalizeFieldType(
      field,
    );


  // ===================================================
  // FIELD KEY
  // ===================================================

  const baseFieldKey =
    baseField?.code ??
    baseField?.name ??
    field.baseFieldId;


  // ===================================================
  // FIELD LABEL
  // ===================================================

  const baseFieldLabel =
    baseField?.name ??
    baseField?.code ??
    field.baseFieldId;


  const label =
    field.label?.trim() ||
    asString(
      baseFieldLabel,
    );


  // ===================================================
  // DESCRIPTION
  // ===================================================

  const description =
    field.helpText?.trim() ||
    baseField?.description?.trim() ||
    undefined;


  // ===================================================
  // MEASUREMENT UNIT
  // ===================================================

  const measurementUnit =
    baseField?.measurementUnit ??
    baseField?.measurement_unit ??
    null;


  const unit =
    measurementUnit?.symbol ??
    measurementUnit?.code ??
    measurementUnit?.name ??
    undefined;


  // ===================================================
  // OPTIONS
  // ===================================================

  const rawOptions =
    baseField?.options;


  const options =
    Array.isArray(
      rawOptions,
    )
      ? rawOptions

          .filter(
            (
              option,
            ) => {

              if (
                typeof option !==
                  "object" ||
                option === null
              ) {
                return false;
              }

              const item =
                option as Record<
                  string,
                  unknown
                >;

              return (
                item.isActive !==
                  false &&
                item.is_active !==
                  false
              );
            },
          )

          .sort(
            (
              a,
              b,
            ) => {

              const first =
                a as Record<
                  string,
                  unknown
                >;

              const second =
                b as Record<
                  string,
                  unknown
                >;

              return (
                Number(
                  first.sortOrder ??
                    first.sort_order ??
                    0,
                ) -
                Number(
                  second.sortOrder ??
                    second.sort_order ??
                    0,
                )
              );
            },
          )

          .map(
            (
              option,
            ) => {

              const item =
                option as Record<
                  string,
                  unknown
                >;

              return {
                value:
                  asString(
                    item.value ??
                      item.id ??
                      "",
                  ),

                label:
                  asString(
                    item.label ??
                      item.name ??
                      item.value ??
                      item.id ??
                      "",
                  ),
              };
            },
          )

          .filter(
            (
              option,
            ) =>
              option.value !==
              "",
          )

      : undefined;


  // ===================================================
  // RESULT
  // ===================================================

  return {

    id:
      field.id,

    key:
      asString(
        baseFieldKey,
      ),

    label,

    type:
      fieldType,

    required:
      Boolean(
        field.isRequired,
      ),

    min:
      validationRules.min,

    max:
      validationRules.max,

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


// =====================================================
// MAP API REVENUE SERVICE
// =====================================================

/**
 * Converts the real API RevenueService into the
 * RevenueService structure used by AssessmentForm.
 */
const mapRevenueService = (
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
    (
      service.fields ??
      []
    )

      .filter(
        (
          field,
        ) =>
          field.isActive !==
          false,
      )

      .sort(
        (
          a,
          b,
        ) =>
          Number(
            a.sortOrder ??
              0,
          ) -
          Number(
            b.sortOrder ??
              0,
          ),
      )

      .map(
        (
          field,
        ): RevenueField =>
          mapRevenueServiceField(
            field,
          ),
      );


  return {

    id:
      service.id,

    code:
      serviceCode,

    category,

    name:
      service.name,

    description:
      service.description ??
      "",

    collectionMode:
      service.collectionMode ??
      "",

    fields,
  };
};


// =====================================================
// SUBMISSION STATUS
// =====================================================

/**
 * AssessmentForm uses a UI-level submission status.
 *
 * Backend assessment statuses are different.
 *
 * Backend:
 *
 * DRAFT
 * PENDING_APPROVAL
 *
 * UI:
 *
 * DRAFT_SAVED
 * SUBMITTED
 * UPDATED
 */
type SubmissionStatus =
  SubmissionResult["status"];


// =====================================================
// NORMALIZE SUBMISSION STATUS
// =====================================================

/**
 * Convert backend Assessment status into the
 * SubmissionResult status expected by AssessmentForm.
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


// =====================================================
// SUBMISSION RESULT ADAPTER
// =====================================================

/**
 * The API returns ApiResponse<Assessment>,
 * while AssessmentForm expects SubmissionResult.
 *
 * This keeps the API response contract separate from
 * the form presentation contract.
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
      ? data as Record<
          string,
          unknown
        >
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
      asString(
        referenceId,
      ),

    status,
  };
};


// =====================================================
// PAGE
// =====================================================

export default function CreateAssessmentPage() {

  // ===================================================
  // CITIZENS / TAXPAYERS
  // ===================================================

  const {
    data:
      citizensData,

    isLoading:
      citizensLoading,

    isError:
      citizensError,
  } = useCitizens();


  const taxpayers =
    useMemo(
      () =>
        citizensData?.data ??
        [],

      [
        citizensData,
      ],
    );


  // ===================================================
  // REVENUE SERVICES
  // ===================================================

  const {
    data:
      revenueServicesData,

    isLoading:
      revenueServicesLoading,

    isError:
      revenueServicesError,

    refetch:
      refetchRevenueServices,

  } =
    useRevenueServices({

      is_active:
        true,

      per_page:
        100,

      page:
        1,

    });


  // ===================================================
  // MAP API SERVICES
  // ===================================================

  const revenueServices =
    useMemo<RevenueService[]>(
      () => {

        const apiServices =
          revenueServicesData?.data ??
          [];


        return apiServices.map(
          (
            service,
          ) =>
            mapRevenueService(
              service,
            ),
        );

      },
      [
        revenueServicesData,
      ],
    );


  // ===================================================
  // SUBMIT ASSESSMENT MUTATION
  // ===================================================

  const {
    mutateAsync:
      submitAssessment,

  } =
    useSubmitAssessment();


  // ===================================================
  // SAVE DRAFT MUTATION
  // ===================================================

  const {
    mutateAsync:
      saveAssessmentDraft,

  } =
    useSaveAssessmentDraft();


  // ===================================================
  // BACK
  // ===================================================

  const handleBack =
    () => {

      window.history.back();

    };


  // ===================================================
  // SUBMIT ASSESSMENT
  // ===================================================

  const handleSubmit =
    async (
      formData: FormData,
    ): Promise<SubmissionResult> => {

      /*
       * AssessmentForm already creates FormData.
       *
       * We pass it directly to the mutation.
       *
       * No JSON conversion.
       * No manual Content-Type.
       * No tariff calculation.
       */

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


  // ===================================================
  // SAVE DRAFT
  // ===================================================

  const handleSaveDraft =
    async (
      formData: FormData,
    ): Promise<SubmissionResult> => {

      /*
       * AssessmentForm already creates FormData.
       *
       * The dedicated draft mutation ensures that
       * the backend receives DRAFT status.
       */

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


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div className="m-auto max-w-5xl space-y-5">

      {/* =================================================
          HEADER
      ================================================= */}

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

        description={
          "Capture taxpayer and revenue-service information. Pricing and tariff resolution are handled by the backend Decision Provider."
        }

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

            onClick={
              handleBack
            }

          >

            <ArrowLeft className="mr-2 h-4 w-4" />

            Back to Assessments

          </Button>

        }

      />


      {/* =================================================
          ASSESSMENT FORM
      ================================================= */}

      <AssessmentForm

        taxpayers={
          taxpayers
        }

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

        onRetryRevenueServices={
          () =>
            refetchRevenueServices()
        }

        onSubmit={
          handleSubmit
        }

        onSaveDraft={
          handleSaveDraft
        }

        onBack={
          handleBack
        }

      />

    </div>

  );
}