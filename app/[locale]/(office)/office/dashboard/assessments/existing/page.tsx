"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

import { useExistingAgreement } from "@/hooks/useExistingAgreement"
import { useCitizens } from "@/hooks/useCitizen.hook"
import { useRevenueServices } from "@/hooks/revenue/revenueService.hook"

import { ExistingAgreementHeader } from "@/components/assessment/ExistingAgreementHeader"
import { ExistingAgreementStepper } from "@/components/assessment/ExistingAgreementStepper"
import { AgreementInformationStep } from "@/components/assessment/AgreementInformationStep"
import { FinancialPositionStep } from "@/components/assessment/FinancialPositionStep"
import { ReviewRegisterStep } from "@/components/assessment/ReviewRegisterStep"
import { AgreementSummary } from "@/components/assessment/AgreementSummary"
import { RegistrationStatus } from "@/components/assessment/RegistrationStatus"
import { WhatHappensNext } from "@/components/assessment/WhatHappensNext"

import type {
  RevenueService,
} from "@/types/revenue/assessment"
import { mapRevenueService } from "../create/page"



export default function ExistingAgreementPage() {
  const router = useRouter()

  // ============================================================
  // CITIZENS / TAXPAYERS
  // ============================================================

  const {
    data: citizensData,
    isLoading: citizensLoading,
    isError: citizensError,
  } = useCitizens()

  const taxpayers = useMemo(
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
   * API revenue-service model is normalized into
   * the assessment/workflow revenue-service model.
   */
  const revenueServices = useMemo<
    RevenueService[]
  >(
    () =>
      (
        revenueServicesData?.data ?? []
      ).map(
        mapRevenueService,
      ),
    [revenueServicesData],
  )

  // ============================================================
  // EXISTING AGREEMENT WORKFLOW
  // ============================================================

  const {
    currentStep,

    nextStep,
    previousStep,
    goToStep,

    registered,
    handleRegister,
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
  } = useExistingAgreement({
    taxpayers,
    revenueServices,
  })

  // ============================================================
  // NAVIGATION
  // ============================================================

  function handleBack() {
    router.back()
  }

  function handleContinue() {
    nextStep()
  }

  function handlePrevious() {
    previousStep()
  }

  function handleRegisterAgreement() {
    void handleRegister()
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

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />

              <div className="space-y-1">
                <h2 className="text-sm font-semibold">
                  Loading agreement data
                </h2>

                <p className="text-sm text-muted-foreground">
                  Loading taxpayers and revenue services...
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
            onBack={handleBack}
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

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

            {/* ==================================================
                MAIN WORKFLOW
            ================================================== */}

            <main className="min-w-0">

              {/* ==================================================
                  STEP 1 — AGREEMENT INFORMATION
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
                  STEP 2 — FINANCIAL POSITION
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
                />
              )}

              {/* ==================================================
                  STEP 3 — REVIEW & REGISTER
              ================================================== */}

              {currentStep === 3 && (
                <ReviewRegisterStep
                  agreement={agreement}

                  financial={financial}

                  selectedTaxpayer={selectedTaxpayer}

                  selectedRevenueService={selectedRevenueService}

                  revenueCode={revenueCode}

                  outstandingBalance={outstandingBalance}

                  onEditStep={goToStep}
                  serviceFieldValues={setServiceFieldValue}                />
              )}

              {/* ==================================================
                  WORKFLOW ACTIONS
              ================================================== */}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  {currentStep > 1 &&
                    !registered && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={
                          handlePrevious
                        }
                      >
                        Previous
                      </Button>
                    )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">

                  {currentStep < 3 && (
                    <Button
                      type="button"
                      onClick={
                        handleContinue
                      }
                    >
                      Continue
                    </Button>
                  )}

                  {currentStep === 3 &&
                    !registered && (
                      <Button
                        type="button"
                        onClick={
                          handleRegisterAgreement
                        }
                      >
                        Register Agreement
                      </Button>
                    )}

                  {registered && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={
                          resetForm
                        }
                      >
                        Register Another
                      </Button>

                      <Button
                        type="button"
                        onClick={
                          handleBack
                        }
                      >
                        Done
                      </Button>
                    </>
                  )}

                </div>
              </div>
            </main>

            {/* ==================================================
                SIDEBAR
            ================================================== */}

            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">

              {/* <AgreementSummary
                agreement={
                  agreement
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

                serviceFieldValues={
                  serviceFieldValues
                }
              /> */}

              <WhatHappensNext />

            </aside>

          </div>
        </div>
      </div>
    </div>
  )
}
