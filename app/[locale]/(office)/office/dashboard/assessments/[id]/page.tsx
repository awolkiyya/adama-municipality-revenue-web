"use client";

import {
  use,
  useMemo,
} from "react";

import {
  ArrowLeft,
  ClipboardList,
} from "lucide-react";

import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";

import { Button } from "@/components/ui/button";

import { FloatingParticles } from "@/components/design/FloatingParticles";

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
  useAssessment,
  useUpdateAssessment,
} from "@/hooks/revenue/assessment.hook";

import {
  AssessmentForm,
} from "@/components/revenue/assessment/assessment-form";


// =====================================================
// TYPES
// =====================================================

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};


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
// MAP API FIELD
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
                value: asString(
                  item.value ??
                    item.id ??
                    "",
                ),

                label: asString(
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
          helpText:
            description,
        }
      : {}),

    ...(unit
      ? {
          unit,
        }
      : {}),
  } as RevenueField;
};


// =====================================================
// MAP API SERVICE
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
// SUBMISSION RESULT ADAPTER
// =====================================================

/**
 * Converts the API response into the small result
 * contract expected by AssessmentForm.
 *
 * AssessmentForm expects:
 *
 * {
 *   message: string;
 *   referenceId: string;
 *   status:
 *     | "DRAFT_SAVED"
 *     | "SUBMITTED"
 *     | "UPDATED";
 * }
 */
const toSubmissionResult = (
  response: {
    message?: string;
    data?: unknown;
  },
  fallbackMessage: string,
  status:
    | "DRAFT_SAVED"
    | "SUBMITTED"
    | "UPDATED",
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

export default function EditAssessmentPage({
  params,
}: PageProps) {

  // ===================================================
  // ROUTE PARAMETER
  // ===================================================

  const {
    id,
  } = use(params);


  // ===================================================
  // EXISTING ASSESSMENT
  // ===================================================

  const {
    data:
      assessmentResponse,

    isLoading:
      assessmentLoading,

    isError:
      assessmentIsError,

    error:
      assessmentQueryError,

  } =
    useAssessment(
      id,
    );


  /*
   * The API returns:
   *
   * {
   *   success: true,
   *   message: "...",
   *   data: assessment
   * }
   *
   * AssessmentForm expects the actual assessment.
   */

  const assessment =
    assessmentResponse?.data ??
    null;


  const assessmentError =
    assessmentQueryError instanceof Error
      ? assessmentQueryError.message
      : assessmentIsError
        ? "Failed to load assessment."
        : null;


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
  // UPDATE ASSESSMENT MUTATION
  // ===================================================

  const {
    mutateAsync:
      updateAssessment,

    isPending:
      updateAssessmentPending,

  } =
    useUpdateAssessment();


  // ===================================================
  // BACK
  // ===================================================

  const handleBack =
    () => {

      window.history.back();

    };


  // ===================================================
  // SUBMIT UPDATE
  // ===================================================

  const handleSubmit =
    async (
      formData: FormData,
    ): Promise<SubmissionResult> => {

      /*
       * AssessmentForm creates FormData.
       *
       * The update hook/service handles:
       *
       * POST /assessments/{id}
       *
       * with:
       *
       * _method=PUT
       *
       * No JSON conversion.
       * No manual Content-Type.
       * No tariff calculation.
       */

      const response =
        await updateAssessment({
          id,
          data:
            formData,
        });


      return toSubmissionResult(
        response,
        "Assessment updated successfully.",
        "UPDATED",
      );
    };


  // ===================================================
  // SAVE DRAFT UPDATE
  // ===================================================

  const handleSaveDraft =
    async (
      formData: FormData,
    ): Promise<SubmissionResult> => {

      /*
       * Editing an existing assessment means
       * we UPDATE the existing record.
       *
       * Make sure the status is DRAFT.
       */

      formData.set(
        "status",
        "DRAFT",
      );


      const response =
        await updateAssessment({
          id,
          data:
            formData,
        });


      return toSubmissionResult(
        response,
        "Assessment draft saved successfully.",
        "DRAFT_SAVED",
      );
    };


  // ===================================================
  // LOADING
  // ===================================================

  if (
    assessmentLoading
  ) {

    return (
      <div className="m-auto max-w-5xl py-10">

        <div className="rounded-xl border bg-card p-8 text-center">

          <p className="text-sm text-muted-foreground">
            Loading assessment...
          </p>

        </div>

      </div>
    );
  }


  // ===================================================
  // ERROR
  // ===================================================

  if (
    assessmentError ||
    !assessment
  ) {

    return (
      <div className="m-auto max-w-5xl py-10">

        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">

          <p className="text-sm font-medium text-destructive">
            {
              assessmentError ??
              "Assessment not found."
            }
          </p>


          <Button
            className="mt-4"
            variant="outline"
            onClick={
              handleBack
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />

            Back
          </Button>

        </div>

      </div>
    );
  }


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
            Edit Revenue Assessment
          </IconBadge>
        }

        description={
          "Update the captured assessment information. Pricing and tariff resolution remain the responsibility of the backend Decision Provider."
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

        mode="edit"

        initialAssessment={
          assessment
        }

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