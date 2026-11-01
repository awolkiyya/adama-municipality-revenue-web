
"use client";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import type { Citizen } from "@/types/citizen";
import type {
  RevenueService,
  SubmissionResult,
} from "@/types/revenue/assessment";

import {
  AssessmentMode,
  FieldValue,
  InitialAssessment,
  ServiceFieldValues,
} from "@/types/assessment/assessment-form.types";

import {
  buildInitialServiceFieldValues,
  buildInitialServiceIds,
  getInitialTaxpayerId,
} from "@/types/assessment/assessment-form.helpers";

type UseAssessmentFormParams = {
  mode: AssessmentMode;
  initialAssessment?: InitialAssessment | null;
  taxpayers: Citizen[];
  revenueServices: RevenueService[];
};

type AssessmentFormState = {
  assessment: InitialAssessment | null;
  taxpayerId: string;
  selectedServiceIds: string[];
  serviceFieldValues: ServiceFieldValues;
  notes: string;
  isSaving: boolean;
  submissionResult: SubmissionResult | null;
  submissionError: string | null;
};

const createInitialState = (
  initialAssessment?: InitialAssessment | null,
): AssessmentFormState => ({
  assessment: initialAssessment ?? null,

  taxpayerId: getInitialTaxpayerId(
    initialAssessment,
  ),

  selectedServiceIds: buildInitialServiceIds(
    initialAssessment,
  ),

  serviceFieldValues: buildInitialServiceFieldValues(
    initialAssessment,
  ),

  notes: initialAssessment?.notes ?? "",

  isSaving: false,

  submissionResult: null,
  submissionError: null,
});

export const useAssessmentForm = ({
  mode,
  initialAssessment,
  taxpayers,
  revenueServices,
}: UseAssessmentFormParams) => {
  const [
    formState,
    setFormState,
  ] = useState<AssessmentFormState>(
    () => createInitialState(initialAssessment),
  );

  /*
   * Reset the form when a different assessment
   * is loaded.
   *
   * This avoids synchronizing state through useEffect.
   */
  const [
    previousAssessment,
    setPreviousAssessment,
  ] = useState(
    initialAssessment ?? null,
  );

  if (
    previousAssessment !==
    (initialAssessment ?? null)
  ) {
    setPreviousAssessment(
      initialAssessment ?? null,
    );

    setFormState(
      createInitialState(initialAssessment),
    );
  }

  const {
    taxpayerId,
    selectedServiceIds,
    serviceFieldValues,
    notes,
    isSaving,
    submissionResult,
    submissionError,
  } = formState;

  const updateFormState = useCallback(
    (
      updater: (
        previous: AssessmentFormState,
      ) => AssessmentFormState,
    ) => {
      setFormState(updater);
    },
    [],
  );

  const selectedTaxpayer = useMemo(() => {
    if (!taxpayerId) {
      return null;
    }

    return (
      taxpayers.find(
        (taxpayer) =>
          String(taxpayer.id) ===
          String(taxpayerId),
      ) ?? null
    );
  }, [
    taxpayerId,
    taxpayers,
  ]);

  const selectedServices = useMemo(() => {
    if (selectedServiceIds.length === 0) {
      return [];
    }

    const selectedIds = new Set(
      selectedServiceIds,
    );

    return revenueServices.filter(
      (service) =>
        selectedIds.has(service.id),
    );
  }, [
    revenueServices,
    selectedServiceIds,
  ]);

  const getServiceValues = useCallback(
    (
      serviceId: string,
    ): Record<string, FieldValue> => {
      return (
        serviceFieldValues[serviceId] ?? {}
      );
    },
    [serviceFieldValues],
  );

  const clearFeedback = useCallback(() => {
    updateFormState((previous) => ({
      ...previous,
      submissionResult: null,
      submissionError: null,
    }));
  }, [
    updateFormState,
  ]);

  const setServiceFieldValue = useCallback(
    (
      serviceId: string,
      fieldKey: string,
      value: FieldValue,
    ) => {
      updateFormState((previous) => ({
        ...previous,

        serviceFieldValues: {
          ...previous.serviceFieldValues,

          [serviceId]: {
            ...(previous.serviceFieldValues[
              serviceId
            ] ?? {}),

            [fieldKey]: value,
          },
        },

        submissionResult: null,
        submissionError: null,
      }));
    },
    [
      updateFormState,
    ],
  );

  const handleTaxpayerChange = useCallback(
    (value: string) => {
      updateFormState((previous) => ({
        ...previous,
        taxpayerId: value,
        submissionResult: null,
        submissionError: null,
      }));
    },
    [
      updateFormState,
    ],
  );

  const handleServiceSelectionChange =
    useCallback(
      (serviceIds: string[]) => {
        updateFormState((previous) => ({
          ...previous,
          selectedServiceIds: serviceIds,
          submissionResult: null,
          submissionError: null,
        }));
      },
      [
        updateFormState,
      ],
    );

  const removeService = useCallback(
    (serviceId: string) => {
      updateFormState((previous) => {
        const nextFieldValues = {
          ...previous.serviceFieldValues,
        };

        delete nextFieldValues[serviceId];

        return {
          ...previous,

          selectedServiceIds:
            previous.selectedServiceIds.filter(
              (id) => id !== serviceId,
            ),

          serviceFieldValues: nextFieldValues,

          submissionResult: null,
          submissionError: null,
        };
      });
    },
    [
      updateFormState,
    ],
  );

  const handleClearServices = useCallback(() => {
    updateFormState((previous) => ({
      ...previous,
      selectedServiceIds: [],
      serviceFieldValues: {},
      submissionResult: null,
      submissionError: null,
    }));
  }, [
    updateFormState,
  ]);

  const handleNotesChange = useCallback(
    (value: string) => {
      updateFormState((previous) => ({
        ...previous,
        notes: value,
        submissionResult: null,
        submissionError: null,
      }));
    },
    [
      updateFormState,
    ],
  );

  const setIsSaving = useCallback(
    (value: boolean) => {
      updateFormState((previous) => ({
        ...previous,
        isSaving: value,
      }));
    },
    [
      updateFormState,
    ],
  );

  const setSubmissionResult = useCallback(
    (value: SubmissionResult | null) => {
      updateFormState((previous) => ({
        ...previous,
        submissionResult: value,
      }));
    },
    [
      updateFormState,
    ],
  );

  const setSubmissionError = useCallback(
    (value: string | null) => {
      updateFormState((previous) => ({
        ...previous,
        submissionError: value,
      }));
    },
    [
      updateFormState,
    ],
  );

  const resetForm = useCallback(() => {
    if (mode === "edit") {
      updateFormState(() =>
        createInitialState(initialAssessment),
      );

      return;
    }

    updateFormState((previous) => ({
      ...createInitialState(null),
      isSaving: previous.isSaving,
    }));
  }, [
    initialAssessment,
    mode,
    updateFormState,
  ]);

  return {
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

    resetForm,
  };
};
