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

/*
|--------------------------------------------------------------------------
| Actual Uploaded Files
|--------------------------------------------------------------------------
|
| Files are deliberately separate from serviceFieldValues.
|
| Shape:
|
| {
|   [serviceId]: {
|     [frontendFieldKey]: File
|   }
| }
|
| File objects are appended to FormData, never JSON.stringify'd.
|--------------------------------------------------------------------------
*/

export type ServiceFileValues = Record<
  string,
  Record<string, File>
>;

/*
|--------------------------------------------------------------------------
| Validation Types
|--------------------------------------------------------------------------
*/

export type ValidationErrors = {
  agreement?: Record<string, string>;
  financial?: Record<string, string>;
  service?: Record<string, Record<string, string>>;
};

/*
|--------------------------------------------------------------------------
| Hook Options
|--------------------------------------------------------------------------
*/

export interface UseExistingAgreementOptions {
  taxpayers: Citizen[];
  revenueServices: RevenueService[];
  assessmentId?: string;
  initialData?: unknown;
}

/*
|--------------------------------------------------------------------------
| Generic API Types
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Normalize Service Field Value
|--------------------------------------------------------------------------
*/

function normalizeServiceFieldValue(
  value: unknown,
): ServiceFieldValue {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value ?? "");
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

/*
|--------------------------------------------------------------------------
| Revenue Service ID
|--------------------------------------------------------------------------
*/

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
| Find Matching Revenue Service
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
      (service) => String(service.id) === String(serviceId),
    ) ?? null
  );
}

/*
|--------------------------------------------------------------------------
| Revenue Service Fields
|--------------------------------------------------------------------------
*/

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

  if (!Array.isArray(fields)) {
    return [];
  }

  return fields.filter(isRecord);
}

/*
|--------------------------------------------------------------------------
| Normalize Identifier
|--------------------------------------------------------------------------
*/

function normalizeIdentifier(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

/*
|--------------------------------------------------------------------------
| Frontend Field Key
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Field Identifiers
|--------------------------------------------------------------------------
*/

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

  const identifiers: string[] = [];

  for (const candidate of candidates) {
    const normalized = normalizeIdentifier(candidate);

    if (normalized && !identifiers.includes(normalized)) {
      identifiers.push(normalized);
    }
  }

  return identifiers;
}

/*
|--------------------------------------------------------------------------
| Case-Insensitive Identifier Match
|--------------------------------------------------------------------------
*/

function identifiersMatch(
  left: string,
  right: string,
): boolean {
  if (!left || !right) {
    return false;
  }

  return (
    left.trim().toLowerCase() === right.trim().toLowerCase()
  );
}

/*
|--------------------------------------------------------------------------
| Resolve Persisted Field → Frontend Field Key
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
      const uuidIdentifiers = [
        field.id,
        field.fieldId,
        field.field_id,
      ]
        .map(normalizeIdentifier)
        .filter(Boolean);

      if (
        uuidIdentifiers.some((identifier) =>
          identifiersMatch(identifier, persistedFieldId),
        )
      ) {
        return getFrontendFieldKey(field);
      }
    }
  }

  if (persistedFieldCode) {
    for (const field of fields) {
      const identifiers = getFieldIdentifiers(field);

      if (
        identifiers.some((identifier) =>
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
| Extract Actual API Service Values
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

  if (!assessmentService) {
    return result;
  }

  const persistedValues = assessmentService.values;

  if (!Array.isArray(persistedValues)) {
    return result;
  }

  const revenueService = findRevenueService(
    revenueServices,
    revenueServiceId,
  );

  const serviceFields = getRevenueServiceFields(revenueService);

  const values: Record<string, ServiceFieldValue> = {};

  for (const persistedValue of persistedValues) {
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
      firstValue(persistedValue, [
        "fieldCode",
        "field_code",
      ]),
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
| Resolve Financial Value
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

  if (!isEmptyValue(serviceValue)) {
    return toStringValue(serviceValue);
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| Build Backend Service Fields
|--------------------------------------------------------------------------
|
| Frontend:
|   LAND_AREA: 2000
|
| Backend:
|   "<RevenueServiceField UUID>": 2000
|
| When a new file has been selected for a field, that field is
| omitted from service_fields. The actual File is sent separately.
|--------------------------------------------------------------------------
*/

function buildBackendServiceFields(
  service: RevenueService | null,
  values: Record<string, ServiceFieldValue>,
  selectedFiles: Record<string, File>,
): Record<string, ServiceFieldValue> {
  if (!service) {
    return {};
  }

  const result: Record<string, ServiceFieldValue> = {};
  const fields = getRevenueServiceFields(service);

  for (const field of fields) {
    const fieldId = normalizeIdentifier(
      firstValue(field, ["id", "fieldId", "field_id"]),
    );

    const fieldKey = getFrontendFieldKey(field);

    if (!fieldId || !fieldKey) {
      continue;
    }

    /*
     * Do not submit a filename or stale field value alongside
     * a newly selected upload. The File is sent separately.
     */
    if (
      Object.prototype.hasOwnProperty.call(
        selectedFiles,
        fieldKey,
      )
    ) {
      continue;
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        values,
        fieldKey,
      )
    ) {
      continue;
    }

    result[fieldId] = values[fieldKey];
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
  /*
   * Mode
   */

  const isEditMode = Boolean(assessmentId);

  /*
   * Workflow
   */

  const [currentStep, setCurrentStep] = useState<Step>(1);

  /*
   * Agreement
   */

  const [agreement, setAgreement] =
    useState<ExistingAgreementForm>(INITIAL_AGREEMENT);

  /*
   * Financial Position
   */

  const [financial, setFinancial] =
    useState<ExistingFinancialPosition>(INITIAL_FINANCIAL);

  /*
   * Dynamic Service Fields
   */

  const [serviceFieldValues, setServiceFieldValues] =
    useState<ServiceFieldValues>({});

  /*
   * Actual uploaded files.
   *
   * Do not put File objects or newly selected filenames
   * into serviceFieldValues.
   */

  const [serviceFiles, setServiceFiles] =
    useState<ServiceFileValues>({});

  /*
   * Validation
   */

  const [validationErrors, setValidationErrors] =
    useState<ValidationErrors>({});

  /*
   *----------------------------------------------------------------------
   * Edit Hydration
   *----------------------------------------------------------------------
   */

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    if (!isRecord(initialData)) {
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
      firstValue(data, [
        "sourceType",
        "source_type",
        "source",
      ]),
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

    const originalObligation = resolveFinancialValue(
      data,
      services,
      [
        "originalObligation",
        "original_obligation",
        "computedAmount",
        "computed_amount",
      ],
    );

    const amountAlreadyPaid = resolveFinancialValue(
      data,
      services,
      [
        "paidAmount",
        "paid_amount",
        "amountAlreadyPaid",
        "amount_already_paid",
      ],
    );

    const balanceAsOfDate = resolveFinancialValue(
      data,
      services,
      [
        "balanceAsOfDate",
        "balance_as_of_date",
      ],
    );

    setFinancial({
      originalObligation,
      amountAlreadyPaid,
      balanceAsOfDate,
    });

    const hydratedServiceFields =
      extractServiceFieldValues(
        services,
        revenueServiceId,
        revenueServices,
      );

    setServiceFieldValues(hydratedServiceFields);
    setValidationErrors({});
  }, [
    isEditMode,
    initialData,
    revenueServices,
  ]);

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
          String(taxpayer.id) ===
          String(agreement.taxpayerId),
      ) ?? null
    );
  }, [taxpayers, agreement.taxpayerId]);

  /*
   * Selected Revenue Service
   */

  const selectedRevenueService =
    useMemo<RevenueService | null>(() => {
      return findRevenueService(
        revenueServices,
        agreement.revenueServiceId,
      );
    }, [
      revenueServices,
      agreement.revenueServiceId,
    ]);

  /*
   * Revenue Code
   */

  const revenueCode =
    (
      selectedRevenueService as
        | (RevenueService & { code?: string })
        | null
        | undefined
    )?.code ?? "";

  /*
   * Outstanding Balance
   */

  const outstandingBalance = useMemo(() => {
    const original = Number(financial.originalObligation);
    const paid = Number(financial.amountAlreadyPaid);

    if (
      !Number.isFinite(original) ||
      !Number.isFinite(paid)
    ) {
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

  const clearAgreementError = useCallback(
    (field: string) => {
      setValidationErrors((previous) => {
        if (!previous.agreement?.[field]) {
          return previous;
        }

        const agreementErrors = {
          ...previous.agreement,
        };

        delete agreementErrors[field];

        return {
          ...previous,
          agreement:
            Object.keys(agreementErrors).length > 0
              ? agreementErrors
              : undefined,
        };
      });
    },
    [],
  );

  /*
   * Clear Financial Error
   */

  const clearFinancialError = useCallback(
    (field: string) => {
      setValidationErrors((previous) => {
        if (!previous.financial?.[field]) {
          return previous;
        }

        const financialErrors = {
          ...previous.financial,
        };

        delete financialErrors[field];

        return {
          ...previous,
          financial:
            Object.keys(financialErrors).length > 0
              ? financialErrors
              : undefined,
        };
      });
    },
    [],
  );

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
   * Select Taxpayer
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

  /*
   * Clear Taxpayer
   */

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
        const currentErrors =
          previous.service?.[revenueServiceId];

        if (!currentErrors) {
          return previous;
        }

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
        const serviceErrors =
          previous.service?.[serviceId];

        if (!serviceErrors?.[field]) {
          return previous;
        }

        const updatedErrors = {
          ...serviceErrors,
        };

        delete updatedErrors[field];

        const nextServiceErrors = {
          ...(previous.service ?? {}),
          [serviceId]: updatedErrors,
        };

        if (Object.keys(updatedErrors).length > 0) {
          return {
            ...previous,
            service: nextServiceErrors,
          };
        }

        const copy = {
          ...(previous.service ?? {}),
        };

        delete copy[serviceId];

        return {
          ...previous,
          service:
            Object.keys(copy).length > 0
              ? copy
              : undefined,
        };
      });
    },
    [],
  );

  /*
   *----------------------------------------------------------------------
   * Handle Actual File Upload
   *----------------------------------------------------------------------
   *
   * Store the actual File object in serviceFiles.
   *
   * IMPORTANT:
   * - Do not set file.name in serviceFieldValues.
   * - buildFormData() will upload the File separately.
   */

  const handleFileChange = useCallback(
    (
      serviceId: string,
      field: string,
      file: File | null,
    ) => {
      setServiceFiles((previous) => {
        const serviceFilesForService = {
          ...(previous[serviceId] ?? {}),
        };

        if (file) {
          serviceFilesForService[field] = file;
        } else {
          delete serviceFilesForService[field];
        }

        const next = {
          ...previous,
        };

        if (
          Object.keys(serviceFilesForService).length > 0
        ) {
          next[serviceId] = serviceFilesForService;
        } else {
          delete next[serviceId];
        }

        return next;
      });

      /*
       * Clear the previous field value when removing a file.
       * For a newly selected file, do not save its filename
       * in serviceFieldValues.
       */
      if (!file) {
        setServiceFieldValue(serviceId, field, "");
        return;
      }

      /*
       * Clear a required-field error when a real File is selected.
       */
      setValidationErrors((previous) => {
        const fieldErrors =
          previous.service?.[serviceId];

        if (!fieldErrors?.[field]) {
          return previous;
        }

        const updatedErrors = {
          ...fieldErrors,
        };

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
    [setServiceFieldValue],
  );

  /*
   * Remove File
   */

  const removeFile = useCallback(
    (
      serviceId: string,
      field: string,
    ) => {
      setServiceFiles((previous) => {
        const serviceFilesForService = {
          ...(previous[serviceId] ?? {}),
        };

        delete serviceFilesForService[field];

        const next = {
          ...previous,
        };

        if (
          Object.keys(serviceFilesForService).length > 0
        ) {
          next[serviceId] = serviceFilesForService;
        } else {
          delete next[serviceId];
        }

        return next;
      });

      setServiceFieldValue(serviceId, field, "");
    },
    [setServiceFieldValue],
  );

  /*
   * Remove Service
   */

  const removeService = useCallback(
    (serviceId: string) => {
      setServiceFieldValues((previous) => {
        const next = {
          ...previous,
        };

        delete next[serviceId];

        return next;
      });

      setServiceFiles((previous) => {
        const next = {
          ...previous,
        };

        delete next[serviceId];

        return next;
      });

      setValidationErrors((previous) => {
        if (!previous.service?.[serviceId]) {
          return previous;
        }

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
    [
      agreement.revenueServiceId,
      clearAgreementError,
    ],
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
        const values =
          serviceFieldValues[serviceId] ?? {};

        const selectedFiles =
          serviceFiles[serviceId] ?? {};

        const fields = getRevenueServiceFields(service);

        for (const field of fields) {
          const required =
            field.required === true ||
            field.is_required === true;

          if (!required) {
            continue;
          }

          const fieldKey = getFrontendFieldKey(field);

          if (!fieldKey) {
            continue;
          }

          const value = values[fieldKey];
          const selectedFile = selectedFiles[fieldKey];

          /*
           * A real selected File satisfies a required file field.
           * Ordinary fields continue to use serviceFieldValues.
           */
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

      if (Object.keys(errors).length === 0) {
        return {};
      }

      return {
        financial: errors,
      };
    },
    [
      financial.originalObligation,
      financial.amountAlreadyPaid,
      financial.balanceAsOfDate,
    ],
  );

  /*
   * Validate Review
   */

  const validateReviewStep = useCallback(
    (): ValidationErrors => ({}),
    [],
  );

  /*
   * Validate Step
   */

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

  /*
   * Has Validation Errors
   */

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

  /*
   * Validate All
   */

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
   * Next Step
   */

  const nextStep = useCallback(() => {
    const errors = validateStep(currentStep);

    if (hasValidationErrors(errors)) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    setCurrentStep((previous) => {
      if (previous === 1) {
        return 2;
      }

      if (previous === 2) {
        return 3;
      }

      return previous;
    });
  }, [
    currentStep,
    validateStep,
    hasValidationErrors,
  ]);

  /*
   * Previous Step
   */

  const previousStep = useCallback(() => {
    setValidationErrors({});

    setCurrentStep((previous) => {
      if (previous === 3) {
        return 2;
      }

      if (previous === 2) {
        return 1;
      }

      return previous;
    });
  }, []);

  /*
   * Go To Step
   */

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

      for (
        let step = currentStep;
        step < targetStep;
        step++
      ) {
        const stepNumber = step as Step;
        const errors = validateStep(stepNumber);

        if (hasValidationErrors(errors)) {
          setValidationErrors(errors);
          setCurrentStep(stepNumber);
          return;
        }
      }

      setValidationErrors({});
      setCurrentStep(targetStep);
    },
    [
      currentStep,
      validateStep,
      hasValidationErrors,
    ],
  );

  /*
   *----------------------------------------------------------------------
   * Build JSON-Compatible Payload
   *----------------------------------------------------------------------
   *
   * This payload contains only ordinary fields.
   * Binary files are appended separately in buildFormData().
   */

  const buildPayload = useCallback(() => {
    const serviceId = agreement.revenueServiceId;

    const selectedService = findRevenueService(
      revenueServices,
      serviceId,
    );

    const frontendServiceFields = serviceId
      ? serviceFieldValues[serviceId] ?? {}
      : {};

    const selectedFiles = serviceId
      ? serviceFiles[serviceId] ?? {}
      : {};

    const backendServiceFields =
      buildBackendServiceFields(
        selectedService,
        frontendServiceFields,
        selectedFiles,
      );

    return {
      taxpayer_id: agreement.taxpayerId,
      revenue_service_id: serviceId,
      service_fields: backendServiceFields,
      source: agreement.source,
      notes: agreement.notes,
      original_obligation: financial.originalObligation,
      amount_already_paid: financial.amountAlreadyPaid,
      balance_as_of_date: financial.balanceAsOfDate,
    };
  }, [
    agreement,
    financial,
    revenueServices,
    serviceFieldValues,
    serviceFiles,
  ]);

  /*
   *----------------------------------------------------------------------
   * Build FormData
   *----------------------------------------------------------------------
   *
   * Example:
   *
   * service_files[01a12dc6-2b29-71c6-bc13-add423653d27]
   *   = actual PDF File object
   *
   * Do not append the filename to service_fields.
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

    /*
     * Append actual selected files.
     *
     * Frontend field key → RevenueServiceField UUID.
     */
    const serviceId = agreement.revenueServiceId;

    const selectedService = findRevenueService(
      revenueServices,
      serviceId,
    );

    const selectedFiles = serviceId
      ? serviceFiles[serviceId] ?? {}
      : {};

    const fields = getRevenueServiceFields(selectedService);

    for (const field of fields) {
      const fieldId = normalizeIdentifier(
        firstValue(field, [
          "id",
          "fieldId",
          "field_id",
        ]),
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
        `service_files[${fieldId}]`,
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

    setAgreement({
      ...INITIAL_AGREEMENT,
    });

    setFinancial({
      ...INITIAL_FINANCIAL,
    });

    setServiceFieldValues({});
    setServiceFiles({});
    setValidationErrors({});
  }, []);

  /*
   * Return API
   */

  return {
    /*
     * Mode
     */
    isEditMode,
    assessmentId,

    /*
     * Workflow
     */
    currentStep,
    nextStep,
    previousStep,
    goToStep,

    /*
     * Validation
     */
    validationErrors,
    validateStep,
    validateAll,

    /*
     * Payload
     */
    buildPayload,
    buildFormData,

    /*
     * Reset
     */
    resetForm,

    /*
     * Agreement
     */
    agreement,
    updateAgreement,

    /*
     * Financial
     */
    financial,
    updateFinancial,

    /*
     * Taxpayer
     */
    taxpayers,
    selectedTaxpayer,
    selectTaxpayer,
    clearTaxpayer,

    /*
     * Revenue service
     */
    revenueServices,
    selectedRevenueService,
    revenueCode,
    selectRevenueService,

    /*
     * Dynamic service fields
     */
    serviceFieldValues,
    serviceFiles,
    setServiceFieldValue,
    handleFileChange,
    removeFile,
    removeService,

    /*
     * Financial calculation for display only.
     * Backend remains authoritative.
     */
    outstandingBalance,
  };
}
