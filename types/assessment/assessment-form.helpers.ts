import type { RevenueField } from "@/types/revenue/assessment";

import type {
  FieldValue,
  InitialAssessment,
  ServiceFieldValues,
} from "./assessment-form.types";

export const isEmptyValue = (value: unknown): boolean => {
  return (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  );
};

export const isRecord = (
  value: unknown,
): value is Record<string, unknown> => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
};

export const getStringValue = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return "";
};

export const getInitialTaxpayerId = (
  assessment?: InitialAssessment | null,
): string => {
  if (!assessment) {
    return "";
  }

  return getStringValue(
    assessment.citizenId ??
      assessment.taxpayer?.id ??
      "",
  );
};

export const getInitialServiceId = (
  service: unknown,
): string => {
  if (!isRecord(service)) {
    return "";
  }

  return getStringValue(
    service.serviceId ??
      service.service_id ??
      service.id ??
      "",
  );
};

export const getInitialServiceFields = (
  service: unknown,
): Record<string, FieldValue> => {
  if (!isRecord(service)) {
    return {};
  }

  if (Array.isArray(service.values)) {
    const result: Record<string, FieldValue> = {};

    for (const item of service.values) {
      if (!isRecord(item)) {
        continue;
      }

      const fieldCode = getStringValue(
        item.fieldCode ??
          item.field_code ??
          item.code ??
          "",
      ).trim();

      if (!fieldCode) {
        continue;
      }

      result[fieldCode] = item.value ?? null;
    }

    return result;
  }

  const candidates = [
    service.fields,
    service.fieldValues,
    service.field_values,
    service.data,
  ];

  for (const candidate of candidates) {
    if (isRecord(candidate)) {
      return candidate;
    }
  }

  return {};
};

export const buildInitialServiceFieldValues = (
  assessment?: InitialAssessment | null,
): ServiceFieldValues => {
  if (!assessment) {
    return {};
  }

  const directValues =
    assessment.serviceFieldValues ??
    assessment.service_field_values;

  if (isRecord(directValues)) {
    const normalized: ServiceFieldValues = {};

    for (const [serviceId, values] of Object.entries(
      directValues,
    )) {
      if (isRecord(values)) {
        normalized[serviceId] = values;
      }
    }

    return normalized;
  }

  if (!Array.isArray(assessment.services)) {
    return {};
  }

  const result: ServiceFieldValues = {};

  for (const service of assessment.services) {
    const serviceId = getInitialServiceId(service);

    if (!serviceId) {
      continue;
    }

    result[serviceId] = getInitialServiceFields(service);
  }

  return result;
};

export const buildInitialServiceIds = (
  assessment?: InitialAssessment | null,
): string[] => {
  if (
    !assessment ||
    !Array.isArray(assessment.services)
  ) {
    return [];
  }

  return assessment.services
    .map(getInitialServiceId)
    .filter(
      (id): id is string => id.length > 0,
    );
};

export const isExistingFileValue = (
  value: unknown,
): boolean => {
  if (value instanceof File) {
    return true;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    return true;
  }

  if (isRecord(value)) {
    return Boolean(
      value.id ??
        value.url ??
        value.file_url ??
        value.path ??
        value.file_path,
    );
  }

  return false;
};

export const hasExistingFiles = (
  value: unknown,
): boolean => {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.some(isExistingFileValue);
};

export const getFieldOptions = (
  field: RevenueField,
) => {
  return [...(field.options ?? [])].sort(
    (a, b) =>
      (a.sortOrder ?? 0) -
      (b.sortOrder ?? 0),
  );
};

export const isValidSelectValue = (
  field: RevenueField,
  value: unknown,
): boolean => {
  if (isEmptyValue(value)) {
    return false;
  }

  const validValues = getFieldOptions(field).map(
    (option) => String(option.value),
  );

  return validValues.includes(String(value));
};