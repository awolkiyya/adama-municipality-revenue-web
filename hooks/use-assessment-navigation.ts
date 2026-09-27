import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  STEPS,
} from "@/types/assessment/assessment-form.constants";

import type {
  AssessmentMode,
  StepKey,
} from "@/types/assessment/assessment-form.types";

type UseAssessmentNavigationParams = {
  mode: AssessmentMode;

  /**
   * Checks whether the current step contains
   * all required information.
   */
  isCurrentStepComplete?: (
    stepKey: StepKey,
  ) => boolean;
};

export const useAssessmentNavigation = ({
  mode,
  isCurrentStepComplete,
}: UseAssessmentNavigationParams) => {
  const initialStep = 0;

  const initialFurthestStep =
    mode === "edit"
      ? STEPS.length - 1
      : initialStep;

  const [currentStep, setCurrentStep] =
    useState(initialStep);

  const [furthestStep, setFurthestStep] =
    useState(initialFurthestStep);

  const currentStepConfig =
    STEPS[currentStep];

  const currentStepKey =
    currentStepConfig.key;

  const isFirstStep =
    currentStep === 0;

  const isLastStep =
    currentStep === STEPS.length - 1;

  const canGoBack =
    currentStep > 0;

  /**
   * Check whether the current step is complete.
   *
   * The optional callback is intentionally
   * guarded so the navigation hook never
   * crashes if the parent hasn't supplied it.
   */
  const isCurrentStepValid =
    isCurrentStepComplete
      ? isCurrentStepComplete(
          currentStepKey,
        )
      : false;

  /**
   * The user can continue only when:
   *
   * - there is another step
   * - current step is valid
   */
  const canGoNext =
    !isLastStep &&
    isCurrentStepValid;

  const goToStep = useCallback(
    (step: number) => {
      if (
        step < 0 ||
        step >= STEPS.length
      ) {
        return;
      }

      /*
       * Allow navigation to already-reached
       * steps, but don't allow jumping over
       * unreached steps.
       */
      if (step > furthestStep) {
        return;
      }

      setCurrentStep(step);
    },
    [furthestStep],
  );

  const goToStepKey = useCallback(
    (stepKey: StepKey) => {
      const index =
        STEPS.findIndex(
          (step) =>
            step.key === stepKey,
        );

      if (index === -1) {
        return;
      }

      goToStep(index);
    },
    [goToStep],
  );

  const goNext = useCallback(() => {
    /*
     * Never continue from an invalid step.
     */
    if (
      isLastStep ||
      !isCurrentStepValid
    ) {
      return;
    }

    const nextStep =
      currentStep + 1;

    setCurrentStep(nextStep);

    setFurthestStep(
      (previous) =>
        Math.max(
          previous,
          nextStep,
        ),
    );
  }, [
    currentStep,
    isCurrentStepValid,
    isLastStep,
  ]);

  const goBack = useCallback(() => {
    if (!canGoBack) {
      return;
    }

    setCurrentStep(
      (previous) =>
        previous - 1,
    );
  }, [canGoBack]);

  const resetNavigation =
    useCallback(() => {
      setCurrentStep(0);

      setFurthestStep(
        mode === "edit"
          ? STEPS.length - 1
          : 0,
      );
    }, [mode]);

  const progress = useMemo(() => {
    if (STEPS.length <= 1) {
      return 100;
    }

    return Math.round(
      (currentStep /
        (STEPS.length - 1)) *
        100,
    );
  }, [currentStep]);

  return {
    steps: STEPS,

    currentStep,
    currentStepConfig,
    currentStepKey,

    furthestStep,

    isFirstStep,
    isLastStep,

    canGoBack,
    canGoNext,
    isCurrentStepValid,

    progress,

    goToStep,
    goToStepKey,
    goNext,
    goBack,
    resetNavigation,
  };
};
