"use client";

import {
  useCallback,
  useMemo,
} from "react";

import { Check } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import {
  AssessmentFormActions,
} from "./assessment-form-actions";

import {
  AssessmentStepHeader,
} from "./assessment-step-header";

import {
  AssessmentStepper,
} from "./assessment-stepper";

import {
  NotesStep,
} from "./steps/notes-step";

import {
  ReviewStep,
} from "./steps/review-step";

import {
  ServiceDetailsStep,
} from "./steps/service-details-step";

import {
  TaxpayerServicesStep,
} from "./steps/taxpayer-services-step";

import type {
  AssessmentFormProps,
  StepKey,
} from "@/types/assessment/assessment-form.types";

import {
  useAssessmentForm,
} from "@/hooks/use-assessment-form";

import {
  useAssessmentNavigation,
} from "@/hooks/use-assessment-navigation";

import {
  useAssessmentFileFields,
} from "@/hooks/use-assessment-file-fields";

import {
  canSubmitAssessment,
  countCompletedRequiredFields,
  countRequiredFields,
  validateAssessment,
  isStepComplete as checkStepComplete,
} from "@/types/assessment/assessment-form.validation";

import {
  buildAssessmentFormData,
} from "@/types/assessment/assessment-form.form-data";

import {
  STEPS,
} from "@/types/assessment/assessment-form.constants";

export function AssessmentForm({
  mode = "create",
  initialAssessment = null,
  taxpayers,
  revenueServices,
  taxpayerLoading = false,
  taxpayerError = false,
  revenueServicesLoading = false,
  revenueServicesError = false,
  onRetryRevenueServices,
  onSubmit,
  onSaveDraft,
  onBack,
}: AssessmentFormProps) {
  const editMode = mode === "edit";

  /*
   * ==========================================================================
   * Form state
   * ==========================================================================
   */

  const {
    taxpayerId,
    selectedServiceIds,
    serviceFieldValues,
    notes,

    isSaving,
    setIsSaving,

    submissionResult,
    setSubmissionResult,

    submissionError,
    setSubmissionError,

    selectedTaxpayer,
    selectedServices,

    getServiceValues,

    clearFeedback,

    setServiceFieldValue,

    handleTaxpayerChange,
    handleServiceSelectionChange,
    handleNotesChange,

    removeService,
    handleClearServices,
  } = useAssessmentForm({
    mode,
    initialAssessment,
    taxpayers,
    revenueServices,
  });

  /*
   * ==========================================================================
   * Validation
   * ==========================================================================
   */

  const validationErrors = useMemo(
    () =>
      validateAssessment({
        selectedTaxpayerId: taxpayerId,
        selectedServiceIds,
        selectedServices,
        serviceFieldValues,
        editMode,
      }),
    [
      taxpayerId,
      selectedServiceIds,
      selectedServices,
      serviceFieldValues,
      editMode,
    ],
  );

  /*
   * ==========================================================================
   * Required field progress
   * ==========================================================================
   */

  const totalRequiredFields = useMemo(
    () =>
      countRequiredFields(
        selectedServices,
      ),
    [selectedServices],
  );

  const completedRequiredFields = useMemo(
    () =>
      countCompletedRequiredFields(
        selectedServices,
        serviceFieldValues,
        editMode,
      ),
    [
      selectedServices,
      serviceFieldValues,
      editMode,
    ],
  );

  /*
   * ==========================================================================
   * Submit validation
   * ==========================================================================
   */

  const canSubmit = useMemo(
    () =>
      canSubmitAssessment(
        taxpayerId,
        selectedServiceIds,
        validationErrors,
      ),
    [
      taxpayerId,
      selectedServiceIds,
      validationErrors,
    ],
  );

  /*
   * ==========================================================================
   * Step completion
   *
   * IMPORTANT:
   * This callback must be created BEFORE
   * useAssessmentNavigation() because the
   * navigation hook uses it.
   * ==========================================================================
   */

  const isStepComplete = useCallback(
    (stepKey: StepKey): boolean =>
      checkStepComplete({
        stepKey,
        selectedTaxpayerId: taxpayerId,
        selectedServiceIds,
        selectedServices,
        serviceFieldValues,
        notes,
        editMode,
      }),
    [
      taxpayerId,
      selectedServiceIds,
      selectedServices,
      serviceFieldValues,
      notes,
      editMode,
    ],
  );

  /*
   * ==========================================================================
   * Navigation
   * ==========================================================================
   */

  const {
    currentStep,
    furthestStep,

    isFirstStep,
    isLastStep,

    canGoNext,

    goToStep,
    goNext,
    goBack,
  } = useAssessmentNavigation({
    mode,
    isCurrentStepComplete:
      isStepComplete,
  });

  /*
   * ==========================================================================
   * File fields
   * ==========================================================================
   */

  const {
    handleFileChange,
    handleRemoveFile,
  } = useAssessmentFileFields({
    setServiceFieldValue,
  });

  /*
   * ==========================================================================
   * Save draft
   * ==========================================================================
   */

  const handleSaveDraft = async () => {
    if (
      !onSaveDraft ||
      isSaving
    ) {
      return;
    }

    clearFeedback();

    try {
      setIsSaving(true);

      const formData =
        buildAssessmentFormData({
          mode,
          assessmentId:
            initialAssessment?.id,
          taxpayerId,
          notes,
          status: "DRAFT",
          selectedServices,
          serviceFieldValues,
        });

      const result =
        await onSaveDraft(formData);

      setSubmissionResult(result);
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Failed to save the assessment draft.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * ==========================================================================
   * Submit assessment
   * ==========================================================================
   */

  const handleSubmit = async () => {
    if (
      !onSubmit ||
      isSaving ||
      !canSubmit
    ) {
      return;
    }

    clearFeedback();

    try {
      setIsSaving(true);

      const formData =
        buildAssessmentFormData({
          mode,
          assessmentId:
            initialAssessment?.id,
          taxpayerId,
          notes,
          status:
            "PENDING_APPROVAL",
          selectedServices,
          serviceFieldValues,
        });

      const result =
        await onSubmit(formData);

      setSubmissionResult(result);
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Failed to submit the assessment.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * ==========================================================================
   * Render current step
   * ==========================================================================
   */

  const renderCurrentStep = () => {
    switch (currentStep) {
      /*
       * ----------------------------------------------------------------------
       * Step 1 — Taxpayer & Services
       * ----------------------------------------------------------------------
       */

      case 0:
        return (
          <TaxpayerServicesStep
                taxpayers={taxpayers}
                revenueServices={revenueServices}
                taxpayerId={taxpayerId}
                selectedServiceIds={selectedServiceIds}
                selectedServices={selectedServices}
                taxpayerLoading={taxpayerLoading}
                taxpayerError={taxpayerError}
                revenueServicesLoading={revenueServicesLoading}
                revenueServicesError={revenueServicesError}
                onRetryRevenueServices={onRetryRevenueServices}
                onTaxpayerChange={handleTaxpayerChange}
                onServiceSelectionChange={handleServiceSelectionChange}
                onRemoveService={removeService}
                onClearServices={handleClearServices}
                selectedTaxpayer={null}          />
        );

      /*
       * ----------------------------------------------------------------------
       * Step 2 — Service Details
       * ----------------------------------------------------------------------
       */

      case 1:
        return (
          <ServiceDetailsStep
            selectedServices={
              selectedServices
            }
            validationErrors={
              validationErrors
            }
            editMode={
              editMode
            }
            getServiceValues={
              getServiceValues
            }
            onServiceFieldValueChange={
              setServiceFieldValue
            }
            onFileChange={
              handleFileChange
            }
            onRemoveFile={
              handleRemoveFile
            }
            onRemoveService={
              removeService
            }
          />
        );

      /*
       * ----------------------------------------------------------------------
       * Step 3 — Notes
       * ----------------------------------------------------------------------
       */

      case 2:
        return (
          <NotesStep
            value={notes}
            onChange={
              handleNotesChange
            }
          />
        );

      /*
       * ----------------------------------------------------------------------
       * Step 4 — Review
       * ----------------------------------------------------------------------
       */

      case 3:
        return (
          <ReviewStep
            selectedTaxpayer={
              selectedTaxpayer
            }
            selectedServices={
              selectedServices
            }
            serviceFieldValues={
              serviceFieldValues
            }
            notes={
              notes
            }
            onEditTaxpayerServices={() =>
              goToStep(0)
            }
            onEditDetails={() =>
              goToStep(1)
            }
            onEditNotes={() =>
              goToStep(2)
            }
          />
        );

      default:
        return null;
    }
  };

  /*
   * ==========================================================================
   * Render
   * ==========================================================================
   */

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* Submission error */}
      {/* ==================================================================== */}

      {submissionError && (
        <Alert variant="destructive">
          <AlertTitle>
            Unable to process assessment
          </AlertTitle>

          <AlertDescription>
            {submissionError}
          </AlertDescription>
        </Alert>
      )}

      {/* ==================================================================== */}
      {/* Submission success */}
      {/* ==================================================================== */}

      {submissionResult && (
        <Alert>
          <Check className="size-4" />

          <AlertTitle>
            Assessment processed successfully
          </AlertTitle>

          <AlertDescription>
            The assessment was processed
            successfully.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* ================================================================== */}
        {/* Step navigation */}
        {/* ================================================================== */}

        <AssessmentStepper
          currentStep={
            currentStep
          }
          furthestStep={
            furthestStep
          }
          onStepChange={
            goToStep
          }
          isStepComplete={
            isStepComplete
          }
        />

        {/* ================================================================== */}
        {/* Main content */}
        {/* ================================================================== */}

        <main className="min-w-0 flex-1">
          <div className="rounded-xl border bg-card">
            {/* ---------------------------------------------------------------- */}
            {/* Step content */}
            {/* ---------------------------------------------------------------- */}

            <div className="p-5 sm:p-6">
              <AssessmentStepHeader
                currentStep={
                  currentStep
                }
                completedRequiredFields={
                  completedRequiredFields
                }
                totalRequiredFields={
                  totalRequiredFields
                }
              />

              <div className="mt-6">
                {renderCurrentStep()}
              </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Actions */}
            {/* ---------------------------------------------------------------- */}

            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <AssessmentFormActions
                currentStep={
                  currentStep
                }
                totalSteps={
                  STEPS.length
                }
                isFirstStep={
                  isFirstStep
                }
                isLastStep={
                  isLastStep
                }
                canGoNext={
                  canGoNext
                }
                canSubmit={
                  canSubmit
                }
                isSaving={
                  isSaving
                }
                editMode={
                  editMode
                }
                onBack={
                  goBack
                }
                onNext={
                  goNext
                }
                onCancel={
                  onBack ??
                  (() => {})
                }
                onSaveDraft={
                  handleSaveDraft
                }
                onSubmit={
                  handleSubmit
                }
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
