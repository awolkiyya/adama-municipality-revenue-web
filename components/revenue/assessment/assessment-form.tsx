"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileEdit,
  FileText,
  Info,
  Lock,
  Save,
  Send,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import type {
  RevenueField,
  RevenueService,
  SubmissionResult,
} from "@/types/revenue/assessment";

import { TaxpayerSelector } from "./taxpayer-selector";
import { RevenueServiceSelector } from "./revenue-service-selector";
import { RevenueServiceFields } from "./revenue-service-fields";

import type { Citizen } from "@/types/citizen";

// =====================================================
// TYPES
// =====================================================

type FieldValue = unknown;

type ServiceFieldValues = Record<string, Record<string, FieldValue>>;

type AssessmentMode = "create" | "edit";

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

  /**
   * Optional. The TaxpayerSelector now searches the server itself, so this
   * list is only used to resolve the initial taxpayer in edit mode.
   */
  taxpayers?: Citizen[];
  revenueServices: RevenueService[];

  taxpayerLoading?: boolean;
  taxpayerError?: boolean;

  revenueServicesLoading?: boolean;
  revenueServicesError?: boolean;

  onRetryRevenueServices?: () => void;

  onSubmit?: (formData: FormData) => Promise<SubmissionResult>;
  onSaveDraft?: (formData: FormData) => Promise<SubmissionResult>;

  onBack?: () => void;
};

/**
 * Minimal taxpayer data the form needs. Kept in state because the selector's
 * paginated results do not always contain the chosen citizen.
 */
type TaxpayerSummary = {
  id: string;
  fullName: string;
  nationalId: string;
};

type StepStatus = "complete" | "current" | "upcoming" | "locked";

// =====================================================
// STEP CONFIG
// =====================================================

const STEPS = [
  {
    key: "taxpayer-services",
    title: "Taxpayer & Services",
    shortTitle: "Taxpayer & Services",
    icon: User,
  },
  {
    key: "details",
    title: "Service Details",
    shortTitle: "Details",
    icon: FileEdit,
  },
  {
    key: "notes",
    title: "Notes",
    shortTitle: "Notes",
    icon: FileText,
  },
  {
    key: "review",
    title: "Review & Submit",
    shortTitle: "Review",
    icon: ClipboardCheck,
  },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

// =====================================================
// STEP HELP
// =====================================================

const STEP_HELP: Record<
  StepKey,
  {
    heading: string;
    body: string;
    tips: string[];
  }
> = {
  "taxpayer-services": {
    heading: "Who is this assessment for?",
    body: "Start by picking the taxpayer this assessment belongs to, then choose every revenue service that applies to them. You can select more than one service.",
    tips: [
      "Search by name or national ID to find a taxpayer faster.",
      "Only select services that genuinely apply — you'll fill in details for each one next.",
      "You can add or remove services later without losing taxpayer info.",
    ],
  },

  details: {
    heading: "Fill in the required information",
    body: "Each selected service has its own set of fields. Required fields are marked and tracked in the progress bar below — the form won't let you submit until they're complete.",
    tips: [
      "Uploaded files stay attached even if you jump between services.",
      "Number fields are checked against any configured min/max limits.",
      "In edit mode, previously uploaded files are kept unless you replace them.",
    ],
  },

  notes: {
    heading: "Add supporting context",
    body: "Notes are optional but helpful — use them for site visit observations, measurements, or anything an approver should know.",
    tips: [
      "This field is free text and isn't used in any calculation.",
      "You can leave this blank and add notes later.",
    ],
  },

  review: {
    heading: "Double-check before you send it",
    body: "This is a summary of everything entered so far. Nothing here is calculated — tariff and amount resolution happens on the backend after submission.",
    tips: [
      'Use the "Edit" links to jump straight back to any section.',
      "Saving as a draft keeps your progress without submitting for approval.",
    ],
  },
};

// =====================================================
// HELPERS
// =====================================================

const isEmptyValue = (value: unknown): boolean => {
  return (
    value === undefined || value === null || String(value).trim() === ""
  );
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value)
  );
};

const getStringValue = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") {
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

  return getStringValue(assessment.citizenId ?? assessment.taxpayer?.id ?? "");
};

// =====================================================
// TAXPAYER SUMMARY
// =====================================================

const toTaxpayerSummary = (citizen: Citizen): TaxpayerSummary => ({
  id: String(citizen.id),
  fullName: citizen.full_name ?? "",
  nationalId: citizen.national_id ?? "",
});

/**
 * Resolves the taxpayer for edit mode, in order:
 * 1. the optional `taxpayers` list,
 * 2. the taxpayer embedded in the assessment payload,
 * 3. a bare ID placeholder so the form can still be submitted.
 */
const getInitialTaxpayerSummary = (
  assessment: InitialAssessment | null | undefined,
  taxpayers: Citizen[],
): TaxpayerSummary | null => {
  const id = getInitialTaxpayerId(assessment);

  if (!id) {
    return null;
  }

  const match = taxpayers.find((taxpayer) => String(taxpayer.id) === id);

  if (match) {
    return toTaxpayerSummary(match);
  }

  const embedded = assessment?.taxpayer;

  return {
    id,
    fullName: embedded?.fullName?.trim() || `Taxpayer #${id}`,
    nationalId: embedded?.nationalId ?? "",
  };
};

// =====================================================
// INITIAL SERVICE ID
// =====================================================

const getInitialServiceId = (service: unknown): string => {
  if (!isRecord(service)) {
    return "";
  }

  return getStringValue(
    service.serviceId ?? service.service_id ?? service.id ?? "",
  );
};

// =====================================================
// INITIAL SERVICE FIELD VALUES
// =====================================================

/**
 * Reads an existing service's values from the API.
 *
 * The final form state uses RevenueField.id as the key. API payloads can
 * use fieldId, field_id, fieldCode, field_code or code; those are mapped
 * to the matching field.id when the RevenueService definition is available.
 */
const getInitialServiceFields = (
  service: unknown,
  revenueServices: RevenueService[],
): Record<string, FieldValue> => {
  if (!isRecord(service)) {
    return {};
  }

  const serviceId = getInitialServiceId(service);

  const revenueService = revenueServices.find((item) => item.id === serviceId);

  const fields = revenueService?.fields ?? [];

  // API assessment format

  if (Array.isArray(service.values)) {
    const result: Record<string, FieldValue> = {};

    for (const item of service.values) {
      if (!isRecord(item)) {
        continue;
      }

      const fieldId = getStringValue(item.fieldId ?? item.field_id ?? "").trim();

      const fieldCode = getStringValue(
        item.fieldCode ?? item.field_code ?? item.code ?? "",
      ).trim();

      // Prefer field.id when the API already gives us the ID.
      if (fieldId) {
        result[fieldId] = item.value ?? null;
        continue;
      }

      // Otherwise resolve the field code against the service definition.
      if (fieldCode) {
        const matchingField = fields.find(
          (field) => field.key === fieldCode || field.id === fieldCode,
        );

        if (matchingField) {
          result[matchingField.id] = item.value ?? null;
        }
      }
    }

    return result;
  }

  // Legacy / other formats

  const candidates = [
    service.fields,
    service.fieldValues,
    service.field_values,
    service.data,
  ];

  for (const candidate of candidates) {
    if (!isRecord(candidate)) {
      continue;
    }

    const result: Record<string, FieldValue> = {};

    for (const [rawKey, value] of Object.entries(candidate)) {
      const byId = fields.find((field) => field.id === rawKey);

      if (byId) {
        result[byId.id] = value;
        continue;
      }

      const byKey = fields.find((field) => field.key === rawKey);

      if (byKey) {
        result[byKey.id] = value;
        continue;
      }

      // Preserve unknown values rather than silently deleting them.
      result[rawKey] = value;
    }

    return result;
  }

  return {};
};

// =====================================================
// INITIAL SERVICE VALUES
// =====================================================

const buildInitialServiceFieldValues = (
  assessment: InitialAssessment | null | undefined,
  revenueServices: RevenueService[],
): ServiceFieldValues => {
  if (!assessment) {
    return {};
  }

  const directValues =
    assessment.serviceFieldValues ?? assessment.service_field_values;

  if (isRecord(directValues)) {
    const normalized: ServiceFieldValues = {};

    for (const [serviceId, values] of Object.entries(directValues)) {
      if (!isRecord(values)) {
        continue;
      }

      const service = revenueServices.find((item) => item.id === serviceId);

      const fields = service?.fields ?? [];

      const normalizedFields: Record<string, FieldValue> = {};

      for (const [rawKey, value] of Object.entries(values)) {
        // Preferred: field.id.
        const byId = fields.find((field) => field.id === rawKey);

        if (byId) {
          normalizedFields[byId.id] = value;
          continue;
        }

        // Legacy fallback: field.key.
        const byKey = fields.find((field) => field.key === rawKey);

        if (byKey) {
          normalizedFields[byKey.id] = value;
          continue;
        }

        // Preserve unknown keys.
        normalizedFields[rawKey] = value;
      }

      normalized[serviceId] = normalizedFields;
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

    result[serviceId] = getInitialServiceFields(service, revenueServices);
  }

  return result;
};

// =====================================================
// INITIAL SELECTED SERVICE IDS
// =====================================================

const buildInitialServiceIds = (
  assessment?: InitialAssessment | null,
): string[] => {
  if (!assessment || !Array.isArray(assessment.services)) {
    return [];
  }

  return assessment.services
    .map(getInitialServiceId)
    .filter((id): id is string => id.length > 0);
};

// =====================================================
// EXISTING FILE HELPERS
// =====================================================

const isExistingFileValue = (value: unknown): boolean => {
  if (value instanceof File) {
    return true;
  }

  if (typeof value === "string" && value.trim() !== "") {
    return true;
  }

  if (isRecord(value)) {
    return Boolean(
      value.id ?? value.url ?? value.file_url ?? value.path ?? value.file_path,
    );
  }

  return false;
};

const hasExistingFiles = (value: unknown): boolean => {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.some(isExistingFileValue);
};

// =====================================================
// FIELD OPTIONS & SELECT VALIDATION
// =====================================================

const getFieldOptions = (field: RevenueField) => {
  return [...(field.options ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
};

const isValidSelectValue = (field: RevenueField, value: unknown): boolean => {
  if (isEmptyValue(value)) {
    return false;
  }

  const validValues = getFieldOptions(field).map((option) =>
    String(option.value),
  );

  return validValues.includes(String(value));
};

// =====================================================
// INITIALIZATION KEY
// =====================================================

/**
 * Re-mounts the form when its initial assessment data or the field ID/key
 * mapping changes. This replaces state-sync effects and ensures edit-mode
 * values are initialized against the latest RevenueService definitions.
 */
const getAssessmentFormKey = (
  mode: AssessmentMode,
  assessment: InitialAssessment | null,
  revenueServices: RevenueService[],
): string => {
  const serviceFieldDefinitions = revenueServices.map((service) => ({
    id: service.id,
    fields: service.fields.map((field) => ({
      id: field.id,
      key: field.key,
    })),
  }));

  return (
    JSON.stringify([mode, assessment, serviceFieldDefinitions]) ??
    "assessment-form"
  );
};

// =====================================================
// PUBLIC COMPONENT
// =====================================================

export function AssessmentForm(props: AssessmentFormProps) {
  const {
    mode = "create",
    initialAssessment = null,
    revenueServices,
  } = props;

  const formKey = getAssessmentFormKey(mode, initialAssessment, revenueServices);

  return (
    <AssessmentFormContent
      key={formKey}
      {...props}
      mode={mode}
      initialAssessment={initialAssessment}
    />
  );
}

// =====================================================
// FORM CONTENT
// =====================================================

function AssessmentFormContent({
  mode = "create",
  initialAssessment = null,

  taxpayers = [],
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
  // ---------------------------------------------------
  // STATE
  // ---------------------------------------------------

  const [taxpayerId, setTaxpayerId] = useState(() =>
    getInitialTaxpayerId(initialAssessment),
  );

  const [taxpayerSummary, setTaxpayerSummary] =
    useState<TaxpayerSummary | null>(() =>
      getInitialTaxpayerSummary(initialAssessment, taxpayers),
    );

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(() =>
    buildInitialServiceIds(initialAssessment),
  );

  const [serviceFieldValues, setServiceFieldValues] =
    useState<ServiceFieldValues>(() =>
      buildInitialServiceFieldValues(initialAssessment, revenueServices),
    );

  const [notes, setNotes] = useState(() => initialAssessment?.notes ?? "");

  const [isSaving, setIsSaving] = useState<"draft" | "submit" | null>(null);

  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);

  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // ---------------------------------------------------
  // STEP STATE
  // ---------------------------------------------------

  const [currentStep, setCurrentStep] = useState(0);

  const [furthestStep, setFurthestStep] = useState(() =>
    mode === "edit" && initialAssessment ? STEPS.length - 1 : 0,
  );

  // ---------------------------------------------------
  // SELECTED TAXPAYER
  //
  // Held in state (not looked up in a list) because the selector paginates
  // on the server, so the chosen citizen is often not in any loaded page.
  // ---------------------------------------------------

  const selectedTaxpayer =
    taxpayerSummary && taxpayerSummary.id === taxpayerId
      ? taxpayerSummary
      : null;

  // ---------------------------------------------------
  // SELECTED SERVICES
  // ---------------------------------------------------

  const selectedServices = useMemo(
    () =>
      revenueServices.filter((service) =>
        selectedServiceIds.includes(service.id),
      ),
    [revenueServices, selectedServiceIds],
  );

  const getServiceValues = (serviceId: string): Record<string, FieldValue> =>
    serviceFieldValues[serviceId] ?? {};

  const clearFeedback = () => {
    setSubmissionResult(null);
    setSubmissionError(null);
  };

  // ---------------------------------------------------
  // FIELD CHANGE (fieldId = RevenueField.id, NOT field.key)
  // ---------------------------------------------------

  const setServiceFieldValue = (
    serviceId: string,
    fieldId: string,
    value: FieldValue,
  ) => {
    setServiceFieldValues((previous) => ({
      ...previous,
      [serviceId]: {
        ...(previous[serviceId] ?? {}),
        [fieldId]: value,
      },
    }));

    clearFeedback();
  };

  // ---------------------------------------------------
  // TAXPAYER CHANGE
  // ---------------------------------------------------

  const handleTaxpayerChange = (id: string) => {
    setTaxpayerId(id);

    if (!id) {
      setTaxpayerSummary(null);
    }

    clearFeedback();
  };

  const handleTaxpayerSelected = (citizen: Citizen | null) => {
    setTaxpayerSummary(citizen ? toTaxpayerSummary(citizen) : null);
  };

  // ---------------------------------------------------
  // SERVICE SELECTION
  // ---------------------------------------------------

  const handleServiceSelectionChange = (serviceIds: string[]) => {
    setSelectedServiceIds(serviceIds);

    setServiceFieldValues((previous) => {
      const next: ServiceFieldValues = {};

      for (const serviceId of serviceIds) {
        if (previous[serviceId]) {
          next[serviceId] = previous[serviceId];
        }
      }

      return next;
    });

    clearFeedback();
  };

  const removeService = (serviceId: string) => {
    setSelectedServiceIds((previous) =>
      previous.filter((id) => id !== serviceId),
    );

    setServiceFieldValues((previous) => {
      const next = { ...previous };

      delete next[serviceId];

      return next;
    });

    clearFeedback();
  };

  const handleClearServices = () => {
    setSelectedServiceIds([]);
    setServiceFieldValues({});
    clearFeedback();
  };

  // ---------------------------------------------------
  // VALIDATION (field.id is the canonical state key)
  // ---------------------------------------------------

  const validationErrors = useMemo(() => {
    const errors: Record<string, Record<string, string>> = {};

    for (const service of selectedServices) {
      const values = serviceFieldValues[service.id] ?? {};

      const serviceErrors: Record<string, string> = {};

      for (const field of service.fields) {
        if (!field.required) {
          continue;
        }

        const value = values[field.id];

        // FILE

        if (field.type === "FILE") {
          if (mode === "edit" && isExistingFileValue(value)) {
            continue;
          }

          if (!(value instanceof File)) {
            serviceErrors[field.id] = `${field.label} is required.`;
          }

          continue;
        }

        // MULTI FILE

        if (field.type === "MULTI_FILE") {
          if (mode === "edit" && hasExistingFiles(value)) {
            continue;
          }

          if (!Array.isArray(value) || value.length === 0) {
            serviceErrors[field.id] = `${field.label} is required.`;
          }

          continue;
        }

        // CHECKBOX

        if (field.type === "CHECKBOX") {
          if (value !== true) {
            serviceErrors[field.id] =
              `Please confirm ${field.label.toLowerCase()}.`;
          }

          continue;
        }

        // SELECT

        if (field.type === "SELECT") {
          if (isEmptyValue(value)) {
            serviceErrors[field.id] = `${field.label} is required.`;

            continue;
          }

          const options = getFieldOptions(field);

          if (options.length === 0) {
            serviceErrors[field.id] =
              `${field.label} has no active options configured.`;

            continue;
          }

          if (!isValidSelectValue(field, value)) {
            serviceErrors[field.id] =
              `${field.label} has an invalid selection.`;
          }

          continue;
        }

        // NORMAL REQUIRED FIELD

        if (isEmptyValue(value)) {
          serviceErrors[field.id] = `${field.label} is required.`;

          continue;
        }

        // NUMBER / DECIMAL

        if (field.type === "NUMBER" || field.type === "DECIMAL") {
          const numeric = Number(value);

          if (Number.isNaN(numeric)) {
            serviceErrors[field.id] =
              `${field.label} must be a valid number.`;

            continue;
          }

          if (field.min !== undefined && numeric < Number(field.min)) {
            serviceErrors[field.id] =
              `${field.label} cannot be less than ${field.min}.`;
          }

          if (field.max !== undefined && numeric > Number(field.max)) {
            serviceErrors[field.id] =
              `${field.label} cannot exceed ${field.max}.`;
          }
        }
      }

      if (Object.keys(serviceErrors).length > 0) {
        errors[service.id] = serviceErrors;
      }
    }

    return errors;
  }, [selectedServices, serviceFieldValues, mode]);

  // ---------------------------------------------------
  // REQUIRED FIELD PROGRESS
  // ---------------------------------------------------

  const totalRequiredFields = useMemo(
    () =>
      selectedServices.reduce(
        (total, service) =>
          total + service.fields.filter((field) => field.required).length,
        0,
      ),
    [selectedServices],
  );

  const isFieldComplete = (
    service: RevenueService,
    field: RevenueField,
  ): boolean => {
    const value = getServiceValues(service.id)[field.id];

    if (field.type === "FILE") {
      return (
        value instanceof File || (mode === "edit" && isExistingFileValue(value))
      );
    }

    if (field.type === "MULTI_FILE") {
      return (
        (Array.isArray(value) && value.length > 0) ||
        (mode === "edit" && hasExistingFiles(value))
      );
    }

    if (field.type === "CHECKBOX") {
      return value === true;
    }

    if (field.type === "SELECT") {
      return isValidSelectValue(field, value);
    }

    return !isEmptyValue(value);
  };

  const completedRequiredFields = useMemo(() => {
    let completed = 0;

    for (const service of selectedServices) {
      for (const field of service.fields) {
        if (field.required && isFieldComplete(service, field)) {
          completed++;
        }
      }
    }

    return completed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServices, serviceFieldValues, mode]);

  // ---------------------------------------------------
  // SUBMIT STATE
  // ---------------------------------------------------

  const canSubmit = Boolean(
    selectedTaxpayer &&
      selectedServices.length > 0 &&
      !taxpayerError &&
      !revenueServicesError &&
      Object.keys(validationErrors).length === 0,
  );

  // ---------------------------------------------------
  // STEP VALIDITY & NAVIGATION
  // ---------------------------------------------------

  const isStepComplete = (stepIndex: number): boolean => {
    const key = STEPS[stepIndex]?.key;

    switch (key as StepKey) {
      case "taxpayer-services":
        return (
          Boolean(selectedTaxpayer) &&
          !taxpayerError &&
          selectedServices.length > 0 &&
          !revenueServicesError
        );

      case "details":
        return (
          selectedServices.length > 0 &&
          Object.keys(validationErrors).length === 0
        );

      case "notes":
        return true;

      case "review":
        return canSubmit;

      default:
        return true;
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= STEPS.length) {
      return;
    }

    if (stepIndex <= furthestStep) {
      setCurrentStep(stepIndex);
    }
  };

  const goNext = () => {
    if (!isStepComplete(currentStep)) {
      return;
    }

    const next = Math.min(currentStep + 1, STEPS.length - 1);

    setCurrentStep(next);

    setFurthestStep((previous) => Math.max(previous, next));
  };

  const goBack = () => {
    setCurrentStep((previous) => Math.max(0, previous - 1));
  };

  const isLastStep = currentStep === STEPS.length - 1;

  // ---------------------------------------------------
  // FILE CHANGE / REMOVE (field.id is the state key)
  // ---------------------------------------------------

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    serviceId: string,
    field: RevenueField,
  ) => {
    const files = event.target.files;

    if (!files) {
      return;
    }

    if (field.type === "MULTI_FILE") {
      setServiceFieldValue(serviceId, field.id, Array.from(files));
    } else {
      setServiceFieldValue(serviceId, field.id, files[0] ?? undefined);
    }
  };

  const removeFile = (serviceId: string, field: RevenueField) => {
    setServiceFieldValue(serviceId, field.id, undefined);
  };

  // ---------------------------------------------------
  // BUILD FORM DATA (field metadata uses field.id)
  // ---------------------------------------------------

  const buildFormData = (status: "DRAFT" | "PENDING_APPROVAL"): FormData => {
    const formData = new FormData();

    if (mode === "edit" && initialAssessment?.id) {
      formData.append("assessmentId", initialAssessment.id);
    }

    formData.append("mode", mode);
    formData.append("taxpayerId", taxpayerId);
    formData.append("notes", notes.trim());
    formData.append("status", status);

    const servicesMeta = selectedServices.map((service) => {
      const values = getServiceValues(service.id);

      const fieldsMeta: Record<string, unknown> = {};

      for (const field of service.fields) {
        const value = values[field.id];

        // SINGLE FILE

        if (field.type === "FILE") {
          if (value instanceof File) {
            const partKey = `file__${service.id}__${field.id}`;

            formData.append(partKey, value);

            fieldsMeta[field.id] = { __file: partKey };
          } else if (mode === "edit" && isExistingFileValue(value)) {
            fieldsMeta[field.id] = { __existingFile: value };
          } else {
            fieldsMeta[field.id] = null;
          }

          continue;
        }

        // MULTIPLE FILES

        if (field.type === "MULTI_FILE") {
          if (Array.isArray(value)) {
            const newFileKeys: string[] = [];
            const existingFiles: unknown[] = [];

            value.forEach((file, index) => {
              if (file instanceof File) {
                const partKey = `file__${service.id}__${field.id}__${index}`;

                formData.append(partKey, file);
                newFileKeys.push(partKey);

                return;
              }

              if (mode === "edit" && isExistingFileValue(file)) {
                existingFiles.push(file);
              }
            });

            fieldsMeta[field.id] = {
              __files: newFileKeys,
              __existingFiles: existingFiles,
            };
          } else {
            fieldsMeta[field.id] = null;
          }

          continue;
        }

        // NORMAL FIELD

        fieldsMeta[field.id] = value ?? null;
      }

      return {
        serviceId: service.id,
        serviceCode: service.code,
        fields: fieldsMeta,
      };
    });

    formData.append("services", JSON.stringify(servicesMeta));

    return formData;
  };

  // ---------------------------------------------------
  // SAVE DRAFT / SUBMIT
  // ---------------------------------------------------

  const handleSaveDraft = async () => {
    if (!selectedTaxpayer || selectedServices.length === 0) {
      return;
    }

    setIsSaving("draft");
    clearFeedback();

    try {
      const formData = buildFormData("DRAFT");

      if (!onSaveDraft) {
        throw new Error("Draft submission handler is not configured.");
      }

      const result = await onSaveDraft(formData);

      setSubmissionResult(result);
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : "Could not save the draft.",
      );
    } finally {
      setIsSaving(null);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setIsSaving("submit");
    clearFeedback();

    try {
      const formData = buildFormData("PENDING_APPROVAL");

      if (!onSubmit) {
        throw new Error("Assessment submission handler is not configured.");
      }

      const result = await onSubmit(formData);

      setSubmissionResult(result);
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

  // ---------------------------------------------------
  // UI LABELS & PROGRESS
  // ---------------------------------------------------

  const isEdit = mode === "edit";

  const submitLabel = isEdit ? "Update & Submit" : "Submit for Approval";

  const draftLabel = isEdit ? "Save Changes" : "Save as Draft";

  const activeStepConfig = STEPS[currentStep];

  const activeHelp = STEP_HELP[activeStepConfig.key];

  const progressPercent = Math.round(((currentStep + 1) / STEPS.length) * 100);

  const detailsProgressPercent =
    totalRequiredFields > 0
      ? Math.round((completedRequiredFields / totalRequiredFields) * 100)
      : 100;

  const getStepStatus = (stepIndex: number): StepStatus => {
    if (stepIndex === currentStep) {
      return "current";
    }

    if (stepIndex > furthestStep) {
      return "locked";
    }

    if (stepIndex < currentStep && isStepComplete(stepIndex)) {
      return "complete";
    }

    return "upcoming";
  };

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------

  return (
    /*
     * minmax(0,1fr) is essential: a plain `1fr` track has an implicit
     * minimum of its content's min-content width, so one long name would
     * widen the whole column and defeat every truncate/min-w-0 below it.
     */
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* SIDEBAR */}

      <aside className="min-w-0 lg:sticky lg:top-5 lg:h-fit">
        <div className="min-w-0 space-y-6 rounded-sm border bg-card p-5">
          {/* STEPPER */}

          <ol className="space-y-1">
            {STEPS.map((step, index) => {
              const status = getStepStatus(index);
              const StepIcon = step.icon;
              const isClickable = status !== "locked";
              const isLastItem = index === STEPS.length - 1;

              const taxpayerLine =
                step.key === "taxpayer-services"
                  ? `${selectedTaxpayer ? selectedTaxpayer.fullName : "No taxpayer yet"}${
                      selectedServices.length > 0
                        ? ` · ${selectedServices.length} service${
                            selectedServices.length === 1 ? "" : "s"
                          }`
                        : ""
                    }`
                  : null;

              return (
                <li key={step.key} className="relative">
                  <button
                    type="button"
                    disabled={!isClickable}
                    onClick={() => goToStep(index)}
                    className={`flex w-full min-w-0 items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors ${
                      status === "current"
                        ? "bg-primary/10"
                        : isClickable
                          ? "hover:bg-muted/60"
                          : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                        status === "complete"
                          ? "border-primary bg-primary text-primary-foreground"
                          : status === "current"
                            ? "border-primary text-primary"
                            : "border-muted-foreground/30 text-muted-foreground"
                      }`}
                    >
                      {status === "complete" ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : status === "locked" ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <StepIcon className="h-3.5 w-3.5" />
                      )}
                    </span>

                    {/* min-w-0 lets long taxpayer names truncate */}
                    <span className="min-w-0 flex-1 pt-0.5">
                      <span
                        className={`block truncate text-sm font-medium ${
                          status === "locked"
                            ? "text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {step.shortTitle}
                      </span>

                      {taxpayerLine && (
                        <span
                          title={taxpayerLine}
                          className="mt-0.5 block truncate text-xs text-muted-foreground"
                        >
                          {taxpayerLine}
                        </span>
                      )}

                      {step.key === "details" && totalRequiredFields > 0 && (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {completedRequiredFields}/{totalRequiredFields}{" "}
                          required fields
                        </span>
                      )}
                    </span>
                  </button>

                  {!isLastItem && (
                    <span
                      className={`ml-[1.6rem] block h-3 w-px ${
                        status === "complete"
                          ? "bg-primary"
                          : "bg-muted-foreground/20"
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>

          {/* OVERALL PROGRESS */}

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall progress</span>
              <span>{progressPercent}%</span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* HELP */}

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

              <div className="min-w-0 space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  {activeHelp.heading}
                </p>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  {activeHelp.body}
                </p>

                <ul className="space-y-1.5 pt-1">
                  {activeHelp.tips.map((tip, index) => (
                    <li
                      key={index}
                      className="flex gap-1.5 text-xs leading-relaxed text-muted-foreground"
                    >
                      <span className="text-primary">•</span>
                      <span className="min-w-0">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <div className="min-w-0 rounded-sm border bg-card shadow-none">
        <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {activeStepConfig.title}
            </p>

            <p className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </p>
          </div>
        </div>

        <div className="min-w-0 space-y-8 p-5 sm:p-6">
          {/* STEP 1 — TAXPAYER & SERVICES */}

          {activeStepConfig.key === "taxpayer-services" && (
            <div className="flex min-w-0 flex-col gap-8">
              {/* TAXPAYER */}

              <div className="min-w-0 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    1
                  </span>

                  <p className="text-sm font-medium">Select taxpayer</p>
                </div>

                {/*
                 * The selectors draw their own card. Inside this card that
                 * would be a card within a card, so their root <section> is
                 * flattened here. Remove the wrapper classes to restore it.
                 */}
                <div className="min-w-0 [&>section]:rounded-none [&>section]:border-0 [&>section]:bg-transparent [&>section]:p-0">
                  <TaxpayerSelector
                    value={taxpayerId}
                    onChange={handleTaxpayerChange}
                    onSelectCitizen={handleTaxpayerSelected}
                    disabled={isSaving !== null}
                  />
                </div>

                {taxpayerLoading && (
                  <p className="text-xs text-muted-foreground">
                    Loading taxpayers...
                  </p>
                )}

                {taxpayerError && (
                  <p className="text-xs text-destructive">
                    Failed to load taxpayers.
                  </p>
                )}
              </div>

              {/* SERVICES */}

              <div className="min-w-0 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    2
                  </span>

                  <p className="text-sm font-medium">Choose revenue services</p>
                </div>

                {revenueServicesError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-destructive">
                        Failed to load revenue services.
                      </p>

                      {onRetryRevenueServices && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={onRetryRevenueServices}
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="min-w-0 [&>section]:rounded-none [&>section]:border-0 [&>section]:bg-transparent [&>section]:p-0">
                  <RevenueServiceSelector
                    services={revenueServices}
                    selectedServiceIds={selectedServiceIds}
                    onChange={handleServiceSelectionChange}
                    onRemoveService={removeService}
                    onClearServices={handleClearServices}
                    disabled={isSaving !== null}
                  />
                </div>

                {revenueServicesLoading && (
                  <p className="text-xs text-muted-foreground">
                    Loading revenue services...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2 — DETAILS */}

          {activeStepConfig.key === "details" && (
            <div className="min-w-0 space-y-6">
              {selectedServices.length > 0 && totalRequiredFields > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Required fields completed</span>

                    <span>
                      {completedRequiredFields}/{totalRequiredFields}
                    </span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${detailsProgressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {selectedServices.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No revenue services selected yet.
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => goToStep(0)}
                  >
                    Go select services
                  </Button>
                </div>
              ) : (
                selectedServices.map((service, index) => {
                  const serviceValues = serviceFieldValues[service.id] ?? {};

                  const serviceErrors = validationErrors[service.id] ?? {};

                  return (
                    <RevenueServiceFields
                      key={service.id}
                      service={service}
                      index={index}
                      values={serviceValues}
                      errors={serviceErrors}
                      disabled={isSaving !== null}
                      onChange={(fieldId, value) => {
                        setServiceFieldValue(service.id, fieldId, value);
                      }}
                      onFileChange={(event, field) => {
                        handleFileChange(event, service.id, field);
                      }}
                      onRemoveFile={(field) => {
                        removeFile(service.id, field);
                      }}
                      onRemove={() => {
                        removeService(service.id);
                      }}
                    />
                  );
                })
              )}
            </div>
          )}

          {/* STEP 3 — NOTES */}

          {activeStepConfig.key === "notes" && (
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-lg bg-primary/10 p-2">
                <FileText className="h-4 w-4 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <Textarea
                  placeholder="Add site visit notes, measurements, references, or other supporting information..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="min-h-[160px] resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 4 — REVIEW */}

          {activeStepConfig.key === "review" && (
            <div className="min-w-0 space-y-5">
              {/* TAXPAYER */}

              <div className="min-w-0 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Taxpayer
                  </p>

                  <button
                    type="button"
                    onClick={() => goToStep(0)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Edit
                  </button>
                </div>

                {taxpayerError ? (
                  <p className="mt-1 text-sm text-destructive">
                    Failed to load taxpayers.
                  </p>
                ) : (
                  <>
                    <p
                      title={selectedTaxpayer?.fullName}
                      className="mt-1 truncate text-sm font-semibold"
                    >
                      {selectedTaxpayer?.fullName ?? "Not selected"}
                    </p>

                    {selectedTaxpayer && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        National ID {selectedTaxpayer.nationalId || "—"}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* SERVICES */}

              <div className="min-w-0 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Revenue services ({selectedServices.length})
                  </p>

                  <button
                    type="button"
                    onClick={() => goToStep(0)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Edit
                  </button>
                </div>

                {selectedServices.length === 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    None selected
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {selectedServices.map((service) => (
                      <div
                        key={service.id}
                        className="min-w-0 overflow-hidden rounded-md bg-muted/50 p-2.5"
                      >
                        <p
                          title={service.name}
                          className="truncate text-sm font-medium"
                        >
                          {service.name}
                        </p>

                        <p
                          title={`${service.code} · ${service.category}`}
                          className="mt-0.5 truncate text-xs text-muted-foreground"
                        >
                          {service.code} · {service.category}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* DETAILS */}

              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Service details
                  </p>

                  <button
                    type="button"
                    onClick={() => goToStep(1)}
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
                    {completedRequiredFields} / {totalRequiredFields}
                  </p>
                </div>

                {totalRequiredFields > 0 &&
                  completedRequiredFields < totalRequiredFields && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      Some required information is still missing.
                    </p>
                  )}
              </div>

              {/* VALIDATION */}

              {Object.keys(validationErrors).length > 0 && (
                <div className="min-w-0 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                      Missing or invalid information
                    </p>

                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Fix
                    </button>
                  </div>

                  <div className="mt-1.5 space-y-1">
                    {Object.values(validationErrors)
                      .flatMap((errors) => Object.values(errors))
                      .slice(0, 5)
                      .map((error, index) => (
                        <p
                          key={index}
                          className="text-xs text-muted-foreground [overflow-wrap:anywhere]"
                        >
                          • {error}
                        </p>
                      ))}
                  </div>
                </div>
              )}

              {/* NOTES */}

              <div className="min-w-0 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Notes
                  </p>

                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Edit
                  </button>
                </div>

                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground [overflow-wrap:anywhere]">
                  {notes.trim() || "No notes added."}
                </p>
              </div>

              {/* PRICING NOTICE */}

              <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                No amount is calculated on this page. The Decision Provider is
                responsible for tariff resolution and assessment calculation.
              </div>

              {/* SUBMISSION ERROR */}

              {submissionError && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                >
                  <p className="text-xs font-medium text-destructive [overflow-wrap:anywhere]">
                    {submissionError}
                  </p>
                </div>
              )}

              {/* SUBMISSION RESULT */}

              {submissionResult && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {submissionResult.message}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Reference: {submissionResult.assessmentNumber}
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
                    isSaving !== null ||
                    revenueServicesLoading ||
                    taxpayerLoading
                  }
                  onClick={handleSubmit}
                >
                  <Send className="mr-2 h-4 w-4" />

                  {isSaving === "submit"
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
                    selectedServices.length === 0 ||
                    isSaving !== null ||
                    taxpayerError ||
                    revenueServicesError
                  }
                  onClick={handleSaveDraft}
                >
                  <Save className="mr-2 h-4 w-4" />

                  {isSaving === "draft" ? "Saving..." : draftLabel}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* STEP NAVIGATION */}

        <div className="flex items-center justify-between border-t p-5 sm:p-6">
          <Button
            type="button"
            variant="ghost"
            disabled={isSaving !== null || (currentStep === 0 && !onBack)}
            onClick={currentStep === 0 ? onBack : goBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />

            {currentStep === 0 ? "Cancel" : "Back"}
          </Button>

          {!isLastStep && (
            <Button
              type="button"
              disabled={!isStepComplete(currentStep) || isSaving !== null}
              onClick={goNext}
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