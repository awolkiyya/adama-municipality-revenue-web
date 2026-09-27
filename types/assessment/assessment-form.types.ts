import type { Citizen } from "@/types/citizen";
import type {
  RevenueService,
  SubmissionResult,
} from "@/types/revenue/assessment";

// =====================================================
// FORM VALUE TYPES
// =====================================================


export type StepKey =
  | "taxpayer-services"
  | "details"
  | "notes"
  | "review";

export type FieldValue = unknown;

export type ServiceFieldValues = Record<
  string,
  Record<string, FieldValue>
>;

export type AssessmentMode = "create" | "edit";

// =====================================================
// INITIAL ASSESSMENT
// =====================================================

/**
 * Existing assessment data accepted by the form.
 *
 * The API can return slightly different naming conventions,
 * therefore normalization is handled separately in
 * assessment-form.helpers.ts.
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

// =====================================================
// FORM PROPS
// =====================================================

export type AssessmentFormProps = {
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
