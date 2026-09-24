"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

import { useCitizens } from "@/hooks/useCitizen.hook"
import { useRevenueServices } from "@/hooks/revenue/revenueService.hook"

import { useExistingAgreement } from "@/hooks/useExistingAgreement"

import {
  useCreateExistingLizz,
  useUpdateExistingLizz,
} from "@/hooks/revenue/existing-lizz.hook"

import { ExistingAgreementHeader } from "@/components/assessment/ExistingAgreementHeader"
import { ExistingAgreementStepper } from "@/components/assessment/ExistingAgreementStepper"

import { AgreementInformationStep } from "@/components/assessment/AgreementInformationStep"
import { FinancialPositionStep } from "@/components/assessment/FinancialPositionStep"
import { ReviewRegisterStep } from "@/components/assessment/ReviewRegisterStep"

import { WhatHappensNext } from "@/components/assessment/WhatHappensNext"

import type {
  RevenueService,
} from "@/types/revenue/assessment"

import { mapRevenueService } from "@/app/[locale]/(office)/office/dashboard/assessments/create/page"


// ============================================================
// PROPS
// ============================================================

export type ExistingLizzFormProps = {

  /**
   * CREATE
   *
   * No assessment ID.
   *
   * EDIT
   *
   * Existing assessment ID.
   */
  assessmentId?: string

  /**
   * Initial data loaded from the backend.
   *
   * Used primarily by edit mode.
   */
  initialData?: unknown

  /**
   * Optional callback after successful registration.
   *
   * If provided, the parent can control what happens
   * after the API operation succeeds.
   */
  onSuccess?: () => void

  /**
   * Optional back URL.
   */
  backUrl?: string
}


// ============================================================
// COMPONENT
// ============================================================

export default function ExistingLizzForm({
  assessmentId,
  initialData,
  onSuccess,
  backUrl,
}: ExistingLizzFormProps) {

  const router = useRouter()


  // ============================================================
  // MODE
  // ============================================================

  const isEditMode =
    Boolean(assessmentId)


  // ============================================================
  // API MUTATIONS
  // ============================================================

  /*
   * CREATE
   *
   * POST /existing-lizz
   *
   * The mutation is responsible for:
   *
   * - API request
   * - cache invalidation
   * - success toast
   * - navigation
   */
  const createExistingLizz =
    useCreateExistingLizz()


  /*
   * UPDATE
   *
   * POST /existing-lizz/{id}
   * with _method=PUT
   *
   * The mutation is responsible for:
   *
   * - API request
   * - cache invalidation
   * - success toast
   */
  const updateExistingLizz =
    useUpdateExistingLizz()


  /*
   * Whether the final API request is currently
   * being processed.
   */
  const isSubmitting =
    createExistingLizz.isPending ||
    updateExistingLizz.isPending


  // ============================================================
  // CITIZENS / TAXPAYERS
  // ============================================================

  const {
    data: citizensData,
    isLoading: citizensLoading,
    isError: citizensError,
  } = useCitizens()


  const taxpayers =
    useMemo(
      () =>
        citizensData?.data ?? [],
      [citizensData],
    )


  // ============================================================
  // REVENUE SERVICES
  // ============================================================

  const {
    data: revenueServicesData,
    isLoading: revenueServicesLoading,
    isError: revenueServicesError,
  } = useRevenueServices({
    is_active: true,
    per_page: 100,
    page: 1,
  })


  /*
   * Existing LIZZ uses revenue service
   * 1731.
   *
   * We map the API response into the
   * RevenueService shape used by the
   * existing agreement components.
   */
  const revenueServices =
    useMemo<RevenueService[]>(
      () =>
        (
          revenueServicesData?.data ?? []
        )
          .filter(
            (service) =>
              service.revenueCode?.code ===
              "1731",
          )
          .map(
            mapRevenueService,
          ),

      [revenueServicesData],
    )


  // ============================================================
  // EXISTING LIZZ FORM WORKFLOW
  // ============================================================

  /*
   * IMPORTANT:
   *
   * useExistingAgreement is now responsible ONLY for
   * the form workflow.
   *
   * It handles:
   *
   * - form state
   * - taxpayer selection
   * - revenue service selection
   * - dynamic service fields
   * - financial values
   * - validation
   * - wizard navigation
   * - file state
   * - outstanding balance
   * - FormData construction
   *
   * It does NOT perform the API mutation.
   *
   * API operations are handled by:
   *
   * - useCreateExistingLizz()
   * - useUpdateExistingLizz()
   */
  const {
    currentStep,

    nextStep,
    previousStep,
    goToStep,

    resetForm,

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

    /*
     * Validate the entire wizard.
     *
     * This should validate:
     *
     * Step 1:
     * - taxpayer
     * - revenue service
     * - dynamic service fields
     *
     * Step 2:
     * - original obligation
     * - amount already paid
     * - overpayment
     */
    validateAll,

    /*
     * Converts the current form state into
     * the FormData expected by Laravel.
     */
    buildFormData,

  } = useExistingAgreement({

    taxpayers,

    revenueServices,

    /*
     * Edit information.
     *
     * In CREATE mode:
     *
     * assessmentId = undefined
     *
     * In EDIT mode:
     *
     * assessmentId = existing assessment UUID
     */
    assessmentId,

    initialData,

  })


  // ============================================================
  // VALIDATION ERROR LIST FOR REVIEW STEP
  // ============================================================

  /*
   * ReviewRegisterStep expects:
   *
   * errors?: string[]
   *
   * Our form validation is structured:
   *
   * {
   *   agreement: {...},
   *   financial: {...},
   *   service: {
   *     serviceId: {
   *       fieldId: "..."
   *     }
   *   }
   * }
   *
   * Therefore we flatten the structured errors
   * into human-readable strings for Step 3.
   */
  const reviewErrors =
    useMemo(() => {

      const errors: string[] = []


      // --------------------------------------------------------
      // AGREEMENT ERRORS
      // --------------------------------------------------------

      const agreementErrors =
        validationErrors.agreement ?? {}

      Object.values(
        agreementErrors,
      ).forEach(
        (error) => {

          if (
            typeof error === "string" &&
            error.trim() !== ""
          ) {
            errors.push(error)
          }

        },
      )


      // --------------------------------------------------------
      // FINANCIAL ERRORS
      // --------------------------------------------------------

      const financialErrors =
        validationErrors.financial ?? {}

      Object.values(
        financialErrors,
      ).forEach(
        (error) => {

          if (
            typeof error === "string" &&
            error.trim() !== ""
          ) {
            errors.push(error)
          }

        },
      )


      // --------------------------------------------------------
      // SERVICE FIELD ERRORS
      // --------------------------------------------------------

      const serviceErrors =
        validationErrors.service ?? {}

      Object.values(
        serviceErrors,
      ).forEach(
        (fieldErrors) => {

          if (
            !fieldErrors ||
            typeof fieldErrors !== "object"
          ) {
            return
          }

          Object.values(
            fieldErrors,
          ).forEach(
            (error) => {

              if (
                typeof error === "string" &&
                error.trim() !== ""
              ) {
                errors.push(error)
              }

            },
          )

        },
      )


      /*
       * Remove duplicates.
       */
      return Array.from(
        new Set(errors),
      )

    }, [
      validationErrors,
    ])


  // ============================================================
  // NAVIGATION
  // ============================================================

  function handleBack() {

    if (backUrl) {

      router.push(
        backUrl,
      )

      return
    }

    router.back()
  }


  function handleContinue() {

    /*
     * nextStep() is responsible for validating
     * the current step before moving forward.
     */
    nextStep()
  }


  function handlePrevious() {

    previousStep()
  }


  // ============================================================
  // CREATE / UPDATE
  // ============================================================

  function handleRegisterAgreement() {

    /*
     * First validate the entire form.
     *
     * This prevents Step 3 from bypassing
     * validation.
     */
    const isValid =
      validateAll()

    if (!isValid) {

      return
    }


    /*
     * Build the multipart request.
     *
     * This should contain:
     *
     * taxpayer_id
     * revenue_service_id
     * service_fields
     * source
     * notes
     * original_obligation
     * amount_already_paid
     *
     * balance_as_of_date is intentionally NOT included.
     */
    const formData =
      buildFormData()


    // ==========================================================
    // EDIT
    // ==========================================================

    if (
      isEditMode &&
      assessmentId
    ) {

      updateExistingLizz.mutate({
        id: assessmentId,
        data: formData,
      })

      return
    }


    // ==========================================================
    // CREATE
    // ==========================================================

    createExistingLizz.mutate(
      formData,
      {
        onSuccess: () => {

          /*
           * If the parent supplied a callback,
           * allow it to run after successful creation.
           */
          if (onSuccess) {

            onSuccess()

          }

        },
      },
    )
  }


  // ============================================================
  // REGISTER ANOTHER
  // ============================================================

  function handleResetForm() {

    /*
     * Reset the local form state.
     */
    resetForm()

  }


  // ============================================================
  // DONE
  // ============================================================

  function handleSuccess() {

    if (onSuccess) {

      onSuccess()

      return
    }

    router.push(
      "/office/dashboard/revenue/existing-lizz",
    )
  }


  // ============================================================
  // LOADING
  // ============================================================

  const isLoading =
    citizensLoading ||
    revenueServicesLoading


  if (isLoading) {

    return (
      <div className="min-h-screen bg-muted/20">

        <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8">

          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">

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

                  Loading taxpayers and revenue
                  services...

                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
    )
  }


  // ============================================================
  // ERROR
  // ============================================================

  if (
    citizensError ||
    revenueServicesError
  ) {

    return (
      <div className="min-h-screen bg-muted/20">

        <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8">

          <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-sm">

            <div className="space-y-4">

              <div>

                <h2 className="text-base font-semibold">

                  Unable to load agreement data

                </h2>

                <p className="mt-1 text-sm text-muted-foreground">

                  The taxpayer or revenue service
                  data could not be loaded.

                  Please try again.

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
    )
  }


  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-screen bg-muted/20">

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        <div className="space-y-6">

          {/* ==================================================
              HEADER
          ================================================== */}

          <ExistingAgreementHeader
            onBack={
              handleBack
            }
          />


          {/* ==================================================
              STEPPER
          ================================================== */}

          <ExistingAgreementStepper
            currentStep={
              currentStep
            }

            onStepChange={
              goToStep
            }
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
                MAIN FORM
            ================================================== */}

            <main className="min-w-0">

              {/* ==================================================
                  STEP 1
              ================================================== */}

              {currentStep === 1 && (

                <AgreementInformationStep

                  agreement={
                    agreement
                  }

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
                  financial={
                    financial
                  }

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

                  agreement={
                    agreement
                  }

                  financial={
                    financial
                  }

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
                    ACTIONS
                ================================================== */}

                <div
                  className="
                    flex
                    flex-col
                    gap-2
                    sm:flex-row
                  "
                >

                  {/* ==================================================
                      CONTINUE
                  ================================================== */}

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


                  {/* ==================================================
                      CREATE / UPDATE
                  ================================================== */}

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

                      {isSubmitting
                        ? (
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
                        )
                        : (
                          isEditMode
                            ? "Update Agreement"
                            : "Register Agreement"
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
  )
}
