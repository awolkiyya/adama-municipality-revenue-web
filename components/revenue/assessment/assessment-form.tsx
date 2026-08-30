// components/revenue/assessment/assessment-form.tsx

"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FileText,
  Save,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

type AssessmentMode =
  | "create"
  | "edit";

/**
 * Existing assessment data accepted by the form.
 *
 * The API can return slightly different naming conventions,
 * therefore the mapper below supports the common variants.
 */
export type InitialAssessment = {
  id?: string;

  taxpayerId?: string | number | null;
  taxpayer_id?: string | number | null;

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
    assessment.taxpayerId ??
      assessment.taxpayer_id ??
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
 * Extract service code from different possible API shapes.
 */
const getInitialServiceCode = (
  service: unknown,
): string => {
  if (!isRecord(service)) {
    return "";
  }

  return getStringValue(
    service.serviceCode ??
      service.service_code ??
      service.code ??
      "",
  );
};

/**
 * Extract dynamic field values from an existing service.
 *
 * Supports:
 *
 * {
 *   fields: {
 *     land_size: 100,
 *     property_type: "COMMERCIAL"
 *   }
 *
 * or
 *
 * {
 *   fieldValues: {...}
 * }
 *
 * or
 *
 * {
 *   field_values: {...}
 * }
 */
const getInitialServiceFields = (
  service: unknown,
): Record<string, FieldValue> => {
  if (!isRecord(service)) {
    return {};
  }

  const candidates = [
    service.fields,
    service.fieldValues,
    service.field_values,
    service.values,
    service.data,
  ];

  for (
    const candidate of candidates
  ) {
    if (isRecord(candidate)) {
      return candidate;
    }
  }

  return {};
};

/**
 * Normalize initial services into:
 *
 * {
 *   serviceId: {
 *      fieldKey: value
 *   }
 * }
 */
const buildInitialServiceFieldValues = (
  assessment?: InitialAssessment | null,
): ServiceFieldValues => {
  if (!assessment) {
    return {};
  }

  /**
   * If the API already gives the exact structure,
   * use it directly.
   */
  const directValues =
    assessment.serviceFieldValues ??
    assessment.service_field_values;

  if (isRecord(directValues)) {
    const normalized: ServiceFieldValues =
      {};

    for (const [
      serviceId,
      values,
    ] of Object.entries(
      directValues,
    )) {
      if (isRecord(values)) {
        normalized[serviceId] = values;
      }
    }

    return normalized;
  }

  /**
   * Otherwise derive it from services.
   */
  if (
    !Array.isArray(
      assessment.services,
    )
  ) {
    return {};
  }

  const result: ServiceFieldValues =
    {};

  for (const service of assessment.services) {
    const serviceId =
      getInitialServiceId(
        service,
      );

    if (!serviceId) {
      continue;
    }

    result[serviceId] =
      getInitialServiceFields(
        service,
      );
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
    !Array.isArray(
      assessment.services,
    )
  ) {
    return [];
  }

  return assessment.services
    .map(
      getInitialServiceId,
    )
    .filter(
      (
        id,
      ): id is string =>
        id.length > 0,
    );
};

/**
 * Determine whether an existing file value represents
 * an already uploaded file.
 *
 * Existing API values can be:
 *
 * "storage/path/file.pdf"
 *
 * {
 *   id: "...",
 *   url: "..."
 * }
 *
 * {
 *   file_url: "..."
 * }
 */
const isExistingFileValue = (
  value: unknown,
): boolean => {
  if (
    value instanceof File
  ) {
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
 * Existing MULTI_FILE values may be:
 *
 * [
 *   "file-1.pdf",
 *   "file-2.pdf"
 * ]
 *
 * or
 *
 * [
 *   { id: "...", url: "..." }
 * ]
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
  // SYNCHRONIZE EDIT DATA
  //
  // Important when the assessment is loaded
  // asynchronously after the component mounts.
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

          // =========================================
          // FILE
          // =========================================

          if (
            field.type === "FILE"
          ) {
            /**
             * In edit mode an existing uploaded
             * file is considered complete.
             */
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

          // =========================================
          // MULTI FILE
          // =========================================

          if (
            field.type ===
            "MULTI_FILE"
          ) {
            /**
             * Existing files satisfy the requirement
             * during edit mode.
             */
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

          // =========================================
          // CHECKBOX
          // =========================================

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

          // =========================================
          // NORMAL VALUE
          // =========================================

          if (
            isEmptyValue(value)
          ) {
            serviceErrors[
              field.key
            ] =
              `${field.label} is required.`;

            continue;
          }

          // =========================================
          // NUMBER / DECIMAL
          // =========================================

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

    // FILE
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

    // MULTI FILE
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

    // CHECKBOX
    if (
      field.type ===
      "CHECKBOX"
    ) {
      return value === true;
    }

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
  // The backend remains authoritative for:
  //
  // - tariff resolution
  // - calculation
  // - assessment amount
  // ===================================================

  const buildFormData = (
    status:
      | "DRAFT"
      | "PENDING_APPROVAL",
  ): FormData => {
    const formData =
      new FormData();

    // ================================================
    // ASSESSMENT ID
    // ================================================

    if (
      mode === "edit" &&
      initialAssessment?.id
    ) {
      formData.append(
        "assessmentId",
        initialAssessment.id,
      );
    }

    // ================================================
    // MODE
    // ================================================

    formData.append(
      "mode",
      mode,
    );

    // ================================================
    // TAXPAYER
    // ================================================

    formData.append(
      "taxpayerId",
      taxpayerId,
    );

    // ================================================
    // NOTES
    // ================================================

    formData.append(
      "notes",
      notes.trim(),
    );

    // ================================================
    // STATUS
    // ================================================

    formData.append(
      "status",
      status,
    );

    // ================================================
    // SERVICES
    // ================================================

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

            // ========================================
            // SINGLE FILE
            // ========================================

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
                /**
                 * Preserve the existing file reference.
                 * The backend can keep the existing file
                 * when no replacement is uploaded.
                 */
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

            // ========================================
            // MULTIPLE FILES
            // ========================================

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
                    // New file
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

                    // Existing file
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

            // ========================================
            // NORMAL FIELD
            // ========================================

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

  const pageTitle = isEdit
    ? "Edit Assessment"
    : "Assessment Summary";

  const pageDescription =
    isEdit
      ? "Review and update taxpayer and revenue-service information."
      : "Review before submitting.";

  const submitLabel = isEdit
    ? "Update & Submit"
    : "Submit for Approval";

  const draftLabel = isEdit
    ? "Save Changes"
    : "Save as Draft";

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="grid gap-6 lg:grid-cols-3">

      {/* =================================================
          MAIN FORM
      ================================================= */}

      <div className="space-y-6 lg:col-span-2">

        {/* TAXPAYER */}

        <TaxpayerSelector
          value={taxpayerId}
          onChange={
            handleTaxpayerChange
          }
          taxpayers={taxpayers}
        />

        {/* =================================================
            REVENUE SERVICES
        ================================================= */}

        <div className="space-y-3">

          {revenueServicesError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-center justify-between gap-3">

                <p className="text-xs text-destructive">
                  Failed to load revenue
                  services.
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
              Loading revenue services...
            </p>
          )}

        </div>

        {/* =================================================
            SERVICE FIELDS
        ================================================= */}

        {selectedServices.map(
          (
            service,
            index,
          ) => (
            <RevenueServiceFields
              key={service.id}
              service={service}
              index={index}
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
        )}

        {/* =================================================
            NOTES
        ================================================= */}

        <div className="rounded-xl border bg-card shadow-sm">

          <div className="flex items-center gap-3 border-b p-5 sm:p-6">

            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="h-4 w-4 text-primary" />
            </div>

            <div>
              <h2 className="text-base font-semibold">
                Assessment Notes
              </h2>

              <p className="text-sm text-muted-foreground">
                Add supporting information
                for the reviewing officer.
              </p>
            </div>

          </div>

          <div className="p-5 sm:p-6">

            <Textarea
              placeholder="Add site visit notes, measurements, references, or other supporting information..."
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value,
                )
              }
              className="min-h-[120px] resize-none"
            />

          </div>
        </div>
      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="lg:col-span-1">

        <div className="sticky top-6 rounded-xl border bg-card shadow-sm">

          {/* HEADER */}

          <div className="flex items-center justify-between p-5">

            <div>
              <h3 className="text-sm font-semibold">
                {pageTitle}
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                {pageDescription}
              </p>
            </div>

            <Badge variant="secondary">
              {isEdit
                ? "Edit"
                : "Draft"}
            </Badge>

          </div>

          <Separator />

          <div className="space-y-5 p-5">

            {/* =================================================
                TAXPAYER
            ================================================= */}

            <div>

              <p className="text-xs text-muted-foreground">
                Taxpayer
              </p>

              {taxpayerLoading ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Loading taxpayers...
                </p>
              ) : taxpayerError ? (
                <p className="mt-1 text-sm text-destructive">
                  Failed to load taxpayers.
                </p>
              ) : (
                <>
                  <p className="mt-1 truncate text-sm font-semibold">
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

            {/* =================================================
                SERVICES
            ================================================= */}

            <div>

              <div className="mb-2 flex items-center justify-between">

                <p className="text-xs text-muted-foreground">
                  Revenue services
                </p>

                <span className="text-xs font-medium">
                  {
                    selectedServices.length
                  }
                </span>

              </div>

              {selectedServices.length ===
              0 ? (
                <p className="text-sm font-medium">
                  None selected
                </p>
              ) : (
                <div className="space-y-2">

                  {selectedServices.map(
                    (
                      service,
                    ) => (
                      <div
                        key={
                          service.id
                        }
                        className="rounded-lg border p-3"
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

                        {service.collectionMode && (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Collection:{" "}
                            {
                              service.collectionMode
                            }
                          </p>
                        )}

                      </div>
                    ),
                  )}

                </div>
              )}

            </div>

            {/* =================================================
                REQUIRED FIELDS
            ================================================= */}

            {selectedServices.length >
              0 && (
              <div>

                <div className="mb-2 flex items-center justify-between">

                  <p className="text-xs text-muted-foreground">
                    Required information
                  </p>

                  <span className="text-xs font-medium">
                    {
                      completedRequiredFields
                    }
                    /
                    {
                      totalRequiredFields
                    }
                  </span>

                </div>

                <div className="h-2 overflow-hidden rounded-full bg-muted">

                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${
                        totalRequiredFields ===
                        0
                          ? 100
                          : Math.min(
                              100,
                              (completedRequiredFields /
                                totalRequiredFields) *
                                100,
                            )
                      }%`,
                    }}
                  />

                </div>

              </div>
            )}

            <Separator />

            {/* =================================================
                PRICING NOTICE
            ================================================= */}

            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              No amount is calculated on this page.
              The Decision Provider is responsible
              for tariff resolution and assessment
              calculation.
            </div>

            {/* =================================================
                VALIDATION
            ================================================= */}

            {!canSubmit && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">

                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  Complete the required
                  information before
                  submitting.
                </p>

                {selectedServices.length ===
                  0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    • Select at least one
                    revenue service.
                  </p>
                )}

                {!selectedTaxpayer && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    • Select a taxpayer.
                  </p>
                )}

                {taxpayerError && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    • Taxpayer data could
                    not be loaded.
                  </p>
                )}

                {revenueServicesError && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    • Revenue service data
                    could not be loaded.
                  </p>
                )}

                {Object.entries(
                  validationErrors,
                )
                  .flatMap(
                    ([
                      serviceId,
                      errors,
                    ]) =>
                      Object.values(
                        errors,
                      ).map(
                        (
                          error,
                        ) => ({
                          serviceId,
                          error,
                        }),
                      ),
                  )
                  .slice(0, 3)
                  .map(
                    (
                      item,
                      index,
                    ) => (
                      <p
                        key={`${item.serviceId}-${index}`}
                        className="mt-1 text-xs text-muted-foreground"
                      >
                        •{" "}
                        {
                          item.error
                        }
                      </p>
                    ),
                  )}

              </div>
            )}

            {/* =================================================
                ERROR
            ================================================= */}

            {submissionError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">

                <p className="text-xs font-medium text-destructive">
                  {
                    submissionError
                  }
                </p>

              </div>
            )}

            {/* =================================================
                SUCCESS
            ================================================= */}

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

            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="space-y-2">

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
                  ? isEdit
                    ? "Saving..."
                    : "Saving..."
                  : draftLabel}
              </Button>

              {onBack && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={
                    isSaving !==
                    null
                  }
                  onClick={
                    onBack
                  }
                >
                  Cancel
                </Button>
              )}

            </div>

            {/* =================================================
                FOOTER NOTICE
            ================================================= */}

            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              Raw assessment data is submitted
              to the backend. The Decision
              Provider resolves the applicable
              tariff and produces the
              authoritative assessment result.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}