
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { useCitizens } from "@/hooks/useCitizen.hook";
import { useRevenueServices } from "@/hooks/revenue/revenueService.hook";

import { useExistingAgreement } from "@/hooks/useExistingAgreement";

import {
  useCreateExistingLizz,
  useUpdateExistingLizz,
} from "@/hooks/revenue/existing-lizz.hook";

import { ExistingAgreementHeader } from "@/components/assessment/ExistingAgreementHeader";
import { ExistingAgreementStepper } from "@/components/assessment/ExistingAgreementStepper";

import { AgreementInformationStep } from "@/components/assessment/AgreementInformationStep";
import { FinancialPositionStep } from "@/components/assessment/FinancialPositionStep";
import { ReviewRegisterStep } from "@/components/assessment/ReviewRegisterStep";

import { WhatHappensNext } from "@/components/assessment/WhatHappensNext";

import type { RevenueService } from "@/types/revenue/assessment";

import { mapRevenueService } from "@/app/[locale]/(office)/office/dashboard/assessments/create/page";

// ============================================================
// PROPS
// ============================================================

export type ExistingLizzFormProps = {
  /**
   * CREATE:
   * undefined
   *
   * EDIT:
   * existing assessment UUID
   */
  assessmentId?: string;

  /**
   * Preloaded assessment data.
   *
   * In EDIT mode this should normally come from the
   * parent page after fetching the assessment.
   *
   * Example:
   *
   * initialData={assessment.data}
   */
  initialData?: unknown;

  /**
   * Optional callback after successful operation.
   */
  onSuccess?: () => void;

  /**
   * Back navigation URL.
   */
  backUrl?: string;
};

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_BACK_URL =
  "/office/dashboard/assessments";

// ============================================================
// DEVELOPMENT LOGGING
// ============================================================

const isDevelopment =
  process.env.NODE_ENV === "development";

function devLog(
  message: string,
  data?: unknown,
) {
  if (!isDevelopment) {
    return;
  }

  if (data === undefined) {
    console.log(
      `[ExistingLizzForm] ${message}`,
    );

    return;
  }

  console.log(
    `[ExistingLizzForm] ${message}`,
    data,
  );
}

function devWarn(
  message: string,
  data?: unknown,
) {
  if (!isDevelopment) {
    return;
  }

  if (data === undefined) {
    console.warn(
      `[ExistingLizzForm] ${message}`,
    );

    return;
  }

  console.warn(
    `[ExistingLizzForm] ${message}`,
    data,
  );
}

function devError(
  message: string,
  data?: unknown,
) {
  if (!isDevelopment) {
    return;
  }

  if (data === undefined) {
    console.error(
      `[ExistingLizzForm] ${message}`,
    );

    return;
  }

  console.error(
    `[ExistingLizzForm] ${message}`,
    data,
  );
}

// ============================================================
// FORMDATA DEBUG HELPER
// ============================================================

function formDataToObject(
  formData: FormData,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  formData.forEach(
    (value, key) => {

      // ------------------------------------------------------
      // FILE
      // ------------------------------------------------------

      if (value instanceof File) {
        const fileMetadata = {
          type: "File",
          name: value.name,
          size: value.size,
          mimeType: value.type,
        };

        if (key in result) {
          const existing = result[key];

          if (Array.isArray(existing)) {
            existing.push(fileMetadata);
          } else {
            result[key] = [
              existing,
              fileMetadata,
            ];
          }

          return;
        }

        result[key] = fileMetadata;

        return;
      }

      // ------------------------------------------------------
      // DUPLICATE FIELD
      // ------------------------------------------------------

      if (key in result) {
        const existing = result[key];

        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          result[key] = [
            existing,
            value,
          ];
        }

        return;
      }

      result[key] = value;
    },
  );

  return result;
}

// ============================================================
// COMPONENT
// ============================================================

export default function ExistingLizzForm({
  assessmentId,
  initialData,
  onSuccess,
  backUrl = DEFAULT_BACK_URL,
}: ExistingLizzFormProps) {
  const router = useRouter();

  // ==========================================================
  // MODE
  // ==========================================================

  const isEditMode =
    Boolean(assessmentId);

  const hasInitialData =
    initialData !== undefined &&
    initialData !== null;

  // ==========================================================
  // INITIAL DEBUG
  // ==========================================================

  devLog(
    "render",
    {
      mode: isEditMode
        ? "EDIT"
        : "CREATE",

      assessmentId,

      hasInitialData,

      initialDataType:
        typeof initialData,

      initialDataKeys:
        initialData &&
        typeof initialData === "object"
          ? Object.keys(
              initialData as Record<
                string,
                unknown
              >,
            )
          : [],

      backUrl,
    },
  );

  // ==========================================================
  // EDIT DATA SAFETY
  // ==========================================================
  //
  // EDIT mode must receive initialData from the parent page.
  //
  // CREATE mode must not require initialData.
  //
  // We intentionally do NOT fetch the assessment here.
  // The route/page owns assessment loading.
  // ==========================================================

  const editDataMissing =
    isEditMode &&
    !hasInitialData;

  if (editDataMissing) {
    devWarn(
      "EDIT mode detected but initialData has not been provided yet.",
      {
        assessmentId,
      },
    );
  }

  // ==========================================================
  // MUTATIONS
  // ==========================================================

  const createExistingLizz =
    useCreateExistingLizz();

  const updateExistingLizz =
    useUpdateExistingLizz();

  const isSubmitting =
    createExistingLizz.isPending ||
    updateExistingLizz.isPending;

  // ==========================================================
  // TAXPAYERS
  // ==========================================================

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

  devLog(
    "taxpayer data state",
    {
      loading: citizensLoading,
      error: citizensError,
      total: taxpayers.length,
    },
  );

  // ==========================================================
  // REVENUE SERVICES
  // ==========================================================

  const {
    data: revenueServicesData,
    isLoading: revenueServicesLoading,
    isError: revenueServicesError,
  } = useRevenueServices({
    is_active: true,
    per_page: 100,
    page: 1,
  });

  devLog(
    "revenue service data state",
    {
      loading: revenueServicesLoading,
      error: revenueServicesError,
      total:
        revenueServicesData?.data?.length ?? 0,
    },
  );

  // ==========================================================
  // LIZZ REVENUE SERVICES
  // ==========================================================

  const revenueServices =
    useMemo<RevenueService[]>(
      () => {
        const allServices =
          revenueServicesData?.data ?? [];

        const lizzServices =
          allServices
            .filter(
              (service) =>
                service.revenueCode?.code ===
                "1731",
            )
            .map(
              mapRevenueService,
            );

        devLog(
          "LIZZ revenue services mapped",
          {
            allServicesCount:
              allServices.length,

            lizzServicesCount:
              lizzServices.length,

            lizzServiceIds:
              lizzServices.map(
                (service) =>
                  service.id,
              ),
          },
        );

        return lizzServices;
      },
      [revenueServicesData],
    );

  // ==========================================================
  // FORM WORKFLOW
  // ==========================================================

  const {
    currentStep,

    nextStep,
    previousStep,
    goToStep,

    agreement,
    updateAgreement,

    financial,
    updateFinancial,

    selectedTaxpayer,
    selectTaxpayer,

    selectedRevenueService,
    revenueCode,
    selectRevenueService,

    serviceFieldValues,
    validationErrors,

    setServiceFieldValue,
    handleFileChange,
    removeFile,
    removeService,

    outstandingBalance,

    validateAll,
    buildFormData,
  } = useExistingAgreement({
    taxpayers,
    revenueServices,
    assessmentId,
    initialData,
  });

  // ==========================================================
  // FORM STATE DEBUG
  // ==========================================================

  devLog(
    "form state",
    {
      mode: isEditMode
        ? "EDIT"
        : "CREATE",

      assessmentId,

      hasInitialData,

      currentStep,

      agreement: {
        taxpayerId:
          agreement.taxpayerId,

        revenueServiceId:
          agreement.revenueServiceId,

        hasSource:
          Boolean(
            agreement.source,
          ),

        hasNotes:
          Boolean(
            agreement.notes,
          ),
      },

      financial: {
        hasOriginalObligation:
          Boolean(
            financial.originalObligation,
          ),

        hasAmountAlreadyPaid:
          Boolean(
            financial.amountAlreadyPaid,
          ),

        balanceAsOfDate:
          financial.balanceAsOfDate,
      },

      selectedTaxpayerId:
        selectedTaxpayer?.id ?? null,

      selectedRevenueServiceId:
        selectedRevenueService?.id ?? null,

      revenueCode,

      serviceFieldServiceIds:
        Object.keys(
          serviceFieldValues,
        ),

      validationErrorCount:
        Object.values(
          validationErrors,
        ).length,

      outstandingBalance,

      isSubmitting,
    },
  );

  // ==========================================================
  // REVIEW ERRORS
  // ==========================================================

  const reviewErrors =
    useMemo(() => {
      const errors: string[] = [];

      // ------------------------------------------------------
      // AGREEMENT
      // ------------------------------------------------------

      const agreementErrors =
        validationErrors.agreement ?? {};

      Object.values(
        agreementErrors,
      ).forEach(
        (error) => {
          if (
            typeof error === "string" &&
            error.trim() !== ""
          ) {
            errors.push(error);
          }
        },
      );

      // ------------------------------------------------------
      // FINANCIAL
      // ------------------------------------------------------

      const financialErrors =
        validationErrors.financial ?? {};

      Object.values(
        financialErrors,
      ).forEach(
        (error) => {
          if (
            typeof error === "string" &&
            error.trim() !== ""
          ) {
            errors.push(error);
          }
        },
      );

      // ------------------------------------------------------
      // SERVICE
      // ------------------------------------------------------

      const serviceErrors =
        validationErrors.service ?? {};

      Object.values(
        serviceErrors,
      ).forEach(
        (fieldErrors) => {
          if (
            !fieldErrors ||
            typeof fieldErrors !== "object"
          ) {
            return;
          }

          Object.values(
            fieldErrors,
          ).forEach(
            (error) => {
              if (
                typeof error === "string" &&
                error.trim() !== ""
              ) {
                errors.push(error);
              }
            },
          );
        },
      );

      return Array.from(
        new Set(errors),
      );
    }, [
      validationErrors,
    ]);

  devLog(
    "review validation state",
    {
      count: reviewErrors.length,
    },
  );

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  function handleBack() {
    devLog(
      "back navigation",
      {
        mode: isEditMode
          ? "EDIT"
          : "CREATE",

        assessmentId,

        backUrl,
      },
    );

    router.push(
      backUrl,
    );
  }

  function handleContinue() {
    devLog(
      "continue",
      {
        currentStep,
        assessmentId,
        isEditMode,
      },
    );

    nextStep();
  }

  function handlePrevious() {
    devLog(
      "previous",
      {
        currentStep,
        assessmentId,
        isEditMode,
      },
    );

    previousStep();
  }

  // ==========================================================
  // SUBMIT
  // ==========================================================

  function handleRegisterAgreement() {
    devLog(
      "submission started",
      {
        mode: isEditMode
          ? "EDIT"
          : "CREATE",

        assessmentId,

        currentStep,
      },
    );

    // --------------------------------------------------------
    // EDIT DATA GUARD
    // --------------------------------------------------------

    if (
      isEditMode &&
      !hasInitialData
    ) {
      devWarn(
        "Submission blocked because edit data has not loaded.",
        {
          assessmentId,
        },
      );

      return;
    }

    // --------------------------------------------------------
    // VALIDATE
    // --------------------------------------------------------

    const isValid =
      validateAll();

    devLog(
      "validation result",
      {
        isValid,
      },
    );

    if (!isValid) {
      devWarn(
        "submission blocked by validation",
        {
          validationErrors,
        },
      );

      return;
    }

    // --------------------------------------------------------
    // BUILD FORMDATA
    // --------------------------------------------------------

    const formData =
      buildFormData();

    if (isDevelopment) {
      devLog(
        "FormData payload",
        formDataToObject(
          formData,
        ),
      );
    }

    // ========================================================
    // UPDATE
    // ========================================================

    if (
      isEditMode &&
      assessmentId
    ) {
      devLog(
        "sending UPDATE request",
        {
          assessmentId,
          endpoint:
            `/existing-lizz/${assessmentId}`,
        },
      );

      updateExistingLizz.mutate(
        {
          id: assessmentId,
          data: formData,
        },
        {
          onSuccess: (
            response,
          ) => {
            devLog(
              "UPDATE successful",
              {
                assessmentId,
                response,
              },
            );

            if (onSuccess) {
              onSuccess();

              return;
            }

            router.push(
              backUrl,
            );
          },

          onError: (
            error,
          ) => {
            devError(
              "UPDATE failed",
              {
                assessmentId,
                error,
              },
            );
          },
        },
      );

      return;
    }

    // ========================================================
    // CREATE
    // ========================================================

    devLog(
      "sending CREATE request",
      {
        endpoint:
          "/existing-lizz",
      },
    );

    createExistingLizz.mutate(
      formData,
      {
        onSuccess: (
          response,
        ) => {
          devLog(
            "CREATE successful",
            {
              response,
            },
          );

          if (onSuccess) {
            onSuccess();

            return;
          }

          router.push(
            backUrl,
          );
        },

        onError: (
          error,
        ) => {
          devError(
            "CREATE failed",
            {
              error,
            },
          );
        },
      },
    );
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  const isLoading =
    citizensLoading ||
    revenueServicesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/20">
        <div
          className="
            mx-auto
            flex
            min-h-screen
            w-full
            max-w-7xl
            items-center
            justify-center
            px-4
            py-6
            sm:px-6
            lg:px-8
          "
        >
          <div
            className="
              w-full
              max-w-md
              rounded-xl
              border
              bg-background
              p-6
              shadow-sm
            "
          >
            <div className="space-y-4 text-center">
              <div
                className="
                  mx-auto
                  h-8
                  w-8
                  animate-spin
                  rounded-full
                  border-2
                  border-muted
                  border-t-primary
                "
              />

              <div className="space-y-1">
                <h2 className="text-sm font-semibold">
                  {isEditMode
                    ? "Loading existing LIZZ"
                    : "Loading agreement data"}
                </h2>

                <p className="text-sm text-muted-foreground">
                  {isEditMode
                    ? "Preparing the existing agreement..."
                    : "Loading taxpayers and revenue services..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // DATA ERROR
  // ==========================================================

  if (
    citizensError ||
    revenueServicesError
  ) {
    devError(
      "required form data failed to load",
      {
        citizensError,
        revenueServicesError,
      },
    );

    return (
      <div className="min-h-screen bg-muted/20">
        <div
          className="
            mx-auto
            flex
            min-h-screen
            w-full
            max-w-7xl
            items-center
            justify-center
            px-4
            py-6
            sm:px-6
            lg:px-8
          "
        >
          <div
            className="
              w-full
              max-w-lg
              rounded-xl
              border
              bg-background
              p-6
              shadow-sm
            "
          >
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold">
                  Unable to load agreement data
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  The taxpayer or revenue service data
                  could not be loaded. Please try again.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    router.refresh()
                  }
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // EDIT DATA GUARD
  // ==========================================================
  //
  // The parent page fetches the assessment.
  //
  // Do not render the editable form with empty defaults while
  // waiting for initialData.
  //
  // This prevents an important UX/data issue:
  //
  //     API loading
  //          ↓
  //     empty form rendered
  //          ↓
  //     user sees blank fields
  //          ↓
  //     hydration happens later
  //
  // Instead, wait until the assessment is actually available.
  // ==========================================================

  if (editDataMissing) {
    return (
      <div className="min-h-screen bg-muted/20">
        <div
          className="
            mx-auto
            flex
            min-h-screen
            w-full
            max-w-7xl
            items-center
            justify-center
            px-4
            py-6
            sm:px-6
            lg:px-8
          "
        >
          <div
            className="
              w-full
              max-w-md
              rounded-xl
              border
              bg-background
              p-6
              shadow-sm
            "
          >
            <div className="space-y-4 text-center">
              <div
                className="
                  mx-auto
                  h-8
                  w-8
                  animate-spin
                  rounded-full
                  border-2
                  border-muted
                  border-t-primary
                "
              />

              <div className="space-y-1">
                <h2 className="text-sm font-semibold">
                  Loading existing LIZZ
                </h2>

                <p className="text-sm text-muted-foreground">
                  Loading the existing agreement data...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="min-h-screen bg-muted/20">
      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          px-4
          py-6
          sm:px-6
          lg:px-8
        "
      >
        <div className="space-y-6">

          {/* ==================================================
              HEADER
          ================================================== */}

          <ExistingAgreementHeader
            onBack={handleBack}
            isEditMode={isEditMode}
          />

          {/* ==================================================
              STEPPER
          ================================================== */}

          <ExistingAgreementStepper
            currentStep={currentStep}
            onStepChange={goToStep}
          />

          {/* ==================================================
              MAIN CONTENT
          ================================================== */}

          <div
            className="
              grid
              gap-6
              lg:grid-cols-[minmax(0,1fr)_320px]
            "
          >
            {/* ==================================================
                FORM
            ================================================== */}

            <main className="min-w-0">

              {/* ==================================================
                  STEP 1
              ================================================== */}

              {currentStep === 1 && (
                <AgreementInformationStep
                  agreement={agreement}

                  updateAgreement={
                    updateAgreement
                  }

                  selectedTaxpayer={
                    selectedTaxpayer
                  }

                  taxpayers={
                    taxpayers
                  }

                  onSelectTaxpayer={
                    selectTaxpayer
                  }

                  revenueServices={
                    revenueServices
                  }

                  onRevenueServiceChange={
                    selectRevenueService
                  }

                  serviceFieldValues={
                    serviceFieldValues
                  }

                  validationErrors={
                    validationErrors
                  }

                  setServiceFieldValue={
                    setServiceFieldValue
                  }

                  handleFileChange={
                    handleFileChange
                  }

                  removeFile={
                    removeFile
                  }

                  removeService={
                    removeService
                  }
                />
              )}

              {/* ==================================================
                  STEP 2
              ================================================== */}

              {currentStep === 2 && (
                <FinancialPositionStep
                  financial={financial}

                  updateFinancial={
                    updateFinancial
                  }

                  outstandingBalance={
                    outstandingBalance
                  }

                  validationErrors={
                    validationErrors.financial ?? {}
                  }
                />
              )}

              {/* ==================================================
                  STEP 3
              ================================================== */}

              {currentStep === 3 && (
                <ReviewRegisterStep
                  agreement={agreement}

                  financial={financial}

                  selectedTaxpayer={
                    selectedTaxpayer
                  }

                  selectedRevenueService={
                    selectedRevenueService
                  }

                  revenueCode={
                    revenueCode
                  }

                  outstandingBalance={
                    outstandingBalance
                  }

                  onEditStep={
                    goToStep
                  }

                  serviceFieldValues={
                    serviceFieldValues
                  }

                  errors={
                    reviewErrors
                  }
                />
              )}

              {/* ==================================================
                  WORKFLOW ACTIONS
              ================================================== */}

              <div
                className="
                  mt-6
                  flex
                  flex-col-reverse
                  gap-3
                  border-t
                  pt-5
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                {/* ==================================================
                    PREVIOUS
                ================================================== */}

                <div>
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={
                        handlePrevious
                      }
                      disabled={
                        isSubmitting
                      }
                    >
                      Previous
                    </Button>
                  )}
                </div>

                {/* ==================================================
                    NEXT / SUBMIT
                ================================================== */}

                <div
                  className="
                    flex
                    flex-col
                    gap-2
                    sm:flex-row
                  "
                >
                  {currentStep < 3 && (
                    <Button
                      type="button"
                      onClick={
                        handleContinue
                      }
                      disabled={
                        isSubmitting
                      }
                    >
                      Continue
                    </Button>
                  )}

                  {currentStep === 3 && (
                    <Button
                      type="button"
                      onClick={
                        handleRegisterAgreement
                      }
                      disabled={
                        isSubmitting
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <span
                            className="
                              mr-2
                              h-4
                              w-4
                              animate-spin
                              rounded-full
                              border-2
                              border-current
                              border-t-transparent
                            "
                          />

                          {isEditMode
                            ? "Updating..."
                            : "Registering..."}
                        </>
                      ) : isEditMode ? (
                        "Update Agreement"
                      ) : (
                        "Register Agreement"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </main>

            {/* ==================================================
                SIDEBAR
            ================================================== */}

            <aside
              className="
                space-y-4
                lg:sticky
                lg:top-6
                lg:self-start
              "
            >
              <WhatHappensNext />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
