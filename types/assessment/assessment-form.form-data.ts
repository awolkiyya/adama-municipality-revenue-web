import type {
    RevenueService,
  } from "@/types/revenue/assessment";
  
  import {
    isRecord,
  } from "./assessment-form.helpers";
  
  import type {
    FieldValue,
    InitialAssessment,
    ServiceFieldValues,
  } from "./assessment-form.types";
  
  type BuildAssessmentFormDataParams = {
    mode: "create" | "edit";
    assessmentId?: string | null;
    taxpayerId: string;
    notes: string;
    status: "DRAFT" | "PENDING_APPROVAL";
    selectedServices: RevenueService[];
    serviceFieldValues: ServiceFieldValues;
  };
  
  const appendFile = (
    formData: FormData,
    key: string,
    file: File,
  ): void => {
    formData.append(key, file);
  };
  
  const appendJson = (
    formData: FormData,
    key: string,
    value: unknown,
  ): void => {
    formData.append(key, JSON.stringify(value));
  };
  
  const isNewFile = (value: unknown): value is File => {
    return value instanceof File;
  };
  
  const getExistingFileValue = (
    value: unknown,
  ): unknown => {
    if (value instanceof File) {
      return null;
    }
  
    if (isRecord(value)) {
      return value;
    }
  
    if (
      typeof value === "string" &&
      value.trim() !== ""
    ) {
      return value;
    }
  
    return null;
  };
  
  const serializeFieldValue = ({
    formData,
    service,
    field,
    value,
  }: {
    formData: FormData;
    service: RevenueService;
    field: RevenueService["fields"][number];
    value: FieldValue;
  }): unknown => {
    const fieldType = String(
      field.type ?? "",
    ).toUpperCase();
  
    /*
     * Single file
     */
    if (fieldType === "FILE") {
      if (isNewFile(value)) {
        const partKey = `file__${service.id}__${field.key}`;
  
        appendFile(
          formData,
          partKey,
          value,
        );
  
        return {
          __file: partKey,
        };
      }
  
      const existingFile =
        getExistingFileValue(value);
  
      if (existingFile !== null) {
        return {
          __existingFile: existingFile,
        };
      }
  
      return null;
    }
  
    /*
     * Multiple files
     */
    if (fieldType === "MULTI_FILE") {
      const values = Array.isArray(value)
        ? value
        : [];
  
      const newFileKeys: string[] = [];
      const existingFiles: unknown[] = [];
  
      values.forEach(
        (item, index) => {
          if (isNewFile(item)) {
            const partKey =
              `file__${service.id}__${field.key}__${index}`;
  
            appendFile(
              formData,
              partKey,
              item,
            );
  
            newFileKeys.push(partKey);
            return;
          }
  
          const existingFile =
            getExistingFileValue(item);
  
          if (existingFile !== null) {
            existingFiles.push(
              existingFile,
            );
          }
        },
      );
  
      return {
        __files: newFileKeys,
        __existingFiles:
          existingFiles,
      };
    }
  
    /*
     * Normal fields
     */
    return value ?? null;
  };
  
  export const buildAssessmentFormData = ({
    mode,
    assessmentId,
    taxpayerId,
    notes,
    status,
    selectedServices,
    serviceFieldValues,
  }: BuildAssessmentFormDataParams): FormData => {
    const formData = new FormData();
  
    /*
     * Basic assessment information
     */
    if (
      mode === "edit" &&
      assessmentId
    ) {
      formData.append(
        "assessmentId",
        assessmentId,
      );
    }
  
    formData.append(
      "mode",
      mode,
    );
  
    formData.append(
      "taxpayerId",
      taxpayerId,
    );
  
    formData.append(
      "notes",
      notes.trim(),
    );
  
    formData.append(
      "status",
      status,
    );
  
    /*
     * Services and their field values.
     *
     * Important:
     * This only serializes the values entered
     * by the user. It does NOT calculate tariff,
     * tax, fee, or assessment amount.
     */
    const servicesPayload = selectedServices.map(
      (service) => {
        const values =
          serviceFieldValues[service.id] ??
          {};
  
        const fields: Record<
          string,
          unknown
        > = {};
  
        for (const field of service.fields ?? []) {
          fields[field.key] =
            serializeFieldValue({
              formData,
              service,
              field,
              value: values[field.key],
            });
        }
  
        return {
          serviceId: service.id,
          serviceCode: service.code,
          fields,
        };
      },
    );
  
    appendJson(
      formData,
      "services",
      servicesPayload,
    );
  
    return formData;
  };