
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ExistingAgreementForm,
  ExistingFinancialPosition,
  Step,
} from "@/types/existing-agreement";

import type { Citizen } from "@/types/citizen";
import type { RevenueService } from "@/types/revenue/assessment";

/*
|--------------------------------------------------------------------------
| Initial State
|--------------------------------------------------------------------------
*/

const INITIAL_AGREEMENT: ExistingAgreementForm = {
  taxpayerId: "",
  revenueServiceId: "",
  source: "",
  notes: "",
};

const INITIAL_FINANCIAL: ExistingFinancialPosition = {
  originalObligation: "",
  amountAlreadyPaid: "",
  balanceAsOfDate: "",
};

/*
|--------------------------------------------------------------------------
| Service Field Types
|--------------------------------------------------------------------------
*/

export type ServiceFieldValue = string | number | boolean;

export type ServiceFieldValues = Record<
  string,
  Record<string, ServiceFieldValue>
>;

export type ServiceFileValues = Record<
  string,
  Record<string, File>
>;

export type ValidationErrors = {
  agreement?: Record<string, string>;
  financial?: Record<string, string>;
  service?: Record<string, Record<string, string>>;
};

export interface UseExistingAgreementOptions {
  taxpayers: Citizen[];
  revenueServices: RevenueService[];
  assessmentId?: string;
  initialData?: unknown;
}

type UnknownRecord = Record<string, unknown>;

/*
|--------------------------------------------------------------------------
| Generic Helpers
|--------------------------------------------------------------------------
*/

function isRecord(value: unknown): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isEmptyValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
}

function toStringValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
}

function firstValue(
  data: UnknownRecord,
  keys: readonly string[],
): unknown {
  for (const key of keys) {
    const value = data[key];

    if (!isEmptyValue(value)) {
      return value;
    }
  }

  return undefined;
}

function normalizeIdentifier(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function normalizeServiceFieldValue(
  value: unknown,
): ServiceFieldValue {
  if (
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return value;
  }

  return String(value ?? "");
}

function identifiersMatch(
  left: string,
  right: string,
): boolean {
  return (
    Boolean(left) &&
    Boolean(right) &&
    left.trim().toLowerCase() === right.trim().toLowerCase()
  );
}

/*
|--------------------------------------------------------------------------
| Assessment Services
|--------------------------------------------------------------------------
*/

function getAssessmentServices(
  data: UnknownRecord,
): UnknownRecord[] {
  if (!Array.isArray(data.services)) {
    return [];
  }

  return data.services.filter(isRecord);
}

function resolveRevenueServiceId(
  services: UnknownRecord[],
): string {
  const service = services[0];

  if (!service) {
    return "";
  }

  return toStringValue(
    firstValue(service, [
      "revenueServiceId",
      "revenue_service_id",
      "serviceId",
      "service_id",
    ]),
  );
}

/*
|--------------------------------------------------------------------------
| Revenue Service
|--------------------------------------------------------------------------
*/

function findRevenueService(
  revenueServices: RevenueService[],
  serviceId: string,
): RevenueService | null {
  if (!serviceId) {
    return null;
  }

  return (
    revenueServices.find(
      (service) => String(service.id) === serviceId,
    ) ?? null
  );
}

function getRevenueServiceFields(
  service: RevenueService | null,
): UnknownRecord[] {
  if (!service) {
    return [];
  }

  const fields = (
    service as RevenueService & {
      fields?: unknown;
    }
  ).fields;

  return Array.isArray(fields)
    ? fields.filter(isRecord)
    : [];
}

function getFrontendFieldKey(
  field: UnknownRecord,
): string {
  const candidates = [
    field.key,
    field.code,
    field.fieldCode,
    field.field_code,
    field.name,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeIdentifier(candidate);

    if (normalized) {
      return normalized;
    }
  }

  return normalizeIdentifier(
    firstValue(field, ["id", "fieldId", "field_id"]),
  );
}

function getFieldIdentifiers(
  field: UnknownRecord,
): string[] {
  const candidates = [
    field.key,
    field.code,
    field.fieldCode,
    field.field_code,
    field.name,
    field.id,
    field.fieldId,
    field.field_id,
  ];

  return candidates
    .map(normalizeIdentifier)
    .filter((value, index, values) =>
      Boolean(value) && values.indexOf(value) === index,
    );
}

/*
|--------------------------------------------------------------------------
| Persisted Field → Frontend Field Key
|--------------------------------------------------------------------------
*/

function resolveFormFieldKey(
  persistedFieldId: string,
  persistedFieldCode: string,
  fields: UnknownRecord[],
): string {
  if (persistedFieldCode) {
    for (const field of fields) {
      const businessIdentifiers = [
        field.key,
        field.code,
        field.fieldCode,
        field.field_code,
        field.name,
      ]
        .map(normalizeIdentifier)
        .filter(Boolean);

      if (
        businessIdentifiers.some((identifier) =>
          identifiersMatch(identifier, persistedFieldCode),
        )
      ) {
        return getFrontendFieldKey(field);
      }
    }
  }

  if (persistedFieldId) {
    for (const field of fields) {
      const identifiers = [
        field.id,
        field.fieldId,
        field.field_id,
      ]
        .map(normalizeIdentifier)
        .filter(Boolean);

      if (
        identifiers.some((identifier) =>
          identifiersMatch(identifier, persistedFieldId),
        )
      ) {
        return getFrontendFieldKey(field);
      }
    }
  }

  if (persistedFieldCode) {
    for (const field of fields) {
      if (
        getFieldIdentifiers(field).some((identifier) =>
          identifiersMatch(identifier, persistedFieldCode),
        )
      ) {
        return getFrontendFieldKey(field);
      }
    }

    return persistedFieldCode;
  }

  return persistedFieldId;
}

/*
|--------------------------------------------------------------------------
| Extract Persisted Service Values
|--------------------------------------------------------------------------
*/

function extractServiceFieldValues(
  services: UnknownRecord[],
  revenueServiceId: string,
  revenueServices: RevenueService[],
): ServiceFieldValues {
  const result: ServiceFieldValues = {};

  if (!revenueServiceId) {
    return result;
  }

  const assessmentService = services.find((service) => {
    const serviceId = firstValue(service, [
      "revenueServiceId",
      "revenue_service_id",
      "serviceId",
      "service_id",
    ]);

    return identifiersMatch(
      toStringValue(serviceId),
      revenueServiceId,
    );
  });

  if (!assessmentService || !Array.isArray(assessmentService.values)) {
    return result;
  }

  const revenueService = findRevenueService(
    revenueServices,
    revenueServiceId,
  );

  const serviceFields = getRevenueServiceFields(revenueService);
  const values: Record<string, ServiceFieldValue> = {};

  for (const persistedValue of assessmentService.values) {
    if (!isRecord(persistedValue)) {
      continue;
    }

    const fieldId = toStringValue(
      firstValue(persistedValue, [
        "revenueServiceFieldId",
        "revenue_service_field_id",
      ]),
    );

    const fieldCode = toStringValue(
      firstValue(persistedValue, ["fieldCode", "field_code"]),
    );

    const rawValue = persistedValue.value;

    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    const formFieldKey = resolveFormFieldKey(
      fieldId,
      fieldCode,
      serviceFields,
    );

    if (!formFieldKey) {
      continue;
    }

    values[formFieldKey] =
      normalizeServiceFieldValue(rawValue);
  }

  result[revenueServiceId] = values;

  return result;
}

/*
|--------------------------------------------------------------------------
| Financial Values
|--------------------------------------------------------------------------
*/

function resolveFinancialValue(
  data: UnknownRecord,
  services: UnknownRecord[],
  keys: readonly string[],
): string {
  const assessmentValue = firstValue(data, keys);

  if (!isEmptyValue(assessmentValue)) {
    return toStringValue(assessmentValue);
  }

  const service = services[0];

  if (!service) {
    return "";
  }

  const serviceValue = firstValue(service, keys);

  return isEmptyValue(serviceValue)
    ? ""
    : toStringValue(serviceValue);
}

/*
|--------------------------------------------------------------------------
| Build Backend Service Fields
|--------------------------------------------------------------------------
|
| Ordinary value:
|   FIELD_UUID: 2000
|
| New upload:
|   FIELD_UUID: {
|     __file: "file__SERVICE_UUID__FIELD_UUID"
|   }
|
| Existing file values remain in the persisted value map unless
| the user explicitly removes them.
|--------------------------------------------------------------------------
*/

function buildBackendServiceFields(
  service: RevenueService | null,
  values: Record<string, ServiceFieldValue>,
  selectedFiles: Record<string, File>,
): Record<string, unknown> {
  if (!service) {
    return {};
  }

  const result: Record<string, unknown> = {};
  const fields = getRevenueServiceFields(service);

  for (const field of fields) {
    const fieldId = normalizeIdentifier(
      firstValue(field, ["id", "fieldId", "field_id"]),
    );

    const fieldKey = getFrontendFieldKey(field);

    if (!fieldId || !fieldKey) {
      continue;
    }

    const selectedFile = selectedFiles[fieldKey];

    if (selectedFile instanceof File) {
      result[fieldId] = {
        __file: `file__${String(service.id)}__${fieldId}`,
      };

      continue;
    }

    if (
      Object.prototype.hasOwnProperty.call(values, fieldKey)
    ) {
      result[fieldId] = values[fieldKey];
    }
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| Hook
|--------------------------------------------------------------------------
*/

export function useExistingAgreement({
  taxpayers,
  revenueServices,
  assessmentId,
  initialData,
}: UseExistingAgreementOptions) {
  const isEditMode = Boolean(assessmentId);

  const [currentStep, setCurrentStep] = useState<Step>(1);

  const [agreement, setAgreement] =
    useState<ExistingAgreementForm>(INITIAL_AGREEMENT);

  const [financial, setFinancial] =
    useState<ExistingFinancialPosition>(INITIAL_FINANCIAL);

  const [serviceFieldValues, setServiceFieldValues] =
    useState<ServiceFieldValues>({});

  const [serviceFiles, setServiceFiles] =
    useState<ServiceFileValues>({});

  /*
   * Explicitly removed existing attachments are tracked separately
   * from newly selected files. The backend must implement removal
   * semantics for this list before these removals can be persisted.
   */
  const [removedFiles, setRemovedFiles] = useState<
    Record<string, string[]>
  >({});

  const [validationErrors, setValidationErrors] =
    useState<ValidationErrors>({});

  /*
   * Edit Hydration
   */

  useEffect(() => {
    if (!isEditMode || !isRecord(initialData)) {
      return;
    }

    const data = initialData;
    const services = getAssessmentServices(data);

    const taxpayerId = toStringValue(
      firstValue(data, [
        "citizenId",
        "citizen_id",
        "taxpayerId",
        "taxpayer_id",
      ]),
    );

    const revenueServiceId =
      resolveRevenueServiceId(services);

    const source = toStringValue(
      firstValue(data, ["sourceType", "source_type", "source"]),
    );

    const notes = toStringValue(
      firstValue(data, ["notes"]),
    );

    setAgreement({
      taxpayerId,
      revenueServiceId,
      source,
      notes,
    });

    setFinancial({
      originalObligation: resolveFinancialValue(
        data,
        services,
        [
          "originalObligation",
          "original_obligation",
          "computedAmount",
          "computed_amount",
        ],
      ),
      amountAlreadyPaid: resolveFinancialValue(
        data,
        services,
        [
          "paidAmount",
          "paid_amount",
          "amountAlreadyPaid",
          "amount_already_paid",
        ],
      ),
      balanceAsOfDate: resolveFinancialValue(
        data,
        services,
        ["balanceAsOfDate", "balance_as_of_date"],
      ),
    });

    setServiceFieldValues(
      extractServiceFieldValues(
        services,
        revenueServiceId,
        revenueServices,
      ),
    );

    setServiceFiles({});
    setRemovedFiles({});
    setValidationErrors({});
  }, [isEditMode, initialData, revenueServices]);

  /*
   * Selected Taxpayer
   */

  const selectedTaxpayer = useMemo<Citizen | null>(() => {
    if (!agreement.taxpayerId) {
      return null;
    }

    return (
      taxpayers.find(
        (taxpayer) =>
          String(taxpayer.id) === String(agreement.taxpayerId),
      ) ?? null
    );
  }, [taxpayers, agreement.taxpayerId]);

  /*
   * Selected Revenue Service
   */

  const selectedRevenueService =
    useMemo<RevenueService | null>(
      () =>
        findRevenueService(
          revenueServices,
          agreement.revenueServiceId,
        ),
      [revenueServices, agreement.revenueServiceId],
    );

  const revenueCode =
    (
      selectedRevenueService as
        | (RevenueService & { code?: string })
        | null
        | undefined
    )?.code ?? "";

  /*
   * Display-Only Outstanding Balance
   */

  const outstandingBalance = useMemo(() => {
    const original = Number(financial.originalObligation);
    const paid = Number(financial.amountAlreadyPaid);

    if (!Number.isFinite(original) || !Number.isFinite(paid)) {
      return 0;
    }

    return Math.max(0, original - paid);
  }, [
    financial.originalObligation,
    financial.amountAlreadyPaid,
  ]);

  /*
   * Clear Agreement Error
   */

  const clearAgreementError = useCallback((field: string) => {
    setValidationErrors((previous) => {
      if (!previous.agreement?.[field]) {
        return previous;
      }

      const agreementErrors = { ...previous.agreement };
      delete agreementErrors[field];

      return {
        ...previous,
        agreement:
          Object.keys(agreementErrors).length > 0
            ? agreementErrors
            : undefined,
      };
    });
  }, []);

  /*
   * Clear Financial Error
   */

  const clearFinancialError = useCallback((field: string) => {
    setValidationErrors((previous) => {
      if (!previous.financial?.[field]) {
        return previous;
      }

      const financialErrors = { ...previous.financial };
      delete financialErrors[field];

      return {
        ...previous,
        financial:
          Object.keys(financialErrors).length > 0
            ? financialErrors
            : undefined,
      };
    });
  }, []);

  /*
   * Update Agreement
   */

  const updateAgreement = useCallback(
    (
      field: keyof ExistingAgreementForm,
      value: string,
    ) => {
      setAgreement((previous) => ({
        ...previous,
        [field]: value,
      }));

      clearAgreementError(String(field));
    },
    [clearAgreementError],
  );

  /*
   * Update Financial
   */

  const updateFinancial = useCallback(
    (
      field: keyof ExistingFinancialPosition,
      value: string,
    ) => {
      setFinancial((previous) => ({
        ...previous,
        [field]: value,
      }));

      clearFinancialError(String(field));
    },
    [clearFinancialError],
  );

  /*
   * Select / Clear Taxpayer
   */

  const selectTaxpayer = useCallback(
    (taxpayerId: string) => {
      setAgreement((previous) => ({
        ...previous,
        taxpayerId,
      }));

      clearAgreementError("taxpayerId");
    },
    [clearAgreementError],
  );

  const clearTaxpayer = useCallback(() => {
    setAgreement((previous) => ({
      ...previous,
      taxpayerId: "",
    }));

    clearAgreementError("taxpayerId");
  }, [clearAgreementError]);

  /*
   * Select Revenue Service
   */

  const selectRevenueService = useCallback(
    (revenueServiceId: string) => {
      setAgreement((previous) => ({
        ...previous,
        revenueServiceId,
      }));

      if (!revenueServiceId) {
        setServiceFieldValues({});
        setServiceFiles({});
        setRemovedFiles({});

        setValidationErrors((previous) => ({
          ...previous,
          service: undefined,
        }));

        clearAgreementError("revenueServiceId");
        return;
      }

      setServiceFieldValues((previous) => ({
        ...previous,
        [revenueServiceId]:
          previous[revenueServiceId] ?? {},
      }));

      setValidationErrors((previous) => {
        const serviceErrors = {
          ...(previous.service ?? {}),
        };

        delete serviceErrors[revenueServiceId];

        return {
          ...previous,
          service:
            Object.keys(serviceErrors).length > 0
              ? serviceErrors
              : undefined,
        };
      });

      clearAgreementError("revenueServiceId");
    },
    [clearAgreementError],
  );

  /*
   * Set Service Field Value
   */

  const setServiceFieldValue = useCallback(
    (
      serviceId: string,
      field: string,
      value: ServiceFieldValue,
    ) => {
      setServiceFieldValues((previous) => ({
        ...previous,
        [serviceId]: {
          ...(previous[serviceId] ?? {}),
          [field]: value,
        },
      }));

      setValidationErrors((previous) => {
        const fieldErrors = previous.service?.[serviceId];

        if (!fieldErrors?.[field]) {
          return previous;
        }

        const updatedErrors = { ...fieldErrors };
        delete updatedErrors[field];

        const nextServiceErrors = {
          ...(previous.service ?? {}),
        };

        if (Object.keys(updatedErrors).length > 0) {
          nextServiceErrors[serviceId] = updatedErrors;
        } else {
          delete nextServiceErrors[serviceId];
        }

        return {
          ...previous,
          service:
            Object.keys(nextServiceErrors).length > 0
              ? nextServiceErrors
              : undefined,
        };
      });
    },
    [],
  );

  /*
   * File Helpers
   */

  const clearFileFieldError = useCallback(
    (serviceId: string, field: string) => {
      setValidationErrors((previous) => {
        const fieldErrors = previous.service?.[serviceId];

        if (!fieldErrors?.[field]) {
          return previous;
        }

        const updatedErrors = { ...fieldErrors };
        delete updatedErrors[field];

        const nextServiceErrors = {
          ...(previous.service ?? {}),
        };

        if (Object.keys(updatedErrors).length > 0) {
          nextServiceErrors[serviceId] = updatedErrors;
        } else {
          delete nextServiceErrors[serviceId];
        }

        return {
          ...previous,
          service:
            Object.keys(nextServiceErrors).length > 0
              ? nextServiceErrors
              : undefined,
        };
      });
    },
    [],
  );

  /*
   * Handle Newly Selected File
   */

  const handleFileChange = useCallback(
    (
      serviceId: string,
      field: string,
      file: File | null,
    ) => {
      if (!file) {
        /*
         * Clearing the browser's file input is not treated as
         * removing an existing server attachment.
         */
        setServiceFiles((previous) => {
          const current = { ...(previous[serviceId] ?? {}) };
          delete current[field];

          const next = { ...previous };

          if (Object.keys(current).length > 0) {
            next[serviceId] = current;
          } else {
            delete next[serviceId];
          }

          return next;
        });

        return;
      }

      setServiceFiles((previous) => ({
        ...previous,
        [serviceId]: {
          ...(previous[serviceId] ?? {}),
          [field]: file,
        },
      }));

      clearFileFieldError(serviceId, field);
    },
    [clearFileFieldError],
  );

  /*
   * Explicitly Remove Existing File
   *
   * Pass the persisted file UUID/ID from the attachment UI.
   * The backend must implement `removed_file_ids` semantics
   * before this operation can delete a server-side attachment.
   */

  const removeFile = useCallback(
    (
      serviceId: string,
      field: string,
      existingFileId?: string,
    ) => {
      setServiceFiles((previous) => {
        const current = { ...(previous[serviceId] ?? {}) };
        delete current[field];

        const next = { ...previous };

        if (Object.keys(current).length > 0) {
          next[serviceId] = current;
        } else {
          delete next[serviceId];
        }

        return next;
      });

      if (existingFileId) {
        setRemovedFiles((previous) => {
          const current = previous[serviceId] ?? [];

          if (current.includes(existingFileId)) {
            return previous;
          }

          return {
            ...previous,
            [serviceId]: [...current, existingFileId],
          };
        });
      }

      /*
       * Do not clear the existing persisted value here. Removing
       * a server attachment is a separate, explicit operation.
       */
    },
    [],
  );

  /*
   * Remove Service
   */

  const removeService = useCallback(
    (serviceId: string) => {
      setServiceFieldValues((previous) => {
        const next = { ...previous };
        delete next[serviceId];
        return next;
      });

      setServiceFiles((previous) => {
        const next = { ...previous };
        delete next[serviceId];
        return next;
      });

      setRemovedFiles((previous) => {
        const next = { ...previous };
        delete next[serviceId];
        return next;
      });

      setValidationErrors((previous) => {
        const serviceErrors = {
          ...(previous.service ?? {}),
        };

        delete serviceErrors[serviceId];

        return {
          ...previous,
          service:
            Object.keys(serviceErrors).length > 0
              ? serviceErrors
              : undefined,
        };
      });

      if (agreement.revenueServiceId === serviceId) {
        setAgreement((previous) => ({
          ...previous,
          revenueServiceId: "",
        }));

        clearAgreementError("revenueServiceId");
      }
    },
    [agreement.revenueServiceId, clearAgreementError],
  );

  /*
   * Validate Agreement Step
   */

  const validateAgreementStep = useCallback(
    (): ValidationErrors => {
      const agreementErrors: Record<string, string> = {};
      const serviceErrors: Record<string, string> = {};

      if (isEmptyValue(agreement.taxpayerId)) {
        agreementErrors.taxpayerId =
          "Please select a taxpayer.";
      }

      if (isEmptyValue(agreement.revenueServiceId)) {
        agreementErrors.revenueServiceId =
          "Please select a revenue service.";
      }

      const service = selectedRevenueService;
      const serviceId = agreement.revenueServiceId;

      if (service && serviceId) {
        const values = serviceFieldValues[serviceId] ?? {};
        const selectedFiles = serviceFiles[serviceId] ?? {};
        const fields = getRevenueServiceFields(service);

        for (const field of fields) {
          if (
            field.required !== true &&
            field.is_required !== true
          ) {
            continue;
          }

          const fieldKey = getFrontendFieldKey(field);

          if (!fieldKey) {
            continue;
          }

          const value = values[fieldKey];
          const selectedFile = selectedFiles[fieldKey];

          if (
            selectedFile instanceof File ||
            !isEmptyValue(value)
          ) {
            continue;
          }

          const label = firstValue(field, [
            "label",
            "name",
            "key",
            "code",
            "fieldCode",
          ]);

          serviceErrors[fieldKey] =
            `${toStringValue(label || fieldKey)} is required.`;
        }
      }

      const result: ValidationErrors = {};

      if (Object.keys(agreementErrors).length > 0) {
        result.agreement = agreementErrors;
      }

      if (
        serviceId &&
        Object.keys(serviceErrors).length > 0
      ) {
        result.service = {
          [serviceId]: serviceErrors,
        };
      }

      return result;
    },
    [
      agreement.taxpayerId,
      agreement.revenueServiceId,
      selectedRevenueService,
      serviceFieldValues,
      serviceFiles,
    ],
  );

  /*
   * Validate Financial Step
   */

  const validateFinancialStep = useCallback(
    (): ValidationErrors => {
      const errors: Record<string, string> = {};

      if (isEmptyValue(financial.originalObligation)) {
        errors.originalObligation =
          "Original obligation is required.";
      } else {
        const value = Number(financial.originalObligation);

        if (!Number.isFinite(value) || value < 0) {
          errors.originalObligation =
            "Original obligation must be a valid non-negative amount.";
        }
      }

      if (isEmptyValue(financial.amountAlreadyPaid)) {
        errors.amountAlreadyPaid =
          "Amount already paid is required.";
      } else {
        const value = Number(financial.amountAlreadyPaid);

        if (!Number.isFinite(value) || value < 0) {
          errors.amountAlreadyPaid =
            "Amount already paid must be a valid non-negative amount.";
        }
      }

      if (isEmptyValue(financial.balanceAsOfDate)) {
        errors.balanceAsOfDate =
          "Balance as of date is required.";
      }

      const original = Number(financial.originalObligation);
      const paid = Number(financial.amountAlreadyPaid);

      if (
        Number.isFinite(original) &&
        Number.isFinite(paid) &&
        original >= 0 &&
        paid >= 0 &&
        paid > original
      ) {
        errors.amountAlreadyPaid =
          "Amount already paid cannot exceed the original obligation.";
      }

      return Object.keys(errors).length > 0
        ? { financial: errors }
        : {};
    },
    [
      financial.originalObligation,
      financial.amountAlreadyPaid,
      financial.balanceAsOfDate,
    ],
  );

  const validateReviewStep =
    useCallback((): ValidationErrors => ({}), []);

  const validateStep = useCallback(
    (step: Step): ValidationErrors => {
      switch (step) {
        case 1:
          return validateAgreementStep();
        case 2:
          return validateFinancialStep();
        case 3:
          return validateReviewStep();
        default:
          return {};
      }
    },
    [
      validateAgreementStep,
      validateFinancialStep,
      validateReviewStep,
    ],
  );

  const hasValidationErrors = useCallback(
    (errors: ValidationErrors): boolean => {
      if (
        errors.agreement &&
        Object.keys(errors.agreement).length > 0
      ) {
        return true;
      }

      if (
        errors.financial &&
        Object.keys(errors.financial).length > 0
      ) {
        return true;
      }

      if (errors.service) {
        return Object.values(errors.service).some(
          (serviceErrors) =>
            Object.keys(serviceErrors).length > 0,
        );
      }

      return false;
    },
    [],
  );

  const validateAll = useCallback((): boolean => {
    const agreementErrors = validateAgreementStep();

    if (hasValidationErrors(agreementErrors)) {
      setValidationErrors(agreementErrors);
      setCurrentStep(1);
      return false;
    }

    const financialErrors = validateFinancialStep();

    if (hasValidationErrors(financialErrors)) {
      setValidationErrors(financialErrors);
      setCurrentStep(2);
      return false;
    }

    const reviewErrors = validateReviewStep();

    if (hasValidationErrors(reviewErrors)) {
      setValidationErrors(reviewErrors);
      setCurrentStep(3);
      return false;
    }

    setValidationErrors({});
    return true;
  }, [
    validateAgreementStep,
    validateFinancialStep,
    validateReviewStep,
    hasValidationErrors,
  ]);

  /*
   * Step Navigation
   */

  const nextStep = useCallback(() => {
    const errors = validateStep(currentStep);

    if (hasValidationErrors(errors)) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    setCurrentStep((previous) => {
      if (previous === 1) return 2;
      if (previous === 2) return 3;
      return previous;
    });
  }, [currentStep, validateStep, hasValidationErrors]);

  const previousStep = useCallback(() => {
    setValidationErrors({});

    setCurrentStep((previous) => {
      if (previous === 3) return 2;
      if (previous === 2) return 1;
      return previous;
    });
  }, []);

  const goToStep = useCallback(
    (targetStep: Step) => {
      if (targetStep === currentStep) {
        return;
      }

      if (targetStep < currentStep) {
        setValidationErrors({});
        setCurrentStep(targetStep);
        return;
      }

      for (let step = currentStep; step < targetStep; step++) {
        const errors = validateStep(step as Step);

        if (hasValidationErrors(errors)) {
          setValidationErrors(errors);
          setCurrentStep(step as Step);
          return;
        }
      }

      setValidationErrors({});
      setCurrentStep(targetStep);
    },
    [currentStep, validateStep, hasValidationErrors],
  );

  /*
   * Build JSON-Compatible Payload
   */

  const buildPayload = useCallback(() => {
    const serviceId = agreement.revenueServiceId;

    const selectedService = findRevenueService(
      revenueServices,
      serviceId,
    );

    const values = serviceId
      ? serviceFieldValues[serviceId] ?? {}
      : {};

    const selectedFiles = serviceId
      ? serviceFiles[serviceId] ?? {}
      : {};

    const serviceFields = buildBackendServiceFields(
      selectedService,
      values,
      selectedFiles,
    );

    return {
      taxpayer_id: agreement.taxpayerId,
      revenue_service_id: serviceId,
      service_fields: serviceFields,
      source: agreement.source,
      notes: agreement.notes,
      original_obligation: financial.originalObligation,
      amount_already_paid: financial.amountAlreadyPaid,
      balance_as_of_date: financial.balanceAsOfDate,
      removed_file_ids: serviceId
        ? removedFiles[serviceId] ?? []
        : [],
    };
  }, [
    agreement,
    financial,
    revenueServices,
    serviceFieldValues,
    serviceFiles,
    removedFiles,
  ]);

  /*
   * Build Multipart FormData
   *
   * File field:
   *   file__SERVICE_UUID__FIELD_UUID
   *
   * JSON reference:
   *   {
   *     "FIELD_UUID": {
   *       "__file": "file__SERVICE_UUID__FIELD_UUID"
   *     }
   *   }
   */

  const buildFormData = useCallback((): FormData => {
    const payload = buildPayload();
    const formData = new FormData();

    formData.append("taxpayer_id", payload.taxpayer_id);
    formData.append(
      "revenue_service_id",
      payload.revenue_service_id,
    );
    formData.append(
      "service_fields",
      JSON.stringify(payload.service_fields),
    );
    formData.append("source", payload.source);
    formData.append("notes", payload.notes);
    formData.append(
      "original_obligation",
      payload.original_obligation,
    );
    formData.append(
      "amount_already_paid",
      payload.amount_already_paid,
    );
    formData.append(
      "balance_as_of_date",
      payload.balance_as_of_date,
    );
    formData.append(
      "removed_file_ids",
      JSON.stringify(payload.removed_file_ids),
    );

    const serviceId = agreement.revenueServiceId;

    const selectedService = findRevenueService(
      revenueServices,
      serviceId,
    );

    const selectedFiles = serviceId
      ? serviceFiles[serviceId] ?? {}
      : {};

    for (const field of getRevenueServiceFields(selectedService)) {
      const fieldId = normalizeIdentifier(
        firstValue(field, ["id", "fieldId", "field_id"]),
      );

      const fieldKey = getFrontendFieldKey(field);

      if (!fieldId || !fieldKey) {
        continue;
      }

      const file = selectedFiles[fieldKey];

      if (!(file instanceof File)) {
        continue;
      }

      formData.append(
        `file__${serviceId}__${fieldId}`,
        file,
        file.name,
      );
    }

    return formData;
  }, [
    buildPayload,
    agreement.revenueServiceId,
    revenueServices,
    serviceFiles,
  ]);

  /*
   * Reset
   */

  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setAgreement({ ...INITIAL_AGREEMENT });
    setFinancial({ ...INITIAL_FINANCIAL });
    setServiceFieldValues({});
    setServiceFiles({});
    setRemovedFiles({});
    setValidationErrors({});
  }, []);

  /*
   * Public Hook API
   */

  return {
    isEditMode,
    assessmentId,

    currentStep,
    nextStep,
    previousStep,
    goToStep,

    validationErrors,
    validateStep,
    validateAll,

    buildPayload,
    buildFormData,

    resetForm,

    agreement,
    updateAgreement,

    financial,
    updateFinancial,

    taxpayers,
    selectedTaxpayer,
    selectTaxpayer,
    clearTaxpayer,

    revenueServices,
    selectedRevenueService,
    revenueCode,
    selectRevenueService,

    serviceFieldValues,
    serviceFiles,
    setServiceFieldValue,
    handleFileChange,
    removeFile,
    removeService,

    outstandingBalance,
  };
}
