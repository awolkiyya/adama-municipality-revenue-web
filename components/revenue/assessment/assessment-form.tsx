// components/revenue/assessment/assessment-form.tsx

"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Save,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  RevenueField,
  RevenueService,
  SubmissionResult,
} from "@/types/revenue/assessment";

import { TaxpayerSelector } from "./taxpayer-selector";
import { RevenueServiceSelector } from "./revenue-service-selector";
import { RevenueServiceFields } from "./revenue-service-fields";

import { Citizen } from "@/types/citizen";

// =====================================================
// TYPES
// =====================================================

type FieldValue = unknown;

type ServiceFieldValues = Record<
  string,
  Record<string, FieldValue>
>;

type AssessmentMode = "create" | "edit";

/**
 * Existing assessment data accepted by the form.
 *
 * The API can return slightly different naming conventions,
 * therefore the mapper below supports the common variants.
 */
export type InitialAssessment = {
  id?: string;

  citizenId?: string | null;

  taxpayer?: {
    id?: string | null;
    citizenUid?: string | null;
    fullName?: string | null;
    nationalId?: string | null;
  } | null;

  notes?: string | null;

  services?: unknown[];

  serviceFieldValues?: ServiceFieldValues;
  service_field_values?: ServiceFieldValues;

  status?: string | null;

  [key: string]: unknown;
};

type AssessmentFormProps = {
  mode?: AssessmentMode;

  initialAssessment?: InitialAssessment | null;

  taxpayers: Citizen[];

  revenueServices: RevenueService[];

  taxpayerLoading?: boolean;
  taxpayerError?: boolean;

  revenueServicesLoading?: boolean;
  revenueServicesError?: boolean;

  onRetryRevenueServices?: () => void;

  onSubmit?: (
    formData: FormData,
  ) => Promise<SubmissionResult>;

  onSaveDraft?: (
    formData: FormData,
  ) => Promise<SubmissionResult>;

  onBack?: () => void;
};

// =====================================================
// STEP CONFIG
// =====================================================

const STEPS = [
  {
    key: "taxpayer",
    title: "Taxpayer",
    description:
      "Select the taxpayer this assessment is for.",
  },
  {
    key: "services",
    title: "Revenue Services",
    description:
      "Choose the revenue services that apply.",
  },
  {
    key: "details",
    title: "Service Details",
    description:
      "Provide the required information for each service.",
  },
  {
    key: "notes",
    title: "Notes",
    description:
      "Add any supporting information (optional).",
  },
  {
    key: "review",
    title: "Review & Submit",
    description:
      "Confirm everything before submitting.",
  },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

// =====================================================
// HELPERS
// =====================================================

const isEmptyValue = (
  value: unknown,
): boolean => {
  return (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  );
};

const isRecord = (
  value: unknown,
): value is Record<string, unknown> => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
};

const getStringValue = (
  value: unknown,
): string => {
  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return "";
};

const getInitialTaxpayerId = (
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

/**
 * Extract the service ID from different possible API shapes.
 */
const getInitialServiceId = (
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

/**
 * Extract dynamic field values from an existing service.
 *
 * API format:
 *
 * values: [
 *   {
 *     fieldCode: "PRICE",
 *     value: 10000
 *   },
 *   {
 *     fieldCode: "PROPERTY_TYPE",
 *     value: "COMMERCIAL"
 *   }
 * ]
 *
 * Form format:
 *
 * {
 *   PRICE: 10000,
 *   PROPERTY_TYPE: "COMMERCIAL"
 * }
 */
const getInitialServiceFields = (
  service: unknown,
): Record<string, FieldValue> => {
  if (!isRecord(service)) {
    return {};
  }

  // =================================================
  // API ASSESSMENT FORMAT
  // =================================================

  if (Array.isArray(service.values)) {
    const result: Record<
      string,
      FieldValue
    > = {};

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

      result[fieldCode] =
        item.value ?? null;
    }

    return result;
  }

  // =================================================
  // OTHER / LEGACY FORMATS
  // =================================================

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

/**
 * Normalize initial service field values.
 *
 * Expected shape:
 *
 * {
 *   serviceId: {
 *     fieldKey: value
 *   }
 * }
 */
const buildInitialServiceFieldValues = (
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

    for (const [
      serviceId,
      values,
    ] of Object.entries(directValues)) {
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
    const serviceId =
      getInitialServiceId(service);

    if (!serviceId) {
      continue;
    }

    result[serviceId] =
      getInitialServiceFields(service);
  }

  return result;
};

/**
 * Get the initial selected service IDs.
 */
const buildInitialServiceIds = (
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
      (
        id,
      ): id is string =>
        id.length > 0,
    );
};

/**
 * Determine whether a value represents an
 * existing uploaded file.
 */
const isExistingFileValue = (
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

/**
 * Existing MULTI_FILE values.
 */
const hasExistingFiles = (
  value: unknown,
): boolean => {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.some(
    isExistingFileValue,
  );
};

const getFieldOptions = (field: RevenueField) => {
  return [...(field.options ?? [])].sort(
    (a, b) =>
      (a.sortOrder ?? 0) -
      (b.sortOrder ?? 0),
  );
};

/**
 * Validate SELECT value against configured options.
 */
const isValidSelectValue = (
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

// =====================================================
// COMPONENT
// =====================================================

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

  console.log("incomming services",revenueServices);


  // ===================================================
  // INITIAL DATA
  // ===================================================

  const initialTaxpayerId =
    useMemo(
      () =>
        getInitialTaxpayerId(
          initialAssessment,
        ),
      [initialAssessment],
    );

  const initialServiceIds =
    useMemo(
      () =>
        buildInitialServiceIds(
          initialAssessment,
        ),
      [initialAssessment],
    );

  const initialFieldValues =
    useMemo(
      () =>
        buildInitialServiceFieldValues(
          initialAssessment,
        ),
      [initialAssessment],
    );

  const initialNotes =
    useMemo(
      () =>
        initialAssessment?.notes ??
        "",
      [initialAssessment],
    );

  // ===================================================
  // STATE
  // ===================================================

  const [
    taxpayerId,
    setTaxpayerId,
  ] = useState(
    initialTaxpayerId,
  );

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

  const [notes, setNotes] =
    useState(initialNotes);

  const [
    isSaving,
    setIsSaving,
  ] = useState<
    "draft" | "submit" | null
  >(null);

  const [
    submissionResult,
    setSubmissionResult,
  ] =
    useState<SubmissionResult | null>(
      null,
    );

  const [
    submissionError,
    setSubmissionError,
  ] =
    useState<string | null>(null);

  // ===================================================
  // STEP STATE
  // ===================================================

  const [
    currentStep,
    setCurrentStep,
  ] = useState(0);

  const [
    furthestStep,
    setFurthestStep,
  ] = useState(0);

  /**
   * In edit mode, existing assessment data can already
   * contain completed information.
   */
  useEffect(() => {
    if (
      mode === "edit" &&
      initialAssessment
    ) {
      setFurthestStep(
        STEPS.length - 1,
      );
    }
  }, [mode, initialAssessment]);

  // ===================================================
  // SYNCHRONIZE EDIT DATA
  // ===================================================

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
      initialAssessment.notes ??
        "",
    );
  }, [initialAssessment]);

  // ===================================================
  // SELECTED TAXPAYER
  // ===================================================

  const selectedTaxpayer =
    useMemo(
      () =>
        taxpayers.find(
          (taxpayer) =>
            String(
              taxpayer.id,
            ) ===
            String(
              taxpayerId,
            ),
        ) ?? null,
      [
        taxpayers,
        taxpayerId,
      ],
    );

  // ===================================================
  // SELECTED SERVICES
  // ===================================================

  const selectedServices =
    useMemo(
      () =>
        revenueServices.filter(
          (service) =>
            selectedServiceIds.includes(
              service.id,
            ),
        ),
      [
        revenueServices,
        selectedServiceIds,
      ],
    );

  // ===================================================
  // SERVICE VALUES
  // ===================================================

  const getServiceValues = (
    serviceId: string,
  ): Record<
    string,
    FieldValue
  > =>
    serviceFieldValues[
      serviceId
    ] ?? {};

  // ===================================================
  // RESET FEEDBACK
  // ===================================================

  const clearFeedback = () => {
    setSubmissionResult(null);
    setSubmissionError(null);
  };

  // ===================================================
  // FIELD CHANGE
  // ===================================================

  const setServiceFieldValue = (
    serviceId: string,
    key: string,
    value: FieldValue,
  ) => {
    setServiceFieldValues(
      (previous) => ({
        ...previous,

        [serviceId]: {
          ...(previous[
            serviceId
          ] ?? {}),

          [key]: value,
        },
      }),
    );

    clearFeedback();
  };

  // ===================================================
  // TAXPAYER CHANGE
  // ===================================================

  const handleTaxpayerChange = (
    id: string,
  ) => {
    setTaxpayerId(id);
    clearFeedback();
  };

  // ===================================================
  // SERVICE SELECTION
  // ===================================================

  const handleServiceSelectionChange =
    (
      serviceIds: string[],
    ) => {
      setSelectedServiceIds(
        serviceIds,
      );

      setServiceFieldValues(
        (previous) => {
          const next: ServiceFieldValues =
            {};

          for (
            const serviceId of serviceIds
          ) {
            if (
              previous[
                serviceId
              ]
            ) {
              next[
                serviceId
              ] =
                previous[
                  serviceId
                ];
            }
          }

          return next;
        },
      );

      clearFeedback();
    };

  // ===================================================
  // REMOVE SERVICE
  // ===================================================

  const removeService = (
    serviceId: string,
  ) => {
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

        delete next[
          serviceId
        ];

        return next;
      },
    );

    clearFeedback();
  };

  // ===================================================
  // CLEAR SERVICES
  // ===================================================

  const handleClearServices = () => {
    setSelectedServiceIds([]);
    setServiceFieldValues({});
    clearFeedback();
  };
  
  console.log("sellected service",selectedServices);


  // ===================================================
  // VALIDATION
  //
  // DATA VALIDATION ONLY.
  //
  // No:
  // - tariff calculation
  // - price calculation
  // - amount calculation
  // - total calculation
  // ===================================================

  const validationErrors =
    useMemo(() => {
      const errors: Record<
        string,
        Record<string, string>
      > = {};

      for (
        const service of selectedServices
      ) {
        const values =
          getServiceValues(
            service.id,
          );

        const serviceErrors: Record<
          string,
          string
        > = {};

        for (
          const field of service.fields
        ) {
          if (!field.required) {
            continue;
          }

          const value =
            values[
              field.key
            ];

          // -------------------------------------------
          // FILE
          // -------------------------------------------

          if (
            field.type === "FILE"
          ) {
            if (
              mode === "edit" &&
              isExistingFileValue(
                value,
              )
            ) {
              continue;
            }

            if (
              !(value instanceof File)
            ) {
              serviceErrors[
                field.key
              ] =
                `${field.label} is required.`;
            }

            continue;
          }

          // -------------------------------------------
          // MULTI FILE
          // -------------------------------------------

          if (
            field.type ===
            "MULTI_FILE"
          ) {
            if (
              mode === "edit" &&
              hasExistingFiles(
                value,
              )
            ) {
              continue;
            }

            if (
              !Array.isArray(
                value,
              ) ||
              value.length === 0
            ) {
              serviceErrors[
                field.key
              ] =
                `${field.label} is required.`;
            }

            continue;
          }

          // -------------------------------------------
          // CHECKBOX
          // -------------------------------------------

          if (
            field.type ===
            "CHECKBOX"
          ) {
            if (value !== true) {
              serviceErrors[
                field.key
              ] =
                `Please confirm ${field.label.toLowerCase()}.`;
            }

            continue;
          }

          // -------------------------------------------
          // SELECT
          // -------------------------------------------

          if (
            field.type === "SELECT"
          ) {
            if (
              isEmptyValue(value)
            ) {
              serviceErrors[
                field.key
              ] =
                `${field.label} is required.`;

              continue;
            }

            const options =
              getFieldOptions(
                field,
              );

            if (
              options.length === 0
            ) {
              serviceErrors[
                field.key
              ] =
                `${field.label} has no active options configured.`;

              continue;
            }

            if (
              !isValidSelectValue(
                field,
                value,
              )
            ) {
              serviceErrors[
                field.key
              ] =
                `${field.label} has an invalid selection.`;
            }

            continue;
          }

          // -------------------------------------------
          // NORMAL VALUE
          // -------------------------------------------

          if (
            isEmptyValue(value)
          ) {
            serviceErrors[
              field.key
            ] =
              `${field.label} is required.`;

            continue;
          }

          // -------------------------------------------
          // NUMBER / DECIMAL
          // -------------------------------------------

          if (
            field.type ===
              "NUMBER" ||
            field.type ===
              "DECIMAL"
          ) {
            const numeric =
              Number(value);

            if (
              Number.isNaN(
                numeric,
              )
            ) {
              serviceErrors[
                field.key
              ] =
                `${field.label} must be a valid number.`;

              continue;
            }

            if (
              field.min !==
                undefined &&
              numeric <
                Number(
                  field.min,
                )
            ) {
              serviceErrors[
                field.key
              ] =
                `${field.label} cannot be less than ${field.min}.`;
            }

            if (
              field.max !==
                undefined &&
              numeric >
                Number(
                  field.max,
                )
            ) {
              serviceErrors[
                field.key
              ] =
                `${field.label} cannot exceed ${field.max}.`;
            }
          }
        }

        if (
          Object.keys(
            serviceErrors,
          ).length > 0
        ) {
          errors[
            service.id
          ] = serviceErrors;
        }
      }

      return errors;
    }, [
      selectedServices,
      serviceFieldValues,
      mode,
    ]);

  // ===================================================
  // REQUIRED FIELD PROGRESS
  // ===================================================

  const totalRequiredFields =
    useMemo(
      () =>
        selectedServices.reduce(
          (
            total,
            service,
          ) =>
            total +
            service.fields.filter(
              (field) =>
                field.required,
            ).length,
          0,
        ),
      [selectedServices],
    );

  // ===================================================
  // FIELD COMPLETE
  // ===================================================

  const isFieldComplete = (
    service: RevenueService,
    field: RevenueField,
  ): boolean => {
    const value =
      getServiceValues(
        service.id,
      )[field.key];

    // -----------------------------------------------
    // FILE
    // -----------------------------------------------

    if (
      field.type === "FILE"
    ) {
      return (
        value instanceof File ||
        (mode === "edit" &&
          isExistingFileValue(
            value,
          ))
      );
    }

    // -----------------------------------------------
    // MULTI FILE
    // -----------------------------------------------

    if (
      field.type ===
      "MULTI_FILE"
    ) {
      return (
        (Array.isArray(value) &&
          value.length > 0) ||
        (mode === "edit" &&
          hasExistingFiles(
            value,
          ))
      );
    }

    // -----------------------------------------------
    // CHECKBOX
    // -----------------------------------------------

    if (
      field.type ===
      "CHECKBOX"
    ) {
      return value === true;
    }

    // -----------------------------------------------
    // SELECT
    // -----------------------------------------------

    if (
      field.type === "SELECT"
    ) {
      return isValidSelectValue(
        field,
        value,
      );
    }

    // -----------------------------------------------
    // NORMAL VALUE
    // -----------------------------------------------

    return !isEmptyValue(value);
  };

  // ===================================================
  // COMPLETED REQUIRED FIELDS
  // ===================================================

  const completedRequiredFields =
    useMemo(() => {
      let completed = 0;

      for (
        const service of selectedServices
      ) {
        for (
          const field of service.fields
        ) {
          if (
            field.required &&
            isFieldComplete(
              service,
              field,
            )
          ) {
            completed++;
          }
        }
      }

      return completed;
    }, [
      selectedServices,
      serviceFieldValues,
      mode,
    ]);

  // ===================================================
  // SUBMIT STATE
  // ===================================================

  const canSubmit =
    Boolean(
      selectedTaxpayer &&
        selectedServices.length >
          0 &&
        !taxpayerError &&
        !revenueServicesError &&
        Object.keys(
          validationErrors,
        ).length === 0,
    );

  // ===================================================
  // STEP VALIDITY
  // ===================================================

  const isStepComplete = (
    stepIndex: number,
  ): boolean => {
    const key =
      STEPS[stepIndex]?.key;

    switch (key as StepKey) {
      case "taxpayer":
        return (
          Boolean(
            selectedTaxpayer,
          ) && !taxpayerError
        );

      case "services":
        return (
          selectedServices.length >
            0 &&
          !revenueServicesError
        );

      case "details":
        return (
          selectedServices.length >
            0 &&
          Object.keys(
            validationErrors,
          ).length === 0
        );

      case "notes":
        return true;

      case "review":
        return canSubmit;

      default:
        return true;
    }
  };

  // ===================================================
  // STEP NAVIGATION
  // ===================================================

  const goToStep = (
    stepIndex: number,
  ) => {
    if (
      stepIndex < 0 ||
      stepIndex >=
        STEPS.length
    ) {
      return;
    }

    if (
      stepIndex <= furthestStep
    ) {
      setCurrentStep(
        stepIndex,
      );
    }
  };

  const goNext = () => {
    if (
      !isStepComplete(
        currentStep,
      )
    ) {
      return;
    }

    const next = Math.min(
      currentStep + 1,
      STEPS.length - 1,
    );

    setCurrentStep(next);

    setFurthestStep(
      (previous) =>
        Math.max(
          previous,
          next,
        ),
    );
  };

  const goBack = () => {
    setCurrentStep(
      (previous) =>
        Math.max(
          0,
          previous - 1,
        ),
    );
  };

  const isLastStep =
    currentStep ===
    STEPS.length - 1;

  // ===================================================
  // FILE CHANGE
  // ===================================================

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    serviceId: string,
    field: RevenueField,
  ) => {
    const files =
      event.target.files;

    if (!files) {
      return;
    }

    if (
      field.type ===
      "MULTI_FILE"
    ) {
      setServiceFieldValue(
        serviceId,
        field.key,
        Array.from(files),
      );
    } else {
      setServiceFieldValue(
        serviceId,
        field.key,
        files[0] ??
          undefined,
      );
    }
  };

  // ===================================================
  // REMOVE FILE
  // ===================================================

  const removeFile = (
    serviceId: string,
    field: RevenueField,
  ) => {
    setServiceFieldValue(
      serviceId,
      field.key,
      undefined,
    );
  };

  // ===================================================
  // BUILD FORM DATA
  //
  // RAW DATA ONLY.
  //
  // Backend remains authoritative for:
  //
  // - tariff resolution
  // - tariff lookup
  // - assessment calculation
  // - assessment amount
  // ===================================================

  const buildFormData = (
    status:
      | "DRAFT"
      | "PENDING_APPROVAL",
  ): FormData => {
    const formData =
      new FormData();

    // -----------------------------------------------
    // ASSESSMENT ID
    // -----------------------------------------------

    if (
      mode === "edit" &&
      initialAssessment?.id
    ) {
      formData.append(
        "assessmentId",
        initialAssessment.id,
      );
    }

    // -----------------------------------------------
    // BASIC DATA
    // -----------------------------------------------

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

    // -----------------------------------------------
    // SERVICES
    // -----------------------------------------------

    const servicesMeta =
      selectedServices.map(
        (service) => {
          const values =
            getServiceValues(
              service.id,
            );

          const fieldsMeta: Record<
            string,
            unknown
          > = {};

          for (
            const field of service.fields
          ) {
            const value =
              values[
                field.key
              ];

            // -----------------------------------------
            // SINGLE FILE
            // -----------------------------------------

            if (
              field.type ===
              "FILE"
            ) {
              if (
                value instanceof File
              ) {
                const partKey =
                  `file__${service.id}__${field.key}`;

                formData.append(
                  partKey,
                  value,
                );

                fieldsMeta[
                  field.key
                ] = {
                  __file:
                    partKey,
                };
              } else if (
                mode === "edit" &&
                isExistingFileValue(
                  value,
                )
              ) {
                fieldsMeta[
                  field.key
                ] = {
                  __existingFile:
                    value,
                };
              } else {
                fieldsMeta[
                  field.key
                ] = null;
              }

              continue;
            }

            // -----------------------------------------
            // MULTIPLE FILES
            // -----------------------------------------

            if (
              field.type ===
              "MULTI_FILE"
            ) {
              if (
                Array.isArray(
                  value,
                )
              ) {
                const newFileKeys: string[] =
                  [];

                const existingFiles: unknown[] =
                  [];

                value.forEach(
                  (
                    file,
                    index,
                  ) => {
                    if (
                      file instanceof
                      File
                    ) {
                      const partKey =
                        `file__${service.id}__${field.key}__${index}`;

                      formData.append(
                        partKey,
                        file,
                      );

                      newFileKeys.push(
                        partKey,
                      );

                      return;
                    }

                    if (
                      mode === "edit" &&
                      isExistingFileValue(
                        file,
                      )
                    ) {
                      existingFiles.push(
                        file,
                      );
                    }
                  },
                );

                fieldsMeta[
                  field.key
                ] = {
                  __files:
                    newFileKeys,

                  __existingFiles:
                    existingFiles,
                };
              } else {
                fieldsMeta[
                  field.key
                ] = null;
              }

              continue;
            }

            // -----------------------------------------
            // NORMAL FIELD
            //
            // SELECT values are submitted as the
            // option value, not the display label.
            //
            // Example:
            //
            // UI:
            // Commercial
            //
            // submitted:
            // COMMERCIAL
            // -----------------------------------------

            fieldsMeta[
              field.key
            ] =
              value ??
              null;
          }

          return {
            serviceId:
              service.id,

            serviceCode:
              service.code,

            fields:
              fieldsMeta,
          };
        },
      );

    formData.append(
      "services",
      JSON.stringify(
        servicesMeta,
      ),
    );

    return formData;
  };

  // ===================================================
  // SAVE DRAFT
  // ===================================================

  const handleSaveDraft =
    async () => {
      if (
        !selectedTaxpayer ||
        selectedServices.length ===
          0
      ) {
        return;
      }

      setIsSaving("draft");
      clearFeedback();

      try {
        const formData =
          buildFormData(
            "DRAFT",
          );

        if (!onSaveDraft) {
          throw new Error(
            "Draft submission handler is not configured.",
          );
        }

        const result =
          await onSaveDraft(
            formData,
          );

        setSubmissionResult(
          result,
        );
      } catch (error) {
        setSubmissionError(
          error instanceof Error
            ? error.message
            : "Could not save the draft.",
        );
      } finally {
        setIsSaving(null);
      }
    };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit =
    async () => {
      if (!canSubmit) {
        return;
      }

      setIsSaving("submit");
      clearFeedback();

      try {
        const formData =
          buildFormData(
            "PENDING_APPROVAL",
          );

        if (!onSubmit) {
          throw new Error(
            "Assessment submission handler is not configured.",
          );
        }

        const result =
          await onSubmit(
            formData,
          );

        setSubmissionResult(
          result,
        );
      } catch (error) {
        setSubmissionError(
          error instanceof Error
            ? error.message
            : "Could not submit the assessment.",
        );
      } finally {
        setIsSaving(null);
      }
    };

  // ===================================================
  // UI LABELS
  // ===================================================

  const isEdit =
    mode === "edit";

  const submitLabel = isEdit
    ? "Update & Submit"
    : "Submit for Approval";

  const draftLabel = isEdit
    ? "Save Changes"
    : "Save as Draft";

  const activeStepConfig =
    STEPS[currentStep];

  // ===================================================
  // PROGRESS
  // ===================================================

  const progressPercent = Math.round(
    ((currentStep + 1) /
      STEPS.length) *
      100,
  );

  const detailsProgressPercent =
    totalRequiredFields > 0
      ? Math.round(
          (completedRequiredFields /
            totalRequiredFields) *
            100,
        )
      : 100;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-5">

      {/* =================================================
          TOP PROGRESS BAR
      ================================================= */}

      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">
            Step {currentStep + 1} of{" "}
            {STEPS.length} ·{" "}
            {activeStepConfig.title}
          </span>

          <span className="text-muted-foreground">
            {progressPercent}%
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>
      </div>

      {/* =================================================
          STEP CONTENT
      ================================================= */}

      <div className="rounded-xl border bg-card shadow-sm">

        <div className="border-b p-5 sm:p-6">
          <h2 className="text-base font-semibold">
            {activeStepConfig.title}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {activeStepConfig.description}
          </p>

          {/* DETAILS PROGRESS */}

          {activeStepConfig.key ===
            "details" &&
            totalRequiredFields >
              0 && (
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Required fields
                  </span>

                  <span className="font-medium">
                    {
                      completedRequiredFields
                    }{" "}
                    /{" "}
                    {
                      totalRequiredFields
                    }
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${detailsProgressPercent}%`,
                    }}
                  />
                </div>
              </div>
            )}
        </div>

        <div className="space-y-6 p-5 sm:p-6">

          {/* ============================================
              STEP 1 — TAXPAYER
          ============================================ */}

          {activeStepConfig.key ===
            "taxpayer" && (
            <div className="space-y-3">
              <TaxpayerSelector
                value={
                  taxpayerId
                }
                onChange={
                  handleTaxpayerChange
                }
                taxpayers={
                  taxpayers
                }
              />

              {taxpayerLoading && (
                <p className="text-xs text-muted-foreground">
                  Loading taxpayers...
                </p>
              )}

              {taxpayerError && (
                <p className="text-xs text-destructive">
                  Failed to load
                  taxpayers.
                </p>
              )}
            </div>
          )}

          {/* ============================================
              STEP 2 — REVENUE SERVICES
          ============================================ */}

          {activeStepConfig.key ===
            "services" && (
            <div className="space-y-3">

              {revenueServicesError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <div className="flex items-center justify-between gap-3">

                    <p className="text-xs text-destructive">
                      Failed to load
                      revenue services.
                    </p>

                    {onRetryRevenueServices && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={
                          onRetryRevenueServices
                        }
                      >
                        Retry
                      </Button>
                    )}

                  </div>
                </div>
              )}

              <RevenueServiceSelector
                services={
                  revenueServices
                }
                selectedServiceIds={
                  selectedServiceIds
                }
                onChange={
                  handleServiceSelectionChange
                }
                onRemoveService={
                  removeService
                }
                onClearServices={
                  handleClearServices
                }
              />

              {revenueServicesLoading && (
                <p className="text-xs text-muted-foreground">
                  Loading revenue
                  services...
                </p>
              )}

            </div>
          )}

          {/* ============================================
              STEP 3 — SERVICE DETAILS
          ============================================ */}

          {activeStepConfig.key ===
            "details" && (
            <div className="space-y-6">

              {selectedServices.length ===
              0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">

                  <p className="text-sm text-muted-foreground">
                    No revenue services
                    selected yet.
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      goToStep(1)
                    }
                  >
                    Go select services
                  </Button>

                </div>
              ) : (
                selectedServices.map(
                  (
                    service,
                    index,
                  ) => (
                    <RevenueServiceFields
                      key={
                        service.id
                      }
                      service={
                        service
                      }
                      index={
                        index
                      }
                      values={
                        serviceFieldValues[
                          service.id
                        ] ?? {}
                      }
                      errors={
                        validationErrors[
                          service.id
                        ] ?? {}
                      }
                      onChange={
                        setServiceFieldValue
                      }
                      onFileChange={
                        handleFileChange
                      }
                      onRemoveFile={
                        removeFile
                      }
                      onRemove={
                        removeService
                      }
                    />
                  ),
                )
              )}

            </div>
          )}

          {/* ============================================
              STEP 4 — NOTES
          ============================================ */}

          {activeStepConfig.key ===
            "notes" && (
            <div className="flex items-start gap-3">

              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-4 w-4 text-primary" />
              </div>

              <div className="flex-1">
                <Textarea
                  placeholder="Add site visit notes, measurements, references, or other supporting information..."
                  value={notes}
                  onChange={(
                    event,
                  ) =>
                    setNotes(
                      event.target.value,
                    )
                  }
                  className="min-h-[160px] resize-none"
                />
              </div>

            </div>
          )}

          {/* ============================================
              STEP 5 — REVIEW & SUBMIT
          ============================================ */}

          {activeStepConfig.key ===
            "review" && (
            <div className="space-y-5">

              {/* TAXPAYER SUMMARY */}

              <div className="rounded-lg border p-4">

                <div className="flex items-center justify-between">

                  <p className="text-xs font-medium text-muted-foreground">
                    Taxpayer
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      goToStep(0)
                    }
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Edit
                  </button>

                </div>

                {taxpayerError ? (
                  <p className="mt-1 text-sm text-destructive">
                    Failed to load
                    taxpayers.
                  </p>
                ) : (
                  <>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedTaxpayer?.full_name ??
                        "Not selected"}
                    </p>

                    {selectedTaxpayer && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        National ID{" "}
                        {
                          selectedTaxpayer.national_id
                        }
                      </p>
                    )}
                  </>
                )}

              </div>

              {/* SERVICES SUMMARY */}

              <div className="rounded-lg border p-4">

                <div className="flex items-center justify-between">

                  <p className="text-xs font-medium text-muted-foreground">
                    Revenue services (
                    {
                      selectedServices.length
                    }
                    )
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      goToStep(1)
                    }
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Edit
                  </button>

                </div>

                {selectedServices.length ===
                0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    None selected
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">

                    {selectedServices.map(
                      (
                        service,
                      ) => (
                        <div
                          key={
                            service.id
                          }
                          className="rounded-md bg-muted/50 p-2.5"
                        >

                          <p className="truncate text-sm font-medium">
                            {
                              service.name
                            }
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {
                              service.code
                            }
                            {" · "}
                            {
                              service.category
                            }
                          </p>

                        </div>
                      ),
                    )}

                  </div>
                )}

              </div>

              {/* DETAILS SUMMARY */}

              <div className="rounded-lg border p-4">

                <div className="flex items-center justify-between">

                  <p className="text-xs font-medium text-muted-foreground">
                    Service details
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      goToStep(2)
                    }
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Edit
                  </button>

                </div>

                <div className="mt-2 flex items-center justify-between">

                  <p className="text-sm text-muted-foreground">
                    Required fields
                  </p>

                  <p className="text-sm font-medium">
                    {
                      completedRequiredFields
                    }{" "}
                    /{" "}
                    {
                      totalRequiredFields
                    }
                  </p>

                </div>

                {totalRequiredFields >
                  0 &&
                  completedRequiredFields <
                    totalRequiredFields && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      Some required
                      information is
                      still missing.
                    </p>
                  )}

              </div>

              {/* VALIDATION SUMMARY */}

              {Object.keys(
                validationErrors,
              ).length > 0 && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">

                  <div className="flex items-center justify-between">

                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                      Missing or invalid
                      information
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        goToStep(2)
                      }
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Fix
                    </button>

                  </div>

                  <div className="mt-1.5 space-y-1">

                    {Object.values(
                      validationErrors,
                    )
                      .flatMap(
                        (
                          errors,
                        ) =>
                          Object.values(
                            errors,
                          ),
                      )
                      .slice(0, 5)
                      .map(
                        (
                          error,
                          index,
                        ) => (
                          <p
                            key={
                              index
                            }
                            className="text-xs text-muted-foreground"
                          >
                            •{" "}
                            {
                              error
                            }
                          </p>
                        ),
                      )}

                  </div>

                </div>
              )}

              {/* NOTES SUMMARY */}

              <div className="rounded-lg border p-4">

                <div className="flex items-center justify-between">

                  <p className="text-xs font-medium text-muted-foreground">
                    Notes
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      goToStep(3)
                    }
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Edit
                  </button>

                </div>

                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {notes.trim() ||
                    "No notes added."}
                </p>

              </div>

              {/* PRICING NOTICE */}

              <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                No amount is calculated
                on this page. The Decision
                Provider is responsible for
                tariff resolution and
                assessment calculation.
              </div>

              {/* SUBMISSION FEEDBACK */}

              {submissionError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs font-medium text-destructive">
                    {
                      submissionError
                    }
                  </p>
                </div>
              )}

              {submissionResult && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">

                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {
                      submissionResult.message
                    }
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Reference:{" "}
                    {
                      submissionResult.assessmentNumber
                    }
                  </p>

                </div>
              )}

              {/* ACTIONS */}

              <div className="space-y-2 pt-1">

                <Button
                  type="button"
                  className="w-full"
                  disabled={
                    !canSubmit ||
                    isSaving !==
                      null ||
                    revenueServicesLoading ||
                    taxpayerLoading
                  }
                  onClick={
                    handleSubmit
                  }
                >
                  <Send className="mr-2 h-4 w-4" />

                  {isSaving ===
                  "submit"
                    ? isEdit
                      ? "Updating..."
                      : "Submitting..."
                    : submitLabel}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={
                    !selectedTaxpayer ||
                    selectedServices.length ===
                      0 ||
                    isSaving !==
                      null ||
                    taxpayerError ||
                    revenueServicesError
                  }
                  onClick={
                    handleSaveDraft
                  }
                >
                  <Save className="mr-2 h-4 w-4" />

                  {isSaving ===
                  "draft"
                    ? "Saving..."
                    : draftLabel}
                </Button>

              </div>

            </div>
          )}

        </div>

        {/* =================================================
            STEP NAVIGATION
        ================================================= */}

        <div className="flex items-center justify-between border-t p-5 sm:p-6">

          <Button
            type="button"
            variant="ghost"
            disabled={
              currentStep ===
                0 ||
              isSaving !==
                null
            }
            onClick={
              currentStep === 0
                ? onBack
                : goBack
            }
          >
            <ChevronLeft className="mr-1 h-4 w-4" />

            {currentStep ===
            0
              ? "Cancel"
              : "Back"}
          </Button>

          {!isLastStep && (
            <Button
              type="button"
              disabled={
                !isStepComplete(
                  currentStep,
                ) ||
                isSaving !==
                  null
              }
              onClick={
                goNext
              }
            >
              Next

              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}

        </div>

      </div>
    </div>
  );
}