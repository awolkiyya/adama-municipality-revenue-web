"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Citizen } from "@/types/citizen";
import type {
  RevenueField,
  RevenueService,
  SubmissionResult,
} from "@/types/revenue/assessment";
import { AssessmentMode, FieldValue, InitialAssessment, ServiceFieldValues } from "@/types/assessment/assessment-form.types";
import { buildInitialServiceFieldValues, buildInitialServiceIds, getInitialTaxpayerId } from "@/types/assessment/assessment-form.helpers";

type UseAssessmentFormParams = {
  mode: AssessmentMode;
  initialAssessment?: InitialAssessment | null;
  taxpayers: Citizen[];
  revenueServices: RevenueService[];
};

export const useAssessmentForm = ({
  mode,
  initialAssessment,
  taxpayers,
  revenueServices,
}: UseAssessmentFormParams) => {
  const initialTaxpayerId = useMemo(
    () =>
      getInitialTaxpayerId(
        initialAssessment,
      ),
    [initialAssessment],
  );

  const initialServiceIds = useMemo(
    () =>
      buildInitialServiceIds(
        initialAssessment,
      ),
    [initialAssessment],
  );

  const initialFieldValues = useMemo(
    () =>
      buildInitialServiceFieldValues(
        initialAssessment,
      ),
    [initialAssessment],
  );

  const initialNotes = useMemo(
    () =>
      initialAssessment?.notes ?? "",
    [initialAssessment],
  );

  const [
    taxpayerId,
    setTaxpayerId,
  ] = useState(initialTaxpayerId);

  const [
    selectedServiceIds,
    setSelectedServiceIds,
  ] = useState<string[]>(
    initialServiceIds,
  );

  const [
    serviceFieldValues,
    setServiceFieldValues,
  ] = useState<ServiceFieldValues>(
    initialFieldValues,
  );

  const [
    notes,
    setNotes,
  ] = useState(initialNotes);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    submissionResult,
    setSubmissionResult,
  ] = useState<SubmissionResult | null>(
    null,
  );

  const [
    submissionError,
    setSubmissionError,
  ] = useState<string | null>(
    null,
  );

  /*
   * Keep edit-mode state synchronized
   * when the loaded assessment changes.
   */
  useEffect(() => {
    if (!initialAssessment) {
      return;
    }

    setTaxpayerId(
      getInitialTaxpayerId(
        initialAssessment,
      ),
    );

    setSelectedServiceIds(
      buildInitialServiceIds(
        initialAssessment,
      ),
    );

    setServiceFieldValues(
      buildInitialServiceFieldValues(
        initialAssessment,
      ),
    );

    setNotes(
      initialAssessment.notes ?? "",
    );

    setSubmissionResult(null);
    setSubmissionError(null);
  }, [initialAssessment]);

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
  }, [taxpayerId, taxpayers]);

  const selectedServices = useMemo(() => {
    if (
      selectedServiceIds.length === 0
    ) {
      return [];
    }

    const selectedIds = new Set(
      selectedServiceIds,
    );

    return revenueServices.filter(
      (service) =>
        selectedIds.has(
          service.id,
        ),
    );
  }, [
    revenueServices,
    selectedServiceIds,
  ]);

  const getServiceValues =
    useCallback(
      (
        serviceId: string,
      ): Record<string, FieldValue> => {
        return (
          serviceFieldValues[
            serviceId
          ] ?? {}
        );
      },
      [serviceFieldValues],
    );

  const clearFeedback =
    useCallback(() => {
      setSubmissionResult(null);
      setSubmissionError(null);
    }, []);

  const setServiceFieldValue =
    useCallback(
      (
        serviceId: string,
        fieldKey: string,
        value: FieldValue,
      ) => {
        setServiceFieldValues(
          (previous) => ({
            ...previous,
            [serviceId]: {
              ...(previous[
                serviceId
              ] ?? {}),
              [fieldKey]: value,
            },
          }),
        );

        clearFeedback();
      },
      [clearFeedback],
    );

  const handleTaxpayerChange =
    useCallback(
      (value: string) => {
        setTaxpayerId(value);
        clearFeedback();
      },
      [clearFeedback],
    );

  const handleServiceSelectionChange =
    useCallback(
      (serviceIds: string[]) => {
        setSelectedServiceIds(
          serviceIds,
        );

        clearFeedback();
      },
      [clearFeedback],
    );

  const removeService =
    useCallback(
      (serviceId: string) => {
        setSelectedServiceIds(
          (previous) =>
            previous.filter(
              (id) =>
                id !== serviceId,
            ),
        );

        setServiceFieldValues(
          (previous) => {
            const next = {
              ...previous,
            };

            delete next[serviceId];

            return next;
          },
        );

        clearFeedback();
      },
      [clearFeedback],
    );

  const handleClearServices =
    useCallback(() => {
      setSelectedServiceIds([]);
      setServiceFieldValues({});
      clearFeedback();
    }, [clearFeedback]);

  const handleNotesChange =
    useCallback(
      (
        value: string,
      ) => {
        setNotes(value);
        clearFeedback();
      },
      [clearFeedback],
    );

  const resetForm =
    useCallback(() => {
      setTaxpayerId(
        mode === "edit"
          ? getInitialTaxpayerId(
              initialAssessment,
            )
          : "",
      );

      setSelectedServiceIds(
        mode === "edit"
          ? buildInitialServiceIds(
              initialAssessment,
            )
          : [],
      );

      setServiceFieldValues(
        mode === "edit"
          ? buildInitialServiceFieldValues(
              initialAssessment,
            )
          : {},
      );

      setNotes(
        mode === "edit"
          ? initialAssessment?.notes ??
              ""
          : "",
      );

      setSubmissionResult(null);
      setSubmissionError(null);
    }, [
      initialAssessment,
      mode,
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