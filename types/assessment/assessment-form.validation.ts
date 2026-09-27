import type { RevenueField, RevenueService } from "@/types/revenue/assessment";

import {
  getFieldOptions,
  hasExistingFiles,
  isEmptyValue,
  isValidSelectValue,
} from "./assessment-form.helpers";

import type {
  FieldValue,
  ServiceFieldValues,
} from "./assessment-form.types";

export type ValidationErrors = Record<string, string>;

type ValidateFieldParams = {
  field: RevenueField;
  value: FieldValue;
  editMode: boolean;
};

export const validateField = ({
  field,
  value,
  editMode,
}: ValidateFieldParams): string | null => {
  const fieldType = String(field.type ?? "").toUpperCase();

  /*
   * FILE
   */
  if (fieldType === "FILE") {
    if (!field.required) {
      return null;
    }

    if (editMode && hasExistingFiles(value)) {
      return null;
    }

    if (!(value instanceof File)) {
      return "This file is required.";
    }

    return null;
  }

  /*
   * MULTI_FILE
   */
  if (fieldType === "MULTI_FILE") {
    if (!field.required) {
      return null;
    }

    if (editMode && hasExistingFiles(value)) {
      return null;
    }

    if (!Array.isArray(value) || value.length === 0) {
      return "At least one file is required.";
    }

    return null;
  }

  /*
   * CHECKBOX
   */
  if (fieldType === "CHECKBOX") {
    if (!field.required) {
      return null;
    }

    if (value !== true) {
      return "This field is required.";
    }

    return null;
  }

  /*
   * SELECT
   */
  if (fieldType === "SELECT") {
    if (!field.required && isEmptyValue(value)) {
      return null;
    }

    if (isEmptyValue(value)) {
      return "Please select an option.";
    }

    if (!field.options?.length) {
      return "No options are configured for this field.";
    }

    if (!isValidSelectValue(field, value)) {
      return "Please select a valid option.";
    }

    return null;
  }

  /*
   * Optional empty fields
   */
  if (!field.required && isEmptyValue(value)) {
    return null;
  }

  /*
   * Required general fields
   */
  if (isEmptyValue(value)) {
    return "This field is required.";
  }

  /*
   * NUMBER / DECIMAL
   */
  if (
    fieldType === "NUMBER" ||
    fieldType === "DECIMAL"
  ) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return "Please enter a valid number.";
    }

    if (
      field.min !== undefined &&
      field.min !== null &&
      numericValue < Number(field.min)
    ) {
      return `Value must be at least ${field.min}.`;
    }

    if (
      field.max !== undefined &&
      field.max !== null &&
      numericValue > Number(field.max)
    ) {
      return `Value must not exceed ${field.max}.`;
    }
  }

  return null;
};

export const validateServiceFields = (
  services: RevenueService[],
  serviceFieldValues: ServiceFieldValues,
  editMode: boolean,
): ValidationErrors => {
  const errors: ValidationErrors = {};

  for (const service of services) {
    const serviceValues =
      serviceFieldValues[service.id] ?? {};

    for (const field of service.fields ?? []) {
      if (!field.required) {
        continue;
      }

      const value = serviceValues[field.key];

      const error = validateField({
        field,
        value,
        editMode,
      });

      if (error) {
        errors[`${service.id}.${field.key}`] = error;
      }
    }
  }

  return errors;
};

export const countRequiredFields = (
  services: RevenueService[],
): number => {
  return services.reduce((total, service) => {
    return (
      total +
      (service.fields ?? []).filter(
        (field) => field.required,
      ).length
    );
  }, 0);
};

export const isFieldComplete = (
  field: RevenueField,
  value: FieldValue,
  editMode: boolean,
): boolean => {
  return (
    validateField({
      field,
      value,
      editMode,
    }) === null
  );
};

export const countCompletedRequiredFields = (
  services: RevenueService[],
  serviceFieldValues: ServiceFieldValues,
  editMode: boolean,
): number => {
  let completed = 0;

  for (const service of services) {
    const serviceValues =
      serviceFieldValues[service.id] ?? {};

    for (const field of service.fields ?? []) {
      if (!field.required) {
        continue;
      }

      if (
        isFieldComplete(
          field,
          serviceValues[field.key],
          editMode,
        )
      ) {
        completed += 1;
      }
    }
  }

  return completed;
};

export const getRequiredFieldCountForService = (
  service: RevenueService,
): number => {
  return (service.fields ?? []).filter(
    (field) => field.required,
  ).length;
};

export const getCompletedRequiredFieldCountForService = (
  service: RevenueService,
  values: Record<string, FieldValue>,
  editMode: boolean,
): number => {
  return (service.fields ?? []).filter(
    (field) =>
      field.required &&
      isFieldComplete(
        field,
        values[field.key],
        editMode,
      ),
  ).length;
};

export const isServiceComplete = (
  service: RevenueService,
  values: Record<string, FieldValue>,
  editMode: boolean,
): boolean => {
  return (
    getRequiredFieldCountForService(service) ===
    getCompletedRequiredFieldCountForService(
      service,
      values,
      editMode,
    )
  );
};

export const validateAssessment = ({
  selectedTaxpayerId,
  selectedServiceIds,
  selectedServices,
  serviceFieldValues,
  editMode,
}: {
  selectedTaxpayerId: string;
  selectedServiceIds: string[];
  selectedServices: RevenueService[];
  serviceFieldValues: ServiceFieldValues;
  editMode: boolean;
}): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!selectedTaxpayerId.trim()) {
    errors.taxpayerId = "Please select a taxpayer.";
  }

  if (selectedServiceIds.length === 0) {
    errors.services = "Please select at least one service.";
  }

  Object.assign(
    errors,
    validateServiceFields(
      selectedServices,
      serviceFieldValues,
      editMode,
    ),
  );

  return errors;
};

export const canSubmitAssessment = (
  selectedTaxpayerId: string,
  selectedServiceIds: string[],
  validationErrors: ValidationErrors,
): boolean => {
  return (
    selectedTaxpayerId.trim().length > 0 &&
    selectedServiceIds.length > 0 &&
    Object.keys(validationErrors).length === 0
  );
};

export const isStepComplete = ({
  stepKey,
  selectedTaxpayerId,
  selectedServiceIds,
  selectedServices,
  serviceFieldValues,
  notes,
  editMode,
}: {
  stepKey:
    | "taxpayer-services"
    | "details"
    | "notes"
    | "review";
  selectedTaxpayerId: string;
  selectedServiceIds: string[];
  selectedServices: RevenueService[];
  serviceFieldValues: ServiceFieldValues;
  notes: string;
  editMode: boolean;
}): boolean => {
  switch (stepKey) {
    case "taxpayer-services":
      return (
        selectedTaxpayerId.trim().length > 0 &&
        selectedServiceIds.length > 0
      );

    case "details": {
      const errors = validateServiceFields(
        selectedServices,
        serviceFieldValues,
        editMode,
      );

      return Object.keys(errors).length === 0;
    }

    case "notes":
      return true;

    case "review":
      return true;

    default:
      return false;
  }
};